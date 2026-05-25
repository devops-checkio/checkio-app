"use client";

import { Eraser, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (v: string) => void;
  onEnter?: () => void;
  placeholderChar?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  clearLabel?: string;
}

function OTPInput({
  length = 4,
  value,
  onChange,
  onEnter,
  placeholderChar = "•",
  disabled = false,
  autoFocus = false,
  clearLabel = "Limpiar",
}: OTPInputProps) {
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const valArr = (value || "").padEnd(length, "").slice(0, length).split("");

  const focusInput = React.useCallback(
    (idx: number) => {
      refs.current[idx]?.focus();
      refs.current[idx]?.select();
    },
    []
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex justify-center gap-2 overflow-x-auto pb-1 min-w-0">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={valArr[i] || ""}
          autoComplete="off"
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          className={`
            w-11 h-11 shrink-0 rounded-xl border-2 text-center text-2xl font-mono
            outline-none transition
            ${valArr[i] ? "border-blue-600 bg-blue-50" : "border-gray-300 bg-gray-50"}
            focus:border-blue-400
            disabled:opacity-40
            selection:bg-blue-200
          `}
          placeholder={placeholderChar}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "").slice(0, 1);
            const arr = valArr.slice();
            arr[i] = val;
            onChange(arr.join("").slice(0, length));
            if (val && i < length - 1) {
              setTimeout(() => focusInput(i + 1), 0);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              if (!valArr[i] && i > 0) {
                const arr = valArr.slice();
                arr[i - 1] = "";
                onChange(arr.join("").slice(0, length));
                setTimeout(() => focusInput(i - 1), 0);
                e.preventDefault();
              } else if (valArr[i]) {
                const arr = valArr.slice();
                arr[i] = "";
                onChange(arr.join("").slice(0, length));
                e.preventDefault();
              }
            } else if (e.key === "ArrowLeft" && i > 0) {
              setTimeout(() => focusInput(i - 1), 0);
              e.preventDefault();
            } else if (e.key === "ArrowRight" && i < length - 1) {
              setTimeout(() => focusInput(i + 1), 0);
              e.preventDefault();
            } else if (e.key === "Enter" && onEnter) {
              onEnter();
            }
          }}
        />
      ))}
      </div>
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          disabled={disabled}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition disabled:opacity-40"
        >
          <Eraser className="h-3.5 w-3.5" />
          {clearLabel}
        </button>
      )}
    </div>
  );
}

interface ModalClosingPinConfigProps {
  open: boolean;
  onClose: () => void;
  onSave: (currentPin: string | undefined, newPin: string) => void;
  isLoading: boolean;
  pinConfigured: boolean;
}

export default function ModalClosingPinConfig({
  open,
  onClose,
  onSave,
  isLoading,
  pinConfigured,
}: ModalClosingPinConfigProps) {
  const t = useTranslations("mantainers.assistanceMonthClosing");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [repeatPin, setRepeatPin] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    if (newPin.length < 4 || newPin.length > 8) {
      setError(t("closingPinConfig.pinLengthError"));
      return;
    }
    if (newPin !== repeatPin) {
      setError(t("closingPinConfig.repeatMismatch"));
      return;
    }
    if (pinConfigured && !currentPin.trim()) {
      setError(t("closingPinConfig.currentRequired"));
      return;
    }
    onSave(pinConfigured ? currentPin : undefined, newPin);
    setCurrentPin("");
    setNewPin("");
    setRepeatPin("");
  };

  const handleClose = () => {
    setCurrentPin("");
    setNewPin("");
    setRepeatPin("");
    setError(null);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      aria-modal="true"
      role="dialog"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative bg-white rounded-2xl shadow-xl w-fit max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto border border-gray-200 p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4 gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900">
              {pinConfigured
                ? t("closingPinConfig.titleChange")
                : t("closingPinConfig.titleSet")}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {pinConfigured
                ? t("closingPinConfig.otpChangeExplanation")
                : t("closingPinConfig.otpSetExplanation")}
            </p>
          </div>
          <button
            aria-label={t("buttons.cancel")}
            onClick={handleClose}
            className="rounded-full hover:bg-gray-100 text-gray-400 p-1 ml-2 shrink-0"
            type="button"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSave();
          }}
          className="space-y-6 flex flex-col items-center"
        >
        {/* OTP Style Inputs for Current PIN */}
        {pinConfigured && (
          <div className="w-full flex flex-col items-center">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
              {t("closingPinConfig.currentPinLabel")}
              <span className="ml-1 text-xs text-gray-400 font-normal">
                ({t("closingPinConfig.otpCurrentRequired")})
              </span>
            </label>
            <OTPInput
              length={8}
              value={currentPin}
              onChange={setCurrentPin}
              placeholderChar="•"
              autoFocus
              disabled={isLoading}
              clearLabel={t("closingPinConfig.clear")}
            />
          </div>
        )}

        {/* OTP Style Inputs for New PIN */}
        <div className="w-full flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            {t("closingPinConfig.newPinLabel")}
            <span className="ml-1 text-xs text-gray-400 font-normal">
              ({t("closingPinConfig.otpDigitsNote")})
            </span>
          </label>
          <OTPInput
            length={8}
            value={newPin}
            onChange={setNewPin}
            placeholderChar="•"
            autoFocus={!pinConfigured}
            disabled={isLoading}
            clearLabel={t("closingPinConfig.clear")}
          />
        </div>

        {/* OTP Style Inputs for Repeat PIN */}
        <div className="w-full flex flex-col items-center">
          <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
            {t("closingPinConfig.repeatPinLabel")}
            <span className="ml-1 text-xs text-gray-400 font-normal">
              ({t("closingPinConfig.otpRepeatDescription")})
            </span>
          </label>
          <OTPInput
            length={8}
            value={repeatPin}
            onChange={setRepeatPin}
            placeholderChar="•"
            onEnter={handleSave}
            disabled={isLoading}
            clearLabel={t("closingPinConfig.clear")}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="w-full text-center">
            <p className="text-sm text-red-600 mt-2" role="alert">
              {error}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-3 w-full">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-100 transition disabled:opacity-40"
            disabled={isLoading}
          >
            {t("buttons.cancel")}
          </button>
          <button
            type="submit"
            className="rounded-lg px-4 py-2 bg-blue-600 text-white font-semibold hover:bg-blue-700 transition disabled:opacity-40 flex items-center gap-2"
            disabled={
              isLoading ||
              newPin.length < 4 ||
              newPin !== repeatPin ||
              (pinConfigured && currentPin.length < 4)
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("buttons.processing")}
              </>
            ) : (
              t("closingPinConfig.saveButton")
            )}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
