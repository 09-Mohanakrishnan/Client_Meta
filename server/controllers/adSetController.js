import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';
import Campaign from '../models/Campaign.js';
import AdPerformance from '../models/AdPerformance.js';
import { enrichWithPerformance } from '../services/performanceService.js';
import { logActivity } from '../services/auditLogger.js';

// Helper to generate unique entity ID
const generateUniqueId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// @desc    Get all adsets (paginated, sorted, filtered, searched, enriched with performance)
// @route   GET /api/adsets
// @access  Private
export const getAdSets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Campaign string ID (for drilldown from Campaigns)
    if (req.query.campaignId) {
      query.campaignId = req.query.campaignId;
    }

    // 1. Search (filters by name or adSetId)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { adSetId: { $regex: searchRegex } },
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

    // Dynamic field filters
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

    // Fetch structural AdSets
    const rawAdSets = await AdSet.find(query).sort(sort).lean();

    // Enrich ad sets dynamically with date-range performance metrics
    let adsets = await enrichWithPerformance(
      rawAdSets,
      'adset',
      req.query.startDate,
      req.query.endDate
    );

    // Apply delivery criteria filter if "Had delivery" is selected
    if (req.query.status === 'Had delivery') {
      adsets = adsets.filter(a => (a.reach > 0 || a.impressions > 0 || a.amountSpent > 0));
    }

    // Apply performance metric filters if provided
    if (req.query.minReach !== undefined && req.query.minReach !== '') {
      const minR = parseInt(req.query.minReach, 10);
      adsets = adsets.filter(a => (a.reach || 0) >= minR);
    }
    if (req.query.maxCost !== undefined && req.query.maxCost !== '') {
      const maxC = parseFloat(req.query.maxCost);
      adsets = adsets.filter(a => (a.costPerResult || 0) <= maxC);
    }

    // Dynamic sort for performance columns
    const dynamicFields = ['results', 'reach', 'impressions', 'amountSpent', 'costPerResult', 'frequency'];
    if (dynamicFields.includes(sortBy)) {
      adsets.sort((a, b) => {
        const aVal = a[sortBy] || 0;
        const bVal = b[sortBy] || 0;
        return (aVal - bVal) * sortOrder;
      });
    }

    const total = adsets.length;
    const paginatedAdSets = adsets.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        adsets: paginatedAdSets,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single adset by ID
