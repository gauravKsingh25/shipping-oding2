const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
const SpecialCharges = require('../models/specialCharges.model');

const ATLAS_URI = 'mongodb+srv://marketplace:AOs6RxdWS50TluZV@drodin.jcbgrzd.mongodb.net/';

// Vision Logistics statewise charges
const statewiseData = [
  { state: 'Andhra Pradesh', perKiloFee: 22 },
  { state: 'Arunachal Pradesh', perKiloFee: 24 },
  { state: 'Assam', perKiloFee: 24 },
  { state: 'Bihar', perKiloFee: 22 },
  { state: 'Chhattisgarh', perKiloFee: 24 },
  { state: 'Goa', perKiloFee: 24 },
  { state: 'Gujarat', perKiloFee: 22 },
  { state: 'Haryana', perKiloFee: 10 },
  { state: 'Himachal Pradesh', perKiloFee: 15 },
  { state: 'Jharkhand', perKiloFee: 22 },
  { state: 'Karnataka', perKiloFee: 22 },
  { state: 'Kerala', perKiloFee: 22 },
  { state: 'Madhya Pradesh', perKiloFee: 22 },
  { state: 'Maharashtra', perKiloFee: 22 },
  { state: 'Manipur', perKiloFee: 24 },
  { state: 'Meghalaya', perKiloFee: 24 },
  { state: 'Mizoram', perKiloFee: 24 },
  { state: 'Nagaland', perKiloFee: 24 },
  { state: 'Odisha', perKiloFee: 24 },
  { state: 'Punjab', perKiloFee: 10 },
  { state: 'Rajasthan', perKiloFee: 15 },
  { state: 'Sikkim', perKiloFee: 24 },
  { state: 'Tamil Nadu', perKiloFee: 22 },
  { state: 'Telangana', perKiloFee: 22 },
  { state: 'Tripura', perKiloFee: 24 },
  { state: 'Uttar Pradesh', perKiloFee: 15 },
  { state: 'Uttarakhand', perKiloFee: 15 },
  { state: 'West Bengal', perKiloFee: 22 },
  { state: 'Jammu and Kashmir', perKiloFee: 25 },
  { state: 'Jammu', perKiloFee: 20 },
  { state: 'Delhi', perKiloFee: 10 },
];

// City-specific charges
const cityCharges = [
  { city: 'Gurugram', perKiloFee: 10 },
  { city: 'Bengloor', perKiloFee: 22 },
  { city: 'Bangalore', perKiloFee: 22 },
  { city: 'Hydrabad', perKiloFee: 22 },
  { city: 'Hyderabad', perKiloFee: 22 },
  { city: 'Chennai', perKiloFee: 22 },
  { city: 'Kolkata', perKiloFee: 22 },
  { city: 'Kolkatta', perKiloFee: 22 },
  { city: 'Mumbai', perKiloFee: 22 },
  { city: 'Ahmedabad', perKiloFee: 22 },
  { city: 'Coimbatore', perKiloFee: 22 },
  { city: 'Siliguri', perKiloFee: 22 },
  { city: 'Agartala', perKiloFee: 22 },
  { city: 'Imphal', perKiloFee: 24 },
  { city: 'Silchar', perKiloFee: 24 },
  { city: 'Nashik', perKiloFee: 22 },
  { city: 'Kerala', perKiloFee: 22 },
];

async function updateVisionLogistics() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(ATLAS_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB successfully');

    const providerName = 'Vision Logistics';

    // Step 1: Create or update provider
    let provider = await Provider.findOne({ providerName });
    if (!provider) {
      provider = new Provider({
        providerName,
        description: 'Vision Logistics service',
        isActive: true,
      });
      await provider.save();
      console.log(`Created provider: ${providerName} with ID: ${provider.providerId}`);
    } else {
      console.log(`Provider found: ${providerName} with ID: ${provider.providerId}`);
    }

    const providerId = provider.providerId;

    // Step 2: Update statewise charges (no fuel surcharge specified)
    console.log('Updating statewise charges...');
    for (const data of statewiseData) {
      await StatewiseCharges.findOneAndUpdate(
        { providerId, state: data.state },
        {
          providerId,
          providerName,
          state: data.state,
          perKiloFee: data.perKiloFee,
          fuelSurcharge: 0, // No fuel surcharge specified
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
          fuelSurcharge: 0,
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
        codCharge: 150,
        holidayCharge: 0,
        outstationCharge: 350, // Punjab/Haryana, other 750
        insuranceChargePercent: 0.000001, // 0.0001% = 0.0001/100 = 0.000001
        ngtGreenTax: 0,
        keralaHandlingCharge: 0,
        volumetricDivisor: 27000, // L×B×H ÷ 27,000
        minimumChargeableWeight: 20, // Minimum 20 kg
      },
      { upsert: true, new: true }
    );
    console.log('Fixed charges updated with volumetric divisor: 27000, min weight: 20kg');

    // Step 5: Update special charges (GST - 18%)
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

    console.log('\n✅ Vision Logistics charges updated successfully!');
    
  } catch (error) {
    console.error('Error updating Vision Logistics charges:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run the script
updateVisionLogistics();
