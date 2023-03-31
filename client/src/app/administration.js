/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

import React, { Component } from "react";
import getWeb3 from "./getWeb3";
import { Redirect, BrowserRouter as Router, Route, Switch} from 'react-router-dom';

// React-Bootstrap imports
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';

// Smart Contract imports
import UserContract from "./../contracts/User.json";
import PrescriptionsContract from "./../contracts/Prescriptions.json";

// Component imports
import Login from './login';



class Administration extends Component {
    state = {formData: {}, web3: null, accounts: null, account: null, userContract: null, prescriptions_contract: null, userVerfied: null, initialize: false, transactionComplete: null}

    constructor(props){
        super(props)
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount = async () => {

        // Reads out the selected account from the user in MetaMask and stores it in the react state
        const ethereum = await window.ethereum;
        // const public_key = ethereum.selectedAddress;
        // this.setState({account: public_key});

        // If user changes his account, then the verification to access the page is checked and afterwards the new account is stored in the react state
        ethereum.on('accountsChanged', (public_key) => {
            this.setState({account: public_key[0]});
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
            const UserContractNetwork = UserContract.networks[networkId];
            const PrescriptionsContractNetwork = PrescriptionsContract.networks[networkId];

            const UserContractInstance = new web3.eth.Contract(
                UserContract.abi,
                UserContractNetwork && UserContractNetwork.address,
            );

            const PrescriptionsContractInstance = new web3.eth.Contract(
                PrescriptionsContract.abi,
                PrescriptionsContractNetwork && PrescriptionsContractNetwork.address,
            );

            this.setState({ web3, accounts, account: account, userContract: UserContractInstance, prescriptions_contract: PrescriptionsContractInstance, initialize: true});
            this.checkVerification();
        } catch (error) {
            alert(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
    };

    // Function which connects the Smart Contract Prescription with the Smart Contract User. 
    connectSmartContractUser = async () => {
        const { formData, accounts, prescriptions_contract } = this.state;
        console.log(this.state)
        const smart_contract_key = formData.user_smart_contract;
        await prescriptions_contract.methods.establishConnectionToUserSmartContract(smart_contract_key).send({ from: accounts[0], gas: 1000000 });
        this.setState({transactionComplete: true});
    }

    // Checks if the user, that is logged in in MetaMask, is the verifying institution.
    checkVerification = async () => {
        console.log('checkVerification')
        const { userContract } = this.state;
        const verfied = await userContract.methods.checkVerification('verifying_institution', this.state.account).call({from: this.state.standardAccount, gas: 1000000})
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

    // Returns the data of the insured who is belonging to the address that was entered
    getInsured = async () => {
        const { formData, accounts, userContract } = this.state;
        const insured_address_ = formData.insured_address;
        const returnedValue = await userContract.methods.getInsured(insured_address_).call({ from: accounts[0], gas: 1000000 });
        console.log(returnedValue);
    }

    // Sets the verification in the struct Insured in the Smart Contract User to true, so that the insured is able to access the application
    verifyInsured = async () => {
        const { formData, accounts, userContract } = this.state;
        const insured_address_ = formData.insured_address;
        await userContract.methods.verifyInsured(insured_address_).send({ from: accounts[0], gas: 1000000 });
        this.setState({transactionComplete: true});
    }

    // Returns the data of the physician who is belonging to the address that was entered
    getPhysician = async () => {
        const { formData, accounts, userContract } = this.state;
        const physician_address_ = formData.physician_address;
        const returnedValue = await userContract.methods.getPhysician(physician_address_).call({ from: accounts[0], gas: 1000000 });
        console.log(returnedValue);
    }
    
    // Sets the verification in the struct Physisican in the Smart Contract User to true, so that the physician is able to access the application
    verifyPhysician = async () => {
        const { formData, accounts, userContract } = this.state;
        const physician_address_ = formData.physician_address;
        await userContract.methods.verifyPhysician(physician_address_).send({ from: accounts[0], gas: 1000000 });
        this.setState({transactionComplete: true});
    }

    // Returns the data of the pharmacist who is belonging to the address that was entered
    getPharmacist = async () => {
        const { formData, accounts, userContract } = this.state;
        const pharmacist_address_ = formData.pharmacist_address;
        const returnedValue = await userContract.methods.getPhysician(pharmacist_address_).call({ from: accounts[0], gas: 1000000 });
        console.log(returnedValue);
    }
    
    // Sets the verification in the struct Pharmacist in the Smart Contract User to true, so that the pharmacist is able to access the application
    verifyPharmacist = async () => {
        const { formData, accounts, userContract } = this.state;
        const pharmacist_address_ = formData.pharmacist_address;
        await userContract.methods.verifyPharmacist(pharmacist_address_).send({ from: accounts[0], gas: 1000000 });
        this.setState({transactionComplete: true});
    }

    render() {
        // If user is not allowed to access the page he is redirected to the login page. Otherwise the page is rendered.
        if(this.state.userVerfied === false){
            return(
                <div>
                    <Router forceRefresh={true}>
                        <Redirect push to='/login'/>
                        <Switch>
                            <Route path="/login">
                                <Login/>
                            </Route>
                        </Switch>
                    </Router>
                </div>
            )
        } else {
            if(this.state.transactionComplete === true){
                return(
                    <div>
                        <Router forceRefresh={true}>
                            <Redirect push to='/admin'/>
                            <Switch>
                                <Route path="/admin">
                                    <Administration/>
                                </Route>
                            </Switch>
                        </Router>
                    </div>
                )
            } else {
                return (
                    <>
                        <Navbar sticky="top" bg="dark" variant="dark" expand="lg">
                            <Navbar.Brand href="/login">E-Rezept</Navbar.Brand>
                            <Navbar.Toggle aria-controls="basic-navbar-nav" />
                            <Navbar.Collapse id="basic-navbar-nav">
                                <Nav className="mr-auto"></Nav>
                                <Button href="/" variant="outline-danger">main menu</Button>
                            </Navbar.Collapse>
                        </Navbar>
    
                        <Container fluid className="mt-5">
                            <Row className="mb-5"> 
                                <Col xs={0} sm={0} md={1} lg={2}></Col>
    
                                <Col>
                                    <div className="pb-3 pt-4">
                                        Verifizierung des Versicherten:
                                    </div>
    
                                    <Form>
                                        <Form.Group controlId="insured_address">
                                            <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Public Key des Versicherten"></Form.Control>
                                        </Form.Group>
                                    </Form>
    
                                    <Button variant="success" block onClick={this.verifyInsured}>To verify</Button>                                
                                </Col>
    
                                <Col>
                                    <div className="pb-3 pt-4">
                                        Verification of the doctor:
                                    </div>
    
                                    <Form>
                                        <Form.Group controlId="physician_address">
                                            <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Public Key des Arztes"></Form.Control>
                                        </Form.Group>
                                    </Form>
    
                                    <Button variant="success" block onClick={this.verifyPhysician}>Verifizieren</Button>
                                </Col>
    
                                <Col>
                                    <div className="pb-3 pt-4">
                                        Verification of the pharmacy:
                                    </div>
    
                                    <Form>
                                        <Form.Group controlId="pharmacist_address">
                                            <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Public Key der Apotheke"></Form.Control>
                                        </Form.Group>
                                    </Form>
    
                                    <Button variant="success" block onClick={this.verifyPharmacist}>Verifizieren</Button>
                                </Col>
    
                                <Col xs={0} sm={0} md={1} lg={2}></Col>
                            </Row>
    
                            <Row>
                                <Col xs={0} sm={0} md={1} lg={2}></Col>
                                <Col>
                                    <div className="pb-3 pt-4">
                                        Verbindungvon Smart Contract Prescription und Smart Contract User:
                                    </div>
    
                                    <Form>
                                        <Form.Group controlId="user_smart_contract">
                                            <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Addresse des Smart Contracts User"></Form.Control>
                                        </Form.Group>
                                    </Form>
    
                                    <Button variant="primary" block onClick={this.connectSmartContractUser}>Verbinden</Button>
                                </Col>
    
                                <Col xs={0} sm={0} md={1} lg={2}></Col>
                            </Row>
                        </Container>
                    </>
                );
            }
        }
      }
}
export default Administration;