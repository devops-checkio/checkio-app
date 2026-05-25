import { ReportField, TotalRow, TotalRowType } from "../report.dto";
import { FormatOptionDto } from "./format-options.dto";

export enum CalculationType {
  SUM = "sum",
  SUBTRACT = "subtract",
  MULTIPLY = "multiply",
  DIVIDE = "divide",
  AVERAGE = "average",
  CUSTOM = "custom",
}

export type AggregationType =
  | "SUM"
  | "AVG"
  | "COUNT"
  | "MIN"
  | "MAX"
  | "NONE"
  | "sum"
  | "avg"
  | "count"
  | "min"
  | "max"
  | "none";

export type HeaderTransform = "DEFAULT" | "UPPER" | "LOWER";

export interface FieldFormatDto {
  format?: string;
  timeFormat?: string;
}

export interface ConsolidatedFieldDataDto {
  name: string;
  headerTransform: HeaderTransform;
  separator: string;
  fieldIds: string[];
  fieldFormats: Array<{
    fieldId: string;
    format?: string;
    timeFormat?: string;
  }>;
}

export interface TotalRowDataDto {
  label: string;
  type: TotalRowType;
  position: "top" | "bottom";
  showLabel: boolean;
  headerTransform: HeaderTransform;
  columns: Array<{
    fieldId: string;
    aggregationType: AggregationType;
    format?: string;
  }>;
}

export interface CalculatedFieldDataDto {
  name: string;
  headerTransform: HeaderTransform;
  calculationType: CalculationType;
  formula?: string;
  format?: string;
  fieldIds: string[];
}

export interface EditFieldModalPropsDto {
  field: ReportField;
  onSave: (field: ReportField) => void;
  onClose: () => void;
  isOpen: boolean;
  selectedFieldsForConsolidation: string[];
  consolidatedSeparator: string;
  consolidatedFieldFormats: Map<string, FieldFormatDto>;
  consolidatedFieldsSearchTerm: string;
  onToggleFieldForConsolidation: (fieldId: string) => void;
  onMoveFieldUp: (index: number) => void;
  onMoveFieldDown: (index: number) => void;
  onFormatChange: (fieldId: string, format: FieldFormatDto) => void;
  onSearchChange: (term: string) => void;
  onSeparatorChange: (separator: string) => void;
  expandedFormatFields: Set<string>;
  onToggleFormatExpanded: (fieldId: string) => void;
  getFormatOptions: (field: ReportField) => FormatOptionDto[];
}

export interface ConsolidatedFieldModalPropsDto {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: ConsolidatedFieldDataDto) => void;
  fieldName: string;
  headerTransform: HeaderTransform;
  separator: string;
  selectedFields: string[];
  fieldFormats: Map<string, FieldFormatDto>;
  searchTerm: string;
  expandedFormatFields: Set<string>;
  onFieldNameChange: (name: string) => void;
  onHeaderTransformChange: (transform: HeaderTransform) => void;
  onSeparatorChange: (separator: string) => void;
  onToggleField: (fieldId: string) => void;
  onMoveFieldUp: (index: number) => void;
  onMoveFieldDown: (index: number) => void;
  onSearchChange: (term: string) => void;
  onFormatChange: (fieldId: string, format: FieldFormatDto) => void;
  onToggleFormatExpanded: (fieldId: string) => void;
  getFormatOptions: (field: ReportField) => FormatOptionDto[];
}

export interface TotalRowModalPropsDto {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: TotalRowDataDto) => void;
  editingTotalRow: TotalRow | null;
  label: string;
  type: TotalRowType;
  position: "top" | "bottom";
  showLabel: boolean;
  headerTransform: HeaderTransform;
  selectedFieldsForTotal: Map<string, AggregationType>;
  fieldFormats: Map<string, string>;
  availableFields: ReportField[];
  onLabelChange: (label: string) => void;
  onTypeChange: (type: TotalRowType) => void;
  onPositionChange: (position: "top" | "bottom") => void;
  onShowLabelChange: (show: boolean) => void;
  onHeaderTransformChange: (transform: HeaderTransform) => void;
  onToggleFieldForTotal: (fieldId: string, aggregationType: AggregationType) => void;
  onFormatChange: (fieldId: string, format: string) => void;
  getFormatOptions: (field: ReportField) => FormatOptionDto[];
}

export interface CalculatedFieldModalPropsDto {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: CalculatedFieldDataDto) => void;
  editingField: ReportField | null;
  fieldName: string;
  headerTransform: HeaderTransform;
  calculationType: CalculationType;
  customFormula: string;
  format: string | undefined;
  selectedFields: string[];
  availableFields: ReportField[];
  onFieldNameChange: (name: string) => void;
  onHeaderTransformChange: (transform: HeaderTransform) => void;
  onCalculationTypeChange: (type: CalculationType) => void;
  onFormulaChange: (formula: string) => void;
  onFormatChange: (format: string | undefined) => void;
  onToggleField: (fieldId: string) => void;
  evaluateCustomFormula: (formula: string, values: number[], fieldNames: string[]) => number;
  getFormatOptions: (field: ReportField) => FormatOptionDto[];
}
