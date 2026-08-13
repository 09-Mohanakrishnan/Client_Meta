import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../services/api';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';

const CreateEntityModal = ({ isOpen, onClose, entityType, onSave }) => {
  const [formData, setFormData] = useState({});
  const [selectedParentId, setSelectedParentId] = useState('');

  // 1. Fetch Column Configuration to build dynamic fields
  const { data: columns } = useQuery({
    queryKey: ['columns', entityType],
    queryFn: async () => {
      const res = await API.get(`/columns/${entityType}`);
      return res.data?.data || [];
    },
    enabled: isOpen,
  });

  // 2. Fetch parent options (Campaigns for AdSets; AdSets for Ads)
  const { data: campaigns } = useQuery({
    queryKey: ['campaign-options'],
    queryFn: async () => {
      const res = await API.get('/campaigns?limit=100');
      return res.data?.data?.campaigns || [];
    },
    enabled: isOpen && entityType === 'adset',
  });

  const { data: adsets } = useQuery({
    queryKey: ['adset-options'],
    queryFn: async () => {
      const res = await API.get('/adsets?limit=200');
      return res.data?.data?.adsets || [];
    },
    enabled: isOpen && entityType === 'ad',
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const defaults = {};
      if (columns) {
        columns.forEach((col) => {
          if (col.key === 'status') {
            defaults[col.key] = 'Draft';
          } else if (col.type === 'boolean') {
            defaults[col.key] = false;
          } else if (col.type === 'number' || col.type === 'currency' || col.type === 'percentage') {
            defaults[col.key] = 0;
          } else if (col.key === 'budgetType') {
            defaults[col.key] = 'Daily';
          } else {
            defaults[col.key] = '';
          }
        });
      }
      setFormData(defaults);
      setSelectedParentId('');
    }
  }, [isOpen, columns]);

  if (!isOpen) return null;

  const handleChange = (key, value, type) => {
    let val = value;
    if (type === 'number' || type === 'currency' || type === 'percentage') {
      val = value === '' ? '' : parseFloat(value);
      if (isNaN(val)) val = '';
    }
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validations & parent assignment
    const submissionData = { ...formData };
    
    // Remove auto-generated blank ID placeholders to prevent Zod empty string errors
    if (submissionData.campaignId === '') delete submissionData.campaignId;
    if (submissionData.adSetId === '') delete submissionData.adSetId;
    if (submissionData.adId === '') delete submissionData.adId;

    if (entityType === 'adset') {
      if (!selectedParentId) {
        toast.error('Please select a parent Campaign');
        return;
      }
      submissionData.campaignId = selectedParentId;
    }

    if (entityType === 'ad') {
      if (!selectedParentId) {
        toast.error('Please select a parent Ad Set');
        return;
      }
      const selectedSetObj = adsets.find((set) => set.adSetId === selectedParentId);
      if (selectedSetObj) {
        submissionData.adSetId = selectedParentId;
        submissionData.campaignId = selectedSetObj.campaignId;
        submissionData.adSetName = selectedSetObj.name;
      } else {
        toast.error('Invalid parent Ad Set selected');
        return;
      }
    }

    onSave(submissionData);
  };

  // Filter out fields generated automatically or that are IDs assigned via dropdown
  const filterFormColumns = (columns || []).filter((col) => {
    if (col.key === 'campaignId' && entityType !== 'campaign') return false;
    if (col.key === 'adSetId') return false;
    if (col.key === 'adSetName') return false;
    // Don't ask user to input short key IDs manually, we autogenerate them
    if (['campaignId', 'adSetId', 'adId'].includes(col.key)) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-3.5 bg-gray-50/50">
          <h2 className="text-[15px] font-bold text-gray-900 capitalize">Create New {entityType}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Parent select dropdowns */}
          {entityType === 'adset' && (
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1">Parent Campaign <span className="text-red-500">*</span></label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Select Campaign --</option>
                {campaigns?.map((c) => (
                  <option key={c._id} value={c.campaignId}>
                    {c.name} ({c.campaignId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {entityType === 'ad' && (
            <div>
              <label className="block text-[12px] font-semibold text-gray-700 mb-1">Parent Ad Set <span className="text-red-500">*</span></label>
              <select
                value={selectedParentId}
                onChange={(e) => setSelectedParentId(e.target.value)}
                className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none"
                required
              >
                <option value="">-- Select Ad Set --</option>
                {adsets?.map((s) => (
                  <option key={s._id} value={s.adSetId}>
                    {s.name} ({s.adSetId})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dynamic Inputs mapped from ColumnConfig */}
          {filterFormColumns.map((col) => {
            return (
              <div key={col.key}>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1">
                  {col.label} {col.key === 'name' ? <span className="text-red-500">*</span> : null}
                </label>

                {col.key === 'status' ? (
                  <select
                    value={formData[col.key] || 'Draft'}
                    onChange={(e) => handleChange(col.key, e.target.value, col.type)}
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none"
                  >
                    {['Active', 'Off', 'Paused', 'Draft', 'Payment error'].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : col.key === 'budgetType' ? (
                  <select
                    value={formData[col.key] || 'Daily'}
                    onChange={(e) => handleChange(col.key, e.target.value, col.type)}
                    className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none"
                  >
                    <option value="Daily">Daily</option>
                    <option value="Lifetime">Lifetime</option>
                  </select>
                ) : col.type === 'boolean' ? (
                  <div className="mt-2 flex items-center">
                    <input
                      type="checkbox"
                      checked={!!formData[col.key]}
                      onChange={(e) => handleChange(col.key, e.target.checked, col.type)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-[13px] text-gray-700">Enabled</span>
                  </div>
                ) : col.type === 'date' ? (
                  <input
                    type="date"
                    value={formData[col.key] || ''}
                    onChange={(e) => handleChange(col.key, e.target.value, col.type)}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <input
                    type={col.type === 'number' || col.type === 'currency' || col.type === 'percentage' ? 'number' : 'text'}
                    value={formData[col.key] ?? ''}
                    onChange={(e) => handleChange(col.key, e.target.value, col.type)}
                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-[13px] focus:border-blue-500 focus:outline-none"
                    required={col.key === 'name'}
                    min={col.type === 'number' || col.type === 'currency' || col.type === 'percentage' ? '0' : undefined}
                    step={col.type === 'percentage' ? '0.01' : '1'}
                  />
                )}
              </div>
            );
          })}

          {/* Footer controls */}
          <div className="flex gap-2 justify-end pt-4 border-t border-gray-200 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[13px] font-semibold text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Check size={14} />
              <span>Save & Publish</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEntityModal;
