const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function verifyAllDivisors() {
  try {
    console.log('\n' + '='.repeat(90));
    console.log('📊 VOLUMETRIC DIVISOR VERIFICATION - ALL COURIERS');
    console.log('='.repeat(90) + '\n');

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const couriers = [
      { name: 'Gatti Cargo', expected: 27000, expectedDesc: 'L×W×H ÷ 27,000 (6cft method)', expectedMin: 15 },
      { name: 'Depee World', expected: 4500, expectedDesc: 'L×W×H ÷ 4,500', expectedMin: 20 },
      { name: 'Trackon Courier', expected: 5000, expectedDesc: 'L×W×H ÷ 5,000', expectedMin: 2 },
      { name: 'DTDC Courier', expected: 4750, expectedDesc: 'L×W×H ÷ 4,750', expectedMin: 3 },
      { name: 'DTDC Express Cargo', expected: 27000, expectedDesc: 'CFT: L×B×H ÷ 27,000 (6cft)', expectedMin: 20 },
      { name: 'TCI Transport', expected: 12096, expectedDesc: '1728×7 (6cft method)', expectedMin: 10 },
      { name: 'V Trans', expected: 27000, expectedDesc: 'L×B×H ÷ 27,000', expectedMin: 30 },
      { name: 'Vision Logistics', expected: 27000, expectedDesc: 'L×B×H ÷ 27,000', expectedMin: 20 },
      { name: 'Safexpress', expected: 27000, expectedDesc: 'L×B×H ÷ 27,000 (6cft)', expectedMin: 20 }
    ];

    console.log('Courier Partner'.padEnd(30) + 'Divisor'.padEnd(15) + 'Min Wt'.padEnd(10) + 'Status');
    console.log('─'.repeat(90));

    for (const courier of couriers) {
      const provider = await Provider.findOne({ providerName: courier.name });
      if (provider) {
        const fixed = await FixedCharges.findOne({ providerId: provider.providerId });
        const divisor = fixed?.volumetricDivisor || 'NOT SET';
        const minWt = fixed?.minimumChargeableWeight || 0;
        const status = divisor === courier.expected ? '✅ CORRECT' : `❌ WRONG (expected ${courier.expected})`;
        
        console.log(
          courier.name.padEnd(30) +
          divisor.toString().padEnd(15) +
          `${minWt} kg`.padEnd(10) +
          status
        );
      } else {
        console.log(courier.name.padEnd(30) + 'NOT FOUND'.padEnd(15));
      }
    }

    console.log('\n' + '─'.repeat(90));
    console.log('\n📝 Test Calculation: 55×44×33 cm, 6 kg per box, 3 boxes\n');
    console.log('   Volume per box: 79,860 cm³\n');

    console.log('Courier'.padEnd(30) + 'Vol/Box'.padEnd(15) + 'Charge/Box'.padEnd(15) + 'Total (3 boxes)');
    console.log('─'.repeat(90));

    const testVolume = 55 * 44 * 33;
    const testWeight = 6;
    const numBoxes = 3;

    for (const courier of couriers) {
      const provider = await Provider.findOne({ providerName: courier.name });
      if (provider) {
        const fixed = await FixedCharges.findOne({ providerId: provider.providerId });
        const divisor = fixed?.volumetricDivisor || 5000;
        const minWt = fixed?.minimumChargeableWeight || 0;
        
        const volWt = testVolume / divisor;
        const chargeableWt = Math.max(volWt, testWeight, minWt);
        const totalWt = chargeableWt * numBoxes;
        
        const reason = chargeableWt === minWt ? '(minimum)' : 
                      chargeableWt === volWt ? '(volumetric)' : '(actual)';
        
        console.log(
          courier.name.padEnd(30) +
          `${volWt.toFixed(2)} kg`.padEnd(15) +
          `${chargeableWt.toFixed(2)} kg ${reason}`.padEnd(15) +
          `${totalWt.toFixed(2)} kg`
        );
      }
    }

    console.log('\n' + '='.repeat(90));
    console.log('✅ Verification complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed\n');
  }
}

verifyAllDivisors();
