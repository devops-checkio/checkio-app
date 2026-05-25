export interface EvaluateCustomFormulaParams {
  formula: string;
  values: number[];
  fieldNames: string[];
}

export interface ValidateFormulaResult {
  isValid: boolean;
  error?: string;
}

export const validateCustomFormula = (
  formula: string,
  fieldCount: number
): ValidateFormulaResult => {
  if (!formula || !formula.trim()) {
    return {
      isValid: false,
      error: "La fórmula no puede estar vacía",
    };
  }

  if (fieldCount < 2) {
    return {
      isValid: false,
      error: "Debe seleccionar al menos 2 campos para usar una fórmula personalizada",
    };
  }

  const validVariables: string[] = [];
  for (let i = 0; i < fieldCount; i++) {
    validVariables.push(String.fromCharCode(65 + i));
  }

  const formulaWithoutSpaces = formula.replace(/\s+/g, "");
  
  const variablePattern = /[A-Za-z_][A-Za-z0-9_]*/g;
  const foundVariables = formulaWithoutSpaces.match(variablePattern) || [];
  
  const invalidVariables = foundVariables.filter((varName) => {
    const upperVar = varName.toUpperCase();
    if (validVariables.includes(upperVar)) {
      return false;
    }
    
    if (/^\d/.test(varName)) {
      return false;
    }
    
    const mathFunctions = ["SIN", "COS", "TAN", "SQRT", "ABS", "ROUND", "FLOOR", "CEIL", "MAX", "MIN", "POW", "LOG", "EXP"];
    if (mathFunctions.includes(upperVar)) {
      return false;
    }
    
    return true;
  });

  if (invalidVariables.length > 0) {
    const uniqueInvalid = [...new Set(invalidVariables)];
    return {
      isValid: false,
      error: `Variables inválidas encontradas: ${uniqueInvalid.join(", ")}. Use solo ${validVariables.join(", ")}`,
    };
  }

  try {
    let testFormula = formula
      .replace(/(\d+),(\d+)/g, "$1.$2")
      .replace(/(\d+),(\s|\)|$)/g, "$1.$2")
      .trim();

    for (let i = 0; i < fieldCount; i++) {
      const letter = String.fromCharCode(65 + i);
      const regex = new RegExp(`(^|[^a-zA-Z0-9_])${letter}(?![a-zA-Z0-9_])`, "g");
      testFormula = testFormula.replace(regex, `$1${1}`);
    }

    testFormula = testFormula.replace(/\s+/g, "");

    if (!testFormula || testFormula.trim() === "") {
      return {
        isValid: false,
        error: "La fórmula no puede estar vacía después de procesar",
      };
    }

    Function(`"use strict"; return (${testFormula})`)();

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: "La fórmula contiene errores de sintaxis",
    };
  }
};

export const evaluateCustomFormula = ({
  formula,
  values,
  fieldNames,
}: EvaluateCustomFormulaParams): number => {
  try {
    if (!formula || !formula.trim()) {
      return 0;
    }

    if (!values || values.length === 0) {
      return 0;
    }

    let evaluatedFormula = formula
      .replace(/(\d+),(\d+)/g, "$1.$2")
      .replace(/(\d+),(\s|\)|$)/g, "$1.$2")
      .trim();

    for (let i = 0; i < values.length; i++) {
      const letter = String.fromCharCode(65 + i);
      const regex = new RegExp(`(^|[^a-zA-Z0-9_])${letter}(?![a-zA-Z0-9_])`, "g");
      evaluatedFormula = evaluatedFormula.replace(regex, `$1${values[i].toString()}`);
    }

    if (fieldNames && fieldNames.length === values.length) {
      for (let i = 0; i < fieldNames.length; i++) {
        const fieldName = fieldNames[i];
        if (fieldName && fieldName.trim()) {
          const escapedName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          const regex = new RegExp(`(^|[^a-zA-Z0-9_])${escapedName}(?![a-zA-Z0-9_])`, "g");
          evaluatedFormula = evaluatedFormula.replace(regex, `$1${values[i].toString()}`);
        }
      }
    }

    // Replace any single-letter variables left unreplaced (e.g., B, C) with 0
    // to avoid ReferenceError during evaluation.
    evaluatedFormula = evaluatedFormula.replace(/(^|[^a-zA-Z0-9_])([A-Z])(?![a-zA-Z0-9_])/g, (_match, p1) => {
      return p1 + "0";
    });

    evaluatedFormula = evaluatedFormula.replace(/\s+/g, "");

    if (!evaluatedFormula || evaluatedFormula.trim() === "") {
      return 0;
    }

    const result = Function(`"use strict"; return (${evaluatedFormula})`)();

    if (typeof result === "number" && !isNaN(result) && isFinite(result)) {
      return result;
    }

    return 0;
  } catch (error) {
    console.error("Error evaluando fórmula personalizada:", error);
    return 0;
  }
};
