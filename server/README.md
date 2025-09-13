# server/

Express API that supports the client and optional blockchain interactions.

Responsibilities:
- Generate Sudoku puzzles at various difficulties and return `unsolved`, `solution`, and `clueFlags`.
- Validate user-submitted solutions server-side for better UX.
- Prepare inputs for proof generation (e.g., `unsolved`, `clueFlags`, `solved`).
- Optionally submit proofs to the deployed smart contracts via Web3.

Key endpoints (see `index.js`):
- `GET /api/health` – Health/status info.
- `GET /api/sudoku?difficulty=medium` – Generate a new puzzle.
- `POST /api/validate-solution` – Validate a full solution array.
- `POST /api/generate-proof-data` – Returns the circuit input (unsolved, clueFlags, solved).
- `POST /api/submit` – Sends proof and public signals to the on-chain verifier (when configured).
- `GET /api/proof/:key` – Query stored proof records by key.

Configuration via `.env` (project root):
- `BLOCKCHAIN_RPC_URL` – RPC endpoint (e.g., http://localhost:8545)
- `VERIFIER_CONTRACT_ADDRESS`, `CONSUMER_CONTRACT_ADDRESS` – Deployed contract addresses.
- `CLIENT_URL` – Allowed CORS origin (defaults to http://localhost:3000)

Notes:
- When the blockchain environment is not configured, the API continues to work for puzzle generation and local proof preparation.
- Rate limiting and security headers are enabled for safer defaults.
