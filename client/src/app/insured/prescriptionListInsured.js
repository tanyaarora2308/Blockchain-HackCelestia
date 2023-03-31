/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

import React, { Component } from "react";
import getWeb3 from "../getWeb3";
import {
  Redirect,
  BrowserRouter as Router,
  Route,
  Switch,
} from "react-router-dom";

// React-Bootstrap imports
import Card from "react-bootstrap/Card";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Col from "react-bootstrap/Col";
import Row from "react-bootstrap/Row";
import Alert from "react-bootstrap/Alert";

// Smart Contract imports
import PrescriptionsContract from "../../contracts/Prescriptions.json";
import UserContract from "../../contracts/User.json";

// Components imports
import LandingInsured from "../insured/landingInsured";

class PrescriptionListInsured extends Component {
  state = {
    web3: null,
    prescriptionsContract: null,
    userContract: null,
    account: null,
    formData: {},
    prescriptions: [],
    prescriptionIds: [],
    sendPrescription: null,
  };

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount = async () => {
    // Reads out the selected account from the user in MetaMask and stores it in the react state
    const ethereum = await window.ethereum;
    // const public_key = ethereum.selectedAddress;
    // this.setState({account: public_key});

    // If user changes his account, then the verification to access the page is checked and afterwards the new account is stored in the react state
    ethereum.on("accountsChanged", (public_key) => {
      console.log(public_key);
      this.setState({ account: public_key[0] });
      console.log(this.state.account);
    });

    // Establishing the connection to the blockchain and the smart contracts
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0];
      const networkId = await web3.eth.net.getId();
      const PrescriptionContractNetwork =
        PrescriptionsContract.networks[networkId];
      const UserContractNetwork = UserContract.networks[networkId];

      const PrescriptionsContractInstance = new web3.eth.Contract(
        PrescriptionsContract.abi,
        PrescriptionContractNetwork && PrescriptionContractNetwork.address
      );

      const UserContractInstance = new web3.eth.Contract(
        UserContract.abi,
        UserContractNetwork && UserContractNetwork.address
      );

