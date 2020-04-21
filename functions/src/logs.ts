import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as _ from 'lodash';

import * as en from './environment';
import { getUser } from './shared/auth';
import { FirestoreDatabase } from './shared/firestoreDatabase';
import { Log } from './typings/log';

const corsHandler = cors({ origin: true });
const logCollection = new FirestoreDatabase<Log>('log');

export const handler = functions.region(en.region).https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const user = await getUser(request);
        if (!user) {
            response.status(401).send('Missing or invalid Google Id Token in header');
            return;
        }
        const { email: requestedEmail }: { email: string } = request.body;
        if (user.email === requestedEmail || user.type === 'supervisor') {
            const logs = await logCollection.getAllBy('email', requestedEmail);
            response.status(200).send(logs);
            return;
        }
        response.status(401).send(`User is not authorized to view resource: ${requestedEmail}`);
    });
});
