"use client";

import {
  CHEKIOInput,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useGetOrganizationalUnitsTree } from "@/service/mantainer.service";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { TreeItem } from "./employee.dto";

interface OrganizationSelectorProps {
  control: any;
  name: string;
  onChange?: (value: string[]) => void;
  companyId: string;
  reset?: () => void;
  resetFieldsFn?: (fields: string[]) => void;
  /** "horizontal" for filter bars (levels in a row), "vertical" for forms (levels stacked) */
  layout?: "horizontal" | "vertical";
}

interface OrganizationSelectorComponentProps {
  control: any;
  name: string;
  onChange?: (value: string[]) => void;
  data: { tree: TreeItem[]; names: string[] };
  reset?: () => void;
  resetFieldsFn?: (fields: string[]) => void;
  layout?: "horizontal" | "vertical";
}

export function OrganizationSelectorComponent({
  control,
  onChange,
  data,
  reset,
  name,
  resetFieldsFn,
  layout = "vertical",
}: OrganizationSelectorComponentProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [levels, setLevels] = useState<TreeItem[][]>([data?.tree!]);

  // Obtener los valores iniciales del formulario
  const formValues = useWatch({ control });

  // Efecto para inicializar los valores seleccionados desde el formulario
  useEffect(() => {
    const initializeValues = () => {
      const values: string[] = [];
      let index = 1;

      while (formValues[`subUnit${index}Id`]) {
        values.push(formValues[`subUnit${index}Id`]);
        index++;
      }

      if (values.length > 0) {
        setSelectedValues(values);
        // Reconstruir los niveles basados en los valores iniciales
        const newLevels = [data?.tree!];
        let currentItems = data?.tree!;

        for (let i = 0; i < values.length; i++) {
          const selectedItem = currentItems.find(
            (item) => item.publicId === values[i]
          );
          if (selectedItem?.items?.length && selectedItem?.items?.length > 0) {
            currentItems = selectedItem.items!;
            newLevels.push(currentItems);
          }
        }
        setLevels(newLevels);
      }
    };

    initializeValues();
  }, [data, formValues, control]);

  const handleLevelChange = (value: string, level: number) => {
    // Update selected values up to current level
    const newSelectedValues = selectedValues.slice(0, level);
    newSelectedValues[level] = value;
    setSelectedValues(newSelectedValues);

    // Find the selected item at current level
    let currentItems = data?.tree!;
    let selectedItem = null;

    for (let i = 0; i <= level; i++) {
      selectedItem = currentItems.find(
        (item) => item.publicId === newSelectedValues[i]
      );
      if (selectedItem && i < level) {
        currentItems = selectedItem.items!;
      }
    }

    // Update levels based on selection
    const newLevels = [data?.tree!];
    currentItems = data?.tree!;

    for (let i = 0; i < newSelectedValues.length; i++) {
      selectedItem = currentItems.find(
        (item) => item.publicId === newSelectedValues[i]
      );
      if (selectedItem?.items?.length && selectedItem?.items?.length > 0) {
        currentItems = selectedItem.items!;
        newLevels.push(currentItems);
      }
    }

    setLevels(newLevels);

    if (onChange) {
      onChange(newSelectedValues);
    }
  };

  const handleClearLevel = (level: number) => {
    // Limpiar desde el nivel actual hacia adelante
    const newSelectedValues = selectedValues.slice(0, level);
    setSelectedValues(newSelectedValues);

    // Actualizar los niveles
    const newLevels = levels.slice(0, level + 1);
    setLevels(newLevels);

    // Crear un objeto con los campos a resetear
    const fieldsToReset: string[] = [];
    for (let i = level + 1; i <= 8; i++) {
      fieldsToReset.push(`subUnit${i}Id`);
    }

    // Resetear los campos específicos utilizando la función de callback
    if (resetFieldsFn) {
      resetFieldsFn(fieldsToReset);
    }

    if (onChange) {
      onChange(newSelectedValues);
    }
  };

  const levelElements = levels.map((levelItems, index) => {
    const labelName =
      data?.names[index]?.charAt(0).toUpperCase() +
      data?.names[index]?.slice(1).toLowerCase();
    const placeholder = `Seleccione ${labelName}`;
    const hasValue = selectedValues[index] !== undefined;

    return (
      <div
        key={index}
        className={
          layout === "horizontal"
            ? "min-w-[160px] shrink-0 space-y-2 sm:min-w-[180px]"
            : "w-full space-y-2"
        }
      >
        <label className="text-sm font-medium text-gray-700">
          {labelName}
        </label>
        <Controller
          control={control}
          name={`subUnit${index + 1}Id`}
          render={({ field }) => (
            <div className="relative">
              <CHEKIOSelect
                value={selectedValues[index] || undefined}
                onValueChange={(value) => {
                  handleLevelChange(value, index);
                  field.onChange(value);
                }}
              >
                <CHEKIOSelectTrigger className="w-full">
                  <CHEKIOSelectValue placeholder={placeholder} />
                </CHEKIOSelectTrigger>
                <CHEKIOSelectContent>
                  {levelItems.map((item: any) => (
                    <CHEKIOSelectItem
                      key={item.publicId}
                      value={item.publicId}
                    >
                      {item.name}
                    </CHEKIOSelectItem>
                  ))}
                </CHEKIOSelectContent>
              </CHEKIOSelect>
              {hasValue && (
                <button
                  type="button"
                  onClick={() => handleClearLevel(index)}
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Limpiar selección"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        />
      </div>
    );
  });

  if (layout === "horizontal") {
    return (
      <div className="flex w-full flex-wrap items-end gap-4">
        {levelElements}
      </div>
    );
  }

  return <>{levelElements}</>;
}

export default function OrganizationSelector({
  control,
  name,
  onChange,
  companyId,
  reset,
  resetFieldsFn,
  layout = "vertical",
}: OrganizationSelectorProps) {
  const { data, isLoading } = useGetOrganizationalUnitsTree(companyId);
  if (isLoading) {
    return <></>;
  }
  if (data?.tree.length === 0) {
    return (
      <div className="w-full space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Estructura Organizacional
        </label>
        <CHEKIOInput
          type="text"
          value="Sin estructura"
          disabled
          className="bg-gray-100 text-gray-500 cursor-not-allowed"
        />
      </div>
    );
  }
  return (
    <OrganizationSelectorComponent
      control={control}
      name={name}
      onChange={onChange}
      reset={reset}
      resetFieldsFn={resetFieldsFn}
      layout={layout}
      data={data || { tree: [], names: [] }}
    />
  );
}
