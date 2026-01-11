
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // ログインページへのアクセスで既にログインしている場合
    if (pathname.startsWith("/login") && isLoggedIn) {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }

    // APIルートやパブリックなファイル以外で、未ログインの場合
    if (!isLoggedIn && !pathname.startsWith("/login") && !pathname.startsWith("/api/auth")) {
        return NextResponse.redirect(new URL("/login", req.nextUrl));
    }
});

export const config = {
    matcher: ["/dashboard/:path*", "/login", "/api/:path*"],
};
