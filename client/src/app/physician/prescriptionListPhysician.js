/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

import React, { Component } from "react";
import getWeb3 from "../getWeb3";

// React-Bootstrap imports
import Card from 'react-bootstrap/Card';

// Smart Contract imports
import PrescriptionsContract from '../../contracts/Prescriptions.json';
import UserContract from '../../contracts/User.json';



class PrescriptionListPhysician extends Component {
    state = {web3: null, prescriptionsContract: null, userContract: null, account: null, formData: {}, prescriptions: [], prescriptionIds: [], sendPrescription: null}

    constructor(props){
        super(props)
        this.handleChange = this.handleChange.bind(this);
    }

    componentDidMount = async () => {

        // Reads out the selected account from the user in MetaMask and stores it in the react state
        const ethereum = await window.ethereum;
        const public_key = ethereum.selectedAddress;
        this.setState({account: public_key});

        // If user changes his account, then the verification to access the page is checked and afterwards the new account is stored in the react state
        ethereum.on('accountsChanged', (public_key) => {
            console.log(public_key)
            this.setState({account: public_key[0]})
            console.log(this.state.account)
        });
        
        // Establishing the connection to the blockchain and the smart contracts
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

            this.setState({ web3: web3, account: account, prescriptionsContract: PrescriptionsContractInstance, userContract: UserContractInstance });
        } catch (error) {
            alert(`Failed to load web3, accounts, or contract. Check console for details.`);
            console.error(error);
        }
        
        await this.getPrescriptions()
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
    
    // Returns all prescriptions that were filled out by the physician. 
    getPrescriptions = async () => {
        var prescriptionsArray = [];
        const { account, standardAccount, prescriptionsContract, formData } = this.state;
        console.log(standardAccount)
        const prescriptionIds_ = await prescriptionsContract.methods.getPhysicianPrescriptionsIDs(account).call({ from: standardAccount, gas: 1000000 });

        for(var i = 0; i < prescriptionIds_.length; i++){
            var prescription = await prescriptionsContract.methods.getPrescription(prescriptionIds_[i]).call({ from: standardAccount, gas: 1000000 });
            prescription.insured_name = await this.getInsuredName(prescription.insured)
            prescriptionsArray.push(prescription)
        }
            
        this.setState({prescriptions: prescriptionsArray, prescriptionIds: prescriptionIds_, formData: formData});
    }

    getInsuredName = async (public_key_insured) => {
        const { standardAccount, userContract } = this.state;
        const insured = await userContract.methods.getInsured(public_key_insured).call({ from: standardAccount, gas: 1000000 });
        const insured_name =  insured.surname + " " + insured.name;
        return insured_name;
    }

    render(){
        // If the physician has no prescription in his list, then a message is shown. Otherwise the prescriptions are shown.
        if(this.state.prescriptions.length === 0){
            return(
                <p>You have not yet exhibited recipes.Click on "New Recipe" to create your first recipe!</p>
            )
        } else {
            var items = []
            var counter = 0;

            // Iterates through the prescriptions and created for every prescription a card.
            for(var prescription of this.state.prescriptions){
                items.push(
                    <Card className="mt-5" border="dark" key={counter}>
                        <Card.Header as="h6"><b>Patient:</b> {prescription.insured_name}</Card.Header>
                        <Card.Body>
                            <Card.Title as="h3">{prescription.medicine_name}</Card.Title>
                            <Card.Text className="mt-4">
                                <b>Dose:</b> {prescription.medicine_amount}<br/>
                            </Card.Text>
                        </Card.Body>
                    </Card>
                )
                counter = counter + 1;
            }

            // The array with all prescription cards is returned.
            return (
                <>
                    {items}
                </>
            )
        }
    }
}
export default PrescriptionListPhysician;