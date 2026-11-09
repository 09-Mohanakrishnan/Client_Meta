import AdPerformance from '../models/AdPerformance.js';
import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';

// Helper to generate a date string YYYY-MM-DD from today minus N days
const getDateDaysAgo = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Generates 90 daily records for an entity covering the past 90 days (up to today).
 * The sum of the 90 daily records matches the entity's totals with realistic daily variance.
 */
export const generateDailyRecordsForEntity = async ({
  campaignId = '',
  adSetId = '',
  adId = '',
  totalResults = 0,
  totalReach = 0,
  totalImpressions = 0,
  totalSpent = 0,
  resultType = 'Link clicks',
}) => {
  const days = 90;
  const records = [];

  // Generate variation weights for 90 days so daily performance feels authentic
  const weights = [];
  let weightSum = 0;
  for (let i = 0; i < days; i++) {
    // Natural curve with slight cyclical fluctuation
    const w = 1.0 + 0.2 * Math.sin(i * 0.7) + 0.1 * Math.cos(i * 1.3);
    weights.push(w);
    weightSum += w;
  }

  const resultsTarget = Math.round(Number(totalResults)) || 0;
  const reachTarget = Math.round(Number(totalReach)) || 0;
  const impTarget = Math.round(Number(totalImpressions)) || 0;
  const spentTarget = parseFloat(Number(totalSpent).toFixed(2)) || 0;

  let assignedResults = 0;
  let assignedReach = 0;
  let assignedImp = 0;
  let assignedSpent = 0;

  for (let i = 0; i < days; i++) {
    const dateStr = getDateDaysAgo(days - 1 - i); // oldest (89 days ago) to newest (today)
    const factor = weights[i] / weightSum;

    let dayRes, dayReach, dayImp, daySpent;

    if (i === days - 1) {
      // Last day takes remainder to guarantee exact sum
      dayRes = Math.max(0, resultsTarget - assignedResults);
      dayReach = Math.max(0, reachTarget - assignedReach);
      dayImp = Math.max(0, impTarget - assignedImp);
      daySpent = parseFloat(Math.max(0, spentTarget - assignedSpent).toFixed(2));
    } else {
      dayRes = Math.round(resultsTarget * factor);
      dayReach = Math.round(reachTarget * factor);
      dayImp = Math.round(impTarget * factor);
      daySpent = parseFloat((spentTarget * factor).toFixed(2));

      assignedResults += dayRes;
      assignedReach += dayReach;
      assignedImp += dayImp;
      assignedSpent += daySpent;
    }

    const costPerResult = dayRes > 0 ? parseFloat((daySpent / dayRes).toFixed(2)) : 0;
    const frequency = dayReach > 0 ? parseFloat((dayImp / dayReach).toFixed(2)) : 1.0;

    records.push({
      campaignId: campaignId || '',
      adSetId: adSetId || '',
      adId: adId || '',
      date: dateStr,
      reportingStarts: dateStr,
      reportingEnds: dateStr,
      isDaily: true,
      results: dayRes,
      resultType,
      reach: dayReach,
      impressions: dayImp,
      amountSpent: daySpent,
      costPerResult,
      frequency,
    });
  }

  // Clean up any existing daily records for this exact entity to avoid duplicate bloat
  const delQuery = { isDaily: true };
  if (adId) {
    delQuery.adId = adId;
  } else if (adSetId) {
    delQuery.adSetId = adSetId;
    delQuery.adId = { $in: ['', null] };
  } else if (campaignId) {
    delQuery.campaignId = campaignId;
    delQuery.adSetId = { $in: ['', null] };
    delQuery.adId = { $in: ['', null] };
  }

  await AdPerformance.deleteMany(delQuery);
  await AdPerformance.insertMany(records);
};

/**
 * Ensures that 90 daily records exist in AdPerformance for each entity in the list.
 * Self-healing: if an entity has 0 daily records, they are immediately generated.
 */
