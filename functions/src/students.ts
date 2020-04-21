import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as _ from 'lodash';

import * as en from './environment';
import { verifyGoogleIdToken } from './shared/auth';
import { FirestoreDatabase } from './shared/firestoreDatabase';
import { User } from './typings/user';

const corsHandler = cors({ origin: true });
const userCollection = new FirestoreDatabase<User>('user');

export const handler = functions.region(en.region).https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const googleIdToken = request.get('GoogleIdToken');
        if (!googleIdToken) {
            response.status(401).send('Missing Google Id Token in header');
            return;
        }
        const user = await verifyGoogleIdToken(googleIdToken, 'web');
        if (user?.type === 'supervisor') {
            const users = await userCollection.getAll();
            const students = users.filter(u => u.type === 'student');
            response.status(200).send(students);
        }
        response.status(200).send([user]);
    });
});
