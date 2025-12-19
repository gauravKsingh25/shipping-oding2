const mongoose = require('mongoose');
const FixedCharges = require('../models/fixedCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

async function checkDepeeWorld() {
  try {
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    // Find Depee World
    const depeeWorld = await FixedCharges.findOne({ "Provider Name": "Depee World" });
    
    if (depeeWorld) {
      console.log('=== DEPEE WORLD Configuration ===');
      console.log(`Provider Name: ${depeeWorld["Provider Name"]}`);
      console.log(`Volumetric Divisor: ${depeeWorld["Volumetric Divisor"]}`);
      console.log(`Minimum Chargeable Weight: ${depeeWorld["Minimum Chargeable Weight (kg)"]} kg`);
      console.log(`Docket Charge: ₹${depeeWorld["Docket Charge (INR)"]}`);
      console.log(`COD Charge: ₹${depeeWorld["COD Charge (INR)"]}`);
      
      // Test calculation
      console.log('\n=== TEST CALCULATION ===');
      console.log('Input: 3 boxes of 55×44×33 cm, 6 kg each');
      
      const box = { length: 55, breadth: 44, height: 33, weight: 6, quantity: 3 };
      const divisor = depeeWorld["Volumetric Divisor"];
      const minWeight = depeeWorld["Minimum Chargeable Weight (kg)"];
      
      const volume = box.length * box.breadth * box.height;
      console.log(`\nVolume per box: ${volume.toLocaleString()} cm³`);
      
      const volWeightPerBox = volume / divisor;
      console.log(`Volumetric weight per box: ${volume} ÷ ${divisor} = ${volWeightPerBox.toFixed(2)} kg`);
      
      const totalActualWeight = box.weight * box.quantity;
      const totalVolumetricWeight = volWeightPerBox * box.quantity;
      
      console.log(`\nTotal actual weight: ${box.weight} × ${box.quantity} = ${totalActualWeight} kg`);
      console.log(`Total volumetric weight: ${volWeightPerBox.toFixed(2)} × ${box.quantity} = ${totalVolumetricWeight.toFixed(2)} kg`);
      console.log(`Minimum weight: ${minWeight} kg`);
      
      const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight, minWeight);
      const weightType = chargeableWeight === minWeight ? 'minimum' :
                        chargeableWeight === totalVolumetricWeight ? 'volumetric' : 'actual';
      
      console.log(`\n✅ Chargeable weight: ${chargeableWeight.toFixed(2)} kg (using ${weightType})`);
      
    } else {
      console.log('❌ Depee World not found in database');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

checkDepeeWorld();