export const ensureDailyPerformanceForEntities = async (entities, entityType) => {
  if (!entities || entities.length === 0) return;

  const idKey = entityType === 'campaign' ? 'campaignId' : entityType === 'adset' ? 'adSetId' : 'adId';
  const entityIds = entities.map(e => (typeof e.toObject === 'function' ? e.toObject() : e)[idKey]).filter(Boolean);
  if (entityIds.length === 0) return;

  const baseQuery = { [idKey]: { $in: entityIds }, isDaily: true };
  if (entityType === 'campaign') {
    baseQuery.adSetId = { $in: ['', null] };
    baseQuery.adId = { $in: ['', null] };
  } else if (entityType === 'adset') {
    baseQuery.adId = { $in: ['', null] };
  }

  const existingIds = new Set(await AdPerformance.distinct(idKey, baseQuery));

  for (const entity of entities) {
    const entityObj = typeof entity.toObject === 'function' ? entity.toObject() : entity;
    const entityId = entityObj[idKey];
    if (!entityId || existingIds.has(entityId)) continue;

    await generateDailyRecordsForEntity({
      campaignId: entityObj.campaignId || (entityType === 'campaign' ? entityId : ''),
      adSetId: entityObj.adSetId || (entityType === 'adset' ? entityId : ''),
      adId: entityType === 'ad' ? entityId : '',
      totalResults: entityObj.results || 0,
      totalReach: entityObj.reach || 0,
      totalImpressions: entityObj.impressions || 0,
      totalSpent: entityObj.amountSpent || 0,
      resultType: entityObj.resultType || 'Link clicks',
    });
    existingIds.add(entityId);
  }
};

/**
 * Synchronizes inline edited performance metrics to AdPerformance collection.
 * Distributes edited values across daily records in the targeted date range so that
 * re-fetching or summing that date range produces EXACTLY the edited value, never reverting.
 */
