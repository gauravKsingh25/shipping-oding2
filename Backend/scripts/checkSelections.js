const mongoose = require('mongoose');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function checkSelections() {
  try {
    await mongoose.connect(ATLAS_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check selections collection
    const Selections = mongoose.connection.collection('selections');
    const selectionsCount = await Selections.countDocuments();
    console.log(`Selections: ${selectionsCount} documents\n`);

    const sample = await Selections.findOne({});
    if (sample) {
      console.log('=== SELECTIONS FIELD NAMES ===');
      console.log('Fields:', Object.keys(sample));
      console.log('\nSample document:');
      console.log(JSON.stringify(sample, null, 2));
    }

    // Get all selections
    const allSelections = await Selections.find({}).toArray();
    console.log('\n=== ALL SELECTIONS ===');
    allSelections.forEach(sel => {
      console.log(`Provider ID: ${sel.providerId} | Name: ${sel.providerName} | Divisor: ${sel.volumetricDivisor} | Min Weight: ${sel.minimumChargeableWeight || 'N/A'}`);
    });

    // Find selections with DP or Depee
    console.log('\n=== DP/DEPEE PROVIDERS ===');
    const dpSelections = allSelections.filter(sel => /d.*p/i.test(sel.providerName));
    dpSelections.forEach(sel => {
      console.log(`Provider ID: ${sel.providerId} | Name: ${sel.providerName} | Divisor: ${sel.volumetricDivisor} | Min Weight: ${sel.minimumChargeableWeight || 'N/A'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkSelections();
