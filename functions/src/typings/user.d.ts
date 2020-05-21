import { Log } from "./log";

export interface User {
    email: string;
    name: string;
    type: 'student' | 'supervisor' | 'non-authorized';
    isStudentMiddle: boolean;
    history: User.History[];
    average?: number;
    helpRequested?: boolean;
    internshipDetails?: Log.InternshipReportingParameters;
    latestSummary?: string;
    lastFullLogs?: string;
}

export namespace User {
    export interface History {
        date: string;
        rating: number;
    }
}