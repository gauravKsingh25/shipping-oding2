const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
require('dotenv').config();

async function testProviderLookup() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Simulate the Dashboard's data loading (similar to how it loads data)
    console.log('\n🔄 SIMULATING DASHBOARD DATA LOADING:');
    console.log('======================================');
    
    // Load providers (using same filter as frontend API)
    const providersResponse = await Provider.find({ isActive: true }).sort({ providerId: 1 });
    const transformedProviders = providersResponse.map(p => ({
      "Provider ID": p.providerId,
      "Provider Name": p.providerName,
      description: p.description,
      isActive: p.isActive
    }));
    
    console.log(`Loaded ${transformedProviders.length} active providers:`);
    transformedProviders.forEach(p => {
      console.log(`  ID ${p["Provider ID"]}: "${p["Provider Name"]}"`);
    });

    // Load statewise charges for a sample state (like Dashboard does)
    const selectedState = 'Delhi';
    const statewiseChargesResponse = await StatewiseCharges.find({}).sort({ providerId: 1 });
    const transformedStatewiseCharges = statewiseChargesResponse.map(s => ({
      "Provider ID": s.providerId,
      "Provider Name": s.providerName,
      "State": s.state,
      "Per Kilo Fee (INR)": s.perKiloFee,
      "Fuel Surcharge (%)": s.fuelSurcharge
    }));

    // Filter for selected state (like Dashboard does)
    const stateFiltered = transformedStatewiseCharges.filter(s => 
      s.State && s.State.toLowerCase() === selectedState.toLowerCase()
    );

    console.log(`\n🎯 TESTING PROVIDER LOOKUP FOR STATE: ${selectedState}`);
    console.log('===================================================');
    console.log(`Found ${stateFiltered.length} statewise charges for ${selectedState}:`);

    // Test provider lookup (like Dashboard calculation does)
    const testResults = stateFiltered.map(stateRow => {
      const vendorId = stateRow["Provider ID"];
      const provider = transformedProviders.find(p => p["Provider ID"] === vendorId);
      
      const status = provider ? '✅ FOUND' : '❌ MISSING';
      const providerName = provider?.["Provider Name"] || `Unknown Provider (ID: ${vendorId})`;
      
      return {
        vendorId,
        status,
        providerName,
        perKiloFee: stateRow["Per Kilo Fee (INR)"],
        fuelSurcharge: stateRow["Fuel Surcharge (%)"]
      };
    });

    testResults.forEach(result => {
      console.log(`  ID ${result.vendorId}: ${result.status} - "${result.providerName}" (₹${result.perKiloFee}/kg, ${result.fuelSurcharge}% fuel)`);
    });

    // Count results
    const foundCount = testResults.filter(r => r.status === '✅ FOUND').length;
    const missingCount = testResults.filter(r => r.status === '❌ MISSING').length;

    console.log(`\n📊 LOOKUP TEST RESULTS:`);
    console.log('=======================');
    console.log(`✅ Successfully found: ${foundCount} providers`);
    console.log(`❌ Missing providers: ${missingCount} providers`);
    
    if (missingCount === 0) {
      console.log(`🎉 SUCCESS: All providers can be found! The "Unknown Provider" issue is FIXED!`);
    } else {
      console.log(`⚠️ WARNING: There are still ${missingCount} missing providers that need attention.`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testProviderLookup();