/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

import React, { Component } from "react";
import getWeb3 from "../getWeb3";
import { Redirect, BrowserRouter as Router, Route, Switch} from 'react-router-dom';

// React-Bootstrap imports
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Navbar from 'react-bootstrap/Navbar';
import Alert from 'react-bootstrap/Alert';

// Smart Contract imports
import UserContract from "../../contracts/User.json";

// Component imports 
import Login from './../login'


class RegisterInsured extends Component {
    state = {web3: null, userContract: null, account: null, formData: {} , missingInput: false, registration_accepted: false, userExistance: null, initialize: false}

    constructor(props){
        super(props)
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount = async () => {

        // Reads out the selected account from the user in MetaMask and stores it in the react state
        const ethereum = await window.ethereum;
        // console.log(ethereum)
        // console.log(ethereum.selectedAddress)
        // const public_key = ethereum.selectedAddress;
        // this.setState({account: public_key});

        // If user changes his account, then the verification to access the page is checked and afterwards the new account is stored in the react state
        ethereum.on('accountsChanged', (public_key) => {
            this.setState({account: public_key[0]});
            if(this.state.initialize === true){
                this.checkExistence();
            }
        });

        // Establishing the connection to the blockchain and the smart contracts
        try {
            const web3 = await getWeb3();
            const accounts = await web3.eth.getAccounts();
            const account = accounts[0]
            const networkId = await web3.eth.net.getId();
            const UserContractNetwork = UserContract.networks[networkId];

            const UserContractInstance = new web3.eth.Contract(
                UserContract.abi,
                UserContractNetwork && UserContractNetwork.address,
            );

            this.setState({ web3: web3, account: account, userContract: UserContractInstance, initialize: true });
            console.log(this.state.standardAccount)
            console.log(this.state.account)
            this.checkExistence();
        } catch (error) {
            alert(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
    };

    // Checks if the user, that is logged in in MetaMask, is already registered as any role.
    checkExistence = async () => {
        const { userContract } = this.state;
        const existence_insured = await userContract.methods.checkExistence('insured', this.state.account).call({from: this.state.account, gas: 1000000})
        const existence_physician = await userContract.methods.checkExistence('physician', this.state.account).call({from: this.state.account, gas: 1000000})
        const existence_pharmacist = await userContract.methods.checkExistence('pharmacist', this.state.account).call({from: this.state.account, gas: 1000000})
        const existence_verifying_inst = await userContract.methods.checkExistence('verifying_institution', this.state.account).call({from: this.state.account, gas: 1000000})

        if(existence_insured === true || existence_physician === true || existence_pharmacist === true || existence_verifying_inst === true){
            this.setState({userExistance: true})
        } else {
            this.setState({userExistance: false})
        }
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

    // If all inputs are filled, a new insured is added with the Smart Contract User
    addNewUser = async () => {
        this.setState({missingInput: false})
        const { userContract, formData } = this.state;

        const surname = formData.insured_surname
        const name = formData.insured_name
        const street = formData.insured_street
        const street_number = formData.insured_street_number
        const post_code = parseInt(formData.insured_post_code)
        const city = formData.insured_city
        const birth_date = formData.insured_birth_date

        const insurance = formData.insurance 
        const insurance_number = formData.insurance_number
        const insured_number = formData.insured_number
        const insured_status = formData.insured_status

        if(surname !== "" 
            && surname !== undefined 
            && name !== "" 
            && name !== undefined 
            && street !== ""
            && street !== undefined
            && street_number !== "" 
            && street_number !== undefined 
            && post_code !== "" 
            && post_code !== undefined 
            && city !== ""
            && city !== undefined
            && birth_date !== ""
            && birth_date !== undefined 
            && insurance !== ""
            && insurance !== undefined
            && insurance_number !== ""
            && insurance_number !== undefined 
            && insured_number !== ""
            && insured_number !== undefined
            && insured_status !== ""
            && insured_status !== undefined
        ){
            await userContract.methods.addNewInsured({surname, name, street, street_number, post_code, city, birth_date, insurance, insurance_number, insured_number, insured_status}).send({ from: this.state.account, gas: 1000000 });
            this.setState({registration_accepted: true})
        } else {
            this.setState({missingInput: true})
        }
    };

    render() {
        // If user is already existing or the registration is done, then the user is redirected to the login. Otherwise the page is rendered.
        if(this.state.userExistance === true || this.state.registration_accepted === true){
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
            return (
                <>
                    <Navbar sticky="top" bg="dark" variant="dark" expand="lg">
                            <Navbar.Brand>E-Rezept</Navbar.Brand>
                    </Navbar>
                    <Container fluid className="mt-5">
                        <Row> 
                            <Col xs={0} sm={1} md={3} lg={4}></Col>

                            <Col>
                                <Form>
                                    <div className="pb-3 pt-4">
                                        General Information:
                                    </div>
        
                                    <Row>
                                        <Col className="pr-1">
                                        <Form.Group controlId="insured_surname">
                                            <Form.Control type="text" placeholder="Vorname" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                        </Form.Group>
                                        </Col>
                                        <Col className="pl-1">
                                        <Form.Group controlId="insured_name">
                                            <Form.Control type="text" placeholder="Name" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                        </Form.Group>
                                        </Col>
                                    </Row>
        
                                    <Row>
                                        <Col className="pr-1" sm={9}>
                                            <Form.Group controlId="insured_street">
                                                <Form.Control type="text" placeholder="Straße" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                            </Form.Group>
                                        </Col>
                                        <Col className="pl-1" sm={3}>
                                            <Form.Group controlId="insured_street_number">
                                                <Form.Control type="text" placeholder="Hausnummer" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                            </Form.Group>
                                        </Col>
                                    </Row>
        
                                    <Row>
                                        <Col className="pr-1" sm={4}>
                                            <Form.Group controlId="insured_post_code">
                                                <Form.Control type="number" placeholder="Postleitzahl" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                            </Form.Group>
                                        </Col>
                                        <Col className="pl-1" sm={8}>
                                            <Form.Group controlId="insured_city">
                                                <Form.Control type="text" placeholder="Stadt" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                            </Form.Group>
                                        </Col>
                                    </Row>
        
                                    <Form.Group controlId="insured_birth_date">
                                        <Form.Control type="text" placeholder="Geburtstag" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                    </Form.Group>
        
                                    <div className="pb-3 pt-4">
                                        Information on health insurance:
                                    </div>
        
                                    <Form.Group controlId="insurance">
                                        <Form.Control value={this.state.value} onChange={this.handleChange} type="text" placeholder="Krankenkasse bzw. Kostenträger"></Form.Control>
                                    </Form.Group>
        
                                    <Row>
                                        <Col className="pr-1" sm={4}>
                                        <Form.Group controlId="insurance_number">
                                            <Form.Control type="number" placeholder="Kassen-Nr." value={this.state.value} onChange={this.handleChange}></Form.Control>
                                        </Form.Group>
                                        </Col>
                                        <Col className="px-1" sm={4}>
                                        <Form.Group controlId="insured_number">
                                            <Form.Control type="number" placeholder="Versicherten-Nr." value={this.state.value} onChange={this.handleChange}></Form.Control>
                                        </Form.Group>
                                        </Col>
                                        <Col className="pl-1" sm={4}>
                                        <Form.Group controlId="insured_status">
                                            <Form.Control type="number" placeholder="Status" value={this.state.value} onChange={this.handleChange}></Form.Control>
                                        </Form.Group>
                                        </Col>
                                    </Row>
                                </Form>

                                <Button variant="success" block onClick={this.addNewUser}>Registrieren</Button>

                                <Alert show={this.state.missingInput} variant="danger" className="mt-3">
                                    Bitte füllen Sie alle Eingabefelder aus!
                                </Alert>
                            </Col>

                            <Col xs={0} sm={1} md={3} lg={4}></Col>
                        </Row>
                    </Container>
                </>
            );
        }
    }
}
export default RegisterInsured;