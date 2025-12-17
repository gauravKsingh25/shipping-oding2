const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// TCI Transport statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 11 },
  { state: 'Arunachal Pradesh', perKiloFee: 25 },
  { state: 'Assam', perKiloFee: 17 },
  { state: 'Bihar', perKiloFee: 14 },
  { state: 'Chhattisgarh', perKiloFee: 13 },
  { state: 'Goa', perKiloFee: 10 },
  { state: 'Gujarat', perKiloFee: 10 },
  { state: 'Haryana', perKiloFee: 8 },
  { state: 'Himachal Pradesh', perKiloFee: 10 },
  { state: 'Jharkhand', perKiloFee: 14 },
  { state: 'Karnataka', perKiloFee: 11 },
  { state: 'Kerala', perKiloFee: 14 },
  { state: 'Madhya Pradesh', perKiloFee: 10 },
  { state: 'Maharashtra', perKiloFee: 10 },
  { state: 'Manipur', perKiloFee: 25 },
  { state: 'Meghalaya', perKiloFee: 25 },
  { state: 'Mizoram', perKiloFee: 25 },
  { state: 'Nagaland', perKiloFee: 25 },
  { state: 'Odisha', perKiloFee: 14 },
  { state: 'Punjab', perKiloFee: 8 },
  { state: 'Rajasthan', perKiloFee: 8 },
  { state: 'Sikkim', perKiloFee: 25 },
  { state: 'Tamil Nadu', perKiloFee: 11 },
  { state: 'Telangana', perKiloFee: 11 },
  { state: 'Tripura', perKiloFee: 25 },
  { state: 'Uttar Pradesh', perKiloFee: 8 },
  { state: 'Uttarakhand', perKiloFee: 10 },
  { state: 'West Bengal', perKiloFee: 11 },
  { state: 'Jammu and Kashmir', perKiloFee: 13 },
  { state: 'Jammu', perKiloFee: 10 },
  { state: 'Daman and Diu', perKiloFee: 10 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 10 },
  { state: 'Puducherry', perKiloFee: 10 },
  { state: 'Delhi', perKiloFee: 7 },
  { state: 'Port Blair', perKiloFee: 32 },
];

// City-specific charges
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 7 },
  { city: 'Bengloor', perKiloFee: 10 },
  { city: 'Bangalore', perKiloFee: 10 },
  { city: 'Hydrabad', perKiloFee: 11 },
  { city: 'Hyderabad', perKiloFee: 11 },
  { city: 'Chennai', perKiloFee: 10 },
  { city: 'Kolkata', perKiloFee: 11 },
  { city: 'Kolkatta', perKiloFee: 11 },
  { city: 'Mumbai', perKiloFee: 10 },
  { city: 'Ahmedabad', perKiloFee: 10 },
  { city: 'Coimbatore', perKiloFee: 11 },
  { city: 'Siliguri', perKiloFee: 11 },
  { city: 'Agartala', perKiloFee: 25 },
  { city: 'Imphal', perKiloFee: 25 },
  { city: 'Silchar', perKiloFee: 17 },
  { city: 'Jorhat', perKiloFee: 25 },
  { city: 'Nashik', perKiloFee: 10 },
  { city: 'Kerala', perKiloFee: 14 },
];

async function updateTCITransport() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'TCI Transport';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'TCI Transport service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (18%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.18, // 18% fuel surcharge
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
          fuelSurcharge: 0.18,
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
        holidayCharge: 250, // 250 minimum per docket of 10 KGS
        outstationCharge: 0, // ODA EXTRA - treating as variable
        insuranceChargePercent: 0.00001, // 0.001% = 0.001/100 = 0.00001
        ngtGreenTax: 100,
        keralaHandlingCharge: 0,
        volumetricDivisor: 27000, // L×B×H ÷ 27,000
        minimumChargeableWeight: 20, // Minimum 20 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 27000, min weight: 20kg');

    // Step 5: Update special charges (GST)
    console.log('Updating special charges...');
    
    // GST
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

    console.log('\n✅ TCI Transport charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating TCI Transport charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateTCITransport();
