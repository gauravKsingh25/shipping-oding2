const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function checkDatabase() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('=== COLLECTIONS IN DATABASE ===');
    collections.forEach(c => console.log(`  - ${c.name}`));

    // Check fixed charges
    const FixedCharges = mongoose.connection.collection('fixedcharges');
    const fixedCount = await FixedCharges.countDocuments();
    console.log(`\nFixed Charges: ${fixedCount} documents`);
    
    if (fixedCount > 0) {
      const sample = await FixedCharges.find({}).limit(3).toArray();
      console.log('\nSample Fixed Charges:');
      sample.forEach(doc => {
        console.log(`  ${doc["Provider Name"]} - Divisor: ${doc["Volumetric Divisor"]}`);
      });
    }

    // Check statewise charges
    const StatewiseCharges = mongoose.connection.collection('statewisecharges');
    const statewiseCount = await StatewiseCharges.countDocuments();
    console.log(`\nStatewise Charges: ${statewiseCount} documents`);
    
    if (statewiseCount > 0) {
      const sample = await StatewiseCharges.find({}).limit(3).toArray();
      console.log('\nSample Statewise Charges:');
      sample.forEach(doc => {
        console.log(`  ${doc["Provider Name"]} - ${doc["State"]}`);
      });
    }

    // Check providers
    const Providers = mongoose.connection.collection('providers');
    const providerCount = await Providers.countDocuments();
    console.log(`\nProviders: ${providerCount} documents`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkDatabase();
