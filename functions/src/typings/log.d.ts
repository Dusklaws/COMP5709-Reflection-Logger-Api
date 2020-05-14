export interface Log {
    email: string;
    studentType: Log.StudentType;
    submissionTime: string;
    dailyRating: number;
    dailySummary: string;
    // Initial Stage
    internshipReportingParameters?: Log.InternshipReportingParameters;
    technologyReportingParameters?: Log.TechnologyReportingParameters;
    issueReportingParameters?: Log.IssueReportingParameters;
    // Middle Stage
    workReportingParameters?: Log.WorkReportingParameters;
    helpReportingParameters?: Log.HelpReportingParameters;
}

export namespace Log {
    type StudentType = 'initial' | 'middle';
    type logType = 'internshipReportingParameters'
        | 'technologyReportingParameters'
        | 'issueReportingParameters'
        | 'workReportingParameters'
        | 'helpReportingParameters';
    type eventString = 'initial-general-reporting'
        | 'initial-technology-reporting'
        | 'initial-issue-reporting'
        | 'middle-work-reporting'
        | 'middle-deadline-reporting'
        | 'middle-help-reporting';

    export interface InternshipReportingParameters {
        employeeName: string;
        startDate: string;
        endDate: string;
    }

    export interface TechnologyReportingParameters {
        isTaskTechnical: boolean;
        task: string;
        technology: string;
    }

    export interface IssueReportingParameters {
        workPlaceIssue: string;
        generalIssue: string;
    }

    export interface WorkReportingParameters {
        task: string;
        isUpcomingDeadline: boolean;
        upcomingDeadline?: string;
    }

    export interface HelpReportingParameters {
        challenges: string;
        meeting: string;
        resources: string;
        consult: string;
        support: string;
    }
}