export const syncPerformanceUpdate = async ({ filter, perfUpdates, startDate, endDate }) => {
  if (!perfUpdates || Object.keys(perfUpdates).length === 0) return;

  const metricKeys = ['results', 'reach', 'impressions', 'amountSpent', 'costPerResult', 'frequency', 'budget'];
  const hasMetric = metricKeys.some(k => perfUpdates[k] !== undefined);
  if (!hasMetric) return;

  const adIdStr = typeof filter.adId === 'string' && filter.adId.trim() !== '' ? filter.adId : null;
  const adSetIdStr = typeof filter.adSetId === 'string' && filter.adSetId.trim() !== '' ? filter.adSetId : null;
  const campaignIdStr = typeof filter.campaignId === 'string' && filter.campaignId.trim() !== '' ? filter.campaignId : null;

  // Build unambiguous target filter for AdPerformance
  const targetFilter = {};
  if (adIdStr) {
    targetFilter.adId = adIdStr;
  } else if (adSetIdStr) {
    targetFilter.adSetId = adSetIdStr;
    targetFilter.adId = { $in: ['', null] };
  } else if (campaignIdStr) {
    targetFilter.campaignId = campaignIdStr;
    targetFilter.adSetId = { $in: ['', null] };
    targetFilter.adId = { $in: ['', null] };
  }

  // 1. If date range is specified, update exact period record for this specific entity
  if (startDate && endDate) {
    await AdPerformance.updateMany(
      { ...targetFilter, isDaily: false, reportingStarts: startDate, reportingEnds: endDate },
      { $set: perfUpdates }
    );
  }

  // 2. Find daily records in targeted range
  const queryRange = {};
  if (startDate && endDate) {
    queryRange.date = { $gte: startDate, $lte: endDate };
  }

  let inRangeDaily = await AdPerformance.find({ ...targetFilter, isDaily: true, ...queryRange });
  if (inRangeDaily.length === 0 && !startDate && !endDate) {
    inRangeDaily = await AdPerformance.find({ ...targetFilter, isDaily: true });
  }

  if (inRangeDaily.length > 0) {
    const K = inRangeDaily.length;
    const resultsTotal = perfUpdates.results !== undefined ? Math.round(Number(perfUpdates.results)) : null;
    const reachTotal = perfUpdates.reach !== undefined ? Math.round(Number(perfUpdates.reach)) : null;
    const impressionsTotal = perfUpdates.impressions !== undefined ? Math.round(Number(perfUpdates.impressions)) : null;
    const spentTotal = perfUpdates.amountSpent !== undefined ? parseFloat(Number(perfUpdates.amountSpent).toFixed(2)) : null;

    const resultsRemainder = resultsTotal !== null ? resultsTotal % K : 0;
    const reachRemainder = reachTotal !== null ? reachTotal % K : 0;
    const impressionsRemainder = impressionsTotal !== null ? impressionsTotal % K : 0;
    let runningSpent = 0;

    for (let i = 0; i < K; i++) {
      const rec = inRangeDaily[i];
      const updates = {};

      if (resultsTotal !== null) {
        updates.results = Math.floor(resultsTotal / K) + (i < resultsRemainder ? 1 : 0);
      }
      if (reachTotal !== null) {
        updates.reach = Math.floor(reachTotal / K) + (i < reachRemainder ? 1 : 0);
      }
      if (impressionsTotal !== null) {
        updates.impressions = Math.floor(impressionsTotal / K) + (i < impressionsRemainder ? 1 : 0);
      }
      if (spentTotal !== null) {
        if (i === K - 1) {
          updates.amountSpent = parseFloat((spentTotal - runningSpent).toFixed(2));
        } else {
          const slice = parseFloat((spentTotal / K).toFixed(2));
          updates.amountSpent = slice;
          runningSpent += slice;
        }
      }
      if (perfUpdates.costPerResult !== undefined) {
        updates.costPerResult = perfUpdates.costPerResult;
      } else if (updates.results > 0 && updates.amountSpent > 0) {
        updates.costPerResult = parseFloat((updates.amountSpent / updates.results).toFixed(2));
      }
      if (perfUpdates.frequency !== undefined) {
        updates.frequency = perfUpdates.frequency;
      } else if (updates.reach > 0 && updates.impressions > 0) {
        updates.frequency = parseFloat((updates.impressions / updates.reach).toFixed(2));
      }

      await AdPerformance.updateOne({ _id: rec._id }, { $set: updates });
    }

    // Recalculate overall totals across ALL daily records for this entity
    const allDaily = await AdPerformance.find({ ...targetFilter, isDaily: true });
    if (allDaily.length > 0) {
      let overallResults = 0;
      let overallReach = 0;
      let overallImp = 0;
      let overallSpent = 0;

      allDaily.forEach(d => {
        overallResults += Number(d.results) || 0;
        overallReach += Number(d.reach) || 0;
        overallImp += Number(d.impressions) || 0;
        overallSpent += Number(d.amountSpent) || 0;
      });

      const overallCpr = overallResults > 0 ? parseFloat((overallSpent / overallResults).toFixed(2)) : 0;
      const overallFreq = overallReach > 0 ? parseFloat((overallImp / overallReach).toFixed(2)) : 1.0;

      const entityDocUpdates = {
        results: overallResults,
        reach: overallReach,
        impressions: overallImp,
        amountSpent: parseFloat(overallSpent.toFixed(2)),
        costPerResult: overallCpr,
        frequency: overallFreq,
      };

      if (perfUpdates.budget !== undefined) {
        entityDocUpdates.budget = perfUpdates.budget;
      }

      if (adIdStr) {
        await Ad.updateOne({ adId: adIdStr }, { $set: entityDocUpdates });
      } else if (adSetIdStr) {
        await AdSet.updateOne({ adSetId: adSetIdStr }, { $set: entityDocUpdates });
      } else if (campaignIdStr) {
        await Campaign.updateOne({ campaignId: campaignIdStr }, { $set: entityDocUpdates });
      }
    }
  } else if (startDate && endDate) {
    await AdPerformance.findOneAndUpdate(
      { ...targetFilter, isDaily: false, reportingStarts: startDate, reportingEnds: endDate },
      { $set: { ...targetFilter, isDaily: false, reportingStarts: startDate, reportingEnds: endDate, ...perfUpdates } },
      { upsert: true, new: true }
    );
  }

  // Also update overall period records for this entity if no date range was specified
  if (!startDate || !endDate) {
    await AdPerformance.updateMany(
      { ...targetFilter, isDaily: false },
      { $set: perfUpdates }
    );
  }
};

