import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import ColumnConfig from '../models/ColumnConfig.js';
import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';

dotenv.config();

const users = [
  {
    name: 'Super Admin User',
    email: 'superadmin@adflow.com',
    password: 'Password123',
    role: 'SUPER_ADMIN',
  },
  {
    name: 'Admin User',
    email: 'admin@adflow.com',
    password: 'Password123',
    role: 'ADMIN',
  },
  {
    name: 'Editor User',
    email: 'editor@adflow.com',
    password: 'Password123',
    role: 'EDITOR',
  },
  {
    name: 'Viewer User',
    email: 'viewer@adflow.com',
    password: 'Password123',
    role: 'VIEWER',
  },
];

const defaultCampaignColumns = [
  { key: 'campaignId', label: 'Campaign ID', type: 'text', visible: true, editable: false, sortable: true, filterable: true, order: 0 },
  { key: 'name', label: 'Campaign Name', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 1 },
  { key: 'delivery', label: 'Delivery', type: 'status', visible: true, editable: true, sortable: true, filterable: true, order: 2 },
  { key: 'budget', label: 'Budget', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 3 },
  { key: 'budgetType', label: 'Budget Type', type: 'select', visible: true, editable: true, sortable: true, filterable: true, order: 4 },
  { key: 'results', label: 'Results', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 5 },
  { key: 'resultType', label: 'Result Type', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 6 },
  { key: 'reach', label: 'Reach', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 7 },
  { key: 'impressions', label: 'Impressions', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 8 },
  { key: 'costPerResult', label: 'Cost per Result', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 9 },
  { key: 'amountSpent', label: 'Amount Spent', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 10 },
  { key: 'ends', label: 'Ends', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 11 },
  { key: 'frequency', label: 'Frequency', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 12 },
].map(c => ({ ...c, entityType: 'campaign' }));

const defaultAdSetColumns = [
  { key: 'adSetId', label: 'Ad Set ID', type: 'text', visible: true, editable: false, sortable: true, filterable: true, order: 0 },
  { key: 'name', label: 'Ad Set Name', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 1 },
  { key: 'delivery', label: 'Delivery', type: 'status', visible: true, editable: true, sortable: true, filterable: true, order: 2 },
  { key: 'budget', label: 'Budget', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 3 },
  { key: 'budgetType', label: 'Budget Type', type: 'select', visible: true, editable: true, sortable: true, filterable: true, order: 4 },
  { key: 'results', label: 'Results', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 5 },
  { key: 'resultType', label: 'Result Type', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 6 },
  { key: 'reach', label: 'Reach', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 7 },
  { key: 'impressions', label: 'Impressions', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 8 },
  { key: 'costPerResult', label: 'Cost per Result', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 9 },
  { key: 'amountSpent', label: 'Amount Spent', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 10 },
  { key: 'startDate', label: 'Start Date', type: 'date', visible: true, editable: true, sortable: true, filterable: true, order: 11 },
  { key: 'endDate', label: 'End Date', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 12 },
].map(c => ({ ...c, entityType: 'adset' }));

const defaultAdColumns = [
  { key: 'adId', label: 'Ad ID', type: 'text', visible: true, editable: false, sortable: true, filterable: true, order: 0 },
  { key: 'name', label: 'Ad Name', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 1 },
  { key: 'image', label: 'Image Preview', type: 'image', visible: true, editable: true, sortable: false, filterable: false, order: 2 },
  { key: 'delivery', label: 'Delivery', type: 'status', visible: true, editable: true, sortable: true, filterable: true, order: 3 },
  { key: 'adSetName', label: 'Ad Set Name', type: 'text', visible: true, editable: false, sortable: true, filterable: true, order: 4 },
  { key: 'results', label: 'Results', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 5 },
  { key: 'resultType', label: 'Result Type', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 6 },
  { key: 'reach', label: 'Reach', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 7 },
  { key: 'impressions', label: 'Impressions', type: 'number', visible: true, editable: true, sortable: true, filterable: true, order: 8 },
  { key: 'costPerResult', label: 'Cost per Result', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 9 },
  { key: 'amountSpent', label: 'Amount Spent', type: 'currency', visible: true, editable: true, sortable: true, filterable: true, order: 10 },
  { key: 'qualityRanking', label: 'Quality Ranking', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 11 },
  { key: 'engagementRateRanking', label: 'Engagement Rate', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 12 },
  { key: 'conversionRanking', label: 'Conversion Rate', type: 'text', visible: true, editable: true, sortable: true, filterable: true, order: 13 },
].map(c => ({ ...c, entityType: 'ad' }));

const campaignsData = [
  { name: 'Summer Clothing Sale', budget: 5000, status: 'Active', resultType: 'Link clicks' },
  { name: 'App Installation Promo', budget: 12000, status: 'Active', resultType: 'App installs' },
  { name: 'Brand Awareness - Q3', budget: 3500, status: 'Paused', resultType: 'ThruPlays' },
  { name: 'Retargeting - Cart Abandoners', budget: 6000, status: 'Active', resultType: 'Purchases' },
  { name: 'Black Friday Signup', budget: 15000, status: 'Draft', resultType: 'Leads' },
  { name: 'Holiday Gift Guide', budget: 8000, status: 'Off', resultType: 'Link clicks' },
  { name: 'New Product Launch Video', budget: 10000, status: 'Active', resultType: 'ThruPlays' },
  { name: 'Newsletter Growth Boost', budget: 2000, status: 'Active', resultType: 'Leads' },
  { name: 'Local Store Traffic Campaign', budget: 4500, status: 'Payment error', resultType: 'Directions clicks' },
  { name: 'VIP Customer Offer', budget: 7500, status: 'Active', resultType: 'Purchases' },
];

