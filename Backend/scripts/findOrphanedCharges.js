const mongoose = require('mongoose');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function findOrphanedStatewiseCharges() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all statewise charges
    const allStatewise = await StatewiseCharges.find({});
    
    // Find charges with specific provider names
    const targetNames = ['On Dot', 'DTDC', 'Professional', 'Trackon'];
    
    console.log('=== CHECKING STATEWISE CHARGES ===\n');
    
    for (const name of targetNames) {
      const matches = allStatewise.filter(sc => 
        sc.providerName && sc.providerName.toLowerCase() === name.toLowerCase()
      );
      
      if (matches.length > 0) {
        console.log(`Found ${matches.length} statewise charges for "${name}"`);
        console.log(`  Provider IDs: ${[...new Set(matches.map(m => m.providerId))].join(', ')}`);
      }
    }

    // Get all unique provider names in statewise charges
    const uniqueProviderNames = [...new Set(allStatewise.map(sc => sc.providerName))].sort();
    
    console.log('\n=== ALL PROVIDER NAMES IN STATEWISE CHARGES ===');
    uniqueProviderNames.forEach(name => {
      const count = allStatewise.filter(sc => sc.providerName === name).length;
      console.log(`  ${name}: ${count} records`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

findOrphanedStatewiseCharges();
