import { ShieldAlert } from "lucide-react";

interface CHEKIOUnauthorizedProps {
  breadcrumbs: string[];
}

export function CHEKIOUnauthorized({ breadcrumbs }: CHEKIOUnauthorizedProps) {
  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-6 w-full mx-auto">
      <div className="max-w-md mx-auto mt-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 rounded-full p-3">
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-4 text-center">
            Acceso No Autorizado
          </h1>
          <p className="text-gray-600 mb-6 text-center">
            Se requiere un token JWT válido para acceder a esta página.
          </p>
          <p className="text-sm text-gray-500 text-center">
            Asegúrese de incluir el parámetro jwt en la URL.
          </p>
        </div>
      </div>
    </div>
  );
}
