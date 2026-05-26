"use client";

import { CHEKIOModal } from "@/components";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

interface ModalDailyPassQrProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode?: string;
  expiresAt?: Date;
}

export default function ModalDailyPassQr({
  isOpen,
  onClose,
  qrCode,
  expiresAt,
}: ModalDailyPassQrProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!isOpen || !expiresAt) return;

    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiration = new Date(expiresAt).getTime();
      return Math.max(0, Math.floor((expiration - now) / 1000));
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        onClose();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, expiresAt, onClose]);

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title="Pase Diario - QR"
      size="2xl"
    >
      <div
        className="flex flex-col items-center justify-center p-6"
        data-tour="daily-pass-modal-qr"
      >
        <div className="mb-4 text-center">
          <p className="text-sm text-gray-500">Tiempo restante:</p>
          <p className="text-2xl font-bold text-blue-600">
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}:
            {String(seconds).padStart(2, "0")}
          </p>
        </div>

        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          {qrCode &&
            (qrCode.startsWith("data:image") || qrCode.startsWith("http") ? (
              <img
                src={qrCode}
                alt="QR Code"
                className="h-64 w-64"
              />
            ) : (
              <QRCodeSVG value={qrCode} size={256} level="M" title="QR Code" />
            ))}
        </div>

        <div className="w-full p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
          <p className="text-sm text-blue-700">
            <strong className="font-semibold">Importante:</strong> Este QR es de
            un solo uso y expirará al cumplirse el tiempo o al ser utilizado.
          </p>
        </div>
      </div>
    </CHEKIOModal>
  );
}
