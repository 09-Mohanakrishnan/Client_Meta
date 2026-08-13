import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';
import AdPerformance from '../models/AdPerformance.js';

dotenv.config();

// The 10 campaigns with their data from the uploaded CSV/Excel files
const campaignsData = [
  {
    campaignId: 'CAM_777HZ0S',
    name: 'Mountain farmhouse - Video',
    delivery: 'Active',
    bidStrategy: 'Highest volume',
    budget: 300,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Active',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 3125, resultType: 'Link clicks', reach: 64200, impressions: 89400, amountSpent: 8750, costPerResult: 2.80, frequency: 1.39 },
      { reportingStarts: '2026-08-08', reportingEnds: '2026-08-13', results: 820, resultType: 'Link clicks', reach: 18400, impressions: 24100, amountSpent: 2280, costPerResult: 2.78, frequency: 1.31 },
    ],
  },
  {
    campaignId: 'CAM_3M2GTXZ',
    name: 'Black BG with Text - Image',
    delivery: 'Active',
    bidStrategy: 'Highest volume',
    budget: 250,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Active',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 2480, resultType: 'Link clicks', reach: 52100, impressions: 71200, amountSpent: 7100, costPerResult: 2.86, frequency: 1.37 },
      { reportingStarts: '2026-08-08', reportingEnds: '2026-08-13', results: 640, resultType: 'Link clicks', reach: 14200, impressions: 18900, amountSpent: 1840, costPerResult: 2.88, frequency: 1.33 },
    ],
  },
  {
    campaignId: 'CAM_R0W6TJY',
    name: 'Farmhouse with Text - Image',
    delivery: 'Active',
    bidStrategy: 'Highest volume',
    budget: 200,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Active',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 1940, resultType: 'Link clicks', reach: 41800, impressions: 56300, amountSpent: 5600, costPerResult: 2.89, frequency: 1.35 },
      { reportingStarts: '2026-08-08', reportingEnds: '2026-08-13', results: 510, resultType: 'Link clicks', reach: 11500, impressions: 15200, amountSpent: 1480, costPerResult: 2.90, frequency: 1.32 },
    ],
  },
  {
    campaignId: 'CAM_MTQGLPV',
    name: '125 SFT - Video',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 500,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 14280, resultType: 'Link clicks', reach: 185400, impressions: 265000, amountSpent: 35700, costPerResult: 2.50, frequency: 1.43 },
      { reportingStarts: '2026-06-01', reportingEnds: '2026-08-13', results: 18740, resultType: 'Link clicks', reach: 242100, impressions: 348000, amountSpent: 46850, costPerResult: 2.50, frequency: 1.44 },
    ],
  },
  {
    campaignId: 'CAM_IHWXPVJ',
    name: '125 SFT - Image',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 400,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 8960, resultType: 'Link clicks', reach: 120500, impressions: 168000, amountSpent: 22400, costPerResult: 2.50, frequency: 1.39 },
      { reportingStarts: '2026-06-01', reportingEnds: '2026-08-13', results: 11500, resultType: 'Link clicks', reach: 154000, impressions: 215000, amountSpent: 28750, costPerResult: 2.50, frequency: 1.40 },
    ],
  },
  {
    campaignId: 'CAM_2FPYA9R',
    name: 'Thinking Farmhouse',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 350,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 6420, resultType: 'Link clicks', reach: 89000, impressions: 124000, amountSpent: 16050, costPerResult: 2.50, frequency: 1.39 },
      { reportingStarts: '2026-06-01', reportingEnds: '2026-08-13', results: 8900, resultType: 'Link clicks', reach: 122000, impressions: 171000, amountSpent: 22250, costPerResult: 2.50, frequency: 1.40 },
    ],
  },
  {
    campaignId: 'CAM_6S9ABEN',
    name: 'Funday',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 300,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 4850, resultType: 'Link clicks', reach: 68000, impressions: 94000, amountSpent: 12125, costPerResult: 2.50, frequency: 1.38 },
      { reportingStarts: '2026-06-01', reportingEnds: '2026-08-13', results: 6300, resultType: 'Link clicks', reach: 88000, impressions: 122000, amountSpent: 15750, costPerResult: 2.50, frequency: 1.39 },
    ],
  },
  {
    campaignId: 'CAM_KT66JCM',
    name: 'Sp Koil Offer',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 250,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 3200, resultType: 'Link clicks', reach: 45000, impressions: 62000, amountSpent: 8000, costPerResult: 2.50, frequency: 1.38 },
      { reportingStarts: '2026-07-14', reportingEnds: '2026-08-13', results: 3350, resultType: 'Link clicks', reach: 47000, impressions: 65000, amountSpent: 8375, costPerResult: 2.50, frequency: 1.38 },
    ],
  },
  {
    campaignId: 'CAM_93CDUZ2',
    name: 'Own a Farmland Chennai',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 200,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 2100, resultType: 'Link clicks', reach: 31000, impressions: 42000, amountSpent: 5250, costPerResult: 2.50, frequency: 1.35 },
      { reportingStarts: '2026-07-14', reportingEnds: '2026-08-13', results: 2200, resultType: 'Link clicks', reach: 32500, impressions: 44000, amountSpent: 5500, costPerResult: 2.50, frequency: 1.35 },
    ],
  },
  {
    campaignId: 'CAM_4GIU58V',
    name: 'Grab a Farmhouse - Reach',
    delivery: 'Inactive',
    bidStrategy: 'Highest volume',
    budget: 150,
    budgetType: 'Daily',
    ends: 'Ongoing',
    status: 'Off',
    periods: [
      { reportingStarts: '2026-07-15', reportingEnds: '2026-08-13', results: 1450, resultType: 'Reach', reach: 58000, impressions: 72000, amountSpent: 3625, costPerResult: 2.50, frequency: 1.24 },
      { reportingStarts: '2026-07-14', reportingEnds: '2026-08-13', results: 1520, resultType: 'Reach', reach: 61000, impressions: 75500, amountSpent: 3800, costPerResult: 2.50, frequency: 1.24 },
    ],
  },
];

