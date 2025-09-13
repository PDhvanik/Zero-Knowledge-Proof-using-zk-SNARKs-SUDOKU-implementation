import React, { useCallback, useEffect, useRef, useState } from 'react';

// --- Constants ---
const API_BASE_URL = 'http://localhost:5000/api';

const steps = [
  { label: "Select Difficulty", desc: "Choose the difficulty level for your Sudoku puzzle." },
  { label: "Solve Puzzle", desc: "Fill in the solution for the provided Sudoku puzzle." },
  { label: "Generate Witness", desc: "Generate a witness file off-chain using WASM." },
  { label: "Generate Proof", desc: "Generate the zk-SNARK proof using snarkjs." },
  { label: "Submit Proof", desc: "Send the proof and inputs to the smart contract." },
  { label: "View On-Chain Record", desc: "See the verification result stored on the blockchain." }
];

const difficulties = [
  { value: 'easy', label: 'Easy', description: '40+ clues' },
  { value: 'medium', label: 'Medium', description: '30-40 clues' },
  { value: 'hard', label: 'Hard', description: '20-30 clues' },
  { value: 'expert', label: 'Expert', description: '15-20 clues' }
];

// --- Helper Components ---
const StepIndicator = ({ currentStep }) => (
  <aside className="w-full md:w-80 bg-gray-50 p-6 rounded-lg shadow-inner">
    <h3 className="text-xl font-bold text-gray-800 mb-4">Proof Generation Steps</h3>
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={i} className={`flex items-start ${currentStep > i + 1 ? 'text-green-600' : currentStep === i + 1 ? 'text-blue-600' : 'text-gray-400'}`}>
          <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${currentStep > i + 1 ? 'bg-green-600 border-green-600 text-white' : currentStep === i + 1 ? 'border-blue-600' : 'border-gray-300'} font-bold text-sm mr-3 flex-shrink-0`}>
            {currentStep > i + 1 ? '✓' : i + 1}
          </div>
          <div>
            <div className={`font-semibold ${currentStep === i + 1 ? 'text-gray-900' : ''}`}>{s.label}</div>
            <small className="text-gray-500">{s.desc}</small>
          </div>
        </li>
      ))}
    </ol>
    <div className="mt-8 pt-4 border-t">
      <h4 className="font-bold text-gray-700">System Status</h4>
      <p className="text-sm text-gray-600 mt-1">
        <b>API:</b> <span className="font-mono bg-gray-200 px-1 rounded">Connected</span>
      </p>
      <p className="text-sm text-gray-600 mt-1">
        <b>Blockchain:</b> <span className="font-mono bg-gray-200 px-1 rounded">Local</span>
      </p>
    </div>
  </aside>
);

const SudokuGrid = ({ puzzle, solution, onCellChange, disabled, showErrors = false, errors = [] }) => (
  <div className="grid grid-cols-9 gap-px bg-gray-400 w-max shadow-lg rounded-md overflow-hidden">
    {solution.map((val, idx) => {
      const isClue = puzzle[idx] > 0;
      const row = Math.floor(idx / 9);
      const col = idx % 9;
      const hasError = errors.includes(idx);
      const borderClasses = `
        ${row % 3 === 2 && row !== 8 ? 'border-b-2 border-gray-400' : ''}
        ${col % 3 === 2 && col !== 8 ? 'border-r-2 border-gray-400' : ''}
      `;
      return (
        <input
          key={idx}
          type="text"
          value={val}
          maxLength={1}
          disabled={isClue || disabled}
          className={`w-10 h-10 md:w-12 md:h-12 text-center text-xl md:text-2xl font-bold ${borderClasses} ${isClue
            ? 'bg-gray-200 text-gray-800'
            : hasError
              ? 'bg-red-100 text-red-600 border-red-300'
              : 'bg-white text-blue-600 focus:bg-blue-50'
            }`}
          onChange={e => onCellChange(idx, e.target.value)}
        />
      );
    })}
  </div>
);

const ActionButton = ({ onClick, disabled, children, variant = 'primary', loading = false }) => (
  <button
    className={`px-6 py-2 font-semibold rounded-lg shadow-md transition-colors ${variant === 'primary'
      ? 'bg-blue-600 text-white hover:bg-blue-700'
      : variant === 'success'
        ? 'bg-green-600 text-white hover:bg-green-700'
        : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
      } disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2`}
    onClick={onClick}
    disabled={disabled || loading}
  >
    {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
    {children}
  </button>
);

const StatusDisplay = ({ error, loading, txHash, success }) => (
  <>
    {error && <div className="w-full p-3 my-4 bg-red-100 text-red-700 border border-red-300 rounded-lg">{error}</div>}
    {loading && <div className="w-full p-3 my-4 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg animate-pulse">Loading...</div>}
    {success && <div className="w-full p-3 my-4 bg-green-100 text-green-700 border border-green-300 rounded-lg">{success}</div>}
    {txHash && (
      <div className="w-full p-3 my-4 bg-green-100 text-green-700 border border-green-300 rounded-lg">
        <strong>Success!</strong> Transaction Hash:
        <a href={`https://mumbai.polygonscan.com/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="ml-2 font-mono break-all hover:underline">{txHash}</a>
      </div>
    )}
  </>
);

