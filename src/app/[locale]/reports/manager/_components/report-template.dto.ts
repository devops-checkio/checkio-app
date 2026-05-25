import { PaginationFilterDto } from "@/dto/pagination";

export interface ReportTemplateColumnDto {
  fieldId: string;
  columnName: string;
  headerTransform: "DEFAULT" | "UPPER" | "LOWER";
  position: number;
  type: "CONSOLIDATED" | "AGGREGATE" | "CALCULATED" | "STRING" | "NUMBER" | "DATE" | "TIME" | "DATETIME" | "BOOLEAN";
  tags?: string[];
  separator?: string;
  format?: string;
  timeFormat?: string;
  sourceFieldIds?: string[];
  calculationType?: "SUM" | "SUBTRACT" | "MULTIPLY" | "DIVIDE" | "AVERAGE" | "CUSTOM";
  fieldMapping?: Record<string, string>;
  formula?: string;
  aggregation?: string;
}

export interface ReportTemplateTotalRowColumnDto {
  fieldId: string;
  aggregationType: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "NONE" | "sum" | "avg" | "count" | "min" | "max" | "none";
  format?: string;
  timeFormat?: string;
}

export interface ReportTemplateTotalRowDto {
  id: string;
  label: string;
  type: "SUM" | "AVG" | "COUNT" | "MIN" | "MAX" | "CUSTOM";
  position: "top" | "bottom";
  showLabel: boolean;
  headerTransform?: "DEFAULT" | "UPPER" | "LOWER";
  columns: ReportTemplateTotalRowColumnDto[];
  groupBy?: ("employee" | "month" | "week" | "none")[];
  labelTemplate?: string;
  showGroupContext?: boolean;
}

export interface ReportTemplateResponseDto {
  id: number;
  publicId: string;
  name?: string;
  description?: string;
  headerTransform: string;
  reportType?: "ASSISTANCE" | "EMPLOYEE_DATA";
  columns: ReportTemplateColumnDto[];
  totalRows?: ReportTemplateTotalRowDto[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateReportTemplateDto {
  name?: string;
  description?: string;
  headerTransform?: string;
  reportType?: "ASSISTANCE" | "EMPLOYEE_DATA";
  columns: ReportTemplateColumnDto[];
  totalRows?: ReportTemplateTotalRowDto[];
}

export interface UpdateReportTemplateDto {
  name?: string;
  description?: string;
  headerTransform?: string;
  reportType?: "ASSISTANCE" | "EMPLOYEE_DATA";
  columns?: ReportTemplateColumnDto[];
  totalRows?: ReportTemplateTotalRowDto[];
}

export interface ReportTemplateFindFilterDto {
  search?: string;
  page?: number;
  pageSize?: number;
  sort?: "asc" | "desc";
}

export interface PaginationReportTemplateDto {
  pagination: PaginationFilterDto;
  data: ReportTemplateResponseDto[];
}
