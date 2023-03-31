/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

import React, { Component } from "react";
import getWeb3 from "../getWeb3";
import { Redirect, BrowserRouter as Router, Route, Switch} from 'react-router-dom';

// React-Bootstrap imports
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

// Smart Contract imports
import PrescriptionsContract from './../../contracts/Prescriptions.json';
import UserContract from './../../contracts/User.json';

// Component imports
import LandingPhysician from './landingPhysician';
import Login from './../login';



class NewPrescription extends Component {
  state = {web3: null, prescriptionsContract: null, userContract: null, account: null, formData: {}, missingInput: false, sendingError: false, sendingComplete: false};

  constructor(props){
    super(props)
    this.handleChange = this.handleChange.bind(this);
  }

  componentDidMount = async () => {

    // Reads out the selected account from the user in MetaMask and stores it in the react state
    const ethereum = await window.ethereum;
    // const public_key = ethereum.selectedAddress
    // this.setState({account: public_key})

    // If user changes his account, then the verification to access the page is checked and afterwards the new account is stored in the react state
    ethereum.on('accountsChanged', (public_key) => {
      this.setState({account: public_key[0]})
      if(this.state.initialize === true){
        this.checkVerification();
      }
    });

    // Establishing the connection to the blockchain and the smart contracts.
    try {
      const web3 = await getWeb3();
      const accounts = await web3.eth.getAccounts();
      const account = accounts[0]
      const networkId = await web3.eth.net.getId();
      const PrescriptionContractNetwork = PrescriptionsContract.networks[networkId];
      const UserContractNetwork = UserContract.networks[networkId];

      const PrescriptionsContractInstance = new web3.eth.Contract(
        PrescriptionsContract.abi,
        PrescriptionContractNetwork && PrescriptionContractNetwork.address,
      );

      const UserContractInstance = new web3.eth.Contract(
        UserContract.abi,
        UserContractNetwork && UserContractNetwork.address,
      );

      this.setState({ web3: web3, account: account, userContract: UserContractInstance, initialize: true, prescriptionsContract: PrescriptionsContractInstance });
      this.checkVerification();
    } catch (error) {
        alert(`Failed to load web3, accounts, or contract. Check console for details.`);
        console.error(error);
    }
  };

  // Checks if the user, that is logged in in MetaMask, is a verified physician.
  checkVerification = async () => {
    const { userContract } = this.state;
    const verfied = await userContract.methods.checkVerification('physician', this.state.account).call({from: this.state.account, gas: 1000000})
    this.setState({userVerfied: verfied})
  } 

  handleChange(event){
    // Reading out the value and the id of the triggered input
    const event_id = event.target.id
    const event_value = event.target.value

    // Setting the value into the user object of the state
    const { formData } = this.state;
    formData[event_id] = event_value
    this.setState({formData: formData})
  }

  // If all inputs are filled in, then a new prescription is created.
  newPrescription = async () => {
    this.setState({missingInput: false, sendingError: false})
    const { formData, prescriptionsContract } = this.state;

    const physician = this.state.account;
    const insured = formData.public_key_patient;
    const pharmacist = formData.public_key_patient;
    const pharmacistEqualsInsured = true;
    const status = "";
    const medicine_name = formData.medicine_name;
    const medicine_amount = formData.medicine_amount;
    
    if(physician !== ""
      && physician !== undefined
      && insured !== ""
      && insured !== undefined
      && medicine_name !== ""
      && medicine_name !== undefined
      && medicine_amount !== ""
      && medicine_amount !== undefined
    ){
      try {
        console.log("physician id: " + physician)
        await prescriptionsContract.methods.newPrescription({physician, insured, pharmacist, pharmacistEqualsInsured, status, medicine_name, medicine_amount}).send({ from: physician, gas: 1000000 });
        console.log("prescription created");
        this.setState({sendingComplete: true})
      } catch {
        this.setState({sendingError: true})
      }
    } else {
      this.setState({missingInput: true})
    }
  }

  render() {
    // If user is not allowed to access the page he is redirected to the login page. Otherwise the page is rendered.
    if(this.state.userVerfied === false){
      return (
        <>
          <Router forceRefresh={true}>
            <Redirect push to='/login'/>
            <Switch>
                <Route path="/login">
                    <Login/>
                </Route>
            </Switch>
          </Router>
        </>
      )
    } else {
      // If sending the prescription is completed, the user is redirected to the landing page of the physician
      if(this.state.sendingComplete){
        return (
          <>
            <Router forceRefresh={true}>
              <Redirect push to='/physician'/>
              <Switch>
                  <Route path="/physician">
                      <LandingPhysician/>
                  </Route>
              </Switch>
            </Router>
          </>
        )
      } else {
        return (
          <>
            <Navbar sticky="top" bg="dark" variant="dark" expand="lg">
              <Navbar.Brand href="/physician">E-recipe</Navbar.Brand>
              <Navbar.Toggle aria-controls="basic-navbar-nav" />
              <Navbar.Collapse id="basic-navbar-nav">
                  <Nav className="mr-auto">
                      <Nav.Link active>New recipe</Nav.Link>
                  </Nav>
                  <Button href="/" variant="outline-danger">main menu</Button>
              </Navbar.Collapse>
            </Navbar>
    
            <Container fluid className="mt-5">
                <Row> 
                  <Col sm={2}></Col>

                  <Col>
                    <Form>
                      <Form.Group controlId="public_key_patient">
                        <Form.Control type="text" placeholder="Public Key des Versicherten" value={this.state.value} onChange={this.handleChange}></Form.Control>
                      </Form.Group>
    
                      <div className="pb-3 pt-4">
                          Recipe:
                      </div>
    
                      <Form.Group controlId="medicine_name">
                        <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Name des Medikaments"></Form.Control>
                      </Form.Group>
    
                      <Form.Group controlId="medicine_amount">
                        <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Menge des Medikaments"></Form.Control>
                      </Form.Group>
                    </Form>

                    <Button variant="success" block onClick={this.newPrescription}>Neues Rezept erstellen</Button>
    
                    <Alert show={this.state.sendingError} variant="danger" className="mt-3">
                        Fehler bei der Übertragung. Bitte überprüfen Sie Ihre Angaben!
                    </Alert>

                    <Alert show={this.state.missingInput} variant="danger" className="mt-3">
                        Bitte füllen Sie alle Felder aus!
                    </Alert>
                  </Col>

                  <Col sm={2}></Col>
                </Row>
            </Container>
          </>
        );
      }
    }
  }
}

export default NewPrescription;
