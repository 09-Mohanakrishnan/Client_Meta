import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';
import AdPerformance from '../models/AdPerformance.js';
import { enrichWithPerformance, calculateSummaryMetrics } from '../services/performanceService.js';
import { logActivity } from '../services/auditLogger.js';

// Helper to generate unique entity ID
const generateUniqueId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// @desc    Get all campaigns (paginated, sorted, filtered, searched, enriched with performance)
// @route   GET /api/campaigns
// @access  Private
export const getCampaigns = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // 1. Search (filters by name or campaignId)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { campaignId: { $regex: searchRegex } },
      ];
    }

    // 2. Status Filter
    if (req.query.status && req.query.status !== 'All') {
      if (req.query.status === 'Had delivery') {
        query.status = 'Active';
      } else {
        query.status = req.query.status;
      }
    }

    // 3. Advanced Budget Filters
    if (req.query.minBudget !== undefined && req.query.minBudget !== '') {
      query.budget = { ...query.budget, $gte: parseFloat(req.query.minBudget) };
    }
    if (req.query.maxBudget !== undefined && req.query.maxBudget !== '') {
      query.budget = { ...query.budget, $lte: parseFloat(req.query.maxBudget) };
    }

    // Dynamic field filters (passed as JSON query param)
    if (req.query.advancedFilters) {
      try {
        const advFilters = JSON.parse(req.query.advancedFilters);
        Object.entries(advFilters).forEach(([key, val]) => {
          if (val && typeof val === 'object') {
            const { op, value } = val;
            const mongoOp = `$${op}`;
            const parsedVal = isNaN(value) ? value : parseFloat(value);
            query[key] = { ...query[key], [mongoOp]: parsedVal };
          } else if (val !== undefined && val !== '') {
            query[key] = val;
          }
        });
      } catch (err) {
        console.warn('Advanced filters parsing error:', err);
      }
    }

    // Sorting
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'desc' ? -1 : 1;
    const sort = { [sortBy]: sortOrder };

    // Fetch structural campaigns
    const rawCampaigns = await Campaign.find(query).sort(sort).lean();

    // Enrich campaigns dynamically from AdPerformance for the requested date range
    let campaigns = await enrichWithPerformance(
      rawCampaigns,
      'campaign',
      req.query.startDate,
      req.query.endDate
    );

    // Apply delivery criteria filter if "Had delivery" is selected
    if (req.query.status === 'Had delivery') {
      campaigns = campaigns.filter(c => (c.reach > 0 || c.impressions > 0 || c.amountSpent > 0));
    }

    // Apply performance metric filters if provided
    if (req.query.minReach !== undefined && req.query.minReach !== '') {
      const minR = parseInt(req.query.minReach, 10);
      campaigns = campaigns.filter(c => (c.reach || 0) >= minR);
    }
    if (req.query.maxCost !== undefined && req.query.maxCost !== '') {
      const maxC = parseFloat(req.query.maxCost);
      campaigns = campaigns.filter(c => (c.costPerResult || 0) <= maxC);
    }

    // Dynamic sort for performance columns
    const dynamicFields = ['results', 'reach', 'impressions', 'amountSpent', 'costPerResult', 'frequency'];
    if (dynamicFields.includes(sortBy)) {
      campaigns.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return (aVal - bVal) * sortOrder;
      });
    }

    const total = campaigns.length;
    const paginatedCampaigns = campaigns.slice(skip, skip + limit);

    // Summary calculation for overview
    const summary = await calculateSummaryMetrics(
      req.query.startDate,
      req.query.endDate,
      campaigns.map(c => c.campaignId)
    );

    res.json({
      success: true,
      data: {
        campaigns: paginatedCampaigns,
        total,
        page,
        pages: Math.ceil(total / limit),
        summary,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single campaign by ID
// @route   GET /api/campaigns/:id
// @access  Private
export const getCampaignById = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }
    res.json({ success: true, data: campaign });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a campaign
// @route   POST /api/campaigns
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const createCampaign = async (req, res) => {
  try {
    const campaignData = {
      ...req.body,
      campaignId: req.body.campaignId || generateUniqueId('CAM'),
    };

    const campaign = await Campaign.create(campaignData);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_CAMPAIGN',
      entityType: 'campaign',
      entityId: campaign._id.toString(),
      newValue: campaign,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a campaign (including inline patches)
// @route   PATCH /api/campaigns/:id
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const updateCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const oldValue = campaign.toObject();

    // Dynamically assign all keys in body to model (to support dynamic fields)
    Object.entries(req.body).forEach(([key, value]) => {
      // Don't modify internal Mongoose fields
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        campaign.set(key, value);
      }
    });

    await campaign.save();

    // Log individual field changes or bulk update
    const changedFields = Object.keys(req.body).filter(k => k !== '_id');
    for (const field of changedFields) {
      await logActivity({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'UPDATE_CAMPAIGN',
        entityType: 'campaign',
        entityId: campaign._id.toString(),
        field,
        oldValue: oldValue[field],
        newValue: campaign[field],
        req,
      });
    }

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a campaign
// @route   DELETE /api/campaigns/:id
// @access  Private (SUPER_ADMIN, ADMIN)
export const deleteCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await Campaign.findById(id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const oldValue = campaign.toObject();

    await Campaign.findByIdAndDelete(id);

    // Delete associated AdSets and Ads
    await AdSet.deleteMany({ campaignId: campaign.campaignId });
    await Ad.deleteMany({ campaignId: campaign.campaignId });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DELETE_CAMPAIGN',
      entityType: 'campaign',
      entityId: id,
      oldValue,
      req,
    });

    res.json({
      success: true,
      message: 'Campaign and its associated ad sets and ads deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate a campaign
// @route   POST /api/campaigns/:id/duplicate
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const duplicateCampaign = async (req, res) => {
  const { id } = req.params;

  try {
    const originalCampaign = await Campaign.findById(id);
    if (!originalCampaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const campaignObj = originalCampaign.toObject();
    delete campaignObj._id;
    delete campaignObj.createdAt;
    delete campaignObj.updatedAt;
    delete campaignObj.__v;

    // Generate new unique ID and copy name
    campaignObj.campaignId = generateUniqueId('CAM');
    campaignObj.name = `${campaignObj.name} - Copy`;
    campaignObj.status = 'Draft'; // Duplicated entities default to Draft status

    const duplicatedCampaign = await Campaign.create(campaignObj);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DUPLICATE_CAMPAIGN',
      entityType: 'campaign',
      entityId: duplicatedCampaign._id.toString(),
      newValue: duplicatedCampaign,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Campaign duplicated successfully',
      data: duplicatedCampaign,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import bulk campaigns
// @route   POST /api/campaigns/import
// @access  Private (SUPER_ADMIN, ADMIN)
export const importCampaigns = async (req, res) => {
  const campaignsList = req.body;
  
  if (!Array.isArray(campaignsList)) {
    return res.status(400).json({ success: false, message: 'Payload must be an array' });
  }

  try {
    const campaignBulkOps = [];
    const perfBulkOps = [];

    for (const item of campaignsList) {
      const campaignId = item.campaignId || generateUniqueId('CAM');
      
      const campaignData = {
        name: item.name,
        campaignId,
        delivery: item.delivery || 'Active',
        bidStrategy: item.bidStrategy || 'Highest volume',
        budget: item.budget || 0,
        budgetType: item.budgetType || 'Daily',
        ends: item.ends || 'Ongoing',
        status: item.status || (item.delivery === 'Active' ? 'Active' : 'Off'),
      };

      campaignBulkOps.push({
        updateOne: {
          filter: { campaignId },
          update: { $set: campaignData },
          upsert: true,
        },
      });

      // Extract performance metrics
      const hasPerformanceData = item.results !== undefined || item.amountSpent !== undefined || item.reach !== undefined || item.impressions !== undefined;
      
      if (hasPerformanceData) {
        const isDaily = Boolean(item.isDaily || (item.date && !item.reportingStarts));
        const perfData = {
          campaignId,
          isDaily,
          date: item.date || (isDaily ? (item.reportingStarts || new Date().toISOString().split('T')[0]) : ''),
          reportingStarts: item.reportingStarts || '',
          reportingEnds: item.reportingEnds || '',
          results: item.results || 0,
          resultType: item.resultType || 'Link clicks',
          reach: item.reach || 0,
          impressions: item.impressions || 0,
          costPerResult: item.costPerResult || (item.results > 0 ? parseFloat((item.amountSpent / item.results).toFixed(2)) : 0),
          amountSpent: item.amountSpent || 0,
          frequency: item.frequency || (item.reach > 0 ? parseFloat((item.impressions / item.reach).toFixed(2)) : 1.0),
        };

        const perfFilter = isDaily
          ? { campaignId, date: perfData.date, isDaily: true }
          : { campaignId, reportingStarts: perfData.reportingStarts, reportingEnds: perfData.reportingEnds, isDaily: false };

        perfBulkOps.push({
          updateOne: {
            filter: perfFilter,
            update: { $set: perfData },
            upsert: true,
          },
        });
      }
    }

    if (campaignBulkOps.length > 0) {
      await Campaign.bulkWrite(campaignBulkOps);
    }
    if (perfBulkOps.length > 0) {
      await AdPerformance.bulkWrite(perfBulkOps);
    }

    const count = campaignBulkOps.length;

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'IMPORT_CAMPAIGNS',
      entityType: 'campaign',
      entityId: 'bulk',
      newValue: { count },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${count} campaigns and their performance data`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
