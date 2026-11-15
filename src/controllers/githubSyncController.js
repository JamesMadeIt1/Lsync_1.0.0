
const ConnectedAccount = require('../models/connectedAccountModel');
const GitHubActivity = require('../models/githubActivityModel');
const { decryptGitHubToken } = require('../utils/githubToken');

const syncGitHubCommits = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;
    const repository = `${owner}/${repo}`;

    const account = await ConnectedAccount.findOne({
      user: req.user,
      provider: 'GitHub',
      status: 'connected'
    }).select('+accessTokenEncrypted');

    if (!account) {
      return res.status(404).json({
        success: false,
        message: 'No connected GitHub account found'
      });
    }

    if (!account.accessTokenEncrypted) {
      return res.status(409).json({
        success: false,
        message: 'GitHub connection has no stored token'
      });
    }

    if (
      account.tokenExpiresAt &&
      account.tokenExpiresAt <= new Date()
    ) {
      return res.status(409).json({
        success: false,
        message: 'GitHub token has expired. Reconnect GitHub.'
      });
    }

    const accessToken = decryptGitHubToken(
      account.accessTokenEncrypted
    );

    const githubUrl = new URL(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/commits`
    );

    githubUrl.searchParams.set('per_page', '30');

    const response = await fetch(githubUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'LSync-MVP',
        'X-GitHub-Api-Version': '2022-11-28'
      },
      signal: AbortSignal.timeout(10000)
    });

    if (response.status === 401) {
      return res.status(409).json({
        success: false,
        message: 'GitHub authorization is invalid. Reconnect GitHub.'
      });
    }

    if (response.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'GitHub repository not found or inaccessible'
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: 'Unable to retrieve commits from GitHub',
        githubStatus: response.status
      });
    }

    const commits = await response.json();


let matchedCount = 0;
let unverifiedCount = 0;

  const operations = commits.map(commit => {
  const githubAuthorId = commit.author?.id
    ? String(commit.author.id)
    : null;

  const githubAuthorLogin = commit.author?.login || null;

  const isAuthorMatched =
    githubAuthorId !== null &&
    githubAuthorId === account.externalAccountId;

  const verificationStatus = isAuthorMatched
    ? 'matched'
    : 'unverified';


if (isAuthorMatched) {
  matchedCount++;
} else {
  unverifiedCount++;
}


  return {
    updateOne: {
      filter: {
        user: req.user,
        repository,
        commitSha: commit.sha
      },
      update: {
        $set: {
          githubAuthorId,
          githubAuthorLogin,
          verificationStatus,
          verifiedAt: new Date()
        },
        $setOnInsert: {
          user: req.user,
          provider: 'GitHub',
          repository,
          commitSha: commit.sha,
          message: commit.commit.message,
          author: commit.commit.author?.name || 'Unknown',
          committedAt: commit.commit.author?.date,
          commitUrl: commit.html_url,
          syncedAt: new Date()
        }
      },
      upsert: true
    }
  };
});

    let insertedCount = 0;

    if (operations.length > 0) {
      const result = await GitHubActivity.bulkWrite(operations, {
        ordered: false
      });

      insertedCount = result.upsertedCount;
    }

    return res.status(200).json({
      success: true,
      message: 'GitHub commits synchronized successfully',
      provider: 'GitHub',
      repository,
      fetched: commits.length,
      inserted: insertedCount,
    alreadyExisting: commits.length - insertedCount,
    verification: {
  matched: matchedCount,
  unverified: unverifiedCount
}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  syncGitHubCommits
};
