# Dynamic Sudoku ZKP - Complete Execution Guide

This guide provides step-by-step instructions to run the dynamic Sudoku Zero-Knowledge Proof system with best practices.

## Prerequisites

### Required Software

- **Node.js** (>= 18.0.0) - [Download](https://nodejs.org/)
- **Rust** (for Circom compiler) - [Install](https://rustup.rs/)
- **Git** - [Download](https://git-scm.com/)

### Global Dependencies

```bash
# Install Circom compiler globally
npm install -g circom@latest

# Install snarkjs globally
npm install -g snarkjs@latest

# Install Truffle globally (optional)
npm install -g truffle@latest
```

## Project Setup

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Install server dependencies (already included in root)
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Blockchain Configuration
BLOCKCHAIN_RPC_URL=http://localhost:8545
VERIFIER_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890
CONSUMER_CONTRACT_ADDRESS=0x1234567890123456789012345678901234567890

# Server Configuration
PORT=5000
CLIENT_URL=http://localhost:3000

# Client Configuration
REACT_APP_API_URL=http://localhost:5000/api
```

## Build Process

### 1. Clean and Setup

```bash
# Clean previous builds
npm run clean

# Complete setup (circuit compilation + trusted setup)
npm run setup
```

### 2. Compile Smart Contracts

```bash
# Compile Solidity contracts
npm run truffle:compile
```

### 3. Deploy Contracts (Local Blockchain)

```bash
# Start local blockchain (Ganache)
# Option 1: Ganache CLI
ganache --chain.hardfork istanbul --port 8545

# Option 2: Ganache GUI
# Download from https://trufflesuite.com/ganache/

# Deploy contracts
npm run truffle:migrate

# Copy contract addresses to .env file
```

## Running the Application

### Option 1: Development Mode (Recommended)

```bash
# Run both server and client concurrently
npm run dev
```

### Option 2: Separate Terminals

```bash
# Terminal 1: Start server
npm run server

# Terminal 2: Start client
npm run client
```

## Usage Instructions

### 1. Access the Application

- Open browser to `http://localhost:3000`
- The application will show API and blockchain connection status

### 2. Generate Sudoku Puzzle

1. **Select Difficulty**: Choose from Easy, Medium, Hard, or Expert
2. **Generate Puzzle**: Click "Generate New Puzzle"
3. The system will create a unique, solvable Sudoku puzzle

### 3. Solve the Puzzle

1. **Fill Empty Cells**: Enter numbers 1-9 in white cells
2. **Gray Cells**: These are clues and cannot be changed
3. **Validation**: The system validates your solution in real-time
4. **Auto-Fill**: Use "Auto-Fill" for testing purposes

### 4. Generate Zero-Knowledge Proof

1. **Generate Witness**: Click "Next: Generate Witness"
2. **Generate Proof**: Click "Generate ZK Proof"
3. The system creates a cryptographic proof without revealing the solution

### 5. Submit to Blockchain

1. **Submit Proof**: Click "Submit to Blockchain"
2. **Verification**: The smart contract verifies the proof
3. **Success**: Your proof is recorded on-chain

## API Endpoints

### Server API (`http://localhost:5000/api`)

#### GET `/sudoku?difficulty={level}`

Generate a new Sudoku puzzle

- **Parameters**: `difficulty` (easy|medium|hard|expert)
- **Response**: Puzzle data with solution and clue flags

#### POST `/validate-solution`

Validate a Sudoku solution

- **Body**: `{ puzzle: number[], solution: number[] }`
- **Response**: Validation result

#### POST `/generate-proof-data`

Generate circuit input data

- **Body**: `{ puzzle: number[], solution: number[] }`
- **Response**: Formatted input for ZK circuit

#### POST `/submit`

Submit proof to blockchain

- **Body**: Complete proof data
- **Response**: Transaction hash and status

#### GET `/health`

Check system health

- **Response**: API and blockchain status

## Smart Contract Functions

### SudokuVerifierConsumer Contract

#### `submitProof(a, b, c, publicSignals, unsolved, clueFlags)`

Submit a zero-knowledge proof for verification

- **Parameters**: ZK proof components and puzzle data
- **Events**: `PuzzleProved` emitted on success

#### `proofs(key)`

Query proof records by key

- **Returns**: Proof existence, puzzle hash, and timestamp

## Testing

### 1. Test Circuit Generation

```bash
# Test witness generation
npm run witness

# Test proof generation
npm run prove

# Test proof verification
npm run verify
```

### 2. Test Smart Contracts

```bash
# Run Truffle tests
npm run truffle:test
```

### 3. Test Full Workflow

1. Generate puzzle via API
2. Solve puzzle manually or with auto-fill
3. Generate witness and proof
4. Submit to blockchain
5. Verify on-chain record

## Troubleshooting

### Common Issues

#### 1. "Contract addresses not set"

- **Solution**: Deploy contracts and update `.env` file
- **Command**: `npm run truffle:migrate`

#### 2. "WASM file not found"

- **Solution**: Rebuild circuit artifacts
- **Command**: `npm run setup`

#### 3. "Invalid proof format"

- **Solution**: Ensure circuit artifacts match
- **Command**: `npm run clean && npm run setup`

#### 4. "Blockchain connection failed"

- **Solution**: Start local blockchain (Ganache)
- **Command**: `ganache --port 8545`

#### 5. "Rate limit exceeded"

- **Solution**: Wait 15 minutes or restart server
- **Note**: This is a security feature

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run server

# Check blockchain connection
curl http://localhost:5000/api/health
```

## Performance Optimization

### 1. Circuit Optimization

- Use efficient Circom components
- Minimize constraint count
- Optimize witness generation

### 2. Frontend Optimization

- Lazy load ZK libraries
- Implement proper error boundaries
- Use React.memo for components

### 3. Backend Optimization

- Implement caching for puzzles
- Use connection pooling
- Add request compression

## Security Considerations

### 1. Input Validation

- All inputs are sanitized and validated
- Sudoku solutions are verified before proof generation
- Rate limiting prevents abuse

### 2. Smart Contract Security

- Reentrancy protection enabled
- Access controls implemented
- Gas limits properly set

### 3. API Security

- CORS properly configured
- Helmet security headers
- Input sanitization

## Production Deployment

### 1. Environment Setup

- Use production blockchain (Polygon, Ethereum)
- Set up proper environment variables
- Configure HTTPS

### 2. Build Process

```bash
# Build for production
npm run build:all

# Deploy contracts
npm run deploy
```

### 3. Monitoring

- Set up logging
- Monitor gas usage
- Track API performance

## Advanced Features

### 1. Multiple Difficulty Levels

- Easy: 40+ clues
- Medium: 30-40 clues
- Hard: 20-30 clues
- Expert: 15-20 clues

### 2. Dynamic Puzzle Generation

- Unique solutions guaranteed
- Configurable difficulty
- Real-time validation

### 3. Zero-Knowledge Proofs

- Privacy-preserving verification
- Cryptographic security
- On-chain verification

## Support

For issues or questions:

1. Check the troubleshooting section
2. Review console logs
3. Verify environment setup
4. Test individual components

## License

This project is for educational purposes. Not audited for production use.
