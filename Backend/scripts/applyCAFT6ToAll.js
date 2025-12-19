const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function applyCAFT6ToAllProviders() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all providers
    const providers = await Provider.find({}).sort({ providerId: 1 });
    console.log(`Found ${providers.length} providers\n`);
    
    console.log('=== UPDATING ALL PROVIDERS TO CFT 6 (Divisor: 27000) ===\n');

    for (const provider of providers) {
      const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
      
      if (fixedCharge) {
        const oldDivisor = fixedCharge.volumetricDivisor;
        
        if (oldDivisor !== 27000) {
          fixedCharge.volumetricDivisor = 27000;
          await fixedCharge.save();
          console.log(`✓ ${provider.providerName.padEnd(25)} | ${oldDivisor} → 27000`);
        } else {
          console.log(`  ${provider.providerName.padEnd(25)} | Already 27000 ✓`);
        }
      } else {
        console.log(`⚠ ${provider.providerName.padEnd(25)} | No fixed charges found`);
      }
    }

    console.log('\n✅ All providers updated to CFT 6 (Divisor: 27000)');
    
    // Verify
    console.log('\n=== VERIFICATION ===\n');
    const allFixed = await FixedCharges.find({}).sort({ providerId: 1 });
    
    for (const fixed of allFixed) {
      const provider = await Provider.findOne({ providerId: fixed.providerId });
      if (provider) {
        console.log(`${provider.providerName.padEnd(25)} | Divisor: ${fixed.volumetricDivisor} | Min Weight: ${fixed.minimumChargeableWeight} kg`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

applyCAFT6ToAllProviders();
