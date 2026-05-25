"use client";

import {
  CHEKIOButton,
  CHEKIOInput,
  CHEKIOModal,
  CHEKIOSelect,
  CHEKIOSelectContent,
  CHEKIOSelectItem,
  CHEKIOSelectTrigger,
  CHEKIOSelectValue,
} from "@/components";
import { useCookieSession } from "@/context/useCookieSession";
import { RoleType } from "@/dto/auth";
import { useToast } from "@/hooks/use-toast";
import {
  useCreateUser,
  useGetProfile,
  useGetRoles,
  useUpdateUser,
} from "@/service/auths.service";
import { useGetCompaniesSelector } from "@/service/mantainer.service";
import { handleError } from "@/utils/error";
import { Divider, Radio, Switch } from "antd";
import { Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, SubmitHandler, useForm } from "react-hook-form";
import { CreateUserDto, UpdateUserDto, UserResponseDto } from "./user.dto";

enum ButtonVariant {
  PRIMARY = "primary",
  SECONDARY = "secondary",
}

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

interface UserModalUpsertProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: UserResponseDto | null;
  onSuccess: () => void;
}

export default function UserModalUpsert({
  isOpen,
  onClose,
  editingUser,
  onSuccess,
}: UserModalUpsertProps) {
  const { toast } = useToast();
  const { companyId } = useCookieSession();
  const { data: roles } = useGetRoles();
  const { data: currentUserProfile } = useGetProfile();
  const { mutate: createUser, isPending: isCreatingUser } = useCreateUser();
  const { mutate: updateUser, isPending: isUpdatingUser } = useUpdateUser();
  const { data: companies } = useGetCompaniesSelector({
    page: 1,
    pageSize: 1000,
  });

  // State for password management
  const [passwordMode, setPasswordMode] = useState<"manual" | "auto">("manual");
  const [generatedPassword, setGeneratedPassword] = useState<string>("");

  const {
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserDto | UpdateUserDto>();

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

  // Check if current user is admin
  const isCurrentUserAdmin = currentUserProfile?.role === RoleType.ADMIN;

  useEffect(() => {
    if (editingUser) {
      reset({
        name: editingUser.name,
        email: editingUser.email,
        username: editingUser.username,
        roleId: editingUser.roleId.toString(),
      });
      setPasswordMode("manual");
      setGeneratedPassword("");
    } else {
      reset();
      setPasswordMode("manual");
      setGeneratedPassword("");
    }
  }, [editingUser, reset]);

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

  // Filter roles based on current user permissions
  const getAvailableRoles = () => {
    if (!roles) return [];

    if (isCurrentUserAdmin) {
      return roles;
    }

    // Non-admin users can only assign non-admin roles
    return roles.filter(
      (role) =>
        !role.name.toLowerCase().includes("admin") &&
        !role.name.toLowerCase().includes("administrador"),
    );
  };

  const onSubmit: SubmitHandler<CreateUserDto | UpdateUserDto> = (data) => {
    console.log("data", data);
    // Prepare data with password based on mode
    const submitData = {
      ...data,
      password: passwordMode === "auto" ? generatedPassword : data.password,
    };

    if (editingUser) {
      // For updates, only include password if it's being changed
      const updateData = { ...submitData };
      // Only include password if:
      // 1. passwordMode is "auto" (always include generated password)
      // 2. passwordMode is "manual" AND password is provided and not empty
      if (passwordMode !== "auto" && (!submitData.password || submitData.password.trim() === "")) {
        delete updateData.password;
      }

      updateUser(
        { userId: editingUser.publicId, data: updateData as UpdateUserDto },
        {
          onSuccess: () => {
            toast({
              title: "Usuario actualizado exitosamente",
              variant: "default",
            });
            if (passwordMode === "auto" && generatedPassword) {
              toast({
                title: "Contraseña generada",
                description: `Nueva contraseña: ${generatedPassword}`,
                variant: "default",
              });
            }
            onClose();
            onSuccess();
          },
          onError: (error) => {
            handleError(error, toast);
          },
        },
      );
    } else {
      // For creation, include companyId
      const createData: CreateUserDto = {
        ...submitData,
        companyId: companyId!,
      } as CreateUserDto;

      createUser(createData, {
        onSuccess: () => {
          toast({
            title: "Usuario creado exitosamente",
            variant: "default",
          });
          if (passwordMode === "auto" && generatedPassword) {
            toast({
              title: "Contraseña generada",
              description: `Contraseña: ${generatedPassword}`,
              variant: "default",
            });
          }
          onClose();
          onSuccess();
        },
        onError: (error) => {
          handleError(error, toast);
        },
      });
    }
  };

  return (
    <CHEKIOModal
      isOpen={isOpen}
      onClose={onClose}
      title={editingUser ? "Editar Usuario" : "Agregar Usuario"}
      size="2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Main Content Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Column - User Information */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Información del Usuario
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <Controller
                    name="name"
                    control={control}
                    rules={{
                      required: "Por favor ingrese el nombre del usuario",
                    }}
                    render={({ field }) => (
                      <>
                        <CHEKIOInput
                          {...field}
                          value={field.value || ""}
                          placeholder="Ingrese el nombre completo"
                          className={errors.name ? "border-red-500" : ""}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.name.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    rules={{
                      required: "Por favor ingrese el email del usuario",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Por favor ingrese un email válido",
                      },
                    }}
                    render={({ field }) => (
                      <>
                        <CHEKIOInput
                          {...field}
                          value={field.value || ""}
                          type="email"
                          placeholder="Ingrese el email"
                          className={errors.email ? "border-red-500" : ""}
                        />
                        {errors.email && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.email.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de Usuario
                  </label>
                  <Controller
                    name="username"
                    control={control}
                    rules={{
                      required: "Por favor ingrese el nombre de usuario",
                    }}
                    render={({ field }) => (
                      <>
                        <CHEKIOInput
                          {...field}
                          value={field.value || ""}
                          placeholder="Ingrese el nombre de usuario"
                          className={errors.username ? "border-red-500" : ""}
                        />
                        {errors.username && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.username.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol
                  </label>
                  <Controller
                    name="roleId"
                    control={control}
                    rules={{
                      required: "Por favor seleccione el rol del usuario",
                    }}
                    render={({ field }) => (
                      <>
                        <CHEKIOSelect
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={
                            !isCurrentUserAdmin &&
                            roles?.some(
                              (role) =>
                                role.name.toLowerCase().includes("admin") &&
                                editingUser?.roleId.toString() ===
                                  role.publicId,
                            )
                          }
                        >
                          <CHEKIOSelectTrigger
                            className={errors.roleId ? "border-red-500" : ""}
                          >
                            <CHEKIOSelectValue placeholder="Seleccione un rol" />
                          </CHEKIOSelectTrigger>
                          <CHEKIOSelectContent>
                            {getAvailableRoles().map((role) => (
                              <CHEKIOSelectItem
                                key={role.publicId}
                                value={role.publicId}
                              >
                                {role.name}
                              </CHEKIOSelectItem>
                            ))}
                          </CHEKIOSelectContent>
                        </CHEKIOSelect>
                        {errors.roleId && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.roleId.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Additional Fields */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Información Adicional
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código de Integración (Opcional)
                  </label>
                  <Controller
                    name="integrationCode"
                    control={control}
                    render={({ field }) => (
                      <CHEKIOInput
                        {...field}
                        value={field.value || ""}
                        placeholder="Ingrese el código de integración"
                      />
                    )}
                  />
                </div>
                {editingUser && (
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">
                      Estado del Usuario:
                    </label>
                    <Switch
                      checked={editingUser.isActive}
                      onChange={(checked) => setValue("isActive", checked)}
                      checkedChildren="Activo"
                      unCheckedChildren="Inactivo"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Password Management */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Gestión de Contraseña
            </h3>
            <div className="space-y-4">
              {/* Password Mode Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Opciones de Contraseña
                </label>
                <Radio.Group
                  value={passwordMode}
                  onChange={handlePasswordModeChange}
                  className="w-full"
                >
                  <div className="space-y-2">
                    <Radio value="manual" className="w-full">
                      <div>
                        <div className="text-sm font-medium">
                          Ingresar Manualmente
                        </div>
                        <div className="text-xs text-gray-500">
                          Contraseña personalizada
                        </div>
                      </div>
                    </Radio>
                    <Radio value="auto" className="w-full">
                      <div>
                        <div className="text-sm font-medium">
                          Generar Automáticamente
                        </div>
                        <div className="text-xs text-gray-500">
                          Contraseña segura del sistema
                        </div>
                      </div>
                    </Radio>
                  </div>
                </Radio.Group>
              </div>

              <Divider className="my-3" />

              {/* Manual Password Input */}
              {passwordMode === "manual" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <Controller
                      name="password"
                      control={control}
                      rules={{
                        required: editingUser
                          ? false
                          : "Por favor ingrese una contraseña",
                        ...passwordValidation,
                      }}
                      render={({ field }) => (
                        <>
                          <CHEKIOInput
                            {...field}
                            value={field.value || ""}
                            type="password"
                            placeholder="Ingrese la contraseña"
                            className={errors.password ? "border-red-500" : ""}
                          />
                          {errors.password && (
                            <p className="text-xs text-red-500 mt-1">
                              {errors.password.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>
                  <div className="text-xs bg-gray-50 p-3 rounded border">
                    <strong className="text-gray-700">
                      Requisitos de seguridad:
                    </strong>
                    <ul className="mt-2 space-y-1">
                      <li
                        className={`flex items-center space-x-2 ${
                          passwordValidations.minLength
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.minLength
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {passwordValidations.minLength ? "✓" : "○"}
                        </span>
                        <span>Mínimo 8 caracteres</span>
                      </li>
                      <li
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasLowercase
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasLowercase
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {passwordValidations.hasLowercase ? "✓" : "○"}
                        </span>
                        <span>Al menos una letra minúscula</span>
                      </li>
                      <li
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasUppercase
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasUppercase
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {passwordValidations.hasUppercase ? "✓" : "○"}
                        </span>
                        <span>Al menos una letra mayúscula</span>
                      </li>
                      <li
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasNumber
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasNumber
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {passwordValidations.hasNumber ? "✓" : "○"}
                        </span>
                        <span>Al menos un número</span>
                      </li>
                      <li
                        className={`flex items-center space-x-2 ${
                          passwordValidations.hasSpecialChar
                            ? "text-green-600"
                            : "text-gray-500"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            passwordValidations.hasSpecialChar
                              ? "bg-green-100 text-green-600"
                              : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          {passwordValidations.hasSpecialChar ? "✓" : "○"}
                        </span>
                        <span>Al menos un carácter especial (@$!%*?&)</span>
                      </li>
                    </ul>
                    {Object.values(passwordValidations).every(Boolean) && (
                      <div className="mt-2 text-green-600 font-medium flex items-center space-x-1">
                        <span>✓</span>
                        <span>Contraseña segura</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Auto Generated Password */}
              {passwordMode === "auto" && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Contraseña Generada
                    </label>
                    <div className="flex gap-2">
                      <CHEKIOInput
                        type="text"
                        value={generatedPassword}
                        readOnly
                        className="flex-1 font-mono bg-gray-50"
                      />
                      <CHEKIOButton
                        type="button"
                        variant={ButtonVariant.SECONDARY}
                        onClick={handleGeneratePassword}
                      >
                        <RefreshCw className="h-4 w-4" />
                        Regenerar
                      </CHEKIOButton>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                    <strong>✓ Contraseña segura generada</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <CHEKIOButton
            type="button"
            variant={ButtonVariant.SECONDARY}
            onClick={onClose}
            disabled={isCreatingUser || isUpdatingUser}
          >
            <X className="h-4 w-4" />
            Cancelar
          </CHEKIOButton>
          <CHEKIOButton
            type="submit"
            variant={ButtonVariant.PRIMARY}
            disabled={isCreatingUser || isUpdatingUser}
            className="min-w-[120px]"
          >
            {isCreatingUser || isUpdatingUser ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{editingUser ? "Actualizando..." : "Creando..."}</span>
              </>
            ) : editingUser ? (
              "Actualizar Usuario"
            ) : (
              "Crear Usuario"
            )}
          </CHEKIOButton>
        </div>
      </form>
    </CHEKIOModal>
  );
}
