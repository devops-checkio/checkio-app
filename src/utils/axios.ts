import axios from "axios";

// Crear una instancia de axios con configuración base
const axiosInstance = axios.create({
  baseURL: "/api/proxy",
  timeout: 60_000,
  withCredentials: true,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "x-client": "web",
  },
});

// Interceptor para agregar headers comunes
axiosInstance.interceptors.request.use(async (config) => {
  // Solo agregar CSRF token a mutaciones (POST, PUT, DELETE, PATCH)
  if (
    ["post", "put", "delete", "patch"].includes(
      config.method?.toLowerCase() || "",
    )
  ) {
  }
  return config;
});

// Interceptor para manejar errores - Solo loggear
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Solo loggear errores, el contexto manejará la lógica de autenticación
    if (error.response?.status === 401) {
      console.log("Axios interceptor - 401 error detected");
      // Dispatch custom event for SessionStorageContext to listen to
      if (typeof window !== "undefined") {
        console.log("Axios interceptor - Dispatching auth:unauthorized event");
        window.dispatchEvent(new CustomEvent("auth:unauthorized"));
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
