import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

export type ButtonItem = {
  label: string;
  disabled: boolean;
  type: "ACTION" | "LINK";
  link?: string;
  onClick?: () => void;
};

type ButtonSelectorType = {
  children?: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  color?: string;
  type?: "button" | "dropdown";
  props?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  items?: ButtonItem[];
};

const ButtonSelector: React.FC<ButtonSelectorType> = ({
  className = "",
  children,
  onClick,
  type = "button",
  disabled,
  items = [],
  props,
}) => {
  const classConfig = `${className} w-auto ml-1 mr-1 middle h-10 none center rounded-lg py-3 px-3 font-sans text-xs font-bold text-white shadow-md shadow-[#1752E7]/20 transition-all hover:shadow-lg hover:shadow-[#1752E7]/40 focus:opacity-[0.85] focus:shadow-none active:opacity-[0.85] active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none`;
  if (type === "dropdown") {
    return (
      <>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              disabled={disabled}
              variant="default"
              size="sm"
              className="flex-shrink-0"
            >
              <div className="flex flex-row gap-2">
                {children}
                <ChevronDownIcon className="-mr-1 h-5 w-5" aria-hidden="true" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            {items.map((item, index) =>
              item.type === "LINK" ? (
                <DropdownMenuItem key={index} asChild disabled={item.disabled}>
                  <Link href={item.link || "#"}>{item.label}</Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  key={index}
                  disabled={item.disabled}
                  onClick={item.onClick}
                >
                  {item.label}
                </DropdownMenuItem>
              )
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  }

  return (
    <button
      {...props}
      type={type}
      className={`${classConfig} disabled:bg-slate-300 bg-[#1752E7]`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default ButtonSelector;
