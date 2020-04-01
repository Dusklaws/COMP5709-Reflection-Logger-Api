import { OAuth2Client } from 'google-auth-library';

import type { User } from '../typings/user';
import * as en from '../environment';
import { FirestoreDatabase } from './firestoreDatabase';

const kGoogleClientId = en.googleClientId;
const userCollection = new FirestoreDatabase<User>('user');

/**
 * Verify the google token id then fetch the user from database if user doesn't exist create one
 * 
 * @param token The Google id token from gapi library or dialogflow webhook
 * @return The user object contains name, email address and type of user
 */
export async function verifyGoogleIdToken(token: string): Promise<User | undefined> {
    const googleClient = new OAuth2Client(kGoogleClientId);
    const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: kGoogleClientId
    });
    const googlePpayload = ticket.getPayload();
    if (!googlePpayload?.email || !googlePpayload.name || !googlePpayload.aud || googlePpayload.aud !== kGoogleClientId) {
        return undefined;
    }

    const userDetails: User = { email: googlePpayload.email, name: googlePpayload.name, type: 'student', isStudentMiddle: false };
    const userObject = await userCollection.get(userDetails.email);
    if (!userObject) {
        await userCollection.create(userDetails.email, userDetails);
        console.log(`New user created: ${JSON.stringify(userDetails)}`);
        return userDetails;
    }

    return userObject;
}