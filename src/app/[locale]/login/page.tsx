"use client";

import { CHEKIOButton } from "@/components";
import LanguageSwitcher from "@/components/language-switcher";
import Globe from "@/components/ui/globe";
import SystemInput from "@/components/ui/system-input";
import { useCookieSession } from "@/context/useCookieSession";
import { LoginDto } from "@/dto/auth";
import { useToast } from "@/hooks/use-toast";
import { useAuth, useGetLogo } from "@/service/auths.service";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Shield,
  User,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { ForgotPassword } from "./_components/forgot-password";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
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

const cityNames: Record<string, string> = {
  santiago: "Santiago, Chile",
  florianopolis: "Florianópolis, Brasil",
  medellin: "Medellín, Colombia",
  bogota: "Bogotá, Colombia",
  "ciudad de mexico": "Ciudad de México, México",
  "la paz": "La Paz, Bolivia",
};

const cityPositions: Record<string, { x: number; y: number }> = {
  santiago: { x: 68, y: 72 },
  florianopolis: { x: 72, y: 68 },
  medellin: { x: 62, y: 38 },
  bogota: { x: 66, y: 42 },
  "ciudad de mexico": { x: 58, y: 28 },
  "la paz": { x: 70, y: 60 },
};

interface AttendanceMark {
  id: string;
  name: string;
  time: string;
  type: "Entrada" | "Salida";
  shift: string;
  city: string;
}

