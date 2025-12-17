const mongoose = require('mongoose');
const FreightCalculationService = require('../services/freightCalculationService');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function testFrontendInsurance() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 FRONTEND INSURANCE PRIORITY TEST');
    console.log('='.repeat(80));

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('\n✅ Connected to MongoDB\n');

    const baseShipment = {
      providerName: 'Gatti Cargo',
      weight: 10,
      length: 40,
      width: 30,
      height: 20,
      state: 'Maharashtra',
      invoiceValue: 10000, // ₹10,000 invoice value
      isCOD: false
    };

    let passedTests = 0;
    let totalTests = 0;

    // Test Case 1: Without insurance percent (use database value)
    totalTests++;
    console.log('━'.repeat(80));
    console.log(`\n🧪 Test Case ${totalTests}: Database Fallback (No Frontend Value)`);
    console.log('─'.repeat(80));
    console.log('Shipment: No insurancePercent provided');
    console.log('Invoice Value: ₹10,000');
    console.log('Expected: Should use database value (Gatti Cargo = 1%)\n');

    const result1 = await FreightCalculationService.calculateFreight(baseShipment);

    if (result1.success) {
      console.log('✅ Result:');
      console.log(`   Insurance Charge: ₹${result1.charges.insurance}`);
      console.log(`   Insurance Source: ${result1.charges.insuranceSource || 'database'}`);
      console.log(`   Calculation: ₹10,000 × 1% = ₹${result1.charges.insurance}`);
      
      const expected = 100;
      const actual = result1.charges.insurance;
      const source = result1.charges.insuranceSource || 'database';
      
      if (Math.abs(actual - expected) < 0.01 && source === 'database') {
        console.log('   ✅ PASSED - Using database value as expected');
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected ₹${expected} from database, got ₹${actual} from ${source}`);
      }
    } else {
      console.log('   ❌ FAILED - Calculation error:', result1.error);
    }

    // Test Case 2: With frontend insurance percent (1%)
    totalTests++;
    console.log('\n\n━'.repeat(80));
    console.log(`\n🧪 Test Case ${totalTests}: Frontend Override (1%)`);
    console.log('─'.repeat(80));
    console.log('Shipment: insurancePercent = 1 (1% from frontend)');
    console.log('Invoice Value: ₹10,000');
    console.log('Expected: ₹10,000 × 1% = ₹100 (from frontend)\n');

    const result2 = await FreightCalculationService.calculateFreight({
      ...baseShipment,
      insurancePercent: 1 // 1% from frontend
    });

    if (result2.success) {
      console.log('✅ Result:');
      console.log(`   Insurance Charge: ₹${result2.charges.insurance}`);
      console.log(`   Insurance Source: ${result2.charges.insuranceSource || 'unknown'}`);
      console.log(`   Frontend Value Used: ${result2.charges.insurancePercent || 1}%`);
      
      const expected = 100;
      const actual = result2.charges.insurance;
      const source = result2.charges.insuranceSource || 'unknown';
      
      if (Math.abs(actual - expected) < 0.01 && source === 'frontend') {
        console.log('   ✅ PASSED - Using frontend value as expected');
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected ₹${expected} from frontend, got ₹${actual} from ${source}`);
      }
    } else {
      console.log('   ❌ FAILED - Calculation error:', result2.error);
    }

    // Test Case 3: Different frontend value (0.5%)
    totalTests++;
    console.log('\n\n━'.repeat(80));
    console.log(`\n🧪 Test Case ${totalTests}: Frontend Override (0.5%)`);
    console.log('─'.repeat(80));
    console.log('Shipment: insurancePercent = 0.5 (0.5% from frontend)');
    console.log('Invoice Value: ₹10,000');
    console.log('Expected: ₹10,000 × 0.5% = ₹50 (from frontend)\n');

    const result3 = await FreightCalculationService.calculateFreight({
      ...baseShipment,
      insurancePercent: 0.5 // 0.5% from frontend
    });

    if (result3.success) {
      console.log('✅ Result:');
      console.log(`   Insurance Charge: ₹${result3.charges.insurance}`);
      console.log(`   Insurance Source: ${result3.charges.insuranceSource || 'unknown'}`);
      
      const expected = 50;
      const actual = result3.charges.insurance;
      const source = result3.charges.insuranceSource || 'unknown';
      
      if (Math.abs(actual - expected) < 0.01 && source === 'frontend') {
        console.log('   ✅ PASSED - Using frontend value (0.5%)');
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected ₹${expected} from frontend, got ₹${actual} from ${source}`);
      }
    } else {
      console.log('   ❌ FAILED - Calculation error:', result3.error);
    }

    // Test Case 4: Higher frontend value (2.5%)
    totalTests++;
    console.log('\n\n━'.repeat(80));
    console.log(`\n🧪 Test Case ${totalTests}: Frontend Override (2.5%)`);
    console.log('─'.repeat(80));
    console.log('Shipment: insurancePercent = 2.5 (2.5% from frontend)');
    console.log('Invoice Value: ₹10,000');
    console.log('Expected: ₹10,000 × 2.5% = ₹250 (from frontend)\n');

    const result4 = await FreightCalculationService.calculateFreight({
      ...baseShipment,
      insurancePercent: 2.5 // 2.5% from frontend
    });

    if (result4.success) {
      console.log('✅ Result:');
      console.log(`   Insurance Charge: ₹${result4.charges.insurance}`);
      console.log(`   Insurance Source: ${result4.charges.insuranceSource || 'unknown'}`);
      
      const expected = 250;
      const actual = result4.charges.insurance;
      const source = result4.charges.insuranceSource || 'unknown';
      
      if (Math.abs(actual - expected) < 0.01 && source === 'frontend') {
        console.log('   ✅ PASSED - Using frontend value (2.5%)');
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected ₹${expected} from frontend, got ₹${actual} from ${source}`);
      }
    } else {
      console.log('   ❌ FAILED - Calculation error:', result4.error);
    }

    // Test Case 5: Zero insurance (0%)
    totalTests++;
    console.log('\n\n━'.repeat(80));
    console.log(`\n🧪 Test Case ${totalTests}: No Insurance (0% from frontend)`);
    console.log('─'.repeat(80));
    console.log('Shipment: insurancePercent = 0 (0% from frontend)');
    console.log('Invoice Value: ₹10,000');
    console.log('Expected: ₹10,000 × 0% = ₹0\n');

    const result5 = await FreightCalculationService.calculateFreight({
      ...baseShipment,
      insurancePercent: 0 // 0% from frontend
    });

    if (result5.success) {
      console.log('✅ Result:');
      console.log(`   Insurance Charge: ₹${result5.charges.insurance}`);
      console.log(`   Insurance Source: ${result5.charges.insuranceSource || 'unknown'}`);
      
      const expected = 0;
      const actual = result5.charges.insurance;
      const source = result5.charges.insuranceSource || 'unknown';
      
      if (Math.abs(actual - expected) < 0.01 && source === 'frontend') {
        console.log('   ✅ PASSED - No insurance applied (frontend override)');
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected ₹${expected}, got ₹${actual} from ${source}`);
      }
    } else {
      console.log('   ❌ FAILED - Calculation error:', result5.error);
    }

    // Test Case 6: High value shipment
    totalTests++;
    console.log('\n\n━'.repeat(80));
    console.log(`\n🧪 Test Case ${totalTests}: High Value Shipment (₹1,00,000 with 1%)`);
    console.log('─'.repeat(80));
    console.log('Shipment: insurancePercent = 1 (1% from frontend)');
    console.log('Invoice Value: ₹1,00,000');
    console.log('Expected: ₹1,00,000 × 1% = ₹1,000\n');

    const result6 = await FreightCalculationService.calculateFreight({
      ...baseShipment,
      invoiceValue: 100000,
      insurancePercent: 1
    });

    if (result6.success) {
      console.log('✅ Result:');
      console.log(`   Insurance Charge: ₹${result6.charges.insurance}`);
      console.log(`   Insurance Source: ${result6.charges.insuranceSource || 'unknown'}`);
      
      const expected = 1000;
      const actual = result6.charges.insurance;
      const source = result6.charges.insuranceSource || 'unknown';
      
      if (Math.abs(actual - expected) < 0.01 && source === 'frontend') {
        console.log('   ✅ PASSED - High value calculation correct');
        passedTests++;
      } else {
        console.log(`   ❌ FAILED - Expected ₹${expected}, got ₹${actual} from ${source}`);
      }
    } else {
      console.log('   ❌ FAILED - Calculation error:', result6.error);
    }

    // Summary
    console.log('\n\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${totalTests - passedTests} ❌`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log('='.repeat(80));

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! Frontend insurance priority is working correctly!');
      console.log('\n✅ Key Features Verified:');
      console.log('   • Frontend insurance value takes priority over database');
      console.log('   • Database value used as fallback when no frontend value');
      console.log('   • Percentage conversion working correctly (1 = 1%)');
      console.log('   • Zero insurance handled properly');
      console.log('   • Insurance source tracking accurate');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
    }
    console.log('\n' + '='.repeat(80));

  } catch (error) {
    console.error('\n❌ Test Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed\n');
  }
}

testFrontendInsurance();
