# circuits/

This directory contains the Circom circuit that encodes the Sudoku rules.

Main file:
- `sudoku.circom` – Enforces that:
  - Every solved cell is in the range 1..9.
  - Clue cells match the original puzzle where flagged.
  - Each row, column, and 3×3 box contains a permutation of 1..9, enforced efficiently using sum and sum-of-squares invariants.

Typical workflow:
1. Compile and set up keys
   - Use project scripts (see root `README.md`) to run setup, generate keys, and export a Solidity verifier.
2. Generate witness and proof
   - Provide inputs (`unsolved`, `clueFlags`, `solved`) and produce `witness.wtns`, `proof.json`, and `public.json` in `build/`.

Tips:
- Any change to `sudoku.circom` requires recompiling and regenerating the proving/verifying keys.
- Consider versioning `.zkey` files and documenting ceremony steps if used beyond local development.
