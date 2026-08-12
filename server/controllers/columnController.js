import ColumnConfig from '../models/ColumnConfig.js';
import { logActivity } from '../services/auditLogger.js';

// @desc    Get columns configuration for a specific entity type
// @route   GET /api/columns/:entityType
// @access  Private (All authenticated roles can view columns config)
export const getColumns = async (req, res) => {
  const { entityType } = req.params;

  if (!['campaign', 'adset', 'ad'].includes(entityType)) {
    return res.status(400).json({ success: false, message: 'Invalid entity type' });
  }

  try {
    const columns = await ColumnConfig.find({ entityType }).sort({ order: 1 });
    res.json({
      success: true,
      data: columns,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new column config
// @route   POST /api/columns
// @access  Private (SUPER_ADMIN, ADMIN)
export const createColumn = async (req, res) => {
  const { entityType, key, label, type, visible, editable, sortable, filterable } = req.body;

  try {
    // Check if key already exists for this entity type
    const exists = await ColumnConfig.findOne({ entityType, key });
    if (exists) {
      return res.status(400).json({ success: false, message: `Column with key '${key}' already exists for ${entityType}` });
    }

    // Get the maximum order value for this entity type to append
    const maxOrderCol = await ColumnConfig.findOne({ entityType }).sort({ order: -1 });
    const order = maxOrderCol ? maxOrderCol.order + 1 : 0;

    const column = await ColumnConfig.create({
      entityType,
      key,
      label,
      type,
      visible: visible !== undefined ? visible : true,
      editable: editable !== undefined ? editable : true,
      sortable: sortable !== undefined ? sortable : true,
      filterable: filterable !== undefined ? filterable : true,
      order,
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'CREATE_COLUMN',
      entityType: 'column',
      entityId: column._id.toString(),
      newValue: column,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Column configuration created successfully',
      data: column,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update column configuration details
// @route   PATCH /api/columns/:id
// @access  Private (SUPER_ADMIN, ADMIN)
export const updateColumn = async (req, res) => {
  const { id } = req.params;

  try {
    const column = await ColumnConfig.findById(id);

    if (!column) {
      return res.status(404).json({ success: false, message: 'Column configuration not found' });
    }

    const oldValue = column.toObject();

    // Update fields
    const allowedUpdates = ['label', 'type', 'visible', 'editable', 'sortable', 'filterable', 'order'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        column[field] = req.body[field];
      }
    });

    await column.save();

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'UPDATE_COLUMN',
      entityType: 'column',
      entityId: column._id.toString(),
      oldValue,
      newValue: column,
      req,
    });

    res.json({
      success: true,
      message: 'Column configuration updated successfully',
      data: column,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a column configuration
// @route   DELETE /api/columns/:id
// @access  Private (SUPER_ADMIN, ADMIN)
export const deleteColumn = async (req, res) => {
  const { id } = req.params;

  try {
    const column = await ColumnConfig.findById(id);

    if (!column) {
      return res.status(404).json({ success: false, message: 'Column configuration not found' });
    }

    // Capture old value for log
    const oldValue = column.toObject();

    await ColumnConfig.findByIdAndDelete(id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'DELETE_COLUMN',
      entityType: 'column',
      entityId: id,
      oldValue,
      req,
    });

    res.json({
      success: true,
      message: 'Column configuration deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk reorder columns configurations
// @route   PATCH /api/columns/reorder
// @access  Private (SUPER_ADMIN, ADMIN)
export const reorderColumns = async (req, res) => {
  const { columns } = req.body; // Expects array of { id: string, order: number }

  if (!Array.isArray(columns)) {
    return res.status(400).json({ success: false, message: 'Invalid payload: columns must be an array' });
  }

  try {
    const bulkOps = columns.map((col) => ({
      updateOne: {
        filter: { _id: col.id },
        update: { $set: { order: col.order } },
      },
    }));

    await ColumnConfig.bulkWrite(bulkOps);

    // Log Activity (summarized)
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'REORDER_COLUMNS',
      entityType: 'column',
      entityId: 'bulk',
      newValue: columns,
      req,
    });

    res.json({
      success: true,
      message: 'Columns reordered successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
