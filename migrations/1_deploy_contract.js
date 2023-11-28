var Election = artifacts.require("./Election.sol");

module.exports = async function(deployer) {
  // console.log("deployer>", Election);
  await deployer.deploy(Election);
  let instance = await Election.deployed();
  console.log("election instance>", instance.methods);
};