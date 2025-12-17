const mongoose = require('mongoose');
const Provider = require('../models/provider.model');
const StatewiseCharges = require('../models/statewiseCharges.model');
const FixedCharges = require('../models/fixedCharges.model');
require('dotenv').config();

async function testAdvancedSettingsAPIs() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    const API_BASE_URL = 'http://localhost:5000'; // Assuming backend is running

    // Test 1: Provider Update
    console.log('\n🧪 TEST 1: Provider Update API');
    console.log('===============================');
    
    try {
      const provider = await Provider.findOne({ providerId: 4 });
      if (provider) {
        console.log(`Found provider ID 4: "${provider.providerName}"`);
        
        // Test API call (simulating frontend)
        const updatePayload = {
          providerName: provider.providerName + ' (Test)',
          description: 'Test update description',
          isActive: true
        };
        
        console.log(`Testing update with payload:`, updatePayload);
        
        const response = await fetch(`${API_BASE_URL}/api/providers/update-row/4`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        
        const result = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Response:`, result);
        
        if (result.success) {
          console.log('✅ Provider update API works!');
          
          // Revert the change
          await fetch(`${API_BASE_URL}/api/providers/update-row/4`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              providerName: provider.providerName,
              description: provider.description,
              isActive: provider.isActive
            })
          });
          console.log('✅ Reverted test changes');
        } else {
          console.log('❌ Provider update API failed!');
        }
      }
    } catch (error) {
      console.log(`❌ Provider update test failed: ${error.message}`);
    }

    // Test 2: Statewise Charges Update (This is likely where the issue is)
    console.log('\n🧪 TEST 2: Statewise Charges Update API');
    console.log('========================================');
    
    try {
      const statewiseCharge = await StatewiseCharges.findOne({ providerId: 4, state: 'Delhi' });
      if (statewiseCharge) {
        console.log(`Found statewise charge: Provider ID ${statewiseCharge.providerId}, State: ${statewiseCharge.state}`);
        console.log(`MongoDB _id: ${statewiseCharge._id}`);
        console.log(`Current values: ₹${statewiseCharge.perKiloFee}/kg, ${statewiseCharge.fuelSurcharge}% fuel`);
        
        // Test API call (simulating frontend)
        const updatePayload = {
          perKiloFee: statewiseCharge.perKiloFee + 1, // Add 1 rupee for test
          fuelSurcharge: statewiseCharge.fuelSurcharge
        };
        
        console.log(`Testing update with payload:`, updatePayload);
        
        const response = await fetch(`${API_BASE_URL}/api/charges/statewise/update-row/${statewiseCharge._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        
        const result = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Response:`, result);
        
        if (result.success) {
          console.log('✅ Statewise charges update API works!');
          
          // Revert the change
          await fetch(`${API_BASE_URL}/api/charges/statewise/update-row/${statewiseCharge._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              perKiloFee: statewiseCharge.perKiloFee,
              fuelSurcharge: statewiseCharge.fuelSurcharge
            })
          });
          console.log('✅ Reverted test changes');
        } else {
          console.log('❌ Statewise charges update API failed!');
        }
      } else {
        console.log('❌ No statewise charge found for testing');
      }
    } catch (error) {
      console.log(`❌ Statewise charges update test failed: ${error.message}`);
    }

    // Test 3: Fixed Charges Update
    console.log('\n🧪 TEST 3: Fixed Charges Update API');
    console.log('====================================');
    
    try {
      const fixedCharge = await FixedCharges.findOne({ providerId: 4 });
      if (fixedCharge) {
        console.log(`Found fixed charge: Provider ID ${fixedCharge.providerId}`);
        console.log(`Current values: Docket ₹${fixedCharge.docketCharge}, COD ₹${fixedCharge.codCharge}`);
        
        // Test API call (simulating frontend)
        const updatePayload = {
          docketCharge: fixedCharge.docketCharge,
          codCharge: fixedCharge.codCharge,
          holidayCharge: fixedCharge.holidayCharge,
          outstationCharge: fixedCharge.outstationCharge,
          insuranceChargePercent: fixedCharge.insuranceChargePercent,
          ngtGreenTax: fixedCharge.ngtGreenTax + 1, // Add 1 rupee for test
          keralaHandlingCharge: fixedCharge.keralaHandlingCharge
        };
        
        console.log(`Testing update with payload:`, updatePayload);
        
        const response = await fetch(`${API_BASE_URL}/api/charges/fixed/update-row/${fixedCharge.providerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatePayload)
        });
        
        const result = await response.json();
        console.log(`Response status: ${response.status}`);
        console.log(`Response:`, result);
        
        if (result.success) {
          console.log('✅ Fixed charges update API works!');
          
          // Revert the change
          await fetch(`${API_BASE_URL}/api/charges/fixed/update-row/${fixedCharge.providerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              docketCharge: fixedCharge.docketCharge,
              codCharge: fixedCharge.codCharge,
              holidayCharge: fixedCharge.holidayCharge,
              outstationCharge: fixedCharge.outstationCharge,
              insuranceChargePercent: fixedCharge.insuranceChargePercent,
              ngtGreenTax: fixedCharge.ngtGreenTax,
              keralaHandlingCharge: fixedCharge.keralaHandlingCharge
            })
          });
          console.log('✅ Reverted test changes');
        } else {
          console.log('❌ Fixed charges update API failed!');
        }
      } else {
        console.log('❌ No fixed charge found for testing');
      }
    } catch (error) {
      console.log(`❌ Fixed charges update test failed: ${error.message}`);
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testAdvancedSettingsAPIs();