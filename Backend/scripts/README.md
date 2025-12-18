# Backend Scripts Directory

**Last Updated:** December 18, 2025

## 📁 Directory Structure

```
scripts/
├── archive/              # Old/deprecated scripts (for reference only)
├── update*.js           # Courier partner data update scripts
├── test*.js             # Testing and validation scripts
├── runAllTests.js       # Master test runner
└── updateAllCouriers.js # Master update runner
```

## 🔄 Update Scripts (Production)

These scripts update courier partner data in MongoDB:

| Script | Courier Partner | Purpose |
|--------|----------------|---------|
| `updateGattiCargo.js` | Gatti Cargo | Update rates, charges, and configuration |
| `updateDepeeWorld.js` | Depee World | Update rates, charges, and configuration |
| `updateTrackonCourier.js` | Trackon Courier | Update rates, charges, and configuration |
| `updateDTDCCourier.js` | DTDC Courier | Update rates, charges, and configuration |
| `updateDTDCExpressCargo.js` | DTDC Express Cargo | Update rates, charges, and configuration |
| `updateTCITransport.js` | TCI Transport | Update rates, charges, and configuration |
| `updateVTrans.js` | V Trans | Update rates, charges, and configuration |
| `updateVisionLogistics.js` | Vision Logistics | Update rates, charges, and configuration |
| `updateSafexpress.js` | Safexpress | Update rates, charges, and configuration |
| `updateAllCouriers.js` | **All Couriers** | Run all update scripts sequentially |

### Usage
```bash
# Update a specific courier
node scripts/updateGattiCargo.js

# Update all couriers at once
node scripts/updateAllCouriers.js
```

## 🧪 Test Scripts

Validation and testing scripts for the freight calculation system:

| Script | Purpose | When to Use |
|--------|---------|-------------|
| `testFreightCalculation.js` | Test weight calculation logic | After weight/volumetric changes |
| `testFrontendInsurance.js` | Test insurance priority (frontend vs DB) | After insurance logic changes |
| `testInsuranceCalculation.js` | Validate insurance percentages in DB | Database verification |
| `testFreightAPI.js` | Test API endpoints | After API changes |
| `testCouriersComplete.js` | Comprehensive courier tests | Full system validation |
| `testQuick.js` | Quick smoke test | Before deployment |
| `runAllTests.js` | Run all tests | Complete validation |

### Usage
```bash
# Run specific test
node scripts/testFrontendInsurance.js

# Run all tests
node scripts/runAllTests.js
```

## 📦 What Each Update Script Does

Each courier update script performs these operations:

1. **Create/Update Provider** - Ensures courier exists in database
2. **Update Statewise Charges** - Sets per-kg rates for each state
3. **Update City-Specific Charges** - Special rates for major cities
4. **Update Fixed Charges** - Docket, COD, insurance, volumetric config
5. **Update Special Charges** - GST, surcharges, additional fees
6. **Add Air Service Charges** - Air freight rates (where applicable)

## 🔧 Configuration Details

### Volumetric Weight Divisors
- **Gatti Cargo, Depee World:** 27,000 (L×W×H ÷ 27,000)
- **Trackon Courier:** 4,500 (L×W×H ÷ 4,500)
- **DTDC Courier:** 4,750 (L×W×H ÷ 4,750)
- **Others:** 27,000 (standard)

### Minimum Chargeable Weights
- **V Trans:** 30 kg
- **TCI Transport, Vision Logistics, Safexpress:** 20 kg
- **DTDC Express Cargo:** 25 kg
- **Gatti Cargo, Depee World:** 6 kg
- **Trackon, DTDC Courier:** 0 kg (no minimum)

### Docket Charges
See [DOCKET_CHARGES_SUMMARY.md](./DOCKET_CHARGES_SUMMARY.md) for complete list.

## 🗂️ Archive Folder

The `archive/` folder contains old scripts that are no longer used in production:

- One-time migration scripts
- Deprecated test scripts
- Old documentation files
- Development utilities

**Note:** Archive files are kept for reference only and should not be executed.

## 🚀 Quick Start

### First Time Setup
```bash
# Update all courier data
node scripts/updateAllCouriers.js

# Verify updates
node scripts/runAllTests.js
```

### After Making Changes
```bash
# Update specific courier
node scripts/update<CourierName>.js

# Test the changes
node scripts/testFreightCalculation.js
```

## ⚠️ Important Notes

1. **Database Connection:** All scripts connect to MongoDB Atlas. Ensure connection string is configured in environment or hardcoded in scripts.

2. **Idempotent Operations:** Update scripts use `findOneAndUpdate` with `upsert: true`, so they can be run multiple times safely.

3. **No Rollback:** Scripts directly modify the database. There's no automatic rollback. Always test in development first.

4. **Sequential Updates:** When running `updateAllCouriers.js`, scripts run sequentially with 2-second delays to avoid overwhelming the database.

## 📊 Testing Strategy

1. **Unit Tests:** `testFreightCalculation.js` - Weight logic
2. **Integration Tests:** `testFrontendInsurance.js` - Frontend/backend integration
3. **API Tests:** `testFreightAPI.js` - Endpoint validation
4. **Comprehensive:** `testCouriersComplete.js` - Full system test

## 🔄 Update Workflow

```
1. Modify update script (e.g., updateGattiCargo.js)
   ↓
2. Run update script
   ↓
3. Run relevant tests
   ↓
4. Verify in production (if tests pass)
```

## 📝 Maintenance

- **Monthly:** Review and update courier rates
- **Quarterly:** Verify volumetric divisors and minimums
- **As Needed:** Update docket charges, special charges

---

For detailed freight calculation logic, see `Backend/services/freightCalculationService.js`