/**
 * Enriches an array of entity documents (Campaigns, AdSets, or Ads)
 * with dynamic date-range aggregated performance metrics from the AdPerformance collection.
 * 
 * @param {Array} entities - Array of entity objects or Mongoose documents
 * @param {'campaign'|'adset'|'ad'} entityType - The type of entity being enriched
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @returns {Promise<Array>} Enriched entities with recalculated performance metrics
 */
export const enrichWithPerformance = async (entities, entityType, startDate, endDate) => {
  if (!entities || entities.length === 0) return [];

  // Ensure daily performance records exist for all entities
  await ensureDailyPerformanceForEntities(entities, entityType);

  const idKey = entityType === 'campaign' ? 'campaignId' : entityType === 'adset' ? 'adSetId' : 'adId';
  const entityIds = entities.map(e => e[idKey]).filter(Boolean);

  if (entityIds.length === 0) {
    return entities.map(e => (typeof e.toObject === 'function' ? e.toObject() : { ...e }));
  }

  // Query performance records matching this entity level specifically
  const query = { [idKey]: { $in: entityIds } };
  if (entityType === 'campaign') {
    query.adSetId = { $in: ['', null] };
    query.adId = { $in: ['', null] };
  } else if (entityType === 'adset') {
    query.adId = { $in: ['', null] };
  } else if (entityType === 'ad') {
    query.adId = { $in: entityIds, $ne: '' };
  }

  const perfRecords = await AdPerformance.find(query).lean();

  // Group records by entity ID
  const perfMap = new Map();
  perfRecords.forEach(rec => {
    const id = rec[idKey];
    if (!perfMap.has(id)) {
      perfMap.set(id, []);
    }
    perfMap.get(id).push(rec);
  });

  const hasDateRange = Boolean(startDate && endDate);

  return entities.map(entity => {
    const entityObj = typeof entity.toObject === 'function' ? entity.toObject() : { ...entity };
    const id = entityObj[idKey];
    const records = perfMap.get(id) || [];

    if (hasDateRange) {
      // 1. Check if an exact period record exists for this date range
      const exactPeriod = records.find(r => !r.isDaily && r.reportingStarts === startDate && r.reportingEnds === endDate);
      if (exactPeriod) {
        const pResults = Number(exactPeriod.results) || 0;
        const pReach = Number(exactPeriod.reach) || 0;
        const pImpressions = Number(exactPeriod.impressions) || 0;
        const pSpent = parseFloat((Number(exactPeriod.amountSpent) || 0).toFixed(2));
        const pCpr = Number(exactPeriod.costPerResult) || (pResults > 0 ? parseFloat((pSpent / pResults).toFixed(2)) : 0);
        const pFreq = Number(exactPeriod.frequency) || (pReach > 0 ? parseFloat((pImpressions / pReach).toFixed(2)) : 1.0);
        const hasDelivery = pResults > 0 || pReach > 0 || pImpressions > 0 || pSpent > 0;

        return {
          ...entityObj,
          results: pResults,
          reach: pReach,
          impressions: pImpressions,
          amountSpent: pSpent,
          costPerResult: pCpr,
          frequency: pFreq,
          hasDataForRange: hasDelivery,
        };
      }

      // 2. Otherwise aggregate daily records in range
      const inRangeDaily = records.filter(r => r.isDaily && r.date && r.date >= startDate && r.date <= endDate);
      if (inRangeDaily.length > 0) {
        let totalResults = 0;
        let totalSpent = 0;
        let totalImpressions = 0;
        let totalReach = 0;

        inRangeDaily.forEach(r => {
          totalResults += Number(r.results) || 0;
          totalSpent += Number(r.amountSpent) || 0;
          totalImpressions += Number(r.impressions) || 0;
          totalReach += Number(r.reach) || 0;
        });

        const costPerResult = totalResults > 0 ? parseFloat((totalSpent / totalResults).toFixed(2)) : 0;
        const frequency = totalReach > 0 ? parseFloat((totalImpressions / totalReach).toFixed(2)) : 1.0;
        const hasDelivery = totalResults > 0 || totalReach > 0 || totalImpressions > 0 || totalSpent > 0;

        return {
          ...entityObj,
          results: totalResults,
          reach: totalReach,
          impressions: totalImpressions,
          amountSpent: parseFloat(totalSpent.toFixed(2)),
          costPerResult,
          frequency,
          hasDataForRange: hasDelivery,
        };
      }

      // If date range requested and no data in that range
      return {
        ...entityObj,
        results: 0,
        reach: 0,
        impressions: 0,
        amountSpent: 0,
        costPerResult: 0,
        frequency: 1.0,
        hasDataForRange: false,
      };
    }

    // Default fallback when no date range is provided
    return {
      ...entityObj,
      results: Number(entityObj.results) || 0,
      reach: Number(entityObj.reach) || 0,
      impressions: Number(entityObj.impressions) || 0,
      amountSpent: Number(entityObj.amountSpent) || 0,
      costPerResult: Number(entityObj.costPerResult) || (entityObj.results > 0 ? parseFloat((Number(entityObj.amountSpent) / Number(entityObj.results)).toFixed(2)) : 0),
      frequency: Number(entityObj.frequency) || (entityObj.reach > 0 ? parseFloat((Number(entityObj.impressions) / Number(entityObj.reach)).toFixed(2)) : 1.0),
      hasDataForRange: true,
    };
  });
};

