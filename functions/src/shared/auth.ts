import { OAuth2Client } from 'google-auth-library';

import type { User } from '../typings/user';
import * as en from '../environment';
import { FirestoreDatabase } from './firestoreDatabase';
import { https } from 'firebase-functions';

const kActionsGoogleClientId = en.actionsGoogleClientId;
const kWebGoogleClientId = en.webGoogleClientId;
const userCollection = new FirestoreDatabase<User>('user');

/**
 * Verify the google token id then fetch the user from database if user doesn't exist create one
 * 
 * @param token The Google id token from gapi library or dialogflow webhook
 * @return The user object contains name, email address and type of user
 */
export async function verifyGoogleIdToken(token: string, type: 'web' | 'actions'): Promise<User | undefined> {
    const kGoogleClientId = (type === 'web') ? kWebGoogleClientId : kActionsGoogleClientId;
    const googleClient = new OAuth2Client(kGoogleClientId);
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: kGoogleClientId
    });
    const googlePayload = ticket.getPayload();
    if (!googlePayload?.email || !googlePayload.name || !googlePayload.aud || googlePayload.aud !== kGoogleClientId) {
        return undefined;
    }

    const userDetails: User = { email: googlePayload.email, name: googlePayload.name, type: type === 'actions' ? 'student' : 'non-authorized', isStudentMiddle: false, history: [] };
    const userObject = await userCollection.get(userDetails.email);
    if (!userObject) {
        await userCollection.create(userDetails.email, userDetails);
        console.log(`New user created: ${JSON.stringify(userDetails)}`);
        return userDetails;
    }

    if (userObject.type === 'non-authorized' && type === 'actions') {
        userObject.type = 'student';
        await userCollection.update(userObject.email, 'type', 'student');
    }

    return userObject;
}

export async function getUser(request: https.Request): Promise<User | undefined> {
    const googleIdToken = request.get('GoogleIdToken');
    if (!googleIdToken) {
        return;
    }
    return verifyGoogleIdToken(googleIdToken, 'web');
}