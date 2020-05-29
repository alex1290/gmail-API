const fs = require('fs');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.

fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), gmailMethods);
});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(
        client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token));
        callback(oAuth2Client);
    });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
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
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            // Store the token to disk for later program executions
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

/**
 * Use Gmail API to get info you want
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function gmailMethods(auth) {

    const userId = 'me'
    const gmail = google.gmail({ version: 'v1', auth });

    // get all Labels
    const getList = () => gmail.users.labels.list({
        userId,
    }, (err, res) => {
        if (err) return console.log('The API returned an error: ' + err);
        const labels = res.data.labels;
        if (labels.length) {
            console.log('Labels:');
            labels.forEach((label) => {
                console.log(`- ${label.name} id - ${label.id}`);
            });
        } else {
            console.log('No labels found.');
        }
    });

    // get the label
    const getLabel = labelId => gmail.users.labels.get({ userId, id: labelId }, (err, res) => {
        if (err) {
            console.log("something wrong : ", err);
        }
        console.log(res);
    });

    /**
    * decode gmail payload ( encode by base64 and decode to utf8 )
    *
    * @param {string} raw Raw data under data.payload.parts, if you have any attachment, the raw data will under next level part ( which mimeType is multipart )
    */
    const gmailDecode = (raw) => Buffer.from(raw, 'base64').toString('utf8');

    // get all messages
    function getMessageList() {
        // q -> querry you choose
        gmail.users.messages.list({ userId, 'q': 'wistron' }, (err, res) => {
            if (err) return console.log('wrong : ', err);

            console.log('---------Message List Start----------');

            let { messages } = res.data;

            if (messages.length) {
                // select every message
                messages.forEach(message => {
                    //
                    let id = message.id;
                    gmail.users.messages.get({ userId, id }, function (err, res) {
                        let mail = res.data.payload;
                        let attachments = [];
                        let raw, subject, date;
                        let content = "";
                        mail.headers.forEach(i => {
                            const { name, value } = i
                            if (name === 'Subject') subject = value;
                            if (name === 'Date') date = value;
                            // if (name === 'R')
                        })



                        if (mail.parts[0].mimeType !== 'multipart/alternative' && mail.parts.length === 2) {
                            raw = mail.parts[0].body.data;
                        } else {
                            raw = mail.parts[0].parts[0].body.data;
                            mail.parts.forEach((i, n) => {
                                let { mimeType, filename, body } = i;
                                if (mimeType.indexOf("image") !== -1) {
                                    let data;
                                    let { attachmentId } = body;
                                    // let rquest = getAttachment({ id: attachmentId, messageId: id })

                                    function getAttachment({ id, messageId }) {
                                        gmail.users.messages.attachments.get({ id, messageId, userId }, (err, res) => {
                                            data = res.data.data;
                                            attachments.push({ mimeType, filename, data })
                                            if (n === mail.parts.length - 1) {
                                                log();
                                                console.log(`type : ${mimeType} name : ${filename}`);
                                            }
                                        })
                                    };
                                    getAttachment({ id: attachmentId, messageId: id });
                                }
                            })
                        }

                        const log = () => {
                            if (raw) {
                                content = gmailDecode(raw);
                            }
                            console.log('-------start--------');
                            // console.log(mail.parts);

                            console.log(`ID : ${id}`);
                            console.log(`Subject : ${subject}`);
                            console.log(`Date : ${new Date(date)}`);
                            let timeStamp = new Date(date).getTime();
                            console.log(`Time Stamp : ${timeStamp}`);
                            console.log(`Content : ${content}`);
                            if (attachments.length > 0) console.log(`Attachment : ${attachments}`);
                            console.log('-------end--------\n');
                        }


                        // let result = { id, subject, date, timeStamp, content };
                    })

                })
            }

        })
    }
    getMessageList();
    // getLabel('Label_6539068232610249446');
}
