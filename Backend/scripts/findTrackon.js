const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewisecharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function findTrackon() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all providers
    const allProviders = await Provider.find({}).sort({ providerId: 1 });
    console.log('=== ALL PROVIDERS WITH TRACKON ===');
    const trackonProviders = allProviders.filter(p => /trackon/i.test(p.providerName));
    trackonProviders.forEach(p => {
      console.log(`ID: ${p.providerId} | Name: "${p.providerName}"`);
    });

    // Check statewise charges for provider names
    console.log('\n=== CHECKING STATEWISE CHARGES ===');
    const statewiseCharges = await StatewiseCharges.find({}).limit(100);
    const uniqueProviderNames = [...new Set(statewiseCharges.map(sc => sc.providerName))].sort();
    
    console.log('\nAll unique provider names in statewise charges:');
    uniqueProviderNames.forEach(name => {
      if (/trackon/i.test(name)) {
        const provider = allProviders.find(p => p.providerName === name);
        console.log(`  - "${name}" (Provider ID: ${provider?.providerId || 'NOT FOUND'})`);
      }
    });

    // Find provider ID 7
    const provider7 = await Provider.findOne({ providerId: 7 });
    console.log(`\n=== PROVIDER ID 7 ===`);
    if (provider7) {
      console.log(`Name: "${provider7.providerName}"`);
      
      // Check statewise charges for this provider
      const statewiseCount = await StatewiseCharges.countDocuments({ providerId: 7 });
      console.log(`Statewise charge records: ${statewiseCount}`);
    } else {
      console.log('Provider ID 7 not found');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

findTrackon();
