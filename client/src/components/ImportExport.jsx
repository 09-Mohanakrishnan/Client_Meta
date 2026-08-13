import React, { useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, AlertOctagon, FileText, Check, X } from 'lucide-react';
import API from '../services/api';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

// Helper to convert arrays to CSV download
export const exportToCSV = (data, columns, filename) => {
  if (data.length === 0) {
    toast.error('No records available to export');
    return;
  }

  const visibleCols = columns.filter((c) => c.visible);

  // Create Headers row
  const headers = visibleCols.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(',');

  // Create Data rows
  const rows = data.map((row) => {
    return visibleCols.map((col) => {
      let cellVal = row[col.key];
      if (cellVal === undefined || cellVal === null) {
        cellVal = '';
      }

      // Escape double quotes in CSV cell values
      const escaped = String(cellVal).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const ImportExport = ({ entityType, columns, existingItems, onImportSuccess }) => {
  const queryClient = useQueryClient();
  const [showImportModal, setShowImportModal] = useState(false);
  const [previewData, setPreviewData] = useState({ valid: [], invalid: [], duplicates: [], warnings: [] });
  const [isImporting, setIsImporting] = useState(false);

  // Custom JS CSV Parser
  const parseCSV = (text) => {
    const lines = [];
    let row = [''];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];
      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);
    return lines;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const rawRows = parseCSV(text);
      if (rawRows.length < 2) {
        toast.error('The uploaded CSV file is empty or invalid.');
        return;
      }

      // Map header strings to keys (strip UTF-8 BOM, strip outer quotes, normalize)
      const rawHeaders = rawRows[0].map((h) => {
        let clean = h.replace(/^\ufeff/, ''); // Strip BOM
        clean = clean.replace(/^["']|["']$/g, ''); // Strip surrounding quotes
        return clean.trim().toLowerCase();
      });

      const rawHeadersNormalized = rawHeaders.map((h) =>
        h.replace(/[^a-z0-9]/g, '') // Keep only lowercase letters and numbers
      );

      // Attempt mapping display labels or keys
      const headerMap = {};
      columns.forEach((col) => {
        const colKeyNorm = col.key.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        const colLabelNorm = col.label.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

        rawHeadersNormalized.forEach((rawNorm, idx) => {
          if (rawNorm === colKeyNorm || rawNorm === colLabelNorm) {
            headerMap[idx] = col.key;
          }
        });
      });

      // Structural/linking keys synonyms fallback (since campaignId/adSetId are not visible columns)
      const structuralFields = [
        { key: 'campaignId', synonyms: ['campaignid', 'parentcampaignid', 'campaignuuid'] },
        { key: 'campaignName', synonyms: ['campaignname', 'campaign'] },
        { key: 'adSetId', synonyms: ['adsetid', 'parentadsetid', 'adsetuuid'] },
        { key: 'adSetName', synonyms: ['adsetname', 'adset'] },
        { key: 'adId', synonyms: ['adid', 'aduuid'] },
        { key: 'status', synonyms: ['status'] },
        { key: 'image', synonyms: ['image', 'imageurl', 'img', 'thumbnail', 'creativeurl', 'imagepreview', 'previewurl', 'previewlink', 'mediaurl', 'medialink', 'creative'] },
        { key: 'video', synonyms: ['video', 'videourl', 'vid', 'media', 'videolink', 'videopreview', 'videolink'] },
        {
          key: 'name',
          synonyms:
            entityType === 'campaign' ? ['name', 'campaignname', 'campaign'] :
              entityType === 'adset' ? ['name', 'adsetname', 'adset'] :
                ['name', 'adname', 'ad']
        }
      ];

      structuralFields.forEach((field) => {
        rawHeadersNormalized.forEach((rawNorm, idx) => {
          if (field.synonyms.includes(rawNorm)) {
            headerMap[idx] = field.key;
          }
        });
      });

      console.log('CSV Import Debug:');
      console.log('- Entity type:', entityType);
      console.log('- Raw headers:', rawHeaders);
      console.log('- Normalized headers:', rawHeadersNormalized);
      console.log('- Final header map:', headerMap);

      const parsedItems = [];
      for (let i = 1; i < rawRows.length; i++) {
        const row = rawRows[i];
        if (row.length === 1 && row[0] === '') continue; // Skip blank line

        const item = {};
        row.forEach((cell, idx) => {
          const mappedKey = headerMap[idx];
          if (mappedKey) {
            let val = cell.trim();
            // Parse numerical properties
            const colDef = columns.find((c) => c.key === mappedKey);
            if (colDef && ['number', 'currency', 'percentage'].includes(colDef.type)) {
              const num = parseFloat(val);
              val = isNaN(num) ? 0 : num;
            } else if (colDef && colDef.type === 'boolean') {
              val = val.toLowerCase() === 'true' || val === '1' || val.toLowerCase() === 'yes';
            }
            item[mappedKey] = val;
          }
        });

        if (Object.keys(item).length > 0) {
          parsedItems.push(item);
        }
      }

      // Group and Validate Rows
      const valid = [];
      const invalid = [];
      const duplicates = [];
      const warnings = [];

      const existingIds = new Set(existingItems.map((item) =>
        entityType === 'campaign' ? item.campaignId : entityType === 'adset' ? item.adSetId : item.adId
      ));
      const seenIds = new Set();

      parsedItems.forEach((item, index) => {
        const rowNum = index + 2;

        // 1. Check required fields
        if (!item.name) {
          invalid.push({ item, reason: `Row ${rowNum}: 'name' is required` });
          return;
        }

        // Soft validation warnings for relationship fields (allowing dynamic matching later)
        let isWarning = false;
        if (entityType === 'adset' && !item.campaignId && !item.campaignName) {
          warnings.push({ item, reason: `Row ${rowNum}: Unresolved Campaign relationship (Campaign ID or Name is missing)` });
          isWarning = true;
        }

        if (entityType === 'ad') {
          if ((!item.adSetId && !item.adSetName) || (!item.campaignId && !item.campaignName)) {
            warnings.push({ item, reason: `Row ${rowNum}: Unresolved parent relationships (Campaign or Ad Set ID/Name is missing)` });
            isWarning = true;
          }
        }

        // 2. Check duplicates (both in existing database items and within the CSV itself)
        const itemUniqueId = entityType === 'campaign' ? item.campaignId : entityType === 'adset' ? item.adSetId : item.adId;

        if (itemUniqueId) {
          if (existingIds.has(itemUniqueId) || seenIds.has(itemUniqueId)) {
            duplicates.push({ item, reason: `Row ${rowNum}: ID '${itemUniqueId}' already exists or is a duplicate in CSV` });
            return;
          }
          seenIds.add(itemUniqueId);
        }

        if (!isWarning) {
          valid.push(item);
        }
      });

      setPreviewData({ valid, invalid, duplicates, warnings });
      setShowImportModal(true);
      e.target.value = null; // Clear file input
    };

    reader.readAsText(file);
  };

  const handleImportAnyway = async () => {
    setIsImporting(true);
    try {
      const allItems = [...previewData.valid, ...previewData.warnings.map(w => w.item)];
      const res = await API.post(`/${entityType}s/import`, allItems);
      if (res.data.success) {
        toast.success(res.data.message || `Imported ${allItems.length} items successfully`);
        queryClient.invalidateQueries({ queryKey: [entityType === 'adset' ? 'adsets' : `${entityType}s`] });
        if (onImportSuccess) onImportSuccess();
        setShowImportModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk import anyway failed. Please verify CSV formatting.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleImportSubmit = async () => {
    if (previewData.valid.length === 0) {
      toast.error('No valid rows to import');
      return;
    }

    setIsImporting(true);
    try {
      const res = await API.post(`/${entityType}s/import`, previewData.valid);
      if (res.data.success) {
        toast.success(res.data.message || `Imported ${previewData.valid.length} items successfully`);
        queryClient.invalidateQueries({ queryKey: [entityType === 'adset' ? 'adsets' : `${entityType}s`] });
        if (onImportSuccess) onImportSuccess();
        setShowImportModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk import failed. Please verify CSV formatting.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      {/* File upload hidden trigger button */}
      <div className="flex items-center">
        <label className="meta-btn cursor-pointer">
          <Upload size={11} className="text-gray-500" />
          <span>Import CSV</span>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {/* Validation & Preview Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-2xl flex flex-col max-h-[85vh]">

            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-155 px-6 py-4 bg-gray-50/50">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900 capitalize">Import {entityType}s Preview</h2>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Validation Breakdown Cards */}
            <div className={`grid ${entityType === 'campaign' ? 'grid-cols-3' : 'grid-cols-4'} gap-3 p-6 pb-2`}>
              <div className="rounded-lg border border-green-200 bg-green-50/30 p-3 flex flex-col items-center">
                <CheckCircle size={20} className="text-green-600 mb-1" />
                <span className="text-lg font-bold text-green-700">{previewData.valid.length}</span>
                <span className="text-[10px] font-semibold text-green-600 uppercase">Valid Rows</span>
              </div>
              <div className="rounded-lg border border-yellow-250 bg-yellow-50/20 p-3 flex flex-col items-center">
                <AlertTriangle size={20} className="text-yellow-600 mb-1" />
                <span className="text-lg font-bold text-yellow-700">{previewData.duplicates.length}</span>
                <span className="text-[10px] font-semibold text-yellow-600 uppercase">Duplicate Rows</span>
              </div>
              {entityType !== 'campaign' && (
                <div className="rounded-lg border border-amber-250 bg-amber-50/20 p-3 flex flex-col items-center">
                  <AlertTriangle size={20} className="text-amber-600 mb-1" />
                  <span className="text-lg font-bold text-amber-700">{previewData.warnings?.length || 0}</span>
                  <span className="text-[10px] font-semibold text-amber-600 uppercase">Unresolved Ref</span>
                </div>
              )}
              <div className="rounded-lg border border-red-200 bg-red-50/30 p-3 flex flex-col items-center">
                <AlertOctagon size={20} className="text-red-600 mb-1" />
                <span className="text-lg font-bold text-red-700">{previewData.invalid.length}</span>
                <span className="text-[10px] font-semibold text-red-600 uppercase">Invalid Rows</span>
              </div>
            </div>

            {/* Logs & Errors */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
              {/* Warnings / Errors */}
              {(previewData.invalid.length > 0 || previewData.duplicates.length > 0 || (previewData.warnings && previewData.warnings.length > 0)) && (
                <div className="rounded-md bg-yellow-50/50 border border-yellow-200 p-3.5 text-gray-700 space-y-1.5">
                  <h4 className="font-bold text-yellow-800 text-[11px] uppercase tracking-wider">Formatting warnings ({previewData.invalid.length + previewData.duplicates.length + (previewData.warnings?.length || 0)})</h4>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-medium text-gray-600">
                    {previewData.invalid.map((item, idx) => (
                      <li key={`inv-${idx}`} className="text-red-600">{item.reason}</li>
                    ))}
                    {previewData.warnings?.map((item, idx) => (
                      <li key={`warn-${idx}`} className="text-amber-600">{item.reason}</li>
                    ))}
                    {previewData.duplicates.map((item, idx) => (
                      <li key={`dup-${idx}`} className="text-yellow-700">{item.reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Grid Preview of Valid Rows */}
              <div>
                <h4 className="font-bold text-gray-700 text-[11px] uppercase tracking-wider mb-2">Rows to import ({previewData.valid.length})</h4>
                {previewData.valid.length === 0 ? (
                  <p className="text-gray-400 italic">No valid rows detected. Make sure columns match configuration labels or keys.</p>
                ) : (
                  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px] border-collapse min-w-max">
                      <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase border-b border-gray-200">
                        <tr>
                          {columns.filter(c => c.visible).slice(0, 5).map(c => (
                            <th key={c.key} className="px-3 py-1.5">{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.valid.slice(0, 10).map((row, idx) => (
                          <tr key={`val-row-${idx}`} className="border-b border-gray-150 hover:bg-gray-50">
                            {columns.filter(c => c.visible).slice(0, 5).map(c => (
                              <td key={c.key} className="px-3 py-1.5 text-gray-600 max-w-[120px] truncate">{String(row[c.key] ?? '-')}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Footer controls */}
            <div className="flex gap-2 justify-end border-t border-gray-150 px-6 py-4 bg-gray-50/50">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              {previewData.warnings?.length > 0 && (
                <button
                  type="button"
                  onClick={handleImportAnyway}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 rounded hover:bg-amber-700 transition-colors shadow-sm"
                >
                  Import anyway
                </button>
              )}
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={previewData.valid.length === 0 || isImporting}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-40 disabled:hover:bg-green-600 transition-colors shadow-sm"
              >
                {isImporting ? 'Importing...' : (
                  <>
                    <Check size={14} />
                    <span>Confirm Import ({previewData.valid.length})</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default ImportExport;
