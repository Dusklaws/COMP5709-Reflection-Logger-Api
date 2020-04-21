import * as dialogflow from './dialogflow';
import * as auth from './auth';
import * as students from './students';
import * as logs from './logs';

exports.dialogflow = dialogflow.handler;
exports.auth = auth.handler;
exports.students = students.handler;
exports.logs = logs.handler;
