import { NextResponse } from "next/server";

interface SiteConfig {
  logo: string;
  inspectorLogo: string;
  name?: string;
  theme?: {
    primary: string;
    secondary: string;
  };
}

const siteConfigs: Record<string, SiteConfig> = {
  default: {
    logo: "/logos/logo.svg",
    inspectorLogo: "/logos/inspector.png",
    name: "CheckIO",
    theme: {
      primary: "#1890ff",
      secondary: "#52c41a",
    },
  },
  empresa1: {
    logo: "/logos/empresa1-logo.svg",
    inspectorLogo: "/logos/empresa1-inspector.png",
    name: "Empresa 1",
    theme: {
      primary: "#f5222d",
      secondary: "#fa8c16",
    },
  },
  // Puedes agregar más configuraciones aquí
};

export async function GET(request: Request) {
  try {
    // Obtener el hostname de la request
    const url = new URL(request.url);
    const hostname = url.hostname;
    const subdomain = hostname.split(".")[0];

    // Obtener la configuración correspondiente o usar la default
    const config = siteConfigs[subdomain] || siteConfigs.default;

    return NextResponse.json(config);
  } catch (error) {
    return NextResponse.json(
      { error: "Error getting site configuration" },
      { status: 500 }
    );
  }
}
