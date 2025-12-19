import React, { useEffect, useState, useCallback } from "react";
import BoxDialog from "./BoxDialog";
import ExportDialog from "./ExportDialog";
import AdvancedSettings from "./AdvancedSettings";
import { 
  Settings, 
  Package, 
  ChevronDown, 
  Plus, 
  Copy, 
  Trash2, 
  Download, 
  Calculator, 
  Check,
  Truck
} from 'lucide-react';
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';

export default function Dashboard() {
  const [providers, setProviders] = useState([]);
  const [states, setStates] = useState([]);
  const [statewiseCharges, setStatewiseCharges] = useState([]);
  const [fixedCharges, setFixedCharges] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [results, setResults] = useState([]);
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [selectedProviderIdx, setSelectedProviderIdx] = useState(null);
  const [vendorName, setVendorName] = useState("");
  const [savedSelections, setSavedSelections] = useState([]);
  const [boxes, setBoxes] = useState([]);
  const [boxDialogOpen, setBoxDialogOpen] = useState(false);
  const [boxToDuplicate, setBoxToDuplicate] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [selectedVendor, setSelectedVendor] = useState("");
  const [loading, setLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  
  // Add advanced settings state
  const [advancedSettingsOpen, setAdvancedSettingsOpen] = useState(false);

  // Add missing state for checkboxes
  const [cod, setCOD] = useState(false);
  const [holiday, setHoliday] = useState(false);
  const [outstation, setOutstation] = useState(false);

  // Add new states for shipment value and insurance
  const [shipmentValue, setShipmentValue] = useState("");
  const [insurancePercentage, setInsurancePercentage] = useState("");

  // API base URL - use environment variable with fallback
  const API_BASE_URL = process.env.REACT_APP_API_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://shipping-drodin.onrender.com' 
      : 'http://localhost:5000');

  const loadSavedSelections = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/selections`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      if (result.success) {
        setSavedSelections(result.data || []);
      }
    } catch (error) {
      console.error('Error loading saved selections:', error);
      setSavedSelections([]);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    // Load data from API
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch providers
        const providersResponse = await fetch(`${API_BASE_URL}/api/providers`);
        if (providersResponse.ok) {
          const providersData = await providersResponse.json();
          // Transform MongoDB data to match expected format
          const transformedProviders = providersData.map(p => ({
            "Provider ID": p.providerId,
            "Provider Name": p.providerName,
            description: p.description,
            isActive: p.isActive
          }));
          setProviders(transformedProviders);
        }

        // Fetch fixed charges
        const fixedChargesResponse = await fetch(`${API_BASE_URL}/api/charges/fixed`);
        if (fixedChargesResponse.ok) {
          const fixedChargesData = await fixedChargesResponse.json();
          // Transform MongoDB data to match expected format
          const transformedFixedCharges = fixedChargesData.map(f => ({
            "Provider ID": f.providerId,
            "Docket Charge (INR)": f.docketCharge,
            "COD Charge (INR)": f.codCharge,
            "Holiday Charge (INR)": f.holidayCharge,
            "Outstation Charge (INR)": f.outstationCharge,
            "Insurance Charge (%)": f.insuranceChargePercent,
            "NGT Green Tax (INR)": f.ngtGreenTax,
            "Kerala North East Handling Charge (INR)": f.keralaHandlingCharge,
            "Volumetric Divisor": f.volumetricDivisor || 5000,
            "Minimum Chargeable Weight (kg)": f.minimumChargeableWeight || 0,
            "Minimum Price (INR)": f.minimumPrice || 0
          }));
          setFixedCharges(transformedFixedCharges);
        }

        // Fetch statewise charges
        const statewiseChargesResponse = await fetch(`${API_BASE_URL}/api/charges/statewise`);
        if (statewiseChargesResponse.ok) {
          const statewiseChargesData = await statewiseChargesResponse.json();
          // Transform MongoDB data to match expected format
          const transformedStatewiseCharges = statewiseChargesData.map(s => ({
            "_id": s._id, // Include MongoDB ID for updates
            "Provider ID": s.providerId,
            "Provider Name": s.providerName,
            "State": s.state,
            "Per Kilo Fee (INR)": s.perKiloFee,
            "Fuel Surcharge (%)": s.fuelSurcharge
          }));
          setStatewiseCharges(transformedStatewiseCharges);
          
          // Extract unique states from the statewise charges data
          const uniqueStates = [...new Set(transformedStatewiseCharges.map(charge => charge.State))].sort();
          setStates(uniqueStates);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    loadSavedSelections();
  }, [API_BASE_URL, loadSavedSelections]);

  const openAddBoxDialog = () => {
    setBoxToDuplicate(null);
    setBoxDialogOpen(true);
  };

  const openDuplicateBoxDialog = idx => {
    const boxToDuplicate = boxes[idx];
    const duplicatedBox = { ...boxToDuplicate, quantity: boxToDuplicate.quantity };
    setBoxes(prev => [...prev, duplicatedBox]);
  };

  const handleAddBox = box => {
    if (boxToDuplicate) {
      // Duplicate: update quantity for the box
      setBoxes(prev =>
        prev.map(b =>
          b === boxToDuplicate
            ? { ...b, quantity: box.quantity }
            : b
        )
      );
    } else {
      setBoxes(prev => [...prev, box]);
    }
    setBoxDialogOpen(false);
    setBoxToDuplicate(null);
  };

  const handleRemoveBox = idx => {
    setBoxes(prev => prev.filter((_, i) => i !== idx));
  };

  const calculate = async () => {
    if (!selectedState || boxes.length === 0) {
      alert('Please select a state and add at least one box');
      return;
    }

    // Validate data is loaded
    if (!states.length || !providers.length || !fixedCharges.length || !statewiseCharges.length) {
      alert('Configuration data is still loading. Please wait and try again.');
      return;
    }

    console.log('Calculating for state:', selectedState);
    console.log('Available states:', states);

    // Filter statewise charges for the selected state
    const stateFiltered = statewiseCharges.filter(s => s.State && s.State.toLowerCase() === selectedState.toLowerCase());
    
    if (stateFiltered.length === 0) {
      alert(`No data found for state: ${selectedState}`);
      return;
    }

    console.log('Filtered state data:', stateFiltered);

    // Filter out providers that don't exist in the providers list (deleted/inactive providers)
    const validStateFiltered = stateFiltered.filter(stateRow => {
      const vendorId = stateRow["Provider ID"];
      const provider = providers.find(p => p["Provider ID"] === vendorId);
      const fixed = fixedCharges.find(f => f["Provider ID"] === vendorId);
      
      if (!provider || !fixed) {
        console.warn(`Skipping provider ID ${vendorId} - not found in active providers`);
        return false;
      }
      return true;
    });

    console.log(`Calculating for ${validStateFiltered.length} active providers`);

    const providerResults = await Promise.all(validStateFiltered.map(async (stateRow) => {
      const vendorId = stateRow["Provider ID"];
      const provider = providers.find(p => p["Provider ID"] === vendorId);
      const fixed = fixedCharges.find(f => f["Provider ID"] === vendorId);

      // Get volumetric divisor and minimum chargeable weight from fixed charges
      const volumetricDivisor = Number(fixed?.["Volumetric Divisor"]) || 5000; // Default to 5000 if not found
      const minimumChargeableWeight = Number(fixed?.["Minimum Chargeable Weight (kg)"]) || 0;

      console.log(`\n📦 ${provider?.["Provider Name"]} - Weight Calculation:`);
      console.log(`   Volumetric Divisor: ${volumetricDivisor}`);
      console.log(`   Minimum Chargeable Weight (for entire shipment): ${minimumChargeableWeight} kg`);

      // Calculate total actual weight and total volumetric weight
      let totalActualWeight = 0;
      let totalVolumetricWeight = 0;
      
      boxes.forEach((box, idx) => {
        // Calculate volumetric weight for this box using the provider's specific divisor
        const volWeightPerBox = (box.length * box.breadth * box.height) / volumetricDivisor;
        
        console.log(`   Box ${idx + 1}: ${box.length}×${box.breadth}×${box.height} cm, ${box.deadWeight} kg (qty: ${box.quantity})`);
        console.log(`      Volume: ${box.length * box.breadth * box.height} cm³`);
        console.log(`      Volumetric Weight per box: ${volWeightPerBox.toFixed(2)} kg`);
        console.log(`      Actual Weight per box: ${box.deadWeight} kg`);
        console.log(`      Total volumetric for ${box.quantity} box(es): ${(volWeightPerBox * box.quantity).toFixed(2)} kg`);
        console.log(`      Total actual for ${box.quantity} box(es): ${(box.deadWeight * box.quantity).toFixed(2)} kg`);
        
        // Add to totals
        totalActualWeight += box.deadWeight * box.quantity;
        totalVolumetricWeight += volWeightPerBox * box.quantity;
      });

      // Now apply minimum weight to the TOTAL shipment
      const totalApplicableWeight = Math.max(totalActualWeight, totalVolumetricWeight, minimumChargeableWeight);
      
      const weightType = totalApplicableWeight === minimumChargeableWeight ? 'minimum' :
                        totalApplicableWeight === totalVolumetricWeight ? 'volumetric' : 'actual';
      
      console.log(`\n   📊 TOTAL WEIGHT SUMMARY:`);
      console.log(`      Total Actual Weight: ${totalActualWeight.toFixed(2)} kg`);
      console.log(`      Total Volumetric Weight: ${totalVolumetricWeight.toFixed(2)} kg`);
      console.log(`      Minimum Weight: ${minimumChargeableWeight} kg`);
      console.log(`      ✅ Chargeable Weight: ${totalApplicableWeight.toFixed(2)} kg (using ${weightType})\n`);

      const perKilo = Number(stateRow["Per Kilo Fee (INR)"]) || 0;
      const fuelPct = Number(stateRow["Fuel Surcharge (%)"]) || 0;
      const baseCost = perKilo * totalApplicableWeight;
      const fuelCharge = (baseCost * fuelPct) / 100;

      const totalBoxes = boxes.reduce((sum, box) => sum + box.quantity, 0);
      
      // Fixed charges applied only ONCE per shipment (not per box)
      const docket = Number(fixed?.["Docket Charge (INR)"]) || 0;
      const codCharge = cod ? (Number(fixed?.["COD Charge (INR)"]) || 0) : 0;
      const holidayCharge = holiday ? (Number(fixed?.["Holiday Charge (INR)"]) || 0) : 0;
      const outstationCharge = outstation ? (Number(fixed?.["Outstation Charge (INR)"]) || 0) : 0;
      
      // NGT Green Tax - fixed charge per shipment
      const ngtGreenTax = Number(fixed?.["NGT Green Tax (INR)"]) || 0;
      
      // Insurance charge - percentage of shipment value
      let insuranceCharge = 0;
      if (shipmentValue && insurancePercentage && !isNaN(shipmentValue) && !isNaN(insurancePercentage)) {
        const insuranceRate = Number(fixed?.["Insurance Charge (%)"]) || 0;
        insuranceCharge = (Number(shipmentValue) * Number(insurancePercentage) * insuranceRate) / 10000; // percentage of percentage
      }
      
      // Kerala/North East handling charge - per box for specific states
      let stateSpecificCharge = 0;
      const isKeralaOrNorthEast = selectedState.toLowerCase().includes('kerala') || 
                                 selectedState.toLowerCase().includes('assam') ||
                                 selectedState.toLowerCase().includes('manipur') ||
                                 selectedState.toLowerCase().includes('meghalaya') ||
                                 selectedState.toLowerCase().includes('mizoram') ||
                                 selectedState.toLowerCase().includes('nagaland') ||
                                 selectedState.toLowerCase().includes('tripura') ||
                                 selectedState.toLowerCase().includes('arunachal pradesh');
      
      if (isKeralaOrNorthEast) {
        const handlingChargePerBox = Number(fixed?.["Kerala North East Handling Charge (INR)"]) || 15;
        stateSpecificCharge = handlingChargePerBox * totalBoxes;
      }

      // Fetch and calculate special charges
      let specialCharges = 0;
      let specialChargesDetails = [];
      try {
        const shipmentDetails = {
          baseAmount: baseCost + fuelCharge,
          weight: totalApplicableWeight,
          serviceType: 'SURFACE', // Default service type
          city: selectedState // Using state as city for now
        };

        const specialChargesResponse = await fetch(`${API_BASE_URL}/api/special-charges/calculate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            providerId: vendorId,
            state: selectedState,
            shipmentDetails: shipmentDetails
          })
        });

        if (specialChargesResponse.ok) {
          const specialChargesResult = await specialChargesResponse.json();
          if (specialChargesResult.success) {
            specialCharges = specialChargesResult.data.totalAmount || 0;
            specialChargesDetails = specialChargesResult.data.charges || [];
          }
        }
      } catch (error) {
        console.warn('Failed to fetch special charges:', error);
        // Continue without special charges
      }

      const total = baseCost + fuelCharge + docket + codCharge + holidayCharge + 
                   outstationCharge + ngtGreenTax + insuranceCharge + stateSpecificCharge + specialCharges;

      // Apply minimum price if set (e.g., V Trans has minimum ₹500)
      const minimumPrice = Number(fixed?.["Minimum Price (INR)"]) || 0;
      const finalTotal = minimumPrice > 0 ? Math.max(total, minimumPrice) : total;

      return {
        providerId: vendorId,
        providerName: provider?.["Provider Name"] || `Unknown Provider (ID: ${vendorId})`,
        applicableWeight: totalApplicableWeight.toFixed(2),
        weightDetails: { totalWeight: totalApplicableWeight.toFixed(2), boxes },
        baseCost: baseCost.toFixed(2),
        fuelCharge: fuelCharge.toFixed(2),
        docket: docket.toFixed(2),
        codCharge: codCharge.toFixed(2),
        holidayCharge: holidayCharge.toFixed(2),
        outstationCharge: outstationCharge.toFixed(2),
        ngtGreenTax: ngtGreenTax.toFixed(2),
        insuranceCharge: insuranceCharge.toFixed(2),
        stateSpecificCharge: stateSpecificCharge.toFixed(2),
        specialCharges: specialCharges.toFixed(2),
        specialChargesDetails: specialChargesDetails,
        total: finalTotal.toFixed(2),
        minimumPriceApplied: finalTotal > total ? minimumPrice : 0
      };
    }));

    console.log('Provider results:', providerResults);

    providerResults.sort((a, b) => parseFloat(a.total) - parseFloat(b.total));
    setResults(providerResults);
    setExpandedIdx(null);
    setSelectedProviderIdx(null);
    setVendorName("");
  };

  const handleProviderSelect = idx => {
    setSelectedProviderIdx(idx);
    setVendorName("");
  };

