
const crypto = require('crypto');

const OAuthState = require('../models/oauthStateModel');
const Platform = require('../models/platformModel');
const ConnectedAccount = require('../models/connectedAccountModel');
const { encryptToken } = require('../utils/tokenEncryption');

const CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

const hashState = (state) =>
  crypto.createHash('sha256').update(state).digest('hex');

// STEP 1: Start GitHub OAuth
const connectGitHub = async (req, res, next) => {
  try {
    const state = crypto.randomBytes(32).toString('hex');

    await OAuthState.create({
      stateHash: hashState(state),
      user: req.user,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      redirect_uri: CALLBACK_URL,
      state,
      scope: 'read:user'
    });

    const authorizationUrl =
      `https://github.com/login/oauth/authorize?${params}`;

    return res.status(200).json({
      success: true,
      authorizationUrl
    });
  } catch (error) {
    next(error);
  }
};

// STEP 2: Handle GitHub callback
const githubCallback = async (req, res, next) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: 'GitHub authorization was not completed'
      });
    }

    if (
      typeof code !== 'string' ||
      typeof state !== 'string'
    ) {
      return res.status(400).json({
        success: false,
        message: 'Missing OAuth code or state'
      });
    }

    // Consume the state exactly once
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

    // Exchange authorization code for access token
    const tokenResponse = await fetch(
      'https://github.com/login/oauth/access_token',
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          client_id: CLIENT_ID,
          client_secret: CLIENT_SECRET,
          code,
          redirect_uri: CALLBACK_URL
        }),
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!tokenResponse.ok) {
      throw new Error('GitHub token exchange failed');
    }

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token || tokenData.error) {
      return res.status(400).json({
        success: false,
        message: 'GitHub did not authorize the connection'
      });
    }

    const accessToken = tokenData.access_token;

    // Retrieve the authorized GitHub identity
    const profileResponse = await fetch(
      'https://api.github.com/user',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'LSync-MVP'
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!profileResponse.ok) {
      throw new Error('Unable to retrieve GitHub profile');
    }

    const profile = await profileResponse.json();

    if (!profile.id || !profile.login) {
      throw new Error('Invalid GitHub profile response');
    }

    const platform = await Platform.findOneAndUpdate(
      {
        user: pending.user,
        type: 'GitHub'
      },
      {
        $set: { name: 'GitHub' },
        $setOnInsert: {
          user: pending.user,
          type: 'GitHub'
        }
      },
      {
        upsert: true,
        new: true,
        runValidators: true
      }
    );

    const encryptedToken = encryptToken(
      accessToken,
      'GITHUB_TOKEN_ENCRYPTION_KEY'
    );

    const connectedAccount =
      await ConnectedAccount.findOneAndUpdate(
        {
          user: pending.user,
          provider: 'GitHub',
          externalAccountId: String(profile.id)
        },
        {
          $set: {
            platform: platform._id,
            username: profile.login,
            profileUrl: profile.html_url,
            status: 'connected',
            lastSyncError: null,
            accessTokenEncrypted: encryptedToken,
            tokenExpiresAt: tokenData.expires_in
              ? new Date(
                  Date.now() + tokenData.expires_in * 1000
                )
              : null
          }
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

    return res.status(200).json({
      success: true,
      message: 'GitHub account connected successfully',
      data: {
        id: connectedAccount._id,
        provider: connectedAccount.provider,
        username: connectedAccount.username,
        profileUrl: connectedAccount.profileUrl,
        status: connectedAccount.status
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  connectGitHub,
  githubCallback
};
