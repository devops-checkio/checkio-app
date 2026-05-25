"use client";

import { Button } from "@/components/ui/button";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { SetPasswordDto, UpdateProfileDto } from "@/dto/profile-update";
import { useToast } from "@/hooks/use-toast";
import { useSetPassword, useUpdateProfile } from "@/service/auths.service";
import { Modal, Radio, Switch } from "antd";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";

// Password generation utility
const generateSecurePassword = (): string => {
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

  let password = "";

  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += symbols[Math.floor(Math.random() * symbols.length)];

  // Fill the rest with random characters from all categories
  const allChars = lowercase + uppercase + numbers + symbols;
  for (let i = 4; i < 12; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
};

// Password validation rules
const passwordValidation = {
  minLength: {
    value: 8,
    message: "La contraseña debe tener al menos 8 caracteres",
  },
  pattern: {
    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message:
      "La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial",
  },
};

interface ProfileUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ProfileUpdateModal({
  isOpen,
  onClose,
  onSuccess,
}: ProfileUpdateModalProps) {
  const { toast } = useToast();
  const { profile, refreshAuth } = useCookieSession();
  const { mutate: updateProfile, isPending: isUpdatingProfile } =
    useUpdateProfile();
  const { mutate: setPassword, isPending: isSettingPassword } =
    useSetPassword();

  // State for password management
  const [passwordMode, setPasswordMode] = useState<"manual" | "auto">("manual");
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  const [updateEmail, setUpdateEmail] = useState<boolean>(false);
  const [updatePassword, setUpdatePassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateProfileDto>();

  // Watch password field for real-time validation
  const watchedPassword = watch("password") || "";

  // Password validation functions
  const passwordValidations = {
    minLength: watchedPassword.length >= 8,
    hasLowercase: /[a-z]/.test(watchedPassword),
    hasUppercase: /[A-Z]/.test(watchedPassword),
    hasNumber: /\d/.test(watchedPassword),
    hasSpecialChar: /[@$!%*?&]/.test(watchedPassword),
  };

  useEffect(() => {
    if (isOpen) {
      reset();
      setPasswordMode("manual");
      setGeneratedPassword("");
      setUpdateEmail(false);
      setUpdatePassword(false);
      setErrorMessage(null);
    }
  }, [isOpen, reset]);

  // Handle password generation
  const handleGeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setGeneratedPassword(newPassword);
    setValue("password", newPassword);
    setPasswordMode("auto");
  };

  // Handle password mode change
  const handlePasswordModeChange = (e: any) => {
    const mode = e.target.value;
    setPasswordMode(mode);

    if (mode === "auto" && !generatedPassword) {
      handleGeneratePassword();
    } else if (mode === "manual") {
      setValue("password", "");
      setGeneratedPassword("");
    }
  };

  const onSubmit: SubmitHandler<UpdateProfileDto> = (data) => {
    // Check if there's anything to update
    if (!updateEmail && !updatePassword) {
      toast({
        title: "No hay cambios para actualizar",
        variant: "destructive",
      });
      return;
    }

    // Handle email update
    if (updateEmail && data.email) {
      const emailData: UpdateProfileDto = {
        email: data.email,
      };

      updateProfile(emailData, {
        onSuccess: () => {
          toast({
            title: "Email actualizado exitosamente",
            variant: "default",
          });
          refreshAuth();
          onClose();
          onSuccess();
        },
        onError: (error: any) => {
          const errorMsg =
            error?.response?.data?.message ||
            error?.message ||
            "Error al actualizar el email. Por favor, intente nuevamente.";
          setErrorMessage(errorMsg);
        },
      });
    }

    // Handle password update
    if (updatePassword) {
      const newPassword =
        passwordMode === "auto" ? generatedPassword : data.password;

      if (!newPassword) {
        toast({
          title: "Error",
          description: "Por favor ingrese una nueva contraseña",
          variant: "destructive",
        });
        return;
      }

      const passwordData: SetPasswordDto = {
        email: (profile?.user?.email || "").trim(),
        password: data.currentPassword || "",
        newPassword: newPassword,
        confirmPassword: newPassword,
      };

      setPassword(passwordData, {
        onSuccess: () => {
          toast({
            title: "Contraseña actualizada exitosamente",
            variant: "default",
          });

          if (passwordMode === "auto" && generatedPassword) {
            toast({
              title: "Contraseña generada",
              description: `Nueva contraseña: ${generatedPassword}`,
              variant: "default",
            });
          }

          refreshAuth();
          onClose();
          onSuccess();
        },
        onError: (error: any) => {
          const errorMsg =
            error?.response?.data?.message ||
            error?.message ||
            "Error al actualizar la contraseña. Por favor, intente nuevamente.";
          setErrorMessage(errorMsg);
        },
      });
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 text-lg font-semibold text-gray-800">
          <div className="p-2 bg-blue-100 rounded-lg">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          Actualizar Mi Perfil
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
      className="profile-update-modal"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 py-4">
        {/* Current Profile Info */}
        <div className="mt-6 p-6 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Información Actual
            </h3>

            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-4 border-gray-200 overflow-hidden bg-white shadow-lg">
                <div className="w-full h-full flex items-center justify-center bg-blue-100">
                  <span className="text-2xl font-bold text-blue-600">
                    {profile?.user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* User Info */}
            <div className="text-center space-y-2">
              <h4 className="text-lg font-semibold text-gray-800">
                {profile?.user?.name}
              </h4>
              <p className="text-sm text-gray-600">
                {profile?.user?.email || "No disponible"}
              </p>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Update Options */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ¿Qué deseas actualizar?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Actualizar Email
                      </span>
                      <p className="text-xs text-gray-500">
                        Cambiar dirección de correo
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={updateEmail}
                    onChange={(checked) => setUpdateEmail(checked)}
                    checkedChildren="Sí"
                    unCheckedChildren="No"
                  />
                </div>
              </div>

              <div className="p-4 bg-white border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Actualizar Contraseña
                      </span>
                      <p className="text-xs text-gray-500">
                        Cambiar contraseña de acceso
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={updatePassword}
                    onChange={(checked) => setUpdatePassword(checked)}
                    checkedChildren="Sí"
                    unCheckedChildren="No"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Email Update */}
        {updateEmail && (
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">
                Actualizar Email
              </h4>
            </div>
            <SystemInput
              control={control}
              label="Nuevo Email"
              attribute="email"
              type="email"
              errors={errors}
              rules={{
                required: updateEmail
                  ? "Por favor ingrese el nuevo email"
                  : false,
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Por favor ingrese un email válido",
                },
              }}
            />
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 bg-amber-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg
                    className="w-3 h-3 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-amber-800 leading-relaxed">
                    <strong className="font-semibold">Declaración de responsabilidad:</strong>{" "}
                    El trabajador declara que el correo electrónico ingresado es de su responsabilidad.
                    Es responsable de mantener acceso a dicho correo y de la información que el sistema envíe a esa dirección, incluso si corresponde a un correo de terceros.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Password Update */}
        {updatePassword && (
          <div className="p-6 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-800">
                Actualizar Contraseña
              </h4>
            </div>

            <div className="space-y-4">
              {/* Current Password */}
              <SystemInput
                control={control}
                label="Contraseña Actual"
                attribute="currentPassword"
                type="password"
                errors={errors}
                rules={{
                  required: updatePassword
                    ? "Por favor ingrese su contraseña actual"
                    : false,
                }}
              />

              {/* Password Mode Selection */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Método de Contraseña
                </label>
                <Radio.Group
                  value={passwordMode}
                  onChange={handlePasswordModeChange}
                  className="w-full"
                >
                  <div className="space-y-3">
                    <Radio value="manual" className="w-full">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Ingresar Manualmente
                          </div>
                          <div className="text-xs text-gray-500">
                            Contraseña personalizada
                          </div>
                        </div>
                      </div>
                    </Radio>
                    <Radio value="auto" className="w-full">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                          <svg
                            className="w-3 h-3 text-green-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Generar Automáticamente
                          </div>
                          <div className="text-xs text-gray-500">
                            Contraseña segura del sistema
                          </div>
                        </div>
                      </div>
                    </Radio>
                  </div>
                </Radio.Group>
              </div>

              {/* Manual Password Input */}
              {passwordMode === "manual" && (
                <div className="space-y-4">
                  <SystemInput
                    control={control}
                    label="Nueva Contraseña"
                    attribute="password"
                    type="password"
                    errors={errors}
                    rules={{
                      required: updatePassword
                        ? "Por favor ingrese una nueva contraseña"
                        : false,
                      ...passwordValidation,
                    }}
                  />
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-5 h-5 bg-green-100 rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-green-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <strong className="text-gray-700 text-sm">
                        Requisitos de seguridad
                      </strong>
                    </div>
                    <div className="space-y-2">
                      <div
                        className={`flex items-center space-x-2 ${
                          passwordValidations.minLength
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.minLength
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {passwordValidations.minLength ? "✓" : "○"}
                        </span>
                        <span className="text-xs">Mínimo 8 caracteres</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasLowercase
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasLowercase
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {passwordValidations.hasLowercase ? "✓" : "○"}
                        </span>
                        <span className="text-xs">Una minúscula</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasUppercase
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasUppercase
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {passwordValidations.hasUppercase ? "✓" : "○"}
                        </span>
                        <span className="text-xs">Una mayúscula</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasNumber
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasNumber
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {passwordValidations.hasNumber ? "✓" : "○"}
                        </span>
                        <span className="text-xs">Un número</span>
                      </div>
                      <div
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasSpecialChar
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasSpecialChar
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          {passwordValidations.hasSpecialChar ? "✓" : "○"}
                        </span>
                        <span className="text-xs">
                          Un carácter especial (@$!%*?&)
                        </span>
                      </div>
                    </div>
                    {Object.values(passwordValidations).every(Boolean) && (
                      <div className="mt-3 bg-green-100 text-green-700 rounded-lg p-3 flex items-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="font-medium text-sm">
                          ¡Contraseña segura!
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auto Generated Password */}
              {passwordMode === "auto" && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                      </div>
                      <label className="text-sm font-medium text-gray-700">
                        Contraseña Generada
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePassword}
                        className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white border-green-500 hover:border-green-600 transition-colors"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        Regenerar
                      </Button>
                    </div>
                    <div className="mt-3 bg-green-100 text-green-700 rounded-lg p-3 flex items-center space-x-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium text-sm">
                        ✓ Contraseña segura generada automáticamente
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-3 h-3 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm text-red-800 font-medium">
                  {errorMessage}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-600 hover:text-red-800 transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isUpdatingProfile || isSettingPassword}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="default"
            disabled={
              isUpdatingProfile ||
              isSettingPassword ||
              (!updateEmail && !updatePassword)
            }
            className="min-w-[120px]"
          >
            {isUpdatingProfile || isSettingPassword ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Actualizando...</span>
              </div>
            ) : (
              "Actualizar Perfil"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
