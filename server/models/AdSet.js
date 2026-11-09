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
      required: false,
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
      set: (v) => (!v || v === '0' || v === 0 || !['Daily', 'Lifetime'].includes(v) ? 'Daily' : v),
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
    frequency: {
      type: Number,
      default: 1.0,
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

adSetSchema.pre('validate', function(next) {
  if (!this.budgetType || this.budgetType === '0' || this.budgetType === 0 || !['Daily', 'Lifetime'].includes(this.budgetType)) {
    this.budgetType = 'Daily';
  }
  next();
});

const AdSet = mongoose.model('AdSet', adSetSchema);
export default AdSet;
