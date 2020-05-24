export interface Log {
    email: string;
    logType: Log.LogType;
    submissionTime: string;
    dailyRating: number;
    dailySummary: string;
    id: string;
    // Initial Stage
    internshipReportingParameters?: Log.InternshipReportingParameters;
    technologyReportingParameters?: Log.TechnologyReportingParameters;
    issueReportingParameters?: Log.IssueReportingParameters;
    // Middle Stage
    workReportingParameters?: Log.WorkReportingParameters;
    helpReportingParameters?: Log.HelpReportingParameters;
    checkUpReportingParameters?: Log.CheckUpReportingParameters;
}

export namespace Log {
    type LogType = 'initial' | 'check-up' | 'full' | 'rating';
    type parametersType = 'internshipReportingParameters'
        | 'technologyReportingParameters'
        | 'issueReportingParameters'
        | 'workReportingParameters'
        | 'helpReportingParameters'
        | 'checkUpReportingParameters';
    type eventString = 'initial-general-reporting'
        | 'initial-technology-reporting'
        | 'initial-issue-reporting'
        | 'middle-work-reporting'
        | 'middle-deadline-reporting'
        | 'middle-help-reporting'
        | 'middle-checkup-reporting';

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
        resources: string;
        support: boolean;
        meeting: boolean;
    }

    export interface CheckUpReportingParameters {
        ability: number;
        tools: number;
        support: number;
        learning: number;
        likeness: number;
    }
}
