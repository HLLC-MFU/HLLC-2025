import { NextResponse, NextRequest } from "next/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ Exclude /login route
  if (pathname === `${req.nextUrl.basePath}/login`) {
    return NextResponse.next();
  }

  const accessToken = req.cookies.get("accessToken")?.value;
  const refreshToken = req.cookies.get("refreshToken")?.value;

  if (!accessToken) {
    return NextResponse.redirect(new URL(`${req.nextUrl.basePath}/login`, req.url));
  }

  if (isTokenExpired(accessToken)) {
    if (refreshToken) {
      const res = await fetch(`${API_BASE_URL}/auth/admin/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (res.ok) {
        const data = await res.json();
        const response = NextResponse.next();

        response.cookies.set("accessToken", data.data.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });
        response.cookies.set("refreshToken", data.data.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          path: "/",
        });

        return response;
      } else {
        return NextResponse.redirect(new URL(`${req.nextUrl.basePath}/login`, req.url));
      }
    } else {
      return NextResponse.redirect(new URL(`${req.nextUrl.basePath}/login`, req.url));
    }
  }

  // ✅ Decode access token to get role
  const role = getRoleFromToken(accessToken);

  // 🛑 Restrict SMO IT to /checkin only
  if ((role?.toLowerCase() ?? "").startsWith("smo") && pathname !== "/checkin" && pathname !== "/logout") {
    return NextResponse.redirect(new URL(`/checkin`, req.url));
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
  matcher: [
    "/((?!_next/static|_next/image|images|favicon.ico|login|logout).*)",
  ],
};
