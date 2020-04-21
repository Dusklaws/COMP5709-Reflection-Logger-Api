import * as dialogflow from './dialogflow';
import * as auth from './auth';
import * as students from './students';

exports.dialogflow = dialogflow.handler;
exports.auth = auth.handler;
exports.students = students.handler;
