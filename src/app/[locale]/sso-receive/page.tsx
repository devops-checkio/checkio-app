"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCookieSession } from "@/context/useCookieSession";
import { useLoginSSOToken } from "@/service/auths.service";
import {
  ArrowRight,
  CheckCircle,
  Lock,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
// Custom Loading Component
const CustomLoadingSpinner = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="relative">
      {/* Main Spinner Ring */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 relative">
        {/* Outer Ring */}
        <div className="absolute inset-0 border-3 sm:border-4 border-blue-200/20 rounded-full"></div>

        {/* Animated Ring */}
        <div className="absolute inset-0 border-3 sm:border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>

        {/* Inner Ring */}
        <div className="absolute inset-1.5 sm:inset-2 border-2 border-purple-200/30 rounded-full"></div>

        {/* Center Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
          </div>
        </div>
      </div>

      {/* Orbiting Dots */}
      <div className="absolute inset-0 w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={`absolute w-2 h-2 sm:w-2.5 sm:h-2.5 lg:w-3 lg:h-3 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full animate-pulse ${
              currentStep > index ? "opacity-100" : "opacity-30"
            }`}
            style={{
              top: `${50 + 35 * Math.sin((index * Math.PI) / 2)}%`,
              left: `${50 + 35 * Math.cos((index * Math.PI) / 2)}%`,
              transform: "translate(-50%, -50%)",
              animationDelay: `${index * 200}ms`,
            }}
          />
        ))}
      </div>

      {/* Progress Ring */}
      <div className="absolute -inset-1.5 sm:-inset-2">
        <svg
          className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 transform -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="rgba(59, 130, 246, 0.2)"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="url(#gradient)"
            strokeWidth="3"
            fill="none"
            strokeDasharray={`${(currentStep / 4) * 283} 283`}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
};

// Step Indicator Component
const StepIndicator = ({
  step,
  currentStep,
  text,
}: {
  step: number;
  currentStep: number;
  text: string;
}) => {
  const isActive = currentStep >= step;
  const isCompleted = currentStep > step;

  return (
    <div
      className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-500 ${
        isActive ? "opacity-100" : "opacity-40"
      }`}
    >
      <div className="relative">
        <div
          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-500 ${
            isCompleted
              ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
              : isActive
              ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
              : "bg-gray-600 text-gray-300"
          }`}
        >
          {isCompleted ? (
            <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            step
          )}
        </div>
        {isActive && !isCompleted && (
          <div className="absolute inset-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-500/30 animate-ping"></div>
        )}
      </div>
      <div className="flex-1">
        <span className="text-xs sm:text-sm text-blue-100 font-medium">
          {text}
        </span>
        {isActive && !isCompleted && (
          <div className="mt-1 w-full bg-gray-700 rounded-full h-0.5 sm:h-1">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-0.5 sm:h-1 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default function SSOReceivePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { addTemplateUser, refreshAuth } = useCookieSession();
  const { mutate: loginSSO, isPending } = useLoginSSOToken();
  const [validationStatus, setValidationStatus] = useState<
    "validating" | "success" | "error"
  >("validating");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    const ssoToken = searchParams.get("sso_token");
    const appId = searchParams.get("app_id");
    const email = searchParams.get("email");
    const view = searchParams.get("view");

    if (!ssoToken || !appId) {
      setValidationStatus("error");
      setErrorMessage(
        "Parámetros SSO faltantes. Token o App ID no encontrados."
      );
      return;
    }

    // Simular pasos del proceso de validación con timing más realista
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < 4) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1200);

    // Validar el token SSO recibido de App1
    loginSSO(
      {
        token: ssoToken,
        appId: appId,
        email: email || "",
      },
      {
        onSuccess: async (response) => {
          clearInterval(stepInterval);

          setValidationStatus("success");

          addTemplateUser(response);

          await refreshAuth();

          setTimeout(() => {
            const lenguaje = pathname.split("/")[1] || "es";

            switch (view || "") {
              case "mark":
                router.push(`/${lenguaje}/assistance/web`);
                break;
              default:
                router.push(`/${lenguaje}`);
            }
          }, 3000);
        },
        onError: (error: any) => {
          clearInterval(stepInterval);
          setValidationStatus("error");
          if (error?.response?.data?.message) {
            setErrorMessage(error.response.data.message);
          } else {
            setErrorMessage("Error al validar el token SSO.");
          }
        },
      }
    );
  }, [searchParams, loginSSO, addTemplateUser, refreshAuth, router]);

  const handleRetry = () => {
    window.location.reload();
  };

  const handleGoToLogin = () => {
    const lenguaje = window.location.pathname.split("/")[1] || "es";
    router.push(`/${lenguaje}/login`);
  };

  const getStepText = (step: number) => {
    switch (step) {
      case 1:
        return "Conectando con sistema corporativo...";
      case 2:
        return "Validando credenciales SSO...";
      case 3:
        return "Verificando permisos de acceso...";
      case 4:
        return "Configurando sesión unificada...";
      default:
        return "Procesando...";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        ></div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-purple-500/10 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-cyan-500/10 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="relative z-10 w-full max-w-4xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-center">
          {/* Left Side - Client Integration */}
          <div className="space-y-6 sm:space-y-8">
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
                Integración SSO Corporativa
              </h2>
              <p className="text-blue-100 text-base sm:text-lg mb-3 sm:mb-4">
                Conectando CheckIO con el sistema principal de su organización
              </p>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500/20 rounded-full flex items-center justify-center">
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-blue-200">
                    Single Sign-On (SSO)
                  </h3>
                </div>
                <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">
                  Esta integración permite acceder a CheckIO utilizando las
                  credenciales de su sistema corporativo principal. Una vez
                  autenticado, podrá navegar entre ambas aplicaciones sin
                  necesidad de volver a iniciar sesión.
                </p>
              </div>
            </div>

            {/* Client Logos */}
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-semibold text-white text-center lg:text-left">
                Sistemas Corporativos Integrados
              </h3>
              <p className="text-blue-200 text-xs sm:text-sm text-center lg:text-left mb-3 sm:mb-4">
                Empresas que utilizan integración SSO con CheckIO
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <Image
                    src="/clients/logo/avsoft.png"
                    alt="BECO"
                    width={120}
                    height={80}
                    className="h-8 sm:h-10 w-auto object-contain"
                    quality={100}
                    unoptimized={false}
                    priority
                  />
                </div>
                {/* <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <Image
                    src="/clients/logo/bionet.png"
                    alt="Bionet"
                    width={120}
                    height={80}
                    className="h-10 w-auto object-contain"
                    quality={100}
                    unoptimized={false}
                    priority
                  />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <Image
                    src="/clients/logo/rubrika.svg"
                    alt="Rubrika"
                    width={120}
                    height={80}
                    className="h-10 w-auto object-contain"
                    quality={100}
                    unoptimized={false}
                    priority
                  />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center justify-center hover:bg-white/20 transition-all duration-300">
                  <Image
                    src="/clients/logo/tecnored.png"
                    alt="Tecnored"
                    width={120}
                    height={80}
                    className="h-10 w-auto object-contain"
                    quality={100}
                    unoptimized={false}
                    priority
                  />
                </div> */}
              </div>
            </div>

            {/* Security Features */}
            <div className="space-y-3 sm:space-y-4">
              <h4 className="text-sm sm:text-md font-semibold text-white mb-2 sm:mb-3">
                Características de Seguridad SSO
              </h4>
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2 sm:space-x-3 text-blue-200">
                  <Lock className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Conexión encriptada SSL/TLS entre sistemas
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 text-blue-200">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Autenticación centralizada con doble factor
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 text-blue-200">
                  <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Gestión unificada de usuarios corporativos
                  </span>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-3 text-blue-200">
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="text-xs sm:text-sm">
                    Acceso sin interrupciones entre aplicaciones
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Status Card */}
          <div className="flex justify-center">
            <Card className="w-full max-w-sm sm:max-w-md bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
              <CardHeader className="text-center pb-4 sm:pb-6">
                <div className="flex items-center justify-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
                  <Image
                    src="/logos/logo.svg"
                    alt="CheckIO"
                    width={100}
                    height={100}
                    className="h-12 sm:h-16 lg:h-20 w-auto object-contain"
                  />
                </div>
                <div className="mx-auto mb-4 sm:mb-6">
                  {validationStatus === "validating" && (
                    <CustomLoadingSpinner currentStep={currentStep} />
                  )}
                  {validationStatus === "success" && (
                    <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center animate-pulse">
                      <CheckCircle className="w-10 h-10 text-white" />
                    </div>
                  )}
                  {validationStatus === "error" && (
                    <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                      <XCircle className="w-10 h-10 text-white" />
                    </div>
                  )}
                </div>

                <CardTitle className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-2">
                  {validationStatus === "validating" &&
                    "Procesando Integración SSO"}
                  {validationStatus === "success" &&
                    "¡Integración SSO Exitosa!"}
                  {validationStatus === "error" && "Error de Integración SSO"}
                </CardTitle>

                <CardDescription className="text-blue-200 text-xs sm:text-sm">
                  {validationStatus === "validating" &&
                    "Validando credenciales del sistema corporativo"}
                  {validationStatus === "success" &&
                    "Acceso unificado configurado correctamente"}
                  {validationStatus === "error" &&
                    "No se pudo completar la integración SSO"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4 sm:space-y-6">
                {validationStatus === "validating" && (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Progress Steps */}
                    <div className="space-y-3 sm:space-y-4">
                      {[1, 2, 3, 4].map((step) => (
                        <StepIndicator
                          key={step}
                          step={step}
                          currentStep={currentStep}
                          text={getStepText(step)}
                        />
                      ))}
                    </div>

                    {/* Progress Percentage */}
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-blue-300 mb-1 sm:mb-2">
                        {Math.round((currentStep / 4) * 100)}%
                      </div>
                      <p className="text-xs text-blue-200">
                        Paso {currentStep} de 4 completado
                      </p>
                    </div>

                    {/* Loading Animation */}
                    <div className="flex justify-center space-x-1 sm:space-x-2">
                      {[0, 1, 2].map((index) => (
                        <div
                          key={index}
                          className="w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-400 rounded-full animate-bounce"
                          style={{ animationDelay: `${index * 0.2}s` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {validationStatus === "success" && (
                  <div className="text-center space-y-3 sm:space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 text-green-400">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Integración SSO completada
                        </span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-green-400">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Acceso unificado configurado
                        </span>
                      </div>
                      <div className="flex items-center justify-center space-x-2 text-green-400">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                        <span className="text-xs sm:text-sm">
                          Redirigiendo a CheckIO
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center space-x-2 text-blue-200">
                      <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 animate-bounce" />
                      <span className="text-xs sm:text-sm">
                        Sistema de Control de Asistencia
                      </span>
                    </div>
                  </div>
                )}

                {validationStatus === "error" && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="p-3 sm:p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                      <p className="text-xs sm:text-sm text-red-200 text-center">
                        {errorMessage}
                      </p>
                    </div>

                    <div className="flex flex-col space-y-2 sm:space-y-3">
                      <Button
                        onClick={handleRetry}
                        variant="outline"
                        className="w-full border-blue-400/30 text-blue-200 hover:bg-blue-500/20 hover:border-blue-400 text-xs sm:text-sm py-2 sm:py-2.5"
                      >
                        Reintentar Integración
                      </Button>
                      <Button
                        onClick={handleGoToLogin}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-xs sm:text-sm py-2 sm:py-2.5"
                      >
                        Acceso Manual
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
