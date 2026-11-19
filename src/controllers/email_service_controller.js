const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/userModel');
const PasswordResetToken = require('../models/passwordResetTokenModel');
const { sendEmail } = require('../Email.service/Email.service');

const RESET_TOKEN_TTL_MS = 15 * 60 * 1000;
const GENERIC_FORGOT_PASSWORD_MESSAGE =
  'If an account exists for this email, password reset instructions will be sent.';

const hashResetToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

const getResetUrl = (token) => {
  const configuredUrl = process.env.PASSWORD_RESET_URL;

  if (!configuredUrl) {
    throw new Error('PASSWORD_RESET_URL must be configured');
  }

  const resetUrl = new URL(configuredUrl);

  if (!['http:', 'https:'].includes(resetUrl.protocol)) {
    throw new Error('PASSWORD_RESET_URL must use HTTP or HTTPS');
  }

  if (token) {
    resetUrl.searchParams.set('token', token);
  }

  return resetUrl.toString();
};

const forgotPassword = async (req, res, next) => {
  try {
    getResetUrl();
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select('_id');

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(token);
      const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      const resetUrl = getResetUrl(token);

      await PasswordResetToken.findOneAndUpdate(
        { user: user._id },
        { $set: { tokenHash, expiresAt } },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      try {
        await sendEmail({
          to: email,
          subject: 'Reset your LSync password',
          text:
            `Use this link within 15 minutes to reset your password: ${resetUrl}\n\n` +
            'If you did not request a password reset, you can ignore this email.',
          html:
            `<p>Use the link below within 15 minutes to reset your LSync password.</p>` +
            `<p><a href="${resetUrl}">Reset password</a></p>` +
            '<p>If you did not request a password reset, you can ignore this email.</p>'
        });
      } catch (error) {
        await PasswordResetToken.deleteOne({
          user: user._id,
          tokenHash
        });
        console.error('Password reset email delivery failed:', error.message);
      }
    }

    return res.status(202).json({
      message: GENERIC_FORGOT_PASSWORD_MESSAGE
    });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const resetToken = await PasswordResetToken.findOneAndDelete({
      tokenHash: hashResetToken(token),
      expiresAt: { $gt: new Date() }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    const user = await User.findById(resetToken.user)
      .select('+tokenVersion');

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();
    await PasswordResetToken.deleteMany({ user: user._id });

    return res.status(200).json({
      success: true,
      message: 'Password reset successfully. Please log in with your new password.'
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  forgotPassword,
  resetPassword
};
