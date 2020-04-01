import * as functions from 'firebase-functions';
import { WebhookClient } from 'dialogflow-fulfillment';

import type { User } from './typings/user';
import type { Log } from './typings/log';
import * as en from './environment';
import { verifyGoogleIdToken } from './shared/auth';
import { FirestoreDatabase } from './shared/firestoreDatabase';

let user: User | undefined;
const logCollection = new FirestoreDatabase<Log>('log');
const userCollection = new FirestoreDatabase<User>('user');

export const post = functions.region(en.region).https.onRequest(async (request, response) => {
    // Basic auth to verify webhook
    if ((Buffer.from(en.dialogflowSecret).toString('base64') === request.headers.authorization)) {
        response.status(401).send('Invalid Authorization Header');
    }

    const agent = new WebhookClient({ request, response });
    const payload = request.body;
    const id_token = payload.originalDetectIntentRequest.payload.user.idToken;
    user = await verifyGoogleIdToken(id_token);
    if (!user) {
        response.status(400).send();
    }

    const intentMap = new Map();
    intentMap.set('Daily Reporting', handleDailyReporting);
    intentMap.set('Initial Stage - General Reporting', handleGeneralReporting);
    await agent.handleRequest(intentMap);
});



async function handleDailyReporting(agent: WebhookClient) {
    const parameters: {
        dailyRating: number;
        dailySummary: string;
    } = agent.parameters as any;
    const sessionId = getSessionId(agent);

    if (!user!.isStudentMiddle) {
        agent.add('Since you are just starting out I will ask some general questions regarding your internship');
        await logCollection.create(sessionId, {
            email: user!.email,
            studentType: 'initial',
            ...parameters
        });
        agent.setFollowupEvent('initial-general-reporting');
        await userCollection.update(user!.email, 'isStudentMiddle', true);
        return;
    }

    await logCollection.create(sessionId, {
        email: user!.email,
        studentType: 'middle',
        ...parameters
    });
    // TODO: Start the flow for the middle stage student
    agent.end('Thank you for your responses. The log have been submitted to the supervisor. Have a good day!');
}

async function handleGeneralReporting(agent :WebhookClient) {
    await handleGeneralIntent(agent, 'generalReportingParameters');
}

async function handleGeneralIntent(agent: WebhookClient, logType: Log.logType, nextEvent?: Log.eventString) {
    const parameters = agent.parameters;
    const sessionId = getSessionId(agent);
    await logCollection.addField(sessionId, logType, parameters);
    if (nextEvent) {
        agent.setFollowupEvent(nextEvent);
        return;
    }
    agent.end('Thank you for your responses. The log have been submitted to the supervisor. Have a good day!');
}

function getSessionId(agent: WebhookClient) {
    return agent.session.split('/')[4];
}
