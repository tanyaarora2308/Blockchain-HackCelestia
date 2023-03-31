/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

// Experimental function is necessary to allow mappings with structs.
pragma experimental ABIEncoderV2;

// Import of Smart Contract "User" to interact with the functionalities of it
import "./User.sol";

/**
    The Smart Contract Prescriptions is responsible for storing the information of all prescriptions.
    Furthermore it provides all necessary functions to interact with prescriptions.
 */
contract Prescriptions {

    address public verifying_institution;
    User UserContract;
    uint prescription_id;

    // Assigns the creator of the smart contract as verifying institution and sets the first prescription_id.
    constructor () public {
        verifying_institution = msg.sender;
        prescription_id = 0;
    }

    // Defining struct that contains all variables that are needed for a prescription.
    struct Prescription {
        address physician;
        address insured;
        address pharmacist;

        bool pharmacistEqualsInsured;
        string status;

        string medicine_name;
        string medicine_amount;
    }

    // For every user group the public keys of the users are mapped to an array containing prescription-ids.
    mapping(address => uint[]) public prescriptionPhysician;
    mapping(address => uint[]) public prescriptionInsured;
    mapping(address => uint[]) public prescriptionPharmacist;

    // Mapping prescription-ids to the corresponding prescription struct.
    mapping(uint => Prescription) public prescription;

    // Function for connecting the Smart Contract user to the Smart Contract prescription.
    function establishConnectionToUserSmartContract(address smart_contract_key) public {
        require(msg.sender == verifying_institution, "Only the verify institution has the premission to connect prescription to user!");
        UserContract = User(smart_contract_key);
    }

    function newPrescription(Prescription memory prescription_) public{
        require(UserContract.checkVerification('physician', msg.sender) == true, "You don't have the premission to create a prescription!");
        require(UserContract.checkVerification('insured', prescription_.insured) == true, "This insured is not registered or verified!");

        prescription[prescription_id] = Prescription(prescription_.physician, prescription_.insured, prescription_.pharmacist, prescription_.pharmacistEqualsInsured, 'Patient', prescription_.medicine_name, prescription_.medicine_amount);
        prescriptionPhysician[prescription_.physician].push(prescription_id);
        prescriptionInsured[prescription_.insured].push(prescription_id);
        prescription_id = prescription_id + 1;
    }

    function transferPrescriptionToPharmacist(uint prescription_id_, address pharmacist) public {
        Prescription memory prescription_ = prescription[prescription_id_];

        require(msg.sender == prescription_.insured, "The prescription you try to transfer is not your prescription!");
        require(UserContract.checkVerification('insured', prescription_.insured) == true, "You don't have the premission to transfer a prescription!");
        require(UserContract.checkVerification('pharmacist', pharmacist) == true, "This pharmacist is not registered or verified!");
    
        prescription[prescription_id_] = Prescription(prescription_.physician, prescription_.insured, pharmacist, prescription_.pharmacistEqualsInsured, 'Pharmacist', prescription_.medicine_name, prescription_.medicine_amount);
        prescriptionPharmacist[pharmacist].push(prescription_id_);

    }

    function redeemPrescription(uint prescription_id_) public {
        Prescription memory prescription_ = prescription[prescription_id_];

        require(UserContract.checkVerification('pharmacist', msg.sender) == true, "You don't have the premission to redeem a prescription!");
        require(msg.sender == prescription_.pharmacist, "The prescription you try to redeem is not your prescription!");
        
        prescription[prescription_id_] = Prescription(prescription_.physician, prescription_.insured, prescription_.pharmacist, prescription_.pharmacistEqualsInsured, 'Redeemed', prescription_.medicine_name, prescription_.medicine_amount);
    }

    function getPrescription(uint prescription_id_) public returns (Prescription memory){
        return prescription[prescription_id_];
    }

    function getPhysicianPrescriptionsIDs(address public_key) public returns (uint[] memory){
        return prescriptionPhysician[public_key];
    }

    function getInsuredPrescriptionsIDs(address public_key) public returns (uint[] memory){
        return prescriptionInsured[public_key];
    }

    function getPharmacistPrescriptionsIDs(address public_key) public returns (uint[] memory){
        return prescriptionPharmacist[public_key];
    }
}
