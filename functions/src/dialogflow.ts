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

    intentMap.set('Initial Stage - Internship Reporting', handleInternShipReporting);
    intentMap.set('Initial Stage - Technology Reporting', handleTechnologyReporting);
    intentMap.set('Initial Stage - Issue Reporting', handleIssueReporting);
    intentMap.set('Middle Stage - Work Reporting', handleWorkIntent);
    intentMap.set('Middle Stage - Deadline Reporting', handleDeadlineIntent);
    intentMap.set('Middle Stage - Help Reporting', handleHelpIntent);
    await agent.handleRequest(intentMap);
});



async function handleDailyReporting(agent: WebhookClient) {
    const parameters: {
        dailyRating: number;
        dailySummary: string;
    } = agent.parameters as any;

    parameters.dailyRating = parameters.dailyRating > 10 ? 10 : parameters.dailyRating < 1 ? 1 : parameters.dailyRating;

    const history = user!.history;
    if (history.length > 0 && isToday(history[history.length - 1].date)) {
        agent.end('Only one log can be submitted per day. Please edit the log on the website if you need make changes.');
        return;
    }

    history.push({
        date: (new Date()).toISOString(),
        rating: parameters.dailyRating
    });
    if (user!.history.length > 5) {
        history.shift();
    }
    const ratings = history.map(h => h.rating);
    const averageRating = ratings.reduce((a, b) => a + b) / history.length;
    await userCollection.update(user!.email, 'average', averageRating);
    await userCollection.update(user!.email, 'latestSummary', parameters.dailySummary);

    const sessionId = getSessionId(agent);
    await userCollection.update(user!.email, 'history', history);
    await logCollection.create(sessionId, {
        email: user!.email,
        studentType: user?.isStudentMiddle ? 'middle' : 'initial',
        submissionTime: (new Date()).toISOString(),
        ...parameters
    });

    //Dialogflow for need add to trigger the next event
    agent.add('');
    if (!user!.isStudentMiddle) {
        await userCollection.update(user!.email, 'isStudentMiddle', true);
        agent.setFollowupEvent('initial-internship-reporting');
    } else {
        agent.setFollowupEvent('middle-work-reporting');
    }
}

async function handleInternShipReporting(agent: WebhookClient) {
    const parameters: Log.InternshipReportingParameters = {
        employeeName: agent.parameters.employeeName,
        startDate: (new Date(agent.parameters.startDate)).toISOString(),
        endDate: (new Date(agent.parameters.endDate)).toISOString()
    };
    await userCollection.update(user!.email, 'internshipDetails', parameters);
    await handleGeneralIntent(
        agent,
        parameters,
        'internshipReportingParameters',
        'initial-technology-reporting'
    );
}

async function handleTechnologyReporting(agent: WebhookClient) {
    const parameters: Log.TechnologyReportingParameters = {
        isTaskTechnical: isYes(agent.parameters.isTaskTechnical),
        task: agent.parameters.task,
        technology: agent.parameters.technology
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

async function handleWorkIntent(agent: WebhookClient) {
    const parameters: Log.WorkReportingParameters = {
        task: agent.parameters.task,
        isUpcomingDeadline: isYes(agent.parameters.isUpcomingDeadline)
    };

    if (parameters.isUpcomingDeadline) {
        await handleGeneralIntent(
            agent,
            parameters,
            'workReportingParameters',
            'middle-deadline-reporting'
        );
        return;
    }
    await handleGeneralIntent(
        agent,
        parameters,
        'workReportingParameters',
        'middle-help-reporting'
    );
}

async function handleDeadlineIntent(agent: WebhookClient) {
    const log = await logCollection.get(getSessionId(agent));
    if (log && log.workReportingParameters?.upcomingDeadline) {
        log.workReportingParameters.upcomingDeadline = agent.parameters.upcomingDeadline;
        await logCollection.update(getSessionId(agent), 'workReportingParameters', log.workReportingParameters);
    }

    await handleGeneralIntent(agent, undefined, undefined, 'middle-help-reporting');
}

async function handleHelpIntent(agent: WebhookClient) {
    const parameters: Log.HelpReportingParameters = {
        challenges: agent.parameters.challenges,
        resources: agent.parameters.resources,
        support: agent.parameters.support,
        consult: agent.parameters.consult,
        meeting: agent.parameters.meeting
    };
    await handleGeneralIntent(agent, parameters, 'helpReportingParameters');
}

async function handleGeneralIntent(
    agent: WebhookClient,
    parameters?: any,
    logType?: Log.logType,
    nextEvent?: Log.eventString,
) {
    const sessionId = getSessionId(agent);
    if (parameters && logType) {
        await logCollection.addField(sessionId, logType, parameters);
    }
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

// function getDate(d: string): string {
//     const date = new Date(d);
//     return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
// }

function isYes(s: string): boolean {
    return s.toLowerCase() === 'yes';
}

function isToday(s: string): boolean {
    return false;
    // return getDate(s) === getDate((new Date()).toISOString());
}