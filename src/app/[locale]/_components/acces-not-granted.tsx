import { CheckIOButton } from "@/components/template/checkIO-button";
import { useCookieSession } from "@/context/useCookieSession";
import { IntegrationProductModule } from "@/dto/enum/integration-product-module.enum";
import { OrganizationPermissionCode } from "@/dto/enum/permission-code.enum";
import {
  faArrowLeft,
  faExclamationTriangle,
  faLock,
  faShieldAlt,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { useRouter } from "next/navigation";

const AccessNotGranted = ({
  children,
  OrganizationPermissionCode,
  requireProductModule,
}: {
  children?: React.ReactNode;
  OrganizationPermissionCode:
    | OrganizationPermissionCode
    | OrganizationPermissionCode[];
  requireProductModule?: IntegrationProductModule;
}) => {
  const { canRead, hasProductModule } = useCookieSession();
  const router = useRouter();

  const permOk = Array.isArray(OrganizationPermissionCode)
    ? OrganizationPermissionCode.some((code) => canRead(code))
    : canRead(OrganizationPermissionCode);

  const moduleOk =
    requireProductModule === undefined
      ? true
      : requireProductModule === IntegrationProductModule.ETL
        ? hasProductModule(IntegrationProductModule.ETL)
        : hasProductModule(IntegrationProductModule.API);

  if (permOk && moduleOk) {
    return <>{children}</>;
  } else {
    return (
      <div className="min-h-screen">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.1)_1px,transparent_0)] bg-[length:30px_30px]" />
        </div>

        {/* Header with Logo */}
        <div className="relative z-10 pt-8 pb-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <div className="w-44 h-44 relative">
                <Image
                  src="/logos/logo.svg"
                  alt="CheckIO Logo"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            {/* Lock Icon */}
            <div className="mb-8 flex justify-center">
              <div className="relative group">
                <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl shadow-xl flex items-center justify-center transition-all duration-300 group-hover:shadow-2xl group-hover:scale-105">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="text-white text-3xl"
                  />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-500 rounded-2xl blur-lg opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
              </div>
            </div>

            {/* Main Title */}
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Acceso Denegado
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              No tienes los permisos necesarios para acceder a esta sección
            </p>

            {/* Warning Badge */}
            <div className="inline-flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-full px-6 py-3 mb-8">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="text-amber-600 text-lg"
              />
              <span className="text-amber-800 text-lg font-medium">
                Permisos Insuficientes
              </span>
            </div>

            {/* Security Log Notice */}
            <div className="max-w-2xl mx-auto mb-12">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <FontAwesomeIcon
                      icon={faLock}
                      className="text-red-600 text-sm"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">
                      Registro de Seguridad
                    </h3>
                    <p className="text-red-800 text-sm leading-relaxed">
                      Por motivos de seguridad, este intento de acceso
                      restringido ha sido registrado en nuestros logs del
                      sistema. Esta información se utiliza para mantener la
                      integridad y seguridad de la plataforma.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Explanation */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  ¿Por qué no puedo acceder?
                </h2>

                <div className="grid md:grid-cols-2 gap-8 text-left">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 font-semibold text-sm">
                          1
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          Permisos de Usuario
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Tu cuenta actual no tiene asignados los permisos
                          necesarios para visualizar este contenido.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-blue-600 font-semibold text-sm">
                          2
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          Configuración de Seguridad
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Esta sección está protegida por políticas de seguridad
                          de la empresa.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-green-600 font-semibold text-sm">
                          ✓
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          Solución Rápida
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Contacta al administrador del sistema para solicitar
                          los permisos necesarios.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-green-600 font-semibold text-sm">
                          ✓
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                          Alternativas
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          Puedes acceder a otras secciones disponibles en tu
                          dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
              <CheckIOButton
                onClick={() => router.push("/dashboard")}
                label="Ir al Dashboard"
                icon={
                  <FontAwesomeIcon icon={faShieldAlt} className="w-4 h-4" />
                }
                color="info"
                className="w-full sm:w-auto justify-center py-3 px-8 text-base font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
              />

              <CheckIOButton
                onClick={() => router.back()}
                label="Volver Atrás"
                icon={
                  <FontAwesomeIcon icon={faArrowLeft} className="w-4 h-4" />
                }
                color="default"
                className="w-full sm:w-auto justify-center py-3 px-8 text-base font-medium rounded-xl transition-all duration-200"
              />
            </div>

            {/* Help Section */}
            <div className="mt-16 pt-8 border-t border-gray-200/50">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  ¿Necesitas ayuda?
                </h3>
                <p className="text-gray-600 mb-4">
                  Si crees que deberías tener acceso a esta sección, contacta al
                  equipo de soporte técnico.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm text-gray-500">
                  <span>📧 soporte@checkio.com</span>
                  <span>📞 +1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-indigo-400/10 rounded-full blur-2xl" />
        <div className="absolute bottom-20 left-10 w-40 h-40 bg-gradient-to-tr from-red-400/10 to-pink-400/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-xl" />
      </div>
    );
  }
};

export default AccessNotGranted;
