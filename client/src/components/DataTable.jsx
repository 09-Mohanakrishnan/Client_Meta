import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table';
import { ArrowUpDown, AlertCircle, RefreshCw, Info, Trash2 } from 'lucide-react';
import InlineEditableCell from './InlineEditableCell';
import { useAuth } from '../context/AuthContext';

const EditableWrapper = ({ value: initialValue, displayContent, columnKey, columnType, onSave, isEditable = true }) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(initialValue ?? '');
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(initialValue ?? '');
  }, [initialValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const canEdit = isEditable && user && user.role !== 'VIEWER';
  const isNumeric = ['number', 'currency', 'percentage'].includes(columnType);

  const handleSave = () => {
    let parsedValue = value;
    if (isNumeric) {
      parsedValue = parseFloat(value);
      if (Number.isNaN(parsedValue)) parsedValue = 0;
    }
    onSave(parsedValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setValue(initialValue ?? '');
    setIsEditing(false);
  };

  if (!canEdit) {
    return <div style={{ minWidth: 0 }}>{displayContent}</div>;
  }

  if (isEditing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px', minWidth: 0 }}>
        <input
          ref={inputRef}
          type={isNumeric ? 'number' : 'text'}
          value={value ?? ''}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') handleCancel();
          }}
          style={{
            flex: 1,
            minWidth: '80px',
            border: '1px solid #dddfe2',
            borderRadius: '4px',
            padding: '4px 8px',
            fontSize: '12px',
            outline: 'none',
            backgroundColor: '#fff',
            textAlign: isNumeric ? 'right' : 'left',
          }}
        />
        <button
          type="button"
          onClick={handleSave}
          style={{ border: 'none', background: 'none', color: '#42b72a', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
        >
          Save
        </button>
        <button
          type="button"
          onClick={handleCancel}
          style={{ border: 'none', background: 'none', color: '#fa3e3e', cursor: 'pointer', fontSize: '12px', fontWeight: 700 }}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      style={{
        cursor: 'pointer',
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 4px',
        borderRadius: '4px',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f2f3f5'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      {displayContent}
    </div>
  );
};

const DataTable = ({
  columns, data, entityType, page, pages, total,
  onPageChange, sortBy, sortOrder, onSortChange, onInlineEdit,
  selectedRows, onSelectedRowsChange, isLoading, error, onInlineDelete,
}) => {
  const { user } = useAuth();
  const tableColumns = useMemo(() => {
    const list = [
      // Checkbox
      {
        id: 'select',
        header: ({ table }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input type="checkbox"
              checked={table.getIsAllPageRowsSelected()}
              onChange={table.getToggleAllPageRowsSelectedHandler()}
            />
          </div>
        ),
        cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input type="checkbox"
              checked={row.getIsSelected()}
              disabled={!row.getCanSelect()}
              onChange={row.getToggleSelectedHandler()}
            />
          </div>
        ),
      },
      // Status Switch (Off/On) - Hardcoded second column matching FB Ads Manager
      {
        id: 'status',
        accessorKey: 'status',
        header: () => (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 4px' }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Off/On</span>
          </div>
        ),
        cell: ({ row }) => {
          const val = row.original.status;
          const isOn = val === 'Active';
          return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <label className="meta-switch">
                <input type="checkbox" checked={isOn}
                  onChange={(e) => {
                    onInlineEdit(row.original._id, 'status', e.target.checked ? 'Active' : 'Off');
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
                <span className="meta-slider"></span>
              </label>
            </div>
          );
        }
      },
    ];

    columns.filter(col => col.visible && col.key !== 'status').forEach(col => {
      list.push({
        id: col.key,
        accessorKey: col.key,
        header: () => {
          const isSorted = sortBy === col.key;
          const isNumeric = ['number', 'currency', 'percentage'].includes(col.type);
          return (
            <div
              onClick={() => col.sortable && onSortChange(col.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                padding: '2px 4px', cursor: col.sortable ? 'pointer' : 'default',
                justifyContent: isNumeric ? 'flex-end' : 'flex-start',
                flexDirection: isNumeric ? 'row-reverse' : 'row',
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.label}</span>
              {col.sortable && (
                <ArrowUpDown size={11} style={{
                  flexShrink: 0,
                  color: isSorted ? '#1877f2' : '#bec3c9',
                  transform: isSorted && sortOrder === 'desc' ? 'rotate(180deg)' : 'none',
                }} />
              )}
            </div>
          );
        },
        cell: ({ row }) => {
          const val = row.original[col.key];

          // STATUS TOGGLE
          if (col.key === 'status') {
            const isOn = val === 'Active';
            return (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <label className="meta-switch">
                  <input type="checkbox" checked={isOn}
                    onChange={(e) => {
                      onInlineEdit(row.original._id, 'status', e.target.checked ? 'Active' : 'Off');
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span className="meta-slider"></span>
                </label>
              </div>
            );
          }

          // DELIVERY - colored dot + text + click to edit
          if (col.key === 'delivery') {
            const displayVal = val || row.original.status || 'Off';
            let dotColor = '#65676b';
            if (displayVal === 'Active' || displayVal === 'Approved' || displayVal === 'Learning') dotColor = '#42b72a';
            else if (displayVal.toLowerCase().includes('error') || displayVal === 'Rejected') dotColor = '#f5a623';
            else if (displayVal === 'Off' || displayVal === 'Inactive') dotColor = '#65676b';
            else if (displayVal.toLowerCase().includes('paused') || displayVal.toLowerCase().includes('pending')) dotColor = '#f5a623';

            return (
              <EditableWrapper
                value={displayVal}
                displayContent={
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '0 4px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: dotColor, flexShrink: 0 }} />
                    <span style={{ color: '#1c1e21', fontSize: '12px' }}>{displayVal}</span>
                  </div>
                }
                columnKey={col.key}
                columnType="text"
                onSave={(newValue) => onInlineEdit(row.original._id, col.key, newValue)}
              />
            );
          }

          // NAME - blue clickable link matching FB Ads Manager styles exactly
          if (col.key === 'name') {
            let drilldownPath = '';
            if (entityType === 'campaign') {
              drilldownPath = `/adsets?campaignId=${row.original.campaignId}`;
            } else if (entityType === 'adset') {
              drilldownPath = `/ads?campaignId=${row.original.campaignId}&adSetId=${row.original.adSetId}`;
            }

            const isAd = entityType === 'ad';
            const imageUrl = row.original.image || row.original.imageUrl;
            const videoUrl = row.original.video || row.original.videoUrl;

            return (
              <div style={{ display: 'flex', alignItems: 'center', maxWidth: '300px', padding: '0 4px' }}>
                {isAd && videoUrl && (
                  <video 
                    src={videoUrl}
                    muted
                    loop
                    playsInline
                    onMouseEnter={(e) => {
                      e.target.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      e.target.pause();
                      e.target.currentTime = 0;
                    }}
                    style={{
                      width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px',
                      marginRight: '8px', border: '1px solid #e4e6eb', flexShrink: 0,
                      backgroundColor: '#000', cursor: 'pointer'
                    }}
                  />
                )}
                {isAd && !videoUrl && imageUrl && (
                  <img src={imageUrl} alt="" style={{
                    width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px',
                    marginRight: '8px', border: '1px solid #e4e6eb', flexShrink: 0,
                  }} onError={(e) => { e.target.style.display = 'none'; }} />
                )}
                <div style={{ minWidth: 0 }}>
                  {drilldownPath ? (
                    <Link to={drilldownPath}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: '#1461cc', fontWeight: 400, fontSize: '14px', lineHeight: '20px',
                        textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap', display: 'block',
                      }}
                      onMouseEnter={e => e.target.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.target.style.textDecoration = 'none'}
                    >
                      {val}
                    </Link>
                  ) : (
                    <span style={{ color: '#1461cc', fontWeight: 400, fontSize: '14px', lineHeight: '20px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                      {val}
                    </span>
                  )}
                </div>
                {user?.role === 'SUPER_ADMIN' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Are you sure you want to hard delete this ${entityType}?`)) {
                        onInlineDelete?.(row.original._id);
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px',
                      color: '#fa3e3e',
                      display: 'flex',
                      alignItems: 'center',
                      flexShrink: 0,
                      opacity: 0.6,
                      marginLeft: '8px',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                    onMouseLeave={e => e.currentTarget.style.opacity = 0.6}
                    title={`Delete this ${entityType}`}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            );
          }

          // BUDGET with sublabel + editable
          if (col.key === 'budget') {
            const budgetType = row.original.budgetType || 'Daily';
            const formatted = typeof val === 'number'
              ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val)
              : val;
            return (
              <EditableWrapper
                value={val ?? ''}
                displayContent={
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px', textAlign: 'right', width: '100%' }}>
                    <span style={{ fontWeight: 500, color: '#1c1e21', fontSize: '13px' }}>{typeof val === 'string' ? val : formatted}</span>
                    {typeof val === 'number' && <span style={{ fontSize: '11px', color: '#65676b' }}>{budgetType}</span>}
                  </div>
                }
                columnKey={col.key}
                columnType="number"
                onSave={(newValue) => onInlineEdit(row.original._id, col.key, newValue)}
              />
            );
          }

          // RESULTS with sublabel + editable
          if (col.key === 'results') {
            const resultType = row.original.resultType || 'Post engagement';
            const formatted = typeof val === 'number' ? val.toLocaleString('en-IN') : val;
            return (
              <EditableWrapper
                value={val ?? ''}
                displayContent={
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px', textAlign: 'right', width: '100%' }}>
                    <span style={{ fontWeight: 500, color: '#1c1e21', fontSize: '13px' }}>{formatted ?? '—'}</span>
                    {val != null && <span style={{ fontSize: '11px', color: '#65676b' }}>{resultType}</span>}
                  </div>
                }
                columnKey={col.key}
                columnType="number"
                onSave={(newValue) => onInlineEdit(row.original._id, col.key, newValue)}
              />
            );
          }

          // COST PER RESULT with sublabel + editable
          if (col.key === 'costPerResult') {
            const resultType = row.original.resultType || 'Per post engagement';
            const formatted = typeof val === 'number'
              ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val)
              : val;
            return (
              <EditableWrapper
                value={val ?? ''}
                displayContent={
                  <div style={{ display: 'flex', flexDirection: 'column', padding: '0 4px', textAlign: 'right', width: '100%' }}>
                    <span style={{ fontWeight: 500, color: '#1c1e21', fontSize: '13px' }}>{formatted ?? '—'}</span>
                    {val != null && <span style={{ fontSize: '11px', color: '#65676b' }}>{resultType}</span>}
                  </div>
                }
                columnKey={col.key}
                columnType="number"
                onSave={(newValue) => onInlineEdit(row.original._id, col.key, newValue)}
              />
            );
          }

          // ALL OTHER CELLS → EDITABLE via InlineEditableCell
          return (
            <InlineEditableCell
              value={val}
              columnKey={col.key}
              columnType={col.type}
              isEditable={col.editable !== false}
              onSave={(newValue) => onInlineEdit(row.original._id, col.key, newValue)}
            />
          );
        },
      });
    });

    return list;
  }, [columns, entityType, sortBy, sortOrder, onSortChange, onInlineEdit]);

  // Row selection
  const rowSelectionState = useMemo(() => {
    const s = {};
    data.forEach((row, idx) => { if (selectedRows[row._id]) s[idx] = true; });
    return s;
  }, [data, selectedRows]);

  const handleRowSelectionChange = (updater) => {
    const next = typeof updater === 'function' ? updater(rowSelectionState) : updater;
    const map = {};
    data.forEach((row, idx) => { if (next[idx]) map[row._id] = row; });
    onSelectedRowsChange(map);
  };

  const table = useReactTable({
    data, columns: tableColumns,
    state: { rowSelection: rowSelectionState },
    onRowSelectionChange: handleRowSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const reachSum = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + (Number(item.reach) || 0), 0);
  }, [data]);

  const impressionsSum = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + (Number(item.impressions) || 0), 0);
  }, [data]);

  const amountSpentSum = useMemo(() => {
    if (!data) return 0;
    return data.reduce((sum, item) => sum + (Number(item.amountSpent) || 0), 0);
  }, [data]);

  const frequencyWeighted = useMemo(() => {
    if (reachSum === 0) return 0;
    return impressionsSum / reachSum;
  }, [reachSum, impressionsSum]);

  const entityLabel = entityType === 'campaign' ? 'campaigns' : entityType === 'adset' ? 'ad sets' : 'ads';

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '80px 0' }}>
        <RefreshCw size={22} color="#1877f2" style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#8a8d91', marginTop: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Loading...</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff', padding: '64px 0', textAlign: 'center' }}>
        <AlertCircle size={26} color="#fa3e3e" style={{ marginBottom: '8px' }} />
        <h3 style={{ fontSize: '13px', fontWeight: 700, color: '#1c1e21' }}>Connection Failed</h3>
        <p style={{ fontSize: '12px', color: '#65676b', marginTop: '4px', maxWidth: '320px' }}>{error.message || 'Could not fetch records.'}</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#fff', overflow: 'hidden', flex: 1 }}>
      {/* Table */}
      <div style={{ overflow: 'auto', flex: 1, minHeight: '250px' }}>
        <table className="meta-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse', minWidth: 'max-content' }}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id}>
                {hg.headers.map(h => (
                  <th key={h.id} style={{ backgroundColor: 'var(--meta-table-header-bg)' }}>
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={tableColumns.length} style={{ textAlign: 'center', color: '#8a8d91', padding: '80px 0' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#65676b' }}>No {entityLabel} match this criteria.</span>
                    <span style={{ fontSize: '12px', color: '#8a8d91' }}>Click Create to add your first item or clear the active filter.</span>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIdx) => (
                <tr key={row.id} className={row.getIsSelected() ? 'selected' : ''}>
                  {row.getVisibleCells().map(cell => {
                    const isAlternateRow = rowIdx % 2 === 1;
                    const isSelected = row.getIsSelected();
                    const bgColor = isSelected ? '#e7f3ff' : (isAlternateRow ? '#f2f3f5' : '#ffffff');
                    return (
                      <td key={cell.id} style={{ backgroundColor: bgColor }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
          {data.length > 0 && (
            <tfoot style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff', zIndex: 4 }}>
              <tr>
                {table.getVisibleFlatColumns().map((col) => {
                  const isSelect = col.id === 'select';
                  const isStatus = col.id === 'status';
                  const isName = col.id === 'name';
                  const isReach = col.id === 'reach';
                  const isImpressions = col.id === 'impressions';
                  const isAmountSpent = col.id === 'amountSpent';
                  const isFrequency = col.id === 'frequency';

                  const colDef = columns.find(c => c.key === col.id);
                  const isNumeric = colDef && ['number', 'currency', 'percentage'].includes(colDef.type);

                  const commonStyle = {
                    padding: '6px 8px',
                    borderTop: '2px solid #dddfe2',
                    borderBottom: '2px solid #dddfe2',
                    borderRight: '1px solid #ebedf0',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: '#1c1e21',
                    verticalAlign: 'top',
                    backgroundColor: '#ffffff',
                  };

                  if (isSelect || isStatus) {
                    return <td key={col.id} style={commonStyle} />;
                  }

                  if (isName) {
                    return (
                      <td key={col.id} style={{ ...commonStyle, textAlign: 'left' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minHeight: '32px' }}>
                          <span>Results from {total} {entityLabel}</span>
                          <Info size={12} color="#8a8d91" style={{ cursor: 'help' }} />
                        </div>
                      </td>
                    );
                  }

                  if (isReach) {
                    return (
                      <td key={col.id} style={{ ...commonStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minHeight: '32px' }}>
                          <span>{reachSum.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '11px', color: '#65676b', fontWeight: 400, marginTop: '2px' }}>Meta accounts</span>
                        </div>
                      </td>
                    );
                  }

                  if (isImpressions) {
                    return (
                      <td key={col.id} style={{ ...commonStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minHeight: '32px' }}>
                          <span>{impressionsSum.toLocaleString('en-IN')}</span>
                          <span style={{ fontSize: '11px', color: '#65676b', fontWeight: 400, marginTop: '2px' }}>Total</span>
                        </div>
                      </td>
                    );
                  }

                  if (isAmountSpent) {
                    return (
                      <td key={col.id} style={{ ...commonStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minHeight: '32px' }}>
                          <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amountSpentSum)}</span>
                          <span style={{ fontSize: '11px', color: '#65676b', fontWeight: 400, marginTop: '2px' }}>Total Spent</span>
                        </div>
                      </td>
                    );
                  }

                  if (isFrequency) {
                    return (
                      <td key={col.id} style={{ ...commonStyle, textAlign: 'right' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minHeight: '32px' }}>
                          <span>{frequencyWeighted > 0 ? frequencyWeighted.toFixed(2) : '—'}</span>
                          <span style={{ fontSize: '11px', color: '#65676b', fontWeight: 400, marginTop: '2px' }}>Per Meta account</span>
                        </div>
                      </td>
                    );
                  }

                  return (
                    <td key={col.id} style={{ ...commonStyle, textAlign: isNumeric ? 'right' : 'left', color: '#8a8d91' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: isNumeric ? 'flex-end' : 'flex-start', minHeight: '32px', justifyContent: 'center' }}>
                        <span>—</span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderTop: '1px solid #dddfe2', backgroundColor: '#f5f6f7',
        padding: '8px 16px', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#65676b' }}>
          <span>Results from <strong style={{ color: '#1c1e21' }}>{total}</strong> {entityLabel}</span>
          <Info size={12} color="#8a8d91" style={{ cursor: 'help' }} />
          {Object.keys(selectedRows).length > 0 && (
            <span style={{ fontWeight: 700, color: '#1877f2', backgroundColor: '#e7f3ff', padding: '2px 6px', borderRadius: '4px', fontSize: '12px', marginLeft: '4px' }}>
              {Object.keys(selectedRows).length} selected
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            style={{
              padding: '4px 10px', border: '1px solid #dddfe2', borderRadius: '4px',
              backgroundColor: '#fff', fontSize: '13px', fontWeight: 600, color: '#1c1e21',
              cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.3 : 1,
            }}>
            Prev
          </button>
          <span style={{ padding: '0 8px', fontSize: '13px', color: '#65676b' }}>
            <strong style={{ color: '#1c1e21' }}>{page}</strong> / <strong style={{ color: '#1c1e21' }}>{pages || 1}</strong>
          </span>
          <button onClick={() => onPageChange(page + 1)} disabled={page >= pages}
            style={{
              padding: '4px 10px', border: '1px solid #dddfe2', borderRadius: '4px',
              backgroundColor: '#fff', fontSize: '13px', fontWeight: 600, color: '#1c1e21',
              cursor: page >= pages ? 'not-allowed' : 'pointer', opacity: page >= pages ? 0.3 : 1,
            }}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
