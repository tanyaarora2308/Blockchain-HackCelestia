var User = artifacts.require("./User.sol");
var Prescriptions = artifacts.require("./Prescriptions.sol");

module.exports = function(deployer) {
  deployer.deploy(User);
  deployer.deploy(Prescriptions);
};
