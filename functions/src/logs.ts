import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as _ from 'lodash';

import { getUser } from './shared/auth';
import { FirestoreDatabase } from './shared/firestoreDatabase';
import * as helper from './shared/commonHelper';
import { Log } from './typings/log';
import { User } from './typings/user';

const corsHandler = cors({ origin: true });
const logCollection = new FirestoreDatabase<Log>('log');
const userCollection = new FirestoreDatabase<User>('user');

export const getLogs = functions.https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const user = await getUser(request);
        if (!user) {
            response.status(401).send('Missing or invalid Google Id Token in header');
            return;
        }
        const requestedEmail = request.params.email;
        if (helper.checkPermission(user, requestedEmail)) {
            const logs = await logCollection.getAllBy('email', requestedEmail);
            response.status(200).send(logs);
            return;
        }
        response.status(401).send(`User is not authorized to view resource: ${requestedEmail}`);
    });
});

export const updateLog = functions.https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const user = await getUser(request);
        if (!user) {
            response.status(401).send('Missing or invalid Google Id Token in header');
            return;
        }
        const queryLog: Log = request.body;
        const requestedEmail = queryLog.email;
        if (helper.checkPermission(user, requestedEmail)) {
            await logCollection.updateWhole(queryLog.id, queryLog);
            if (queryLog.logType === 'initial' && queryLog.internshipReportingParameters) {
                await userCollection.update(queryLog.email, 'internshipDetails', queryLog.internshipReportingParameters);
            }
            response.status(204).send();
            return;
        }
        response.status(401).send(`User is not authorized to view resource: ${requestedEmail}`);
    });
});