"use client";

interface LoadingProps {
  message?: string[];
}

export default function LoadingCheckIO({ message }: LoadingProps) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-white/90 to-gray-100/90 backdrop-blur-md">
      <div className="relative w-56 h-56 mb-10">
        {/* Outer spinning ring */}
        <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-500"></div>
        </div>

        {/* Inner spinning ring */}
        <div className="absolute inset-4 animate-[spin_2s_linear_infinite_reverse]">
          <div className="w-full h-full rounded-full border-4 border-transparent border-t-indigo-500 border-l-indigo-500"></div>
        </div>

        {/* Logo container */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-24 h-24 animate-pulse">
            <img
              src="/logos/logo.svg"
              alt="Checkio Logo"
              className="w-full h-full object-contain drop-shadow-lg"
            />
            {/* Glowing effect */}
            <div className="absolute inset-0 bg-blue-400 rounded-full filter blur-xl opacity-20 animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4 text-center">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Cargando
        </h2>

        <div className="max-w-md px-6">
          <p className="text-lg text-gray-600 animate-fade">
            {
              (message
                ? message
                : [
                    "Preparando el espacio de trabajo...",
                    "Sincronizando datos de turnos...",
                    "Optimizando asignaciones...",
                    "Casi listo...",
                    "Verificando información...",
                    "Un momento más...",
                  ])[Math.floor((Date.now() / 2000) % 6)]
            }
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-64 h-2 mt-4 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 animate-[loading_2s_ease-in-out_infinite]"></div>
        </div>
      </div>

      <style jsx>{`
        @keyframes loading {
          0% {
            width: 0%;
          }
          50% {
            width: 100%;
          }
          100% {
            width: 0%;
          }
        }
        @keyframes fade {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
        .animate-fade {
          animation: fade 2s ease-in-out infinite;
        }
        @media (max-width: 640px) {
          .w-56 {
            width: 10rem;
          }
          .h-56 {
            height: 10rem;
          }
          .text-2xl {
            font-size: 1.5rem;
          }
          .text-lg {
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  );
}
