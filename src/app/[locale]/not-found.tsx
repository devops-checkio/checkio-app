"use client";

import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Home, ArrowLeft, Search } from "lucide-react";
import { CHEKIOButton } from "@/components";

export default function NotFound() {
  const router = useRouter();
  const pathname = usePathname();

  // Extraer el locale del pathname
  const locale = pathname?.split("/")[1] || "es";

  const handleGoHome = () => {
    router.push(`/${locale}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Image
                src="/logos/logo.svg"
                alt="CheckIO Logo"
                width={32}
                height={32}
                className="h-8 w-auto"
              />
              <div>
                <h1 className="text-lg font-bold text-gray-800">CheckIO</h1>
                <p className="text-xs text-gray-600">Portal Asistencia</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="max-w-2xl w-full text-center">
          {/* 404 Illustration */}
          <div className="mb-8">
            <div className="relative inline-block">
              <div className="w-48 h-48 mx-auto bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center shadow-lg">
                <div className="text-8xl font-bold text-red-500">404</div>
              </div>
              <div className="absolute -top-4 -right-4 w-16 h-16 bg-yellow-200 rounded-full flex items-center justify-center animate-bounce">
                <Search className="w-8 h-8 text-yellow-600" />
              </div>
            </div>
          </div>

          {/* Error Message */}
          <div className="mb-8">
            <h2 className="text-4xl font-bold text-gray-800 mb-4">
              ¡Oops! Página no encontrada
            </h2>
            <p className="text-lg text-gray-600 mb-2">
              Lo sentimos, la página que estás buscando no existe o ha sido
              movida.
            </p>
            <p className="text-sm text-gray-500">
              La URL <code className="bg-gray-200 px-2 py-1 rounded text-red-600 font-mono">{pathname || "N/A"}</code> no
              fue encontrada en nuestro servidor.
            </p>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ¿Qué puedes hacer?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-blue-600 font-bold">1</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">
                    Verificar la URL
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Asegúrate de que la dirección esté escrita correctamente.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-green-600 font-bold">2</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">
                    Volver atrás
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Regresa a la página anterior usando el botón de retroceso.
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-purple-600 font-bold">3</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">
                    Ir al inicio
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Regresa a la página principal del sistema.
                </p>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                    <span className="text-orange-600 font-bold">4</span>
                  </div>
                  <h4 className="font-semibold text-gray-800">
                    Contactar soporte
                  </h4>
                </div>
                <p className="text-sm text-gray-600">
                  Si crees que esto es un error, contacta al equipo de soporte.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <CHEKIOButton
              variant="primary"
              onClick={handleGoHome}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Ir al Inicio
            </CHEKIOButton>
            <CHEKIOButton
              variant="secondaryBlue"
              onClick={handleGoBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver Atrás
            </CHEKIOButton>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-3">
                <Image
                  src="/logos/logo.svg"
                  alt="CheckIO Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto mr-2"
                />
                <div>
                  <h3 className="text-sm font-bold">CheckIO</h3>
                  <p className="text-gray-400 text-xs">Portal Asistencia</p>
                </div>
              </div>
              <p className="text-gray-400 text-xs">
                Sistema integral de control de asistencia y marcaje.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Enlaces Rápidos</h4>
              <ul className="space-y-1 text-xs">
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Términos y Condiciones
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    Contacto
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Contacto</h4>
              <div className="space-y-1 text-xs text-gray-400">
                <p>¿Necesitas ayuda?</p>
                <p>
                  <a
                    href="mailto:asistencia@checkio.cl"
                    className="text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    asistencia@checkio.cl
                  </a>
                </p>
                <p className="text-xs text-gray-500 mt-3">
                  Error 404 - Página no encontrada
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-700 mt-6 pt-4 text-center">
            <p className="text-gray-400 text-xs">
              © 2025 CheckIO. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

