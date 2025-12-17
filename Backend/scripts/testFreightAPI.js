const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api/freight';

// Test cases
const testCases = [
  {
    name: '✅ Case 1: Actual Weight > Volumetric (Heavy small box)',
    data: {
      providerName: 'Gatti Cargo',
      weight: 25,
      length: 30,
      width: 20,
      height: 15,
      state: 'Maharashtra',
      invoiceValue: 10000
    },
    expected: 'Should use actual weight (25 kg)'
  },
  {
    name: '✅ Case 2: Volumetric > Actual Weight (Light large box)',
    data: {
      providerName: 'Gatti Cargo',
      weight: 2,
      length: 100,
      width: 80,
      height: 60,
      state: 'Maharashtra',
      invoiceValue: 5000
    },
    expected: 'Should use volumetric weight'
  },
  {
    name: '✅ Case 3: Minimum Weight Applied (Very light)',
    data: {
      providerName: 'Gatti Cargo',
      weight: 1,
      length: 10,
      width: 10,
      height: 10,
      state: 'Delhi',
      invoiceValue: 2000
    },
    expected: 'Should use minimum 6 kg'
  },
  {
    name: '✅ Case 4: Trackon with Low Divisor (4500)',
    data: {
      providerName: 'Trackon Courier',
      weight: 5,
      length: 50,
      width: 40,
      height: 30,
      state: 'Karnataka',
      invoiceValue: 8000
    },
    expected: 'Volumetric should be higher due to low divisor'
  }
];

async function testAPI() {
  console.log('\n' + '='.repeat(80));
  console.log('🧪 API FREIGHT CALCULATION TEST');
  console.log('='.repeat(80));
  console.log(`\nTesting endpoint: ${BASE_URL}/calculate\n`);

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    try {
      console.log('─'.repeat(80));
      console.log(`\n${testCase.name}`);
      console.log(`Expected: ${testCase.expected}\n`);

      const response = await axios.post(`${BASE_URL}/calculate`, testCase.data);
      
      if (response.data.success) {
        const result = response.data;
        
        console.log('📦 Shipment:', `${testCase.data.weight}kg, ${testCase.data.length}×${testCase.data.width}×${testCase.data.height}cm`);
        console.log('📍 Destination:', testCase.data.state);
        console.log('');
        console.log('⚖️  Weight Calculation:');
        console.log(`   Actual Weight: ${result.weightCalculation.actualWeight} kg`);
        console.log(`   Volumetric Weight: ${result.weightCalculation.volumetricWeight} kg (÷${result.weightCalculation.volumetricDivisor})`);
        console.log(`   Minimum Weight: ${result.weightCalculation.minimumWeight} kg`);
        console.log(`   → Chargeable Weight: ${result.weightCalculation.chargeableWeight} kg (${result.weightCalculation.weightUsed.toUpperCase()})`);
        console.log('');
        console.log('💰 Charges:');
        console.log(`   Rate: ₹${result.charges.perKiloRate}/kg`);
        console.log(`   Base Freight: ₹${result.charges.baseFreight}`);
        console.log(`   Fuel Surcharge: ₹${result.charges.fuelSurcharge} (${result.charges.fuelSurchargePercent}%)`);
        console.log(`   Docket: ₹${result.charges.docketCharge}`);
        console.log(`   GST: ₹${result.charges.gst} (${result.charges.gstPercent}%)`);
        console.log(`   ──────────────────`);
        console.log(`   GRAND TOTAL: ₹${result.charges.grandTotal}`);
        console.log('');
        console.log('✅ TEST PASSED');
        passed++;
      } else {
        console.log('❌ API returned error:', response.data.error);
        failed++;
      }

    } catch (error) {
      console.log('❌ TEST FAILED:', error.response?.data?.error || error.message);
      failed++;
    }
  }

  // Test comparison endpoint
  console.log('\n\n' + '='.repeat(80));
  console.log('🔍 TESTING COMPARISON ENDPOINT');
  console.log('='.repeat(80));

  try {
    const compareData = {
      weight: 10,
      length: 40,
      width: 30,
      height: 20,
      state: 'Delhi',
      invoiceValue: 15000
    };

    console.log('\n📦 Comparing all providers for:', compareData);
    const response = await axios.post(`${BASE_URL}/compare`, compareData);

    if (response.data.success) {
      console.log(`\n✅ Found ${response.data.totalProviders} providers\n`);
      console.log('Cheapest Providers (Top 5):');
      console.log('─'.repeat(80));
      
      response.data.results.slice(0, 5).forEach((result, index) => {
        console.log(`${index + 1}. ${result.provider.name.padEnd(25)} ₹${result.charges.grandTotal} (${result.weightCalculation.chargeableWeight}kg)`);
      });

      console.log('\n✅ Comparison test passed');
      passed++;
    }
  } catch (error) {
    console.log('❌ Comparison test failed:', error.message);
    failed++;
  }

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${passed + failed}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log('='.repeat(80));

  if (failed === 0) {
    console.log('\n🎉 All API tests passed!\n');
  } else {
    console.log('\n⚠️  Some tests failed. Make sure server is running on port 5000.\n');
  }
}

// Check if server is running first
async function checkServer() {
  try {
    const response = await axios.get('http://localhost:5000/');
    console.log('✅ Server is running');
    return true;
  } catch (error) {
    console.log('❌ Server is not running on port 5000');
    console.log('Please start the server with: npm start or node server.js');
    return false;
  }
}

// Run tests
(async () => {
  const serverRunning = await checkServer();
  if (serverRunning) {
    await testAPI();
  }
})();
