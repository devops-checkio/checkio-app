import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const formatDocumentType = {
  DNI: (value: string) => {
    // Argentina, Peru, Ecuador format: 8-9 digits
    return value
      .replace(/\W/g, "")
      .replace(/(\d{8})(\d{1})?/, "$1-$2")
      .trim();
  },
  RUT: (value: string) => {
    // Chile, Uruguay format: XX.XXX.XXX-X
    return value
      .replace(/\W/g, "")
      .replace(/(\d{1,2})(\d{3})(\d{3})(\w{1})/, "$1.$2.$3-$4")
      .trim();
  },
  CURP: (value: string) => {
    // Mexico format: AAAA000000AAAAAA00
    return value.replace(/(\w{4})(\d{6})(\w{6})(\d{2})/, "$1$2$3$4").trim();
  },
  CPF: (value: string) => {
    // Brasil format: XXX.XXX.XXX-XX
    return value
      .replace(/\W/g, "")
      .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
      .trim();
  },
  CC: (value: string) => {
    // Colombia format: X.XXX.XXX.XXX
    return value
      .replace(/\W/g, "")
      .replace(/(\d{1})(\d{3})(\d{3})(\d{3})/, "$1.$2.$3.$4")
      .trim();
  },
  CI: (value: string) => {
    // Bolivia, Paraguay format: X.XXX.XXX
    return value
      .replace(/\W/g, "")
      .replace(/(\d{1})(\d{3})(\d{3})/, "$1.$2.$3")
      .trim();
  },
  DPI: (value: string) => {
    // Guatemala format: XXXX XXXXX XXXX
    return value
      .replace(/\W/g, "")
      .replace(/(\d{4})(\d{5})(\d{4})/, "$1 $2 $3")
      .trim();
  },
  DUI: (value: string) => {
    // El Salvador format: XXXXXXXX-X
    return value
      .replace(/\W/g, "")
      .replace(/(\d{8})(\d{1})/, "$1-$2")
      .trim();
  },
  CIP: (value: string) => {
    // Panama format: X-XXX-XXXX
    return value
      .replace(/\W/g, "")
      .replace(/(\d{1})(\d{3})(\d{4})/, "$1-$2-$3")
      .trim();
  },
  CEDULA: (value: string) => {
    // Venezuela, Nicaragua, Costa Rica, Honduras, Dominican Republic format: XXX-XXXXXX-X
    return value
      .replace(/\W/g, "")
      .replace(/(\d{3})(\d{6})(\d{1})/, "$1-$2-$3")
      .trim();
  },
  CNPJ: (value: string) => {
    // Brasil format: XX.XXX.XXX/0001-XX
    return value
      .replace(/\W/g, "")
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5")
      .trim();
  },
};