/**
 * Calculates overall account performance summary for analytics and table footer totals.
 * 
 * @param {string} startDate - YYYY-MM-DD
 * @param {string} endDate - YYYY-MM-DD
 * @param {Array<string>} [campaignIds] - Optional filter for specific campaigns
 * @returns {Promise<Object>} Summary totals
 */
export const calculateSummaryMetrics = async (startDate, endDate, campaignIds = null) => {
  const query = {};
  if (campaignIds && campaignIds.length > 0) {
    query.campaignId = { $in: campaignIds };
  }

  const records = await AdPerformance.find(query).lean();
  if (records.length === 0) {
    return { totalSpend: 0, totalReach: 0, totalImpressions: 0, totalResults: 0 };
  }

  // Group by campaignId
  const campMap = new Map();
  records.forEach(r => {
    if (!campMap.has(r.campaignId)) {
      campMap.set(r.campaignId, []);
    }
    campMap.get(r.campaignId).push(r);
  });

  const dummyCampaigns = Array.from(campMap.keys()).map(id => ({ campaignId: id }));
  const enriched = await enrichWithPerformance(dummyCampaigns, 'campaign', startDate, endDate);

  let totalSpend = 0;
  let totalReach = 0;
  let totalImpressions = 0;
  let totalResults = 0;

  enriched.forEach(c => {
    totalSpend += c.amountSpent || 0;
    totalReach += c.reach || 0;
    totalImpressions += c.impressions || 0;
    totalResults += c.results || 0;
  });

  return {
    totalSpend: parseFloat(totalSpend.toFixed(2)),
    totalReach,
    totalImpressions,
    totalResults,
  };
};
