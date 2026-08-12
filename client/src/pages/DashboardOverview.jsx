import React from 'react';
import { useQuery } from '@tanstack/react-query';
import API from '../services/api';
import { useDateRange } from '../context/DateRangeContext';
import {
  FolderKanban,
  Layers,
  Tv,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { renderFormattedValue } from '../components/InlineEditableCell';

const DashboardOverview = () => {
  const { dateRange } = useDateRange();

  // Fetch summary analytics
  const { data: analyticsRes, isLoading, error } = useQuery({
    queryKey: ['dashboard-summary', dateRange.startDate, dateRange.endDate],
    queryFn: async () => {
      const res = await API.get('/analytics/summary', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        },
      });
      return res.data?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <RefreshCw size={24} className="text-blue-600 animate-spin" />
        <span className="text-xs font-semibold text-gray-500 ml-2 uppercase tracking-wider">Loading Analytics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-12 text-xs text-red-500">
        Error loading analytics data: {error.message}
      </div>
    );
  }

  const { counts, aggregates, dailyTrend } = analyticsRes || {
    counts: { totalCampaigns: 0, activeCampaigns: 0, totalAdSets: 0, totalAds: 0 },
    aggregates: { totalSpend: 0, totalReach: 0, totalImpressions: 0, totalResults: 0 },
    dailyTrend: [],
  };

  const cards = [
    { title: 'Total Campaigns', value: counts.totalCampaigns, sub: `${counts.activeCampaigns} active`, icon: FolderKanban, color: 'border-blue-500' },
    { title: 'Total Ad Sets', value: counts.totalAdSets, sub: 'Belonging to campaigns', icon: Layers, color: 'border-indigo-500' },
    { title: 'Total Ads', value: counts.totalAds, sub: 'Live creative listings', icon: Tv, color: 'border-cyan-500' },
    { title: 'Total Spend', value: renderFormattedValue(aggregates.totalSpend, 'currency'), sub: 'Accumulated spending', icon: DollarSign, color: 'border-green-500' },
    { title: 'Total Reach', value: renderFormattedValue(aggregates.totalReach, 'number'), sub: 'Unique users reached', icon: Users, color: 'border-purple-500' },
    { title: 'Total Impressions', value: renderFormattedValue(aggregates.totalImpressions, 'number'), sub: 'Total views accrued', icon: Eye, color: 'border-amber-500' },
  ];

  // Prepare simple SVG chart parameters
  const chartHeight = 120;
  const chartWidth = 500;
  const padding = 20;

  // Find max values for trend scaling
  const maxSpend = Math.max(...dailyTrend.map((t) => t.spend), 1);
  const maxReach = Math.max(...dailyTrend.map((t) => t.reach), 1);

  // Generate SVG coordinate points
  const pointsSpend = dailyTrend
    .map((t, idx) => {
      const x = padding + (idx * (chartWidth - 2 * padding)) / (dailyTrend.length - 1);
      const y = chartHeight - padding - (t.spend / maxSpend) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  const pointsReach = dailyTrend
    .map((t, idx) => {
      const x = padding + (idx * (chartWidth - 2 * padding)) / (dailyTrend.length - 1);
      const y = chartHeight - padding - (t.reach / maxReach) * (chartHeight - 2 * padding);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-xs text-gray-500 mt-0.5">Real-time aggregate performance insights for your active campaigns.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`bg-white rounded-lg border-l-4 border border-gray-200 p-4 flex justify-between shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md ${card.color}`}
            >
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{card.title}</span>
                <h3 className="text-lg font-extrabold text-gray-800">{card.value}</h3>
                <span className="text-[10px] font-medium text-gray-500">{card.sub}</span>
              </div>
              <div className="rounded-full bg-gray-50/50 p-2.5 h-10 w-10 flex items-center justify-center text-gray-400 shrink-0">
                <Icon size={18} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Spend Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-green-500" />
              <span>Spend Trend (Last 7 Days)</span>
            </h3>
            <p className="text-[10px] text-gray-500">Daily spending trends mapping relative consumption.</p>
          </div>
          <div className="relative">
            {dailyTrend.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32">
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth={1} />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth={1} />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth={1} />

                {/* Line Path */}
                <polyline fill="none" stroke="#22c55e" strokeWidth={2.5} points={pointsSpend} />

                {/* Labels */}
                {dailyTrend.map((t, idx) => {
                  const x = padding + (idx * (chartWidth - 2 * padding)) / (dailyTrend.length - 1);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={chartHeight - 4}
                      fill="#94a3b8"
                      fontSize={9}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {t.date}
                    </text>
                  );
                })}
              </svg>
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-gray-400">No trend data available</div>
            )}
          </div>
        </div>

        {/* Reach Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-blue-500" />
              <span>Reach Trend (Last 7 Days)</span>
            </h3>
            <p className="text-[10px] text-gray-500">Daily unique users reach metrics mapping exposure.</p>
          </div>
          <div className="relative">
            {dailyTrend.length > 0 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32">
                {/* Grid Lines */}
                <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="#f1f5f9" strokeWidth={1} />
                <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="#f1f5f9" strokeWidth={1} />
                <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e2e8f0" strokeWidth={1} />

                {/* Line Path */}
                <polyline fill="none" stroke="#3b82f6" strokeWidth={2.5} points={pointsReach} />

                {/* Labels */}
                {dailyTrend.map((t, idx) => {
                  const x = padding + (idx * (chartWidth - 2 * padding)) / (dailyTrend.length - 1);
                  return (
                    <text
                      key={idx}
                      x={x}
                      y={chartHeight - 4}
                      fill="#94a3b8"
                      fontSize={9}
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      {t.date}
                    </text>
                  );
                })}
              </svg>
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-gray-400">No trend data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;
