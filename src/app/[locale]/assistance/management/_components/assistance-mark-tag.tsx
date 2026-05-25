import {
  ChevronLeft,
  ChevronRight,
  Clock,
  PlusCircle,
  Coffee,
} from "lucide-react";

interface AssistanceMarkTagProps {
  type: string;
  scheduleId?: string;
  scheduleBreakId?: string;
  isAditional?: boolean;
}

const AssistanceMarkTag: React.FC<AssistanceMarkTagProps> = ({
  type,
  scheduleId,
  scheduleBreakId,
  isAditional,
}) => {
  const typeCheck = type === "CHECK_IN" ? "Entrada" : "Salida";

  let label = `${typeCheck} Turno`;
  let buttonStyle =
    "rounded-lg border border-blue-100 bg-blue-50 text-blue-600 hover:bg-blue-100";
  let icon = <Clock className="h-5 w-5" />;

  if (scheduleId != null) {
    if (scheduleBreakId != null) {
      label = `${typeCheck} Pausa`;
      buttonStyle =
        "rounded-lg border border-orange-100 bg-orange-50 text-orange-600 hover:bg-orange-100";
      icon = <Coffee className="h-5 w-5" />;
    } else if (isAditional) {
      label = `${typeCheck} Adicional`;
      buttonStyle =
        "rounded-lg border border-purple-100 bg-purple-50 text-purple-600 hover:bg-purple-100";
      icon = <PlusCircle className="h-5 w-5" />;
    }
  } else {
    buttonStyle =
      type === "CHECK_IN"
        ? "rounded-lg border border-green-100 bg-green-50 text-green-600 hover:bg-green-100"
        : "rounded-lg border border-red-100 bg-red-50 text-red-600 hover:bg-red-100";
    icon =
      type === "CHECK_IN" ? (
        <ChevronRight className="h-5 w-5" />
      ) : (
        <ChevronLeft className="h-5 w-5" />
      );
  }

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 font-medium text-sm ${buttonStyle}`}
    >
      {icon}
      {label}
    </span>
  );
};

export default AssistanceMarkTag;
