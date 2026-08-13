import Ad from '../models/Ad.js';
import AdSet from '../models/AdSet.js';
import Campaign from '../models/Campaign.js';
import { logActivity } from '../services/auditLogger.js';

// Helper to generate unique entity ID
const generateUniqueId = (prefix) => {
  return `${prefix}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// @desc    Get all ads (paginated, sorted, filtered, searched)
// @route   GET /api/ads
// @access  Private
export const getAds = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by campaignId or adSetId
    if (req.query.campaignId) {
      query.campaignId = req.query.campaignId;
    }
    if (req.query.adSetId) {
      query.adSetId = req.query.adSetId;
    }

    // 1. Search (filters by name or adId)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: { $regex: searchRegex } },
        { adId: { $regex: searchRegex } },
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

    const ads = await Ad.find(query).sort(sort).skip(skip).limit(limit);
    const total = await Ad.countDocuments(query);

    res.json({
      success: true,
      data: {
        ads,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single ad by ID
// @route   GET /api/ads/:id
// @access  Private
export const getAdById = async (req, res) => {
  const { id } = req.params;

  try {
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }
    res.json({ success: true, data: ad });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create an ad
// @route   POST /api/ads
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const createAd = async (req, res) => {
  try {
    const adData = {
      ...req.body,
      adId: req.body.adId || generateUniqueId('AD'),
    };

    const ad = await Ad.create(adData);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_AD',
      entityType: 'ad',
      entityId: ad._id.toString(),
      newValue: ad,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update an ad
// @route   PATCH /api/ads/:id
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const updateAd = async (req, res) => {
  const { id } = req.params;

  try {
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const oldValue = ad.toObject();

    // Set fields dynamically
    Object.entries(req.body).forEach(([key, value]) => {
      if (key !== '_id' && key !== '__v' && key !== 'createdAt' && key !== 'updatedAt') {
        ad.set(key, value);
      }
    });

    await ad.save();

    // Log changes
    const changedFields = Object.keys(req.body).filter(k => k !== '_id');
    for (const field of changedFields) {
      await logActivity({
        userId: req.user._id,
        userEmail: req.user.email,
        action: 'UPDATE_AD',
        entityType: 'ad',
        entityId: ad._id.toString(),
        field,
        oldValue: oldValue[field],
        newValue: ad[field],
        req,
      });
    }

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: ad,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete an ad
// @route   DELETE /api/ads/:id
// @access  Private (SUPER_ADMIN, ADMIN)
export const deleteAd = async (req, res) => {
  const { id } = req.params;

  try {
    const ad = await Ad.findById(id);
    if (!ad) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const oldValue = ad.toObject();

    await Ad.findByIdAndDelete(id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DELETE_AD',
      entityType: 'ad',
      entityId: id,
      oldValue,
      req,
    });

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Duplicate an ad
// @route   POST /api/ads/:id/duplicate
// @access  Private (SUPER_ADMIN, ADMIN, EDITOR)
export const duplicateAd = async (req, res) => {
  const { id } = req.params;

  try {
    const originalAd = await Ad.findById(id);
    if (!originalAd) {
      return res.status(404).json({ success: false, message: 'Ad not found' });
    }

    const adObj = originalAd.toObject();
    delete adObj._id;
    delete adObj.createdAt;
    delete adObj.updatedAt;
    delete adObj.__v;

    adObj.adId = generateUniqueId('AD');
    adObj.name = `${adObj.name} - Copy`;
    adObj.status = 'Draft';

    const duplicatedAd = await Ad.create(adObj);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DUPLICATE_AD',
      entityType: 'ad',
      entityId: duplicatedAd._id.toString(),
      newValue: duplicatedAd,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Ad duplicated successfully',
      data: duplicatedAd,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Import bulk ads
// @route   POST /api/ads/import
// @access  Private (SUPER_ADMIN, ADMIN)
export const importAds = async (req, res) => {
  const adsList = req.body;
  
  if (!Array.isArray(adsList)) {
    return res.status(400).json({ success: false, message: 'Payload must be an array' });
  }

  try {
    // 1. Resolve campaignId and adSetId by names
    const campaignNames = [...new Set(adsList.map(item => item.campaignName || item.campaign).filter(Boolean))];
    const adSetNames = [...new Set(adsList.map(item => item.adSetName || item.adSet).filter(Boolean))];

    const campaigns = await Campaign.find({ name: { $in: campaignNames } });
    const campaignMap = new Map(campaigns.map(c => [c.name.toLowerCase(), c.campaignId]));
    const campaignNameIdMap = new Map(campaigns.map(c => [c.name.toLowerCase(), c._id]));

    const adSets = await AdSet.find({ name: { $in: adSetNames } });
    const adSetMap = new Map(adSets.map(s => [s.name.toLowerCase(), s.adSetId]));
    const adSetNameIdMap = new Map(adSets.map(s => [s.name.toLowerCase(), s._id]));

    const bulkOps = [];
    for (const item of adsList) {
      let campaignId = item.campaignId;
      let campaignObjectId = undefined;
      let adSetId = item.adSetId;
      let adSetObjectId = undefined;
      const cName = item.campaignName || item.campaign;
      const sName = item.adSetName || item.adSet;

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

      // Try to resolve adSetId by Ad Set Name from DB
      if (!adSetId && sName) {
        adSetId = adSetMap.get(sName.toLowerCase());
        adSetObjectId = adSetNameIdMap.get(sName.toLowerCase());
      }

      // If adSetId is provided, resolve the AdSet object to get its _id
      if (adSetId) {
        const exists = await AdSet.findOne({ adSetId });
        if (exists) {
          adSetObjectId = exists._id;
        } else if (sName) {
          const resolvedId = adSetMap.get(sName.toLowerCase());
          if (resolvedId) {
            adSetId = resolvedId;
            adSetObjectId = adSetNameIdMap.get(sName.toLowerCase());
          }
        }
      }

      // Dynamic Auto-creation of Campaign to preserve relationship
      if (!campaignId && cName) {
        campaignId = generateUniqueId('CAM');
        const newCampaign = await Campaign.create({
          name: cName,
          campaignId,
          status: 'Draft',
        });
        campaignObjectId = newCampaign._id;
        campaignMap.set(cName.toLowerCase(), campaignId);
        campaignNameIdMap.set(cName.toLowerCase(), newCampaign._id);
      }

      // Dynamic Auto-creation of Ad Set to preserve relationship
      if (!adSetId && sName) {
        adSetId = generateUniqueId('SET');
        const newAdSet = await AdSet.create({
          name: sName,
          adSetId,
          campaignId: campaignId || generateUniqueId('CAM'),
          status: 'Draft',
        });
        adSetObjectId = newAdSet._id;
        adSetMap.set(sName.toLowerCase(), adSetId);
        adSetNameIdMap.set(sName.toLowerCase(), newAdSet._id);
      }


      const adId = item.adId || generateUniqueId('AD');
      const updateData = {
        ...item,
        adId,
        adSetId,
        adSetObjectId,
        campaignId,
        campaignObjectId,
        status: item.status || 'Draft',
      };

      bulkOps.push({
        updateOne: {
          filter: { adId },
          update: { $set: updateData },
          upsert: true,
        },
      });
    }

    const result = await Ad.bulkWrite(bulkOps);
    const count = bulkOps.length;

    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'IMPORT_ADS',
      entityType: 'ad',
      entityId: 'bulk',
      newValue: { count },
      req,
    });

    res.status(201).json({
      success: true,
      message: `Successfully imported ${count} ads`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
