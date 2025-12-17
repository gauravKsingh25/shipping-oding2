const mongoose = require('mongoose');
const FreightCalculationService = require('../services/freightCalculationService');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Test cases with different weight scenarios
const testCases = [
  {
    name: 'Case 1: Actual Weight > Volumetric Weight',
    shipment: {
      providerName: 'Gatti Cargo',
      weight: 25, // Heavy
      length: 30,
      width: 20,
      height: 15, // Small box
      state: 'Maharashtra',
      invoiceValue: 10000
    },
    expectedWeight: 'actual' // Should use actual weight (25 kg)
  },
  {
    name: 'Case 2: Volumetric Weight > Actual Weight',
    shipment: {
      providerName: 'Gatti Cargo',
      weight: 2, // Very light
      length: 100,
      width: 80,
      height: 60, // Large box
      state: 'Maharashtra',
      invoiceValue: 5000
    },
    expectedWeight: 'volumetric' // Should use volumetric weight
  },
  {
    name: 'Case 3: Minimum Weight Applied',
    shipment: {
      providerName: 'Gatti Cargo',
      weight: 1, // Below minimum
      length: 10,
      width: 10,
      height: 10, // Tiny box
      state: 'Delhi',
      invoiceValue: 2000
    },
    expectedWeight: 'minimum' // Should use minimum 6 kg
  },
  {
    name: 'Case 4: High Volumetric (Trackon - Low Divisor)',
    shipment: {
      providerName: 'Trackon Courier',
      weight: 5,
      length: 50,
      width: 40,
      height: 30,
      state: 'Karnataka',
      invoiceValue: 8000
    },
    expectedWeight: 'volumetric' // Trackon has divisor 4500, so volumetric will be higher
  },
  {
    name: 'Case 5: V Trans with 30kg Minimum',
    shipment: {
      providerName: 'V Trans',
      weight: 15, // Below minimum
      length: 40,
      width: 30,
      height: 25,
      state: 'Gujarat',
      invoiceValue: 12000
    },
    expectedWeight: 'minimum' // V Trans minimum is 30 kg
  }
];

async function runTest() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 FREIGHT CALCULATION LOGIC TEST');
    console.log('   Testing Weight Selection Logic (Actual vs Volumetric vs Minimum)');
    console.log('='.repeat(80));

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('\n✅ Connected to MongoDB\n');

    let passedTests = 0;
    let failedTests = 0;

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      
      console.log('\n' + '━'.repeat(80));
      console.log(`\n🧪 ${testCase.name}`);
      console.log('─'.repeat(80));
      
      const result = await FreightCalculationService.calculateFreight(testCase.shipment);

      if (result.success) {
        const weightUsed = result.weightCalculation.weightUsed;
        const isCorrect = weightUsed === testCase.expectedWeight;

        console.log(`\n📊 Result Summary:`);
        console.log(`  Expected Weight Type: ${testCase.expectedWeight.toUpperCase()}`);
        console.log(`  Actual Weight Type: ${weightUsed.toUpperCase()}`);
        console.log(`  Test Status: ${isCorrect ? '✅ PASSED' : '❌ FAILED'}`);

        if (isCorrect) {
          passedTests++;
        } else {
          failedTests++;
          console.log(`\n  ⚠️  Expected to use ${testCase.expectedWeight} weight but used ${weightUsed}!`);
        }

        console.log(`\n  Weight Details:`);
        console.log(`    Actual: ${result.weightCalculation.actualWeight} kg`);
        console.log(`    Volumetric: ${result.weightCalculation.volumetricWeight} kg`);
        console.log(`    Minimum: ${result.weightCalculation.minimumWeight} kg`);
        console.log(`    Chargeable: ${result.weightCalculation.chargeableWeight} kg (${weightUsed})`);
        console.log(`\n  Final Charges:`);
        console.log(`    Base Freight: ₹${result.charges.baseFreight}`);
        console.log(`    Grand Total: ₹${result.charges.grandTotal}`);

      } else {
        console.log(`\n❌ Test Failed: ${result.error}`);
        failedTests++;
      }
    }

    // Final Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${testCases.length}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / testCases.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    if (failedTests === 0) {
      console.log('\n🎉 All tests passed! Weight selection logic is working correctly.\n');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the weight calculation logic.\n');
    }

  } catch (error) {
    console.error('\n❌ Test Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed\n');
  }
}

// Run the test
runTest();