      this.setState({
        web3: web3,
        account: account,
        prescriptionsContract: PrescriptionsContractInstance,
        userContract: UserContractInstance,
      });
    } catch (error) {
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`
      );
      console.error(error);
    }

    await this.getPrescriptions();
  };

  handleChange(event) {
    // Reading out the value and the id of the triggered input
    const event_id = event.target.id;
    const event_value = event.target.value;

    // Setting the value into the user object of the state
    const { formData } = this.state;
    formData[event_id] = event_value;
    this.setState({ formData: formData });
  }

  // Returns all prescriptions that were filled for the patient.
  getPrescriptions = async () => {
    var prescriptionsArray = [];
    const { account, prescriptionsContract } = this.state;
    const prescriptionIds_ = await prescriptionsContract.methods
      .getInsuredPrescriptionsIDs(account)
      .call({ from: account, gas: 1000000 });

    for (var i = 0; i < prescriptionIds_.length; i++) {
      var prescription = await prescriptionsContract.methods
        .getPrescription(prescriptionIds_[i])
        .call({ from: account, gas: 1000000 });
      prescription.physician_name = await this.getPhysicianName(
        prescription.physician
      );
      prescription.pharmacist_name = await this.getPharmacistName(
        prescription.pharmacist
      );
      prescriptionsArray.push(prescription);
    }

    this.setState({
      prescriptions: prescriptionsArray,
      prescriptionIds: prescriptionIds_,
    });
  };

  getPhysicianName = async (public_key_physician) => {
    const { account, userContract } = this.state;
    const physician = await userContract.methods
      .getPhysician(public_key_physician)
      .call({ from: account, gas: 1000000 });
    const physician_name = physician.surname + " " + physician.name;
    return physician_name;
  };

  getPharmacistName = async (public_key_pharmacist) => {
    const { account, userContract } = this.state;
    const pharmacist = await userContract.methods
      .getPharmacist(public_key_pharmacist)
      .call({ from: account, gas: 1000000 });
    const pharmacist_name = pharmacist.name;
    return pharmacist_name;
  };

  // Sends the prescription to the pharmacist, whichs address was entered by the user
  sendPrescription = async (event) => {
    const { formData, account, prescriptionsContract } = this.state;
    const prescription_id_ = event.target.id;
    const pharmacist = formData["public_key_pharmacist_" + prescription_id_];

    try {
      await prescriptionsContract.methods
        .transferPrescriptionToPharmacist(prescription_id_, pharmacist)
        .send({ from: account, gas: 1000000 });
      this.setState({ sendPrescription: true });
    } catch {
      this.setState({ sendPrescription: false });
    }
  };

  render() {
    if (this.state.sendPrescription === true) {
      return (
        <>
          <Router forceRefresh={true}>
            <Redirect push to="/insured" />
            <Switch>
              <Route path="/insured">
                <LandingInsured />
              </Route>
            </Switch>
          </Router>
        </>
      );
    } else {
      // If the insured has no prescription in his list, then a message is shown. Otherwise the prescriptions are shown.
      if (this.state.prescriptions.length === 0) {
        return <p>Current no recipe was prescribed for you!</p>;
      } else {
        var items = [];
        var counter = 0;

        for (var prescription of this.state.prescriptions) {
          var prescription_id = this.state.prescriptionIds[counter];

          var formId = "public_key_pharmacist_" + prescription_id;
          console.log(prescription);

          if (prescription.status === "Patient") {
            items.push(
              <Card className="mt-5" border="danger" key={formId}>
                <Card.Header as="h6">
                  <b>Status:</b> Not yet redeemed
                </Card.Header>
                <Card.Body>
                  <Card.Title as="h3">{prescription.medicine_name}</Card.Title>
                  <Card.Text className="mt-4">
                    <b>Dose:</b> {prescription.medicine_amount}
                    <br />
                    <b>Issued by:</b> {prescription.physician_name}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <Row>
                    <Col sm={6} lg={9}>
                      <Form>
                        <Form.Group className="mb-0" controlId={formId}>
                          <Form.Control
                            type="text"
                            placeholder="Public Key der Apotheke"
                            value={this.state.value}
                            onChange={this.handleChange}
                          ></Form.Control>
                        </Form.Group>
                      </Form>
                    </Col>
                    <Col sm={6} lg={3}>
                      <Button
                        block
                        id={prescription_id}
                        onClick={this.sendPrescription}
                        variant="dark"
                      >
                        From you
                      </Button>
                    </Col>
                  </Row>
                </Card.Footer>
              </Card>
            );
          } else if (prescription.status === "Pharmacist") {
            items.push(
              <Card className="mt-5" border="warning" key={formId}>
                <Card.Header as="h6">
                  <b>Status:</b> In the pharmacy
                </Card.Header>
                <Card.Body>
                  <Card.Title as="h3">{prescription.medicine_name}</Card.Title>
                  <Card.Text className="mt-4">
                    <b>Dose:</b> {prescription.medicine_amount}
                    <br />
                    <b>Issued by:</b> {prescription.physician_name}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <b>Sent to:</b> {prescription.pharmacist_name}
                </Card.Footer>
              </Card>
            );
          } else if (prescription.status === "Redeemed") {
            items.push(
              <Card className="mt-5" border="success" key={formId}>
                <Card.Header as="h6">
                  <b>Status:</b> Redeemed
                </Card.Header>
                <Card.Body>
                  <Card.Title as="h3">{prescription.medicine_name}</Card.Title>
                  <Card.Text className="mt-4">
                    <b>Dose:</b> {prescription.medicine_amount}
                    <br />
                    <b>Issued by:</b> {prescription.physician_name}
                  </Card.Text>
                </Card.Body>
                <Card.Footer>
                  <b>Sent to:</b> {prescription.pharmacist_name}
                </Card.Footer>
              </Card>
            );
          }

          counter = counter + 1;
        }

        return (
          <>
            <Alert
              show={this.state.sendPrescription === false}
              variant="danger"
              className="mt-3"
            >
              Transmission error! Please check your entries and try it again!
            </Alert>
            {items}
          </>
        );
      }
    }
  }
}
export default PrescriptionListInsured;
