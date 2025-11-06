const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Safexpress statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 13.75 },
  { state: 'Arunachal Pradesh', perKiloFee: 21 },
  { state: 'Assam', perKiloFee: 21 },
  { state: 'Bihar', perKiloFee: 13.75 },
  { state: 'Chhattisgarh', perKiloFee: 13.75 },
  { state: 'Goa', perKiloFee: 8.5 },
  { state: 'Gujarat', perKiloFee: 8.5 },
  { state: 'Haryana', perKiloFee: 7 },
  { state: 'Himachal Pradesh', perKiloFee: 7 },
  { state: 'Jharkhand', perKiloFee: 13.75 },
  { state: 'Karnataka', perKiloFee: 10.75 },
  { state: 'Kerala', perKiloFee: 13.75 },
  { state: 'Madhya Pradesh', perKiloFee: 8.5 },
  { state: 'Maharashtra', perKiloFee: 8.5 },
  { state: 'Manipur', perKiloFee: 31 },
  { state: 'Meghalaya', perKiloFee: 31 },
  { state: 'Mizoram', perKiloFee: 31 },
  { state: 'Nagaland', perKiloFee: 31 },
  { state: 'Odisha', perKiloFee: 13.75 },
  { state: 'Punjab', perKiloFee: 7 },
  { state: 'Rajasthan', perKiloFee: 7 },
  { state: 'Sikkim', perKiloFee: 13.75 },
  { state: 'Tamil Nadu', perKiloFee: 10.75 },
  { state: 'Telangana', perKiloFee: 10.75 },
  { state: 'Tripura', perKiloFee: 31 },
  { state: 'Uttar Pradesh', perKiloFee: 7 },
  { state: 'Uttarakhand', perKiloFee: 7 },
  { state: 'West Bengal', perKiloFee: 13.75 },
  { state: 'Jammu and Kashmir', perKiloFee: 13 },
  { state: 'Jammu', perKiloFee: 7 },
  { state: 'Daman and Diu', perKiloFee: 8.5 },
  { state: 'Dadra and Nagar Haveli', perKiloFee: 8.5 },
  { state: 'Puducherry', perKiloFee: 10.75 },
  { state: 'Delhi', perKiloFee: 7 },
  { state: 'Port Blair', perKiloFee: 100 },
];

// City-specific charges
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 7 },
  { city: 'Bengloor', perKiloFee: 10.75 },
  { city: 'Bangalore', perKiloFee: 10.75 },
  { city: 'Hydrabad', perKiloFee: 10.75 },
  { city: 'Hyderabad', perKiloFee: 10.75 },
  { city: 'Chennai', perKiloFee: 10.75 },
  { city: 'Kolkata', perKiloFee: 13.75 },
  { city: 'Kolkatta', perKiloFee: 13.75 },
  { city: 'Mumbai', perKiloFee: 8.5 },
  { city: 'Ahmedabad', perKiloFee: 8.5 },
  { city: 'Pune', perKiloFee: 8.5 },
  { city: 'Coimbatore', perKiloFee: 10.75 },
  { city: 'Siliguri', perKiloFee: 10.75 },
  { city: 'Agartala', perKiloFee: 31 },
  { city: 'Imphal', perKiloFee: 31 },
  { city: 'Silchar', perKiloFee: 31 },
  { city: 'Jorhat', perKiloFee: 21 },
  { city: 'Nashik', perKiloFee: 8.5 },
  { city: 'Kerala', perKiloFee: 13.75 },
];

// Cities with green tax (100 rupees)
const greenTaxCities = [
  'Gurugram', 'Delhi', 'Kerala', 'Chennai', 'Kolkata', 'Kolkatta',
  'Hyderabad', 'Hydrabad', 'Mumbai', 'Bengloor', 'Bangalore', 'Ahmedabad', 'Pune'
];

async function updateSafexpress() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'Safexpress';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'Safexpress courier service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges with fuel surcharge (20%)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0.20, // 20% fuel surcharge
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
          fuelSurcharge: 0.20,
        },
        { upsert: true, new: true }
      );
      console.log(`Updated ${city.city}: ₹${city.perKiloFee}/kg`);
    }

    // Step 4: Add green tax for specific cities
    console.log('Adding green tax for major cities...');
    for (const city of greenTaxCities) {
      await SpecialCharges.findOneAndUpdate(
        { 
          providerId, 
          state: city,
          chargeType: 'GREEN_TAX',
          description: 'Green Tax for Major Cities'
        },
        {
          providerId,
          providerName,
          state: city,
          chargeType: 'GREEN_TAX',
          amount: 100,
          isPercentage: false,
          description: 'Green Tax for Major Cities',
          isActive: true,
        },
        { upsert: true, new: true }
      );
      console.log(`Added green tax for ${city}: ₹100`);
    }

    // Step 5: Update fixed charges
    console.log('Updating fixed charges...');
    await FixedCharges.findOneAndUpdate(
      { providerId },
      {
        providerId,
        docketCharge: 100,
        codCharge: 250,
        holidayCharge: 0,
        outstationCharge: 1200, // ODA charges
        insuranceChargePercent: 0.0001, // 0.001% as per data
        ngtGreenTax: 100, // Green tax (applied to specific cities)
        keralaHandlingCharge: 0,
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated');

    // Step 6: Update special charges (GST)
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

    console.log('\n✅ Safexpress charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating Safexpress charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateSafexpress();
