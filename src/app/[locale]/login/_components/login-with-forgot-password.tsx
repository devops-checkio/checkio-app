"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useForm } from "react-hook-form";

interface LoginFormData {
  email: string;
  password: string;
}

interface ForgotPasswordFormData {
  email: string;
}

interface LoginWithForgotPasswordProps {
  className?: string;
  onLogin?: (data: LoginFormData) => void;
  onForgotPassword?: (data: ForgotPasswordFormData) => void;
  isLoginPending?: boolean;
  isForgotPasswordPending?: boolean;
}

export function LoginWithForgotPassword({
  className,
  onLogin,
  onForgotPassword,
  isLoginPending = false,
  isForgotPasswordPending = false,
}: LoginWithForgotPasswordProps) {
  const [currentView, setCurrentView] = useState<"login" | "forgot-password">(
    "login"
  );

  const loginForm = useForm<LoginFormData>();
  const forgotPasswordForm = useForm<ForgotPasswordFormData>();

  const handleLogin = (data: LoginFormData) => {
    if (onLogin) {
      onLogin(data);
    }
  };

  const handleForgotPassword = (data: ForgotPasswordFormData) => {
    if (onForgotPassword) {
      onForgotPassword(data);
    }
  };

  const handleBackToLogin = () => {
    setCurrentView("login");
  };

  const handleShowForgotPassword = () => {
    setCurrentView("forgot-password");
  };

  return (
    <div className={cn("w-full flex justify-center", className)}>
      <div className="backdrop-blur-lg bg-white/10 rounded-2xl border border-white/20 shadow-2xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logos/outlife-logo-white.svg"
            alt="Outlife Logo"
            width={180}
            height={60}
            className="mb-6"
            priority
          />
          <h1 className="text-3xl font-bold text-white mb-2">
            {currentView === "login"
              ? "Bienvenido a Checkio"
              : "Recuperar Contraseña"}
          </h1>
          <p className="text-white/80 text-center">
            {currentView === "login"
              ? "Descubre la naturaleza de una nueva manera"
              : "Ingresa tu correo electrónico para recibir instrucciones"}
          </p>
        </div>

        {currentView === "login" ? (
          <form
            onSubmit={loginForm.handleSubmit(handleLogin)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/50"
                {...loginForm.register("email", {
                  required: "El correo es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Correo electrónico inválido",
                  },
                })}
              />
              {loginForm.formState.errors.email && (
                <p className="text-red-300 text-sm">
                  {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white">
                  Contraseña
                </Label>
                <button
                  type="button"
                  onClick={handleShowForgotPassword}
                  className="text-sm text-white/80 hover:text-white transition-colors"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/50"
                {...loginForm.register("password", {
                  required: "La contraseña es requerida",
                  minLength: {
                    value: 6,
                    message: "La contraseña debe tener al menos 6 caracteres",
                  },
                })}
              />
              {loginForm.formState.errors.password && (
                <p className="text-red-300 text-sm">
                  {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoginPending}
              className="w-full bg-white text-green-900 hover:bg-white/90 transition-colors"
            >
              {isLoginPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </Button>
          </form>
        ) : (
          <form
            onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)}
            className="space-y-6"
          >
            <div className="space-y-2">
              <Label htmlFor="forgot-email" className="text-white">
                Correo electrónico
              </Label>
              <Input
                id="forgot-email"
                type="email"
                placeholder="correo@ejemplo.com"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/50 focus:ring-white/50"
                {...forgotPasswordForm.register("email", {
                  required: "El correo es requerido",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Correo electrónico inválido",
                  },
                })}
              />
              {forgotPasswordForm.formState.errors.email && (
                <p className="text-red-300 text-sm">
                  {forgotPasswordForm.formState.errors.email.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isForgotPasswordPending}
              className="w-full bg-white text-green-900 hover:bg-white/90 transition-colors"
            >
              {isForgotPasswordPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Enviar instrucciones"
              )}
            </Button>

            <div className="flex items-center justify-center">
              <button
                type="button"
                onClick={handleBackToLogin}
                className="flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver al login
              </button>
            </div>
          </form>
        )}

        <div className="mt-8 text-center text-xs text-white/60">
          Al continuar, aceptas nuestros{" "}
          <a
            href="#"
            className="text-white/80 hover:text-white transition-colors"
          >
            Términos de Servicio
          </a>{" "}
          y{" "}
          <a
            href="#"
            className="text-white/80 hover:text-white transition-colors"
          >
            Política de Privacidad
          </a>
          .
        </div>
      </div>
    </div>
  );
}
