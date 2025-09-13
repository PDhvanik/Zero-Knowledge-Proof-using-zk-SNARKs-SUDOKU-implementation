#!/usr/bin/env node

/**
 * Dependency Update Script
 * Checks for outdated packages and provides update commands
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for outdated dependencies...\n');

// Check root package.json
console.log('📦 Root package.json:');
try {
   const rootOutdated = execSync('npm outdated --json', { cwd: process.cwd(), encoding: 'utf8' });
   const rootData = JSON.parse(rootOutdated);

   if (Object.keys(rootData).length === 0) {
      console.log('✅ All dependencies are up to date!\n');
   } else {
      console.log('📋 Outdated packages:');
      Object.entries(rootData).forEach(([pkg, info]) => {
         console.log(`  ${pkg}: ${info.current} → ${info.latest}`);
      });
      console.log('\n💡 To update: npm update\n');
   }
} catch (error) {
   console.log('ℹ️  No outdated packages found or error checking root dependencies\n');
}

// Check client package.json
console.log('📦 Client package.json:');
try {
   const clientOutdated = execSync('npm outdated --json', { cwd: path.join(process.cwd(), 'client'), encoding: 'utf8' });
   const clientData = JSON.parse(clientOutdated);

   if (Object.keys(clientData).length === 0) {
      console.log('✅ All client dependencies are up to date!\n');
   } else {
      console.log('📋 Outdated client packages:');
      Object.entries(clientData).forEach(([pkg, info]) => {
         console.log(`  ${pkg}: ${info.current} → ${info.latest}`);
      });
      console.log('\n💡 To update client: cd client && npm update\n');
   }
} catch (error) {
   console.log('ℹ️  No outdated packages found or error checking client dependencies\n');
}

console.log('🚀 Update commands:');
console.log('  npm update                    # Update root dependencies');
console.log('  cd client && npm update      # Update client dependencies');
console.log('  npm install                   # Install any new dependencies');
console.log('  npm run dev                   # Start development server');
