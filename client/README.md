# client/

React single-page application for interacting with the Sudoku ZK demo.

Key features:
- Fetch a Sudoku puzzle from the server with selectable difficulty.
- Enter or auto-fill the solution (for testing).
- Generate the witness in-browser using `witness_calculator.js` and `sudoku.wasm`.
- Create a Groth16 proof using `snarkjs` (loaded from CDN) and `sudoku.zkey`.
- Submit the proof to the backend, which forwards to the smart contract for on-chain verification.

Important files:
- `public/index.html` – HTML template; also where Tailwind is loaded.
- `public/sudoku.wasm`, `public/sudoku.zkey` – Circuit artifacts required at runtime by the browser.
- `src/App.js` – Main UI logic and step-by-step flow.
- `src/index.js` – React entrypoint.

Run locally:
```bash
npm install
npm start
```
Default URL: http://localhost:3000

Troubleshooting:
- If proof generation fails, ensure the `snarkjs` script can load from the CDN and that `sudoku.wasm` and `sudoku.zkey` exist in `public/`.
- CORS: The server allows the client origin via `CLIENT_URL` env var (defaults to http://localhost:3000).
