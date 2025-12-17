const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function testInsuranceCalculation() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 INSURANCE CALCULATION TEST');
    console.log('='.repeat(80));

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('\n✅ Connected to MongoDB\n');

    const providers = await Provider.find({}).sort({ providerId: 1 });

    console.log('Current Insurance Percentage Values:\n');
    console.log('Provider'.padEnd(30) + 'Stored Value'.padEnd(20) + 'Calculation Test');
    console.log('─'.repeat(80));

    const testInvoiceValue = 10000; // ₹10,000 invoice

    for (const provider of providers) {
      const fixedCharges = await FixedCharges.findOne({ providerId: provider.providerId });
      
      if (fixedCharges) {
        const storedValue = fixedCharges.insuranceChargePercent;
        const calculatedInsurance = testInvoiceValue * storedValue;
        
        // Determine what percentage this represents
        const actualPercent = (calculatedInsurance / testInvoiceValue) * 100;
        
        console.log(
          provider.providerName.padEnd(30) +
          storedValue.toString().padEnd(20) +
          `₹${testInvoiceValue} × ${storedValue} = ₹${calculatedInsurance.toFixed(2)} (${actualPercent.toFixed(4)}%)`
        );
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📋 Expected Insurance Values from data.txt:');
    console.log('   Gatti Cargo: 100 (meaning ₹100 per ₹10,000 = 1%)');
    console.log('   TCI Transport: 0.001 (meaning 0.001%)');
    console.log('   V Trans: 0.0001 (meaning 0.0001%)');
    console.log('   Safexpress: 0.001 (meaning 0.001%)');

    console.log('\n📊 Analysis:');
    console.log('   If "100" means ₹100 per ₹10,000:');
    console.log('      → Should be stored as 0.01 (1%)');
    console.log('      → For ₹10,000 invoice: ₹10,000 × 0.01 = ₹100 ✓');
    console.log('');
    console.log('   If "0.001" means 0.001%:');
    console.log('      → Should be stored as 0.00001 (0.001/100)');
    console.log('      → For ₹10,000 invoice: ₹10,000 × 0.00001 = ₹0.10');
    console.log('');
    console.log('   If "0.001" means ₹0.001 per rupee (0.1%):');
    console.log('      → Should be stored as 0.001');
    console.log('      → For ₹10,000 invoice: ₹10,000 × 0.001 = ₹10.00');

    console.log('\n❗ Issue Found:');
    console.log('   The interpretation of insurance values is INCONSISTENT!');
    console.log('   Some are stored correctly, others need correction.');

    // Suggested corrections
    console.log('\n✅ Suggested Corrections:\n');
    
    const corrections = [
      { name: 'Gatti Cargo', current: 0.01, interpretation: '100/10000', correct: 0.01, reason: 'Correct (1%)' },
      { name: 'TCI Transport', current: 0.0001, interpretation: '0.001%', correct: 0.00001, reason: 'Should be 0.00001 (0.001%)' },
      { name: 'V Trans', current: 0.00001, interpretation: '0.0001%', correct: 0.000001, reason: 'Should be 0.000001 (0.0001%)' },
      { name: 'Vision Logistics', current: 0.00001, interpretation: '0.0001%', correct: 0.000001, reason: 'Should be 0.000001 (0.0001%)' },
      { name: 'Safexpress', current: 0.0001, interpretation: '0.001%', correct: 0.00001, reason: 'Should be 0.00001 (0.001%)' }
    ];

    corrections.forEach(c => {
      const status = c.current === c.correct ? '✅' : '❌';
      console.log(`${status} ${c.name.padEnd(25)} Current: ${c.current.toString().padEnd(12)} → Correct: ${c.correct.toString().padEnd(12)} (${c.reason})`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed\n');
  }
}

testInsuranceCalculation();
