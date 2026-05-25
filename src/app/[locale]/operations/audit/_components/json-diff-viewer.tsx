"use client";

import { useMemo } from "react";

interface JsonDiffViewerProps {
  oldValue: any;
  newValue: any;
}

interface DiffLine {
  type: "added" | "removed" | "unchanged" | "modified";
  oldLine?: string;
  newLine?: string;
  oldLineNumber?: number;
  newLineNumber?: number;
}

export function JsonDiffViewer({ oldValue, newValue }: JsonDiffViewerProps) {
  const diffData = useMemo(() => {
    const oldJson = oldValue ? JSON.stringify(oldValue, null, 2) : "";
    const newJson = newValue ? JSON.stringify(newValue, null, 2) : "";

    const oldLines = oldJson.split("\n");
    const newLines = newJson.split("\n");

    // Use a more sophisticated diff algorithm
    // Simple approach: compare line by line and track line numbers separately
    const diff: DiffLine[] = [];
    let oldIndex = 0;
    let newIndex = 0;
    let oldLineNum = 1;
    let newLineNum = 1;

    while (oldIndex < oldLines.length || newIndex < newLines.length) {
      const oldLine = oldIndex < oldLines.length ? oldLines[oldIndex] : undefined;
      const newLine = newIndex < newLines.length ? newLines[newIndex] : undefined;

      // Normalize whitespace for comparison
      const oldTrimmed = oldLine?.trim();
      const newTrimmed = newLine?.trim();

      if (oldLine === undefined && newLine !== undefined) {
        // Added line
        diff.push({
          type: "added",
          newLine,
          newLineNumber: newLineNum++,
        });
        newIndex++;
      } else if (oldLine !== undefined && newLine === undefined) {
        // Removed line
        diff.push({
          type: "removed",
          oldLine,
          oldLineNumber: oldLineNum++,
        });
        oldIndex++;
      } else if (oldTrimmed === newTrimmed || oldLine === newLine) {
        // Unchanged line
        diff.push({
          type: "unchanged",
          oldLine,
          newLine,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
        oldIndex++;
        newIndex++;
      } else {
        // Modified line - show both
        diff.push({
          type: "modified",
          oldLine,
          newLine,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
        oldIndex++;
        newIndex++;
      }
    }

    return diff;
  }, [oldValue, newValue]);

  const getLineClass = (type: DiffLine["type"]) => {
    switch (type) {
      case "added":
        return "bg-green-50 text-green-900 border-l-4 border-green-500";
      case "removed":
        return "bg-red-50 text-red-900 border-l-4 border-red-500";
      case "modified":
        return "bg-yellow-50 text-yellow-900 border-l-4 border-yellow-500";
      default:
        return "bg-white text-gray-900";
    }
  };

  const getLinePrefix = (type: DiffLine["type"]) => {
    switch (type) {
      case "added":
        return "+";
      case "removed":
        return "-";
      case "modified":
        return "~";
      default:
        return " ";
    }
  };

  return (
    <div className="grid grid-cols-2 gap-0 border border-gray-200 rounded-lg overflow-hidden">
      {/* Previous Values Column */}
      <div className="flex flex-col border-r border-gray-200">
        <div className="bg-orange-100 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
          <h3 className="text-sm font-semibold text-orange-900 flex items-center gap-2">
            <span className="text-orange-600">Valores Anteriores</span>
          </h3>
        </div>
        <div className="overflow-auto max-h-[600px] font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {diffData.map((diffLine, index) => (
                <tr key={`old-${index}`} className={getLineClass(diffLine.type)}>
                  <td className="px-2 py-1 text-gray-500 text-right border-r border-gray-200 select-none w-10 bg-gray-50">
                    {diffLine.oldLineNumber || "\u00A0"}
                  </td>
                  <td className="px-2 py-1 text-gray-700 select-none w-4 border-r border-gray-200 text-center font-bold">
                    {diffLine.oldLine !== undefined &&
                      (diffLine.type === "removed" || diffLine.type === "modified")
                      ? getLinePrefix(diffLine.type)
                      : ""}
                  </td>
                  <td className="px-3 py-1 whitespace-pre">
                    {diffLine.oldLine !== undefined ? diffLine.oldLine : "\u00A0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Values Column */}
      <div className="flex flex-col">
        <div className="bg-green-100 px-4 py-3 border-b border-gray-200 sticky top-0 z-10">
          <h3 className="text-sm font-semibold text-green-900 flex items-center gap-2">
            <span className="text-green-600">Valores Nuevos</span>
          </h3>
        </div>
        <div className="overflow-auto max-h-[600px] font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {diffData.map((diffLine, index) => (
                <tr key={`new-${index}`} className={getLineClass(diffLine.type)}>
                  <td className="px-2 py-1 text-gray-500 text-right border-r border-gray-200 select-none w-10 bg-gray-50">
                    {diffLine.newLineNumber || "\u00A0"}
                  </td>
                  <td className="px-2 py-1 text-gray-700 select-none w-4 border-r border-gray-200 text-center font-bold">
                    {diffLine.newLine !== undefined &&
                      (diffLine.type === "added" || diffLine.type === "modified")
                      ? getLinePrefix(diffLine.type)
                      : ""}
                  </td>
                  <td className="px-3 py-1 whitespace-pre">
                    {diffLine.newLine !== undefined ? diffLine.newLine : "\u00A0"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

