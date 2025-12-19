const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function removeDuplicateProviders() {
  try {
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // List all providers first
    console.log('=== ALL PROVIDERS ===');
    const allProviders = await Provider.find({}).sort({ providerId: 1 });
    allProviders.forEach(p => {
      console.log(`ID: ${p.providerId.toString().padEnd(3)} | Name: ${p.providerName.padEnd(25)} | Active: ${p.isActive}`);
    });

    // Find DP World - there appears to be an old one
    const dpWorldProviders = await Provider.find({ providerName: { $regex: /dp.*world/i } });
    console.log('\n=== DP World Providers ===');
    dpWorldProviders.forEach(p => {
      console.log(`ID: ${p.providerId} | Name: ${p.providerName} | Active: ${p.isActive}`);
    });

    // Find Gati providers
    const gatiProviders = await Provider.find({ providerName: { $regex: /gat/i } });
    console.log('\n=== Gati Providers ===');
    gatiProviders.forEach(p => {
      console.log(`ID: ${p.providerId} | Name: ${p.providerName} | Active: ${p.isActive}`);
    });

    // Check which providers have fixed charges
    console.log('\n=== Checking Fixed Charges ===');
    const fixedCharges = await FixedCharges.find({});
    
    const dpWorldFixed = fixedCharges.filter(fc => /dp.*world/i.test(fc["Provider Name"]));
    console.log('\nDP World Fixed Charges:');
    dpWorldFixed.forEach(fc => {
      console.log(`  Provider: ${fc["Provider Name"]} | Divisor: ${fc["Volumetric Divisor"]} | Min Weight: ${fc["Minimum Chargeable Weight (kg)"]}`);
    });

    const gatiFixed = fixedCharges.filter(fc => /gat/i.test(fc["Provider Name"]));
    console.log('\nGati Fixed Charges:');
    gatiFixed.forEach(fc => {
      console.log(`  Provider: ${fc["Provider Name"]} | Divisor: ${fc["Volumetric Divisor"]} | Min Weight: ${fc["Minimum Chargeable Weight (kg)"]}`);
    });

    // Check statewise charges
    console.log('\n=== Checking Statewise Charges ===');
    const statewiseCharges = await StatewiseCharges.find({});
    
    const dpWorldStatewise = statewiseCharges.filter(sc => /dp.*world/i.test(sc["Provider Name"]));
    console.log(`\nDP World has ${dpWorldStatewise.length} statewise charge records`);
    
    const gatiStatewise = statewiseCharges.filter(sc => /gat/i.test(sc["Provider Name"]));
    console.log(`Gati/Gatti has ${gatiStatewise.length} statewise charge records`);
    gatiStatewise.slice(0, 3).forEach(sc => {
      console.log(`  ${sc["Provider Name"]} - ${sc["State"]}`);
    });

    // Now identify which to delete
    console.log('\n\n=== PROVIDERS TO DELETE ===');
    
    // Find "DP World" (old one with ID 3, divisor 27000)
    const oldDPWorld = dpWorldProviders.find(p => p.providerName === "DP World");
    if (oldDPWorld) {
      console.log(`1. ${oldDPWorld.providerName} (ID: ${oldDPWorld.providerId}) - OLD VERSION with divisor 27000`);
    }

    // Find "Gati" (not "Gatti Cargo")
    const oldGati = gatiProviders.find(p => p.providerName === "Gati");
    if (oldGati) {
      console.log(`2. ${oldGati.providerName} (ID: ${oldGati.providerId}) - Duplicate, keeping "Gatti Cargo"`);
    }

    // Ask for confirmation
    console.log('\n⚠️  ABOUT TO DELETE THESE PROVIDERS AND ALL THEIR CHARGES');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Delete DP World (old)
    if (oldDPWorld) {
      console.log(`\n🗑️  Deleting ${oldDPWorld.providerName}...`);
      
      // Delete from fixed charges
      const deletedFixed = await FixedCharges.deleteMany({ "Provider Name": oldDPWorld.providerName });
      console.log(`   ✓ Deleted ${deletedFixed.deletedCount} fixed charge records`);
      
      // Delete from statewise charges
      const deletedStatewise = await StatewiseCharges.deleteMany({ "Provider Name": oldDPWorld.providerName });
      console.log(`   ✓ Deleted ${deletedStatewise.deletedCount} statewise charge records`);
      
      // Delete provider
      await Provider.deleteOne({ _id: oldDPWorld._id });
      console.log(`   ✓ Deleted provider`);
    }

    // Delete Gati (keeping Gatti Cargo)
    if (oldGati) {
      console.log(`\n🗑️  Deleting ${oldGati.providerName}...`);
      
      // Delete from fixed charges
      const deletedFixed = await FixedCharges.deleteMany({ "Provider Name": oldGati.providerName });
      console.log(`   ✓ Deleted ${deletedFixed.deletedCount} fixed charge records`);
      
      // Delete from statewise charges
      const deletedStatewise = await StatewiseCharges.deleteMany({ "Provider Name": oldGati.providerName });
      console.log(`   ✓ Deleted ${deletedStatewise.deletedCount} statewise charge records`);
      
      // Delete provider
      await Provider.deleteOne({ _id: oldGati._id });
      console.log(`   ✓ Deleted provider`);
    }

    console.log('\n✅ Cleanup complete!');
    console.log('\n=== REMAINING PROVIDERS ===');
    const remainingProviders = await Provider.find({}).sort({ providerId: 1 });
    remainingProviders.forEach(p => {
      console.log(`ID: ${p.providerId.toString().padEnd(3)} | Name: ${p.providerName}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

removeDuplicateProviders();
