import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextCoreWebVitals,
  {
    rules: {
      // React Hooks plugin v7 (via eslint-config-next 16) adds compiler-style rules that
      // flag patterns common in this codebase; keep warnings actionable without blocking lint.
      "react-hooks/static-components": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
    },
  },
];
