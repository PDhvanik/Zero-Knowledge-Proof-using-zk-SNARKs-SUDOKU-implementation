const SudokuVerifierConsumer = artifacts.require("SudokuVerifierConsumer");
const Verifier = artifacts.require("Groth16Verifier");

module.exports = async function (deployer) {
  await deployer.deploy(Verifier);
  const verifierInstance = await Verifier.deployed();
  await deployer.deploy(SudokuVerifierConsumer, verifierInstance.address);
};