// HTML fallback function for quotation generation
const generateHTMLQuotation = (vendorName, provider, selectedState, boxes, totalPackages, totalWeight, formattedDate, cod, holiday, outstation) => {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Shipping Quotation - ${vendorName}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        .header {
            text-align: center;
            color: #2563eb;
            border-bottom: 3px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .quote-details {
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .provider-info {
            background: #ecfdf5;
            padding: 20px;
            border-radius: 8px;
            border-left: 5px solid #059669;
            margin-bottom: 30px;
        }
        .total-cost {
            font-size: 1.8em;
            color: #dc2626;
            font-weight: bold;
            text-align: center;
            background: #fef2f2;
            padding: 15px;
            border-radius: 8px;
            border: 2px solid #dc2626;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        th, td {
            padding: 12px;
            text-align: left;
            border: 1px solid #e5e7eb;
        }
        th {
            background: #f3f4f6;
            font-weight: bold;
            color: #374151;
        }
        .total-row {
            background: #fef3c7;
            font-weight: bold;
            font-size: 1.1em;
        }
        .section-title {
            color: #2563eb;
            font-size: 1.4em;
            font-weight: bold;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #e5e7eb;
        }
        .package-item {
            background: #f8fafc;
            padding: 10px;
            margin: 5px 0;
            border-radius: 4px;
            border-left: 3px solid #6366f1;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-style: italic;
        }
        .additional-services {
            background: #eff6ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
        }
        @media print {
            body { padding: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>SHIPPING QUOTATION</h1>
    </div>

    <div class="quote-details">
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Vendor:</strong> ${vendorName}</p>
        <p><strong>Destination State:</strong> ${selectedState}</p>
    </div>

    <div class="provider-info">
        <h2 style="color: #059669; margin-top: 0;">SELECTED PROVIDER</h2>
        <p><strong>Provider:</strong> ${provider.providerName}</p>
        <div class="total-cost">
            Total Cost: ₹${provider.total}
        </div>
    </div>

    <div class="section-title">PACKAGE DETAILS</div>
    <p><strong>Total Packages:</strong> ${totalPackages}</p>
    <p><strong>Total Applicable Weight:</strong> ${totalWeight} kg</p>
    
    ${boxes.map((box, idx) => `
        <div class="package-item">
            <strong>Package ${idx + 1}:</strong> ${box.length}×${box.breadth}×${box.height} cm, ${box.deadWeight} kg, Qty: ${box.quantity}
        </div>
    `).join('')}

    <div class="section-title">COST BREAKDOWN</div>
    <table>
        <thead>
            <tr>
                <th>Service</th>
                <th style="text-align: right;">Amount (₹)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Base Shipping Cost</td>
                <td style="text-align: right;">${provider.baseCost}</td>
            </tr>
            <tr>
                <td>Fuel Surcharge</td>
                <td style="text-align: right;">${provider.fuelCharge}</td>
            </tr>
            <tr>
                <td>Docket Charge</td>
                <td style="text-align: right;">${provider.docket}</td>
            </tr>
            ${parseFloat(provider.codCharge) > 0 ? `
            <tr>
                <td>COD Charge</td>
                <td style="text-align: right;">${provider.codCharge}</td>
            </tr>` : ''}
            ${parseFloat(provider.holidayCharge) > 0 ? `
            <tr>
                <td>Holiday Charge</td>
                <td style="text-align: right;">${provider.holidayCharge}</td>
            </tr>` : ''}
            ${parseFloat(provider.outstationCharge) > 0 ? `
            <tr>
                <td>Outstation Charge</td>
                <td style="text-align: right;">${provider.outstationCharge}</td>
            </tr>` : ''}
            ${parseFloat(provider.ngtGreenTax) > 0 ? `
            <tr>
                <td>NGT Green Tax</td>
                <td style="text-align: right;">${provider.ngtGreenTax}</td>
            </tr>` : ''}
            ${parseFloat(provider.insuranceCharge) > 0 ? `
            <tr>
                <td>Insurance Charge</td>
                <td style="text-align: right;">${provider.insuranceCharge}</td>
            </tr>` : ''}
            ${parseFloat(provider.stateSpecificCharge) > 0 ? `
            <tr>
                <td>Kerala/NE Handling Charge</td>
                <td style="text-align: right;">${provider.stateSpecificCharge}</td>
            </tr>` : ''}
            ${parseFloat(provider.specialCharges) > 0 ? `
            <tr>
                <td>Special Charges</td>
                <td style="text-align: right;">${provider.specialCharges}</td>
            </tr>` : ''}
            ${provider.specialChargesDetails && provider.specialChargesDetails.length > 0 ? 
              provider.specialChargesDetails.map(charge => `
            <tr>
                <td style="padding-left: 20px;">• ${charge.description}</td>
                <td style="text-align: right;">₹${charge.amount.toFixed(2)}</td>
            </tr>`).join('') : ''}
            <tr class="total-row">
                <td><strong>TOTAL</strong></td>
                <td style="text-align: right; color: #dc2626;"><strong>₹${provider.total}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">ADDITIONAL SERVICES</div>
    <div class="additional-services">
        <p><strong>Cash on Delivery:</strong> ${cod ? 'Yes' : 'No'}</p>
        <p><strong>Holiday Delivery:</strong> ${holiday ? 'Yes' : 'No'}</p>
        <p><strong>Outstation Delivery:</strong> ${outstation ? 'Yes' : 'No'}</p>
    </div>

    <div class="footer">
        <p>This quotation is valid for 30 days from the date of issue.</p>
        <p>Generated on ${formattedDate} by Shipping Calculator</p>
        <p class="no-print">You can print this page to PDF using your browser's print function (Ctrl+P)</p>
    </div>
</body>
</html>`;
};

  const handleSaveSelection = async () => {
    if (!vendorName.trim()) {
      alert('Please enter a vendor name');
      return;
    }

    const provider = results[selectedProviderIdx];
    if (!provider) {
      alert('Please select a provider first');
      return;
    }

    setLoading(true);
    
    try {
      // Create Word document with quotation details
      const currentDate = new Date();
      const formattedDate = currentDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Calculate package details
      const totalPackages = boxes.reduce((sum, box) => sum + box.quantity, 0);
      const totalWeight = boxes.reduce((sum, box) => {
        const volWeight = (box.length * box.breadth * box.height) / 5000;
        const applicableWeight = Math.max(volWeight, box.deadWeight);
        return sum + (applicableWeight * box.quantity);
      }, 0).toFixed(2);

      try {
        // Try to create DOCX document
        const doc = new Document({
          sections: [{
            properties: {},
            children: [
              // Header
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SHIPPING QUOTATION",
                    bold: true,
                    size: 32,
                    color: "2563eb"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
              }),
              
              // Date and Quote Details
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Date: ${formattedDate}`,
                    bold: true,
                    size: 24
                  })
                ],
                spacing: { after: 200 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Vendor: ${vendorName.trim()}`,
                    bold: true,
                    size: 24
                  })
                ],
                spacing: { after: 200 }
              }),
              
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Destination State: ${selectedState}`,
                    bold: true,
                    size: 24
                  })
                ],
                spacing: { after: 400 }
              }),

              // Selected Provider Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "SELECTED PROVIDER",
                    bold: true,
                    size: 28,
                    color: "059669"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Provider: ${provider.providerName}`,
                    bold: true,
                    size: 24
                  })
                ],
                spacing: { after: 200 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total Cost: ₹${provider.total}`,
                    bold: true,
                    size: 28,
                    color: "dc2626"
                  })
                ],
                spacing: { after: 400 }
              }),

              // Package Details Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "PACKAGE DETAILS",
                    bold: true,
                    size: 28,
                    color: "2563eb"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total Packages: ${totalPackages}`,
                    size: 22
                  })
                ],
                spacing: { after: 200 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Total Applicable Weight: ${totalWeight} kg`,
                    size: 22
                  })
                ],
                spacing: { after: 300 }
              }),

              // Package breakdown
              ...boxes.map((box, idx) => new Paragraph({
                children: [
                  new TextRun({
                    text: `Package ${idx + 1}: ${box.length}×${box.breadth}×${box.height} cm, ${box.deadWeight} kg, Qty: ${box.quantity}`,
                    size: 20
                  })
                ],
                spacing: { after: 150 }
              })),

              // Cost Breakdown Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "COST BREAKDOWN",
                    bold: true,
                    size: 28,
                    color: "2563eb"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300, before: 400 }
              }),

              // Cost breakdown table
              new Table({
                width: {
                  size: 100,
                  type: WidthType.PERCENTAGE,
                },
                rows: [
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Service", bold: true })],
                          alignment: AlignmentType.CENTER
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({
                          children: [new TextRun({ text: "Amount (₹)", bold: true })],
                          alignment: AlignmentType.CENTER
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Base Shipping Cost" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.baseCost })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Fuel Surcharge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.fuelCharge })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  }),
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Docket Charge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.docket })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  }),
                  // Add conditional rows for additional charges
                  ...(parseFloat(provider.codCharge) > 0 ? [new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "COD Charge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.codCharge })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })] : []),
                  ...(parseFloat(provider.holidayCharge) > 0 ? [new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Holiday Charge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.holidayCharge })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })] : []),
                  ...(parseFloat(provider.outstationCharge) > 0 ? [new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Outstation Charge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.outstationCharge })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })] : []),
                  ...(parseFloat(provider.ngtGreenTax) > 0 ? [new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "NGT Green Tax" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.ngtGreenTax })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })] : []),
                  ...(parseFloat(provider.insuranceCharge) > 0 ? [new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Insurance Charge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.insuranceCharge })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })] : []),
                  ...(parseFloat(provider.stateSpecificCharge) > 0 ? [new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ children: [new TextRun({ text: "Kerala/NE Handling Charge" })] })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: provider.stateSpecificCharge })],
                          alignment: AlignmentType.RIGHT 
                        })],
                        borders: {
                          top: { style: BorderStyle.SINGLE, size: 1 },
                          bottom: { style: BorderStyle.SINGLE, size: 1 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })] : []),
                  // Total row
                  new TableRow({
                    children: [
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: "TOTAL", bold: true })],
                          alignment: AlignmentType.CENTER
                        })],
                        borders: {
                          top: { style: BorderStyle.DOUBLE, size: 2 },
                          bottom: { style: BorderStyle.DOUBLE, size: 2 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      }),
                      new TableCell({
                        children: [new Paragraph({ 
                          children: [new TextRun({ text: `₹${provider.total}`, bold: true, color: "dc2626" })],
                          alignment: AlignmentType.RIGHT
                        })],
                        borders: {
                          top: { style: BorderStyle.DOUBLE, size: 2 },
                          bottom: { style: BorderStyle.DOUBLE, size: 2 },
                          left: { style: BorderStyle.SINGLE, size: 1 },
                          right: { style: BorderStyle.SINGLE, size: 1 }
                        }
                      })
                    ]
                  })
                ]
              }),

              // Additional Services Section
              new Paragraph({
                children: [
                  new TextRun({
                    text: "ADDITIONAL SERVICES",
                    bold: true,
                    size: 28,
                    color: "2563eb"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 300, before: 600 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Cash on Delivery: ${cod ? 'Yes' : 'No'}`,
                    size: 20
                  })
                ],
                spacing: { after: 150 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Holiday Delivery: ${holiday ? 'Yes' : 'No'}`,
                    size: 20
                  })
                ],
                spacing: { after: 150 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Outstation Delivery: ${outstation ? 'Yes' : 'No'}`,
                    size: 20
                  })
                ],
                spacing: { after: 400 }
              }),

              // Footer
              new Paragraph({
                children: [
                  new TextRun({
                    text: "This quotation is valid for 30 days from the date of issue.",
                    italics: true,
                    size: 18,
                    color: "6b7280"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 }
              }),

              new Paragraph({
                children: [
                  new TextRun({
                    text: `Generated on ${formattedDate} by Shipping Calculator`,
                    italics: true,
                    size: 16,
                    color: "9ca3af"
                  })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 }
              })
            ]
          }]
        });

        // Generate and download the document using blob method (browser-compatible)
        const buffer = await Packer.toBlob(doc);
        
        // Create filename with vendor name and date
        const timestamp = currentDate.toISOString().slice(0, 10);
        const fileName = `Shipping_Quotation_${vendorName.trim().replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.docx`;
        
        saveAs(buffer, fileName);
        
        alert(`Quotation document "${fileName}" has been downloaded successfully!`);
        
      } catch (docxError) {
        console.warn('DOCX generation failed, falling back to HTML download:', docxError);
        
        // Fallback to HTML download if DOCX fails
        const htmlContent = generateHTMLQuotation(
          vendorName.trim(), 
          provider, 
          selectedState, 
          boxes, 
          totalPackages, 
          totalWeight, 
          formattedDate, 
          cod, 
          holiday, 
          outstation
        );
        
        const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
        const timestamp = currentDate.toISOString().slice(0, 10);
        const fileName = `Shipping_Quotation_${vendorName.trim().replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.html`;
        
        saveAs(blob, fileName);
        
        alert(`Quotation document "${fileName}" has been downloaded successfully! (HTML format - you can open this in any browser and print to PDF if needed)`);
      }

      // Also save to database for record keeping
      const selection = {
        vendorName: vendorName.trim(),
        providerName: provider.providerName,
        total: parseFloat(provider.total),
        date: new Date().toISOString().slice(0, 10)
      };

      try {
        const response = await fetch(`${API_BASE_URL}/api/selections/add`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(selection)
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setSavedSelections(prev => [result.data, ...prev]);
          }
        }
      } catch (error) {
        console.error('Error saving to database:', error);
        // Don't show error to user since the main functionality (download) worked
      }

      // Reset form
      setSelectedProviderIdx(null);
      setVendorName("");
      
    } catch (error) {
      console.error('Error creating document:', error);
      let errorMessage = 'Failed to generate quotation document. ';
      
      if (error.message.includes('nodebuffer') || error.message.includes('platform')) {
        errorMessage += 'Browser compatibility issue detected. Please try refreshing the page and trying again.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage += 'Please check your internet connection and try again.';
      } else {
        errorMessage += 'Please try again or contact support if the issue persists.';
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setExportDialogOpen(true);
    // Set default dates to min/max in savedSelections if available
    if (savedSelections.length > 0) {
      const dates = savedSelections.map(s => s.date).sort();
      setExportStartDate(dates[0]);
      setExportEndDate(dates[dates.length - 1]);
    }
    // Reset vendor selection
    setSelectedVendor("");
  };

  // Get unique vendor names for the dropdown
  const uniqueVendors = [...new Set(savedSelections.map(s => s.vendorName))].sort();

  const handleExportConfirm = async () => {
    if (!exportStartDate || !exportEndDate) {
      alert('Please select both start and end dates');
      return;
    }

    // Validate date range
    if (new Date(exportStartDate) > new Date(exportEndDate)) {
      alert('Start date cannot be after end date');
      return;
    }

    setExportLoading(true);
    
    try {
      console.log('Starting export with params:', {
        startDate: exportStartDate,
        endDate: exportEndDate,
        selectedVendor
      });

      // Build query parameters
      const params = new URLSearchParams({
        startDate: exportStartDate,
        endDate: exportEndDate
      });

      // Fetch data from the range endpoint
      const response = await fetch(`${API_BASE_URL}/api/selections/range?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Export API response:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      let dataToExport = result.data || [];

      // Filter by vendor if selected
      if (selectedVendor && selectedVendor.trim()) {
        dataToExport = dataToExport.filter(s => 
          s.vendorName && s.vendorName.toLowerCase().includes(selectedVendor.toLowerCase())
        );
      }

      console.log('Data to export:', dataToExport);

      if (dataToExport.length === 0) {
        alert('No data found for the selected criteria');
        return;
      }

      // Create CSV with proper escaping
      const csvHeaders = "Vendor Name,Provider Name,Total (INR),Date,Created At";
      const csvRows = dataToExport.map(selection => {
        // Safely format each field
        const vendorName = String(selection.vendorName || '').replace(/"/g, '""');
        const providerName = String(selection.providerName || '').replace(/"/g, '""');
        const total = Number(selection.total || 0).toFixed(2);
        const date = selection.date || 'N/A';
        const createdAt = selection.createdAt 
          ? new Date(selection.createdAt).toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })
          : 'N/A';
        
        return `"${vendorName}","${providerName}",${total},"${date}","${createdAt}"`;
      });

      const csvContent = [csvHeaders, ...csvRows].join("\n");
      console.log('CSV content created, length:', csvContent.length);
      
      // Create and download file with better browser compatibility
      const BOM = '\uFEFF'; // UTF-8 BOM for proper Excel encoding
      const blob = new Blob([BOM + csvContent], { 
        type: "text/csv;charset=utf-8;" 
      });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.style.display = "none";
      
      // Create filename with date range and vendor info
      const formatDateForFilename = (dateStr) => dateStr.replace(/-/g, '');
      const vendorSuffix = selectedVendor 
        ? `_${selectedVendor.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20)}` 
        : '';
      const filename = `provider_selections_${formatDateForFilename(exportStartDate)}_to_${formatDateForFilename(exportEndDate)}${vendorSuffix}.csv`;
      
      link.href = url;
      link.download = filename;
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the URL object
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      console.log('Download initiated for file:', filename);
      
      // Close dialog and show success message
      setExportDialogOpen(false);
      alert(`Successfully exported ${dataToExport.length} records to ${filename}!`);
      
    } catch (error) {
      console.error('Export error:', error);
      
      let errorMessage = 'Export failed: ';
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Unable to connect to server. Please check your internet connection and try again.';
      } else if (error.message.includes('HTTP 500')) {
        errorMessage += 'Server error. Please try again later.';
      } else if (error.message.includes('HTTP 404')) {
        errorMessage += 'Export endpoint not found. Please contact support.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setExportLoading(false);
    }
  };

  // Add function to handle data updates from advanced settings
  const handleDataUpdate = useCallback(async (dataType, newData, options = {}) => {
    // Check if this is a single row update (from Advanced Settings row editing)
    if (options.isSingleRowUpdate) {
      // For single row updates, just update the local state without making additional API calls
      // The API call was already made by Advanced Settings component
      switch (dataType) {
        case 'providers':
          setProviders([...newData]); // Update local state only
          console.log('Updated local providers state after single row edit');
          break;
        case 'states':
          setStatewiseCharges([...newData]); // Update local state only
          console.log('Updated local statewise charges state after single row edit');
          break;
        case 'fixed':
          setFixedCharges([...newData]); // Update local state only
          console.log('Updated local fixed charges state after single row edit');
          break;
        default:
          console.warn('Unknown data type:', dataType);
          break;
      }
      return; // Exit early - no bulk API calls for single row updates
    }

    // Rest of the function handles bulk updates (file uploads, etc.)
    // Validate that newData is an array and has the correct structure
    if (!Array.isArray(newData) || newData.length === 0) {
      console.error('Invalid data provided for update:', dataType);
      alert('Error: Invalid data format. Please check your upload file.');
      return;
    }

    // Additional validation based on data type
    let isValidStructure = false;
    switch (dataType) {
      case 'providers':
        isValidStructure = newData.every(item => 
          item.hasOwnProperty('Provider ID') && 
          item.hasOwnProperty('Provider Name')
        );
        break;
      case 'states':
        isValidStructure = newData.every(item => 
          item.hasOwnProperty('Provider ID') && 
          item.hasOwnProperty('State') &&
          item.hasOwnProperty('Per Kilo Fee (INR)') &&
          item.hasOwnProperty('Fuel Surcharge (%)')
        );
        break;
      case 'fixed':
        isValidStructure = newData.every(item => 
          item.hasOwnProperty('Provider ID') && 
          item.hasOwnProperty('Docket Charge (INR)') &&
          item.hasOwnProperty('COD Charge (INR)')
        );
        break;
      default:
        console.warn('Unknown data type:', dataType);
        return;
    }

    if (!isValidStructure) {
      console.error('Data structure validation failed for:', dataType);
      alert(`Error: Uploaded ${dataType} data does not have the required structure. Please check your file format.`);
      return;
    }

    setLoading(true);
    try {
      let endpoint = '';
      let payload = {};

      switch (dataType) {
        case 'providers':
          endpoint = `${API_BASE_URL}/api/providers/bulk-update`;
          payload = { providers: newData };
          break;
        case 'states':
          endpoint = `${API_BASE_URL}/api/charges/statewise/bulk-update`;
          payload = { charges: newData };
          break;
        case 'fixed':
          endpoint = `${API_BASE_URL}/api/charges/fixed/bulk-update`;
          payload = { charges: newData };
          break;
        default:
          console.warn('Unknown data type:', dataType);
          return;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Update local state after successful API call with proper state updates
        switch (dataType) {
          case 'providers':
            setProviders([...newData]); // Use spread to ensure new reference
            localStorage.setItem('customProviders', JSON.stringify(newData));
            console.log(`Updated ${newData.length} provider records`);
            break;
          case 'states':
              // After bulk update, reload from backend to get correct _id fields
              try {
                const response = await fetch(`${API_BASE_URL}/api/charges/statewise`);
                if (response.ok) {
                  const statewiseChargesData = await response.json();
                  setStatewiseCharges(statewiseChargesData.map(s => ({
                    _id: s._id,
                    "Provider ID": s.providerId,
                    "Provider Name": s.providerName,
                    "State": s.state,
                    "Per Kilo Fee (INR)": s.perKiloFee,
                    "Fuel Surcharge (%)": s.fuelSurcharge
                  })));
                  const uniqueStates = [...new Set(statewiseChargesData.map(s => s.state))].sort();
                  setStates(uniqueStates);
                  localStorage.setItem('customStates', JSON.stringify(statewiseChargesData));
                  console.log(`Reloaded ${statewiseChargesData.length} state charge records`);
                } else {
                  setStatewiseCharges([]);
                  setStates([]);
                }
              } catch (err) {
                setStatewiseCharges([]);
                setStates([]);
              }
              break;
          case 'fixed':
            setFixedCharges([...newData]); // Use spread to ensure new reference
            localStorage.setItem('customFixedCharges', JSON.stringify(newData));
            console.log(`Updated ${newData.length} fixed charge records`);
            break;
          default:
            console.warn('Unknown data type:', dataType);
            break;
        }
        
        // Clear current results to force recalculation with new data
        setResults([]);
        setSelectedProviderIdx(null);
        setSelectedState(""); // Reset state selection to force user to reselect
        
        // Show success message only for bulk updates, not individual row updates
        if (newData.length > 1) {
          alert(`Successfully updated ${dataType} data with ${newData.length} records. Database has been updated. Please reselect your state and recalculate.`);
        }
      } else {
        throw new Error(result.error || 'Failed to update data');
      }
      
    } catch (error) {
      console.error('Error updating data:', error);
      let errorMessage = `Error saving ${dataType} data: `;
      
      if (error.message.includes('Failed to fetch')) {
        errorMessage += 'Unable to connect to server. Please check if the backend is running.';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  return (
    <div className="dashboard-container">
      {/* Modern animated background */}
      <div className="dashboard-background">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
      </div>

      {/* Three-dots menu button in top right corner */}
      <button
        className="page-settings-btn"
        onClick={() => setAdvancedSettingsOpen(true)}
        title="Advanced Settings & Data Management"
      >
        <Settings size={24} />
      </button>

      <div className="dashboard-layout">
        {/* Left Panel - Input Form */}
        <div className="dashboard-left-panel">
          <div className="form-card">
            <div className="form-header">
              <div className="header-main">
                <h1 className="form-title">
                  <Package size={28} className="title-icon" />
                  Shipping Calculator
                </h1>
                <p className="form-subtitle">Calculate optimal shipping costs across providers</p>
              </div>
            </div>

            <div className="form-content">
              {/* State Selection */}
              <div className="input-group">
                <label className="input-label">
                  <span className="label-text">Destination State</span>
                  <span className="label-required">*</span>
                </label>
                <div className="select-wrapper">
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="modern-select"
                  >
                    <option value="">Choose your state</option>
                    {states.map((state, i) => (
                      <option key={i} value={state}>{state}</option>
                    ))}
                  </select>
                  <div className="select-arrow">
                    <ChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* Shipment Value and Insurance Section */}
              <div className="shipment-section">
                <h3 className="section-title">Shipment Details</h3>
                <div className="input-row">
                  <div className="input-group half-width">
                    <label className="input-label">
                      <span className="label-text">Total Shipment Value (₹)</span>
                    </label>
                    <input
                      type="number"
                      value={shipmentValue}
                      onChange={(e) => setShipmentValue(e.target.value)}
                      placeholder="Enter total value"
                      className="modern-input"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="input-group half-width">
                    <label className="input-label">
                      <span className="label-text">Insurance Coverage (%)</span>
                    </label>
                    <input
                      type="number"
                      value={insurancePercentage}
                      onChange={(e) => setInsurancePercentage(e.target.value)}
                      placeholder="e.g., 100"
                      className="modern-input"
                      min="0"
                      max="100"
                      step="1"
                    />
                  </div>
                </div>
              </div>

              {/* Boxes Section */}
              <div className="boxes-section">
                <div className="section-header">
                  <h3 className="section-title">Package Details</h3>
                  <span className="required-badge">Required</span>
                </div>
                
                <div className="boxes-list">
                  {boxes.length === 0 ? (
                    <div className="empty-state">
                      <Package size={48} className="empty-icon" color="#94a3b8" />
                      <p className="empty-text">No packages added yet</p>
                      <p className="empty-subtext">Add your first package to get started</p>
                    </div>
                  ) : (
                    boxes.map((box, idx) => (
                      <div key={idx} className="box-item">
                        <div className="box-info">
                          <div className="box-header">
                            <span className="box-label">Package {idx + 1}</span>
                            <span className="box-qty">×{box.quantity}</span>
                          </div>
                          <div className="box-details">
                            <span className="dimension-badge">
                              {box.length}×{box.breadth}×{box.height} cm
                            </span>
                            <span className="weight-badge">
                              {box.deadWeight} kg
                            </span>
                          </div>
                        </div>
                        <div className="box-actions">
                          <button
                            className="action-btn duplicate-btn"
                            onClick={() => openDuplicateBoxDialog(idx)}
                            title="Duplicate Package"
                          >
                            <Copy size={16} />
                          </button>
                          <button
                            className="action-btn remove-btn"
                            onClick={() => handleRemoveBox(idx)}
                            title="Remove Package"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button className="add-box-btn" onClick={openAddBoxDialog}>
                  <Plus size={20} />
                  Add Package
                </button>
              </div>

              {/* Additional Services */}
              <div className="services-section">
                <h3 className="section-title">Additional Services</h3>
                <div className="checkbox-grid">
                  <label className="modern-checkbox">
                    <input 
                      type="checkbox" 
                      checked={cod} 
                      onChange={(e) => setCOD(e.target.checked)} 
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Cash on Delivery</span>
                  </label>
                  <label className="modern-checkbox">
                    <input 
                      type="checkbox" 
                      checked={holiday} 
                      onChange={(e) => setHoliday(e.target.checked)} 
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Holiday Delivery</span>
                  </label>
                  <label className="modern-checkbox">
                    <input 
                      type="checkbox" 
                      checked={outstation} 
                      onChange={(e) => setOutstation(e.target.checked)} 
                    />
                    <span className="checkbox-mark"></span>
                    <span className="checkbox-label">Outstation Delivery</span>
                  </label>
                </div>
              </div>

              <button
                className="calculate-btn"
                onClick={calculate}
                disabled={!selectedState || boxes.length === 0}
              >
                <Calculator size={20} />
                Calculate Shipping Costs
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Results */}
        <div className="dashboard-right-panel">
          <div className="results-card">
            {/* Export button */}
            <button
              className="export-btn"
              onClick={handleExport}
              disabled={savedSelections.length === 0}
              title="Export Provider Data"
            >
              <Download size={20} />
            </button>

            <div className="results-header">
              <h2 className="results-title">Provider Comparison</h2>
              <p className="results-subtitle">Compare shipping costs across different providers</p>
            </div>

            {/* Provider selection form */}
            {selectedProviderIdx !== null && (
              <div className="vendor-form">
                <div className="vendor-header">
                  <h4 className="vendor-title">
                    Generate Quotation for <span className="provider-name">{results[selectedProviderIdx].providerName}</span>
                  </h4>
                </div>
                <div className="vendor-input-group">
                  <input
                    type="text"
                    value={vendorName}
                    onChange={e => setVendorName(e.target.value)}
                    placeholder="Enter vendor/customer name for quotation"
                    className="vendor-input"
                  />
                  <button
                    className="save-btn"
                    onClick={handleSaveSelection}
                    disabled={loading || !vendorName.trim()}
                  >
                    {loading ? (
                      <div className="spinner"></div>
                    ) : (
                      <Download size={16} />
                    )}
                    {loading ? "Generating..." : "Download Quotation"}
                  </button>
                </div>
              </div>
            )}

            {/* Results list */}
            <div className="results-content">
              {results.length === 0 ? (
                <div className="empty-results">
                  <Truck size={48} className="empty-results-icon" color="#94a3b8" />
                  <h3 className="empty-results-title">No Results Yet</h3>
                  <p className="empty-results-text">
                    Select a state and add packages to compare shipping providers
                  </p>
                </div>
              ) : (
                <div className="provider-list">
                  {results.map((r, idx) => (
                    <div
                      key={idx}
                      className={`provider-card ${expandedIdx === idx ? 'expanded' : ''} ${selectedProviderIdx === idx ? 'selected' : ''}`}
                      onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                    >
                      <div className="provider-header">
                        <div className="provider-info">
                          <h4 className="provider-name">{r.providerName}</h4>
                          <div className="provider-weight">
                            {r.weightDetails && r.weightDetails.boxes ? (
                              (() => {
                                const totalBoxes = r.weightDetails.boxes.reduce((sum, box) => sum + box.quantity, 0);
                                const avgWeightPerBox = totalBoxes > 0 ? (parseFloat(r.applicableWeight) / totalBoxes).toFixed(2) : 0;
                                
                                if (totalBoxes === 1) {
                                  return `Weight: ${r.applicableWeight} kg`;
                                } else {
                                  return `Weight: ${r.applicableWeight} kg (${totalBoxes} boxes, avg ${avgWeightPerBox} kg/box)`;
                                }
                              })()
                            ) : (
                              `Weight: ${r.applicableWeight} kg`
                            )}
                          </div>
                        </div>
                        <div className="provider-price">
                          <span className="currency">₹</span>
                          <span className="amount">{r.total}</span>
                        </div>
                      </div>

                      {expandedIdx === idx && (
                        <div className="provider-details">
                          <div className="cost-breakdown">
                            <div className="cost-item">
                              <span className="cost-label">Base Cost</span>
                              <span className="cost-value">₹{r.baseCost}</span>
                            </div>
                            <div className="cost-item">
                              <span className="cost-label">Fuel Surcharge</span>
                              <span className="cost-value">₹{r.fuelCharge}</span>
                            </div>
                            <div className="cost-item">
                              <span className="cost-label">Docket Charge</span>
                              <span className="cost-value">₹{r.docket}</span>
                            </div>
                            {parseFloat(r.codCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">COD Charge</span>
                                <span className="cost-value">₹{r.codCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.holidayCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Holiday Charge</span>
                                <span className="cost-value">₹{r.holidayCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.outstationCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Outstation Charge</span>
                                <span className="cost-value">₹{r.outstationCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.ngtGreenTax) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">NGT Green Tax</span>
                                <span className="cost-value">₹{r.ngtGreenTax}</span>
                              </div>
                            )}
                            {parseFloat(r.insuranceCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Insurance Charge</span>
                                <span className="cost-value">₹{r.insuranceCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.stateSpecificCharge) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Kerala/NE Handling</span>
                                <span className="cost-value">₹{r.stateSpecificCharge}</span>
                              </div>
                            )}
                            {parseFloat(r.specialCharges) > 0 && (
                              <div className="cost-item">
                                <span className="cost-label">Special Charges</span>
                                <span className="cost-value">₹{r.specialCharges}</span>
                              </div>
                            )}
                            {r.specialChargesDetails && r.specialChargesDetails.length > 0 && (
                              <div className="special-charges-details">
                                {r.specialChargesDetails.map((charge, idx) => (
                                  <div key={idx} className="cost-item special-charge">
                                    <span className="cost-label">• {charge.description}</span>
                                    <span className="cost-value">₹{charge.amount.toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <button
                            className="select-provider-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProviderSelect(idx);
                            }}
                          >
                            <Check size={16} />
                            Select This Provider
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <BoxDialog
        open={boxDialogOpen}
        onClose={() => setBoxDialogOpen(false)}
        onAdd={handleAddBox}
        boxToDuplicate={boxToDuplicate}
      />

      <ExportDialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        loading={exportLoading}
        startDate={exportStartDate}
        endDate={exportEndDate}
        setStartDate={setExportStartDate}
        setEndDate={setExportEndDate}
        uniqueVendors={uniqueVendors}
        selectedVendor={selectedVendor}
        setSelectedVendor={setSelectedVendor}
        onExport={handleExportConfirm}
      />

      <AdvancedSettings
        isOpen={advancedSettingsOpen}
        onClose={() => setAdvancedSettingsOpen(false)}
        providers={providers}
        states={statewiseCharges}
        fixedCharges={fixedCharges}
        onDataUpdate={handleDataUpdate}
      />
    </div>
  );
}