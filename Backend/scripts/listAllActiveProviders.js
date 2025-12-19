const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function listAllProviders() {
  try {
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Get all unique provider names from Fixed Charges
    const fixedCharges = await FixedCharges.find({});
    const fixedProviderNames = [...new Set(fixedCharges.map(fc => fc["Provider Name"]))].sort();
    
    console.log('=== PROVIDERS IN FIXED CHARGES ===');
    fixedProviderNames.forEach((name, idx) => {
      if (name) {
        const config = fixedCharges.find(fc => fc["Provider Name"] === name);
        if (config) {
          console.log(`${(idx + 1).toString().padStart(2)}. ${name.padEnd(25)} | Divisor: ${config["Volumetric Divisor"].toString().padStart(5)} | Min: ${config["Minimum Chargeable Weight (kg)"]} kg`);
        }
      }
    });

    // Get all unique provider names from Statewise Charges
    const statewiseCharges = await StatewiseCharges.find({});
    const statewiseProviderNames = [...new Set(statewiseCharges.map(sc => sc["Provider Name"]))].sort();
    
    console.log('\n=== PROVIDERS IN STATEWISE CHARGES ===');
    statewiseProviderNames.forEach((name, idx) => {
      const count = statewiseCharges.filter(sc => sc["Provider Name"] === name).length;
      console.log(`${(idx + 1).toString().padStart(2)}. ${name.padEnd(25)} | ${count} state records`);
    });

    // Find providers that look like "Depee" or "DP"
    console.log('\n=== PROVIDERS WITH "DP" OR "DEPEE" ===');
    const dpProviders = fixedProviderNames.filter(name => /d.*p/i.test(name));
    dpProviders.forEach(name => {
      const config = fixedCharges.find(fc => fc["Provider Name"] === name);
      console.log(`  ${name}: Divisor=${config["Volumetric Divisor"]}, Min=${config["Minimum Chargeable Weight (kg)"]} kg`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

listAllProviders();
