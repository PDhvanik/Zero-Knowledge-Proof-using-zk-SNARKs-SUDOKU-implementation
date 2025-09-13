const express = require('express');
const cors = require('cors');
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const { keccak256 } = require('web3-utils');
const SudokuGenerator = require('./utils/sudokuGenerator');

dotenv.config();

BigInt.prototype.toJSON = function () {
  return this.toString();
};

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from build folder for proof.json, public.json, etc.
app.use(express.static(path.join(__dirname, '../build')));

// Initialize Web3 and contracts
let web3, verifierContract, consumerContract;

try {
  web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');

  // Load contract ABIs and addresses
  const verifierABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/Groth16Verifier.json'))).abi;
  const consumerABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/SudokuVerifierConsumer.json'))).abi;
  const verifierAddress = process.env.VERIFIER_CONTRACT_ADDRESS;
  const consumerAddress = process.env.CONSUMER_CONTRACT_ADDRESS;

  // Check contract addresses before creating contract instances
  if (!verifierAddress || !consumerAddress) {
    console.warn("Contract addresses not set. Some features will be disabled.");
  } else {
    verifierContract = new web3.eth.Contract(verifierABI, verifierAddress);
    consumerContract = new web3.eth.Contract(consumerABI, consumerAddress);
    console.log("Contract instances created");
  }
} catch (error) {
  console.error('Failed to initialize blockchain connection:', error.message);
  console.warn('Running in offline mode - blockchain features disabled');
}

// Initialize Sudoku generator
const sudokuGenerator = new SudokuGenerator();

// Helper: Validate arrays
function validateArrays(arr, len, name) {
  if (!Array.isArray(arr) || arr.length !== len) {
    throw new Error(`${name} must be array of length ${len}`);
  }
}

// Helper: Sanitize input
function sanitizeInput(input) {
  if (Array.isArray(input)) {
    return input.map(item => typeof item === 'string' ? validator.escape(item) : item);
  }
  return typeof input === 'string' ? validator.escape(input) : input;
}

// Helper: Validate Sudoku solution
function validateSudokuSolution(solution) {
  const validation = sudokuGenerator.validateSolution(solution);
  if (!validation.valid) {
    throw new Error(`Invalid Sudoku solution: ${validation.error}`);
  }
  return true;
}

// API: Get Sudoku puzzle with difficulty
app.get('/api/sudoku', (req, res) => {
  try {
    const difficulty = req.query.difficulty || 'medium';
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];

    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        error: 'Invalid difficulty level. Must be one of: ' + validDifficulties.join(', ')
      });
    }

    const puzzleData = sudokuGenerator.generatePuzzle(difficulty);
    const clueFlags = sudokuGenerator.generateClueFlags(puzzleData.puzzle);

    res.json({
      puzzle: puzzleData.puzzle,
      solution: puzzleData.solution,
      clueFlags,
      difficulty: puzzleData.difficulty,
      clues: puzzleData.clues,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error generating Sudoku:', error);
    res.status(500).json({ error: 'Failed to generate Sudoku puzzle' });
  }
});

// API: Validate Sudoku solution
app.post('/api/validate-solution', (req, res) => {
  try {
    const { puzzle, solution } = req.body;

    if (!puzzle || !solution) {
      return res.status(400).json({ error: 'Puzzle and solution are required' });
    }

    // Validate solution format
    validateArrays(solution, 81, 'solution');
    validateArrays(puzzle, 81, 'puzzle');

    // Check that solution matches puzzle clues
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] > 0 && puzzle[i] !== solution[i]) {
        return res.status(400).json({
          error: `Solution doesn't match puzzle clue at position ${i}`
        });
      }
    }

    // Validate Sudoku rules
    const validation = sudokuGenerator.validateSolution(solution);

    res.json({
      valid: validation.valid,
      error: validation.error || null,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error validating solution:', error);
    res.status(400).json({ error: error.message });
  }
});

