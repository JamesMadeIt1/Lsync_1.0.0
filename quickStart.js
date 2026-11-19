var fs = require('fs');
var os = require('os');
var path = require('path');
var readline = require('readline');
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
require('dotenv').config();

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/youtube-nodejs-quickstart.json
var SCOPES = ['https://www.googleapis.com/auth/youtube.readonly'];
var CLIENT_SECRET_PATH = path.join(__dirname, 'client_secret.json');
var TOKEN_DIR = path.join(os.homedir(), '.credentials');
var TOKEN_PATH = path.join(TOKEN_DIR, 'youtube-nodejs-quickstart.json');

// Load client secrets from a local file.
fs.readFile(CLIENT_SECRET_PATH, 'utf8', function processClientSecrets(err, content) {
  if (err) {
    console.error(
      'Could not read client_secret.json next to quickStart.js:',
      err.message
    );
    process.exitCode = 1;
    return;
  }

  try {
    // Authorize a client with the loaded credentials, then call the YouTube API.
    authorize(JSON.parse(content), getChannel);
  } catch (error) {
    console.error('Could not start YouTube authorization:', error.message);
    process.exitCode = 1;
  }
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  var clientConfig = credentials.installed || credentials.web;

  if (!clientConfig || !clientConfig.client_id || !clientConfig.client_secret) {
    throw new Error(
      'The credentials file must contain an installed or web OAuth client.'
    );
  }

  var redirectUrl = process.env.GOOGLE_REDIRECT_URI ||
      (clientConfig.redirect_uris && clientConfig.redirect_uris[0]);

  if (!redirectUrl) {
    throw new Error(
      'No redirect URI found. Set GOOGLE_REDIRECT_URI in .env to a URI ' +
      'registered for this OAuth client.'
    );
  }

  var clientSecret = clientConfig.client_secret;
  var clientId = clientConfig.client_id;
  var oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, 'utf8', function(err, token) {
    if (err) {
      if (err.code !== 'ENOENT') {
        console.error('Could not read saved YouTube token:', err.message);
        process.exitCode = 1;
        return;
      }

      getNewToken(oauth2Client, callback);
    } else {
      try {
        oauth2Client.setCredentials(JSON.parse(token));
      } catch (parseError) {
        console.error('Saved YouTube token is invalid:', parseError.message);
        process.exitCode = 1;
        return;
      }

      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  rl.question('Enter the code from that page here: ', function(code) {
    rl.close();
    oauth2Client.getToken(code, function(err, token) {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), { mode: 0o600 }, (err) => {
    if (err) throw err;
    console.log('Token stored to ' + TOKEN_PATH);
  });
}

/**
 * Lists the names and IDs of up to 10 files.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function getChannel(auth) {
  var service = google.youtube('v3');
  service.channels.list({
    auth: auth,
    part: 'snippet,contentDetails,statistics',
    forUsername: 'GoogleDevelopers'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var channels = response.data.items;
    if (channels.length == 0) {
      console.log('No channel found.');
    } else {
      console.log('This channel\'s ID is %s. Its title is \'%s\', and ' +
                  'it has %s views.',
                  channels[0].id,
                  channels[0].snippet.title,
                  channels[0].statistics.viewCount);
    }
  });
}