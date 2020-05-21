import * as express from 'express';
import * as functions from 'firebase-functions';
import * as cors from 'cors';

import * as en from './environment';
import * as dialogflow from './dialogflow';
import * as auth from './auth';
import * as students from './students';
import * as logs from './logs';
import * as util from './util';

const app = express();

app.get('/students', students.getStudents);
app.get('/students/:email/remove_help', students.removeHelp);
app.get('/logs/:email', logs.getLogs);
app.use(cors({ origin: true }));

app.get('/generateSampleUser', util.generateSampleUser);

exports.auth = auth.handler;
exports.dialogflow = dialogflow.handler;
exports.api = functions.region(en.region).https.onRequest(app);