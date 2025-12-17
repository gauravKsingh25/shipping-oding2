const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function quickTest() {
  try {
    console.log('🔍 Quick Database Test\n');
    
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Count documents
    const providerCount = await Provider.countDocuments();
    const fixedChargesCount = await FixedCharges.countDocuments();

    console.log(`📊 Database Stats:`);
    console.log(`  Providers: ${providerCount}`);
    console.log(`  Fixed Charges: ${fixedChargesCount}`);

    // Check if volumetric fields exist
    console.log(`\n📐 Checking Volumetric Weight Configuration:\n`);
    
    const providers = await Provider.find({}).sort({ providerId: 1 });
    
    for (const provider of providers) {
      const fixedCharge = await FixedCharges.findOne({ providerId: provider.providerId });
      
      if (fixedCharge) {
        const hasVolumetric = fixedCharge.volumetricDivisor !== undefined;
        const hasMinWeight = fixedCharge.minimumChargeableWeight !== undefined;
        
        const status = hasVolumetric && hasMinWeight ? '✅' : '❌';
        
        console.log(`${status} ${provider.providerName.padEnd(25)} | Divisor: ${fixedCharge.volumetricDivisor || 'N/A'} | Min: ${fixedCharge.minimumChargeableWeight || 0} kg`);
      } else {
        console.log(`❌ ${provider.providerName.padEnd(25)} | No fixed charges found`);
      }
    }

    console.log(`\n✅ Quick test completed!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
  }
}

quickTest();
