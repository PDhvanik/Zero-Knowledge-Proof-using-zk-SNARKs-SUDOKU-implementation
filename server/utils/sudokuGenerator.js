/**
 * Advanced Sudoku Generator with proper validation
 * Generates valid Sudoku puzzles with configurable difficulty levels
 */

class SudokuGenerator {
   constructor() {
      this.grid = Array(9).fill().map(() => Array(9).fill(0));
      this.solution = Array(9).fill().map(() => Array(9).fill(0));
   }

   /**
    * Generate a complete valid Sudoku solution
    */
   generateSolution() {
      this.solution = Array(9).fill().map(() => Array(9).fill(0));

      // Fill diagonal 3x3 boxes first (they are independent)
      for (let i = 0; i < 9; i += 3) {
         this.fillBox(i, i);
      }

      // Fill remaining cells
      this.solveRemaining(0, 0);

      return this.solution.map(row => [...row]);
   }

   /**
    * Fill a 3x3 box with random valid numbers
    */
   fillBox(row, col) {
      const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
      let index = 0;

      for (let i = 0; i < 3; i++) {
         for (let j = 0; j < 3; j++) {
            this.solution[row + i][col + j] = nums[index++];
         }
      }
   }

   /**
    * Solve remaining cells using backtracking
    */
   solveRemaining(row, col) {
      if (col === 9) {
         row++;
         col = 0;
      }

      if (row === 9) {
         return true;
      }

      if (this.solution[row][col] !== 0) {
         return this.solveRemaining(row, col + 1);
      }

      const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

      for (const num of nums) {
         if (this.isValid(this.solution, row, col, num)) {
            this.solution[row][col] = num;
            if (this.solveRemaining(row, col + 1)) {
               return true;
            }
            this.solution[row][col] = 0;
         }
      }

      return false;
   }

   /**
    * Check if a number can be placed at given position
    */
   isValid(grid, row, col, num) {
      // Check row
      for (let x = 0; x < 9; x++) {
         if (grid[row][x] === num) return false;
      }

      // Check column
      for (let x = 0; x < 9; x++) {
         if (grid[x][col] === num) return false;
      }

      // Check 3x3 box
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;

      for (let i = 0; i < 3; i++) {
         for (let j = 0; j < 3; j++) {
            if (grid[startRow + i][startCol + j] === num) return false;
         }
      }

      return true;
   }

   /**
    * Generate puzzle by removing numbers from solution
    */
   generatePuzzle(difficulty = 'medium') {
      const solution = this.generateSolution();
      const puzzle = solution.map(row => [...row]);

      // Determine number of cells to remove based on difficulty
      const difficultyLevels = {
         easy: 40,
         medium: 50,
         hard: 60,
         expert: 70
      };

      const cellsToRemove = difficultyLevels[difficulty] || 50;
      const positions = this.shuffleArray(Array.from({ length: 81 }, (_, i) => i));

      // Remove cells ensuring unique solution
      let removed = 0;
      for (const pos of positions) {
         if (removed >= cellsToRemove) break;

         const row = Math.floor(pos / 9);
         const col = pos % 9;
         const originalValue = puzzle[row][col];

         puzzle[row][col] = 0;

         // Check if puzzle still has unique solution
         if (this.countSolutions(puzzle) === 1) {
            removed++;
         } else {
            // Restore if not unique
            puzzle[row][col] = originalValue;
         }
      }

      return {
         puzzle: puzzle.flat(),
         solution: solution.flat(),
         difficulty,
         clues: 81 - removed
      };
   }

   /**
    * Count number of solutions (for uniqueness check)
    */
   countSolutions(grid) {
      const flatGrid = grid.flat();
      let count = 0;

      const solve = (index) => {
         if (index === 81) {
            count++;
            return count < 2; // Stop after finding 2 solutions
         }

         const row = Math.floor(index / 9);
         const col = index % 9;

         if (flatGrid[index] !== 0) {
            return solve(index + 1);
         }

         for (let num = 1; num <= 9; num++) {
            if (this.isValidFlat(flatGrid, row, col, num)) {
               flatGrid[index] = num;
               if (!solve(index + 1)) return false;
               flatGrid[index] = 0;
            }
         }

         return true;
      };

      solve(0);
      return count;
   }

   /**
    * Check validity for flat array representation
    */
   isValidFlat(grid, row, col, num) {
      // Check row
      for (let x = 0; x < 9; x++) {
         if (grid[row * 9 + x] === num) return false;
      }

      // Check column
      for (let x = 0; x < 9; x++) {
         if (grid[x * 9 + col] === num) return false;
      }

      // Check 3x3 box
      const startRow = Math.floor(row / 3) * 3;
      const startCol = Math.floor(col / 3) * 3;

      for (let i = 0; i < 3; i++) {
         for (let j = 0; j < 3; j++) {
            if (grid[(startRow + i) * 9 + startCol + j] === num) return false;
         }
      }

      return true;
   }

   /**
    * Validate a complete Sudoku solution
    */
   validateSolution(grid) {
      const flatGrid = Array.isArray(grid[0]) ? grid.flat() : grid;

      // Check all cells are filled
      if (flatGrid.length !== 81 || flatGrid.some(cell => cell < 1 || cell > 9)) {
         return { valid: false, error: 'Invalid cell values' };
      }

      // Check rows
      for (let row = 0; row < 9; row++) {
         const rowSet = new Set();
         for (let col = 0; col < 9; col++) {
            const num = flatGrid[row * 9 + col];
            if (rowSet.has(num)) {
               return { valid: false, error: `Duplicate in row ${row + 1}` };
            }
            rowSet.add(num);
         }
      }

      // Check columns
      for (let col = 0; col < 9; col++) {
         const colSet = new Set();
         for (let row = 0; row < 9; row++) {
            const num = flatGrid[row * 9 + col];
            if (colSet.has(num)) {
               return { valid: false, error: `Duplicate in column ${col + 1}` };
            }
            colSet.add(num);
         }
      }

      // Check 3x3 boxes
      for (let box = 0; box < 9; box++) {
         const boxSet = new Set();
         const startRow = Math.floor(box / 3) * 3;
         const startCol = (box % 3) * 3;

         for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
               const num = flatGrid[(startRow + i) * 9 + startCol + j];
               if (boxSet.has(num)) {
                  return { valid: false, error: `Duplicate in box ${box + 1}` };
               }
               boxSet.add(num);
            }
         }
      }

      return { valid: true };
   }

   /**
    * Generate clue flags for a puzzle
    */
   generateClueFlags(puzzle) {
      return puzzle.map(cell => cell > 0 ? 1 : 0);
   }

   /**
    * Utility function to shuffle array
    */
   shuffleArray(array) {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
         const j = Math.floor(Math.random() * (i + 1));
         [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
   }

   /**
    * Generate multiple puzzles for testing
    */
   generateMultiplePuzzles(count = 5, difficulty = 'medium') {
      const puzzles = [];
      for (let i = 0; i < count; i++) {
         puzzles.push(this.generatePuzzle(difficulty));
      }
      return puzzles;
   }
}

module.exports = SudokuGenerator;
