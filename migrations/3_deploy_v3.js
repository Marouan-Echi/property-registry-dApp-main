const PropertyRegistryV3 = artifacts.require("PropertyRegistryV3");

module.exports = function(deployer, network, accounts) {
  // The account that deploys the contract will automatically become the super admin
  deployer.deploy(PropertyRegistryV3);
};
