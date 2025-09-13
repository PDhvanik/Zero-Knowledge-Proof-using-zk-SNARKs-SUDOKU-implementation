#!/usr/bin/env node

/**
 * Test Web3 connection and initialization
 */

const { Web3 } = require('web3');

console.log('🔍 Testing Web3 initialization...\n');

try {
   // Test Web3 constructor
   console.log('✅ Web3 constructor available');

   // Test Web3 instance creation
   const web3 = new Web3('http://localhost:8545');
   console.log('✅ Web3 instance created');

   // Test connection (this will fail if no blockchain running)
   console.log('🔗 Testing blockchain connection...');

   web3.eth.getChainId()
      .then(chainId => {
         console.log(`✅ Connected to blockchain (Chain ID: ${chainId})`);
         console.log('🎉 Web3 is working correctly!');
      })
      .catch(error => {
         console.log('⚠️  Blockchain not running or connection failed:');
         console.log(`   ${error.message}`);
         console.log('💡 Start Ganache or local blockchain to test full functionality');
      });

} catch (error) {
   console.log('❌ Web3 initialization failed:');
   console.log(`   ${error.message}`);
   console.log('💡 Check Web3 installation: npm list web3');
}
