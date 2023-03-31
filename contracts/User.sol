/**
 * @author Valentin Mueller <https://github.com/ValentinFFM>
 */

// SPDX-License-Identifier: MIT
pragma solidity >=0.4.21 <0.7.0;

// Experimental function is necessary to allow mappings with structs.
pragma experimental ABIEncoderV2;

/**
    The Smart Contract User is responsible for storing the information of all users.
    Furthermore it provides all necessary functions to interact with users.
 */
contract User {

    address public verifying_institution;

    // Assigns the creator of the smart contract as verifying institution.
    constructor () public {
        verifying_institution = msg.sender;
    }

    // Defining struct that contains all variables that are needed for a insured.
    struct Insured {
        string surname;
        string name;
        string street;
        string street_number;
        uint post_code;
        string city;

        string birth_date;

        string insurance;
        uint insurance_number;
        uint insured_number;
        uint insured_status;

        bool verified;
    }

    // Defining struct that contains all variables that are needed for a physician.
    struct Physician {
        string job_title;
        string surname;
        string name;
        uint physician_number;

        string street;
        string street_number;
        uint post_code;
        string city;
        string telephone_number; 
        uint business_number;

        bool verified;
    }

    // Defining struct that contains all variables that are needed for a pharmacist.
    struct Pharmacist {
        uint pharmacy_number;
        string name;

        bool verified;
    }

    // For every user group the public keys of the users are mapped to the corresponding user struct.
    mapping(address => Insured) public insureds;
    mapping(address => Physician) public physicians;
    mapping(address => Pharmacist) public pharmacists;



    function addNewInsured(Insured memory insured_)  public{
        insureds[msg.sender] = Insured(insured_.surname, insured_.name, insured_.street, insured_.street_number, insured_.post_code, insured_.city, insured_.birth_date, insured_.insurance, insured_.insurance_number, insured_.insured_number, insured_.insured_status, false);
    }

    function addNewPhysician(Physician memory physician_) public{
        physicians[msg.sender] = Physician(physician_.job_title, physician_.surname, physician_.name, physician_.physician_number, physician_.street, physician_.street_number, physician_.post_code, physician_.city, physician_.telephone_number, physician_.business_number, false);
    }

    function addNewPharmacist(Pharmacist memory pharmacist_) public{
        pharmacists[msg.sender] = Pharmacist(pharmacist_.pharmacy_number, pharmacist_.name, false);
    }



    function verifyInsured(address public_key) public returns (bool){
        require(msg.sender == verifying_institution, "Only the verify institution has the right to verify insured!");
        require(insureds[public_key].insured_number > 0, "No insured exists under this address!");
        insureds[public_key].verified = true;
    }

    function verifyPhysician(address public_key) public returns (bool){
        require(msg.sender == verifying_institution, "Only the verify institution has the right to verify physician!");
        require(physicians[public_key].physician_number > 0, "No physician exists under this address!");
        physicians[public_key].verified = true;
    }

    function verifyPharmacist(address public_key) public returns (bool){
        require(msg.sender == verifying_institution, "Only the verify institution has the right to verify pharmacist!");
        require(pharmacists[public_key].pharmacy_number > 0, "No pharmacist exists under this address!");
        pharmacists[public_key].verified = true;
    }



    function getInsured(address public_key) public view returns(Insured memory){
        if(insureds[public_key].insured_number > 0){
            return insureds[public_key];
        } 
    }

    function getPhysician(address public_key) public view returns(Physician memory){
        if(physicians[public_key].physician_number > 0){
            return physicians[public_key];
        } 
    }

    function getPharmacist(address public_key) public view returns(Pharmacist memory){
        if(pharmacists[public_key].pharmacy_number > 0){
            return pharmacists[public_key];
        } 
    }


    // Returns true, if the user exists.
    function checkExistence(string memory role, address public_key) public view returns (bool){
        if(keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('insured'))){
            if(insureds[public_key].insured_number >0){
                return true;
            } else {
                return false;
            }
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('physician'))){
            if(physicians[public_key].physician_number >0){
                return true;
            } else {
                return false;
            }
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('pharmacist'))){
            if(pharmacists[public_key].pharmacy_number >0){
                return true;
            } else {
                return false;
            }
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('verifying_institution'))){
            if(verifying_institution == public_key){
                return true;
            } else {
                return false;
            }
        }
    }

    // Returns true, if the user exists and is verified by the verifying institution.
    function checkVerification(string memory role, address public_key) public view returns (bool){
        if(keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('insured'))){
            if(insureds[public_key].insured_number > 0 && insureds[public_key].verified == true){
                return true;
            } else {
                return false;
            }
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('physician'))){
            if(physicians[public_key].physician_number > 0 && physicians[public_key].verified == true){
                return true;
            } else {
                return false;
            }
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('pharmacist'))){
            if(pharmacists[public_key].pharmacy_number >0 && pharmacists[public_key].verified == true){
                return true;
            } else {
                return false;
            }
        } else if (keccak256(abi.encodePacked(role)) == keccak256(abi.encodePacked('verifying_institution'))){
            if(verifying_institution == public_key){
                return true;
            } else {
                return false;
            }
        }
    }    
}