// API: Generate proof data for circuit
app.post('/api/generate-proof-data', (req, res) => {
  try {
    const { puzzle, solution } = req.body;

    if (!puzzle || !solution) {
      return res.status(400).json({ error: 'Puzzle and solution are required' });
    }

    // Validate inputs
    validateArrays(solution, 81, 'solution');
    validateArrays(puzzle, 81, 'puzzle');

    // Validate solution
    validateSudokuSolution(solution);

    // Check puzzle-solution consistency
    for (let i = 0; i < 81; i++) {
      if (puzzle[i] > 0 && puzzle[i] !== solution[i]) {
        throw new Error(`Solution doesn't match puzzle clue at position ${i}`);
      }
    }

    const clueFlags = sudokuGenerator.generateClueFlags(puzzle);

    res.json({
      unsolved: puzzle,
      clueFlags,
      solved: solution,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error generating proof data:', error);
    res.status(400).json({ error: error.message });
  }
});

// Proof key endpoint
app.post('/api/proof-key', (req, res) => {
  try {
    const { a, b, c, unsolved, clueFlags } = req.body;
    validateArrays(a, 2, 'a');
    validateArrays(b, 2, 'b');
    validateArrays(c, 2, 'c');
    validateArrays(unsolved, 81, 'unsolved');
    validateArrays(clueFlags, 81, 'clueFlags');

    const puzzleHash = keccak256(web3.eth.abi.encodeParameters(
      ['uint256[81]', 'uint256[81]'], [unsolved, clueFlags]
    ));
    console.log(puzzleHash.length);
    const key = keccak256(web3.eth.abi.encodeParameters(
      ['uint256[2]', 'uint256[2][2]', 'uint256[2]', 'bytes32'],
      [a, b, c, puzzleHash]
    ));
    res.json({ key, puzzleHash });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// API: Submit solution and proof to blockchain
app.post('/api/submit', async (req, res) => {
  try {
    if (!web3 || !consumerContract) {
      return res.status(503).json({ error: 'Blockchain connection not available' });
    }

    const { a, b, c, publicSignals, unsolved, clueFlags, solution } = req.body;
    validateArrays(a, 2, 'a');
    validateArrays(b, 2, 'b');
    validateArrays(c, 2, 'c');
    validateArrays(publicSignals, 162, 'publicSignals');
    validateArrays(unsolved, 81, 'unsolved');
    validateArrays(clueFlags, 81, 'clueFlags');
    validateArrays(solution, 81, 'solution');

    // Validate solution before submitting
    validateSudokuSolution(solution);

    const accounts = await web3.eth.getAccounts();
    if (!accounts || accounts.length === 0) {
      return res.status(503).json({ error: 'No blockchain accounts available' });
    }

    // Call submitProof on SudokuVerifierConsumer contract
    const tx = await consumerContract.methods.submitProof(
      a, b, c, publicSignals, unsolved, clueFlags
    ).send({
      from: accounts[0],
      gas: 5000000,
      gasPrice: '20000000000' // 20 gwei
    });

    res.json({
      txHash: tx.transactionHash,
      status: 'submitted',
      blockNumber: tx.blockNumber,
      gasUsed: tx.gasUsed
    });
  } catch (err) {
    console.error('Error submitting proof:', err);
    res.status(400).json({ error: err.message });
  }
});

// API: Get proof status from blockchain
app.get('/api/proof/:key', async (req, res) => {
  try {
    if (!web3 || !consumerContract) {
      return res.status(503).json({ error: 'Blockchain connection not available' });
    }

    const key = req.params.key;
    if (!validator.isHexadecimal(key) || key.length !== 66) {
      return res.status(400).json({ error: 'Invalid proof key format' });
    }

    // Read proof record from contract
    const proofRecord = await consumerContract.methods.proofs(key).call();
    res.json({ proof: proofRecord });
  } catch (err) {
    console.error('Error fetching proof:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Get multiple puzzles for testing
app.get('/api/puzzles', (req, res) => {
  try {
    const count = Math.min(parseInt(req.query.count) || 5, 20); // Max 20 puzzles
    const difficulty = req.query.difficulty || 'medium';

    const puzzles = sudokuGenerator.generateMultiplePuzzles(count, difficulty);
    res.json({ puzzles, count, difficulty });
  } catch (error) {
    console.error('Error generating multiple puzzles:', error);
    res.status(500).json({ error: 'Failed to generate puzzles' });
  }
});

// API: Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: Date.now(),
    blockchain: web3 ? 'connected' : 'disconnected',
    contracts: verifierContract && consumerContract ? 'deployed' : 'not deployed'
  });
});

// Serve proof files
app.get('/api/proof-files', (req, res) => {
  try {
    const proof = require('../build/proof.json');
    const pub = require('../build/public.json');
    res.json({ proof, publicSignals: pub });
  } catch (err) {
    res.status(500).json({ error: 'Proof files not found' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    timestamp: Date.now()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    timestamp: Date.now()
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Blockchain: ${web3 ? 'Connected' : 'Disconnected'}`);
  console.log(`Contracts: ${verifierContract && consumerContract ? 'Deployed' : 'Not deployed'}`);
});