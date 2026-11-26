const User = require('../models/userModel');
const LearningLog = require('../models/learningLogModel');
const Platform = require('../models/platformModel');

const getAllUsers = async (req, res) => {
  const users = await User.find()
    .select('_id name username email role createdAt')
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: users });
};

const getMe = async (req,res) => {
  const user = await User.findById(req.user).populate('track').select('-password');
  res.json({ success:true, data:user });
};

const updateProfile = async (req,res) => {
  const { name, username, bio, avatar, track, headline, interests } = req.body;
  const user = await User.findById(req.user);
  if (username && username.toLowerCase() !== user.username) {
    const exists = await User.findOne({ username: username.toLowerCase() });
    if (exists) return res.status(409).json({
      success: false,
      message: 'Username already exists'
    });
  }
  const updates = {};
  for (const field of ['name', 'bio', 'avatar', 'track', 'headline', 'interests']) {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  }
  if (username) updates.username = username.toLowerCase();

  const updated = await User.findByIdAndUpdate(req.user,
    updates,
    { new:true, runValidators:true }
  ).select('-password');
  res.json({ success:true, data:updated });
};

const updatePassword = async (req,res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user);
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) return res.status(400).json({
    success: false,
    message: 'Current password is incorrect'
  });
  user.password = newPassword;
  await user.save();
  res.json({ success:true, message:'Password updated' });
};

const updatePrivacy = async (req,res) => {
  const { isPublic, showStats, showPlatforms } = req.body;
  const user = await User.findByIdAndUpdate(req.user, 
    { isPublic, showStats, showPlatforms },
    { new:true }
  ).select('-password');
  res.json({ success:true, data:user });
};

const addPlatformAccount = async (req,res) => {
  const { platformId, platformUsername, profileUrl } = req.body;
  const platform = await Platform.findById(platformId);
  if (!platform) return res.status(404).json({
    success: false,
    message: 'Platform not found'
  });
  
  const user = await User.findById(req.user);
  const exists = user.linkedAccounts.find(a => a.platform.toString() === platformId);
  if (exists) return res.status(409).json({
    success: false,
    message: 'Platform already linked'
  });

  user.linkedAccounts.push({ platform: platformId, platformUsername, profileUrl });
  await user.save();
  await user.populate('linkedAccounts.platform');
  res.json({ success:true, data:user.linkedAccounts });
};

const removePlatformAccount = async (req,res) => {
  const { accountId } = req.params;
  const user = await User.findById(req.user);
  user.linkedAccounts = user.linkedAccounts.filter(a => a._id.toString() !== accountId);
  await user.save();
  res.json({ success:true });
};

const deleteAccount = async (req,res) => {
  const { password } = req.body;
  const user = await User.findById(req.user);
  const isMatch = await user.comparePassword(password);
  if (!isMatch) return res.status(400).json({
    success: false,
    message: 'Password is incorrect'
  });
  
  await LearningLog.deleteMany({ user: req.user });
  await Platform.deleteMany({ user: req.user });
  await User.findByIdAndDelete(req.user);
  res.json({ success:true, message:'Account and all data deleted permanently' });
};


module.exports = {
 getAllUsers,
 getMe,
 updateProfile,
 updatePassword,
 updatePrivacy,
 addPlatformAccount,
 removePlatformAccount,
 deleteAccount   
};

