const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const FixedCharges = require('../models/fixedCharges.model');
const StatewiseCharges = require('../models/statewiseCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function removeTrackon() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find all Trackon providers
    const trackonProviders = await Provider.find({ providerName: { $regex: /trackon/i } });
    
    console.log('=== TRACKON PROVIDERS FOUND ===');
    trackonProviders.forEach(p => {
      console.log(`ID: ${p.providerId} | Name: "${p.providerName}"`);
    });

    // Find the one named exactly "Trackon" (not "Trackon Courier")
    const trackonToDelete = await Provider.findOne({ providerName: "Trackon" });
    
    if (!trackonToDelete) {
      console.log('\n❌ "Trackon" provider not found (already deleted or different name)');
      return;
    }

    console.log(`\n=== DELETING "Trackon" (ID: ${trackonToDelete.providerId}) ===`);
    console.log('Keeping "Trackon Courier"...\n');
    
    // Wait 3 seconds
    console.log('⚠️  Starting deletion in 3 seconds...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Delete fixed charges
    const deletedFixed = await FixedCharges.deleteMany({ providerId: trackonToDelete.providerId });
    console.log(`✓ Deleted ${deletedFixed.deletedCount} fixed charge records`);

    // Delete statewise charges
    const deletedStatewise = await StatewiseCharges.deleteMany({ providerId: trackonToDelete.providerId });
    console.log(`✓ Deleted ${deletedStatewise.deletedCount} statewise charge records`);

    // Delete provider
    await Provider.deleteOne({ _id: trackonToDelete._id });
    console.log(`✓ Deleted provider "${trackonToDelete.providerName}"`);

    console.log('\n✅ Deletion complete!');
    
    // Show remaining Trackon providers
    console.log('\n=== REMAINING TRACKON PROVIDERS ===');
    const remaining = await Provider.find({ providerName: { $regex: /trackon/i } });
    remaining.forEach(p => {
      console.log(`ID: ${p.providerId} | Name: "${p.providerName}" ✓`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

removeTrackon();