const mockImages = [
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=150&auto=format&fit=crop&q=60',
];

const mockVideos = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
];

const rankings = ['Above average', 'Average', 'Below average (bottom 20%)', 'Below average (bottom 35%)'];

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing records
    await Campaign.deleteMany({});
    await AdSet.deleteMany({});
    await Ad.deleteMany({});
    await AdPerformance.deleteMany({});
    console.log('Cleared existing collections (Campaigns, AdSets, Ads, AdPerformance).');

    for (let i = 0; i < campaignsData.length; i++) {
      const campData = campaignsData[i];
      const isVideo = campData.name.toLowerCase().includes('video');
      const cleanCode = campData.campaignId.replace('CAM_', '');

      // 1. Create Campaign
      const campaign = await Campaign.create({
        name: campData.name,
        campaignId: campData.campaignId,
        delivery: campData.delivery,
        bidStrategy: campData.bidStrategy,
        budget: campData.budget,
        budgetType: campData.budgetType,
        ends: campData.ends,
        status: campData.status,
      });

      // 2. Create AdPerformance period records for Campaign
      for (const p of campData.periods) {
        await AdPerformance.create({
          campaignId: campaign.campaignId,
          isDaily: false,
          reportingStarts: p.reportingStarts,
          reportingEnds: p.reportingEnds,
          results: p.results,
          resultType: p.resultType,
          reach: p.reach,
          impressions: p.impressions,
          costPerResult: p.costPerResult,
          amountSpent: p.amountSpent,
          frequency: p.frequency,
        });
      }

      // 3. Create 2 AdSets per Campaign
      for (let sIdx = 1; sIdx <= 2; sIdx++) {
        const adSetId = `SET_${cleanCode}_${sIdx}`;
        const setBudget = Math.round(campData.budget / 2);

        const adset = await AdSet.create({
          name: `${campData.name} - Ad Set ${sIdx}`,
          adSetId,
          campaignId: campaign.campaignId,
          campaignObjectId: campaign._id,
          delivery: campData.delivery,
          bidStrategy: campData.bidStrategy,
          budget: setBudget,
          budgetType: campData.budgetType,
          startDate: campData.periods[0]?.reportingStarts || '2026-07-15',
          endDate: campData.ends,
          status: campData.status,
        });

        // Create AdPerformance period records for AdSet
        for (const p of campData.periods) {
          const setResults = Math.round(p.results / 2);
          const setSpent = parseFloat((p.amountSpent / 2).toFixed(2));
          const setCost = setResults > 0 ? parseFloat((setSpent / setResults).toFixed(2)) : 0;

          await AdPerformance.create({
            campaignId: campaign.campaignId,
            adSetId: adset.adSetId,
            isDaily: false,
            reportingStarts: p.reportingStarts,
            reportingEnds: p.reportingEnds,
            results: setResults,
            resultType: p.resultType,
            reach: Math.round(p.reach / 2),
            impressions: Math.round(p.impressions / 2),
            costPerResult: setCost,
            amountSpent: setSpent,
            frequency: p.frequency,
          });
        }

        // 4. Create 2 Ads per AdSet
        for (let aIdx = 1; aIdx <= 2; aIdx++) {
          const adId = `AD_${cleanCode}_${sIdx}_${aIdx}`;
          const imgUrl = mockImages[(i * 4 + sIdx * 2 + aIdx) % mockImages.length];
          const vidUrl = isVideo ? mockVideos[(i + aIdx) % mockVideos.length] : undefined;

          const ad = await Ad.create({
            name: `${campData.name} - Creative ${sIdx}.${aIdx}`,
            adId,
            adSetId: adset.adSetId,
            adSetObjectId: adset._id,
            campaignId: campaign.campaignId,
            campaignObjectId: campaign._id,
            delivery: adset.delivery,
            adSetName: adset.name,
            bidStrategy: 'Highest volume',
            budget: Math.round(adset.budget / 2),
            qualityRanking: rankings[(i + aIdx) % rankings.length],
            engagementRateRanking: rankings[(i + sIdx) % rankings.length],
            conversionRanking: rankings[(i + sIdx + aIdx) % rankings.length],
            status: adset.status,
            image: imgUrl,
            imageUrl: imgUrl,
            video: vidUrl,
            videoUrl: vidUrl,
          });

          // Create AdPerformance period records for Ad
          for (const p of campData.periods) {
            const adResults = Math.round(p.results / 4);
            const adSpent = parseFloat((p.amountSpent / 4).toFixed(2));
            const adCost = adResults > 0 ? parseFloat((adSpent / adResults).toFixed(2)) : 0;

            await AdPerformance.create({
              campaignId: campaign.campaignId,
              adSetId: adset.adSetId,
              adId: ad.adId,
              isDaily: false,
              reportingStarts: p.reportingStarts,
              reportingEnds: p.reportingEnds,
              results: adResults,
              resultType: p.resultType,
              reach: Math.round(p.reach / 4),
              impressions: Math.round(p.impressions / 4),
              costPerResult: adCost,
              amountSpent: adSpent,
              frequency: p.frequency,
            });
          }
        }
      }
    }

    const cCount = await Campaign.countDocuments();
    const sCount = await AdSet.countDocuments();
    const aCount = await Ad.countDocuments();
    const pCount = await AdPerformance.countDocuments();

    console.log(`Seeded successfully:`);
    console.log(`- ${cCount} Campaigns`);
    console.log(`- ${sCount} Ad Sets`);
    console.log(`- ${aCount} Ads`);
    console.log(`- ${pCount} AdPerformance records`);

    await mongoose.disconnect();
    console.log('Finished!');
  } catch (err) {
    console.error('Error seeding performance data:', err);
    process.exit(1);
  }
};

seedAll();
