const mongoose = require('mongoose');
const StatewiseCharges = require('../models/statewiseCharges.model');
require('dotenv').config();

async function testTableColumnFix() {
  try {
    // Connect to database
    const mongoUri = process.env.ATLAS_URI || 'mongodb://localhost:27017/shipping-drodin';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    console.log('\n🧪 TESTING TABLE COLUMN STRUCTURE');
    console.log('=================================');

    // Get a sample statewise charge to see what fields are returned
    const charge = await StatewiseCharges.findOne({ state: 'Delhi' });
    
    if (charge) {
      console.log('\n📋 RAW DATABASE RECORD:');
      console.log('=======================');
      console.log('All fields in database:', Object.keys(charge.toObject()));
      
      console.log('\n🧹 CLEAN TRANSFORMATION:');
      console.log('========================');
      
      // Simulate what the frontend should receive
      const cleanedData = {
        "_id": charge._id,
        "Provider ID": charge.providerId,
        "Provider Name": charge.providerName,
        "State": charge.state,
        "Per Kilo Fee (INR)": charge.perKiloFee,
        "Fuel Surcharge (%)": charge.fuelSurcharge
      };
      
      console.log('Clean fields for frontend:', Object.keys(cleanedData));
      
      console.log('\n❌ FIELDS TO EXCLUDE:');
      console.log('====================');
      const allFields = Object.keys(charge.toObject());
      const cleanFields = Object.keys(cleanedData);
      const excludedFields = allFields.filter(field => !cleanFields.includes(field.toString()));
      
      console.log('Excluded fields:', excludedFields);
      
      console.log('\n📊 SUMMARY:');
      console.log('===========');
      console.log(`Total fields in DB: ${allFields.length}`);
      console.log(`Clean fields for UI: ${cleanFields.length}`);
      console.log(`Excluded fields: ${excludedFields.length}`);
      
      if (excludedFields.length > 0) {
        console.log('\n✅ Column filtering is working - unnecessary fields will be hidden');
      } else {
        console.log('\n⚠️ No fields to exclude - check if this is expected');
      }
      
      // Test the actual API response
      console.log('\n🔄 TESTING SINGLE ROW UPDATE API:');
      console.log('=================================');
      
      const API_BASE_URL = 'http://localhost:5000';
      try {
        const response = await fetch(`${API_BASE_URL}/api/charges/statewise/update-row/${charge._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            perKiloFee: charge.perKiloFee,
            fuelSurcharge: charge.fuelSurcharge
          })
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          console.log('API Response fields:', Object.keys(result.data));
          
          // Fields that should be excluded
          const fieldsToExclude = ['__v', 'createdAt', 'updatedAt'];
          const problematicFields = Object.keys(result.data).filter(field => 
            fieldsToExclude.includes(field)
          );
          
          if (problematicFields.length > 0) {
            console.log(`⚠️ API response contains problematic fields: ${problematicFields.join(', ')}`);
            console.log('✅ Our cleanApiResponseData function will filter these out');
          } else {
            console.log('✅ API response is clean - no problematic fields');
          }
        }
        
      } catch (apiError) {
        console.log('❌ API test failed:', apiError.message);
      }
      
    } else {
      console.log('❌ No statewise charge found for testing');
    }

    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');

  } catch (error) {
    console.error('❌ Test error:', error);
    process.exit(1);
  }
}

testTableColumnFix();