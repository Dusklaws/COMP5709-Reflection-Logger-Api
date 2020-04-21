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
// const userCollection = new FirestoreDatabase<User>('user');

export const handler = functions.region(en.region).https.onRequest(async (request, response) => {
    // Basic auth to verify webhook
    if ((Buffer.from(en.dialogflowSecret).toString('base64') === request.headers.authorization)) {
        response.status(401).send('Invalid Authorization Header');
        return;
    }
    const agent = new WebhookClient({ request, response });
    const payload = request.body;
    console.log(payload);
    const idToken = payload.originalDetectIntentRequest.payload.user.idToken;
    user = await verifyGoogleIdToken(idToken, 'actions');
    if (!user) {
        response.status(400).send();
        return;
    }

    const intentMap = new Map();
    intentMap.set('Daily Reporting', handleDailyReporting);
    intentMap.set('Initial Stage - General Reporting', handleGeneralReporting);
    intentMap.set('Initial Stage - Technology Reporting', handleTechnologyReporting);
    intentMap.set('Initial Stage - Issue Reporting', handleIssueReporting);
    await agent.handleRequest(intentMap);
});



async function handleDailyReporting(agent: WebhookClient) {
    const parameters: {
        dailyRating: number;
        dailySummary: string;
    } = agent.parameters as any;
    const sessionId = getSessionId(agent);
    //Dialogflow for need add to trigger the next event
    agent.add('');
    if (!user!.isStudentMiddle) {
        agent.setFollowupEvent('initial-general-reporting');
        await logCollection.create(sessionId, {
            email: user!.email,
            studentType: 'initial',
            submissionTime: (new Date()).toISOString(),
            ...parameters
        });
        const newHistory: User.History = {
            date: (new Date()).toISOString(),
            rating: parameters.dailyRating
        };
        const history = user!.history;
        if (user!.history.length > 5) {
            history.shift();
        }
        history.push(newHistory);
        await userCollection.update(user!.email, 'history', history);
        // TODO: uncomment this once the middle stage student flow is ready
        // await userCollection.update(user!.email, 'isStudentMiddle', true);
        return;
    }

    await logCollection.create(sessionId, {
        email: user!.email,
        studentType: 'middle',
        submissionTime: (new Date()).toISOString(),
        ...parameters
    });
    // TODO: Start the flow for the middle stage student
    agent.end('Thank you for your response. The log have been submitted to the supervisor, if you need to edit your response please visit the log website. Have a good day!');
}

async function handleGeneralReporting(agent: WebhookClient) {
    const parameters: Log.GeneralReportingParameters = {
        employeeName: agent.parameters.employeeName,
        startDate: (new Date(agent.parameters.startDate)).toISOString(),
        endDate: (new Date(agent.parameters.endDate)).toISOString()
    };
    await handleGeneralIntent(
        agent,
        parameters,
        'generalReportingParameters',
        'initial-technology-reporting'
    );
}

async function handleTechnologyReporting(agent: WebhookClient) {
    const parameters: Log.TechnologyReportingParameters = {
        isTaskTechnical: agent.parameters.isTaskTechnical,
        task: agent.parameters.task
    };
    await handleGeneralIntent(
        agent,
        parameters,
        'technologyReportingParameters',
        'initial-issue-reporting'
    );
}

async function handleIssueReporting(agent: WebhookClient) {
    const parameters: Log.IssueReportingParameters = {
        workPlaceIssue: agent.parameters.workPlaceIssue,
        generalIssue: agent.parameters.generalIssue
    };
    await handleGeneralIntent(
        agent,
        parameters,
        'issueReportingParameters'
    );
}

async function handleGeneralIntent(
    agent: WebhookClient,
    parameters: any,
    logType: Log.logType,
    nextEvent?: Log.eventString,
) {
    const sessionId = getSessionId(agent);
    await logCollection.addField(sessionId, logType, parameters);
    //Dialogflow for need add to trigger the next event so we just add an empty text
    if (nextEvent) {
        agent.add('');
        agent.setFollowupEvent(nextEvent);
        return;
    }
    agent.end('Thank you for your response. The log have been submitted to the supervisor, if you need to edit your response please visit the log website. Have a good day!');
}

function getSessionId(agent: WebhookClient): string {
    const session = agent.session.split('/');
    return session.pop()!;
}
