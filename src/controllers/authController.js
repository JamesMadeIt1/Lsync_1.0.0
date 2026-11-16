
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: '3d' }
  );
};

// Register a new user
const register = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      bio,
      location,
      avatar,
      currentRole,
      targetRole,
      track,
      isPublic
    } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    // Check for existing account
    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { username: normalizedUsername }
      ]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      username: normalizedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      bio,
      location,
      avatar,
      currentRole,
      targetRole,
      track,
      isPublic
    });

    const token = generateToken(user._id);

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
      return res.status(409).json({
        success: false,
        message: 'Email or username already exists'
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
    }).select('+password');

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

    const token = generateToken(user._id);

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
