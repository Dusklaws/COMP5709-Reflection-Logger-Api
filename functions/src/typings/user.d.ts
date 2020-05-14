import { Log } from "./log";

export interface User {
    email: string;
    name: string;
    type: 'student' | 'supervisor';
    isStudentMiddle: boolean;
    history: User.History[];
    average?: number;
    helpRequested?: boolean;
    internshipDetails?: Log.InternshipReportingParameters;
    latestSummary?: string;
}

export namespace User {
    export interface History {
        date: string;
        rating: number;
    }
}