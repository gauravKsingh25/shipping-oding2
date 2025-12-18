const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function verifyVolumetricDivisors() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('📊 VOLUMETRIC DIVISOR VERIFICATION');
    console.log('='.repeat(80) + '\n');

    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    const fixedCharges = await FixedCharges.find({}).sort({ providerId: 1 });

    console.log('Courier Partner'.padEnd(30) + 'Volumetric Divisor'.padEnd(20) + 'Min Weight (kg)');
    console.log('─'.repeat(80));

    for (const charge of fixedCharges) {
      const provider = await Provider.findOne({ providerId: charge.providerId });
      if (provider) {
        console.log(
          provider.providerName.padEnd(30) +
          (charge.volumetricDivisor || 'NOT SET').toString().padEnd(20) +
          (charge.minimumChargeableWeight || 0).toString()
        );
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log('\n📝 Example Calculation:');
    console.log('   Dimensions: 51×44×33 cm');
    console.log('   Volume: 73,788 cm³');
    console.log('   Actual Weight: 6 kg per box\n');

    const testVolume = 51 * 44 * 33;
    const testWeight = 6;

    console.log('Divisor'.padEnd(15) + 'Volumetric Wt'.padEnd(20) + 'Chargeable Wt (per box)'.padEnd(30) + '3 Boxes Total');
    console.log('─'.repeat(80));

    [4500, 4750, 5000, 27000].forEach(divisor => {
      const volWt = testVolume / divisor;
      const chargeableWt = Math.max(volWt, testWeight);
      const totalWt = chargeableWt * 3;
      
      console.log(
        divisor.toString().padEnd(15) +
        `${volWt.toFixed(2)} kg`.padEnd(20) +
        `${chargeableWt.toFixed(2)} kg`.padEnd(30) +
        `${totalWt.toFixed(2)} kg`
      );
    });

    console.log('\n' + '='.repeat(80));
    console.log('✅ Verification complete!\n');

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed\n');
  }
}

verifyVolumetricDivisors();
