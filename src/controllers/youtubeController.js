const crypto = require('crypto');
const { google } = require('googleapis');

const ConnectedAccount = require('../models/connectedAccountModel');
const OAuthState = require('../models/oauthStateModel');
const Platform = require('../models/platformModel');
const { encryptToken } = require('../utils/tokenEncryption');

const YOUTUBE_READONLY_SCOPE =
  'https://www.googleapis.com/auth/youtube.readonly';

const hashState = (state) =>
  crypto.createHash('sha256').update(state).digest('hex');

const createOAuthClient = () => {
  const {
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
  } = process.env;

  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
    throw new Error(
    'GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI ' +
    'must be configured'
    );
  }

  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI
  );
};

const connectYouTube = async (req, res, next) => {
  try {
    const oauthClient = createOAuthClient();
    const state = crypto.randomBytes(32).toString('hex');

    await OAuthState.create({
      stateHash: hashState(state),
      user: req.user,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    const authorizationUrl = oauthClient.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        YOUTUBE_READONLY_SCOPE,
        'openid',
        'profile'
      ],
      state
    });

    return res.status(200).json({
      success: true,
      authorizationUrl
    });
  } catch (error) {
    return next(error);
  }
};

const youtubeCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (typeof state !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Missing OAuth state'
      });
    }

    const pending = await OAuthState.findOneAndDelete({
      stateHash: hashState(state),
      expiresAt: { $gt: new Date() }
    });

    if (!pending) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired OAuth state'
      });
    }

    if (error || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Google authorization was not completed'
      });
    }

    const oauthClient = createOAuthClient();
    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.id_token) {
      throw new Error('Google did not return an identity token');
    }

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const googleProfile = ticket.getPayload();

    if (!googleProfile || !googleProfile.sub) {
      throw new Error('Google identity response is missing an account ID');
    }

    const accountQuery = {
      user: pending.user,
      provider: 'YouTube',
      externalAccountId: String(googleProfile.sub)
    };

    const existingAccount = await ConnectedAccount.findOne(accountQuery)
      .select('+refreshTokenEncrypted');

    if (
      !tokens.refresh_token &&
      !existingAccount?.refreshTokenEncrypted
    ) {
      return res.status(400).json({
        success: false,
        message:
          'Google did not return a refresh token. Revoke LSync access in ' +
          'your Google account and try again.'
      });
    }

    const encryptedRefreshToken = tokens.refresh_token
      ? encryptToken(
          tokens.refresh_token,
          'YOUTUBE_TOKEN_ENCRYPTION_KEY'
        )
      : null;

    const platform = await Platform.findOneAndUpdate(
      {
        user: pending.user,
        type: 'Youtube'
      },
      {
        $set: { name: 'YouTube' },
        $setOnInsert: {
          user: pending.user,
          type: 'Youtube'
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    const accountUpdates = {
      platform: platform._id,
      username: googleProfile.name || 'YouTube account',
      status: 'connected',
      lastSyncError: null
    };

    if (encryptedRefreshToken) {
      accountUpdates.refreshTokenEncrypted = encryptedRefreshToken;
    }

    const connectedAccount = await ConnectedAccount.findOneAndUpdate(
      accountQuery,
      { $set: accountUpdates },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    return res.status(200).json({
      success: true,
      message: 'YouTube account connected successfully',
      data: {
        id: connectedAccount._id,
        provider: connectedAccount.provider,
        username: connectedAccount.username,
        status: connectedAccount.status
      }
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  connectYouTube,
  youtubeCallback
};
