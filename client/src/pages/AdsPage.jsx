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

const AdsPage = () => {
  const queryClient = useQueryClient();
  const { dateRange } = useDateRange();
  const [searchParams, setSearchParams] = useSearchParams();

  // Drilldown filters
  const campaignId = searchParams.get('campaignId') || '';
  const adSetId = searchParams.get('adSetId') || '';

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
    queryKey: ['columns', 'ad'],
    queryFn: async () => {
      const res = await API.get('/columns/ad');
      return res.data?.data || [];
    },
  });

  // 2. Fetch Ads Data
  const { data: adRes, isLoading, error } = useQuery({
    queryKey: [
      'ads',
      campaignId,
      adSetId,
      page,
      search,
      statusFilter,
      sortBy,
      sortOrder,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: async () => {
      const res = await API.get('/ads', {
        params: {
          campaignId,
          adSetId,
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

  const ads = adRes?.ads || [];
  const total = adRes?.total || 0;
  const pages = adRes?.pages || 1;
  const summary = adRes?.summary || null;
  const dateRangeMessage = adRes?.dateRangeMessage || null;

  // 3. Mutations
  const createAdMutation = useMutation({
    mutationFn: async (newAd) => {
      const res = await API.post('/ads', newAd);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('Ad created successfully');
      setShowCreateModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create ad');
    },
  });

  const inlineEditMutation = useMutation({
    mutationFn: async ({ id, key, value }) => {
      const res = await API.patch(`/ads/${id}`, {
        [key]: value,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      });
      return res.data;
    },
    onMutate: async ({ id, key, value }) => {
      await queryClient.cancelQueries({ queryKey: ['ads'] });
      queryClient.setQueriesData({ queryKey: ['ads'] }, (old) => {
        if (!old) return old;
        const adsList = old.ads || [];
        const oldItem = adsList.find(a => a._id === id);
        const oldVal = Number(oldItem?.[key]) || 0;
        const newVal = typeof value === 'number' ? value : (parseFloat(value) || value);
        const diff = (typeof newVal === 'number' && !isNaN(newVal)) ? newVal - oldVal : 0;

        const updatedAds = adsList.map(a => {
          if (a._id !== id) return a;
          const updated = { ...a, [key]: newVal };
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
          ads: updatedAds,
          summary: updatedSummary || old.summary,
        };
      });
    },
    onSuccess: () => {
      toast.success('Ad updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update field');
    },
  });

  const deleteAdMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/ads/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      setSelectedRows({});
      toast.success('Ad deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete ad');
    },
  });

  const duplicateAdMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.post(`/ads/${id}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
      toast.success('Ad duplicated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to duplicate ad');
    },
  });

  // 4. Bulk Handlers
  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRows);
    if (window.confirm(`Are you sure you want to delete the ${ids.length} selected ads?`)) {
      for (const id of ids) {
        await deleteAdMutation.mutateAsync(id);
      }
      setSelectedRows({});
      toast.success('Selected ads deleted successfully');
    }
  };

  const handleBulkDuplicate = async () => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(ids.map((id) => duplicateAdMutation.mutateAsync(id)));
      setSelectedRows({});
      toast.success('Selected ads duplicated successfully');
    } catch (err) {
      toast.error('Some ads failed to duplicate');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(
        ids.map((id) => inlineEditMutation.mutateAsync({ id, key: 'status', value: newStatus }))
      );
      setSelectedRows({});
      toast.success(`Selected ads set to '${newStatus}'`);
    } catch (err) {
      toast.error('Failed to update status on some ads');
    }
  };

  const handleBulkBudgetChange = async (newBudget) => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(
        ids.map((id) => inlineEditMutation.mutateAsync({ id, key: 'budget', value: newBudget }))
      );
      setSelectedRows({});
      toast.success(`Selected ads budget set to INR ${newBudget}`);
    } catch (err) {
      toast.error('Failed to update budget on some ads');
    }
  };

  const handleExportCSV = () => {
    const exportData = Object.keys(selectedRows).length > 0 
      ? Object.values(selectedRows) 
      : ads;
    exportToCSV(exportData, columns, 'ads');
  };

  const statusTabs = ['All', 'Active', 'Off', 'Had delivery', 'Paused'];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f0f2f5] border-l border-gray-200">
      {/* Meta Filter Navigation Bar */}
      <AdsManagerNavigation
        activeLevel="ads"
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
        entityType="ad"
        selectedCount={Object.keys(selectedRows).length}
        onCreate={() => setShowCreateModal(true)}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
        onExport={handleExportCSV}
        onBulkStatus={handleBulkStatusChange}
        onBulkBudget={handleBulkBudgetChange}
        importComponent={
          <ImportExport
            entityType="ad"
            columns={columns}
            existingItems={ads}
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['ads'] })}
          />
        }
      />

      {/* Grid Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={ads}
          entityType="ad"
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
          onInlineDelete={(id) => deleteAdMutation.mutate(id)}
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        entityType="ad"
        onSave={(data) => createAdMutation.mutate(data)}
      />
    </div>
  );
};

export default AdsPage;
