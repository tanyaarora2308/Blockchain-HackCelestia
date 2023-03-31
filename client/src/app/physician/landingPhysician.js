/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

import React, { Component } from "react";
import getWeb3 from "../getWeb3";
import { Redirect, BrowserRouter as Router, Route, Switch} from 'react-router-dom';

// React-Bootstrap imports
import Navbar from 'react-bootstrap/Navbar';
import Button from 'react-bootstrap/Button';
import Nav from 'react-bootstrap/Nav';
import Container from 'react-bootstrap/Container';
import Col from 'react-bootstrap/Col';
import Row from 'react-bootstrap/Row';

// Smart Contract imports
import UserContract from './../../contracts/User.json';

// Component imports
import Login from './../login';
import PrescriptionListPhysician from './prescriptionListPhysician';



class LandingPhysician extends Component {
    state = {web3: null, userContract: null, account: null, userVerfied: null, initialize: false}

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
      
            const UserContractInstance = new web3.eth.Contract(
                UserContract.abi,
                UserContractNetwork && UserContractNetwork.address,
            );

            this.setState({ web3: web3, account: account, userContract: UserContractInstance, initialize: true });
            this.checkVerification();
        } catch (error) {
            alert(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
    }

    // Checks if the user, that is logged in in MetaMask, is a verified physician.
    checkVerification = async () => {
        const { userContract } = this.state;
        const verfied = await userContract.methods.checkVerification('physician', this.state.account).call({from: this.state.account, gas: 1000000})
        this.setState({userVerfied: verfied})
    }

    render(){
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
            return(
                <>
                    <Navbar sticky="top" bg="dark" variant="dark" expand="lg">
                        <Navbar.Brand>E-Rezept</Navbar.Brand>
                        <Navbar.Toggle aria-controls="basic-navbar-nav" />
                        <Navbar.Collapse id="basic-navbar-nav">
                            <Nav className="mr-auto">
                                <Nav.Link href="/newPrescription">New recipe</Nav.Link>
                            </Nav>
                            <Button href="/" variant="outline-danger">main menu</Button>
                        </Navbar.Collapse>
                    </Navbar>

                    <Container fluid className="my-5">
                        <Row> 
                            <Col xs={0} sm={1} md={2} lg={3}></Col>
                            <Col>
                                <h1>Recipe overview</h1>
                                <PrescriptionListPhysician />
                            </Col>
                            <Col xs={0} sm={1} md={2} lg={3}></Col>
                        </Row>
                    </Container>
                </>
            );
        }
    }
}
export default LandingPhysician;