TWILIO_SID = "#TwilioSid#";
TWILIO_AUTH = "#TwilioAuthToken#";
TWILIO_NUMBER = "#TwilioNumber#";

const test = () => Logger.log(doGet({parameters:{Body:['exit'], From: ['+12345678901'], To: ['45045']}}).getContent());

const testText = () => sendText('+17192840385', 'This is another test');

const clearMutex = () => releaseMutex(SpreadsheetApp.getActive().getSheetByName('db'));

const [
  COL_PHONE,
  COL_NAME,
  COL_JOIN_DATE,
  COL_SECRET,
  COL_TARGET,
  COL_ELIMINATED_BY,
  COL_ELIMINATED_DATE,
  COL_NOTIFIED
] = [0,1,2,3,4,5,6,7];

const CMD_JOIN = ['JOIN', 'REGISTER'];
const CMD_CAPTURE = ['CAPTURE', 'ELIMINATE']; 
const CMD_EXIT = ['EXIT'];

const GROUP_NAME = 'Provo 191st YSA';

const WELCOME = 'Welcome to the ' + GROUP_NAME + ' Super Secret Spy Network';

const winnerText = (eliminated) => 'Fantastic work, agent! You have successfully ' +
      (eliminated? 'eliminated' : 'outlasted') +
      ' your adversary ' +
      (eliminated? ' before they eliminated you' : '') +
      '. You have proven yourself to be the World\'s Greatest Secret Agent. ' +
      'Congratulations!\n\nThanks for playing!';

const NAME_REGEX = /^[A-Za-z]+\s+[A-Za-z]+$/;
const SECRET_REGEX = /^[A-Za-z]+\s+[A-Za-z]+\s+[A-Za-z]+$/;

const now = () => (new Date).toLocaleString();

const help = () => twimlSmsResponse(
  WELCOME +
  '\n\n' +
  'Valid commands:\n' +
  'JOIN <your full name> - register for a game\n' +
  'CAPTURE <your target\'s secret phrase> - eliminate your target\n' +
  'EXIT - leave the game (this cannot be undone!)'
);

const getData = (db) => db.getDataRange().getValues();

