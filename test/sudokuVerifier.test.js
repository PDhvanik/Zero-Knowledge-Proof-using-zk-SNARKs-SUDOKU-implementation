const SudokuVerifierConsumer = artifacts.require('SudokuVerifierConsumer');
const Verifier = artifacts.require('Verifier');

contract('SudokuVerifierConsumer', accounts => {
  it('deploys', async () => {
    const verifier = await Verifier.new();
    const consumer = await SudokuVerifierConsumer.new(verifier.address);
    assert(consumer.address);
  });
});
