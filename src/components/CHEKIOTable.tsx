"use client";

import { useCookieSession } from "@/context/useCookieSession";
import { cn } from "@/lib/utils";
import * as React from "react";

export interface CHEKIOTableProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CHEKIOTable = React.forwardRef<HTMLDivElement, CHEKIOTableProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
          className
        )}
        {...props}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">{children}</table>
        </div>
      </div>
    );
  }
);
CHEKIOTable.displayName = "CHEKIOTable";

const CHEKIOTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primaryColor = templateUser?.primary ?? "#eb1d2e";

  return (
    <thead
      ref={ref}
      className={cn("border-b border-gray-200", className)}
      style={{ backgroundColor: `${primaryColor}15`, ...style }}
      {...props}
    />
  );
});
CHEKIOTableHeader.displayName = "CHEKIOTableHeader";

const CHEKIOTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("divide-y divide-gray-100", className)} {...props} />
));
CHEKIOTableBody.displayName = "CHEKIOTableBody";

const CHEKIOTableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, style, ...props }, ref) => {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primaryColor = templateUser?.primary ?? "#eb1d2e";

  return (
    <tfoot
      ref={ref}
      className={cn("font-medium text-white", className)}
      style={{ backgroundColor: primaryColor, ...style }}
      {...props}
    />
  );
});
CHEKIOTableFooter.displayName = "CHEKIOTableFooter";

const CHEKIOTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    index?: number;
  }
>(({ className, index, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "transition-colors duration-150",
      "hover:bg-gray-50/80",
      index !== undefined && index % 2 === 0 ? "bg-gray-50/80" : "bg-white",
      className
    )}
    {...props}
  />
));
CHEKIOTableRow.displayName = "CHEKIOTableRow";

const CHEKIOTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, style, ...props }, ref) => {
  const { getTemplateUser } = useCookieSession();
  const templateUser = getTemplateUser();
  const primaryColor = templateUser?.primary ?? "#eb1d2e";

  return (
    <th
      ref={ref}
      className={cn(
        "px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider",
        className
      )}
      style={{ color: primaryColor, ...style }}
      {...props}
    />
  );
});
CHEKIOTableHead.displayName = "CHEKIOTableHead";

const CHEKIOTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "px-4 py-3 text-sm text-gray-900",
      className
    )}
    {...props}
  />
));
CHEKIOTableCell.displayName = "CHEKIOTableCell";

const CHEKIOTableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-gray-500", className)}
    {...props}
  />
));
CHEKIOTableCaption.displayName = "CHEKIOTableCaption";

export {
  CHEKIOTable,
  CHEKIOTableBody,
  CHEKIOTableCaption,
  CHEKIOTableCell,
  CHEKIOTableFooter,
  CHEKIOTableHead,
  CHEKIOTableHeader,
  CHEKIOTableRow,
};
