import mongoose from 'mongoose';

const adSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    adId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    adSetId: {
      type: String,
      required: false,
      index: true,
    },
    campaignId: {
      type: String,
      required: false,
      index: true,
    },
    delivery: {
      type: String,
      default: 'Active',
    },
    adSetName: {
      type: String,
      default: '',
    },
    bidStrategy: {
      type: String,
      default: 'Highest volume',
    },
    budget: {
      type: Number,
      default: 0,
    },
    lastSignificantEdit: {
      type: String,
      default: '',
    },
    results: {
      type: Number,
      default: 0,
    },
    resultType: {
      type: String,
      default: 'Link clicks',
    },
    reach: {
      type: Number,
      default: 0,
    },
    impressions: {
      type: Number,
      default: 0,
    },
    costPerResult: {
      type: Number,
      default: 0,
    },
    qualityRanking: {
      type: String,
      default: 'Average',
    },
    engagementRateRanking: {
      type: String,
      default: 'Average',
    },
    conversionRanking: {
      type: String,
      default: 'Average',
    },
    amountSpent: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['Active', 'Off', 'Payment error', 'Draft', 'Paused'],
      default: 'Draft',
    },
    image: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Index for text search
adSchema.index({ name: 'text', adId: 'text' });

const Ad = mongoose.model('Ad', adSchema);
export default Ad;
