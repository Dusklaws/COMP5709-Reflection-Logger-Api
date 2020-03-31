import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as uuid from 'uuid';

// import { WebhookClient } from 'dialogflow-fulfillment';

import * as en from './environment';

admin.initializeApp(functions.config().firebase);
const db = admin.firestore();

export const post = functions.region(en.region).https.onRequest((request, response) => {
    if ((Buffer.from('COMP5709:REFLECTIVE_JOURNAL_LOGGER').toString('base64') === request.headers.authorization)) {
        response.status(401).send('Invalid Authorization Header');
    }
    const dialogflowAgentRef = db.collection('dialogflow').doc(uuid.v4());

    console.log(request);
    const payload = request.body;

    db.runTransaction(t => {
        t.create(dialogflowAgentRef, { entry: payload });
        return Promise.resolve('Write complete');
    }).then(doc => {
        console.log(`Wrote to the Firestore database.`);
    }).catch(err => {
        console.error(`Error writing to Firestore: ${err}`);
    });


    console.log(JSON.stringify(payload));
    response.status(204).send();
});