export const documentValidators = {
  DNI: (value: string) => {
    // Argentina: 7-8 digits
    // Peru: 8 digits
    // Ecuador: 10 digits
    const cleanValue = value.replace(/\W/g, "");
    const regexArgentina = /^\d{7,8}$/;
    const regexPeru = /^\d{8}$/;
    const regexEcuador = /^\d{10}$/;
    return (
      regexArgentina.test(cleanValue) ||
      regexPeru.test(cleanValue) ||
      regexEcuador.test(cleanValue)
    );
  },
  RUT: (value: string) => {
    // Chile: 8-9 digits + K/k verification digit
    const cleanValue = value.replace(/\W/g, "").toUpperCase();

    // Basic format validation
    if (!/^[0-9]{7,8}-?[K0-9]$/.test(cleanValue)) {
      return false;
    }

    // Extract the main number and verification digit
    const rutDigits = cleanValue.slice(0, -1);
    const verifier = cleanValue.slice(-1);

    // Calculate the verification digit
    let sum = 0;
    let multiplier = 2;

    // Iterate from right to left
    for (let i = rutDigits.length - 1; i >= 0; i--) {
      sum += parseInt(rutDigits[i]) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }

    // Calculate the expected verification digit
    const remainder = sum % 11;
    const expectedVerifier =
      remainder === 0 ? "0" : remainder === 1 ? "K" : String(11 - remainder);

    // Compare with the actual verification digit
    return verifier === expectedVerifier;
  },
  CURP: (value: string) => {
    // Mexico: 18 characters
    // Format: AAAA######AAAAAA##
    // First 4: Letters from name and surnames
    // Next 6: Date of birth (YYMMDD)
    // Next 1: Gender (H/M)
    // Next 5: State code and consonants from name
    // Last 2: Generation identifier and check digit
    const cleanValue = value.replace(/\W/g, "");
    const regex =
      /^[A-Z]{4}\d{6}[HM][A-Z]{2}[BCDFGHJKLMNPQRSTVWXYZ]{3}[0-9A-Z]\d$/;
    return regex.test(cleanValue);
  },
  CPF: (value: string) => {
    // Brasil: 11 digits
    // Format: XXX.XXX.XXX-XX
    // Includes validation digits in last 2 positions
    const cleanValue = value.replace(/\W/g, "");

    // Basic format validation
    if (!/^\d{11}$/.test(cleanValue) || /^(\d)\1{10}$/.test(cleanValue)) {
      return false;
    }

    // Calculate first verification digit
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanValue.charAt(i)) * (10 - i);
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;

    // Calculate second verification digit
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanValue.charAt(i)) * (11 - i);
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;

    // Check if calculated verification digits match the provided ones
    return (
      parseInt(cleanValue.charAt(9)) === firstDigit &&
      parseInt(cleanValue.charAt(10)) === secondDigit
    );
  },
  CC: (value: string) => {
    // Colombia: 8-10 digits
    // Modern format is 10 digits
    // Legacy format allowed 8-9 digits
    const cleanValue = value.replace(/\W/g, "");
    const regex = /^\d{8,10}$/;
    return regex.test(cleanValue);
  },
  CI: (value: string) => {
    // Bolivia: 5-8 digits
    // Paraguay: 6-9 digits
    const cleanValue = value.replace(/\W/g, "");
    const regexBolivia = /^\d{5,8}$/;
    const regexParaguay = /^\d{6,9}$/;
    return regexBolivia.test(cleanValue) || regexParaguay.test(cleanValue);
  },
  DPI: (value: string) => {
    // Guatemala: 13 digits
    // Format: XXXX XXXXX XXXX
    // First 4: Municipality code
    // Next 5: Unique number
    // Last 4: Family code
    const cleanValue = value.replace(/\W/g, "");
    const regex = /^\d{13}$/;
    return regex.test(cleanValue);
  },
  DUI: (value: string) => {
    // El Salvador: 9 digits
    // Format: XXXXXXXX-X
    // Last digit is a check digit
    const cleanValue = value.replace(/\W/g, "");

    // Basic format validation
    if (!/^\d{9}$/.test(cleanValue)) {
      return false;
    }

    // Calculate verification digit
    const digits = cleanValue.substring(0, 8);
    const verifier = parseInt(cleanValue.charAt(8));

    let sum = 0;
    for (let i = 0; i < 8; i++) {
      sum += parseInt(digits.charAt(i)) * (9 - i);
    }

    const expectedVerifier = 10 - (sum % 10);
    return verifier === (expectedVerifier === 10 ? 0 : expectedVerifier);
  },
  CIP: (value: string) => {
    // Panama: 8 digits
    // Format: X-XXX-XXXX
    // First digit: Province code
    // Next 3: Book number
    // Last 4: Entry number
    const cleanValue = value.replace(/\W/g, "");
    const regex = /^\d{8}$/;
    return regex.test(cleanValue);
  },
  CEDULA: (value: string) => {
    // Venezuela: 7-8 digits
    // Nicaragua: 14 digits
    // Costa Rica: 9 digits
    // Honduras: 13 digits
    // Dominican Republic: 11 digits
    const cleanValue = value.replace(/\W/g, "");
    const regexVenezuela = /^\d{7,8}$/;
    const regexNicaragua = /^\d{14}$/;
    const regexCostaRica = /^\d{9}$/;
    const regexHonduras = /^\d{13}$/;
    const regexDominicanRepublic = /^\d{11}$/;
    return (
      regexVenezuela.test(cleanValue) ||
      regexNicaragua.test(cleanValue) ||
      regexCostaRica.test(cleanValue) ||
      regexHonduras.test(cleanValue) ||
      regexDominicanRepublic.test(cleanValue)
    );
  },
  CNPJ: (value: string) => {
    // Brasil format: XX.XXX.XXX/0001-XX
    const cleanValue = value.replace(/\W/g, "");

    // Check if all digits are the same (invalid CNPJ)
    if (/^(\d)\1{13}$/.test(cleanValue)) return false;

    // Basic format validation
    if (!/^\d{14}$/.test(cleanValue)) return false;

    // Calculate first verification digit
    let tamanho = cleanValue.length - 2;
    let numeros = cleanValue.substring(0, tamanho);
    let digitos = cleanValue.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;

    // Calculate second verification digit
    tamanho = tamanho + 1;
    numeros = cleanValue.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
  },
};
