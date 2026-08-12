import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import API from '../services/api';
import { Eye, EyeOff, Edit, Plus, Trash2, ArrowUp, ArrowDown, GripVertical, Check, Info } from 'lucide-react';
import { toast } from 'sonner';

const ColumnManager = ({ entityType }) => {
  const queryClient = useQueryClient();
  const [newColKey, setNewColKey] = useState('');
  const [newColLabel, setNewColLabel] = useState('');
  const [newColType, setNewColType] = useState('text');
  const [isAdding, setIsAdding] = useState(false);

  // 1. Fetch Column Configurations
  const { data: columnsData, isLoading, error } = useQuery({
    queryKey: ['columns', entityType],
    queryFn: async () => {
      const res = await API.get(`/columns/${entityType}`);
      return res.data?.data || [];
    },
  });

  const columns = columnsData || [];

  // 2. Mutations
  const updateColumnMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const res = await API.patch(`/columns/${id}`, updates);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns', entityType] });
      toast.success(data.message || 'Column updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update column');
    },
  });

  const deleteColumnMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/columns/${id}`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns', entityType] });
      toast.success(data.message || 'Column deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete column');
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: async (newCol) => {
      const res = await API.post('/columns', newCol);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns', entityType] });
      toast.success(data.message || 'Column added successfully');
      setNewColKey('');
      setNewColLabel('');
      setIsAdding(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to add column');
    },
  });

  const reorderMutation = useMutation({
    mutationFn: async (reorderedList) => {
      const payload = {
        columns: reorderedList.map((col, idx) => ({ id: col._id, order: idx })),
      };
      const res = await API.patch('/columns/reorder', payload);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['columns', entityType] });
      toast.success('Column order updated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to reorder columns');
    },
  });

  // 3. Drag and Drop handlers
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (isNaN(dragIndex) || dragIndex === dropIndex) return;

    const list = [...columns];
    const [removed] = list.splice(dragIndex, 1);
    list.splice(dropIndex, 0, removed);

    // Save reorder
    reorderMutation.mutate(list);
  };

  const handleMoveUp = (index) => {
    if (index === 0) return;
    const list = [...columns];
    const temp = list[index];
    list[index] = list[index - 1];
    list[index - 1] = temp;
    reorderMutation.mutate(list);
  };

  const handleMoveDown = (index) => {
    if (index === columns.length - 1) return;
    const list = [...columns];
    const temp = list[index];
    list[index] = list[index + 1];
    list[index + 1] = temp;
    reorderMutation.mutate(list);
  };

  const handleAddColumnSubmit = (e) => {
    e.preventDefault();
    if (!newColKey || !newColLabel) {
      toast.error('Key and Label are required');
      return;
    }
    createColumnMutation.mutate({
      entityType,
      key: newColKey.trim().toLowerCase(),
      label: newColLabel.trim(),
      type: newColType,
      visible: true,
      editable: true,
      sortable: true,
      filterable: true,
    });
  };

  if (isLoading) {
    return <div className="text-xs text-gray-500 py-6">Loading column configurations...</div>;
  }

  if (error) {
    return <div className="text-xs text-red-600 py-6">Error loading column configurations: {error.message}</div>;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div>
          <h2 className="text-sm font-semibold text-gray-900 capitalize">{entityType} Columns Configuration</h2>
          <p className="text-[11px] text-gray-500 mt-0.5">Drag rows, toggle visibility and edit settings. Changes save automatically.</p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus size={14} />
          <span>Add Column</span>
        </button>
      </div>

      {/* Add Column Form */}
      {isAdding && (
        <form onSubmit={handleAddColumnSubmit} className="p-4 border-b border-gray-100 bg-blue-50/20 space-y-4">
          <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Define New Column</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Field Key (Alphanumeric/Underscore)</label>
              <input
                type="text"
                value={newColKey}
                onChange={(e) => setNewColKey(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="e.g. click_through_rate"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Field Display Label</label>
              <input
                type="text"
                value={newColLabel}
                onChange={(e) => setNewColLabel(e.target.value)}
                placeholder="e.g. Click-Through Rate"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase">Data Type</label>
              <select
                value={newColType}
                onChange={(e) => setNewColType(e.target.value)}
                className="mt-1 w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-xs focus:border-blue-500 focus:outline-none"
              >
                {['text', 'number', 'currency', 'percentage', 'date', 'datetime', 'boolean', 'status', 'select', 'image', 'link'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded hover:bg-gray-250 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 rounded hover:bg-green-700 transition-colors shadow-sm"
            >
              <Check size={14} />
              <span>Save Column Config</span>
            </button>
          </div>
        </form>
      )}

      {/* Column Config Rows List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-6 py-2.5 w-12 text-center">Sort</th>
              <th className="px-4 py-2.5">Field Key</th>
              <th className="px-4 py-2.5">Display Label</th>
              <th className="px-4 py-2.5">Data Type</th>
              <th className="px-4 py-2.5 text-center">Visible</th>
              <th className="px-4 py-2.5 text-center">Editable</th>
              <th className="px-4 py-2.5 text-center">Sortable</th>
              <th className="px-4 py-2.5 text-center">Filterable</th>
              <th className="px-6 py-2.5 text-center w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {columns.length === 0 ? (
              <tr>
                <td colSpan="9" className="text-center text-gray-400 py-8">No columns configured for this entity type.</td>
              </tr>
            ) : (
              columns.map((col, index) => (
                <tr
                  key={col._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors group"
                >
                  {/* Grip Reorder column */}
                  <td className="px-6 py-3 flex items-center justify-center gap-1">
                    <span className="cursor-grab active:cursor-grabbing text-gray-400 group-hover:text-gray-600 transition-colors">
                      <GripVertical size={14} />
                    </span>
                    <div className="flex flex-col text-[9px] text-gray-300">
                      <button onClick={() => handleMoveUp(index)} disabled={index === 0} className="hover:text-gray-600 disabled:hover:text-gray-300">
                        <ArrowUp size={10} />
                      </button>
                      <button onClick={() => handleMoveDown(index)} disabled={index === columns.length - 1} className="hover:text-gray-600 disabled:hover:text-gray-300">
                        <ArrowDown size={10} />
                      </button>
                    </div>
                  </td>

                  {/* Key */}
                  <td className="px-4 py-3 font-mono font-medium text-gray-600">{col.key}</td>

                  {/* Label (Editable inline) */}
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    <input
                      type="text"
                      value={col.label}
                      onChange={(e) => {
                        const target = e.target.value;
                        // Debounce or edit on blur
                      }}
                      onBlur={(e) => {
                        if (e.target.value.trim() && e.target.value !== col.label) {
                          updateColumnMutation.mutate({ id: col._id, updates: { label: e.target.value.trim() } });
                        }
                      }}
                      className="rounded border border-transparent bg-transparent hover:border-gray-200 focus:border-blue-500 focus:bg-white focus:outline-none px-2 py-1 -ml-2 text-xs font-semibold text-gray-800 transition-all w-full max-w-[180px]"
                    />
                  </td>

                  {/* Type */}
                  <td className="px-4 py-3">
                    <select
                      value={col.type}
                      onChange={(e) => updateColumnMutation.mutate({ id: col._id, updates: { type: e.target.value } })}
                      className="rounded border border-gray-200 bg-white px-1.5 py-0.5 text-xs text-gray-700 focus:outline-none"
                    >
                      {['text', 'number', 'currency', 'percentage', 'date', 'datetime', 'boolean', 'status', 'select', 'image', 'link'].map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Visible */}
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => updateColumnMutation.mutate({ id: col._id, updates: { visible: !col.visible } })}
                      className={`inline-flex rounded p-1 transition-colors ${
                        col.visible ? 'text-blue-600 hover:bg-blue-50' : 'text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {col.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                  </td>

                  {/* Editable */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!col.editable}
                      onChange={(e) => updateColumnMutation.mutate({ id: col._id, updates: { editable: e.target.checked } })}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  {/* Sortable */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!col.sortable}
                      onChange={(e) => updateColumnMutation.mutate({ id: col._id, updates: { sortable: e.target.checked } })}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  {/* Filterable */}
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={!!col.filterable}
                      onChange={(e) => updateColumnMutation.mutate({ id: col._id, updates: { filterable: e.target.checked } })}
                      className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-3 text-center">
                    {/* Prevent deleting key campaign metrics critical to standard systems */}
                    {['campaignId', 'adSetId', 'adId', 'name', 'delivery', 'status'].includes(col.key) ? (
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider cursor-help" title="System column cannot be deleted">
                        System
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to delete column '${col.label}'?`)) {
                            deleteColumnMutation.mutate(col._id);
                          }
                        }}
                        className="rounded p-1 text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex gap-2 items-start text-gray-500">
        <Info size={14} className="mt-0.5 shrink-0 text-blue-500" />
        <p className="text-[10px]">
          Adding a column makes it immediately queryable in the corresponding table view. New entries will default to empty values, which can then be inline edited on the respective dashboard list screen.
        </p>
      </div>
    </div>
  );
};

export default ColumnManager;
