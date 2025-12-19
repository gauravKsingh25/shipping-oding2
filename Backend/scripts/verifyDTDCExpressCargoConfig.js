const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function verifyDTDCExpressCargo() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find DTDC Express Cargo provider
    const provider = await Provider.findOne({ providerName: "DTDC Express Cargo" });
    
    if (!provider) {
      console.log('❌ DTDC Express Cargo provider not found');
      return;
    }

    console.log('=== DTDC EXPRESS CARGO CURRENT CONFIGURATION ===');
    console.log(`Provider: ${provider.providerName}`);
    console.log(`Provider ID: ${provider.providerId}`);

    // Get fixed charges
    const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
    
    if (fixedCharge) {
      console.log(`\nVolumetric Divisor: ${fixedCharge.volumetricDivisor} (6 CFT)`);
      console.log(`Minimum Chargeable Weight: ${fixedCharge.minimumChargeableWeight} kg`);
      
      // Verify values
      const isCorrect = fixedCharge.volumetricDivisor === 27000 && 
                       fixedCharge.minimumChargeableWeight === 25;
      
      if (isCorrect) {
        console.log('\n✅ Configuration is CORRECT!');
      } else {
        console.log('\n⚠️  Configuration needs update:');
        if (fixedCharge.volumetricDivisor !== 27000) {
          console.log(`   - Volumetric Divisor should be 27000, currently: ${fixedCharge.volumetricDivisor}`);
        }
        if (fixedCharge.minimumChargeableWeight !== 25) {
          console.log(`   - Minimum Weight should be 25 kg, currently: ${fixedCharge.minimumChargeableWeight} kg`);
        }
      }
    } else {
      console.log('❌ Fixed charges not found for DTDC Express Cargo');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

verifyDTDCExpressCargo();
