"use client";

import { DailyPassResponseDto } from "@/app/[locale]/operations/daily-passes/_components/daily-pass.dto";
import type { EmployeeResponseDto } from "@/dto/employees";
import axiosInstance from "@/utils/axios";
import { jsPDF } from "jspdf";
import { DateTime } from "luxon";
import QRCode from "qrcode";

export interface DailyPassPdfItem {
  employeeName?: string;
  employeeDocument?: string;
  employeeEmail?: string;
  employeeJob?: string;
  employeeBranch?: string;
  employeePhotoUrl?: string;
  companyLogoUrl?: string;
  passStartDate?: string | Date;
  passEndDate?: string | Date;
  qrCode: string;
}

interface DailyPassPdfTexts {
  title: string;
  employeeName: string;
  employeeDocument: string;
  employeeEmail: string;
  employeeJob: string;
  employeeBranch: string;
  passStartDate: string;
  passEndDate: string;
  generatedAt: string;
  qrLabel: string;
}

const formatDate = (value?: string | Date) => {
  if (!value) return "-";
  const date =
    typeof value === "string" ? DateTime.fromISO(value) : DateTime.fromJSDate(value);
  if (!date.isValid) return "-";
  return date.toFormat("dd/MM/yyyy");
};

const isUsableImageUrl = (url?: string | null): boolean =>
  Boolean(
    url &&
      (url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:")),
  );

const resolveAssetUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (isUsableImageUrl(url)) return url;
  if (typeof window === "undefined") return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${window.location.origin}${path}`;
};

export const resolveCompanyLogoUrl = async (): Promise<string> => {
  try {
    const { data } = await axiosInstance.get<{ logo: string }>(
      "/client/auth/logo",
    );
    if (data.logo?.startsWith("http://") || data.logo?.startsWith("https://")) {
      return data.logo;
    }
  } catch {
    // fallback al logo por defecto
  }
  return resolveAssetUrl("/logos/logo.svg") || "/logos/logo.svg";
};

const blobToDataUrl = (blob: Blob): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () =>
      resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });

const loadImageAsDataUrl = (url: string): Promise<string | null> =>
  new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

const toDataUrl = async (url?: string): Promise<string | null> => {
  const resolved = resolveAssetUrl(url);
  if (!resolved) return null;
  if (resolved.startsWith("data:")) return resolved;

  try {
    const response = await fetch(resolved, { mode: "cors" });
    if (response.ok) {
      const fromFetch = await blobToDataUrl(await response.blob());
      if (fromFetch) return fromFetch;
    }
  } catch {
    // intentar vía canvas (URLs firmadas S3)
  }

  return loadImageAsDataUrl(resolved);
};

export const mergeDailyPassData = (
  base?: Partial<DailyPassResponseDto>,
  fetched?: DailyPassResponseDto | null,
): Partial<DailyPassResponseDto> | undefined => {
  if (!base && !fetched) return undefined;
  const baseEmployee = base?.employee;
  const fetchedEmployee = fetched?.employee;

  return {
    ...base,
    ...fetched,
    employeeName: fetched?.employeeName || base?.employeeName,
    employeeEmail: fetched?.employeeEmail || base?.employeeEmail,
    startDate: fetched?.startDate ?? base?.startDate,
    endDate: fetched?.endDate ?? base?.endDate,
    qrCode: fetched?.qrCode || base?.qrCode,
    employeeId: fetched?.employeeId || base?.employeeId,
    employee:
      baseEmployee || fetchedEmployee
        ? {
            ...baseEmployee,
            ...fetchedEmployee,
            documentNumber:
              fetchedEmployee?.documentNumber ||
              baseEmployee?.documentNumber ||
              "",
            jobName: fetchedEmployee?.jobName || baseEmployee?.jobName,
            branchName: fetchedEmployee?.branchName || baseEmployee?.branchName,
            photo: fetchedEmployee?.photo || baseEmployee?.photo,
            firstName: fetchedEmployee?.firstName || baseEmployee?.firstName || "",
            lastName: fetchedEmployee?.lastName || baseEmployee?.lastName || "",
            publicId:
              fetchedEmployee?.publicId || baseEmployee?.publicId || "",
            personalEmail:
              fetchedEmployee?.personalEmail || baseEmployee?.personalEmail || "",
            startDate: fetchedEmployee?.startDate || baseEmployee?.startDate || "",
            endDate: fetchedEmployee?.endDate || baseEmployee?.endDate || "",
            contractedHours:
              fetchedEmployee?.contractedHours ||
              baseEmployee?.contractedHours ||
              0,
          }
        : undefined,
  };
};

export const buildDailyPassPdfItem = async (
  pass: Partial<DailyPassResponseDto>,
  qrCode: string,
  companyLogoUrl?: string,
): Promise<DailyPassPdfItem> => {
  const employee = pass.employee;
  let photoUrl = isUsableImageUrl(employee?.photo)
    ? (employee!.photo as string)
    : undefined;

  const employeeId = pass.employeeId || employee?.publicId;
  if (!photoUrl && employeeId) {
    try {
      const { data } = await axiosInstance.get<EmployeeResponseDto>(
        `/client/employees/${employeeId}`,
      );
      if (isUsableImageUrl(data.photo)) photoUrl = data.photo as string;
    } catch {
      // se muestran iniciales si no hay foto
    }
  }

  const logoUrl = companyLogoUrl ?? (await resolveCompanyLogoUrl());

  const fullName =
    pass.employeeName ||
    [employee?.firstName, employee?.lastName].filter(Boolean).join(" ").trim() ||
    "-";

  return {
    employeeName: fullName,
    employeeDocument: employee?.documentNumber || "-",
    employeeEmail: pass.employeeEmail || employee?.personalEmail || "-",
    employeeJob: employee?.jobName || "-",
    employeeBranch: employee?.branchName || "-",
    employeePhotoUrl: photoUrl,
    companyLogoUrl: logoUrl,
    passStartDate: pass.startDate,
    passEndDate: pass.endDate,
    qrCode,
  };
};

const drawTicket = async (
  doc: jsPDF,
  item: DailyPassPdfItem,
  texts: DailyPassPdfTexts,
) => {
  const qrDataUrl = await QRCode.toDataURL(item.qrCode, {
    width: 512,
    margin: 1,
  });
  const logoDataUrl = await toDataUrl(item.companyLogoUrl);
  const employeePhotoDataUrl = await toDataUrl(item.employeePhotoUrl);
  const resolveImageType = (dataUrl: string) =>
    dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")
      ? "JPEG"
      : "PNG";

  const generatedAt = DateTime.now().toFormat("dd/MM/yyyy HH:mm");
  const margin = 6;
  const pageWidth = 180;
  const pageHeight = 100;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;
  const headerHeight = 22;
  const dividerX = 118;
  const rightColCenterX = 154;

  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, margin, contentWidth, contentHeight, 4, 4, "FD");

  doc.setFillColor(219, 234, 254);
  doc.roundedRect(margin + 2, margin + 2, contentWidth - 4, headerHeight, 3, 3, "F");

  if (logoDataUrl) {
    doc.addImage(
      logoDataUrl,
      resolveImageType(logoDataUrl),
      pageWidth / 2 - 18,
      margin + 4,
      36,
      12,
    );
  }

  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text(texts.title, pageWidth / 2, margin + 19, { align: "center" });

  doc.setTextColor(15, 23, 42);
  doc.setDrawColor(203, 213, 225);
  doc.line(dividerX, margin + headerHeight + 2, dividerX, margin + contentHeight - 6);

  let currentY = margin + headerHeight + 8;
  const labelX = margin + 6;
  const valueX = margin + 44;
  const maxValueWidth = 64;

  const drawField = (label: string, value: string) => {
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${label}:`, labelX, currentY);
    doc.setTextColor(15, 23, 42);
    const lines = doc.splitTextToSize(value || "-", maxValueWidth);
    doc.text(lines, valueX, currentY);
    currentY += Math.max(6, lines.length * 4.2);
  };

  drawField(texts.employeeName, item.employeeName || "-");
  drawField(texts.employeeDocument, item.employeeDocument || "-");
  drawField(texts.employeeEmail, item.employeeEmail || "-");
  drawField(texts.employeeJob, item.employeeJob || "-");
  drawField(texts.employeeBranch, item.employeeBranch || "-");
  drawField(texts.passStartDate, formatDate(item.passStartDate));
  drawField(texts.passEndDate, formatDate(item.passEndDate));
  drawField(texts.generatedAt, generatedAt);

  const cardBottom = margin + contentHeight - 3;
  const rightColTop = margin + headerHeight + 4;
  const qrLabelGap = 1.5;
  const qrLabelHeight = 3.5;
  const columnGap = 2;
  const photoBoxSize = 26;
  const qrBoxSize = 26;

  const qrLabelY = cardBottom;
  const qrBottom = qrLabelY - qrLabelHeight - qrLabelGap;
  const qrY = qrBottom - qrBoxSize;
  const photoBottom = qrY - columnGap;
  const photoY = Math.max(rightColTop, photoBottom - photoBoxSize);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(
    rightColCenterX - photoBoxSize / 2,
    photoY,
    photoBoxSize,
    photoBoxSize,
    3,
    3,
    "F",
  );

  if (employeePhotoDataUrl) {
    doc.addImage(
      employeePhotoDataUrl,
      resolveImageType(employeePhotoDataUrl),
      rightColCenterX - photoBoxSize / 2 + 2,
      photoY + 2,
      photoBoxSize - 4,
      photoBoxSize - 4,
    );
  } else {
    const initials = (item.employeeName || "?")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(initials || "?", rightColCenterX, photoY + photoBoxSize / 2 + 2, {
      align: "center",
    });
  }

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(
    rightColCenterX - qrBoxSize / 2,
    qrY,
    qrBoxSize,
    qrBoxSize,
    3,
    3,
    "F",
  );
  doc.addImage(
    qrDataUrl,
    "PNG",
    rightColCenterX - qrBoxSize / 2 + 2,
    qrY + 2,
    qrBoxSize - 4,
    qrBoxSize - 4,
  );
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(texts.qrLabel, rightColCenterX, qrLabelY, { align: "center" });
};

export const downloadDailyPassesPdf = async (
  items: DailyPassPdfItem[],
  texts: DailyPassPdfTexts,
  fileName: string,
) => {
  if (!items.length) return;

  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: [100, 180],
  });

  for (let i = 0; i < items.length; i++) {
    if (i > 0) doc.addPage([100, 180], "landscape");
    await drawTicket(doc, items[i], texts);
  }

  doc.save(fileName);
};
