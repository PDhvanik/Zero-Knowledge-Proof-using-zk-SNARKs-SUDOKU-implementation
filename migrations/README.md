# migrations/

Truffle migration scripts for deploying smart contracts.

Main file:
- `1_deploy_verifier_consumer.js` – Deploys the Groth16 verifier followed by the Sudoku consumer contract.

Basic usage:
```bash
npm run truffle:compile
npm run truffle:migrate
```

Notes:
- Ensure your RPC (e.g., Ganache) is running before migrating.
- After deployment, configure the backend `.env` with the deployed addresses.
