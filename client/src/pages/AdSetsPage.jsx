import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { useDateRange } from '../context/DateRangeContext';
import { toast } from 'sonner';
import { Plus, Search, Trash2, Copy, FileSpreadsheet, RefreshCw } from 'lucide-react';
import DataTable from '../components/DataTable';
import CreateEntityModal from '../components/CreateEntityModal';
import ImportExport, { exportToCSV } from '../components/ImportExport';
import AdsManagerNavigation from '../components/AdsManagerNavigation';
import AdsManagerToolbar from '../components/AdsManagerToolbar';

const AdSetsPage = () => {
  const queryClient = useQueryClient();
  const { dateRange } = useDateRange();
  const [searchParams, setSearchParams] = useSearchParams();

  // Drilldown filter
  const campaignId = searchParams.get('campaignId') || '';

  // URL States
  const page = parseInt(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const statusFilter = searchParams.get('status') || 'All';
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';

  const [searchInput, setSearchInput] = useState(search);
  const [selectedRows, setSelectedRows] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Debounce search input
  useEffect(() => {
    if (searchInput === search) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (searchInput) {
        params.set('search', searchInput);
      } else {
        params.delete('search');
      }
      params.set('page', '1'); // Reset to page 1 on new search query
      setSearchParams(params);
    }, 450);

    return () => clearTimeout(handler);
  }, [searchInput, search, searchParams, setSearchParams]);

  // Sync search input if URL changes
  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  // Reset to page 1 whenever date range changes
  useEffect(() => {
    const currentPage = searchParams.get('page');
    if (currentPage && currentPage !== '1') {
      const params = new URLSearchParams(searchParams);
      params.set('page', '1');
      setSearchParams(params);
    }
  }, [dateRange.startDate, dateRange.endDate]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(key, value);
    setSearchParams(params);
  };

  // 1. Fetch Column Configuration
  const { data: columns = [] } = useQuery({
    queryKey: ['columns', 'adset'],
    queryFn: async () => {
      const res = await API.get('/columns/adset');
      return res.data?.data || [];
    },
  });

  // 2. Fetch Ad Sets Data
  const { data: adsetRes, isLoading, error } = useQuery({
    queryKey: [
      'adsets',
      campaignId,
      page,
      search,
      statusFilter,
      sortBy,
      sortOrder,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: async () => {
      const res = await API.get('/adsets', {
        params: {
          campaignId, // Passed filter
          page,
          limit: 10,
          search,
          status: statusFilter,
          sortBy,
          sortOrder,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return res.data?.data;
    },
  });

  const adsets = adsetRes?.adsets || [];
  const total = adsetRes?.total || 0;
  const pages = adsetRes?.pages || 1;
  const summary = adsetRes?.summary || null;
  const dateRangeMessage = adsetRes?.dateRangeMessage || null;

  // 3. Mutations
  const createAdSetMutation = useMutation({
    mutationFn: async (newAdSet) => {
      const res = await API.post('/adsets', newAdSet);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsets'] });
      toast.success('Ad Set created successfully');
      setShowCreateModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create ad set');
    },
  });

  const inlineEditMutation = useMutation({
    mutationFn: async ({ id, key, value }) => {
      const res = await API.patch(`/adsets/${id}`, {
        [key]: value,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return res.data;
    },
    onMutate: async ({ id, key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['adsets'] });
      queryClient.setQueriesData({ queryKey: ['adsets'] }, (old) => {
        if (!old) return old;
        const adsetsList = old.adsets || [];
        const oldItem = adsetsList.find(s => s._id === id);
        const oldVal = Number(oldItem?.[key]) || 0;
        const newVal = typeof value === 'number' ? value : (parseFloat(value) || value);
        const diff = (typeof newVal === 'number' && !isNaN(newVal)) ? newVal - oldVal : 0;

        const updatedAdSets = adsetsList.map(s => {
          if (s._id !== id) return s;
          const updated = { ...s, [key]: newVal };
          if (updated.results > 0 && updated.amountSpent > 0) {
            updated.costPerResult = parseFloat((updated.amountSpent / updated.results).toFixed(2));
          }
          if (updated.reach > 0 && updated.impressions > 0) {
            updated.frequency = parseFloat((updated.impressions / updated.reach).toFixed(2));
          }
          return updated;
        });

        const updatedSummary = old.summary ? {
          ...old.summary,
          [key]: (Number(old.summary[key]) || 0) + diff,
          ...(key === 'results' ? { totalResults: (Number(old.summary.totalResults ?? old.summary.results) || 0) + diff } : {}),
          ...(key === 'reach' ? { totalReach: (Number(old.summary.totalReach ?? old.summary.reach) || 0) + diff } : {}),
          ...(key === 'impressions' ? { totalImpressions: (Number(old.summary.totalImpressions ?? old.summary.impressions) || 0) + diff } : {}),
          ...(key === 'amountSpent' ? { totalSpend: parseFloat(((Number(old.summary.totalSpend ?? old.summary.amountSpent) || 0) + diff).toFixed(2)) } : {}),
          numericTotals: {
            ...(old.summary.numericTotals || {}),
            [key]: (Number(old.summary.numericTotals?.[key]) || 0) + diff,
          },
        } : null;

        if (updatedSummary) {
          if (updatedSummary.results > 0 && updatedSummary.amountSpent > 0) {
            updatedSummary.costPerResultAvg = parseFloat((updatedSummary.amountSpent / updatedSummary.results).toFixed(2));
          }
          if (updatedSummary.reach > 0 && updatedSummary.impressions > 0) {
            updatedSummary.frequencyWeighted = parseFloat((updatedSummary.impressions / updatedSummary.reach).toFixed(2));
          }
        }

        return {
          ...old,
          adsets: updatedAdSets,
          summary: updatedSummary || old.summary,
        };
      });
    },
    onSuccess: () => {
      toast.success('Ad Set updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update field');
    },
  });

  const deleteAdSetMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/adsets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsets'] });
      setSelectedRows({});
      toast.success('Ad Set deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete ad set');
    },
  });

  const duplicateAdSetMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.post(`/adsets/${id}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adsets'] });
      toast.success('Ad Set duplicated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to duplicate ad set');
    },
  });

  // 4. Bulk Handlers
  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRows);
    if (window.confirm(`Are you sure you want to delete the ${ids.length} selected ad sets? All associated ads will also be deleted.`)) {
      for (const id of ids) {
        await deleteAdSetMutation.mutateAsync(id);
      }
      setSelectedRows({});
      toast.success('Selected ad sets deleted successfully');
    }
  };

  const handleBulkDuplicate = async () => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(ids.map((id) => duplicateAdSetMutation.mutateAsync(id)));
      setSelectedRows({});
      toast.success('Selected ad sets duplicated successfully');
    } catch (err) {
      toast.error('Some ad sets failed to duplicate');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(
        ids.map((id) => inlineEditMutation.mutateAsync({ id, key: 'status', value: newStatus }))
      );
      setSelectedRows({});
      toast.success(`Selected ad sets set to '${newStatus}'`);
    } catch (err) {
      toast.error('Failed to update status on some ad sets');
    }
  };

  const handleBulkBudgetChange = async (newBudget) => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(
        ids.map((id) => inlineEditMutation.mutateAsync({ id, key: 'budget', value: newBudget }))
      );
      setSelectedRows({});
      toast.success(`Selected ad sets budget set to INR ${newBudget}`);
    } catch (err) {
      toast.error('Failed to update budget on some ad sets');
    }
  };

  const handleExportCSV = () => {
    const exportData = Object.keys(selectedRows).length > 0 
      ? Object.values(selectedRows) 
      : adsets;
    exportToCSV(exportData, columns, 'adsets');
  };

  const statusTabs = ['All', 'Active', 'Off', 'Had delivery', 'Paused'];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f0f2f5] border-l border-gray-200">
      {/* Meta Filter Navigation Bar */}
      <AdsManagerNavigation
        activeLevel="adsets"
        searchInput={searchInput}
        setSearchInput={setSearchInput}
        statusFilter={statusFilter}
        setStatusFilter={(tab) => {
          updateParam('status', tab);
          updateParam('page', '1');
        }}
      />

      {/* Meta Toolbar for CRUD actions */}
      <AdsManagerToolbar
        entityType="adset"
        selectedCount={Object.keys(selectedRows).length}
        onCreate={() => setShowCreateModal(true)}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
        onExport={handleExportCSV}
        onBulkStatus={handleBulkStatusChange}
        onBulkBudget={handleBulkBudgetChange}
        importComponent={
          <ImportExport
            entityType="adset"
            columns={columns}
            existingItems={adsets}
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['adsets'] })}
          />
        }
      />

      {/* Grid Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={adsets}
          entityType="adset"
          page={page}
          pages={pages}
          total={total}
          summary={summary}
          dateRangeMessage={dateRangeMessage}
          onPageChange={(nextPage) => updateParam('page', String(nextPage))}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={(field) => {
            const order = sortBy === field && sortOrder === 'asc' ? 'desc' : 'asc';
            updateParam('sortBy', field);
            updateParam('sortOrder', order);
          }}
          onInlineEdit={(id, key, value) => inlineEditMutation.mutate({ id, key, value })}
          onInlineDelete={(id) => deleteAdSetMutation.mutate(id)}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        entityType="adset"
        onSave={(data) => createAdSetMutation.mutate(data)}
      />
    </div>
  );
};

export default AdSetsPage;
