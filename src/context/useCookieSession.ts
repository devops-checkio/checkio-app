import { useContext } from "react";
import { CookieSessionContext } from "./CookieSessionContext";

export const useCookieSession = () => {
  const context = useContext(CookieSessionContext);

  if (!context) {
    throw new Error(
      "useCookieSession must be used within a CookieSessionProvider"
    );
  }

  return context;
};
