"use client";

import { CHEKIOButton, CHEKIOInput } from "@/components";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

interface ForgotPasswordFormData {
  email: string;
}

const PASSWORD_REQUIREMENT_IDS = [
  "length",
  "uppercase",
  "lowercase",
  "number",
  "special",
] as const;

const PASSWORD_REGEX: Record<
  (typeof PASSWORD_REQUIREMENT_IDS)[number],
  RegExp
> = {
  length: /.{8,}/,
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

interface ForgotPasswordProps {
  onBackToLogin: () => void;
  className?: string;
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
};

export function ForgotPassword({
  onBackToLogin,
  className,
}: ForgotPasswordProps) {
  const t = useTranslations("forgotPassword");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<
    Record<string, boolean>
  >({});

  const passwordRequirements = useMemo(
    () =>
      PASSWORD_REQUIREMENT_IDS.map((id) => ({
        id,
        label: t(`requirements.${id}`),
        regex: PASSWORD_REGEX[id],
      })),
    [t]
  );

  const forgotPasswordForm = useForm<ForgotPasswordFormData>();
  const resetPasswordForm = useForm<{
    temporaryPassword: string;
    newPassword: string;
    confirmPassword: string;
  }>();

  const onRequestReset = (data: ForgotPasswordFormData) => {
    setIsSubmitting(true);
    setEmail(data.email);

    setTimeout(() => {
      setIsSubmitting(false);
      setStep("reset");
    }, 2000);
  };

  const onResetPassword = (data: {
    temporaryPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    if (data.newPassword !== data.confirmPassword) {
      return;
    }

    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      onBackToLogin();
    }, 2000);
  };

  const checkPasswordStrength = (password: string) => {
    const strength: Record<string, boolean> = {};
    PASSWORD_REQUIREMENT_IDS.forEach((id) => {
      strength[id] = PASSWORD_REGEX[id].test(password);
    });
    setPasswordStrength(strength);
  };

  return (
    <div className={cn("w-full", className)}>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
          },
        }}
        className="space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {step === "request" ? t("title.request") : t("title.reset")}
          </h2>
          <p className="text-sm font-medium text-gray-600">
            {step === "request" ? t("subtitle.request") : t("subtitle.reset")}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "request" ? (
            <motion.form
              key="request"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={forgotPasswordForm.handleSubmit(onRequestReset)}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  {t("fields.email")}
                </label>
                <CHEKIOInput
                  id="email"
                  type="email"
                  placeholder={t("fields.emailPlaceholder")}
                  className="w-full bg-gray-50 border-gray-200 transition-all duration-300 focus:bg-white focus:border-[#3680f2] focus:ring-4 focus:ring-[#3680f2]/10"
                  {...forgotPasswordForm.register("email", {
                    required: t("validation.emailRequired"),
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: t("validation.emailInvalid"),
                    },
                  })}
                />
                <AnimatePresence>
                  {forgotPasswordForm.formState.errors.email && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-sm font-medium text-red-600"
                    >
                      {forgotPasswordForm.formState.errors.email.message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                }}
              >
                <CHEKIOButton
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#3680f2] to-[#37e7f4] text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("buttons.sendInstructions")}
                    </>
                  ) : (
                    t("buttons.sendInstructions")
                  )}
                </CHEKIOButton>
              </motion.div>

              <div className="flex justify-center pt-2">
                <motion.button
                  type="button"
                  onClick={onBackToLogin}
                  whileHover={{ x: -2 }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#3680f2] transition-all duration-300 hover:text-[#2d6fd4] hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("buttons.backToLogin")}
                </motion.button>
              </div>
            </motion.form>
          ) : (
            <motion.form
              key="reset"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
              onSubmit={resetPasswordForm.handleSubmit(onResetPassword)}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="temporaryPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("fields.temporaryPassword")}
                  </label>
                  <CHEKIOInput
                    id="temporaryPassword"
                    type="password"
                    className="w-full bg-gray-50 border-gray-200 transition-all duration-300 focus:bg-white focus:border-[#3680f2] focus:ring-4 focus:ring-[#3680f2]/10"
                    {...resetPasswordForm.register("temporaryPassword", {
                      required: t("validation.temporaryPasswordRequired"),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="newPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("fields.newPassword")}
                  </label>
                  <CHEKIOInput
                    id="newPassword"
                    type="password"
                    className="w-full bg-gray-50 border-gray-200 transition-all duration-300 focus:bg-white focus:border-[#3680f2] focus:ring-4 focus:ring-[#3680f2]/10"
                    {...resetPasswordForm.register("newPassword", {
                      required: t("validation.newPasswordRequired"),
                      onChange: (e) => checkPasswordStrength(e.target.value),
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="confirmPassword"
                    className="text-sm font-medium text-gray-700"
                  >
                    {t("fields.confirmPassword")}
                  </label>
                  <CHEKIOInput
                    id="confirmPassword"
                    type="password"
                    className="w-full bg-gray-50 border-gray-200 transition-all duration-300 focus:bg-white focus:border-[#3680f2] focus:ring-4 focus:ring-[#3680f2]/10"
                    {...resetPasswordForm.register("confirmPassword", {
                      required: t("validation.confirmPasswordRequired"),
                    })}
                  />
                </div>
              </div>

              {/* Password requirements */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <h3 className="mb-3 text-sm font-semibold text-gray-700">
                  {t("requirements.title")}
                </h3>
                <ul className="space-y-2.5">
                  {passwordRequirements.map((req, index) => (
                    <motion.li
                      key={req.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-center gap-2.5 text-sm"
                    >
                      <motion.div
                        animate={
                          passwordStrength[req.id]
                            ? { scale: [1, 1.2, 1], rotate: [0, 10, 0] }
                            : {}
                        }
                        transition={{ duration: 0.3 }}
                      >
                        {passwordStrength[req.id] ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                      </motion.div>
                      <span
                        className={`font-medium transition-colors duration-300 ${
                          passwordStrength[req.id]
                            ? "text-green-600"
                            : "text-gray-600"
                        }`}
                      >
                        {req.label}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 17,
                }}
              >
                <CHEKIOButton
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-[#3680f2] to-[#37e7f4] text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {t("buttons.changePassword")}
                    </>
                  ) : (
                    t("buttons.changePassword")
                  )}
                </CHEKIOButton>
              </motion.div>

              <div className="flex justify-center pt-2">
                <motion.button
                  type="button"
                  onClick={onBackToLogin}
                  whileHover={{ x: -2 }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#3680f2] transition-all duration-300 hover:text-[#2d6fd4] hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  {t("buttons.backToLogin")}
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
