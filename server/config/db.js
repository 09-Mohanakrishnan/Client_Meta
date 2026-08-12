import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import ColumnConfig from '../models/ColumnConfig.js';
import Campaign from '../models/Campaign.js';
import AdSet from '../models/AdSet.js';
import Ad from '../models/Ad.js';

dotenv.config();

const usersToSeed = [
  { name: 'Super Admin User', email: 'superadmin@adflow.com', password: 'Password123', role: 'SUPER_ADMIN' },
  { name: 'Admin User', email: 'admin@adflow.com', password: 'Password123', role: 'ADMIN' },
  { name: 'Editor User', email: 'editor@adflow.com', password: 'Password123', role: 'EDITOR' },
  { name: 'Viewer User', email: 'viewer@adflow.com', password: 'Password123', role: 'VIEWER' },
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

const initialCampaigns = [
  { name: 'Mountain Farmhouse', budget: 500, status: 'Active', resultType: 'Calls placed', delivery: 'Payment error' },
  { name: 'Chennai_TEXT_ONLY', budget: 150, status: 'Active', resultType: 'Calls placed', delivery: 'Payment error' },
  { name: 'Near Chennai_TEXT', budget: 400, status: 'Active', resultType: 'Reach', delivery: 'Payment error' },
  { name: 'Own a beautifull farmhouse - #1', budget: 200, status: 'Active', resultType: 'Calls placed', delivery: 'Payment error' },
  { name: 'Own a Beautifull farmhouse', budget: 400, status: 'Active', resultType: 'Reach', delivery: 'Payment error' },
  { name: 'Instagram post: Farming by kids. Explore More...', budget: 288, status: 'Off', resultType: 'Instagram profile visits', delivery: 'Off' },
  { name: 'Instagram post: Catch fish with bare hands and...', budget: 1215, status: 'Off', resultType: 'Instagram profile visits', delivery: 'Off' },
  { name: '125 SFT IMG - Insta', budget: 100, status: 'Off', resultType: 'Interactions', delivery: 'Off' },
  { name: '125 SFT - Reach', budget: 858, status: 'Off', resultType: 'Reach', delivery: 'Off' },
  { name: 'Sp Koil Offer - Traffic', budget: 600, status: 'Off', resultType: 'Landing page views', delivery: 'Off' },
];

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database empty. Auto-seeding initial users...');
      for (const u of usersToSeed) {
        await User.create(u);
      }
      console.log('Seeded 4 default users successfully.');

      const colCount = await ColumnConfig.countDocuments();
      if (colCount === 0) {
        await ColumnConfig.insertMany([
          ...defaultCampaignColumns,
          ...defaultAdSetColumns,
          ...defaultAdColumns,
        ]);
        console.log('Seeded column configs successfully.');
      }

      const campaignCount = await Campaign.countDocuments();
      if (campaignCount === 0) {
        for (let idx = 0; idx < initialCampaigns.length; idx++) {
          const cData = initialCampaigns[idx];
          const campaignId = `CAM_${(idx + 1).toString().padStart(2, '0')}`;
          const reach = Math.floor(15000 + Math.random() * 50000);
          const impressions = Math.floor(reach * 1.2);
          const results = Math.floor(impressions * 0.02);
          const amountSpent = Math.floor(cData.budget * 0.8);
          const costPerResult = results > 0 ? parseFloat((amountSpent / results).toFixed(2)) : 0;

          await Campaign.create({
            name: cData.name,
            campaignId,
            delivery: cData.delivery,
            bidStrategy: 'Highest volume',
            budget: cData.budget,
            budgetType: 'Daily',
            results,
            resultType: cData.resultType,
            reach,
            impressions,
            costPerResult,
            amountSpent,
            ends: 'Ongoing',
            frequency: 1.25,
            status: cData.status,
          });
        }
        console.log('Seeded initial campaigns successfully.');
      }
    }
  } catch (err) {
    console.error('Auto-seed check failed:', err.message);
  }
};

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await autoSeedIfEmpty();
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