//Entry point
function doGet(e) {
  const ss = SpreadsheetApp.getActive();
  logRequest(ss, e);
  const [cmd, body, from] = parseMessage(e.parameters);
  const db = ss.getSheetByName('db');
  const gameIsStarted = ss.getSheetByName('settings').getDataRange().getValues()[1][1];

  const mutex = tryGetMutex(db);
  if (!mutex) return pleaseRetryResponse();
  
  let response;

  if (CMD_JOIN.indexOf(cmd) >= 0) {
     response = registerPlayer(db, body, from, gameIsStarted);
  }
  else if (CMD_CAPTURE.indexOf(cmd) >= 0) {
    response = recordCapture(db, body, from, gameIsStarted);
  }
  else if (CMD_EXIT.indexOf(cmd) >= 0) {
    response = removePlayer(db, body, from, gameIsStarted);
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
  const command = text.split(' ', 1)[0].toUpperCase();
  const body = text.substring(command.length).trim();
  return [command, body, from];
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
function registerPlayer(db, name, phoneNumber, gameIsStarted) {
  if (!NAME_REGEX.test(name)) {
    return twimlSmsResponse('Please enter your full name.');
  }

  if (gameIsStarted) return twimlSmsResponse('Sorry, the game has already started.');
  
  const data = getData(db);
  
  const [existing] = findWhere(data, r => r[COL_PHONE] === '`' + phoneNumber);
  
  if (existing != null) {
    return twimlSmsResponse(
      'You have already joined as ' +
      existing[COL_NAME] +
      '. Please wait for a text announcing the start of the game.'
    );
  }
  else {
    db.appendRow(['`' + phoneNumber, name, now()]);
    return twimlSmsResponse('Hello, ' + name + '.\n\n' + WELCOME + '\n\n(You have successfully joined the game.)');
  }
}

//"CAPTURE Secret"
function recordCapture(db, secret, phoneNumber, gameIsStarted) {
  const data = getData(db);
  const [user, userIndex] = findUser(data, phoneNumber);

  if (user == null) {
    return noResponse();
  }

  if (user[COL_ELIMINATED_BY]) {
    return eliminatedMessageResponse(user);
  }

  if (!gameIsStarted) return twimlSmsResponse('Please wait for a text announcing the start of the game.');

  if (!SECRET_REGEX.test(secret)) {
    return twimlSmsResponse('The secret phrase should be exactly three words.')
  }

  const [target, targetIndex] = findWhere(data, r => r[COL_NAME] === user[COL_TARGET]);

  if (secret.toUpperCase() !== target[COL_SECRET].toUpperCase()) {
    return twimlSmsResponse('Incorrect secret phrase. Please check with your target and try again.');
  }

  const [newTarget] = findWhere(data, r => r[COL_NAME] === target[COL_TARGET]);

  //getRange uses 1-indexing....

  sendText(target[COL_PHONE].substring(1), eliminatedMessage(user[COL_NAME], now()));

  db.getRange(+targetIndex + 1, +COL_ELIMINATED_BY + 1, 1, 2).setValues([[user[COL_NAME], now()]]);

  if (newTarget[COL_NAME] === user[COL_NAME]) {
    announceWinner(user, target);
    return twimlSmsResponse(winnerText(true));
  }
  else {
    db.getRange(+userIndex + 1, +COL_TARGET + 1).setValue(newTarget[COL_NAME]);
    return twimlSmsResponse('Excellent work, agent. Your next target is ' + newTarget[COL_NAME] + '.');
  }
}

function removePlayer(db, secret, phoneNumber, gameIsStarted) {
  const data = getData(db);
  const [user, userIndex] = findUser(data, phoneNumber);

  if (user == null) {
    return noResponse();
  }

  //Move this user's target to be the target of whoever was targeting him/her
  const [hunter, hunterIndex] = findWhere(data, r => user[COL_NAME] === r[COL_TARGET]);
  if (hunter != null) {
    if (hunter[COL_TARGET] !== user[COL_NAME]) {
      db.getRange(+hunterIndex + 1, +COL_TARGET + 1).setValue(user[COL_TARGET]);
      sendText(hunter[COL_PHONE].substring(1), 'Your target left the game. Your new target is ' + user[COL_TARGET] + '.');
    }
    else {
      announceWinner(hunter, user);
      sendText(hunter[COL_PHONE].substring(1), winnerText(false));
    }
  }
  db.deleteRow(+userIndex + 1);
  return twimlSmsResponse('You have successfully exited the game. Thanks for playing!');
}

function announceWinner(user, target) {
  const emailBody = 'After an intense battle, ' +
      user[COL_NAME] +
      ' defeated ' +
      target[COL_NAME] +
      ' to claim the title of World\'s Greatest Secret Agent!'
    MailApp.sendEmail('tyleralanmercer@gmail.com', user[COL_NAME] + ' wins!', emailBody, {
      htmlBody: '<p>' + emailBody + '</p>'
    });
}

function findWhere(data, predicate) {
  const rows = data.slice(1);
  for (const r in rows) {
    if (predicate(rows[r])) {
      return [rows[r], +r+1];
    }
  }
  return [null, null];
}

function findUser(data, phoneNumber) {
  return findWhere(data, r => r[COL_PHONE] === '`' + phoneNumber);
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

function pleaseRetryResponse() {
  return twimlSmsResponse('The server is under load, please wait a few minutes and retry.');
}

function eliminatedMessage(by, when) {
  return 'Unfortunately, you were elminated by ' +
  by +
  ' on ' +
  when.replace(',', ' at') +
  ' and are out of the game.\nThanks for playing!'
}

function eliminatedMessageResponse(user) {
  return twimlSmsResponse(
    eliminatedMessage(user[COL_ELIMINATED_BY], user[COL_ELIMINATED_DATE])
  );
}

function sendText(to, body) {
  UrlFetchApp.fetch('https://api.twilio.com/2010-04-01/Accounts/' + TWILIO_SID + '/Messages', {
    method: 'post',
    payload: {
      'Body':body,
      'From':TWILIO_NUMBER,
      'To':to
    },
    headers : {
     'Authorization' : 'Basic ' + Utilities.base64Encode(TWILIO_SID + ':' + TWILIO_AUTH)//.replace(/\//g,'_').replace(/\+/g,'-')
    }
  });
}