const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function cleanOrphanedCharges() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all active providers
    const activeProviders = await Provider.find({});
    const activeProviderIds = activeProviders.map(p => p.providerId);
    
    console.log(`Active providers: ${activeProviders.length}`);
    console.log(`Active provider IDs: ${activeProviderIds.join(', ')}\n`);

    // Find orphaned statewise charges
    const allStatewise = await StatewiseCharges.find({});
    const orphanedStatewise = allStatewise.filter(sc => !activeProviderIds.includes(sc.providerId));
    
    console.log('=== ORPHANED STATEWISE CHARGES ===');
    const orphanedByProvider = {};
    orphanedStatewise.forEach(sc => {
      const key = `${sc.providerName} (ID: ${sc.providerId})`;
      orphanedByProvider[key] = (orphanedByProvider[key] || 0) + 1;
    });
    
    Object.entries(orphanedByProvider).forEach(([name, count]) => {
      console.log(`  ${name}: ${count} records`);
    });

    if (orphanedStatewise.length > 0) {
      console.log(`\n⚠️  Found ${orphanedStatewise.length} orphaned statewise charges`);
      console.log('Deleting in 3 seconds... Press Ctrl+C to cancel\n');
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Delete orphaned statewise charges
      const orphanedIds = orphanedStatewise.map(sc => sc._id);
      const deleteResult = await StatewiseCharges.deleteMany({ _id: { $in: orphanedIds } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned statewise charges`);
    }

    // Find orphaned fixed charges
    const allFixed = await FixedCharges.find({});
    const orphanedFixed = allFixed.filter(fc => !activeProviderIds.includes(fc.providerId));
    
    if (orphanedFixed.length > 0) {
      console.log(`\n⚠️  Found ${orphanedFixed.length} orphaned fixed charges`);
      orphanedFixed.forEach(fc => {
        console.log(`  Provider ID: ${fc.providerId}`);
      });

      const orphanedFixedIds = orphanedFixed.map(fc => fc._id);
      const deleteResult = await FixedCharges.deleteMany({ _id: { $in: orphanedFixedIds } });
      console.log(`✅ Deleted ${deleteResult.deletedCount} orphaned fixed charges`);
    }

    console.log('\n✅ Cleanup complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

cleanOrphanedCharges();
