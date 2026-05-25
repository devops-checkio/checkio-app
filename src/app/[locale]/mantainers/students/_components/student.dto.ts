import { DocumentType, Gender } from "@/dto/employees/employee.enums";

export { DocumentType, Gender };

export const DocumentTypeOptions: { value: DocumentType; label: string }[] = [
  { value: DocumentType.DNI, label: "DNI" },
  { value: DocumentType.RUT, label: "RUT" },
  { value: DocumentType.CPF, label: "CPF" },
  { value: DocumentType.CC, label: "CC" },
  { value: DocumentType.CI, label: "CI" },
  { value: DocumentType.DPI, label: "DPI" },
  { value: DocumentType.DUI, label: "DUI" },
  { value: DocumentType.CIP, label: "CIP" },
  { value: DocumentType.CEDULA, label: "Cédula" },
  { value: DocumentType.CURP, label: "CURP" },
];

export const GenderOptions: { value: Gender; label: string }[] = [
  { value: Gender.MALE, label: "Masculino" },
  { value: Gender.FEMALE, label: "Femenino" },
  { value: Gender.OTHER, label: "Otro" },
];
