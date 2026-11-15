
const ConnectedAccount = require('../models/connectedAccountModel');

const {
  decryptGitHubToken
} = require('../utils/githubToken');

const getGitHubRepositories = async (req, res, next) => {
  try {
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

    const response = await fetch(
      'https://api.github.com/user/repos?per_page=30&sort=updated&direction=desc',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'LSync-MVP',
          'X-GitHub-Api-Version': '2022-11-28'
        },
        signal: AbortSignal.timeout(10000)
      }
    );

    if (response.status === 401) {
      return res.status(409).json({
        success: false,
        message: 'GitHub authorization is invalid. Reconnect GitHub.'
      });
    }

    if (!response.ok) {
      return res.status(502).json({
        success: false,
        message: 'Unable to retrieve repositories from GitHub',
        githubStatus: response.status
      });
    }

    const repositories = await response.json();

    const formattedRepositories = repositories.map(
      (repo) => ({
        githubId: String(repo.id),
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        url: repo.html_url,
        language: repo.language,
        private: repo.private,
        fork: repo.fork,
        stars: repo.stargazers_count,
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        pushedAt: repo.pushed_at
      })
    );

    return res.status(200).json({
      success: true,
      provider: 'GitHub',
      username: account.username,
      count: formattedRepositories.length,
      data: formattedRepositories
    });

  } catch (error) {
    next(error);
  }
};


const getGitHubCommits = async (req, res, next) => {
  try {
    const { owner, repo } = req.params;

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

    const formattedCommits = commits.map((commit) => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: commit.commit.author?.name,
      date: commit.commit.author?.date,
      url: commit.html_url
    }));

    return res.status(200).json({
      success: true,
      provider: 'GitHub',
      repository: `${owner}/${repo}`,
      count: formattedCommits.length,
      data: formattedCommits
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getGitHubRepositories,
  getGitHubCommits
};
