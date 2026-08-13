import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    campaignId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
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
    ends: {
      type: String,
      default: 'Ongoing',
    },
    frequency: {
      type: Number,
      default: 1.0,
    },
    status: {
      type: String,
      enum: ['Active', 'Off', 'Payment error', 'Draft', 'Paused'],
      default: 'Draft',
    },
    reportingStarts: {
      type: String,
    },
    reportingEnds: {
      type: String,
    },
  },
  {
    timestamps: true,
    strict: false, // Allows saving dynamic fields directly to the document
  }
);

// Index for text search
campaignSchema.index({ name: 'text', campaignId: 'text' });

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
