import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function parseCSV(content) {
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentField);
      currentField = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentField);
      if (currentRow.length > 1 || currentRow[0] !== '') rows.push(currentRow);
      currentRow = [];
      currentField = '';
    } else {
      currentField += char;
    }
  }
  if (currentRow.length > 0 || currentField !== '') {
    currentRow.push(currentField);
    rows.push(currentRow);
  }
  return rows;
}

const filesConfig = [
  { file: 'Arun-Campaigns-3-Nov-2026-9-Nov-2026.csv', starts: '2026-11-03', ends: '2026-11-09', label: 'Last 7' },
  { file: 'Arun-Campaigns-27-Oct-2026-9-Nov-2026.csv', starts: '2026-10-27', ends: '2026-11-09', label: 'Last 14' },
  { file: 'Arun-Campaigns-13-Oct-2026-9-Nov-2026.csv', starts: '2026-10-13', ends: '2026-11-09', label: 'Last 28' },
  { file: 'Arun-Campaigns-11-Oct-2026-9-Nov-2026.csv', starts: '2026-10-11', ends: '2026-11-09', label: 'Last 30' },
  { file: 'Arun-Campaigns-1-Oct-2026-31-Oct-2026.csv', starts: '2026-10-01', ends: '2026-10-31', label: 'Oct 1 - Oct 31' },
  { file: 'Arun-Campaigns-1-Nov-2026-10-Nov-2026.csv', starts: '2026-11-01', ends: '2026-11-10', label: 'Nov 1 - Nov 10' },
];

