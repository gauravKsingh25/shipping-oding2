const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Input from user's screenshot
const boxes = [
  { length: 55, breadth: 44, height: 33, weight: 6, qty: 3 }
];

const totalActual = boxes[0].weight * boxes[0].qty; // 18 kg

// Results shown in screenshot
const shownResults = {
  'DTDC Express Cargo': 20.00,
  'DP World': 18.00,
  'Gatti Cargo': 18.00,
  'V Trans': 30.00,
  'TCI Transport': 19.81,
  'Vision': 18.00,
  'Safexpress': 20.00,
  'Depee World': 53.24,
  'Trackon Courier': 47.92,
  'DTDC Courier': 50.44
};

async function verifyCalculations() {
  try {
    console.log('\n' + '='.repeat(100));
    console.log('🔍 VERIFICATION: User Input vs Calculated Results');
    console.log('='.repeat(100));
    console.log('\n📦 Input: 3 boxes of 55×44×33 cm, 6 kg each');
    console.log(`   Total Actual Weight: ${totalActual} kg`);
    console.log(`   Volume per box: ${boxes[0].length * boxes[0].breadth * boxes[0].height} cm³\n`);

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Courier'.padEnd(25) + 'Shown'.padEnd(12) + 'Expected'.padEnd(12) + 'Status'.padEnd(15) + 'Calculation');
    console.log('─'.repeat(100));

    for (const [courierName, shownWeight] of Object.entries(shownResults)) {
      const provider = await Provider.findOne({ providerName: courierName });
      if (provider) {
        const fixed = await FixedCharges.findOne({ providerId: provider.providerId });
        const divisor = fixed?.volumetricDivisor || 5000;
        const minWt = fixed?.minimumChargeableWeight || 0;

        const totalVol = (boxes[0].length * boxes[0].breadth * boxes[0].height * boxes[0].qty) / divisor;
        const expectedWeight = Math.max(totalActual, totalVol, minWt);

        const isCorrect = Math.abs(shownWeight - expectedWeight) < 0.1;
        const status = isCorrect ? '✅ CORRECT' : '❌ WRONG';

        const reason = expectedWeight === minWt ? 'min' : 
                      expectedWeight === totalVol ? 'vol' : 'actual';

        console.log(
          courierName.padEnd(25) +
          `${shownWeight.toFixed(2)} kg`.padEnd(12) +
          `${expectedWeight.toFixed(2)} kg`.padEnd(12) +
          status.padEnd(15) +
          `MAX(${totalActual}, ${totalVol.toFixed(2)}, ${minWt}) = ${expectedWeight.toFixed(2)} (${reason})`
        );
      }
    }

    console.log('\n' + '='.repeat(100));
    console.log('📊 DETAILED BREAKDOWN:');
    console.log('='.repeat(100) + '\n');

    for (const [courierName, shownWeight] of Object.entries(shownResults)) {
      const provider = await Provider.findOne({ providerName: courierName });
      if (provider) {
        const fixed = await FixedCharges.findOne({ providerId: provider.providerId });
        const divisor = fixed?.volumetricDivisor || 5000;
        const minWt = fixed?.minimumChargeableWeight || 0;

        const totalVol = (boxes[0].length * boxes[0].breadth * boxes[0].height * boxes[0].qty) / divisor;
        const expectedWeight = Math.max(totalActual, totalVol, minWt);
        const isCorrect = Math.abs(shownWeight - expectedWeight) < 0.1;

        if (!isCorrect) {
          console.log(`❌ ${courierName}:`);
          console.log(`   Divisor: ${divisor}, Min Weight: ${minWt} kg`);
          console.log(`   Total Vol: ${totalVol.toFixed(2)} kg, Total Actual: ${totalActual} kg, Min: ${minWt} kg`);
          console.log(`   Expected: ${expectedWeight.toFixed(2)} kg but shown: ${shownWeight.toFixed(2)} kg`);
          console.log(`   Difference: ${(shownWeight - expectedWeight).toFixed(2)} kg\n`);
        }
      }
    }

    console.log('='.repeat(100));
    console.log('✅ Verification complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

verifyCalculations();
