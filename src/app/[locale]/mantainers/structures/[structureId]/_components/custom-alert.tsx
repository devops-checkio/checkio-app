import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

interface CustomAlertProps {
  type: "success" | "error" | "info";
  message: string;
  description: string;
  onClose: () => void;
}

export function CustomAlert({
  type,
  message,
  description,
  onClose,
}: CustomAlertProps) {
  const bgColor =
    type === "success"
      ? "bg-green-50"
      : type === "error"
      ? "bg-red-50"
      : "bg-blue-50";
  const borderColor =
    type === "success" ? "border-green-200" : "border-red-200";
  const textColor =
    type === "success"
      ? "text-green-800"
      : type === "error"
      ? "text-red-800"
      : "text-blue-800";
  const iconColor = type === "success" ? "text-green-500" : "text-red-500";

  return (
    <div
      className={`${bgColor} border ${borderColor} rounded-lg p-4 relative animate-fade-in`}
    >
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X size={18} />
      </button>
      <div className="flex items-start gap-3">
        {type === "success" ? (
          <CheckCircle2 className={`${iconColor} mt-0.5`} size={20} />
        ) : type === "error" ? (
          <AlertCircle className={`${iconColor} mt-0.5`} size={20} />
        ) : (
          <Info className={`${iconColor} mt-0.5`} size={20} />
        )}
        <div className="flex-1">
          <h4 className={`font-medium ${textColor}`}>{message}</h4>
          <p className={`text-sm mt-1 ${textColor} opacity-90`}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