async function runImport() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB Atlas');

  const Campaign = mongoose.model('Campaign', new mongoose.Schema({}, { strict: false }));
  const AdSet = mongoose.model('AdSet', new mongoose.Schema({}, { strict: false }));
  const Ad = mongoose.model('Ad', new mongoose.Schema({}, { strict: false }));
  const AdPerformance = mongoose.model('AdPerformance', new mongoose.Schema({}, { strict: false }));

  // Helper to generate slug for ID
  const makeId = (prefix, name, idx) => {
    const clean = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 8);
    const num = String(idx).padStart(3, '0');
    return `${prefix}_${clean}_${num}`;
  };

  // 1. Gather all unique campaigns across files
  const campaignMap = new Map(); // name -> metadata + periodMetrics
  const periodDataByFile = [];

  for (let fIdx = 0; fIdx < filesConfig.length; fIdx++) {
    const cfg = filesConfig[fIdx];
    const fullPath = path.join('./data_imports', cfg.file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const rows = parseCSV(content);
    const header = rows[0];

    const nameIdx = header.indexOf('Campaign name');
    const deliveryIdx = header.indexOf('Campaign delivery');
    const budgetIdx = header.indexOf('Ad set budget');
    const budgetTypeIdx = header.indexOf('Ad set budget type');
    const impIdx = header.indexOf('Impressions');
    const reachIdx = header.indexOf('Reach');
    const spentIdx = header.indexOf('Amount spent (INR)');
    const resultsIdx = header.indexOf('Total messaging contacts');
    const endsIdx = header.indexOf('Ends');

    const fileRows = [];

    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      const name = r[nameIdx]?.replace(/^"|"$/g, '').trim();
      if (!name) continue;

      const rawDelivery = r[deliveryIdx]?.toLowerCase();
      const isDeliveryActive = rawDelivery === 'active';
      const rawBudget = r[budgetIdx];
      const budgetNum = parseFloat(rawBudget) || 0;
      const budgetType = (r[budgetTypeIdx] === 'Daily' || r[budgetTypeIdx] === 'Lifetime') ? r[budgetTypeIdx] : 'Daily';
      const ends = r[endsIdx] || 'Ongoing';

      const imp = parseFloat(r[impIdx]) || 0;
      const reach = parseFloat(r[reachIdx]) || 0;
      const spent = parseFloat(r[spentIdx]) || 0;
      const results = resultsIdx !== -1 ? (parseFloat(r[resultsIdx]) || 0) : 0;

      const rowData = {
        name,
        delivery: isDeliveryActive ? 'Active' : 'Off',
        status: isDeliveryActive ? 'Active' : 'Off',
        budget: budgetNum,
        budgetType,
        ends,
        impressions: imp,
        reach,
        amountSpent: spent,
        results,
      };

      fileRows.push(rowData);

      if (!campaignMap.has(name)) {
        campaignMap.set(name, {
          name,
          delivery: rowData.delivery,
          status: rowData.status,
          budget: rowData.budget,
          budgetType: rowData.budgetType,
          ends: rowData.ends,
          maxImp: imp,
          maxSpent: spent,
          maxReach: reach,
          maxResults: results,
          periods: {},
        });
      } else {
        const c = campaignMap.get(name);
        if (rowData.delivery === 'Active') {
          c.delivery = 'Active';
          c.status = 'Active';
        }
        if (rowData.budget > 0) c.budget = rowData.budget;
        if (imp > c.maxImp) {
          c.maxImp = imp;
          c.maxSpent = spent;
          c.maxReach = reach;
          c.maxResults = results;
        }
      }

      campaignMap.get(name).periods[`${cfg.starts}_${cfg.ends}`] = {
        impressions: imp,
        reach,
        amountSpent: spent,
        results,
      };
    }

    periodDataByFile.push({ cfg, rows: fileRows });
  }

  console.log(`Found ${campaignMap.size} unique campaigns across all CSV files.`);

  // 2. Fetch existing campaigns to preserve existing campaignIds if available
  const existingCamps = await Campaign.find({}).lean();
  const existingMap = new Map();
  existingCamps.forEach(c => {
    existingMap.set(c.name.toLowerCase(), c);
  });

  // Assign stable IDs
  let idx = 1;
  for (const [name, camp] of campaignMap.entries()) {
    const existing = existingMap.get(name.toLowerCase());
    if (existing) {
      camp.campaignId = existing.campaignId;
      camp.adSetId = existing.adSetId || `ADSET_${existing.campaignId.replace('CAM_', '')}`;
      camp.adId = existing.adId || `AD_${existing.campaignId.replace('CAM_', '')}`;
    } else {
      camp.campaignId = makeId('CAM', name, idx);
      camp.adSetId = makeId('ADSET', name, idx);
      camp.adId = makeId('AD', name, idx);
    }
    idx++;
  }

  // 3. Upsert Campaigns, AdSets, and Ads into MongoDB
  console.log('Upserting Campaigns, AdSets, and Ads into database...');
  for (const [name, camp] of campaignMap.entries()) {
    const cpr = camp.maxResults > 0 ? parseFloat((camp.maxSpent / camp.maxResults).toFixed(2)) : 0;
    const freq = camp.maxReach > 0 ? parseFloat((camp.maxImp / camp.maxReach).toFixed(2)) : 1.0;

    const campaignDoc = {
      campaignId: camp.campaignId,
      name: camp.name,
      delivery: camp.delivery,
      status: camp.status,
      budget: camp.budget,
      budgetType: camp.budgetType,
      bidStrategy: 'Highest volume',
      ends: camp.ends,
      results: camp.maxResults,
      resultType: 'Messaging contacts',
      reach: camp.maxReach,
      impressions: camp.maxImp,
      costPerResult: cpr,
      amountSpent: camp.maxSpent,
      frequency: freq,
    };

    await Campaign.findOneAndUpdate(
      { campaignId: camp.campaignId },
      { $set: campaignDoc },
      { upsert: true, new: true }
    );

    const adSetDoc = {
      adSetId: camp.adSetId,
      campaignId: camp.campaignId,
      name: `${camp.name} Ad Set`,
      delivery: camp.delivery,
      status: camp.status,
      budget: camp.budget,
      budgetType: camp.budgetType,
      bidStrategy: 'Highest volume',
      results: camp.maxResults,
      resultType: 'Messaging contacts',
      reach: camp.maxReach,
      impressions: camp.maxImp,
      costPerResult: cpr,
      amountSpent: camp.maxSpent,
      frequency: freq,
    };

    await AdSet.findOneAndUpdate(
      { adSetId: camp.adSetId },
      { $set: adSetDoc },
      { upsert: true, new: true }
    );

    const adDoc = {
      adId: camp.adId,
      adSetId: camp.adSetId,
      campaignId: camp.campaignId,
      name: `${camp.name} Ad`,
      delivery: camp.delivery,
      status: camp.status,
      adSetName: adSetDoc.name,
      budget: camp.budget,
      results: camp.maxResults,
      resultType: 'Messaging contacts',
      reach: camp.maxReach,
      impressions: camp.maxImp,
      costPerResult: cpr,
      amountSpent: camp.maxSpent,
      frequency: freq,
    };

    await Ad.findOneAndUpdate(
      { adId: camp.adId },
      { $set: adDoc },
      { upsert: true, new: true }
    );
  }

  // 4. Upsert exact period performance records into AdPerformance
  console.log('Upserting period records for all 6 date ranges...');
  const periodPerformanceDocs = [];

  for (const { cfg, rows } of periodDataByFile) {
    for (const r of rows) {
      const camp = campaignMap.get(r.name);
      if (!camp) continue;

      const cpr = r.results > 0 ? parseFloat((r.amountSpent / r.results).toFixed(2)) : 0;
      const freq = r.reach > 0 ? parseFloat((r.impressions / r.reach).toFixed(2)) : 1.0;

      const basePerf = {
        reportingStarts: cfg.starts,
        reportingEnds: cfg.ends,
        isDaily: false,
        results: r.results,
        resultType: 'Messaging contacts',
        reach: r.reach,
        impressions: r.impressions,
        amountSpent: r.amountSpent,
        costPerResult: cpr,
        frequency: freq,
      };

      // Campaign level record
      periodPerformanceDocs.push({
        ...basePerf,
        campaignId: camp.campaignId,
        adSetId: '',
        adId: '',
      });

      // AdSet level record
      periodPerformanceDocs.push({
        ...basePerf,
        campaignId: camp.campaignId,
        adSetId: camp.adSetId,
        adId: '',
      });

      // Ad level record
      periodPerformanceDocs.push({
        ...basePerf,
        campaignId: camp.campaignId,
        adSetId: camp.adSetId,
        adId: camp.adId,
      });
    }
  }

  // Clear existing period records for these exact date ranges
  for (const cfg of filesConfig) {
    await AdPerformance.deleteMany({
      reportingStarts: cfg.starts,
      reportingEnds: cfg.ends,
      isDaily: false,
    });
  }

  console.log(`Inserting ${periodPerformanceDocs.length} period performance records...`);
  await AdPerformance.insertMany(periodPerformanceDocs);

  // 5. Generate daily records for each day from 2026-10-01 to 2026-11-10
  console.log('Generating differential daily records for all campaigns...');
  const dailyRecords = [];

  // Helper to format date YYYY-MM-DD
  const formatYMD = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Helper to get array of dates between start and end (inclusive)
  const getDatesInRange = (startStr, endStr) => {
    const dates = [];
    const cur = new Date(startStr);
    const end = new Date(endStr);
    while (cur <= end) {
      dates.push(formatYMD(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  // Distribution segments based on the CSV files
  // Seg 1: Nov 3 to Nov 9 (7 days) -> P(Nov 3 - Nov 9)
  // Seg 2: Oct 27 to Nov 2 (7 days) -> P(Oct 27 - Nov 9) - P(Nov 3 - Nov 9)
  // Seg 3: Oct 13 to Oct 26 (14 days) -> P(Oct 13 - Nov 9) - P(Oct 27 - Nov 9)
  // Seg 4: Oct 11 to Oct 12 (2 days) -> P(Oct 11 - Nov 9) - P(Oct 13 - Nov 9)
  // Seg 5: Oct 1 to Oct 10 (10 days) -> P(Oct 1 - Oct 31) - Sum(Oct 11-31)
  // Seg 6: Nov 10 (1 day) -> P(Nov 1 - Nov 10) - Sum(Nov 1-9)

  const seg1Dates = getDatesInRange('2026-11-03', '2026-11-09');
  const seg2Dates = getDatesInRange('2026-10-27', '2026-11-02');
  const seg3Dates = getDatesInRange('2026-10-13', '2026-10-26');
  const seg4Dates = getDatesInRange('2026-10-11', '2026-10-12');
  const seg5Dates = getDatesInRange('2026-10-01', '2026-10-10');
  const seg6Dates = ['2026-11-10'];

  for (const [name, camp] of campaignMap.entries()) {
    const p7 = camp.periods['2026-11-03_2026-11-09'] || { impressions: 0, reach: 0, amountSpent: 0, results: 0 };
    const p14 = camp.periods['2026-10-27_2026-11-09'] || { impressions: 0, reach: 0, amountSpent: 0, results: 0 };
    const p28 = camp.periods['2026-10-13_2026-11-09'] || { impressions: 0, reach: 0, amountSpent: 0, results: 0 };
    const p30 = camp.periods['2026-10-11_2026-11-09'] || { impressions: 0, reach: 0, amountSpent: 0, results: 0 };
    const pOct = camp.periods['2026-10-01_2026-10-31'] || { impressions: 0, reach: 0, amountSpent: 0, results: 0 };
    const pNov = camp.periods['2026-11-01_2026-11-10'] || { impressions: 0, reach: 0, amountSpent: 0, results: 0 };

    // Function to distribute target metrics across date array
    const distributeMetrics = (dates, totalImp, totalSpent, totalReach, totalResults) => {
      const K = dates.length;
      if (K === 0) return;

      const impTarget = Math.max(0, Math.round(totalImp));
      const reachTarget = Math.max(0, Math.round(totalReach));
      const resTarget = Math.max(0, Math.round(totalResults));
      const spentTarget = Math.max(0, parseFloat(Number(totalSpent).toFixed(2)));

      let accImp = 0;
      let accReach = 0;
      let accRes = 0;
      let accSpent = 0;

      dates.forEach((dateStr, idx) => {
        let dImp, dReach, dRes, dSpent;
        if (idx === K - 1) {
          dImp = Math.max(0, impTarget - accImp);
          dReach = Math.max(0, reachTarget - accReach);
          dRes = Math.max(0, resTarget - accRes);
          dSpent = parseFloat(Math.max(0, spentTarget - accSpent).toFixed(2));
        } else {
          dImp = Math.floor(impTarget / K);
          dReach = Math.floor(reachTarget / K);
          dRes = Math.floor(resTarget / K);
          dSpent = parseFloat((spentTarget / K).toFixed(2));

          accImp += dImp;
          accReach += dReach;
          accRes += dRes;
          accSpent += dSpent;
        }

        const costPerResult = dRes > 0 ? parseFloat((dSpent / dRes).toFixed(2)) : 0;
        const frequency = dReach > 0 ? parseFloat((dImp / dReach).toFixed(2)) : 1.0;

        const baseDaily = {
          date: dateStr,
          reportingStarts: dateStr,
          reportingEnds: dateStr,
          isDaily: true,
          results: dRes,
          resultType: 'Messaging contacts',
          reach: dReach,
          impressions: dImp,
          amountSpent: dSpent,
          costPerResult,
          frequency,
        };

        // Campaign
        dailyRecords.push({ ...baseDaily, campaignId: camp.campaignId, adSetId: '', adId: '' });
        // AdSet
        dailyRecords.push({ ...baseDaily, campaignId: camp.campaignId, adSetId: camp.adSetId, adId: '' });
        // Ad
        dailyRecords.push({ ...baseDaily, campaignId: camp.campaignId, adSetId: camp.adSetId, adId: camp.adId });
      });
    };

    // Segment 1 (Nov 3 - Nov 9)
    distributeMetrics(seg1Dates, p7.impressions, p7.amountSpent, p7.reach, p7.results);

    // Segment 2 (Oct 27 - Nov 2) = P14 - P7
    distributeMetrics(
      seg2Dates,
      p14.impressions - p7.impressions,
      p14.amountSpent - p7.amountSpent,
      p14.reach - p7.reach,
      p14.results - p7.results
    );

    // Segment 3 (Oct 13 - Oct 26) = P28 - P14
    distributeMetrics(
      seg3Dates,
      p28.impressions - p14.impressions,
      p28.amountSpent - p14.amountSpent,
      p28.reach - p14.reach,
      p28.results - p14.results
    );

    // Segment 4 (Oct 11 - Oct 12) = P30 - P28
    distributeMetrics(
      seg4Dates,
      p30.impressions - p28.impressions,
      p30.amountSpent - p28.amountSpent,
      p30.reach - p28.reach,
      p30.results - p28.results
    );

    // Segment 5 (Oct 1 - Oct 10) = POct - (sum of Oct 11 to Oct 31)
    const oct11To31Imp = (p30.impressions - p28.impressions) + (p28.impressions - p14.impressions) + ((p14.impressions - p7.impressions) * (5 / 7));
    const oct11To31Spent = (p30.amountSpent - p28.amountSpent) + (p28.amountSpent - p14.amountSpent) + ((p14.amountSpent - p7.amountSpent) * (5 / 7));
    const oct11To31Reach = (p30.reach - p28.reach) + (p28.reach - p14.reach) + ((p14.reach - p7.reach) * (5 / 7));
    const oct11To31Res = (p30.results - p28.results) + (p28.results - p14.results) + ((p14.results - p7.results) * (5 / 7));

    distributeMetrics(
      seg5Dates,
      Math.max(0, pOct.impressions - oct11To31Imp),
      Math.max(0, pOct.amountSpent - oct11To31Spent),
      Math.max(0, pOct.reach - oct11To31Reach),
      Math.max(0, pOct.results - oct11To31Res)
    );

    // Segment 6 (Nov 10) = PNov - (Nov 1 to 9)
    distributeMetrics(
      seg6Dates,
      Math.max(0, pNov.impressions - p7.impressions),
      Math.max(0, pNov.amountSpent - p7.amountSpent),
      Math.max(0, pNov.reach - p7.reach),
      Math.max(0, pNov.results - p7.results)
    );
  }

  // Clear existing daily records for Oct 1 to Nov 10
  await AdPerformance.deleteMany({
    date: { $gte: '2026-10-01', $lte: '2026-11-10' },
    isDaily: true,
  });

  console.log(`Inserting ${dailyRecords.length} daily performance records...`);
  // Insert in batches of 1000
  const batchSize = 1000;
  for (let i = 0; i < dailyRecords.length; i += batchSize) {
    const batch = dailyRecords.slice(i, i + batchSize);
    await AdPerformance.insertMany(batch);
  }

  console.log('Import completed successfully!');
  await mongoose.disconnect();
}

runImport().catch(err => {
  console.error('Import failed with error:', err);
  process.exit(1);
});