// @route   GET /api/adsets/:id
// @access  Private
export const getAdSetById = async (req, res) => {
  const { id } = req.params;

  try {
    const adset = await AdSet.findById(id);
    if (!adset) {
      return res.status(404).json({ success: false, message: 'Ad Set not found' });
    }
    res.json({ success: true, data: adset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an adset
// @route   POST /api/adsets
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const createAdSet = async (req, res) => {
  try {
    const adsetData = {
      ...req.body,
      adSetId: req.body.adSetId || generateUniqueId('SET'),
    };

    const adset = await AdSet.create(adsetData);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_ADSET',
      entityType: 'adset',
      entityId: adset._id.toString(),
      newValue: adset,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Ad Set created successfully',
      data: adset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an adset
// @route   PATCH /api/adsets/:id
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const updateAdSet = async (req, res) => {
  const { id } = req.params;

  try {
    const adset = await AdSet.findById(id);
    if (!adset) {
      return res.status(404).json({ success: false, message: 'Ad Set not found' });
    }

    const oldValue = adset.toObject();

    // Set fields dynamically
    Object.entries(req.body).forEach(([key, value]) => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        adset.set(key, value);
      }
    });

    await adset.save();

    // Log changes
    const changedFields = Object.keys(req.body).filter(k => k !== '_id');
    for (const field of changedFields) {
      await logActivity({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'UPDATE_ADSET',
        entityType: 'adset',
        entityId: adset._id.toString(),
        field,
        oldValue: oldValue[field],
        newValue: adset[field],
        req,
      });
    }

    res.json({
      success: true,
      message: 'Ad Set updated successfully',
      data: adset,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an adset
// @route   DELETE /api/adsets/:id
// @access  Private (SUPER_ADMIN, ADMIN)
export const deleteAdSet = async (req, res) => {
  const { id } = req.params;

  try {
    const adset = await AdSet.findById(id);
    if (!adset) {
      return res.status(404).json({ success: false, message: 'Ad Set not found' });
    }

    const oldValue = adset.toObject();

    await AdSet.findByIdAndDelete(id);

    // Delete associated Ads
    await Ad.deleteMany({ adSetId: adset.adSetId });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DELETE_ADSET',
      entityType: 'adset',
      entityId: id,
      oldValue,
      req,
    });

    res.json({
      success: true,
      message: 'Ad Set and its associated ads deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate an adset
// @route   POST /api/adsets/:id/duplicate
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const duplicateAdSet = async (req, res) => {
  const { id } = req.params;

  try {
    const originalAdSet = await AdSet.findById(id);
    if (!originalAdSet) {
      return res.status(404).json({ success: false, message: 'Ad Set not found' });
    }

    const adsetObj = originalAdSet.toObject();
    delete adsetObj._id;
    delete adsetObj.createdAt;
    delete adsetObj.updatedAt;
    delete adsetObj.__v;

    adsetObj.adSetId = generateUniqueId('SET');
    adsetObj.name = `${adsetObj.name} - Copy`;
    adsetObj.status = 'Draft';

    const duplicatedAdSet = await AdSet.create(adsetObj);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DUPLICATE_ADSET',
      entityType: 'adset',
      entityId: duplicatedAdSet._id.toString(),
      newValue: duplicatedAdSet,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Ad Set duplicated successfully',
      data: duplicatedAdSet,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import bulk adsets
// @route   POST /api/adsets/import
// @access  Private (SUPER_ADMIN, ADMIN)
export const importAdSets = async (req, res) => {
  const adsetsList = req.body;
  
  if (!Array.isArray(adsetsList)) {
    return res.status(400).json({ success: false, message: 'Payload must be an array' });
  }

  try {
    // 1. Resolve campaignId by campaignName or fallback campaign fields
    const campaignNames = [...new Set(adsetsList.map(item => item.campaignName || item.campaign).filter(Boolean))];
    const campaigns = await Campaign.find({ name: { $in: campaignNames } });
    const campaignMap = new Map(campaigns.map(c => [c.name.toLowerCase(), c.campaignId]));
    const campaignIdMap = new Map(campaigns.map(c => [c.campaignId, c._id]));
    const campaignNameIdMap = new Map(campaigns.map(c => [c.name.toLowerCase(), c._id]));

    const bulkOps = [];
    for (const item of adsetsList) {
      let campaignId = item.campaignId;
      let campaignObjectId = undefined;
      const cName = item.campaignName || item.campaign;

      // Try to resolve campaignId by Campaign Name from DB
      if (!campaignId && cName) {
        campaignId = campaignMap.get(cName.toLowerCase());
        campaignObjectId = campaignNameIdMap.get(cName.toLowerCase());
      }

      // If campaignId is provided, resolve the Campaign object to get its _id
      if (campaignId) {
        const exists = await Campaign.findOne({ campaignId });
        if (exists) {
          campaignObjectId = exists._id;
        } else if (cName) {
          const resolvedId = campaignMap.get(cName.toLowerCase());
          if (resolvedId) {
            campaignId = resolvedId;
            campaignObjectId = campaignNameIdMap.get(cName.toLowerCase());
          }
        }
      }

      // If campaignId still not resolved, create the Campaign dynamically to preserve relationship
      if (!campaignId && cName) {
        campaignId = generateUniqueId('CAM');
        const newCampaign = await Campaign.create({
          name: cName,
          campaignId,
          status: 'Draft',
        });
        campaignObjectId = newCampaign._id;
        campaignMap.set(cName.toLowerCase(), campaignId);
        campaignIdMap.set(campaignId, newCampaign._id);
        campaignNameIdMap.set(cName.toLowerCase(), newCampaign._id);
      }


      const adSetId = item.adSetId || generateUniqueId('SET');
      const updateData = {
        name: item.name,
        adSetId,
        campaignId,
        campaignObjectId,
        delivery: item.delivery || 'Active',
        bidStrategy: item.bidStrategy || 'Highest volume',
        budget: item.budget || 0,
        budgetType: item.budgetType || 'Daily',
        startDate: item.startDate || '2026-07-15',
        endDate: item.endDate || 'Ongoing',
        status: item.status || (item.delivery === 'Active' ? 'Active' : 'Off'),
      };

      bulkOps.push({
        updateOne: {
          filter: { adSetId },
          update: { $set: updateData },
          upsert: true,
        },
      });

      // Extract performance metrics
      const hasPerformanceData = item.results !== undefined || item.amountSpent !== undefined || item.reach !== undefined || item.impressions !== undefined;
      if (hasPerformanceData) {
        const isDaily = Boolean(item.isDaily || (item.date && !item.reportingStarts));
        const perfData = {
          adSetId,
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
          ? { adSetId, date: perfData.date, isDaily: true }
          : { adSetId, reportingStarts: perfData.reportingStarts, reportingEnds: perfData.reportingEnds, isDaily: false };

        perfBulkOps.push({
          updateOne: {
            filter: perfFilter,
            update: { $set: perfData },
            upsert: true,
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await AdSet.bulkWrite(bulkOps);
    }
    if (perfBulkOps.length > 0) {
      await AdPerformance.bulkWrite(perfBulkOps);
    }
    const count = bulkOps.length;

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'IMPORT_ADSETS',
      entityType: 'adset',
      entityId: 'bulk',
      newValue: { count },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${count} ad sets and their performance data`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
