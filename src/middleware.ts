// src/middleware.ts
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas públicas (sem autenticação)
const PUBLIC_ROUTES = ["/login", "/api/auth"];

export default auth(function middleware(req: NextRequest & { auth: any }) {
  const { pathname } = req.nextUrl;

  // Permite rotas públicas
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Redireciona para login se não autenticado
  if (!req.auth) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?callbackUrl=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(loginUrl);
  }

  const role = req.auth?.user?.role;

  // Proteção de rotas admin
  if (pathname.startsWith("/admin") && role !== "ADMIN") {
    const dashUrl = req.nextUrl.clone();
    dashUrl.pathname = "/dashboard";
    dashUrl.search = "";
    return NextResponse.redirect(dashUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
