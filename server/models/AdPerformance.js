import mongoose from 'mongoose';

const adPerformanceSchema = new mongoose.Schema(
  {
    campaignId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    adSetId: {
      type: String,
      index: true,
      trim: true,
      default: '',
    },
    adId: {
      type: String,
      index: true,
      trim: true,
      default: '',
    },
    date: {
      type: String, // Format: 'YYYY-MM-DD' for daily performance
      index: true,
      default: '',
    },
    reportingStarts: {
      type: String, // Format: 'YYYY-MM-DD'
      index: true,
      default: '',
    },
    reportingEnds: {
      type: String, // Format: 'YYYY-MM-DD'
      index: true,
      default: '',
    },
    isDaily: {
      type: Boolean,
      default: false,
      index: true,
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
  },
  {
    timestamps: true,
    strict: false,
  }
);

// Compound indexes for fast query filtering
adPerformanceSchema.index({ campaignId: 1, date: 1, isDaily: 1 });
adPerformanceSchema.index({ adSetId: 1, date: 1, isDaily: 1 });
adPerformanceSchema.index({ adId: 1, date: 1, isDaily: 1 });
adPerformanceSchema.index({ campaignId: 1, reportingStarts: 1, reportingEnds: 1 });
adPerformanceSchema.index({ adSetId: 1, reportingStarts: 1, reportingEnds: 1 });
adPerformanceSchema.index({ adId: 1, reportingStarts: 1, reportingEnds: 1 });

const AdPerformance = mongoose.model('AdPerformance', adPerformanceSchema);
export default AdPerformance;
