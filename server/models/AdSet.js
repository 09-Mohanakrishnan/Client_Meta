import mongoose from 'mongoose';

const adSetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    adSetId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    campaignId: {
      type: String,
      required: true,
      index: true,
    },
    delivery: {
      type: String,
      default: 'Active',
    },
    bidStrategy: {
      type: String,
      default: 'Highest volume',
    },
    budget: {
      type: Number,
      default: 0,
    },
    budgetType: {
      type: String,
      enum: ['Daily', 'Lifetime'],
      default: 'Daily',
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
    amountSpent: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: String,
      default: '',
    },
    endDate: {
      type: String,
      default: 'Ongoing',
    },
    status: {
      type: String,
      enum: ['Active', 'Off', 'Payment error', 'Draft', 'Paused'],
      default: 'Draft',
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Index for text search
adSetSchema.index({ name: 'text', adSetId: 'text' });

const AdSet = mongoose.model('AdSet', adSetSchema);
export default AdSet;
