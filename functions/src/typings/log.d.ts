export interface Log {
    email: string;
    studentType: Log.StudentType;
    submissionTime: string;
    dailyRating: number;
    dailySummary: string;
    generalReportingParameters?: Log.GeneralReportingParameters;
    technologyReportingParameters?: Log.TechnologyReportingParameters;
    issueReportingParameters?: Log.IssueReportingParameters;
}

export namespace Log {
    type StudentType = 'initial' | 'middle';
    type logType = 'generalReportingParameters' | 'technologyReportingParameters' | 'issueReportingParameters';
    type eventString = 'initial-general-reporting'
        | 'initial-technology-reporting'
        | 'initial-issue-reporting';

    export interface GeneralReportingParameters {
        employeeName: string;
        startDate: string;
        endDate: string;
    }

    export interface TechnologyReportingParameters {
        isTaskTechnical: string;
        task: string;
    }

    export interface IssueReportingParameters {
        workPlaceIssue: string;
        generalIssue: string;
    }
}