const mockImages = [
  'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=150&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=150&auto=format&fit=crop&q=60',
];

const seedDatabase = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await ColumnConfig.deleteMany();
    await Campaign.deleteMany();
    await AdSet.deleteMany();
    await Ad.deleteMany();

    console.log('Seeding default users...');
    for (const u of users) {
      await User.create(u);
    }
    console.log('Seeded users successfully.');

    console.log('Seeding column configurations...');
    await ColumnConfig.insertMany([
      ...defaultCampaignColumns,
      ...defaultAdSetColumns,
      ...defaultAdColumns,
    ]);
    console.log('Seeded column configs successfully.');

    console.log('Seeding campaigns, adsets, and ads...');
    for (let cIdx = 0; cIdx < campaignsData.length; cIdx++) {
      const cSeed = campaignsData[cIdx];
      const campaignId = `CAM_${(cIdx + 1).toString().padStart(2, '0')}`;
      
      // Calculate realistic metrics
      const reach = Math.floor(10000 + Math.random() * 50000);
      const impressions = Math.floor(reach * (1.1 + Math.random() * 0.4));
      const results = Math.floor(impressions * (0.01 + Math.random() * 0.05));
      const amountSpent = Math.floor(1500 + Math.random() * (cSeed.budget - 1500));
      const costPerResult = results > 0 ? parseFloat((amountSpent / results).toFixed(2)) : 0;
      const frequency = parseFloat((impressions / reach).toFixed(2));

      const campaign = await Campaign.create({
        name: cSeed.name,
        campaignId,
        delivery: cSeed.status === 'Active' ? 'Active' : cSeed.status,
        bidStrategy: 'Highest volume',
        budget: cSeed.budget,
        budgetType: 'Daily',
        results,
        resultType: cSeed.resultType,
        reach,
        impressions,
        costPerResult,
        amountSpent,
        ends: 'Ongoing',
        frequency,
        status: cSeed.status,
      });

      // Seed 2 AdSets per Campaign
      for (let sIdx = 1; sIdx <= 2; sIdx++) {
        const adSetId = `SET_${campaignId.split('_')[1]}_${sIdx}`;
        const setBudget = Math.floor(campaign.budget / 2);
        const setReach = Math.floor(campaign.reach / 2);
        const setImpressions = Math.floor(campaign.impressions / 2);
        const setResults = Math.floor(campaign.results / 2);
        const setAmountSpent = Math.floor(campaign.amountSpent / 2);
        const setCost = setResults > 0 ? parseFloat((setAmountSpent / setResults).toFixed(2)) : 0;

        const adset = await AdSet.create({
          name: `${campaign.name} - Adset ${sIdx}`,
          adSetId,
          campaignId: campaign.campaignId,
          delivery: campaign.delivery,
          bidStrategy: 'Highest volume',
          budget: setBudget,
          budgetType: 'Daily',
          results: setResults,
          resultType: campaign.resultType,
          reach: setReach,
          impressions: setImpressions,
          costPerResult: setCost,
          amountSpent: setAmountSpent,
          startDate: new Date().toISOString().split('T')[0],
          endDate: 'Ongoing',
          status: campaign.status,
        });

        // Seed 2 Ads per AdSet
        for (let aIdx = 1; aIdx <= 2; aIdx++) {
          const adId = `AD_${adSetId.split('_')[1]}_${adSetId.split('_')[2]}_${aIdx}`;
          const adReach = Math.floor(adset.reach / 2);
          const adImpressions = Math.floor(adset.impressions / 2);
          const adResults = Math.floor(adset.results / 2);
          const adSpent = Math.floor(adset.amountSpent / 2);
          const adCost = adResults > 0 ? parseFloat((adSpent / adResults).toFixed(2)) : 0;
          const rankingOptions = ['Above average', 'Average', 'Below average (bottom 20%)', 'Below average (bottom 35%)'];
          const imgUrl = mockImages[(cIdx + sIdx + aIdx) % mockImages.length];

          await Ad.create({
            name: `${adset.name} - Creative ${aIdx}`,
            adId,
            adSetId: adset.adSetId,
            campaignId: campaign.campaignId,
            delivery: adset.delivery,
            adSetName: adset.name,
            bidStrategy: 'Highest volume',
            budget: Math.floor(adset.budget / 2),
            lastSignificantEdit: new Date().toISOString().split('T')[0],
            results: adResults,
            resultType: adset.resultType,
            reach: adReach,
            impressions: adImpressions,
            costPerResult: adCost,
            amountSpent: adSpent,
            qualityRanking: rankingOptions[Math.floor(Math.random() * rankingOptions.length)],
            engagementRateRanking: rankingOptions[Math.floor(Math.random() * rankingOptions.length)],
            conversionRanking: rankingOptions[Math.floor(Math.random() * rankingOptions.length)],
            status: adset.status,
            image: imgUrl,
          });
        }
      }
    }

    console.log('Seeded 10 campaigns, 20 ad sets, and 40 ads successfully.');
    console.log('Database Seeding Complete!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Error:', error);
    process.exit(1);
  }
};

seedDatabase();
