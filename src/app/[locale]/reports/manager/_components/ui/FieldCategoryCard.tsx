"use client";

import { CHEKIOInput } from "@/components";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Plus, 
  Search, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  PartyPopper,
  Clock,
  Users,
  Building2,
  Briefcase,
  CalendarClock,
  Timer
} from "lucide-react";
import { useState } from "react";
import { FIELD_CATEGORIES, FieldCategory, ReportField } from "../report.dto";

interface FieldCategoryCardProps {
  category: keyof typeof FIELD_CATEGORIES;
  onAddField: (field: ReportField) => void;
}

const getFieldTypeLabel = (type: string, field: ReportField): string => {
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
  
  return typeMap[type] || type;
};

const getCategoryIcon = (category: keyof typeof FIELD_CATEGORIES) => {
  const iconProps = { className: "w-7 h-7", strokeWidth: 2 };
  
  switch (category) {
    case FieldCategory.EMPLOYEE:
      return <Users {...iconProps} className="w-7 h-7 text-blue-600" />;
    case FieldCategory.POSITION:
      return <Briefcase {...iconProps} className="w-7 h-7 text-slate-600" />;
    case FieldCategory.BRANCH:
      return <Building2 {...iconProps} className="w-7 h-7 text-purple-600" />;
    case FieldCategory.COMPANY:
      return <Building2 {...iconProps} className="w-7 h-7 text-gray-600" />;
    case FieldCategory.SHIFT:
      return <Clock {...iconProps} className="w-7 h-7 text-sky-600" />;
    case FieldCategory.SCHEDULE:
      return <CalendarClock {...iconProps} className="w-7 h-7 text-gray-600" />;
    case FieldCategory.ATTENDANCE:
      return <CheckCircle {...iconProps} className="w-7 h-7 text-blue-600" />;
    case FieldCategory.ABSENCE:
      return <XCircle {...iconProps} className="w-7 h-7 text-slate-600" />;
    case FieldCategory.OVERTIME:
      return <Timer {...iconProps} className="w-7 h-7 text-orange-600" />;
    case FieldCategory.HOLIDAY:
      return <PartyPopper {...iconProps} className="w-7 h-7 text-gray-600" />;
    default:
      return <Calendar {...iconProps} className="w-7 h-7 text-gray-600" />;
  }
};

export default function FieldCategoryCard({
  category,
  onAddField,
}: FieldCategoryCardProps) {
  const categoryData = FIELD_CATEGORIES[category];
  const [searchTerm, setSearchTerm] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredFields = categoryData.fields.filter(
    (field) =>
      field.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`bg-white border-2 ${categoryData.borderColor} hover:shadow-xl transition-all duration-300 rounded-lg overflow-hidden ${
        isExpanded ? "shadow-lg" : ""
      }`}
    >
      <div
        className={`p-5 cursor-pointer bg-gradient-to-r ${categoryData.bgColor} hover:opacity-90 transition-all duration-200 ${
          isExpanded ? "border-b-2 border-gray-200" : ""
        }`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-14 h-14 rounded-full bg-white/80 shadow-md border-2 border-white/50">
            {getCategoryIcon(category)}
          </div>
          <div className="flex-1">
            <h3 className={`text-xl font-bold ${categoryData.textColor} mb-1`}>
              {categoryData.title}
            </h3>
            <p className="text-sm text-gray-700 font-medium">{categoryData.description}</p>
          </div>
          <div
            className={`transform transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            <div className="w-10 h-10 rounded-full bg-white/80 flex items-center justify-center shadow-md">
              <svg
                className={`w-6 h-6 ${categoryData.textColor}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2.5}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div 
            className="relative mt-4"
            onClick={(e) => e.stopPropagation()}
          >
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <CHEKIOInput
              type="text"
              placeholder="Buscar campos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="pl-11 bg-white/90 border-white/50 shadow-sm"
            />
          </div>
        )}
      </div>

      {isExpanded && (
        <div className="p-4 bg-gray-50/50">
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredFields.map((field) => (
                <div
                  key={field.id}
                  className={`p-3 border-2 rounded-lg hover:shadow-md cursor-pointer transition-all duration-200 bg-white border-gray-200 hover:border-gray-400`}
                  onClick={() => onAddField(field)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-gray-900">
                        {field.displayName}
                      </div>
                      {field.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {field.description}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center border border-blue-200">
                      <Plus size={16} className="text-blue-600" />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="outline" className="text-xs font-medium">
                      {getFieldTypeLabel(field.type, field as ReportField)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
