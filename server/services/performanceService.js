import AdPerformance from '../models/AdPerformance.js';

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

  const idKey = entityType === 'campaign' ? 'campaignId' : entityType === 'adset' ? 'adSetId' : 'adId';
  const entityIds = entities.map(e => e[idKey]).filter(Boolean);

  if (entityIds.length === 0) {
    return entities.map(e => (typeof e.toObject === 'function' ? e.toObject() : { ...e }));
  }

  // Query all performance records for these entities
  const perfRecords = await AdPerformance.find({
    [idKey]: { $in: entityIds },
  }).lean();

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
  const filterStart = hasDateRange ? new Date(startDate) : null;
  const filterEnd = hasDateRange ? new Date(endDate) : null;

  return entities.map(entity => {
    const entityObj = typeof entity.toObject === 'function' ? entity.toObject() : { ...entity };
    const id = entityObj[idKey];
    const records = perfMap.get(id) || [];

    if (records.length === 0) {
      return {
        ...entityObj,
        results: entityObj.results || 0,
        reach: entityObj.reach || 0,
        impressions: entityObj.impressions || 0,
        costPerResult: entityObj.costPerResult || 0,
        amountSpent: entityObj.amountSpent || 0,
        frequency: entityObj.frequency || 1.0,
      };
    }

    // Check if daily records exist in the date range
    const dailyRecords = records.filter(r => r.isDaily && r.date);
    const inRangeDaily = hasDateRange
      ? dailyRecords.filter(r => r.date >= startDate && r.date <= endDate)
      : dailyRecords;

    if (inRangeDaily.length > 0) {
      let totalResults = 0;
      let totalSpent = 0;
      let totalImpressions = 0;
      let totalReach = 0;

      inRangeDaily.forEach(r => {
        totalResults += r.results || 0;
        totalSpent += r.amountSpent || 0;
        totalImpressions += r.impressions || 0;
        totalReach += r.reach || 0;
      });

      const costPerResult = totalResults > 0 ? parseFloat((totalSpent / totalResults).toFixed(2)) : 0;
      const frequency = totalReach > 0 ? parseFloat((totalImpressions / totalReach).toFixed(2)) : 1.0;

      return {
        ...entityObj,
        results: totalResults,
        reach: totalReach,
        impressions: totalImpressions,
        amountSpent: parseFloat(totalSpent.toFixed(2)),
        costPerResult,
        frequency,
      };
    }

    // If no daily data matched, check period aggregate records
    const periodRecords = records.filter(r => !r.isDaily);

    if (periodRecords.length > 0) {
      if (hasDateRange) {
        // Pick the closest matching period aggregate
        let bestRecord = periodRecords[0];
        let bestDiff = Infinity;

        periodRecords.forEach(pr => {
          if (pr.reportingStarts && pr.reportingEnds) {
            const pStart = new Date(pr.reportingStarts);
            const pEnd = new Date(pr.reportingEnds);
            const diff = Math.abs(pStart - filterStart) + Math.abs(pEnd - filterEnd);

            if (diff < bestDiff) {
              bestDiff = diff;
              bestRecord = pr;
            }
          }
        });

        return {
          ...entityObj,
          results: bestRecord.results || 0,
          resultType: bestRecord.resultType || entityObj.resultType || 'Link clicks',
          reach: bestRecord.reach || 0,
          impressions: bestRecord.impressions || 0,
          amountSpent: bestRecord.amountSpent || 0,
          costPerResult: bestRecord.costPerResult || 0,
          frequency: bestRecord.frequency || 1.0,
          reportingStarts: bestRecord.reportingStarts || entityObj.reportingStarts,
          reportingEnds: bestRecord.reportingEnds || entityObj.reportingEnds,
        };
      } else {
        // No date range requested, use the most recent period aggregate
        const latest = periodRecords[periodRecords.length - 1];
        return {
          ...entityObj,
          results: latest.results || 0,
          resultType: latest.resultType || entityObj.resultType || 'Link clicks',
          reach: latest.reach || 0,
          impressions: latest.impressions || 0,
          amountSpent: latest.amountSpent || 0,
          costPerResult: latest.costPerResult || 0,
          frequency: latest.frequency || 1.0,
          reportingStarts: latest.reportingStarts || entityObj.reportingStarts,
          reportingEnds: latest.reportingEnds || entityObj.reportingEnds,
        };
      }
    }

    // Default fallback
    return entityObj;
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
