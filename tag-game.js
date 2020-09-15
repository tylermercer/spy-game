const test = () => doGet({parameters:{Body:['JOIN Foo Bar'], From: ['1234567890']}});

const [COL_PHONE, COL_NAME, COL_JOIN_DATE, COL_SECRET, COL_TARGET] = [0,1,2,3,4];

const CMD_JOIN = ['JOIN', 'REGISTER'];
const CMD_CAPTURE = ['CAPTURE', 'ELIMINATE']; 

const NAME_REGEX = /^[A-Za-z]+\s+[A-Za-z]+$/;
const SECRET_REGEX = /^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+$/;

const now = () => (new Date).toLocaleString();

const help = () => twimlSmsResponse('This is help text');

const getData = (db) => db.getDataRange().getValues();

//Entry point
function doGet(e) {
  const ss = SpreadsheetApp.getActive();
  logRequest(ss, e);
  const [cmd, body, from] = parseMessage(e.parameters);
  const db = ss.getSheetByName('db');

  const mutex = tryGetMutex(db);
  if (!mutex) return pleaseRetryResponse();
  
  let response;
  if (CMD_JOIN.indexOf(cmd) >= 0) {
     response = registerPlayer(db, body, from);
  }
  else if (CMD_CAPTURE.indexOf(cmd) >= 0) {
    response = recordCapture(db, body, from);
  }
  else {
    response = help();
  }
  releaseMutex(db);
  return response;
}

function logRequest(ss, e) {
  Logger.log('New Request');
  ss.getSheetByName('log')
  .appendRow([now(), JSON.stringify(e)]);
}

function parseMessage(params) {
  const text = params['Body'][0];
  const from = params['From'][0];
  const to = params['To'][0];
  const command = text.split(' ', 1)[0].toUpperCase();
  const body = text.substring(command.length).trim();
  return [command, body, from, to];
}

function tryGetMutex(db) {
  //This is honestly a pretty weak mutex because this function isn't atomic.
  //But it's the best GAS can do.
  const success = db.getDeveloperMetadata().length === 0;
  if (success) {
    db.addDeveloperMetadata('mutex');
  }
  return success;
}

function releaseMutex(db) {
  db.getDeveloperMetadata().forEach(md => md.remove());
}

//"JOIN Full Name"
function registerPlayer(db, name, phoneNumber) {
  if (!NAME_REGEX.test(name)) {
    return twimlSmsResponse('Please enter your full name.');
  }
  
  const data = getData(db);
  
  const existing = findWhere(data, r => r[COL_PHONE] === '`' + phoneNumber);
  
  if (existing != null) {
    return twimlSmsResponse('You have already joined as ' + existing[COL_NAME] + '. Please wait for a text announcing the start of the game.');
  }
  else {
    db.appendRow(['`' + phoneNumber, name, now()]);
    return twimlSmsResponse('Welcome, ' + name + '. You have successfully joined the game.');
  }
}

//"CAPTURE Secret"
function recordCapture(db, secret, phoneNumber) {
  const data = getData(db);
  const [user, userIndex] = findUser(data, phoneNumber);

  if (user == null) {
    return noResponse();
  }

  if (!gameIsStarted(ss)) return gameNotStartedResponse();

  if (!SECRET_REGEX.test(secret)) {
    return twimlSmsResponse('The secret phrase should be exactly three words.')
  }

  const [target, targetIndex] = findWhere(data, r => r[COL_NAME] === user[COL_TARGET]);

  if (secret.toUpperCase() !== target[COL_SECRET].toUpperCase()) {
    return twimlSmsResponse('Incorrect secret phrase. Please check with your target and try again.');
  }

  const newTarget = findWhere(data, r => r[COL_NAME] === target[COL_TARGET]);

  const db = ss.getSheetByName('db');



  return
}

function findWhere(data, predicate) {
  for (let r in data) {
    if (predicate(data[r])) {
      return [data[r], r];
    }
  }
  return [null, null];
}

function findUser(data, phoneNumber) {
  return findRowWhere(data, r => r[COL_PHONE] === '`' + phoneNumber);
}

function twimlSmsResponse(str) {
  Logger.log(str);
  return ContentService
    .createTextOutput(
      '<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>' +
      str + '</Body></Message></Response>'
      )
    .setMimeType(ContentService.MimeType.XML);
}

function noResponse() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.XML);
}

function gameNotStartedResponse() {
  return twimlSmsResponse('The game has not yet started! Please wait for a text announcing the start of the game.');
}

function pleaseRetryResponse() {
  return twimlSmsResponse('The server is under load, please wait a few minutes and retry.');
}
