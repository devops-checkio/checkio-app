// Color configuration based on environment variables
const getPrimaryColor = () => {
  const envColor = process.env.NEXT_PUBLIC_COLOR || "#eb1d2e";

  // If the color doesn't start with #, add it
  if (!envColor.startsWith("#")) {
    return `#${envColor}`;
  }

  return envColor;
};

const PRIMARY_COLOR = getPrimaryColor();

// Color palette generator
export function generateColorPalette(baseColor: string) {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  // Convert RGB to hex
  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };

  // Lighten color
  const lighten = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.min(255, Math.floor(rgb.r + (255 - rgb.r) * percent));
    const g = Math.min(255, Math.floor(rgb.g + (255 - rgb.g) * percent));
    const b = Math.min(255, Math.floor(rgb.b + (255 - rgb.b) * percent));

    return rgbToHex(r, g, b);
  };

  // Darken color
  const darken = (hex: string, percent: number) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = Math.floor(rgb.r * (1 - percent));
    const g = Math.floor(rgb.g * (1 - percent));
    const b = Math.floor(rgb.b * (1 - percent));

    return rgbToHex(r, g, b);
  };

  return {
    primary: baseColor,
    primaryLight: lighten(baseColor, 0.1),
    primaryLighter: lighten(baseColor, 0.2),
    primaryLightest: lighten(baseColor, 0.3),
    primaryDark: darken(baseColor, 0.1),
    primaryDarker: darken(baseColor, 0.2),
    primaryDarkest: darken(baseColor, 0.3),

    // Background variations
    primaryBg: lighten(baseColor, 0.9),
    primaryBgLight: lighten(baseColor, 0.85),
    primaryBgDark: lighten(baseColor, 0.8),

    // Text variations
    primaryText: baseColor,
    primaryTextLight: lighten(baseColor, 0.2),
    primaryTextDark: darken(baseColor, 0.2),
  };
}

// Generate color palette from environment variable
export const colors = generateColorPalette(PRIMARY_COLOR);

// CSS custom properties for dynamic theming
export const colorCSSVariables = {
  "--color-primary": colors.primary,
  "--color-primary-light": colors.primaryLight,
  "--color-primary-lighter": colors.primaryLighter,
  "--color-primary-lightest": colors.primaryLightest,
  "--color-primary-dark": colors.primaryDark,
  "--color-primary-darker": colors.primaryDarker,
  "--color-primary-darkest": colors.primaryDarkest,
  "--color-primary-bg": colors.primaryBg,
  "--color-primary-bg-light": colors.primaryBgLight,
  "--color-primary-bg-dark": colors.primaryBgDark,
  "--color-primary-text": colors.primaryText,
  "--color-primary-text-light": colors.primaryTextLight,
  "--color-primary-text-dark": colors.primaryTextDark,
} as const;

// Utility function to get color with opacity
export function getColorWithOpacity(color: string, opacity: number) {
  const rgb = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (!rgb) return color;

  const r = parseInt(rgb[1], 16);
  const g = parseInt(rgb[2], 16);
  const b = parseInt(rgb[3], 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

// Predefined color schemes for common use cases
export const colorSchemes = {
  // Button variants
  primary: {
    bg: colors.primary,
    text: "#ffffff",
    hover: colors.primaryDark,
    focus: colors.primaryLight,
  },
  secondary: {
    bg: colors.primaryBg,
    text: colors.primaryText,
    hover: colors.primaryBgDark,
    focus: colors.primaryBgLight,
  },
  search: {
    bg: "#2563eb", // Blue for search
    text: "#ffffff",
    hover: "#1d4ed8",
    focus: "#3b82f6",
  },
  refresh: {
    bg: "#dbeafe", // Light blue for refresh
    text: "#1e40af",
    hover: "#bfdbfe",
    focus: "#e0e7ff",
  },

  // Action button variants
  edit: {
    bg: "#f97316", // Orange for edit
    text: "#ffffff",
    hover: "#ea580c",
    focus: "#fb923c",
  },
  delete: {
    bg: "#ef4444", // Red for delete
    text: "#ffffff",
    hover: "#dc2626",
    focus: "#f87171",
  },
  view: {
    bg: "#3b82f6", // Blue for view
    text: "#ffffff",
    hover: "#2563eb",
    focus: "#60a5fa",
  },

  // Status colors
  success: {
    bg: "#10b981",
    text: "#ffffff",
    hover: "#059669",
    focus: "#34d399",
  },
  warning: {
    bg: "#f59e0b",
    text: "#ffffff",
    hover: "#d97706",
    focus: "#fbbf24",
  },
  error: {
    bg: "#ef4444",
    text: "#ffffff",
    hover: "#dc2626",
    focus: "#f87171",
  },
} as const;
