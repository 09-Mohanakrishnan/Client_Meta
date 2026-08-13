import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';
import { logActivity } from '../services/auditLogger.js';

// Helper to generate unique entity ID
const generateUniqueId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// @desc    Get all campaigns (paginated, sorted, filtered, searched)
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
        // Delivery criteria: Active status and reach/impressions > 0
        query.status = 'Active';
        query.reach = { $gt: 0 };
      } else {
        query.status = req.query.status;
      }
    }

    // 3. Date Range Filter (CreatedAt)
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999);
      end.setDate(end.getDate() + 1); // Buffer +1 day for timezone safety

      query.createdAt = {
        $gte: start,
        $lte: end,
      };
    }

    // 4. Advanced Filters
    if (req.query.minBudget !== undefined && req.query.minBudget !== '') {
      query.budget = { ...query.budget, $gte: parseFloat(req.query.minBudget) };
    }
    if (req.query.maxBudget !== undefined && req.query.maxBudget !== '') {
      query.budget = { ...query.budget, $lte: parseFloat(req.query.maxBudget) };
    }
    if (req.query.minReach !== undefined && req.query.minReach !== '') {
      query.reach = { ...query.reach, $gte: parseInt(req.query.minReach, 10) };
    }
    if (req.query.maxCost !== undefined && req.query.maxCost !== '') {
      query.costPerResult = { ...query.costPerResult, $lte: parseFloat(req.query.maxCost) };
    }

    // 5. Dynamic field filters (passed as JSON query param)
    if (req.query.advancedFilters) {
      try {
        const advFilters = JSON.parse(req.query.advancedFilters);
        Object.entries(advFilters).forEach(([key, val]) => {
          if (val && typeof val === 'object') {
            // e.g. { op: 'gt', value: 100 }
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

    const campaigns = await Campaign.find(query).sort(sort).skip(skip).limit(limit);
    const total = await Campaign.countDocuments(query);

    res.json({
      success: true,
      data: {
        campaigns,
        total,
        page,
        pages: Math.ceil(total / limit),
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
    const prepared = campaignsList.map((item) => ({
      ...item,
      campaignId: item.campaignId || generateUniqueId('CAM'),
      status: item.status || 'Draft',
    }));

    const imported = await Campaign.insertMany(prepared);

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'IMPORT_CAMPAIGNS',
      entityType: 'campaign',
      entityId: 'bulk',
      newValue: { count: imported.length },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${imported.length} campaigns`,
      data: imported,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
