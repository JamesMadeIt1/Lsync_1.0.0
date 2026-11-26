
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/userModel');

// Generate JWT token
const generateToken = (userId, tokenVersion = 0) => {
  return jwt.sign(
    { id: userId, tokenVersion },
    process.env.JWT_SECRET,
    { expiresIn: '3d' }
  );
};

// Register a new user
const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      username
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    // Check for existing account
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        ...(username
          ? [{ username: username.trim().toLowerCase() }]
          : [])
      ]
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const normalizedUsername = username
      ? username.trim().toLowerCase()
      : (
          name
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '')
            .slice(0, 35) || 'user'
        );
    const generatedUsername = username
      ? normalizedUsername
      : `${normalizedUsername}_${crypto.randomBytes(3).toString('hex')}`;

    // Create user
    const user = await User.create({
      name,
      username: generatedUsername,
      email: normalizedEmail,
      password: hashedPassword
    });

    const token = generateToken(user._id, user.tokenVersion || 0);

    // Never return password hash
    const userData = user.toObject();
    delete userData.password;

    return res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: userData
    });

  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern?.username) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }

    console.error('Registration error:', error);

    return res.status(500).json({
      success: false,
      message: 'Registration failed'
    });
  }
};

// Login existing user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail
    }).select('+password +tokenVersion');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id, user.tokenVersion || 0);

    const userData = user.toObject();
    delete userData.password;

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);

    return res.status(500).json({
      success: false,
      message: 'Login failed'
    });
  }
};

module.exports = { register, login };
