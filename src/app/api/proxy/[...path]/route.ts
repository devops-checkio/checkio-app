import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, "GET");
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, "POST");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, "PUT");
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, "DELETE");
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, "PATCH");
}

export async function OPTIONS(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  return handleRequest(request, resolvedParams.path, "OPTIONS");
}

async function handleRequest(
  request: NextRequest,
  pathSegments: string[],
  method: string
) {
  try {
    const requestPath = pathSegments.join("/");
    
    // Get cookies using Next.js cookies() API
    const cookieStore = await cookies();
    const allCookiesFromStore = cookieStore.getAll();
    
    const apiUrl = process.env.API_URL;
    if (!apiUrl) {
      return NextResponse.json(
        { error: "API URL not configured" },
        { status: 500 }
      );
    }

    const url = `${apiUrl}/${requestPath}`;

    // Get the full URL with query parameters
    const fullUrl = new URL(request.url);
    const targetUrl = new URL(url);

    // Copy all query parameters from the original request
    fullUrl.searchParams.forEach((value, key) => {
      // Handle multiple values for the same parameter
      const existingValues = targetUrl.searchParams.getAll(key);
      if (existingValues.length > 0) {
        // If parameter already exists, append the new value
        targetUrl.searchParams.append(key, value);
      } else {
        // If parameter doesn't exist, set it
        targetUrl.searchParams.set(key, value);
      }
    });
    // Extract subdomain from hostname
    const hostname = fullUrl.hostname;
    const parts = hostname.split(".");
    const subdomain = parts.length > 2 ? parts[0] : "";

    // Prepare headers - start with basic ones
    const headers: Record<string, string> = {
      "x-client": "web",
    };
    
    // Don't set Content-Type for GET requests or file downloads
    const isGetRequest = method === "GET";
    const isFileDownloadPath = requestPath.includes("/files/storage/");
    if (!isGetRequest && !isFileDownloadPath) {
      headers["Content-Type"] = "application/json";
    }

    if (process.env.URL_SUBDOMAIN) {
      headers["x-tenant-id"] = process.env.URL_SUBDOMAIN;
    } else if (subdomain && !process.env.URL_SUBDOMAIN) {
      headers["x-tenant-id"] = subdomain;
    }

    // Get cookies FIRST before copying other headers
    const cookieHeader = request.headers.get("cookie");
    const cookiesFromStore = allCookiesFromStore
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    let finalCookieHeader = cookieHeader || cookiesFromStore || "";
    
    
    // Forward all headers from the original request (EXCEPT cookie, we'll set it manually)
    request.headers.forEach((value, key) => {
      // Skip headers that shouldn't be forwarded, INCLUDING cookie (we'll set it manually)
      if (
        !["host", "connection", "content-length", "cookie"].includes(key.toLowerCase())
      ) {
        headers[key] = value;
      }
    });

    // Ensure Content-Type is application/json for JSON requests with body
    const contentType = request.headers.get("content-type") || "";
    if (
      method !== "GET" &&
      method !== "OPTIONS" &&
      contentType.includes("application/json")
    ) {
      headers["Content-Type"] = "application/json";
    }

    // Set cookies MANUALLY after copying other headers - CRITICAL for authentication
    if (finalCookieHeader) {
      // Use "Cookie" with capital C for axios server-side requests (Express expects this)
      headers["Cookie"] = finalCookieHeader;
      // Also set lowercase for compatibility
      headers["cookie"] = finalCookieHeader;
      
      // Extract auth_token from cookies and also set it in Authorization header as fallback
      // EXCEPT for trigger routes (e.g. overtime-trigger, assistance-trigger) where the
      // frontend sends a one-time JWT in Authorization - we must not overwrite it with session cookie
      const isTriggerRoute = requestPath.includes("overtime-trigger") || requestPath.includes("assistance-trigger");
      const authTokenMatch = finalCookieHeader.match(/auth_token=([^;]+)/);
      if (authTokenMatch && authTokenMatch[1] && !isTriggerRoute) {
        const authToken = authTokenMatch[1];
        headers["Authorization"] = `Bearer ${authToken}`;
      }
    }
    
    // Ensure x-client is set for web clients (required by AuthGuard)
    if (!headers["x-client"]) {
      headers["x-client"] = "web";
    }

    // Prepare request options
    const requestOptions: RequestInit = {
      method,
      headers,
    };

    // Add body for non-GET requests
    if (method !== "GET" && method !== "OPTIONS") {
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        try {
          const body = await request.json();
          if (body && Object.keys(body).length > 0) {
            requestOptions.body = JSON.stringify(body);
          }
        } catch (error) {}
      } else if (contentType.includes("multipart/form-data")) {
        // Handle form data
        const formData = await request.formData();
        requestOptions.body = formData;
        // Remove Content-Type header to let the browser set it with boundary
        delete headers["Content-Type"];
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        // Handle URL encoded form data
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      } else {
        // Handle other content types (text, binary, etc.)
        const body = await request.text();
        if (body) {
          requestOptions.body = body;
        }
      }
    }

    try {
      // Check if this is a file download request
      const isFileDownload =
        requestPath.includes("/files/storage/") ||
        requestPath.includes("/download") ||
        request.headers.get("accept")?.includes("application/octet-stream") ||
        request.headers.get("accept")?.includes("application/vnd.openxmlformats");


      const response = await axios({
        method: method.toLowerCase(),
        url: targetUrl.toString(),
        headers: headers,
        data: requestOptions.body,
        validateStatus: () => true,
        withCredentials: true,
        responseType: isFileDownload ? "arraybuffer" : "json",
        maxRedirects: 5,
      });

      // 204/304/205 must not include a body; NextResponse rejects a body with 204.
      if (
        response.status === 204 ||
        response.status === 304 ||
        response.status === 205
      ) {
        const noContentHeaders = new Headers();
        const setCookie204 = response.headers["set-cookie"];
        if (setCookie204) {
          if (Array.isArray(setCookie204)) {
            setCookie204.forEach((cookie) => {
              noContentHeaders.append("set-cookie", cookie);
            });
          } else {
            noContentHeaders.set("set-cookie", setCookie204);
          }
        }
        const cors204 = response.headers["access-control-allow-origin"];
        if (cors204) {
          noContentHeaders.set("Access-Control-Allow-Origin", cors204);
        }
        return new NextResponse(null, {
          status: response.status,
          headers: noContentHeaders,
        });
      }

      // Check if response is binary (blob/file)
      const contentType = response.headers["content-type"] || "";
      const isBinary =
        contentType.includes("application/octet-stream") ||
        contentType.includes("application/vnd.openxmlformats") ||
        contentType.includes("application/pdf") ||
        contentType.includes("image/") ||
        contentType.includes("video/") ||
        contentType.includes("audio/") ||
        response.config?.responseType === "arraybuffer" ||
        Buffer.isBuffer(response.data) ||
        response.data instanceof ArrayBuffer;

      let responseData: string | ArrayBuffer | Buffer;
      const responseHeaders = new Headers();

      if (isBinary) {
        // Handle binary response
        let binaryData: Buffer;
        if (Buffer.isBuffer(response.data)) {
          binaryData = response.data;
        } else if (response.data instanceof ArrayBuffer) {
          binaryData = Buffer.from(response.data);
        } else if (response.data instanceof Uint8Array) {
          binaryData = Buffer.from(response.data);
        } else if (typeof response.data === "string") {
          binaryData = Buffer.from(response.data, "binary");
        } else {
          console.error("Unexpected binary data type:", typeof response.data);
          binaryData = Buffer.from(JSON.stringify(response.data));
        }
        responseData = binaryData;
        responseHeaders.set("Content-Type", contentType || "application/octet-stream");
        
        // Copy Content-Disposition header if present
        const contentDisposition = response.headers["content-disposition"];
        if (contentDisposition) {
          responseHeaders.set("Content-Disposition", contentDisposition);
        }
      } else {
        // Handle JSON response
        responseData =
          typeof response.data === "string"
            ? response.data
            : JSON.stringify(response.data);
        responseHeaders.set("Content-Type", "application/json");
      }

      // Copy CORS headers from backend if they exist
      const corsOrigin = response.headers["access-control-allow-origin"];
      if (corsOrigin) {
        responseHeaders.set("Access-Control-Allow-Origin", corsOrigin);
      }

      // Copy cookies from backend response
      const setCookieHeader = response.headers["set-cookie"];
      if (setCookieHeader) {
        if (Array.isArray(setCookieHeader)) {
          setCookieHeader.forEach((cookie, index) => {
            responseHeaders.set(`set-cookie`, cookie);
          });
        } else {
          responseHeaders.set("set-cookie", setCookieHeader);
        }
      }

      // Also check for other cookie-related headers
      Object.keys(response.headers).forEach((key) => {
        if (key.toLowerCase().includes("cookie")) {
          const value = response.headers[key];
          if (value) {
            responseHeaders.set(key, value);
          }
        }
      });

      // Return the response
      if (isBinary) {
        return new NextResponse(responseData as BodyInit, {
          status: response.status,
          headers: responseHeaders,
        });
      } else {
        return new NextResponse(responseData as string, {
          status: response.status,
          headers: responseHeaders,
        });
      }
    } catch (error: unknown) {
      console.error("Proxy error:", error);
      const errorMessage = error instanceof Error ? error.message : "Backend request failed";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
