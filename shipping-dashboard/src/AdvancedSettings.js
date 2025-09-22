import React, { useState } from 'react';
import { 
  Plus, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  X, 
  Save, 
  RefreshCw,
  MoreHorizontal,
  Truck,
  Map,
  DollarSign,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn
} from 'lucide-react';

export default function AdvancedSettings({ 
  providers, 
  states, 
  fixedCharges, 
  onDataUpdate,
  isOpen,
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('providers');
  const [uploadStatus, setUploadStatus] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  // Password protection state
  const [isPasswordVerified, setIsPasswordVerified] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Hardcoded password
  const ADMIN_PASSWORD = "Odin@odin123";

  // Password verification functions
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsPasswordVerified(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Invalid password. Access denied.');
      setPasswordInput('');
    }
  };

  const handlePasswordClose = () => {
    setPasswordInput('');
    setPasswordError('');
    setIsPasswordVerified(false);
    onClose();
  };

  // Reset password verification when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setIsPasswordVerified(false);
      setPasswordInput('');
      setPasswordError('');
    }
  }, [isOpen]);

  // Force re-render when data changes to ensure UI consistency
  React.useEffect(() => {
    // Reset edit states when data changes to prevent stale state issues
    setEditingRowIndex(null);
    setEditingData({});
    setShowCreateRow(false);
    setNewRowData({});
  }, [providers, states, fixedCharges, activeTab]);

  // Edit mode states
  const [editingRowIndex, setEditingRowIndex] = useState(null);
  const [editingData, setEditingData] = useState({});
  const [showCreateRow, setShowCreateRow] = useState(false);
  const [newRowData, setNewRowData] = useState({});

  const tabs = [
    { id: 'providers', label: 'Service Providers', icon: <Truck size={18} />, description: 'Manage shipping service providers' },
    { id: 'states', label: 'State Charges', icon: <Map size={18} />, description: 'Manage per-state shipping rates' },
    { id: 'fixed', label: 'Fixed Charges', icon: <DollarSign size={18} />, description: 'Manage fixed fees and surcharges' },
  ];

  // Data validation schemas
  const dataSchemas = {
    providers: {
      required: ['Provider Name'],
      optional: ['Provider ID', 'description', 'isActive'],
      readOnly: ['Provider ID'], // Provider ID is auto-generated, read-only
      types: {
        'Provider ID': 'number',
        'Provider Name': 'string',
        'description': 'string',
        'isActive': 'boolean'
      }
    },
    states: {
      required: ['State', 'Per Kilo Fee (INR)', 'Fuel Surcharge (%)'],
      optional: ['Provider ID', 'Provider Name'],
      readOnly: ['Provider ID', 'Provider Name'], // Auto-generated/assigned
      types: {
        'Provider ID': 'number',
        'Provider Name': 'string',
        'State': 'string',
        'Per Kilo Fee (INR)': 'number',
        'Fuel Surcharge (%)': 'number'
      }
    },
    fixed: {
      required: ['Docket Charge (INR)', 'COD Charge (INR)', 'Holiday Charge (INR)', 'Outstation Charge (INR)', 'Insurance Charge (%)', 'NGT Green Tax (INR)', 'Kerala North East Handling Charge (INR)'],
      optional: ['Provider ID'],
      readOnly: ['Provider ID'], // Auto-generated
      types: {
        'Provider ID': 'number',
        'Docket Charge (INR)': 'number',
        'COD Charge (INR)': 'number',
        'Holiday Charge (INR)': 'number',
        'Outstation Charge (INR)': 'number',
        'Insurance Charge (%)': 'number',
        'NGT Green Tax (INR)': 'number',
        'Kerala North East Handling Charge (INR)': 'number'
      }
    }
  };

  // Get current data based on active tab - using useCallback to ensure fresh data
  const getCurrentData = React.useCallback(() => {
    switch (activeTab) {
      case 'providers': return providers || [];
      case 'states': return states || []; // This is actually statewiseCharges from Dashboard
      case 'fixed': return fixedCharges || [];
      default: return [];
    }
  }, [activeTab, providers, states, fixedCharges]);

  // Helper functions for edit mode
  const startEdit = (rowIndex) => {
    const currentData = getCurrentData();
    const rowData = currentData[rowIndex];
    setEditingRowIndex(rowIndex);
    setEditingData({ ...rowData });
  };

  const cancelEdit = () => {
    setEditingRowIndex(null);
    setEditingData({});
  };

  const saveEdit = async () => {
    const currentData = getCurrentData();
    const originalRow = currentData[editingRowIndex];
    
    try {
      setIsUploading(true);
      setUploadStatus('💾 Saving changes...');
      
      let endpoint = '';
      let payload = {};
      let method = 'PUT';
      
      // Build API call based on data type
      switch (activeTab) {
        case 'providers':
          endpoint = `${getAPIBaseURL()}/api/providers/update-row/${originalRow['Provider ID']}`;
          payload = {
            providerName: editingData['Provider Name'],
            description: editingData.description,
            isActive: editingData.isActive
          };
          break;
        case 'states':
          // For statewise charges, we need to use the MongoDB _id field for updates
          const stateId = originalRow._id || originalRow.id;
          if (!stateId) {
            throw new Error('Cannot update statewise charge: Missing ID field');
          }
          endpoint = `${getAPIBaseURL()}/api/charges/statewise/update-row/${stateId}`;
          payload = {
            perKiloFee: parseFloat(editingData['Per Kilo Fee (INR)']) || 0,
            fuelSurcharge: parseFloat(editingData['Fuel Surcharge (%)']) || 0
          };
          break;
        case 'fixed':
          endpoint = `${getAPIBaseURL()}/api/charges/fixed/update-row/${originalRow['Provider ID']}`;
          payload = {
            docketCharge: editingData['Docket Charge (INR)'],
            codCharge: editingData['COD Charge (INR)'],
            holidayCharge: editingData['Holiday Charge (INR)'],
            outstationCharge: editingData['Outstation Charge (INR)'],
            insuranceChargePercent: editingData['Insurance Charge (%)'],
            ngtGreenTax: editingData['NGT Green Tax (INR)'],
            keralaHandlingCharge: editingData['Kerala North East Handling Charge (INR)']
          };
          break;
        default:
          throw new Error('Unknown data type');
      }
      
      const response = await fetch(endpoint, {
        method,
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
        // Update only the local data for single row edits - DO NOT call onDataUpdate for single row changes
        // This prevents unnecessary bulk API calls and preserves the user's current state
        const freshCurrentData = getCurrentData();
        const updatedData = [...freshCurrentData];
        
        // Clean the API response data to only include fields we want to display
        const cleanResponseData = cleanApiResponseData(result.data, activeTab);
        
        // Merge the edited data with the cleaned API response data
        updatedData[editingRowIndex] = { 
          ...originalRow, // Keep original fields (like _id for updates)
          ...editingData, // Apply the edited changes
          ...cleanResponseData // Apply cleaned API response data
        };
        
        // Update parent component data ONLY for display purposes, not triggering bulk API calls
        // We use a special flag to indicate this is a single row update
        onDataUpdate(activeTab, updatedData, { isSingleRowUpdate: true });
        
        setUploadStatus('✅ Changes saved successfully!');
        
        // Reset edit state after a short delay to ensure state update is complete
        setTimeout(() => {
          cancelEdit();
        }, 100);
        
        // Clear status after delay
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to save changes');
      }
      
    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus(`❌ Error saving changes: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFieldChange = (fieldName, value) => {
    setEditingData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const startCreateRow = () => {
    const schema = dataSchemas[activeTab];
    const defaultRow = {};
    
    // Initialize with empty values based on schema
    [...schema.required, ...schema.optional].forEach(field => {
      if (schema.types[field] === 'number') {
        defaultRow[field] = 0;
      } else if (schema.types[field] === 'boolean') {
        defaultRow[field] = true;
      } else {
        defaultRow[field] = '';
      }
    });

    setNewRowData(defaultRow);
    setShowCreateRow(true);
  };

  const cancelCreateRow = () => {
    setShowCreateRow(false);
    setNewRowData({});
  };

  const saveNewRow = async () => {
    try {
      setIsUploading(true);
      setUploadStatus('🆕 Creating new row...');
      
      let endpoint = '';
      let payload = {};
      
      // Build API call based on data type
      switch (activeTab) {
        case 'providers':
          endpoint = `${getAPIBaseURL()}/api/providers/create-row`;
          payload = {
            // Don't include providerId - let it auto-generate
            providerName: newRowData['Provider Name'],
            description: newRowData.description || '',
            isActive: newRowData.isActive !== undefined ? newRowData.isActive : true
          };
          break;
        case 'states':
          endpoint = `${getAPIBaseURL()}/api/charges/statewise/create-row`;
          payload = {
            // Don't include providerId/providerName - let them auto-generate
            state: newRowData['State'],
            perKiloFee: parseFloat(newRowData['Per Kilo Fee (INR)']) || 0,
            fuelSurcharge: parseFloat(newRowData['Fuel Surcharge (%)']) || 0
          };
          break;
        case 'fixed':
          endpoint = `${getAPIBaseURL()}/api/charges/fixed/create-row`;
          payload = {
            // Don't include providerId - let it auto-generate
            docketCharge: parseFloat(newRowData['Docket Charge (INR)']) || 0,
            codCharge: parseFloat(newRowData['COD Charge (INR)']) || 0,
            holidayCharge: parseFloat(newRowData['Holiday Charge (INR)']) || 0,
            outstationCharge: parseFloat(newRowData['Outstation Charge (INR)']) || 0,
            insuranceChargePercent: parseFloat(newRowData['Insurance Charge (%)']) || 0,
            ngtGreenTax: parseFloat(newRowData['NGT Green Tax (INR)']) || 0,
            keralaHandlingCharge: parseFloat(newRowData['Kerala North East Handling Charge (INR)']) || 0
          };
          break;
        default:
          throw new Error('Unknown data type');
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
        // Create new row - update local data only, no bulk API calls
        const freshCurrentData = getCurrentData();
        
        // Clean the API response data to only include fields we want to display
        const cleanResponseData = cleanApiResponseData(result.data, activeTab);
        
        // Create the new row data with cleaned API response data and form data
        const newRowWithApiData = {
          ...newRowData, // Form data
          ...cleanResponseData // Cleaned API response data (like auto-generated IDs)
        };
        
        // Add to local data
        const updatedData = [...freshCurrentData, newRowWithApiData];
        
        // Update parent component data with single row update flag
        onDataUpdate(activeTab, updatedData, { isSingleRowUpdate: true });
        
        setUploadStatus('✅ New row created successfully!');
        
        // Reset create state after a short delay to ensure state update is complete
        setTimeout(() => {
          cancelCreateRow();
        }, 100);
        
        // Clear status after delay
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to create new row');
      }
      
    } catch (error) {
      console.error('Create error:', error);
      setUploadStatus(`❌ Error creating new row: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const deleteRow = async (rowIndex) => {
    if (!window.confirm('Are you sure you want to delete this row? This action cannot be undone.')) {
      return;
    }
    
    const currentData = getCurrentData();
    const rowToDelete = currentData[rowIndex];
    
    try {
      setIsUploading(true);
      setUploadStatus('🗑️ Deleting row...');
      
      let endpoint = '';
      
      // Build API call based on data type
      switch (activeTab) {
        case 'providers':
          endpoint = `${getAPIBaseURL()}/api/providers/delete-row/${rowToDelete['Provider ID']}`;
          break;
        case 'states':
          // For statewise charges, we need to use the MongoDB _id field for deletes
          const stateDeleteId = rowToDelete._id || rowToDelete.id;
          if (!stateDeleteId) {
            throw new Error('Cannot delete statewise charge: Missing ID field');
          }
          endpoint = `${getAPIBaseURL()}/api/charges/statewise/delete-row/${stateDeleteId}`;
          break;
        case 'fixed':
          endpoint = `${getAPIBaseURL()}/api/charges/fixed/delete-row/${rowToDelete['Provider ID']}`;
          break;
        default:
          throw new Error('Unknown data type');
      }
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Delete row - update local data only, no bulk API calls
        const freshCurrentData = getCurrentData();
        
        // Remove from local data
        const updatedData = freshCurrentData.filter((_, index) => index !== rowIndex);
        
        // Update parent component data with single row update flag
        onDataUpdate(activeTab, updatedData, { isSingleRowUpdate: true });
        
        setUploadStatus('✅ Row deleted successfully!');
        
        // Reset any edit states if we were editing the deleted row
        if (editingRowIndex === rowIndex) {
          cancelEdit();
        }
        
        // Clear status after delay
        setTimeout(() => setUploadStatus(''), 3000);
      } else {
        throw new Error(result.error || 'Failed to delete row');
      }
      
    } catch (error) {
      console.error('Delete error:', error);
      setUploadStatus(`❌ Error deleting row: ${error.message}`);
      setTimeout(() => setUploadStatus(''), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const handleNewRowFieldChange = (fieldName, value) => {
    setNewRowData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  // Helper function to get API base URL
  const getAPIBaseURL = () => {
    return process.env.REACT_APP_API_URL || 
      (process.env.NODE_ENV === 'production' 
        ? 'https://shipping-drodin.onrender.com' 
        : 'http://localhost:5000');
  };

  // Helper function to clean API response data - remove MongoDB internal fields
  const cleanApiResponseData = (data, dataType) => {
    if (!data) return {};
    
    // Fields to exclude from the display
    const fieldsToExclude = ['__v', 'createdAt', 'updatedAt'];
    
    const cleanedData = {};
    Object.keys(data).forEach(key => {
      if (!fieldsToExclude.includes(key)) {
        cleanedData[key] = data[key];
      }
    });
    
    return cleanedData;
  };

  const renderDataTable = (data, type) => {
    if (!data || data.length === 0) {
      return (
        <div className="empty-data">
          <p>No data available</p>
          <button 
            className="action-btn create-btn"
            onClick={startCreateRow}
          >
            <Plus size={16} />
            Create New Row
          </button>
        </div>
      );
    }

    // Filter headers to only show relevant columns based on data type
    const schema = dataSchemas[type];
    const allHeaders = Object.keys(data[0]);
    
    // Define the columns we want to show for each data type
    const relevantColumns = {
      providers: ['Provider ID', 'Provider Name', 'description', 'isActive'],
      states: ['Provider ID', 'Provider Name', 'State', 'Per Kilo Fee (INR)', 'Fuel Surcharge (%)'],
      fixed: ['Provider ID', 'Docket Charge (INR)', 'COD Charge (INR)', 'Holiday Charge (INR)', 'Outstation Charge (INR)', 'Insurance Charge (%)', 'NGT Green Tax (INR)', 'Kerala North East Handling Charge (INR)']
    };
    
    // Use relevant columns if defined, otherwise fall back to schema-based filtering
    const headers = relevantColumns[type] || 
      allHeaders.filter(header => 
        // Filter out MongoDB internal fields and timestamps
        !header.startsWith('_') && 
        header !== '__v' && 
        header !== 'createdAt' && 
        header !== 'updatedAt' &&
        (schema.required.includes(header) || schema.optional.includes(header))
      );

    return (
      <div className="data-table-container">
        <div className="table-header">
          <h4>Current Data ({data.length} records)</h4>
          <div className="table-actions">
            <button 
              className="action-btn create-btn"
              onClick={startCreateRow}
              disabled={editingRowIndex !== null || showCreateRow}
            >
              <Plus size={16} />
              Create New
            </button>
            <button 
              className="action-btn export-btn"
              onClick={() => exportCurrentData(type)}
              title="Export Current Data"
            >
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {/* Create New Row Form */}
        {showCreateRow && (
          <div className="create-row-form">
            <div className="form-header">
              <h4>Create New {type.charAt(0).toUpperCase() + type.slice(1)} Record</h4>
            </div>
            <div className="form-fields">
              {headers.filter(header => !schema.readOnly.includes(header)).map(header => (
                <div key={header} className="field-group">
                  <label>{header}{schema.required.includes(header) ? ' *' : ''}</label>
                  {schema.types[header] === 'number' ? (
                    <input
                      type="number"
                      value={newRowData[header] || ''}
                      onChange={(e) => handleNewRowFieldChange(header, parseFloat(e.target.value) || 0)}
                      step="0.01"
                      placeholder={`Enter ${header}`}
                    />
                  ) : schema.types[header] === 'boolean' ? (
                    <select
                      value={newRowData[header] ? 'true' : 'false'}
                      onChange={(e) => handleNewRowFieldChange(header, e.target.value === 'true')}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={newRowData[header] || ''}
                      onChange={(e) => handleNewRowFieldChange(header, e.target.value)}
                      placeholder={`Enter ${header}`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="form-actions">
              <button className="cancel-btn" onClick={cancelCreateRow}>
                <X size={16} />
                Cancel
              </button>
              <button className="save-btn" onClick={saveNewRow}>
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        )}

        <div className="data-table">
          <table>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header}>{header}</th>
                ))}
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx} className={editingRowIndex === idx ? 'editing-row' : ''}>
                  {headers.map(header => (
                    <td key={header}>
                      {editingRowIndex === idx ? (
                        // Edit mode
                        schema.readOnly && schema.readOnly.includes(header) ? (
                          <span className="readonly-field" title="Auto-generated - Read Only">{row[header]}</span>
                        ) : schema.types[header] === 'number' ? (
                          <input
                            type="number"
                            value={editingData[header] || ''}
                            onChange={(e) => handleFieldChange(header, parseFloat(e.target.value) || 0)}
                            className="edit-input number-input"
                            step="0.01"
                          />
                        ) : schema.types[header] === 'boolean' ? (
                          <select
                            value={editingData[header] ? 'true' : 'false'}
                            onChange={(e) => handleFieldChange(header, e.target.value === 'true')}
                            className="edit-input"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={editingData[header] || ''}
                            onChange={(e) => handleFieldChange(header, e.target.value)}
                            className="edit-input"
                          />
                        )
                      ) : (
                        // View mode
                        <span className="cell-value">
                          {schema.types[header] === 'boolean' 
                            ? (row[header] ? 'Active' : 'Inactive')
                            : row[header]
                          }
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="actions-cell">
                    {editingRowIndex === idx ? (
                      // Edit mode actions
                      <div className="edit-actions">
                        <button 
                          className="action-btn cancel-edit-btn"
                          onClick={cancelEdit}
                          title="Cancel Edit"
                        >
                          <X size={14} />
                        </button>
                        <button 
                          className="action-btn save-edit-btn"
                          onClick={saveEdit}
                          title="Save Changes"
                        >
                          <Save size={14} />
                        </button>
                      </div>
                    ) : (
                      // View mode actions
                      <div className="view-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => startEdit(idx)}
                          disabled={editingRowIndex !== null || showCreateRow}
                          title="Edit Row"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => deleteRow(idx)}
                          disabled={editingRowIndex !== null || showCreateRow}
                          title="Delete Row"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const exportCurrentData = (dataType) => {
    let data, filename;
    
    switch (dataType) {
      case 'providers':
        data = providers;
        filename = 'current_providers.json';
        break;
      case 'states':
        data = states;
        filename = 'current_state_charges.json';
        break;
      case 'fixed':
        data = fixedCharges;
        filename = 'current_fixed_charges.json';
        break;
      default:
        console.error('Unknown data type for export:', dataType);
        return;
    }

    if (!data || data.length === 0) {
      alert('No data available to export');
      return;
    }

    const content = JSON.stringify(data, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllSamples = () => {
    // Create sample files for download
    const samples = {
      providers: [
        {
          "Provider Name": "Express Logistics",
          "description": "Fast nationwide delivery service",
          "isActive": true
        }
      ],
      states: [
        {
          "State": "Maharashtra", 
          "Per Kilo Fee (INR)": 25.0,
          "Fuel Surcharge (%)": 12
        }
      ],
      fixed: [
        {
          "Docket Charge (INR)": 50,
          "COD Charge (INR)": 45,
          "Holiday Charge (INR)": 25,
          "Outstation Charge (INR)": 40,
          "Insurance Charge (%)": 2.5,
          "NGT Green Tax (INR)": 10,
          "Kerala North East Handling Charge (INR)": 15
        }
      ]
    };

    Object.entries(samples).forEach(([dataType, sampleData]) => {
      const content = JSON.stringify(sampleData, null, 2);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sample_${dataType}.json`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportAllData = () => {
    // Export all current data as separate files
    ['providers', 'states', 'fixed'].forEach(dataType => {
      exportCurrentData(dataType);
    });
  };

  const reindexDatabase = async () => {
    if (!window.confirm('⚠️ This will reindex and regenerate ALL database records with sequential IDs. This action cannot be undone. Are you sure you want to continue?')) {
      return;
    }

    try {
      setIsUploading(true);
      setUploadStatus('🔄 Reindexing database... This may take a few moments...');

      const response = await fetch(`${getAPIBaseURL()}/api/reindex`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setUploadStatus(`✅ Database reindexed successfully! ${result.counts.providers} providers, ${result.counts.fixedCharges} fixed charges, ${result.counts.statewiseCharges} statewise charges`);
        
        // Trigger data refresh
        setTimeout(() => {
          window.location.reload(); // Simple way to refresh all data
        }, 2000);
      } else {
        throw new Error(result.error || 'Failed to reindex database');
      }

    } catch (error) {
      console.error('Reindex error:', error);
      setUploadStatus(`❌ Error reindexing database: ${error.message}`);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadStatus(''), 5000);
    }
  };

  if (!isOpen) return null;

  // Show password prompt if not verified
  if (!isPasswordVerified) {
    return (
      <div className="advanced-settings-overlay">
        <div className="password-modal">
          <div className="password-header">
            <h2><Lock size={20} style={{ display: 'inline', marginRight: '8px' }} /> Advanced Settings Access</h2>
            <p>Please enter the administrator password to continue</p>
          </div>
          
          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="password-input-group">
              <label htmlFor="admin-password">Administrator Password</label>
              <input
                id="admin-password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="Enter password"
                className="password-input"
                autoFocus
                required
              />
              {passwordError && (
                <div className="password-error">
                  <AlertCircle size={16} />
                  {passwordError}
                </div>
              )}
            </div>
            
            <div className="password-actions">
              <button
                type="button"
                className="password-cancel-btn"
                onClick={handlePasswordClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="password-submit-btn"
                disabled={!passwordInput.trim()}
              >
                <LogIn size={16} />
                Access Settings
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="advanced-settings-overlay">
      <div className="advanced-settings-modal">
        <div className="modal-header">
          <div className="header-left">
            <h2>Advanced Settings</h2>
            <p>Manage pricing data and system configuration</p>
          </div>
          <div className="header-right">
            <div className="dropdown-container">
              <button 
                className="dropdown-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <MoreHorizontal size={20} />
              </button>
              {dropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={downloadAllSamples}>
                    <Download size={16} />
                    Download All Samples
                  </button>
                  <button onClick={exportAllData}>
                    <Upload size={16} />
                    Export All Data
                  </button>
                  <div className="dropdown-divider"></div>
                  <button onClick={reindexDatabase} className="reindex-btn">
                    <RefreshCw size={16} />
                    🔄 Reindex Database
                  </button>
                </div>
              )}
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="modal-content">
          <div className="tabs-container">
            
            <div className="tabs">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  title={tab.description}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <div className="tab-content-wrapper">
                    <span className="tab-label">{tab.label}</span>
                    <span className="tab-description">{tab.description}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="tab-content">
            <div className="tab-content-header">
              <div className="current-tab-info">
                <span className="current-tab-icon">{tabs.find(t => t.id === activeTab)?.icon}</span>
                <div>
                  <h3 className="current-tab-title">{tabs.find(t => t.id === activeTab)?.label}</h3>
                  <p className="current-tab-description">{tabs.find(t => t.id === activeTab)?.description}</p>
                </div>
              </div>
              <div className="sync-status">
                <span className="sync-indicator">🔄</span>
                <span className="sync-text">Real-time database sync enabled</span>
              </div>
            </div>
            
            {activeTab === 'providers' && (
              <div className="tab-section">
                <div className="section-info">
                  <p>Manage shipping service providers. Changes are synchronized with the database.</p>
                </div>
                {renderDataTable(providers, 'providers')}
              </div>
            )}
            {activeTab === 'states' && (
              <div className="tab-section">
               
                {renderDataTable(states, 'states')}
              </div>
            )}
            {activeTab === 'fixed' && (
              <div className="tab-section">
                <div className="section-info">
                  <p>Set fixed charges for shipments. These are applied per order.</p>
                </div>
                {renderDataTable(fixedCharges, 'fixed')}
              </div>
            )}
          </div>

          {uploadStatus && (
            <div className={`upload-status ${uploadStatus.includes('❌') ? 'error' : 'success'}`}>
              {uploadStatus}
            </div>
          )}
        </div>

        {isUploading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Processing...</p>
          </div>
        )}
      </div>
    </div>
  );
}