const generateMarkForCity = (city: string): AttendanceMark => {
  const names = [
    "Alejandro Mora",
    "Valentina Rojas",
    "Sebastián Castro",
    "Camila Vargas",
    "Matías Herrera",
    "Sofía Mendoza",
    "Diego Fuentes",
    "Isabella Campos",
    "Nicolás Vega",
    "Martina Soto",
  ];
  const shifts = ["Turno Mañana", "Turno Tarde", "Turno Noche", "Turno Administrativo"];
  const types: Array<"Entrada" | "Salida"> = ["Entrada", "Salida"];
  
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, "0");
  const minutes = now.getMinutes().toString().padStart(2, "0");

  return {
    id: Math.random().toString(36).substr(2, 9),
    name: names[Math.floor(Math.random() * names.length)],
    time: `${hours}:${minutes}`,
    type: types[Math.floor(Math.random() * types.length)],
    shift: shifts[Math.floor(Math.random() * shifts.length)],
    city,
  };
};

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useGetLogo();
  const { addTemplateUser, refreshAuth } = useCookieSession();
  const { mutate, isPending } = useAuth();
  const { toast } = useToast();
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessFeedback, setShowSuccessFeedback] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentCity, setCurrentCity] = useState("santiago");
  const [attendanceMarks, setAttendanceMarks] = useState<AttendanceMark[]>([]);
  const t = useTranslations("login");
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDto>();

  // Generate attendance mark when city changes
  useEffect(() => {
    if (!currentCity) return;

    // Clear previous marks and show only new one
    const newMark = generateMarkForCity(currentCity);
    setAttendanceMarks([newMark]);

    const timeout = setTimeout(() => {
      setAttendanceMarks([]);
    }, 3500);

    return () => clearTimeout(timeout);
  }, [currentCity]);

  const onSubmit: SubmitHandler<LoginDto> = (loginData) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    mutate(loginData, {
      onSuccess: async (response) => {
        try {
          addTemplateUser(response);
          await refreshAuth();

          setShowSuccessFeedback(true);
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const lenguaje = pathname.split("/")[1] || "es";
          router.push(`/${lenguaje}`);
        } catch (error) {
          setIsSubmitting(false);
          setShowSuccessFeedback(false);
        }
      },
      onError: (error: unknown) => {
        setIsSubmitting(false);
        console.error("Login error:", error);

        let extractedErrorMessage = t("loginError");
        const err = error as {
          response?: { data?: { message?: string; error?: string } };
          message?: string;
        };

        if (err?.response?.data?.message) {
          extractedErrorMessage = err.response.data.message;
        } else if (err?.response?.data?.error) {
          extractedErrorMessage = err.response.data.error;
        } else if (err?.message) {
          extractedErrorMessage = err.message;
        } else if (typeof err?.response?.data === "string") {
          extractedErrorMessage = err.response.data as string;
        }

        setErrorMessage(extractedErrorMessage);
        toast({
          title: "Error al iniciar sesión",
          description: extractedErrorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const handleBackToLogin = () => setShowForgotPassword(false);
  const handleShowForgotPassword = () => setShowForgotPassword(true);
  const handleInspectorClick = () => {
    window.location.href = "https://dt.bridev.cl";
  };

  return (
    <div className="relative flex min-h-screen" id="LOGIN_PAGE">
      {/* Left side - Dark branded section with Globe */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.6, 0.05, 0.01, 0.9] }}
        className="relative hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-hidden"
      >
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Globe in background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <div className="w-[800px] h-[800px]">
            <Globe
              baseColor={[0.21, 0.31, 0.59]}
              markerColor={[0.21, 0.50, 0.96]}
              glowColor={[0.21, 0.50, 0.96]}
              markers={[
                { location: [-33.4489, -70.6693], size: 0.08 },
                { location: [-27.5954, -48.548], size: 0.08 },
                { location: [6.2476, -75.5658], size: 0.08 },
                { location: [4.711, -74.0721], size: 0.08 },
                { location: [19.4326, -99.1332], size: 0.08 },
                { location: [-16.5, -68.15], size: 0.08 },
              ]}
              rotateCities={[
                "santiago",
                "florianopolis",
                "medellin",
                "bogota",
                "ciudad de mexico",
                "la paz",
              ]}
              rotationSpeed={4000}
              autoRotate={true}
              scale={1.1}
              className="w-full h-full"
              onCityChange={setCurrentCity}
            />
          </div>
        </div>

        {/* Attendance marks floating notifications - Fixed layer synchronized with globe */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <AnimatePresence>
            {attendanceMarks.map((mark) => {
              const position = cityPositions[mark.city] || { x: 50, y: 50 };
              return (
                <motion.div
                  key={mark.id}
                  initial={{ opacity: 0, scale: 0.5, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: -20 }}
                  transition={{
                    duration: 0.5,
                    ease: "easeOut",
                  }}
                  style={{
                    position: "absolute",
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                  }}
                >
                  <div className="relative">
                    {/* Pulse ring */}
                    <motion.div
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 2, opacity: 0 }}
                      transition={{ duration: 1.5, repeat: 2 }}
                      className={`absolute inset-0 -m-2 rounded-full border-2 ${
                        mark.type === "Entrada"
                          ? "border-green-400"
                          : "border-orange-400"
                      }`}
                    />

                    {/* Notification card */}
                    <div
                      className={`relative rounded-lg border backdrop-blur-sm px-3 py-2 shadow-lg ${
                        mark.type === "Entrada"
                          ? "border-green-400/30 bg-gradient-to-br from-green-500/90 to-emerald-600/90"
                          : "border-orange-400/30 bg-gradient-to-br from-orange-500/90 to-amber-600/90"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        >
                          {mark.type === "Entrada" ? (
                            <ArrowDownCircle className="h-4 w-4 text-white" />
                          ) : (
                            <ArrowUpCircle className="h-4 w-4 text-white" />
                          )}
                        </motion.div>
                        <div className="flex-1 text-left">
                          <p className="text-xs font-bold text-white leading-tight">
                            {mark.name}
                          </p>
                          <p className="text-[10px] font-semibold text-white/90">
                            {mark.type} • {mark.time}
                          </p>
                          <p className="text-[9px] font-medium text-white/70 mt-0.5">
                            {mark.shift}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* City tooltip */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCity}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-20"
          >
            <div className="rounded-full bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 shadow-2xl">
              <p className="text-sm font-semibold text-white whitespace-nowrap">
                {cityNames[currentCity] || currentCity}
              </p>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Image
              src="/logos/logo.svg"
              alt="CheckIO"
              width={180}
              height={46}
              className="h-auto"
              priority
            />
          </motion.div>

          {/* Main content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
                Gestión inteligente
                <br />
                de tu equipo
              </h1>
              <p className="text-lg text-slate-300 max-w-md">
                Control de asistencia biométrico, reportes en tiempo real y
                gestión completa de tu fuerza laboral.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                "Reconocimiento facial y huella digital",
                "Reportes y analíticas en tiempo real",
                "Gestión de horarios y turnos",
                "Aplicaciones móviles iOS y Android",
              ].map((feature, index) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#3680f2]/20">
                    <div className="h-2 w-2 rounded-full bg-[#37e7f4]" />
                  </div>
                  <span className="text-sm text-slate-300">{feature}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom decoration */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="text-xs text-slate-500"
          >
            &copy; {new Date().getFullYear()} CheckIO. Todos los derechos
            reservados.
          </motion.div>
        </div>
      </motion.div>

      {/* Right side - Login form */}
      <div className="relative flex flex-1 items-center justify-center bg-white px-6 py-12 lg:px-12">
        {/* Language Switcher */}
        <div className="absolute top-6 right-6 z-50">
          <LanguageSwitcher />
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.6, 0.05, 0.01, 0.9] }}
          className="w-full max-w-[440px]"
        >
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Logo - NO shadow */}
            <motion.div variants={itemVariants} className="flex justify-center">
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: "easeInOut",
                }}
                whileHover={{
                  scale: 1.05,
                  transition: { duration: 0.3 },
                }}
              >
                <Image
                  alt="CheckIO Logo"
                  width={140}
                  height={140}
                  src={data?.logo || "/logos/logo.svg"}
                  priority
                />
              </motion.div>
            </motion.div>

            {/* Welcome */}
            <motion.div variants={itemVariants} className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                {t("welcome") || "Bienvenido"}
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                {t("welcomeSubtitle") || "Inicia sesión para acceder a tu cuenta"}
              </p>
            </motion.div>

            {/* Form transition */}
            <AnimatePresence mode="wait">
              {showForgotPassword ? (
                <motion.div
                  key="forgot"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <ForgotPassword onBackToLogin={handleBackToLogin} />
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                >
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <AnimatePresence>
                      {errorMessage && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                            <p className="text-sm font-medium text-red-800">
                              {errorMessage}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <motion.div variants={itemVariants} className="space-y-5">
                      {/* Email field */}
                      <div className="relative group">
                        <div className="pointer-events-none absolute left-3 top-[2.375rem] z-10 text-gray-400 transition-colors duration-300 group-focus-within:text-[#3680f2]">
                          <Mail className="h-5 w-5" />
                        </div>
                        <div className="[&_input]:pl-10 [&_input]:bg-gray-50 [&_input]:border-gray-200 [&_input]:focus:bg-white [&_input]:focus:border-[#3680f2] [&_input]:focus:ring-4 [&_input]:focus:ring-[#3680f2]/10 [&_input]:transition-all [&_input]:duration-300">
                          <SystemInput
                            control={control}
                            type="email"
                            errors={errors}
                            label={t("email")}
                            placeholder={t("emailPlaceholder")}
                            attribute="email"
                            rules={{ required: true }}
                            showError
                          />
                        </div>
                      </div>

                      {/* Password field */}
                      <div className="relative group">
                        <div className="pointer-events-none absolute left-3 top-[2.375rem] z-10 text-gray-400 transition-colors duration-300 group-focus-within:text-[#3680f2]">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div className="relative [&_input]:pl-10 [&_input]:pr-10 [&_input]:bg-gray-50 [&_input]:border-gray-200 [&_input]:focus:bg-white [&_input]:focus:border-[#3680f2] [&_input]:focus:ring-4 [&_input]:focus:ring-[#3680f2]/10 [&_input]:transition-all [&_input]:duration-300">
                          <SystemInput
                            control={control}
                            errors={errors}
                            type={showPassword ? "text" : "password"}
                            label={t("password")}
                            placeholder={t("passwordPlaceholder")}
                            attribute="password"
                            rules={{ required: true }}
                            showError
                          />
                          <motion.button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9, rotate: 15 }}
                            className="absolute right-3 top-[2.375rem] z-10 text-gray-400 transition-colors duration-300 hover:text-gray-600"
                            aria-label={
                              showPassword
                                ? "Ocultar contraseña"
                                : "Mostrar contraseña"
                            }
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5" />
                            ) : (
                              <Eye className="h-5 w-5" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>

                    <div className="space-y-4 pt-2">
                      {/* Forgot password link */}
                      <motion.div
                        variants={itemVariants}
                        className="flex justify-end"
                      >
                        <motion.button
                          type="button"
                          onClick={handleShowForgotPassword}
                          disabled={isSubmitting || isPending}
                          whileHover={{ x: 2 }}
                          className="text-sm font-medium text-[#3680f2] transition-all duration-300 hover:text-[#2d6fd4] hover:underline disabled:opacity-50"
                        >
                          {t("forgotPassword")}
                        </motion.button>
                      </motion.div>

                      {/* Primary login button */}
                      <motion.div variants={itemVariants}>
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
                            disabled={isSubmitting || isPending}
                            className="w-full bg-gradient-to-r from-[#3680f2] to-[#37e7f4] text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                          >
                            {isSubmitting || isPending ? (
                              <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                {t("signingIn") || "Iniciando sesión..."}
                              </>
                            ) : (
                              <>
                                <User className="mr-2 h-5 w-5" />
                                {t("signIn")}
                              </>
                            )}
                          </CHEKIOButton>
                        </motion.div>
                      </motion.div>

                      {/* Divider */}
                      <motion.div
                        variants={itemVariants}
                        className="relative flex items-center py-2"
                      >
                        <div className="flex-1 border-t border-gray-200" />
                        <span className="px-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                          {t("or")}
                        </span>
                        <div className="flex-1 border-t border-gray-200" />
                      </motion.div>

                      {/* Inspector access button */}
                      <motion.div variants={itemVariants}>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <CHEKIOButton
                            type="button"
                            variant="outline"
                            onClick={handleInspectorClick}
                            disabled={isSubmitting || isPending}
                            className="w-full border-gray-300 bg-gray-50 transition-all duration-300 hover:bg-gray-100 hover:border-gray-400"
                          >
                            <Shield className="mr-2 h-5 w-5" />
                            {t("laborInspectorAccess")}
                          </CHEKIOButton>
                        </motion.div>
                      </motion.div>
                    </div>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* App store badges - Premium design */}
            <motion.div
              variants={itemVariants}
              className="border-t border-gray-100 pt-6"
            >
              <p className="mb-5 text-center text-xs font-medium text-gray-500">
                {t("downloadApp") || "Descarga nuestra aplicación"}
              </p>
              <div className="flex flex-col gap-3">
                {/* Google Play */}
                <motion.a
                  href="https://play.google.com/store/apps/details?id=com.devmentor.controlasistencia&amp;hl=es&amp;gl=US"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{
                    x: 4,
                    transition: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 group-hover:border-gray-300 group-hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-green-600">
                      <svg
                        className="h-6 w-6 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-gray-500">
                        Disponible en
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        Google Play
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </motion.a>

                {/* App Store */}
                <motion.a
                  href="https://apps.apple.com/cl/app/checkio/id1561633059"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{
                    x: 4,
                    transition: { type: "spring", stiffness: 400, damping: 10 },
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group relative"
                >
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-300 group-hover:border-gray-300 group-hover:shadow-md">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                      <svg
                        className="h-6 w-6 text-white"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M18.71,19.5C17.88,20.74 17,21.95 15.66,21.97C14.32,22 13.89,21.18 12.37,21.18C10.84,21.18 10.37,21.95 9.1,22C7.79,22.05 6.8,20.68 5.96,19.47C4.25,17 2.94,12.45 4.7,9.39C5.57,7.87 7.13,6.91 8.82,6.88C10.1,6.86 11.32,7.75 12.11,7.75C12.89,7.75 14.37,6.68 15.92,6.84C16.57,6.87 18.39,7.1 19.56,8.82C19.47,8.88 17.39,10.1 17.41,12.63C17.44,15.65 20.06,16.66 20.09,16.67C20.06,16.74 19.67,18.11 18.71,19.5M13,3.5C13.73,2.67 14.94,2.04 15.94,2C16.07,3.17 15.6,4.35 14.9,5.19C14.21,6.04 13.07,6.7 11.95,6.61C11.8,5.46 12.36,4.26 13,3.5Z" />
                      </svg>
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-xs font-medium text-gray-500">
                        Disponible en
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        App Store
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400 transition-transform duration-300 group-hover:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </motion.a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* Success feedback overlay */}
      <AnimatePresence>
        {showSuccessFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                transition={{
                  duration: 0.6,
                  times: [0, 0.6, 1],
                  ease: "easeOut",
                }}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100"
              >
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold text-gray-900"
              >
                ¡Bienvenido!
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
