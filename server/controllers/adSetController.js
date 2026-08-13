import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';
import { logActivity } from '../services/auditLogger.js';

// Helper to generate unique entity ID
const generateUniqueId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// @desc    Get all adsets (paginated, sorted, filtered, searched)
// @route   GET /api/adsets
// @access  Private
export const getAdSets = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by Campaign string ID
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
        query.reach = { $gt: 0 };
      } else {
        query.status = req.query.status;
      }
    }

    // 3. Date Range Filter (CreatedAt) — uses explicit UTC to avoid server timezone issues
    if (req.query.startDate && req.query.endDate) {
      const [sy, sm, sd] = req.query.startDate.split('-').map(Number);
      const [ey, em, ed] = req.query.endDate.split('-').map(Number);

      const startUTC = new Date(Date.UTC(sy, sm - 1, sd, 0, 0, 0, 0));
      const endUTC = new Date(Date.UTC(ey, em - 1, ed, 23, 59, 59, 999));

      query.createdAt = {
        $gte: startUTC,
        $lte: endUTC,
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

    // 5. Dynamic filters
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

    const adsets = await AdSet.find(query).sort(sort).skip(skip).limit(limit);
    const total = await AdSet.countDocuments(query);

    res.json({
      success: true,
      data: {
        adsets,
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
    const prepared = adsetsList.map((item) => ({
      ...item,
      adSetId: item.adSetId || generateUniqueId('SET'),
      status: item.status || 'Draft',
    }));

    const imported = await AdSet.insertMany(prepared);

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'IMPORT_ADSETS',
      entityType: 'adset',
      entityId: 'bulk',
      newValue: { count: imported.length },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${imported.length} ad sets`,
      data: imported,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
