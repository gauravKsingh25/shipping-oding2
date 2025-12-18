const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// DTDC Express Cargo statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 10 },
  { state: 'Arunachal Pradesh', perKiloFee: 10 },
  { state: 'Assam', perKiloFee: 15 },
  { state: 'Bihar', perKiloFee: 11 },
  { state: 'Chhattisgarh', perKiloFee: 9 },
  { state: 'Goa', perKiloFee: 9 },
  { state: 'Gujarat', perKiloFee: 9 },
  { state: 'Haryana', perKiloFee: 6 },
  { state: 'Himachal Pradesh', perKiloFee: 6.5 },
  { state: 'Jharkhand', perKiloFee: 11 },
  { state: 'Karnataka', perKiloFee: 10 },
  { state: 'Kerala', perKiloFee: 12 },
  { state: 'Madhya Pradesh', perKiloFee: 9 },
  { state: 'Maharashtra', perKiloFee: 9 },
  { state: 'Manipur', perKiloFee: 15 },
  { state: 'Meghalaya', perKiloFee: 15 },
  { state: 'Mizoram', perKiloFee: 15 },
  { state: 'Nagaland', perKiloFee: 15 },
  { state: 'Odisha', perKiloFee: 11 },
  { state: 'Punjab', perKiloFee: 6 },
  { state: 'Rajasthan', perKiloFee: 6 },
  { state: 'Sikkim', perKiloFee: 15 },
  { state: 'Tamil Nadu', perKiloFee: 10 },
  { state: 'Telangana', perKiloFee: 10 },
  { state: 'Tripura', perKiloFee: 10 },
  { state: 'Uttar Pradesh', perKiloFee: 6 },
  { state: 'Uttarakhand', perKiloFee: 6 },
  { state: 'West Bengal', perKiloFee: 11 },
  { state: 'Jammu and Kashmir', perKiloFee: 6.5 },
  { state: 'Jammu', perKiloFee: 6.5 },
  { state: 'Daman and Diu', perKiloFee: 9 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 9 },
  { state: 'Puducherry', perKiloFee: 9 },
  { state: 'Delhi', perKiloFee: 6 },
];

// City-specific charges
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 6 },
  { city: 'Bengloor', perKiloFee: 10 },
  { city: 'Bangalore', perKiloFee: 10 },
  { city: 'Hydrabad', perKiloFee: 10 },
  { city: 'Hyderabad', perKiloFee: 10 },
  { city: 'Chennai', perKiloFee: 10 },
  { city: 'Kolkata', perKiloFee: 11 },
  { city: 'Kolkatta', perKiloFee: 11 },
  { city: 'Mumbai', perKiloFee: 9 },
  { city: 'Ahmedabad', perKiloFee: 9 },
  { city: 'Coimbatore', perKiloFee: 10 },
  { city: 'Siliguri', perKiloFee: 15 },
  { city: 'Agartala', perKiloFee: 11 },
  { city: 'Imphal', perKiloFee: 15 },
  { city: 'Silchar', perKiloFee: 15 },
  { city: 'Jorhat', perKiloFee: 15 },
  { city: 'Nashik', perKiloFee: 9 },
  { city: 'Kerala', perKiloFee: 12 },
];

async function updateDTDCExpressCargo() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'DTDC Express Cargo';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'DTDC Express Cargo service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (10%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.10, // 10% fuel surcharge
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
          fuelSurcharge: 0.10,
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
        holidayCharge: 0,
        outstationCharge: 0, // ODA charges mentioned but not specified
        insuranceChargePercent: 0.01, // 100/10000 = 1%
        ngtGreenTax: 0, // NIL for green tax
        keralaHandlingCharge: 0,
        volumetricDivisor: 27000, // L×B×H ÷ 27,000 (6cft method)
        minimumChargeableWeight: 20, // Minimum 20 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 27000, min weight: 25kg');

    console.log('\n✅ DTDC Express Cargo charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating DTDC Express Cargo charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateDTDCExpressCargo();
