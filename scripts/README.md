# scripts/

Developer scripts to assist with maintenance and testing.

Included:
- `test-web3.js` – Quick smoke test for Web3 connectivity to a local RPC at `http://localhost:8545`.
- `update-dependencies.js` – Checks for outdated npm packages in the root and `client/` workspaces and prints upgrade suggestions.

Usage examples:
```bash
node scripts/test-web3.js
node scripts/update-dependencies.js
```

Notes:
- These scripts are optional helpers and not required for running the demo.
