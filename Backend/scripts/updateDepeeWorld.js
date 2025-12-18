const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Depee World (DP World) statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 11 },
  { state: 'Arunachal Pradesh', perKiloFee: 27 },
  { state: 'Assam', perKiloFee: 15 },
  { state: 'Bihar', perKiloFee: 10.5 },
  { state: 'Chhattisgarh', perKiloFee: 9 },
  { state: 'Goa', perKiloFee: 9 },
  { state: 'Gujarat', perKiloFee: 9 },
  { state: 'Haryana', perKiloFee: 6 },
  { state: 'Himachal Pradesh', perKiloFee: 9 },
  { state: 'Jharkhand', perKiloFee: 10.5 },
  { state: 'Karnataka', perKiloFee: 11 },
  { state: 'Kerala', perKiloFee: 12 },
  { state: 'Madhya Pradesh', perKiloFee: 9 },
  { state: 'Maharashtra', perKiloFee: 9 },
  { state: 'Manipur', perKiloFee: 27 },
  { state: 'Meghalaya', perKiloFee: 27 },
  { state: 'Mizoram', perKiloFee: 27 },
  { state: 'Nagaland', perKiloFee: 27 },
  { state: 'Odisha', perKiloFee: 10.5 },
  { state: 'Punjab', perKiloFee: 6 },
  { state: 'Rajasthan', perKiloFee: 6 },
  { state: 'Sikkim', perKiloFee: 27 },
  { state: 'Tamil Nadu', perKiloFee: 11 },
  { state: 'Telangana', perKiloFee: 11 },
  { state: 'Tripura', perKiloFee: 27 },
  { state: 'Uttar Pradesh', perKiloFee: 6 },
  { state: 'Uttarakhand', perKiloFee: 6 },
  { state: 'West Bengal', perKiloFee: 10.5 },
  { state: 'Jammu and Kashmir', perKiloFee: 9 },
  { state: 'Jammu', perKiloFee: 9 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 9 },
  { state: 'Puducherry', perKiloFee: 12 },
  { state: 'Delhi', perKiloFee: 6 },
];

// City-specific charges
const cityCharges = [
  { state: 'Tamil Nadu', city: 'Coimbatore', perKiloFee: 12 },
  { state: 'West Bengal', city: 'Siliguri', perKiloFee: 27 },
  { state: 'Tripura', city: 'Agartala', perKiloFee: 27 },
  { state: 'Manipur', city: 'Imphal', perKiloFee: 27 },
  { state: 'Assam', city: 'Silchar', perKiloFee: 27 },
  { state: 'Assam', city: 'Jorhat', perKiloFee: 27 },
  { state: 'Maharashtra', city: 'Nashik', perKiloFee: 9 },
  { state: 'Kerala', city: 'Kerala', perKiloFee: 12 },
];

async function updateDepeeWorld() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'Depee World';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'DP World courier service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (15%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.15, // 15% fuel surcharge
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${data.state}: ₹${data.perKiloFee}/kg`);
    }

    // Step 3: Update city-specific charges
    console.log('Updating city-specific charges...');
    for (const city of cityCharges) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: city.city },
        {
          providerId,
          providerName,
          state: city.city,
          perKiloFee: city.perKiloFee,
          fuelSurcharge: 0.15,
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${city.city}: ₹${city.perKiloFee}/kg`);
    }

    // Step 4: Update fixed charges
    console.log('Updating fixed charges...');
    await FixedCharges.findOneAndUpdate(
      { providerId },
      {
        providerId,
        docketCharge: 50,
        codCharge: 100,
        holidayCharge: 150,
        outstationCharge: 3, // ODA charge
        insuranceChargePercent: 0.01, // 100/10000 = 1%
        ngtGreenTax: 0, // NIL for green tax
        keralaHandlingCharge: 0,
        volumetricDivisor: 4500, // L×W×H ÷ 4,500
        minimumChargeableWeight: 20, // Minimum 20 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 27000, min weight: 6kg');

    // Step 5: Update special charges (GST)
    console.log('Updating special charges...');
    await SpecialCharges.findOneAndUpdate(
      { providerId, chargeType: 'OTHER', description: 'GST' },
      {
        providerId,
        providerName,
        state: 'ALL',
        chargeType: 'OTHER',
        amount: 18,
        isPercentage: true,
        description: 'GST',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('GST charge updated: 18%');

    console.log('\n✅ Depee World charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating Depee World charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateDepeeWorld();
