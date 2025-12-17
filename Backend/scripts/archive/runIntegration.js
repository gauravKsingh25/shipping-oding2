#!/usr/bin/env node

/**
 * Excel Data Integration Runner
 * This script integrates the parsed Excel data into the shipping database
 */

const path = require('path');
require('dotenv').config();

// Import the integration class
const ExcelDataIntegrator = require('./integrateExcelData');

async function runIntegration() {
  console.log('🚀 Starting Excel Data Integration Process...\n');
  console.log('This will:');
  console.log('  ✅ Parse Excel data from JSON file');
  console.log('  ✅ Map courier names to providers');
  console.log('  ✅ Extract state-wise pricing');
  console.log('  ✅ Handle special charges (Green Tax, etc.)');
  console.log('  ✅ Update database with new data');
  console.log('  ✅ Generate integration report');
  console.log('\n' + '='.repeat(50) + '\n');

  const integrator = new ExcelDataIntegrator();
  
  try {
    const success = await integrator.run();
    
    if (success) {
      console.log('\n🎉 Integration completed successfully!');
      console.log('\nNext steps:');
      console.log('  1. Restart your backend server to ensure all changes are loaded');
      console.log('  2. Test the pricing calculations in the frontend');
      console.log('  3. Verify special charges are being applied correctly');
      process.exit(0);
    } else {
      console.log('\n❌ Integration failed. Check the logs above for details.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Integration failed with error:', error);
    console.error('\nStack trace:', error.stack);
    process.exit(1);
  }
}

// Handle process interruption
process.on('SIGINT', () => {
  console.log('\n\n⚠️ Integration interrupted by user');
  console.log('Database may be in an incomplete state');
  process.exit(1);
});

// Run the integration
runIntegration();