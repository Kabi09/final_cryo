import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { logAudit } from '../middleware/audit.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'cryo_production_secret_key_2026_enterprise_jwt', {
    expiresIn: '30d'
  });
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.active) {
      return res.status(403).json({ message: 'Account is deactivated. Contact administrator.' });
    }

    user.lastLogin = new Date();
    await user.save();

    await logAudit({
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: user._id,
      entityNumber: user.email,
      performedBy: user.name,
      userRole: user.role,
      details: `User logged in from ${req.ip || 'local'}`
    });

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      department: user.department,
      token: generateToken(user._id)
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
};

export const getProfile = async (req, res) => {
  res.json(req.user);
};

export const listUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
