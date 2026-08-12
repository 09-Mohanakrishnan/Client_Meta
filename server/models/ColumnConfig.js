import mongoose from 'mongoose';

const columnConfigSchema = new mongoose.Schema(
  {
    entityType: {
      type: String,
      required: true,
      enum: ['campaign', 'adset', 'ad'],
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        'text',
        'number',
        'currency',
        'percentage',
        'date',
        'datetime',
        'boolean',
        'status',
        'select',
        'image',
        'link',
      ],
    },
    visible: {
      type: Boolean,
      default: true,
    },
    editable: {
      type: Boolean,
      default: true,
    },
    sortable: {
      type: Boolean,
      default: true,
    },
    filterable: {
      type: Boolean,
      default: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of key per entity type
columnConfigSchema.index({ entityType: 1, key: 1 }, { unique: true });

const ColumnConfig = mongoose.model('ColumnConfig', columnConfigSchema);
export default ColumnConfig;
