# Sudoku Zero-Knowledge Proof (zk-SNARK) Demo

This project implements a verifiable Sudoku solver using a zk-SNARK circuit written in Circom. A prover can show knowledge of a valid Sudoku solution without revealing the solution itself.

## Core Idea
Public inputs:
- `unsolved[81]` – the original puzzle (0 for blanks)
- `clueFlags[81]` – 1 where a clue exists, else 0

Private inputs:
- `solved[81]` – the full solved grid
- Inverses for pairwise inequality constraints (handled implicitly by the witness generator)

Constraints enforce:
1. Each solved cell is in [1,9] via (x-1)…(x-9)=0
2. Clue cells match original puzzle where `clueFlags[i]==1`
3. Rows: sum=45 and sum of squares=285 (implies permutation of 1..9)
4. Columns: same invariants
5. 3×3 boxes: same invariants
6. `clueFlags` correctness & boolean validity

## Prerequisites
- Node.js (>=18 recommended)
- Install globally (recommended):
```bash
npm install -g circom@latest snarkjs@latest
```

## Install Dependencies
```bash
npm install
```

## Generate Sample Input
```bash
node scripts/makeInput.js
```

## Compile Circuit & Perform Setup
```bash
npm run setup   # compiles + Powers of Tau + circuit setup + export vk
```

Outputs go to `build/`:
- `sudoku.r1cs` – constraint system
- `sudoku_js/` – WASM & witness generator
- `pot14_*` – Powers of Tau artifacts
- `sudoku_0000.zkey` – proving key
- `verification_key.json` – verification key

## Create Witness
```bash
npm run witness
```
Produces: `build/witness.wtns`

## Generate Proof
```bash
npm run prove
```
Produces: `build/proof.json`, `build/public.json`

## Verify Proof
```bash
npm run verify
```
Should output `OK`.

## Export Solidity Verifier
```bash
npm run verifier:sol
```
Outputs `contracts/Verifier.sol` (create `contracts/` directory if needed).

## Deploy On Local EVM (Truffle)
Start a local chain (e.g. `ganache --chain.hardfork istanbul` or Ganache GUI) then:
```bash
npm run truffle:compile
npm run truffle:migrate
```
This deploys `Verifier` and `SudokuVerifierConsumer`. To run tests:
```bash
npm run truffle:test
```
Submit proofs by calling `submitProof` on `SudokuVerifierConsumer` with the arrays from `snarkjs generatecall` (after producing a proof). A helper script may be added later.

## Modify Puzzle
Edit `scripts/makeInput.js` with a new puzzle & solution. Ensure solution matches puzzle clues.

## Notes / Future Improvements
- Optimized uniqueness via sum / sum-of-squares drastically reduces constraints vs pairwise inequality.
- Could derive `clueFlags` internally (compare unsolved[i] != 0) to simplify public API.
- Consider PLONK or HyperPlonk for universal setup.
- Add Jest script to auto run witness/proof checks.
- Provide Solidity verifier deployment script (Hardhat/Foundry).

## Clean Build Artifacts
```bash
npm run clean
```

---
Educational demo; not audited for production security.
