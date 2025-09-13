# build/

This folder contains generated artifacts produced by compiling and setting up the zk circuit.

Contents you may see here:
- `sudoku.r1cs` – The circuit constraint system.
- `sudoku_js/` – Browser-side artifacts for witness generation:
  - `sudoku.wasm`
  - `witness_calculator.js`
- `sudoku_0000.zkey` – Proving key (Groth16).
- `verification_key.json` – Verification key used for proof verification.
- `proof.json`, `public.json` – Example proof and public signals produced during development.
- `pot14_*.ptau` – Powers of Tau ceremony artifacts for trusted setup.
- `witness.wtns` – Witness file generated from inputs.

Notes:
- Files here are generated; do not edit them manually.
- The web client reads `sudoku.wasm` and the `.zkey` from `client/public/` at runtime. Keep those in sync if you rebuild.
- If you regenerate the circuit or keys, you must re-copy updated artifacts to `client/public/` as needed.
