import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';

// @desc    Get dashboard summary metrics and trend data
// @route   GET /api/analytics/summary
// @access  Private
export const getSummaryMetrics = async (req, res) => {
  try {
    // 1. Counts
    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: 'Active' });
    const totalAdSets = await AdSet.countDocuments();
    const totalAds = await Ad.countDocuments();

    // 2. Sums from campaigns using MongoDB Aggregation
    const campaignStats = await Campaign.aggregate([
      {
        $group: {
          _id: null,
          totalSpend: { $sum: '$amountSpent' },
          totalReach: { $sum: '$reach' },
          totalImpressions: { $sum: '$impressions' },
          totalResults: { $sum: '$results' },
        },
      },
    ]);

    const stats = campaignStats[0] || {
      totalSpend: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalResults: 0,
    };

    // 3. Fictional daily trends for analytics charts (last 7 days)
    // We base it on actual data to make it look realistic, scaling it down per day
    const dailyTrend = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      // Seed some fictional daily variations
      const factor = 0.1 + Math.random() * 0.05; // ~10-15% of total per day
      dailyTrend.push({
        date: dateString,
        spend: Math.round(stats.totalSpend * factor),
        reach: Math.round(stats.totalReach * factor),
        impressions: Math.round(stats.totalImpressions * factor),
      });
    }

    res.json({
      success: true,
      data: {
        counts: {
          totalCampaigns,
          activeCampaigns,
          totalAdSets,
          totalAds,
        },
        aggregates: {
          totalSpend: stats.totalSpend,
          totalReach: stats.totalReach,
          totalImpressions: stats.totalImpressions,
          totalResults: stats.totalResults,
        },
        dailyTrend,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
