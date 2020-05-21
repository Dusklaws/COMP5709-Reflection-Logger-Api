import * as functions from 'firebase-functions';
import * as cors from 'cors';
import * as _ from 'lodash';

import { FirestoreDatabase } from './shared/firestoreDatabase';
import { User } from './typings/user';

const corsHandler = cors({ origin: true });
const userCollection = new FirestoreDatabase<User>('user');
const sampleUserName = [
    'Ben Sanders',
    'Phil Mickey',
    'Jim Wick',
    'Alex Miller',
    'Duncan Cross',
    'Sammuel Stein',
    'Oliver Lennon'
];

export const generateSampleUser = functions.https.onRequest(async (request, response) => {
    await corsHandler(request, response, async () => {
        for (const n of sampleUserName) {
            const email = `${n.split(' ')[0].toLowerCase()}@email.com`;
            const history = createRandomHistory();
            const average = history.map(h => h.rating).reduce((a, b) => a + b) / history.length;
            await userCollection.create(email, {
                name: n,
                email,
                type: 'student',
                isStudentMiddle: true,
                helpRequested: Math.floor(Math.random() * 2) === 1,
                history,
                average,
                latestSummary: 'This is an example user',
                internshipDetails: {
                    employeeName: 'Example employee',
                    startDate: (new Date(`2020-${rng(1, 6)}-${rng(29, 1)}`)).toISOString(),
                    endDate: (new Date(`2020-${rng(7, 12)}-${rng(29, 1)}`)).toISOString()
                }
            });
        }
    });
});

function createRandomHistory(): User.History[] {
    const histories: User.History[] = [];
    for (let i = 0; i < 5; i++) {
        histories.push({
            rating: rng(1, 10),
            date: (new Date(`2020-${i + 1}-${rng(29, 1)}`)).toISOString()
        });
    }

    return histories;
}

function rng(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}