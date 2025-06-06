
import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { AdData } from '../types';
import { COLUMN_HEADER_MAP, NUMERIC_COLUMNS, DATE_COLUMNS, PERCENTAGE_METRICS } from '../constants';
import { UploadCloud, FileCheck2, AlertCircle } from 'lucide-react';

interface FileUploadProps {
  onDataLoaded: (data: AdData[], fileName: string) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, setIsLoading, setError }) => {
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const parseRawValue = (value: any, targetKey: keyof AdData): any => {
    if (value === null || typeof value === 'undefined' || String(value).trim() === '') {
      return NUMERIC_COLUMNS.includes(targetKey) ? 0 : (DATE_COLUMNS.includes(targetKey) ? null : '');
    }

    if (DATE_COLUMNS.includes(targetKey)) {
      if (typeof value === 'number') { // Excel date serial number
        const date = XLSX.SSF.parse_date_code(value);
        return new Date(date.y, date.m - 1, date.d, date.H, date.M, date.S);
      }
      const parsedDate = new Date(value);
      return isNaN(parsedDate.getTime()) ? null : parsedDate;
    }

    if (NUMERIC_COLUMNS.includes(targetKey)) {
      let strValue = String(value).trim();
      // Handle percentage values like "5.5%"
      if (PERCENTAGE_METRICS.includes(targetKey) && strValue.endsWith('%')) {
        strValue = strValue.slice(0, -1);
        const num = parseFloat(strValue.replace(/,/g, ''));
        return isNaN(num) ? 0 : num / 100;
      }
      // Handle numbers with commas like "1,234.56"
      const num = parseFloat(strValue.replace(/,/g, ''));
      return isNaN(num) ? 0 : num;
    }
    return String(value).trim();
  };

  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true }); // cellDates helps with dates
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false, defval: null }); // raw:false for formatted text, defval for empty cells

      if (jsonData.length === 0) {
        setError("The uploaded file is empty or doesn't contain readable data.");
        onDataLoaded([], file.name);
        setIsLoading(false);
        return;
      }
      
      // Dynamically map headers
      const headerRow = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1, range: 0 })[0] as string[];
      if (!headerRow || headerRow.length === 0) {
        setError("Could not read headers from the file.");
        onDataLoaded([], file.name);
        setIsLoading(false);
        return;
      }

      const effectiveHeaderMap: { [key: string]: keyof AdData } = {};
      headerRow.forEach(header => {
        if (header) {
          const normalizedHeader = String(header).toLowerCase().trim();
          if (COLUMN_HEADER_MAP[normalizedHeader]) {
            effectiveHeaderMap[String(header)] = COLUMN_HEADER_MAP[normalizedHeader];
          }
        }
      });
      
      if (Object.keys(effectiveHeaderMap).length === 0) {
         setError("No recognizable Meta Ads data columns found. Please check the file format and column names. Required columns like 'Reporting Starts', 'Amount Spent (USD)', 'Country', 'Campaign Name' might be missing or misnamed.");
         onDataLoaded([], file.name);
         setIsLoading(false);
         return;
      }

      const parsedData: AdData[] = jsonData.map((row, rowIndex) => {
        const adEntry: Partial<AdData> = {};
        for (const rawHeader in row) {
          if (effectiveHeaderMap[rawHeader]) {
            const targetKey = effectiveHeaderMap[rawHeader];
            (adEntry as any)[targetKey] = parseRawValue(row[rawHeader], targetKey);
          }
        }
        // Ensure essential fields have defaults if not parsed
        adEntry.reportingStarts = adEntry.reportingStarts instanceof Date ? adEntry.reportingStarts : new Date(); // Default to today if invalid
        adEntry.amountSpentUSD = typeof adEntry.amountSpentUSD === 'number' ? adEntry.amountSpentUSD : 0;
        adEntry.country = typeof adEntry.country === 'string' && adEntry.country ? adEntry.country : 'Unknown';
        adEntry.campaignName = typeof adEntry.campaignName === 'string' && adEntry.campaignName ? adEntry.campaignName : 'Unknown Campaign';
        adEntry.reach = typeof adEntry.reach === 'number' ? adEntry.reach : 0;
        adEntry.impressions = typeof adEntry.impressions === 'number' ? adEntry.impressions : 0;
        
        // Add dateStr for grouping
        if (adEntry.reportingStarts instanceof Date && !isNaN(adEntry.reportingStarts.getTime())) {
            adEntry.dateStr = adEntry.reportingStarts.toISOString().split('T')[0];
        } else {
            // Try to create a valid date for dateStr if reportingStarts is invalid after parse, or default
            const now = new Date();
            adEntry.dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        }

        return adEntry as AdData;
      });

      // Basic validation for critical fields
      const firstValidEntry = parsedData.find(d => d.reportingStarts && d.amountSpentUSD !== undefined && d.country && d.campaignName);
      if (!firstValidEntry) {
        setError("Data is missing critical fields (like date, spend, country, or campaign) after parsing. Please check column content.");
        onDataLoaded([], file.name);
      } else {
        onDataLoaded(parsedData, file.name);
      }

    } catch (e) {
      console.error("Error processing file:", e);
      setError(`Failed to process file. Ensure it's a valid Excel (xlsx, xls) or CSV file. Error: ${(e as Error).message}`);
      onDataLoaded([], file.name);
    } finally {
      setIsLoading(false);
    }
  }, [onDataLoaded, setIsLoading, setError, parseRawValue]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
    event.target.value = ''; // Reset file input
  };

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      if (file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || file.type === "application/vnd.ms-excel" || file.type === "text/csv") {
        processFile(file);
      } else {
        setError("Invalid file type. Please upload an Excel (xlsx, xls) or CSV file.");
        setFileName(null);
      }
    }
  }, [processFile, setError]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);
  }, []);


  return (
    <div className="space-y-4">
      <div 
        className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors
                    ${isDragOver ? 'border-sky-500 bg-sky-50' : 'border-slate-300 hover:border-sky-400'}
                    ${fileName ? 'border-green-500 bg-green-50' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-upload-input')?.click()}
      >
        <input id="file-upload-input" type="file" className="hidden" onChange={handleFileChange} accept=".xlsx, .xls, .csv" />
        <div className="text-center">
          {fileName ? (
            <>
              <FileCheck2 className="mx-auto h-12 w-12 text-green-600" />
              <p className="mt-2 text-sm text-green-700 font-semibold">File: {fileName}</p>
              <p className="text-xs text-slate-500">Click or drag another file to replace.</p>
            </>
          ) : (
            <>
              <UploadCloud className="mx-auto h-12 w-12 text-slate-400 group-hover:text-sky-500" />
              <p className="mt-2 text-sm text-slate-600">
                <span className="font-semibold text-sky-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-500">Excel (XLSX, XLS) or CSV files</p>
            </>
          )}
        </div>
      </div>
       {/* Example required columns hint */}
       <div className="text-xs text-slate-500 p-2 bg-slate-50 rounded border border-slate-200">
            <h4 className="font-semibold text-slate-600 mb-1 flex items-center"><AlertCircle size={14} className="mr-1 text-sky-600"/>File Requirements:</h4>
            <p>Ensure your file includes columns like: <code className="text-xs bg-slate-200 px-1 rounded">Reporting Starts</code>, <code className="text-xs bg-slate-200 px-1 rounded">Amount Spent (USD)</code>, <code className="text-xs bg-slate-200 px-1 rounded">Country</code>, <code className="text-xs bg-slate-200 px-1 rounded">Campaign Name</code>, <code className="text-xs bg-slate-200 px-1 rounded">Reach</code>, <code className="text-xs bg-slate-200 px-1 rounded">Impressions</code>. Data should be at ad/day/country level.</p>
        </div>
    </div>
  );
};

export default FileUpload;
    