import User from '../models/User.js';
import { logActivity } from '../services/auditLogger.js';

// @desc    Get all users
// @route   GET /api/users
// @access  Private (SUPER_ADMIN only)
export const getUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').sort({ createdAt: -1 });
    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a user
// @route   POST /api/users
// @access  Private (SUPER_ADMIN only)
export const createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'VIEWER',
    });

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_CREATE_USER',
      entityType: 'user',
      entityId: user._id.toString(),
      newValue: { name: user.name, email: user.email, role: user.role },
      req,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a user
// @route   PATCH /api/users/:id
// @access  Private (SUPER_ADMIN only)
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const oldValue = { name: user.name, email: user.email, role: user.role };

    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (password) user.password = password; // pre-save hook will hash this!

    await user.save();

    const newValue = { name: user.name, email: user.email, role: user.role };

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_UPDATE_USER',
      entityType: 'user',
      entityId: user._id.toString(),
      oldValue,
      newValue,
      req,
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (SUPER_ADMIN only)
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting oneself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const oldValue = { name: user.name, email: user.email, role: user.role };

    await User.findByIdAndDelete(id);

    // Log Activity
    await logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      action: 'ADMIN_DELETE_USER',
      entityType: 'user',
      entityId: id,
      oldValue,
      req,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
