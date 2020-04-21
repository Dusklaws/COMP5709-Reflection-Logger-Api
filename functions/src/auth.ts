import * as functions from 'firebase-functions';
import * as cors from 'cors';

import * as en from './environment';
import { verifyGoogleIdToken } from './shared/auth';

const corsHandler = cors({ origin: true });

export const handler = functions.region(en.region).https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        console.log(request);
        const payload: { googleIdToken: string } = request.body;
        console.log(payload);
        if (!payload.googleIdToken) {
            response.status(401).send('Missing Google Id Token');
            return;
        }
        const user = await verifyGoogleIdToken(payload.googleIdToken, 'web');
        response.status(200).send(user);
    });
});
