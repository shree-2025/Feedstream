import React, { useState, useRef } from 'react';
import { Download, Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import Button from '../ui/button/Button';
import { 
  exportToCSV, 
  exportToJSON, 
  exportToExcel, 
  parseCSV, 
  parseJSON, 
  validateLogEntry,
  generateSampleLogs,
  LogEntry
} from '../../utils/exportImport';

interface ExportImportProps {
  logs?: LogEntry[];
  onImport?: (logs: LogEntry[]) => void;
  userRole?: string;
  className?: string;
}

const ExportImport: React.FC<ExportImportProps> = ({ 
  logs = [], 
  onImport, 
  userRole = 'EndUser',
  className = '' 
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json' | 'xlsx'>('csv');
  const [importStatus, setImportStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [importMessage, setImportMessage] = useState('');
  const [importedCount, setImportedCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use sample data if no logs provided (for demo purposes)
  const dataToExport = logs.length > 0 ? logs : generateSampleLogs();

  const handleExport = () => {
    try {
      const filename = `logs_export_${new Date().toISOString().split('T')[0]}`;
      
      switch (exportFormat) {
        case 'csv':
          exportToCSV(dataToExport, `${filename}.csv`);
          break;
        case 'json':
          exportToJSON(dataToExport, `${filename}.json`);
          break;
        case 'xlsx':
          exportToExcel(dataToExport, `${filename}.xlsx`);
          break;
      }
      
      setIsExportOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('processing');
    setImportMessage('Processing file...');

    try {
      const content = await file.text();
      let parsedLogs: LogEntry[] = [];

      // Parse based on file extension
      if (file.name.endsWith('.json')) {
        parsedLogs = parseJSON(content);
      } else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) {
        parsedLogs = parseCSV(content);
      } else {
        throw new Error('Unsupported file format. Please use CSV, JSON, or XLSX files.');
      }

      // Validate imported data
      const validLogs: LogEntry[] = [];
      const errors: string[] = [];

      parsedLogs.forEach((log, index) => {
        const validationErrors = validateLogEntry(log);
        if (validationErrors.length === 0) {
          validLogs.push(log);
        } else {
          errors.push(`Row ${index + 1}: ${validationErrors.join(', ')}`);
        }
      });

      if (validLogs.length === 0) {
        throw new Error('No valid log entries found in the file.');
      }

      // Call the import callback if provided
      if (onImport) {
        onImport(validLogs);
      }

      setImportedCount(validLogs.length);
      setImportStatus('success');
      setImportMessage(
        `Successfully imported ${validLogs.length} log entries.${
          errors.length > 0 ? ` ${errors.length} entries had errors and were skipped.` : ''
        }`
      );

    } catch (error) {
      setImportStatus('error');
      setImportMessage(error instanceof Error ? error.message : 'Import failed');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetImport = () => {
    setImportStatus('idle');
    setImportMessage('');
    setImportedCount(0);
  };

  // Check if user has permission to import (typically admin roles)
  const canImport = ['MasterAdmin', 'OrganizationAdmin', 'DepartmentAdmin'].includes(userRole);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Export/Import Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button 
          variant="outline" 
          onClick={() => setIsExportOpen(true)}
          className="flex items-center"
        >
          <Download className="w-4 h-4 mr-2" />
          Export Logs
        </Button>
        
        {canImport && (
          <Button 
            variant="outline" 
            onClick={() => setIsImportOpen(true)}
            className="flex items-center"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import Logs
          </Button>
        )}
      </div>

      {/* Export Modal */}
      {isExportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-2xl p-6 w-full max-w-md border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Logs</h3>
              <button 
                onClick={() => setIsExportOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Export {dataToExport.length} log entries in your preferred format:
                </p>
                
                <div className="space-y-2">
                  <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="csv"
                      checked={exportFormat === 'csv'}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="mr-3 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-400"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">CSV</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Comma-separated values, compatible with Excel</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="json"
                      checked={exportFormat === 'json'}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="mr-3 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-400"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">JSON</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">JavaScript Object Notation, preserves all data</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                    <input
                      type="radio"
                      name="format"
                      value="xlsx"
                      checked={exportFormat === 'xlsx'}
                      onChange={(e) => setExportFormat(e.target.value as any)}
                      className="mr-3 text-brand-500 focus:ring-brand-500 dark:focus:ring-brand-400"
                    />
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">Excel</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Excel-compatible format with UTF-8 encoding</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsExportOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleExport}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl dark:shadow-2xl p-6 w-full max-w-md border dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Logs</h3>
              <button 
                onClick={() => { setIsImportOpen(false); resetImport(); }}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {importStatus === 'idle' && (
                <>
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors">
                    <FileText className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Select a file to import log entries
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                      Supported formats: CSV, JSON, XLSX
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.json,.xlsx"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button 
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </Button>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                    <p className="text-xs text-blue-600 dark:text-blue-300">
                      <strong>Note:</strong> Imported logs will be validated before adding to the system. 
                      Invalid entries will be skipped with error details provided.
                    </p>
                  </div>
                </>
              )}

              {importStatus === 'processing' && (
                <div className="text-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{importMessage}</p>
                </div>
              )}

              {importStatus === 'success' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{importMessage}</p>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                    <p className="text-sm text-green-600 dark:text-green-300 font-medium">
                      {importedCount} logs imported successfully
                    </p>
                  </div>
                </div>
              )}

              {importStatus === 'error' && (
                <div className="text-center py-4">
                  <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <p className="text-sm text-red-600 dark:text-red-400 mb-4">{importMessage}</p>
                  <Button 
                    variant="outline" 
                    onClick={resetImport}
                    size="sm"
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {importStatus !== 'processing' && (
                <div className="flex justify-end space-x-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => { setIsImportOpen(false); resetImport(); }}
                  >
                    {importStatus === 'success' ? 'Done' : 'Cancel'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportImport;