const DifficultySelector = ({ selectedDifficulty, onDifficultyChange, disabled }) => (
  <div className="mb-6">
    <h4 className="text-lg font-semibold mb-3">Select Difficulty</h4>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {difficulties.map(diff => (
        <button
          key={diff.value}
          onClick={() => onDifficultyChange(diff.value)}
          disabled={disabled}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${selectedDifficulty === diff.value
            ? 'border-blue-500 bg-blue-50 text-blue-700'
            : 'border-gray-200 hover:border-gray-300'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="font-semibold">{diff.label}</div>
          <div className="text-sm text-gray-600">{diff.description}</div>
        </button>
      ))}
    </div>
  </div>
);

const DataDisplayCard = ({ title, description, data }) => (
  <div className="mt-6 bg-gray-50 p-4 rounded-lg border shadow-inner">
    <h5 className="text-lg font-semibold text-gray-800">{title}</h5>
    <p className="text-sm text-gray-600 mb-2">{description}</p>
    <pre className="bg-gray-900 text-white text-xs p-3 rounded-md overflow-x-auto">
      {JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value,
        2)}
    </pre>
  </div>
);

// --- Main App Component ---
function App() {
  const [puzzle, setPuzzle] = useState(Array(81).fill(0));
  const [solution, setSolution] = useState(Array(81).fill(''));
  const [clueFlags, setClueFlags] = useState(Array(81).fill(0));
  const [completeSolution, setCompleteSolution] = useState(Array(81).fill(0)); // Store the complete solution from server
  const [difficulty, setDifficulty] = useState('medium');
  const [witness, setWitness] = useState(null);
  const [proofData, setProofData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState(1);
  const [proofRecord, setProofRecord] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [circuitInput, setCircuitInput] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [apiStatus, setApiStatus] = useState({ healthy: false, blockchain: false });
  const [snarkjsLoaded, setSnarkjsLoaded] = useState(false);

  const witnessCalculatorRef = useRef(null);

  // Dynamically load snarkjs
  useEffect(() => {
    const scriptId = 'snarkjs-script';
    if (document.getElementById(scriptId)) {
      if (window.snarkjs) setSnarkjsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = "https://cdn.jsdelivr.net/npm/snarkjs@0.7.3/build/snarkjs.min.js";
    script.async = true;
    script.onload = () => {
      console.log('snarkjs loaded successfully');
      setSnarkjsLoaded(true);
    };
    script.onerror = () => {
      console.error('Failed to load snarkjs script');
      setError("Critical error: Could not load ZK proof library. Please refresh the page.");
    };

    document.body.appendChild(script);

    return () => {
      const existingScript = document.getElementById(scriptId);
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        const data = await response.json();
        setApiStatus({
          healthy: data.status === 'healthy',
          blockchain: data.blockchain === 'connected'
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setApiStatus({ healthy: false, blockchain: false });
      }
    };
    checkHealth();
  }, []);

  // Fetch puzzle when difficulty changes
  const fetchPuzzle = useCallback(async (selectedDifficulty) => {
    setLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors([]);

    try {
      const response = await fetch(`${API_BASE_URL}/sudoku?difficulty=${selectedDifficulty}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch puzzle: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.puzzle || !data.solution || !data.clueFlags) {
        throw new Error('Invalid puzzle data received from server');
      }

      setPuzzle(data.puzzle);
      setSolution(data.puzzle.map(v => (v > 0 ? v.toString() : '')));
      setCompleteSolution(data.solution); // Store the complete solution
      setClueFlags(data.clueFlags);
      setStep(2);
      setSuccess(`Generated ${data.difficulty} puzzle with ${data.clues} clues`);

    } catch (error) {
      console.error('Error fetching puzzle:', error);
      setError(`Failed to generate puzzle: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // Validate solution
  const validateSolution = useCallback(async (solutionArray) => {
    try {
      const response = await fetch(`${API_BASE_URL}/validate-solution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ puzzle, solution: solutionArray })
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Validation error:', error);
      return { valid: false, error: 'Validation failed' };
    }
  }, [puzzle]);

  // Handle solution change with validation
  const handleSolutionChange = useCallback((idx, val) => {
    const newSolution = [...solution];
    newSolution[idx] = val.replace(/[^1-9]/g, '');
    setSolution(newSolution);

    // Clear validation errors for this cell
    setValidationErrors(prev => prev.filter(i => i !== idx));
  }, [solution]);

  // Load witness calculator
  const loadWitnessCalculator = useCallback(async () => {
    if (witnessCalculatorRef.current) {
      return witnessCalculatorRef.current;
    }

    try {
      const jsResp = await fetch('/witness_calculator.js');
      if (!jsResp.ok) throw new Error('witness_calculator.js not found');

      const code = await jsResp.text();
      const module = { exports: {} };
      const wrapper = new Function('module', 'exports', code + '\nreturn module.exports;');
      const exported = wrapper(module, module.exports);

      if (typeof exported !== 'function') {
        throw new Error('Unexpected witness_calculator export');
      }

      witnessCalculatorRef.current = exported;
      return exported;
    } catch (error) {
      throw new Error(`Failed to load witness calculator: ${error.message}`);
    }
  }, []);

  // Generate witness
  const handleGenerateWitness = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setValidationErrors([]);

    try {
      const solutionArray = solution.map(Number);

      const validation = await validateSolution(solutionArray);
      if (!validation.valid) {
        setError(`Invalid solution: ${validation.error}`);
        return;
      }

      for (let i = 0; i < 81; i++) {
        if (puzzle[i] > 0 && puzzle[i] !== solutionArray[i]) {
          setValidationErrors([i]);
          setError(`Solution doesn't match puzzle clue at position ${i + 1}`);
          return;
        }
      }

      const input = {
        unsolved: puzzle,
        clueFlags,
        solved: solutionArray
      };

      const wasmResp = await fetch('/sudoku.wasm');
      if (!wasmResp.ok) throw new Error('sudoku.wasm not found');
      const wasmBuffer = await wasmResp.arrayBuffer();

      const buildWC = await loadWitnessCalculator();
      const wc = await buildWC(new Uint8Array(wasmBuffer));
      const wtns = await wc.calculateWTNSBin(input, 0);

      setWitness(wtns);
      setCircuitInput(input);
      setStep(4); // Move to step 4 (Generate Proof)
      setSuccess('Witness generated successfully');

    } catch (error) {
      console.error('Witness generation failed:', error);
      setError(`Witness generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [puzzle, solution, clueFlags, validateSolution, loadWitnessCalculator]);

  // Generate proof
  const handleGenerateProof = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const snarkjs = window.snarkjs;
      if (!snarkjs) {
        throw new Error("snarkjs not found. Please ensure it's loaded correctly.");
      }

      if (!circuitInput) {
        throw new Error("Circuit input not found. Please generate witness first.");
      }

      const { proof, publicSignals } = await snarkjs.groth16.fullProve(
        circuitInput,
        '/sudoku.wasm',
        '/sudoku.zkey'
      );

      if (!publicSignals || publicSignals.length !== 162) {
        throw new Error(`Invalid public signals length: Expected 162, got ${publicSignals?.length}`);
      }

      const formattedProof = {
        a: [proof.pi_a[0].toString(), proof.pi_a[1].toString()],
        b: [
          [proof.pi_b[0][1].toString(), proof.pi_b[0][0].toString()],
          [proof.pi_b[1][1].toString(), proof.pi_b[1][0].toString()]
        ],
        c: [proof.pi_c[0].toString(), proof.pi_c[1].toString()]
      };

      setProofData({
        ...formattedProof,
        publicSignals: publicSignals.map(ps => ps.toString()),
        unsolved: circuitInput.unsolved,
        clueFlags: circuitInput.clueFlags
      });
      setStep(5); // Move to step 5 (Submit Proof)
      setSuccess('Proof generated successfully');

    } catch (error) {
      console.error('Proof generation failed:', error);
      setError(`Proof generation failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [circuitInput]);

  // Submit proof
  const handleSubmitProof = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (!proofData) {
        throw new Error("Proof data is not available. Please generate a proof first.");
      }
      const payload = {
        a: proofData.a,
        b: proofData.b,
        c: proofData.c,
        publicSignals: proofData.publicSignals,
        unsolved: proofData.unsolved,
        clueFlags: proofData.clueFlags,
        solution: solution.map(Number)
      };

      const response = await fetch(`${API_BASE_URL}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "An unknown error occurred during submission.");
      }

      setTxHash(data.txHash);
      setProofRecord(data);
      setStep(6); // Move to step 6 (View Record)
      setSuccess('Proof submitted successfully to blockchain');

    } catch (error) {
      console.error('Proof submission failed:', error);
      setError(`Proof submission failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [proofData, solution]);

  // Reset state
  const resetState = () => {
    setStep(1);
    setError('');
    setSuccess('');
    setTxHash('');
    setProofData(null);
    setValidationErrors([]);
    setSolution(Array(81).fill(''));
    setPuzzle(Array(81).fill(0));
    setClueFlags(Array(81).fill(0));
    setCompleteSolution(Array(81).fill(0));
    setCircuitInput(null);
  };

  // Auto-fill solution (for testing)
  const handleAutoFill = useCallback(() => {
    if (completeSolution.some(cell => cell > 0)) {
      const solutionArray = completeSolution.map(cell => cell.toString());
      setSolution(solutionArray);
      setSuccess('Auto-filled with complete solution');
    } else {
      setError('No solution available for auto-fill');
    }
  }, [completeSolution]);

  const solutionIncomplete = solution.some(v => !/^[1-9]$/.test(String(v)));

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h4 className="text-2xl font-bold mb-4">Step 1: Select Difficulty</h4>
            <DifficultySelector
              selectedDifficulty={difficulty}
              onDifficultyChange={setDifficulty}
              disabled={loading}
            />
            <div className="flex gap-4">
              <ActionButton
                onClick={() => fetchPuzzle(difficulty)}
                disabled={loading}
                loading={loading}
              >
                Generate New Puzzle
              </ActionButton>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h4 className="text-2xl font-bold mb-4">Step 2: Solve the Puzzle</h4>
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Fill in the empty cells with numbers 1-9.
              </p>
              <div className="flex gap-2 mb-4">
                <ActionButton onClick={handleAutoFill} variant="secondary" disabled={loading}>
                  Auto-Fill (Testing)
                </ActionButton>
                <ActionButton onClick={() => fetchPuzzle(difficulty)} variant="secondary" disabled={loading}>
                  New Puzzle
                </ActionButton>
              </div>
            </div>
            <SudokuGrid
              puzzle={puzzle}
              solution={solution}
              onCellChange={handleSolutionChange}
              disabled={loading}
              errors={validationErrors}
            />
            <div className="mt-6 flex gap-4">
              <ActionButton
                onClick={() => setStep(3)}
                disabled={loading || solutionIncomplete}
              >
                Next: Generate Witness
              </ActionButton>
            </div>
            {solutionIncomplete && (
              <div className="mt-4 p-3 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded-lg">
                <strong>Warning:</strong> All 81 cells must be filled with digits 1-9.
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div>
            <h4 className="text-2xl font-bold mb-4">Step 3: Generate Witness</h4>
            <p className="text-gray-600 mb-4">
              The next step is to generate a witness using your solved puzzle. This is a private input for the ZK circuit.
            </p>
            <ActionButton
              onClick={handleGenerateWitness}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Generating...' : 'Generate Witness'}
            </ActionButton>
          </div>
        );

      case 4:
        return (
          <div>
            <h4 className="text-2xl font-bold mb-4">Step 4: Generate Proof</h4>
            <p className="text-gray-600 mb-4">
              The witness has been generated. Now we'll create the zero-knowledge proof.
            </p>
            <ActionButton
              onClick={handleGenerateProof}
              disabled={loading || !snarkjsLoaded}
              loading={loading}
            >
              {loading ? 'Generating Proof...' : !snarkjsLoaded ? 'Loading ZK Library...' : 'Generate ZK Proof'}
            </ActionButton>
            {circuitInput && (
              <DataDisplayCard
                title="Proof Generation Input"
                description="This is the data fed into the circuit to generate the proof."
                data={circuitInput}
              />
            )}
          </div>
        );

      case 5:
        return (
          <div>
            <h4 className="text-2xl font-bold mb-4">Step 5: Submit Proof to Blockchain</h4>
            <p className="text-gray-600 mb-4">
              The proof will now be submitted to the blockchain for on-chain verification.
            </p>
            <ActionButton
              onClick={handleSubmitProof}
              disabled={loading}
              loading={loading}
            >
              {loading ? 'Submitting...' : 'Submit to Blockchain'}
            </ActionButton>
            {proofData && (
              <DataDisplayCard
                title="Proof & Public Signals"
                description="This is the formatted proof and public data that will be sent to the smart contract."
                data={proofData}
              />
            )}
          </div>
        );

      case 6:
        return (
          <div>
            <h4 className="text-2xl font-bold mb-4">Step 6: Verification Complete</h4>
            <p className="text-gray-600 mb-4">
              Your proof has been successfully verified and recorded on the blockchain!
            </p>
            <div className="flex gap-4">
              <ActionButton onClick={resetState}>
                Start Over
              </ActionButton>
              <ActionButton onClick={() => fetchPuzzle(difficulty)} variant="secondary">
                New Puzzle
              </ActionButton>
            </div>
            {proofRecord && (
              <DataDisplayCard
                title="On-Chain Transaction Details"
                description="The backend confirmed the transaction was successful."
                data={proofRecord}
              />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen font-sans">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800">Dynamic Sudoku ZKP Verifier</h1>
          <p className="text-gray-600">
            Generate, solve, and prove Sudoku solutions using zero-knowledge proofs on the blockchain.
          </p>
          <div className="mt-2 flex gap-4 text-sm">
            <span className={`px-2 py-1 rounded ${apiStatus.healthy ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              API: {apiStatus.healthy ? 'Connected' : 'Disconnected'}
            </span>
            <span className={`px-2 py-1 rounded ${apiStatus.blockchain ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
              Blockchain: {apiStatus.blockchain ? 'Connected' : 'Offline'}
            </span>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4 flex flex-col md:flex-row gap-8 items-start">
        <StepIndicator currentStep={step} />
        <main className="flex-1 bg-white p-6 rounded-lg shadow-md w-full">
          <StatusDisplay error={error} loading={loading} txHash={txHash} success={success} />
          {renderStepContent()}
        </main>
      </div>
    </div>
  );
}

export default App;

