# Docket Charges Summary

**Updated on:** December 18, 2025

## Current Docket Charges by Courier Partner

| Courier Partner | Docket Charge | Status |
|----------------|---------------|---------|
| Gatti Cargo | ₹50 | ✅ Confirmed |
| Depee World | ₹50 | ✅ Confirmed |
| Trackon Courier | ₹150 | ✅ **Updated** |
| Trackon Courier (Air) | ₹150 | ✅ **Updated** |
| DTDC Courier | ₹50 | ✅ **Updated** |
| DTDC Courier (Air) | ₹50 | ✅ **Updated** |
| TCI Transport | ₹50 | ✅ Confirmed |
| DTDC Express Cargo | ₹50 | ✅ Confirmed |
| V Trans | ₹50 | ✅ Confirmed |
| Vision Logistics | ₹50 | ✅ Confirmed |
| Safexpress | ₹100 | ✅ Confirmed |

## Changes Made

### 1. Trackon Courier
- **Previous:** ₹0 (not specified)
- **Updated to:** ₹150 per docket
- **File:** `Backend/scripts/updateTrackonCourier.js`

### 2. DTDC Courier
- **Previous:** ₹150 per docket
- **Updated to:** ₹50 per docket
- **File:** `Backend/scripts/updateDTDCCourier.js`

## Database Status

✅ All docket charges have been updated in MongoDB  
✅ Changes are live and will be applied to all future freight calculations

## Notes

- **Air Services:** Trackon Courier (Air) and DTDC Courier (Air) use the same docket charges as their regular services
- **Safexpress:** Has the highest docket charge at ₹100
- **Most Common:** ₹50 is the standard docket charge for most couriers (9 out of 11)
- **Trackon Exception:** Charges ₹150, which is 3x the standard rate

## Verification

To verify the docket charges in the database:
```bash
node scripts/testFrontendInsurance.js
```

Or query directly:
```javascript
const FixedCharges = require('./models/fixedCharges.model');
const charges = await FixedCharges.find({}).populate('providerId');
```
