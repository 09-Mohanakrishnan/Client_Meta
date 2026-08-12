import AuditLog from '../models/AuditLog.js';

// @desc    Get all audit logs (paginated, searched)
// @route   GET /api/audit-logs
// @access  Private (SUPER_ADMIN only)
export const getAuditLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Search by email, action, or entityType
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { userEmail: { $regex: searchRegex } },
        { action: { $regex: searchRegex } },
        { entityType: { $regex: searchRegex } },
        { entityId: { $regex: searchRegex } },
      ];
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AuditLog.countDocuments(query);

    res.json({
      success: true,
      data: {
        logs,
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
