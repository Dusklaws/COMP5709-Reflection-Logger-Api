import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as _ from 'lodash';

import { getUser } from './shared/auth';
import { FirestoreDatabase } from './shared/firestoreDatabase';
import * as helper from './shared/commonHelper';
import { User } from './typings/user';

const corsHandler = cors({ origin: true });
const userCollection = new FirestoreDatabase<User>('user');

export const getStudents = functions.https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const user = await getUser(request);
        if (!user) {
            response.status(401).send('Missing or invalid Google Id Token in header');
            return;
        }
        if (user.type === 'supervisor') {
            const users = await userCollection.getAll();
            const students = users.filter(u => u.type === 'student');
            response.status(200).send(students);
            return;
        }
        response.status(200).send([user]);
    });
});

export const removeHelp = functions.https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const user = await getUser(request);
        if (!user) {
            response.status(401).send('Missing or invalid Google Id Token in header');
            return;
        }
        const requestedEmail = request.params.email;
        if (helper.checkPermission(user, requestedEmail)) {
            await userCollection.update(requestedEmail, 'helpRequested', false);
            response.status(204).send();
            return;
        }
        response.status(401).send(`User is not authorized to view resource: ${requestedEmail}`);
    });
});
