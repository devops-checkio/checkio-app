"use client";

import {
  CHEKIOButton,
  CHEKIOModal,
  CHEKIOInput,
} from "@/components";
import { useToast } from "@/hooks/use-toast";
import { Copy, Eye, EyeOff, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ApiTokenDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
}

export default function ApiTokenDisplayModal({
  isOpen,
  onClose,
  token,
}: ApiTokenDisplayModalProps) {
  const t = useTranslations("mantainers.integrations.modal.tokenDisplay");
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      toast({
        title: t("copied"),
        description: "Token copiado al portapapeles",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el token",
        variant: "destructive",
      });
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={t("title")}
      size="lg"
    >
      <div className="space-y-6 py-4">
        {/* Warning */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
          <p className="text-sm font-medium text-yellow-800">
            {t("warning")}
          </p>
        </div>

        {/* Token Display */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Token de API
          </label>
          <div className="flex gap-2">
            <CHEKIOInput
              type={isVisible ? "text" : "password"}
              value={token}
              readOnly
              className="flex-1 font-mono text-sm"
            />
            <CHEKIOButton
              type="button"
              variant="secondaryBlue"
              onClick={() => setIsVisible(!isVisible)}
              className="px-3"
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </CHEKIOButton>
            <CHEKIOButton
              type="button"
              variant="primary"
              onClick={handleCopy}
              className="px-3"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </CHEKIOButton>
          </div>
        </div>

        {/* Action Button */}
        <CHEKIOButton
          type="button"
          variant="primary"
          onClick={onClose}
          className="w-full"
        >
          {t("understood")}
        </CHEKIOButton>
      </div>
    </CHEKIOModal>
  );
}
