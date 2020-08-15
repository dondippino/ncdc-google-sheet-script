/**
 * @license
 * Copyright Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// [START sheets_quickstart]
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const amqplib = require('amqplib');
const config = require('config');

var Promise = require('promise');
const QUEUE = config.get('QUEUE');
const spreadsheetId = config.get('spreadsheetId');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

readCredentials = async (credentials) => {
  // Load client secrets from a local file.
  let content = await new Promise((resolve, reject) => {
    fs.readFile(credentials, 'utf8', (err, content) => {
      if (err) {
        reject(err);
        return console.log('Error loading client secret file:', err)
      };
      // Authorize a client with credentials, then call the Google Sheets API.
      // authorize(JSON.parse(content), appendToSheet);
      resolve(JSON.parse(content));
    });
  });
  return content;
}


// processData('/home/dipo/ncdc-auto-script/archive/mutations/current_mutation');
/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
authorize = async (credentials) => {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id, client_secret, redirect_uris[0]);

  let auth = await new Promise((resolve, reject) => {
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getNewToken(oAuth2Client);
      oAuth2Client.setCredentials(JSON.parse(token));
      resolve(oAuth2Client);
    });
  });
  return auth;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      // callback(oAuth2Client);
    });
  });
}
https://docs.google.com/spreadsheets/d/e/2PACX-1vTjv_Pgn28I1-A4JTn6K1yUSPR4mh9e_m134Jj-SZav3H1QTHqNukF6iHZpP6JcIg/pub?output=xlsx
/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({version: 'v4', auth});
  sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A2:F',
  }, (err, res) => {
    if (err) return console.log('The API returned an error: ' + err);
    const rows = res.data.values;
    console.log(rows.length);
    if (rows.length) {
      // console.log('Name, Major:');
      // Print columns A and E, which correspond to indices 0 and 4.
      rows.map((row) => {
        // console.log(`${row[0]},${row[1]},${row[2]},${row[3]}, ${row[4]}, ${row[5]}`);
      });

    } else {
      console.log('No data found.');
    }
  });
}

appendToSheet = (auth, data) => {
  const sheets = google.sheets({ version: 'v4', auth });
  var body = {
    values: data
  };
  sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId,
    range: 'Sheet1!A2:F',
    valueInputOption: 'USER_ENTERED',
    resource: body
  }, (err, result) => {
    if (err) {
      // Handle error.
      console.log(err);
    } else {
      console.log(result);
      // console.log(`${result.updates.updatedCells} cells appended.`);
    }
  });
}

processData =  (pathToFile) => {
 
  return new Promise((resolve, reject) => {
    fs.readFile(pathToFile, 'utf8', function (err, data) {
      if(err){ reject(err); }
      dataObject = JSON.parse(data);
      var dateOfReport = dataObject.date_of_report;
      var payload = Object.assign({}, dataObject);
      delete (payload['date_of_report']);
      var arrayOfObjects = Object.values(payload);
      var arrayOfArrays = arrayOfObjects.map(function (report) {
        var x = [];
        x[0] = dateOfReport;
        x[1] = report['No. of Cases (Lab Confirmed)'];
        x[2] = 'Nigeria';
        x[3] = report['States Affected'];
        x[4] = report['No. of Deaths'];
        x[5] = report['No. Discharged'];
        return x;
      });
      resolve(arrayOfArrays);
    });

  });

}


/**
 * @description This function opens a connection to the RabbitMQ server,
 * @author Olabosinde Oladipo Olabosindeoladipo@gmail.com
 */
openAMQP = async () => {
  let open = await amqplib.connect('amqp://localhost');
  return open;
}
launch = () => {
  processData(config.get('pathToCurrentMutant')).then((data) => {
    readCredentials('credentials.json').then((credentials) => {
      authorize(credentials).then(auth => {
        appendToSheet(auth, data);
      });
    });
  })
}
consumeFromQueue = (rmq, queue) => {
  // Consumer
  rmq.then(function (conn) {
    return conn.createChannel();
  }).then(function (ch) {
    return ch.assertQueue(queue).then(function (ok) {
      return ch.consume(queue, function (msg) {
        if (msg !== null) {
          console.log(msg.content.toString());
          launch();
          ch.ack(msg);
        }
      });
    });
  }).catch(console.warn);
}

//========================= START THE MACHINE ========================

(async () => {
  let rmq = openAMQP();
  consumeFromQueue(rmq, QUEUE)
})();
// launch();
//====================================================================

// [END sheets_quickstart]

module.exports = {
  SCOPES,
  listMajors,
  appendToSheet,
  processData,
  openAMQP,
  spreadsheetId,
  readCredentials,
  launch
};
