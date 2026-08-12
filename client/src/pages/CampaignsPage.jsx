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

const CampaignsPage = () => {
  const queryClient = useQueryClient();
  const { dateRange } = useDateRange();
  const [searchParams, setSearchParams] = useSearchParams();

  // URL States (keeps filters persistent on back navigation!)
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
    queryKey: ['columns', 'campaign'],
    queryFn: async () => {
      const res = await API.get('/columns/campaign');
      return res.data?.data || [];
    },
  });

  // 2. Fetch Campaigns Data
  const { data: campaignRes, isLoading, error } = useQuery({
    queryKey: [
      'campaigns',
      page,
      search,
      statusFilter,
      sortBy,
      sortOrder,
      dateRange.startDate,
      dateRange.endDate,
    ],
    queryFn: async () => {
      const res = await API.get('/campaigns', {
        params: {
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

  const campaigns = campaignRes?.campaigns || [];
  const total = campaignRes?.total || 0;
  const pages = campaignRes?.pages || 1;

  // 3. Mutations
  const createCampaignMutation = useMutation({
    mutationFn: async (newCampaign) => {
      const res = await API.post('/campaigns', newCampaign);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
      setShowCreateModal(false);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to create campaign');
    },
  });

  const inlineEditMutation = useMutation({
    mutationFn: async ({ id, key, value }) => {
      const res = await API.patch(`/campaigns/${id}`, { [key]: value });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign updated');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to update field');
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.delete(`/campaigns/${id}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setSelectedRows({});
      toast.success('Campaign deleted successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to delete campaign');
    },
  });

  const duplicateCampaignMutation = useMutation({
    mutationFn: async (id) => {
      const res = await API.post(`/campaigns/${id}/duplicate`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign duplicated successfully');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to duplicate campaign');
    },
  });

  // 4. Bulk Handlers
  const handleBulkDelete = async () => {
    const ids = Object.keys(selectedRows);
    if (window.confirm(`Are you sure you want to delete the ${ids.length} selected campaigns? All associated ad sets and ads will also be deleted.`)) {
      for (const id of ids) {
        await deleteCampaignMutation.mutateAsync(id);
      }
      setSelectedRows({});
      toast.success('Selected campaigns deleted successfully');
    }
  };

  const handleBulkDuplicate = async () => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(ids.map((id) => duplicateCampaignMutation.mutateAsync(id)));
      setSelectedRows({});
      toast.success('Selected campaigns duplicated successfully');
    } catch (err) {
      toast.error('Some campaigns failed to duplicate');
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(
        ids.map((id) => inlineEditMutation.mutateAsync({ id, key: 'status', value: newStatus }))
      );
      setSelectedRows({});
      toast.success(`Selected campaigns set to '${newStatus}'`);
    } catch (err) {
      toast.error('Failed to update status on some campaigns');
    }
  };

  const handleBulkBudgetChange = async (newBudget) => {
    const ids = Object.keys(selectedRows);
    try {
      await Promise.all(
        ids.map((id) => inlineEditMutation.mutateAsync({ id, key: 'budget', value: newBudget }))
      );
      setSelectedRows({});
      toast.success(`Selected campaigns budget set to INR ${newBudget}`);
    } catch (err) {
      toast.error('Failed to update budget on some campaigns');
    }
  };

  const handleExportCSV = () => {
    const exportData = Object.keys(selectedRows).length > 0 
      ? Object.values(selectedRows) 
      : campaigns;
    exportToCSV(exportData, columns, 'campaigns');
  };

  // Tab presets
  const statusTabs = ['All', 'Active', 'Off', 'Had delivery', 'Paused'];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#f0f2f5] border-l border-gray-200">
      {/* Meta Filter Navigation Bar */}
      <AdsManagerNavigation
        activeLevel="campaigns"
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
        entityType="campaign"
        selectedCount={Object.keys(selectedRows).length}
        onCreate={() => setShowCreateModal(true)}
        onDuplicate={handleBulkDuplicate}
        onDelete={handleBulkDelete}
        onExport={handleExportCSV}
        onBulkStatus={handleBulkStatusChange}
        onBulkBudget={handleBulkBudgetChange}
        importComponent={
          <ImportExport
            entityType="campaign"
            columns={columns}
            existingItems={campaigns}
            onImportSuccess={() => queryClient.invalidateQueries({ queryKey: ['campaigns'] })}
          />
        }
      />

      {/* Grid Canvas */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        <DataTable
          columns={columns}
          data={campaigns}
          entityType="campaign"
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
          selectedRows={selectedRows}
          onSelectedRowsChange={setSelectedRows}
          isLoading={isLoading}
          error={error}
        />
      </div>

      <CreateEntityModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        entityType="campaign"
        onSave={(data) => createCampaignMutation.mutate(data)}
      />
    </div>
  );
};

export default CampaignsPage;
