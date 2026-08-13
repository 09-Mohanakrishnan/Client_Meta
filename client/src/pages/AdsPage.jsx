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
      const res = await API.patch(`/ads/${id}`, { [key]: value });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ads'] });
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
