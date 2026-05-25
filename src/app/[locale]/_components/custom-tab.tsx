export const CustomTab = ({
  label,
  active,
  onClick,
  count,
  color = "blue",
  colorAlert = "yellow",
  activateAlert = false,
}: {
  label: string;
  activateAlert?: boolean;
  active: boolean;
  onClick: () => void;
  count: number;
  color: string;
  colorAlert?: string;
}) => {
  let className = "relative cursor-pointer px-6 py-3 rounded-t-lg text-base";

  if (active) {
    className +=
      "bg-white border-t-2 border-x-2 border-gray-200 shadow-inner-top";
  }

  if (activateAlert) {
    className += ` bg-${colorAlert}-100 animate-pulse`;
  } else {
    className += " bg-gray-50 hover:bg-gray-100";
  }

  // Función para obtener las clases de color del badge
  const getBadgeColorClasses = (color: string) => {
    // Si es un color hexadecimal, usar estilos inline
    if (color.startsWith("#")) {
      return "border-gray-200"; // Solo el borde, el fondo y texto se manejan con style
    }

    // Mapeo para colores con nombre
    const colorMap: { [key: string]: string } = {
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      green: "bg-green-100 text-green-800 border-green-200",
      red: "bg-red-100 text-red-800 border-red-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      orange: "bg-orange-100 text-orange-800 border-orange-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colorMap[color] || colorMap.blue;
  };

  // Función para obtener el color de texto basado en el color de fondo
  const getTextColor = (backgroundColor: string) => {
    if (backgroundColor.startsWith("#")) {
      // Convertir hex a RGB y calcular luminancia
      const hex = backgroundColor.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
      return luminance > 0.5 ? "#000000" : "#ffffff";
    }
    return "#000000";
  };

  return (
    <div
      onClick={onClick}
      className={`
          relative cursor-pointer px-6 py-3 rounded-t-lg text-base
          ${className}
          transition-all duration-600
        `}
      style={{
        borderTopColor: active ? color : "transparent",
        marginBottom: active ? "-2px" : "0",
        zIndex: active ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-2">
        <span className={`${active ? "font-semibold" : ""}`}>{label}</span>
        {count > 0 && (
          <span
            className={`
              inline-flex items-center justify-center min-w-[1.25rem] h-[1.25rem] px-1
              font-semibold rounded-full border
              ${getBadgeColorClasses(color)}
              transition-all duration-200
            `}
            style={
              color.startsWith("#")
                ? {
                    backgroundColor: color,
                    color: getTextColor(color),
                    borderColor: color,
                  }
                : undefined
            }
          >
            {count}
          </span>
        )}
      </div>
    </div>
  );
};
