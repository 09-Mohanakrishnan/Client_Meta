import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../services/api';
import { Search, RefreshCw, ClipboardList, Info } from 'lucide-react';

const AuditLogsPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch logs
  const { data: logsRes, isLoading, error } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: async () => {
      const res = await API.get('/audit-logs', {
        params: {
          page,
          limit: 15,
          search,
        },
      });
      return res.data?.data;
    },
  });

  const logs = logsRes?.logs || [];
  const total = logsRes?.total || 0;
  const pages = logsRes?.pages || 1;

  if (error) {
    return (
      <div className="p-6 text-xs text-red-500">
        Error loading audit logs: {error.message}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 flex-1 flex flex-col min-h-0 bg-gray-50">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Console Audit Logs</h1>
          <p className="text-xs text-gray-500 mt-0.5">Historical records of campaign configurations, columns, and user edits.</p>
        </div>
        
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
            <Search size={14} />
          </span>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by action, email..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md text-xs focus:border-blue-500 focus:outline-none bg-white shadow-sm"
          />
        </div>
      </div>

      {/* Grid container */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-0">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center p-12">
            <RefreshCw size={24} className="text-blue-600 animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto flex-1 min-h-0">
            <table className="w-full text-left text-xs border-collapse relative min-w-max">
              <thead>
                <tr className="sticky top-0 bg-gray-50 border-b border-gray-200 z-10 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-2.5">Timestamp</th>
                  <th className="px-4 py-2.5">Operator Email</th>
                  <th className="px-4 py-2.5">Action Code</th>
                  <th className="px-4 py-2.5">Entity Type</th>
                  <th className="px-4 py-2.5">Entity ID</th>
                  <th className="px-4 py-2.5">Field Changed</th>
                  <th className="px-4 py-2.5">Old Value</th>
                  <th className="px-4 py-2.5">New Value</th>
                  <th className="px-6 py-2.5">IP Address</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center text-gray-400 py-16">
                      No logs matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3 font-medium text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-800 font-mono">{log.userEmail}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 rounded font-bold text-[9px] bg-blue-50 text-blue-700 border border-blue-100">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-600 font-medium">{log.entityType}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-gray-400 max-w-[120px] truncate">{log.entityId}</td>
                      <td className="px-4 py-3 font-semibold text-gray-700">{log.field || '-'}</td>
                      
                      {/* Old Value */}
                      <td className="px-4 py-3 max-w-[140px] truncate text-gray-500 font-mono text-[10px]">
                        {log.oldValue !== null && log.oldValue !== undefined ? JSON.stringify(log.oldValue) : '-'}
                      </td>
                      
                      {/* New Value */}
                      <td className="px-4 py-3 max-w-[140px] truncate text-gray-800 font-mono text-[10px]">
                        {log.newValue !== null && log.newValue !== undefined ? JSON.stringify(log.newValue) : '-'}
                      </td>

                      <td className="px-6 py-3 text-gray-400 font-mono">{log.ipAddress || '127.0.0.1'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && logs.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50/50 px-6 py-3.5">
            <span className="text-[11px] text-gray-500 font-medium">Total logs: <span className="font-bold text-gray-700">{total}</span></span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-sm"
              >
                Prev
              </button>
              <span className="px-2 py-1 text-xs text-gray-700 font-medium">Page {page} of {pages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page >= pages}
                className="rounded border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 shadow-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsPage;
