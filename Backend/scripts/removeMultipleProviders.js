const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function removeMultipleProviders() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    const providersToRemove = ['On Dot', 'DTDC', 'Professional'];
    
    console.log('=== PROVIDERS TO REMOVE ===');
    
    for (const providerName of providersToRemove) {
      console.log(`\n🔍 Searching for: ${providerName}`);
      
      const provider = await Provider.findOne({ providerName: providerName });
      
      if (provider) {
        console.log(`   Found: ${provider.providerName} (ID: ${provider.providerId})`);
        
        // Delete fixed charges
        const deletedFixed = await FixedCharges.deleteMany({ providerId: provider.providerId });
        console.log(`   ✓ Deleted ${deletedFixed.deletedCount} fixed charge records`);
        
        // Delete statewise charges
        const deletedStatewise = await StatewiseCharges.deleteMany({ providerId: provider.providerId });
        console.log(`   ✓ Deleted ${deletedStatewise.deletedCount} statewise charge records`);
        
        // Delete provider
        await Provider.deleteOne({ _id: provider._id });
        console.log(`   ✓ Deleted provider`);
      } else {
        console.log(`   ⚠️  Provider not found: ${providerName}`);
      }
    }

    console.log('\n✅ Cleanup complete!');
    console.log('\n=== REMAINING PROVIDERS ===');
    const remainingProviders = await Provider.find({}).sort({ providerId: 1 });
    remainingProviders.forEach(p => {
      console.log(`ID: ${p.providerId.toString().padStart(2)} | ${p.providerName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

removeMultipleProviders();
