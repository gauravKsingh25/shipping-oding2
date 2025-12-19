const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Configuration for each courier partner
const COURIER_CONFIGS = {
  "Depee World": { divisor: 4500, minWeight: 20 },
  "Trackon Courier": { divisor: 5000, minWeight: 2 },
  "DTDC Courier": { divisor: 4750, minWeight: 3 },
  "DTDC Express Cargo": { divisor: 27000, minWeight: 20 },
  "TCI Transport": { divisor: 12096, minWeight: 10 },
  "Vision Logistics": { divisor: 27000, minWeight: 20 },
  "Safexpress": { divisor: 27000, minWeight: 20 },
  "Gatti Cargo": { divisor: 27000, minWeight: 15 },
  "V Trans": { divisor: 27000, minWeight: 30 },
  // Default for all others
  "DEFAULT": { divisor: 27000, minWeight: 0 }
};

async function addVolumetricFields() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all providers
    const providers = await Provider.find({}).sort({ providerId: 1 });
    console.log('=== UPDATING FIXED CHARGES ===\n');

    for (const provider of providers) {
      // Get configuration for this provider
      const config = COURIER_CONFIGS[provider.providerName] || COURIER_CONFIGS["DEFAULT"];
      
      console.log(`Updating ${provider.providerName}...`);
      console.log(`  Provider ID: ${provider.providerId}`);
      console.log(`  Volumetric Divisor: ${config.divisor}`);
      console.log(`  Minimum Weight: ${config.minWeight} kg`);

      // Check if fixed charges exist for this provider
      let fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
      
      if (fixedCharge) {
        // Update existing
        fixedCharge.volumetricDivisor = config.divisor;
        fixedCharge.minimumChargeableWeight = config.minWeight;
        await fixedCharge.save();
        console.log(`  ✓ Updated existing fixed charges`);
      } else {
        // Create new with default values
        fixedCharge = new FixedCharges({
          providerId: provider.providerId,
          docketCharge: 50,
          codCharge: 50,
          holidayCharge: 0,
          outstationCharge: 0,
          insuranceChargePercent: 1.0,
          ngtGreenTax: 0,
          keralaHandlingCharge: 0,
          volumetricDivisor: config.divisor,
          minimumChargeableWeight: config.minWeight
        });
        await fixedCharge.save();
        console.log(`  ✓ Created new fixed charges with defaults`);
      }
      console.log('');
    }

    console.log('✅ All fixed charges updated!');
    
    // Verify
    console.log('\n=== VERIFICATION ===\n');
    const allFixed = await FixedCharges.find({}).sort({ providerId: 1 });
    
    for (const fixed of allFixed) {
      const provider = await Provider.findOne({ providerId: fixed.providerId });
      if (provider) {
        console.log(`${provider.providerName.padEnd(25)} | Divisor: ${fixed.volumetricDivisor.toString().padStart(5)} | Min: ${fixed.minimumChargeableWeight.toString().padStart(2)} kg`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

addVolumetricFields();
