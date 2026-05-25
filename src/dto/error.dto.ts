export interface ApiErrorResponse {
    response?: {
        data?: {
            message?: string;
        };
    };
    message?: string;
}

export interface ReportDataRow {
    [key: string]:
        | string
        | number
        | Date
        | boolean
        | null
        | undefined
        | ReportRelationData
        | ReportRelationData[];
}

export interface ReportRelationData {
    [key: string]: string | number | Date | boolean | null | undefined;
}
