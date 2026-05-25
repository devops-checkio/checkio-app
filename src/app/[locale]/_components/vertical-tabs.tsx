import { Badge } from "antd";

interface VerticalTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
  count: number;
  color?: string;
  colorAlert?: string;
  activateAlert?: boolean;
  icon?: React.ReactNode;
}

export const VerticalTab = ({
  label,
  active,
  onClick,
  count,
  color = "blue",
  colorAlert = "yellow",
  activateAlert = false,
  icon,
}: VerticalTabProps) => {
  let className =
    "relative cursor-pointer px-4 py-3 rounded-l-lg text-base w-full text-left transition-all duration-300";

  if (active) {
    className += " bg-white border-l-4 border-gray-200 shadow-sm";
  }

  if (activateAlert) {
    className += ` bg-${colorAlert}-100 animate-pulse`;
  } else {
    className += " bg-gray-50 hover:bg-gray-100";
  }

  return (
    <div
      onClick={onClick}
      className={className}
      style={{
        borderLeftColor: active ? color : "transparent",
        marginRight: active ? "-1px" : "0",
        zIndex: active ? 1 : 0,
      }}
    >
      <div className="flex items-center gap-3">
        {icon && <div className="flex-shrink-0">{icon}</div>}
        <span className={`flex-1 ${active ? "font-semibold" : ""}`}>
          {label}
        </span>
        {count > 0 && <Badge count={count} color={color} />}
      </div>
    </div>
  );
};

interface VerticalTabsProps {
  tabs: {
    id: string;
    label: string;
    count: number;
    color?: string;
    colorAlert?: string;
    activateAlert?: boolean;
    icon?: React.ReactNode;
  }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export const VerticalTabs = ({
  tabs,
  activeTab,
  onTabChange,
  className = "",
}: VerticalTabsProps) => {
  return (
    <div className={`w-64 bg-gray-50 border-r border-gray-200 ${className}`}>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
        <div className="space-y-1">
          {tabs.map((tab) => (
            <VerticalTab
              key={tab.id}
              label={tab.label}
              active={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
              count={tab.count}
              color={tab.color}
              colorAlert={tab.colorAlert}
              activateAlert={tab.activateAlert}
              icon={tab.icon}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
