# 🧪 Testing Guide for Courier Partner Updates

## Available Test Scripts

### 1. **Quick Test** (testQuick.js)
Fast validation of database and volumetric weight configuration.

```bash
cd Backend/scripts
node testQuick.js
```

**What it checks:**
- ✅ Database connectivity
- ✅ Provider count
- ✅ Fixed charges count
- ✅ Volumetric divisor for each courier
- ✅ Minimum chargeable weight for each courier

**Duration:** ~5 seconds

---

### 2. **Comprehensive Test** (testCouriersComplete.js)
Complete validation with sample shipment calculations.

```bash
cd Backend/scripts
node testCouriersComplete.js
```

**What it tests:**
- ✅ Provider configuration
- ✅ Statewise charges (count)
- ✅ Special charges (count)
- ✅ Fixed charges details
- ✅ Volumetric weight calculations
- ✅ Freight calculations for 4 sample shipments per courier
- ✅ Fuel surcharge calculations
- ✅ Chargeable weight logic

**Duration:** ~30-60 seconds

**Sample Shipments Tested:**
1. Light package (5kg, 30×20×15 cm)
2. Medium package (15kg, 50×40×30 cm)
3. Heavy package (25kg, 100×80×60 cm)
4. Bulky but light (2kg, 60×60×60 cm)

---

### 3. **Run All Tests** (runAllTests.js)
Executes all test scripts sequentially.

```bash
cd Backend/scripts
node runAllTests.js
```

---

## Test Results Interpretation

### ✅ Success Indicators:
- All providers found in database
- Volumetric divisor configured for each courier
- Minimum chargeable weight set correctly
- Freight calculations work without errors
- Statewise charges exist for each courier

### ❌ Failure Indicators:
- Provider not found
- Missing fixed charges
- Undefined volumetric divisor
- Missing statewise charges
- Calculation errors

---

## Volumetric Weight Configuration

Each courier partner has specific configuration:

| Courier Partner | Divisor | Min Weight | Formula |
|-----------------|---------|------------|---------|
| Gatti Cargo | 27,000 | 6 kg | L×W×H ÷ 27,000 |
| Depee World | 27,000 | 6 kg | L×W×H ÷ 27,000 |
| Trackon Courier | 4,500 | 0 kg | L×W×H ÷ 4,500 |
| DTDC Courier | 4,750 | 3 kg | L×W×H ÷ 4,750 |
| DTDC Express Cargo | 27,000 | 25 kg | L×B×H ÷ 27,000 |
| TCI Transport | 27,000 | 20 kg | L×B×H ÷ 27,000 |
| V Trans | 27,000 | 30 kg | L×B×H ÷ 27,000 |
| Vision Logistics | 27,000 | 20 kg | L×B×H ÷ 27,000 |
| Safexpress | 27,000 | 20 kg | L×B×H ÷ 27,000 |

---

## Freight Calculation Logic

### Step-by-Step Process:

1. **Calculate Volumetric Weight**
   ```
   Volumetric Weight = (L × W × H) ÷ Divisor
   ```

2. **Determine Chargeable Weight**
   ```
   Chargeable Weight = MAX(Actual Weight, Volumetric Weight, Minimum Weight)
   ```

3. **Calculate Base Freight**
   ```
   Base Freight = Chargeable Weight × Per Kilo Rate
   ```

4. **Add Fuel Surcharge**
   ```
   Fuel Surcharge = Base Freight × Fuel Surcharge %
   Total Freight = Base Freight + Fuel Surcharge
   ```

5. **Add Fixed Charges**
   - Docket Charge
   - COD Charge (if applicable)
   - Insurance
   - Green Tax (if applicable)

6. **Calculate GST**
   ```
   GST = (Total Freight + Fixed Charges) × 18%
   ```

7. **Grand Total**
   ```
   Grand Total = Total Freight + Fixed Charges + GST
   ```

---

## Freight Calculator Utility

Use the freight calculator utility for custom calculations:

```javascript
const calculator = require('../utils/freightCalculator');

const shipment = {
  weight: 10,
  length: 40,
  width: 30,
  height: 20,
  invoiceValue: 15000,
  codAmount: 0,
  destination: 'Delhi'
};

const courierConfig = {
  volumetricDivisor: 27000,
  minimumChargeableWeight: 6,
  perKiloFee: 8.5,
  fuelSurcharge: 0.15,
  docketCharge: 50,
  codCharge: 50,
  insuranceChargePercent: 0.01,
  greenTax: 0,
  gstPercent: 0.18
};

const result = calculator.calculateTotalFreight(shipment, courierConfig);
console.log(result);
```

---

## Before Running Tests

1. **Ensure MongoDB is accessible**
   ```bash
   # Check .env file has correct ATLAS_URI
   ```

2. **Update all couriers first**
   ```bash
   node updateAllCouriers.js
   ```

3. **Wait for updates to complete**
   (Takes ~1-2 minutes for all 9 couriers)

---

## Troubleshooting

### Error: "Provider not found"
**Solution:** Run `updateAllCouriers.js` first

### Error: "Connection refused"
**Solution:** Check MongoDB URI in scripts, verify network access

### Error: "volumetricDivisor is undefined"
**Solution:** Re-run the courier update scripts with new model

### Incorrect calculations
**Solution:** Verify:
- Volumetric divisor is correct
- Minimum weight is set properly
- Fuel surcharge percentage is correct
- State charges exist

---

## Testing Workflow

```
┌─────────────────────────┐
│  1. Update All Couriers │
│  node updateAllCouriers │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  2. Run Quick Test      │
│  node testQuick.js      │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  3. Run Comprehensive   │
│  node testCouriersComplete │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  4. Verify Results      │
│  Check console output   │
└─────────────────────────┘
```

---

## Expected Test Output

### Quick Test Output:
```
✅ Gatti Cargo          | Divisor: 27000 | Min: 6 kg
✅ Depee World          | Divisor: 27000 | Min: 6 kg
✅ Trackon Courier      | Divisor: 4500  | Min: 0 kg
... (all 9 couriers)
```

### Comprehensive Test Output:
```
Testing: Gatti Cargo
✅ Provider found
✅ Volumetric Divisor: 27000
✅ Minimum Weight: 6 kg
✅ Statewise Charges: 35 states/cities
✅ Special Charges: 1 special charges

📦 Testing Shipment Calculations:
Shipment 1: Light package
  Actual Weight: 5 kg
  Volumetric Weight: 0.33 kg
  Chargeable Weight: 6.00 kg (minimum applied)
  Base Freight: ₹51.00
  Fuel Surcharge: ₹7.65
  Total Freight: ₹58.65
  Grand Total: ₹108.65
```

---

## Next Steps After Testing

1. ✅ Verify all tests pass
2. ✅ Check freight calculations are accurate
3. ✅ Test API endpoints (if available)
4. ✅ Test frontend integration
5. ✅ Perform UAT with real shipment data

---

**Last Updated:** December 18, 2025
