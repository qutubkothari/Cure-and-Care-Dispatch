import { useState, useRef } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import Papa from 'papaparse';

interface BulkImportModalProps {
  drivers: Array<{ id: string; name: string }>;
  onClose: () => void;
  onImport: (deliveries: any[]) => Promise<{ success: number; failed: number; errors: string[] }>;
}

interface CSVRow {
  customerName: string;
  customerPhone: string;
  address: string;
  items: string;
  amount: string;
  driverId: string;
  priority?: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export default function BulkImportModal({ drivers, onClose, onImport }: BulkImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<CSVRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const template = `customerName,customerPhone,address,items,amount,driverId,priority
John Doe,9876543210,"123 Main St, Mumbai",Medicine Package,500,${drivers[0]?.id || 'DRIVER_ID'},NORMAL
Jane Smith,9876543211,"456 Park Ave, Delhi",Surgical Supplies,1200,${drivers[0]?.id || 'DRIVER_ID'},HIGH`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'delivery_import_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const validateRow = (row: CSVRow, index: number): ValidationError[] => {
    const rowErrors: ValidationError[] = [];
    const rowNum = index + 2; // +2 for header and 0-index

    if (!row.customerName?.trim()) {
      rowErrors.push({ row: rowNum, field: 'customerName', message: 'Customer name is required' });
    }

    if (!row.customerPhone?.trim()) {
      rowErrors.push({ row: rowNum, field: 'customerPhone', message: 'Customer phone is required' });
    } else if (!/^\d{10}$/.test(row.customerPhone.trim())) {
      rowErrors.push({ row: rowNum, field: 'customerPhone', message: 'Phone must be 10 digits' });
    }

    if (!row.address?.trim()) {
      rowErrors.push({ row: rowNum, field: 'address', message: 'Address is required' });
    }

    if (!row.items?.trim()) {
      rowErrors.push({ row: rowNum, field: 'items', message: 'Items description is required' });
    }

    if (!row.amount?.trim()) {
      rowErrors.push({ row: rowNum, field: 'amount', message: 'Amount is required' });
    } else if (isNaN(Number(row.amount))) {
      rowErrors.push({ row: rowNum, field: 'amount', message: 'Amount must be a number' });
    }

    if (!row.driverId?.trim()) {
      rowErrors.push({ row: rowNum, field: 'driverId', message: 'Driver ID is required' });
    } else if (!drivers.find(d => d.id === row.driverId.trim())) {
      rowErrors.push({ row: rowNum, field: 'driverId', message: 'Invalid driver ID' });
    }

    if (row.priority && !['NORMAL', 'HIGH'].includes(row.priority.trim().toUpperCase())) {
      rowErrors.push({ row: rowNum, field: 'priority', message: 'Priority must be NORMAL or HIGH' });
    }

    return rowErrors;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setErrors([]);

    Papa.parse<CSVRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;
        setData(rows);

        // Validate all rows
        const allErrors: ValidationError[] = [];
        rows.forEach((row, index) => {
          const rowErrors = validateRow(row, index);
          allErrors.push(...rowErrors);
        });

        setErrors(allErrors);
      },
      error: (error) => {
        alert(`Failed to parse CSV: ${error.message}`);
        setFile(null);
      }
    });
  };

  const handleImport = async () => {
    if (errors.length > 0) {
      alert('Please fix validation errors before importing');
      return;
    }

    if (data.length === 0) {
      alert('No data to import');
      return;
    }

    setImporting(true);
    try {
      const deliveries = data.map(row => ({
        customerName: row.customerName.trim(),
        customerPhone: row.customerPhone.trim(),
        address: row.address.trim(),
        items: row.items.trim(),
        amount: Number(row.amount),
        driverId: row.driverId.trim(),
        priority: (row.priority?.trim().toUpperCase() || 'NORMAL') as 'NORMAL' | 'HIGH'
      }));

      const importResult = await onImport(deliveries);
      setResult(importResult);

      if (importResult.failed === 0) {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Import failed:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Bulk Import Deliveries</h2>
            <p className="text-sm text-gray-600">Upload CSV file to create multiple deliveries</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={importing}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">Download Template</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Use this template to format your delivery data correctly
                </p>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download CSV Template
                </button>
              </div>
            </div>
          </div>

          {/* Available Drivers */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Available Driver IDs</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {drivers.map(driver => (
                <div key={driver.id} className="flex items-center gap-2">
                  <code className="bg-white px-2 py-1 rounded border text-xs">{driver.id}</code>
                  <span className="text-gray-700">{driver.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors disabled:opacity-50"
            >
              <Upload className="w-5 h-5" />
              <span>{file ? file.name : 'Choose CSV file'}</span>
            </button>
          </div>

          {/* Validation Results */}
          {file && data.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Validation Results</h3>
                <span className="text-sm text-gray-600">
                  {data.length} row{data.length > 1 ? 's' : ''} found
                </span>
              </div>

              {errors.length === 0 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">All rows are valid!</p>
                    <p className="text-sm text-green-700">Ready to import {data.length} deliveries</p>
                  </div>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">
                        {errors.length} validation error{errors.length > 1 ? 's' : ''} found
                      </p>
                      <p className="text-sm text-red-700">Please fix these errors before importing</p>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {errors.map((error, index) => (
                      <div key={index} className="text-sm text-red-800 bg-white rounded p-2">
                        <strong>Row {error.row}:</strong> {error.field} - {error.message}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Import Result */}
          {result && (
            <div className={`border rounded-lg p-4 ${
              result.failed === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <h3 className="font-semibold mb-2">Import Complete</h3>
              <div className="space-y-1 text-sm">
                <p className="text-green-700">✓ Successfully imported: {result.success}</p>
                {result.failed > 0 && (
                  <>
                    <p className="text-red-700">✗ Failed: {result.failed}</p>
                    {result.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-red-600 text-xs">{error}</p>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t">
          <button
            onClick={onClose}
            disabled={importing}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium disabled:opacity-50"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={importing || errors.length > 0 || data.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {importing ? 'Importing...' : `Import ${data.length} Deliveries`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
