pragma circom 2.2.2;

// Optimized Sudoku zk-SNARK circuit.
// Public inputs: unsolved[81] (0 blank), clueFlags[81] (1 if clue else 0)
// Private inputs (witness): solved[81]

// helper index function
function idx(i, j) {
    return i * 9 + j;
}

template InRange1to9() {
    signal input in;
    // Polynomial (x-1)(x-2)...(x-9) == 0 forces in ∈ {1..9}
    signal t[8];
    t[0] <== in - 1;
    t[1] <== t[0] * (in - 2);
    t[2] <== t[1] * (in - 3);
    t[3] <== t[2] * (in - 4);
    t[4] <== t[3] * (in - 5);
    t[5] <== t[4] * (in - 6);
    t[6] <== t[5] * (in - 7);
    t[7] <== t[6] * (in - 8);
    (t[7] * (in - 9)) === 0;
}

template SudokuCircuit() {
    // Public
    signal input unsolved[81];
    signal input clueFlags[81];

    // Solved is provided as input to this component (the top-level may provide it as a private witness)
    signal input solved[81];

    // Range constraints using components
    component rangeComp[81];
    for (var i = 0; i < 81; i++) {
        rangeComp[i] = InRange1to9();
        rangeComp[i].in <== solved[i];
    }

    // Clue constraints:
    for (var c = 0; c < 81; c++) {
        (solved[c] - unsolved[c]) * clueFlags[c] === 0;
        clueFlags[c] * (clueFlags[c] - 1) === 0;
        unsolved[c] * (clueFlags[c] - 1) === 0;
    }

    // Helper constants
    var TARGET_SUM = 45;     // 1+..+9
    var TARGET_SQ_SUM = 285; // 1^2+..+9^2

    //
    // ROWS: accumulator chain to avoid multiple assignments
    //
    signal rowSum[9];
    signal rowSqSum[9];
    signal acc[9][9];
    signal accSq[9][9];

    for (var row = 0; row < 9; row++) {
        acc[row][0] <== solved[idx(row, 0)];
        accSq[row][0] <== solved[idx(row, 0)] * solved[idx(row, 0)];
        for (var c = 1; c < 9; c++) {
            acc[row][c] <== acc[row][c - 1] + solved[idx(row, c)];
            accSq[row][c] <== accSq[row][c - 1] + solved[idx(row, c)] * solved[idx(row, c)];
        }
        rowSum[row] <== acc[row][8];
        rowSqSum[row] <== accSq[row][8];
        rowSum[row] === TARGET_SUM;
        rowSqSum[row] === TARGET_SQ_SUM;
    }

    //
    // COLUMNS: accumulator chain per column
    //
    signal colSum[9];
    signal colSqSum[9];
    signal accC[9][9];
    signal accCSq[9][9];

    for (var col = 0; col < 9; col++) {
        accC[col][0] <== solved[idx(0, col)];
        accCSq[col][0] <== solved[idx(0, col)] * solved[idx(0, col)];
        for (var r2 = 1; r2 < 9; r2++) {
            accC[col][r2] <== accC[col][r2 - 1] + solved[idx(r2, col)];
            accCSq[col][r2] <== accCSq[col][r2 - 1] + solved[idx(r2, col)] * solved[idx(r2, col)];
        }
        colSum[col] <== accC[col][8];
        colSqSum[col] <== accCSq[col][8];
        colSum[col] === TARGET_SUM;
        colSqSum[col] === TARGET_SQ_SUM;
    }

    //
    // BOXES (3x3): explicit nested loops and index calculation
    //
    signal boxSum[9];
    signal boxSqSum[9];
    signal accB[9][9];
    signal accBSq[9][9];

    for (var br = 0; br < 3; br++) {
        for (var bc = 0; bc < 3; bc++) {
            var boxIndex = br * 3 + bc;
            var rr = br * 3;
            var cc = bc * 3;
            for (var dr = 0; dr < 3; dr++) {
                for (var dc = 0; dc < 3; dc++) {
                    var kIndex = dr * 3 + dc;
                    var r = rr + dr;
                    var c = cc + dc;
                    if (kIndex == 0) {
                        accB[boxIndex][0] <== solved[idx(r, c)];
                        accBSq[boxIndex][0] <== solved[idx(r, c)] * solved[idx(r, c)];
                    } else {
                        accB[boxIndex][kIndex] <== accB[boxIndex][kIndex - 1] + solved[idx(r, c)];
                        accBSq[boxIndex][kIndex] <== accBSq[boxIndex][kIndex - 1] + solved[idx(r, c)] * solved[idx(r, c)];
                    }
                }
            }
            boxSum[boxIndex] <== accB[boxIndex][8];
            boxSqSum[boxIndex] <== accBSq[boxIndex][8];
            boxSum[boxIndex] === TARGET_SUM;
            boxSqSum[boxIndex] === TARGET_SQ_SUM;
        }
    }
}

// Top-level main:
template SudokuMain() {
    // public inputs
    signal input unsolved[81];
    signal input clueFlags[81];

    // private witness (the solved puzzle)
    signal input solved[81];

    // instantiate Sudoku logic (solved is an input to the component)
    component sudoku = SudokuCircuit();
    for (var i = 0; i < 81; i++) {
        sudoku.unsolved[i] <== unsolved[i];
        sudoku.clueFlags[i] <== clueFlags[i];
        sudoku.solved[i] <== solved[i];
    }

    // Uncomment to expose solved as public outputs (for testing only)
    // for (var i = 0; i < 81; i++) {
    //     signal output solvedOut[i];
    //     solvedOut[i] <== solved[i];
    // }
}


component main {
    // PUBLIC inputs are declared as inputs here.
    public [unsolved, clueFlags]
}= SudokuMain();