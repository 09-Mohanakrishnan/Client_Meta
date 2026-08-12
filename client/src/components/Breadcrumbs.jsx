import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import API from '../services/api';
import { ChevronRight } from 'lucide-react';

const Breadcrumbs = ({ currentLevel }) => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get('campaignId');
  const adSetId = searchParams.get('adSetId');

  // Fetch campaign name if campaignId exists
  const { data: campaignData } = useQuery({
    queryKey: ['campaign-breadcrumb', campaignId],
    queryFn: async () => {
      if (!campaignId) return null;
      // Get by campaignId (fetch all and find or create a specific endpoint)
      // Since we filter by campaignId string, let's hit /api/campaigns with search/filter
      const res = await API.get(`/campaigns?search=${campaignId}`);
      const campaigns = res.data?.data?.campaigns || [];
      return campaigns.find((c) => c.campaignId === campaignId) || null;
    },
    enabled: !!campaignId,
  });

  // Fetch adset name if adSetId exists
  const { data: adsetData } = useQuery({
    queryKey: ['adset-breadcrumb', adSetId],
    queryFn: async () => {
      if (!adSetId) return null;
      const res = await API.get(`/adsets?search=${adSetId}`);
      const adsets = res.data?.data?.adsets || [];
      return adsets.find((s) => s.adSetId === adSetId) || null;
    },
    enabled: !!adSetId,
  });

  const campaignName = campaignData?.name || campaignId;
  const adsetName = adsetData?.name || adSetId;

  return (
    <nav className="flex items-center gap-2 py-3 text-xs text-gray-500 font-medium bg-white px-6 border-b border-gray-100">
      {/* Root - Campaigns */}
      <Link
        to="/campaigns"
        className="hover:text-blue-600 transition-colors font-semibold uppercase tracking-wider"
      >
        Campaigns
      </Link>

      {/* Campaign Drill Down */}
      {campaignId && (
        <>
          <ChevronRight size={14} className="text-gray-300" />
          <Link
            to={`/adsets?campaignId=${campaignId}`}
            className={`hover:text-blue-600 transition-colors uppercase tracking-wider max-w-[200px] truncate ${
              currentLevel === 'adset' ? 'text-gray-900 font-bold' : ''
            }`}
          >
            {campaignName}
          </Link>
        </>
      )}

      {/* Ad Set Drill Down */}
      {adSetId && (
        <>
          <ChevronRight size={14} className="text-gray-300" />
          <Link
            to={`/ads?campaignId=${campaignId}&adSetId=${adSetId}`}
            className={`hover:text-blue-600 transition-colors uppercase tracking-wider max-w-[200px] truncate ${
              currentLevel === 'ad' ? 'text-gray-900 font-bold' : ''
            }`}
          >
            {adsetName}
          </Link>
        </>
      )}
      
      {/* Current Level Tab Indicator */}
      <ChevronRight size={14} className="text-gray-300" />
      <span className="text-gray-400 uppercase tracking-wider font-semibold">
        {currentLevel === 'campaign' ? 'Details' : currentLevel === 'adset' ? 'Ad Sets' : 'Ads'}
      </span>
    </nav>
  );
};

export default Breadcrumbs;
