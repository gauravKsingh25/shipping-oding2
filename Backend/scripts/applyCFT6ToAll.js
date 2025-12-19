const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const Provider = require('../models/provider.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function applyCFT6ToAll() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all providers
    const providers = await Provider.find({}).sort({ providerId: 1 });
    console.log(`Found ${providers.length} providers\n`);
    console.log('=== APPLYING CFT 6 (Divisor 27000) TO ALL PROVIDERS ===\n');

    let updated = 0;
    let unchanged = 0;

    for (const provider of providers) {
      const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
      
      if (fixedCharge) {
        const oldDivisor = fixedCharge.volumetricDivisor;
        
        if (oldDivisor !== 27000) {
          fixedCharge.volumetricDivisor = 27000;
          await fixedCharge.save();
          console.log(`✓ ${provider.providerName.padEnd(25)} | ${oldDivisor} → 27000`);
          updated++;
        } else {
          console.log(`- ${provider.providerName.padEnd(25)} | Already 27000`);
          unchanged++;
        }
      } else {
        console.log(`⚠️  ${provider.providerName.padEnd(25)} | No fixed charges found`);
      }
    }

    console.log('\n=== SUMMARY ===');
    console.log(`Updated: ${updated} providers`);
    console.log(`Already correct: ${unchanged} providers`);
    console.log('\n✅ All providers now use CFT 6 (Divisor 27000)');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

applyCFT6ToAll();
