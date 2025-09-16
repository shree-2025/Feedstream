// Export/Import utilities for E-Log Book system

export interface LogEntry {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  type: string;
  submittedBy: string;
  submittedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  attachments?: string[];
  tags?: string[];
}

export interface ExportOptions {
  format: 'csv' | 'json' | 'xlsx';
  dateRange?: {
    start: string;
    end: string;
  };
  status?: string[];
  includeAttachments?: boolean;
}

// Export logs to CSV format
export const exportToCSV = (logs: LogEntry[], filename?: string): void => {
  const headers = [
    'ID',
    'Title', 
    'Description',
    'Status',
    'Type',
    'Submitted By',
    'Submitted Date',
    'Reviewed By',
    'Reviewed Date',
    'Tags'
  ];

  const csvContent = [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      `"${log.title.replace(/"/g, '""')}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      log.status,
      log.type,
      log.submittedBy,
      log.submittedDate,
      log.reviewedBy || '',
      log.reviewedDate || '',
      `"${(log.tags || []).join(', ')}"`
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, filename || `logs_export_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv');
};

// Export logs to JSON format
export const exportToJSON = (logs: LogEntry[], filename?: string): void => {
  const jsonContent = JSON.stringify({
    exportDate: new Date().toISOString(),
    totalLogs: logs.length,
    logs: logs
  }, null, 2);

  downloadFile(jsonContent, filename || `logs_export_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
};

// Generate Excel-compatible format (CSV with proper encoding)
export const exportToExcel = (logs: LogEntry[], filename?: string): void => {
  const headers = [
    'ID',
    'Title',
    'Description', 
    'Status',
    'Type',
    'Submitted By',
    'Submitted Date',
    'Reviewed By',
    'Reviewed Date',
    'Tags'
  ];

  // Add BOM for proper Excel UTF-8 handling
  const BOM = '\uFEFF';
  const csvContent = BOM + [
    headers.join(','),
    ...logs.map(log => [
      log.id,
      `"${log.title.replace(/"/g, '""')}"`,
      `"${log.description.replace(/"/g, '""')}"`,
      log.status,
      log.type,
      log.submittedBy,
      log.submittedDate,
      log.reviewedBy || '',
      log.reviewedDate || '',
      `"${(log.tags || []).join(', ')}"`
    ].join(','))
  ].join('\n');

  downloadFile(csvContent, filename || `logs_export_${new Date().toISOString().split('T')[0]}.xlsx`, 'text/csv');
};

// Helper function to trigger file download
const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Parse CSV content for import
export const parseCSV = (csvContent: string): LogEntry[] => {
  const lines = csvContent.split('\n');
  // Skip header line and process data rows
  
  return lines.slice(1).filter(line => line.trim()).map((line, index) => {
    const values = parseCSVLine(line);
    
    return {
      id: values[0] || `imported_${index + 1}`,
      title: values[1] || 'Imported Log',
      description: values[2] || '',
      status: (values[3] as any) || 'pending',
      type: values[4] || 'General',
      submittedBy: values[5] || 'Unknown',
      submittedDate: values[6] || new Date().toISOString().split('T')[0],
      reviewedBy: values[7] || undefined,
      reviewedDate: values[8] || undefined,
      tags: values[9] ? values[9].split(',').map(t => t.trim()) : []
    };
  });
};

// Parse JSON content for import
export const parseJSON = (jsonContent: string): LogEntry[] => {
  try {
    const data = JSON.parse(jsonContent);
    
    // Handle different JSON structures
    if (Array.isArray(data)) {
      return data;
    } else if (data.logs && Array.isArray(data.logs)) {
      return data.logs;
    } else {
      throw new Error('Invalid JSON structure');
    }
  } catch (error) {
    throw new Error('Failed to parse JSON file');
  }
};

// Helper function to parse CSV line with proper quote handling
const parseCSVLine = (line: string): string[] => {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
};

// Validate imported log data
export const validateLogEntry = (log: Partial<LogEntry>): string[] => {
  const errors: string[] = [];
  
  if (!log.title || log.title.trim().length === 0) {
    errors.push('Title is required');
  }
  
  if (!log.submittedBy || log.submittedBy.trim().length === 0) {
    errors.push('Submitted by field is required');
  }
  
  if (!log.submittedDate) {
    errors.push('Submitted date is required');
  } else if (isNaN(Date.parse(log.submittedDate))) {
    errors.push('Invalid submitted date format');
  }
  
  if (log.status && !['pending', 'approved', 'rejected'].includes(log.status)) {
    errors.push('Invalid status value');
  }
  
  return errors;
};

// Generate sample data for export testing
export const generateSampleLogs = (): LogEntry[] => {
  return [
    {
      id: '1',
      title: 'Weekly Progress Report',
      description: 'Summary of weekly activities and achievements',
      status: 'approved',
      type: 'Progress',
      submittedBy: 'john.doe@example.com',
      submittedDate: '2024-01-15',
      reviewedBy: 'manager@example.com',
      reviewedDate: '2024-01-16',
      tags: ['weekly', 'progress', 'report']
    },
    {
      id: '2',
      title: 'Project Milestone Update',
      description: 'Update on project milestone completion and next steps',
      status: 'pending',
      type: 'Milestone',
      submittedBy: 'jane.smith@example.com',
      submittedDate: '2024-01-14',
      tags: ['project', 'milestone']
    },
    {
      id: '3',
      title: 'Research Findings Summary',
      description: 'Detailed summary of research findings and recommendations',
      status: 'approved',
      type: 'Research',
      submittedBy: 'researcher@example.com',
      submittedDate: '2024-01-12',
      reviewedBy: 'supervisor@example.com',
      reviewedDate: '2024-01-13',
      tags: ['research', 'findings', 'summary']
    }
  ];
};
