import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';
import AdPerformance from '../models/AdPerformance.js';
import { calculateSummaryMetrics } from '../services/performanceService.js';

// @desc    Get dashboard summary metrics and trend data
// @route   GET /api/analytics/summary
// @access  Private
export const getSummaryMetrics = async (req, res) => {
  try {
    // 1. Structural entity counts
    const totalCampaigns = await Campaign.countDocuments({});
    const activeCampaigns = await Campaign.countDocuments({ status: 'Active' });
    const totalAdSets = await AdSet.countDocuments({});
    const totalAds = await Ad.countDocuments({});

    // 2. Sums calculated from AdPerformance dynamically for the requested date range
    const stats = await calculateSummaryMetrics(req.query.startDate, req.query.endDate);

    // 3. Daily trends for analytics charts (last 7 days or date range)
    const dailyRecords = await AdPerformance.find({
      isDaily: true,
      ...(req.query.startDate && req.query.endDate ? { date: { $gte: req.query.startDate, $lte: req.query.endDate } } : {}),
    }).sort({ date: 1 }).lean();

    const dailyTrend = [];
    if (dailyRecords.length > 0) {
      const dateMap = new Map();
      dailyRecords.forEach(r => {
        if (!dateMap.has(r.date)) {
          dateMap.set(r.date, { date: r.date, spend: 0, reach: 0, impressions: 0 });
        }
        const curr = dateMap.get(r.date);
        curr.spend += r.amountSpent || 0;
        curr.reach += r.reach || 0;
        curr.impressions += r.impressions || 0;
      });
      dateMap.forEach(val => dailyTrend.push(val));
    } else {
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const factor = 1 / 7;
        dailyTrend.push({
          date: dateString,
          spend: Math.round(stats.totalSpend * factor),
          reach: Math.round(stats.totalReach * factor),
          impressions: Math.round(stats.totalImpressions * factor),
        });
      }
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
