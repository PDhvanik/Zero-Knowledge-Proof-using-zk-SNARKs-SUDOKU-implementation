// Configuration file for Sudoku ZKP project
// Copy this to config.js and update with your values

module.exports = {
   // Blockchain Configuration
   blockchain: {
      rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
      verifierAddress: process.env.VERIFIER_CONTRACT_ADDRESS || '',
      consumerAddress: process.env.CONSUMER_CONTRACT_ADDRESS || '',
      gasLimit: 5000000,
      gasPrice: '20000000000' // 20 gwei
   },

   // Server Configuration
   server: {
      port: process.env.PORT || 5000,
      clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
      rateLimit: {
         windowMs: 15 * 60 * 1000, // 15 minutes
         max: 100 // requests per window
      }
   },

   // Client Configuration
   client: {
      apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api'
   },

   // Sudoku Configuration
   sudoku: {
      difficulties: ['easy', 'medium', 'hard', 'expert'],
      maxPuzzlesPerRequest: 20,
      defaultDifficulty: 'medium'
   }
};
