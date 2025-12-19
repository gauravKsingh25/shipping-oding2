const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function checkFieldNames() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check fixed charges
    const FixedCharges = mongoose.connection.collection('fixedcharges');
    const fixedSample = await FixedCharges.findOne({});
    
    console.log('=== FIXED CHARGES FIELD NAMES ===');
    if (fixedSample) {
      console.log('Fields:', Object.keys(fixedSample));
      console.log('\nSample document:');
      console.log(JSON.stringify(fixedSample, null, 2));
    }

    // Check statewise charges
    const StatewiseCharges = mongoose.connection.collection('statewisecharges');
    const statewiseSample = await StatewiseCharges.findOne({});
    
    console.log('\n\n=== STATEWISE CHARGES FIELD NAMES ===');
    if (statewiseSample) {
      console.log('Fields:', Object.keys(statewiseSample));
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkFieldNames();
