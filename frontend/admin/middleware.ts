import { NextResponse, NextRequest } from "next/server";

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export async function middleware(req: NextRequest) {
  const { pathname, basePath, origin } = req.nextUrl;

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  // Allow public files & assets (no auth)
  if (
    pathname.startsWith("/_next/static") ||
    pathname.startsWith("/_next/image") ||
    pathname.startsWith("/images") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Login page
  if (pathname === "/login") {
    if (accessToken && !isTokenExpired(accessToken)) {
      // Redirect logged-in user to basePath root (home/dashboard)
      return NextResponse.redirect(new URL(basePath || "/", origin));
    }
    return NextResponse.next();
  }

  // Logout page
  if (pathname === "/logout") {
    return NextResponse.next();
  }

  // Require valid token for other routes
  if (!accessToken || isTokenExpired(accessToken)) {
    if (refreshToken) {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const response = NextResponse.next();

        // Set cookies with basePath in path
        response.cookies.set("accessToken", data.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: basePath ? `${basePath}/` : "/",
        });
        response.cookies.set("refreshToken", data.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: basePath ? `${basePath}/` : "/",
        });

        return response;
      } else {
        // Refresh token invalid - redirect to login
        return NextResponse.redirect(new URL(`${basePath}/login`, origin));
      }
    } else {
      // No refresh token - redirect to login
      return NextResponse.redirect(new URL(`${basePath}/login`, origin));
    }
  }

  // Token is valid here - role based check
  const role = getRoleFromToken(accessToken)?.toLowerCase() ?? "";

  const isAllowed =
    role.startsWith("smo") ||
    role === "administrator" ||
    role === "staff" ||
    role === "mentee" ||
    role === "mentor";

  if (!isAllowed) {
    return NextResponse.redirect(new URL(`${basePath}/logout`, origin));
  }

  // SMO user restrictions
  if (
    role.startsWith("smo") &&
    pathname !== "/checkin" &&
    pathname !== "/logout"
  ) {
    return NextResponse.redirect(new URL(`${basePath}/checkin`, origin));
  }

  return NextResponse.next();
}

function isTokenExpired(token: string): boolean {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    const exp = payload.exp;
    const currentTime = Math.floor(Date.now() / 1000);

    return exp < currentTime;
  } catch (err) {
    console.error("Invalid token format", err);
    return true;
  }
}

function getRoleFromToken(token: string): string | null {
  try {
    const [, payloadBase64] = token.split(".");
    const payload = JSON.parse(atob(payloadBase64));
    return payload.role || null;
  } catch {
    return null;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|images|favicon.ico).*)"],
};
