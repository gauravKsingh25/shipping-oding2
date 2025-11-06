const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// V Trans statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 9 },
  { state: 'Arunachal Pradesh', perKiloFee: 9 },
  { state: 'Assam', perKiloFee: 11 },
  { state: 'Bihar', perKiloFee: 8.5 },
  { state: 'Chhattisgarh', perKiloFee: 8.5 },
  { state: 'Goa', perKiloFee: 8.5 },
  { state: 'Gujarat', perKiloFee: 6.5 },
  { state: 'Haryana', perKiloFee: 5.5 },
  { state: 'Himachal Pradesh', perKiloFee: 5.5 },
  { state: 'Jharkhand', perKiloFee: 8.5 },
  { state: 'Karnataka', perKiloFee: 9 },
  { state: 'Kerala', perKiloFee: 9.5 },
  { state: 'Madhya Pradesh', perKiloFee: 8.5 },
  { state: 'Maharashtra', perKiloFee: 7.5 },
  { state: 'Manipur', perKiloFee: 11 },
  { state: 'Meghalaya', perKiloFee: 11 },
  { state: 'Mizoram', perKiloFee: 11 },
  { state: 'Nagaland', perKiloFee: 0 }, // 0 in data
  { state: 'Odisha', perKiloFee: 8.5 },
  { state: 'Punjab', perKiloFee: 5.5 },
  { state: 'Rajasthan', perKiloFee: 5.5 },
  { state: 'Sikkim', perKiloFee: 11 },
  { state: 'Tamil Nadu', perKiloFee: 9 },
  { state: 'Telangana', perKiloFee: 9 },
  { state: 'Tripura', perKiloFee: 9 },
  { state: 'Uttar Pradesh', perKiloFee: 5.5 },
  { state: 'Uttarakhand', perKiloFee: 5.5 },
  { state: 'West Bengal', perKiloFee: 8.5 },
  { state: 'Jammu and Kashmir', perKiloFee: 10 },
  { state: 'Jammu', perKiloFee: 4.25 },
  { state: 'Daman and Diu', perKiloFee: 6.5 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 6.5 },
  { state: 'Puducherry', perKiloFee: 9 },
  { state: 'Delhi', perKiloFee: 4.5 },
];

// City-specific charges
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 5.5 },
  { city: 'Bengloor', perKiloFee: 9 },
  { city: 'Bangalore', perKiloFee: 9 },
  { city: 'Hydrabad', perKiloFee: 9 },
  { city: 'Hyderabad', perKiloFee: 9 },
  { city: 'Chennai', perKiloFee: 9 },
  { city: 'Kolkata', perKiloFee: 8.5 },
  { city: 'Kolkatta', perKiloFee: 8.5 },
  { city: 'Mumbai', perKiloFee: 7.5 },
  { city: 'Ahmedabad', perKiloFee: 6.5 },
  { city: 'Coimbatore', perKiloFee: 9.5 },
  { city: 'Siliguri', perKiloFee: 11 },
  { city: 'Agartala', perKiloFee: 11 },
  { city: 'Imphal', perKiloFee: 11 },
  { city: 'Silchar', perKiloFee: 11 },
  { city: 'Jorhat', perKiloFee: 11 },
  { city: 'Nashik', perKiloFee: 7.5 },
  { city: 'Kerala', perKiloFee: 9.5 },
];

async function updateVTrans() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'V Trans';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'V Trans courier service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (5%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.05, // 5% fuel surcharge
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
          fuelSurcharge: 0.05,
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
        codCharge: 75,
        holidayCharge: 0,
        outstationCharge: 0,
        insuranceChargePercent: 0.00001, // 0.0001% as per data (0.0001/100)
        ngtGreenTax: 0,
        keralaHandlingCharge: 0,
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated');

    // Step 5: Update special charges (GST - 12%)
    console.log('Updating special charges...');
    
    // GST (V Trans has 12% GST instead of 18%)
    await SpecialCharges.findOneAndUpdate(
      { providerId, chargeType: 'OTHER', description: 'GST' },
      {
        providerId,
        providerName,
        state: 'ALL',
        chargeType: 'OTHER',
        amount: 12,
        isPercentage: true,
        description: 'GST',
        isActive: true,
      },
      { upsert: true, new: true }
    );
    console.log('GST charge updated: 12%');

    console.log('\n✅ V Trans charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating V Trans charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateVTrans();
