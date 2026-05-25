"use client";

import {
  CHEKIOButton,
} from "@/components";
import { Badge } from "@/components/ui/badge";
import {
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Calculator,
  Calendar,
  Clock,
  FileText,
  GripVertical,
  Hash,
  Settings,
  Trash2
} from "lucide-react";
import { FormatOption } from "../constants/format-options";
import { FIELD_CATEGORIES, ReportField } from "../report.dto";

interface SortableFieldProps {
  field: ReportField;
  index: number;
  onRemove: (index: number) => void;
  onEdit: (field: ReportField) => void;
  onFormatChange: (
    index: number,
    format: string,
    isTimeFormat?: boolean
  ) => void;
  dateFormatOptions: FormatOption[];
  timeFormatOptions: FormatOption[];
  datetimeFormatOptions: FormatOption[];
}

const getFieldTypeLabel = (field: ReportField): string => {
  if (field.isConsolidated) return "Campo Consolidado";
  if (field.isCalculated) return "Campo Calculado";
  
  const typeMap: Record<string, string> = {
    string: "Texto",
    number: "Número",
    date: "Fecha",
    datetime: "Fecha y Hora",
    time: "Hora",
    boolean: "Sí/No",
  };
  
  return typeMap[field.type] || field.type;
};

const getAggregationLabel = (aggType: string): string => {
  const aggMap: Record<string, string> = {
    SUM: "Suma",
    AVG: "Promedio",
    COUNT: "Conteo",
    MIN: "Mínimo",
    MAX: "Máximo",
    sum: "Suma",
    avg: "Promedio",
    count: "Conteo",
    min: "Mínimo",
    max: "Máximo",
  };
  return aggMap[aggType] || aggType.toUpperCase();
};

const getCalculationLabel = (field: ReportField): string | null => {
  if (!field.isCalculated || !field.calculationType) {
    return null;
  }

  const calcMap: Record<string, string> = {
    sum: "Suma",
    subtract: "Resta",
    multiply: "Multiplicación",
    divide: "División",
    average: "Promedio",
    custom: field.formula ? `Fórmula: ${field.formula}` : "Fórmula Personalizada",
  };

  return calcMap[field.calculationType] || field.calculationType;
};

export default function SortableField({
  field,
  index,
  onRemove,
  onEdit,
  dateFormatOptions,
  timeFormatOptions,
  datetimeFormatOptions,
}: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getColumnLetter = (index: number) => {
    return String.fromCharCode(65 + index);
  };

  const getFieldTypeIcon = () => {
    if (field.isConsolidated) return <FileText size={16} className="text-amber-600" />;
    if (field.isCalculated) return <Calculator size={16} className="text-blue-600" />;
    if (field.type === "number") return <Hash size={16} className="text-blue-500" />;
    if (field.type === "date" || field.type === "datetime") return <Calendar size={16} className="text-green-600" />;
    if (field.type === "time") return <Clock size={16} className="text-purple-600" />;
    return <FileText size={16} className="text-gray-500" />;
  };

  const getFieldTypeBadgeColor = () => {
    if (field.isConsolidated) return "bg-amber-100 text-amber-800 border-amber-300";
    if (field.isCalculated) return "bg-blue-100 text-blue-800 border-blue-300";
    if (field.type === "number") return "bg-blue-50 text-blue-700 border-blue-200";
    if (field.type === "date" || field.type === "datetime") return "bg-green-50 text-green-700 border-green-200";
    if (field.type === "time") return "bg-purple-50 text-purple-700 border-purple-200";
    return "bg-gray-50 text-gray-700 border-gray-200";
  };

  const getCardBackground = () => {
    if (field.isConsolidated) return "bg-gradient-to-r from-amber-50/30 to-white border-amber-200";
    if (field.isCalculated) return "bg-gradient-to-r from-blue-50/30 to-white border-blue-200";
    return "bg-white border-gray-200";
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-4 border-2 ${getCardBackground()} hover:shadow-lg hover:scale-[1.01] transition-all duration-200 rounded-lg`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing text-gray-400 hover:text-gray-600 transition-colors"
      >
        <GripVertical size={18} />
      </div>

      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 border border-gray-200">
          {getFieldTypeIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-base text-gray-900">
              {field.displayName}
            </span>
            <Badge variant="secondary" className="text-xs font-semibold bg-gray-100 text-gray-700">
              Columna {getColumnLetter(index)}
            </Badge>
          </div>
          {field.description && (
            <p className="text-xs text-gray-500 mb-2">{field.description}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={`text-xs font-medium ${getFieldTypeBadgeColor()}`}>
              {getFieldTypeLabel(field)}
            </Badge>
            {field.category && FIELD_CATEGORIES[field.category] && (
              <Badge variant="outline" className="text-xs font-medium bg-gray-50 text-gray-700 border-gray-300">
                {FIELD_CATEGORIES[field.category].title}
              </Badge>
            )}
            {field.isCalculated && getCalculationLabel(field) && (
              <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 border-indigo-300 max-w-xs truncate" title={getCalculationLabel(field) || undefined}>
                {getCalculationLabel(field)}
              </Badge>
            )}
            {!field.isCalculated && !field.isConsolidated && field.aggregationType && field.aggregationType !== "none" && (
              <Badge variant="secondary" className="text-xs bg-indigo-100 text-indigo-800 border-indigo-300">
                {getAggregationLabel(field.aggregationType)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <CHEKIOButton
          variant="secondaryBlue"
          onClick={() => onEdit(field)}
          size="sm"
          className="rounded-none"
        >
          <Settings size={14} />
          Editar
        </CHEKIOButton>
        <CHEKIOButton
          variant="destructive"
          onClick={() => onRemove(index)}
          size="sm"
          className="rounded-none"
        >
          <Trash2 size={14} />
          Eliminar
        </CHEKIOButton>
      </div>
    </div>
  );
}
