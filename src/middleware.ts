import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REDIRECTS: Record<string, string> = {
  "/my-activity": "/account/activity",
  "/edit-profile": "/account/profile",
  "/wallet": "/account",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const exact = REDIRECTS[pathname];
  if (exact) {
    return NextResponse.redirect(new URL(exact, request.url));
  }

  const transportRequest = pathname.match(/^\/transport-requests\/(\d+)\/?$/i);
  if (transportRequest) {
    return NextResponse.redirect(
      new URL(`/transport/requests/${transportRequest[1]}`, request.url),
    );
  }

  const transportProvider = pathname.match(/^\/transport\/provider\/(\d+)\/?$/i);
  if (transportProvider) {
    return NextResponse.redirect(
      new URL(`/transport/inbox/${transportProvider[1]}`, request.url),
    );
  }

  const listing = pathname.match(/^\/listings\/(\d+)\/?$/i);
  if (listing) {
    return NextResponse.redirect(new URL(`/direct/${listing[1]}/buy`, request.url));
  }

  if (pathname.match(/^\/direct\/orders\/?$/i)) {
    return NextResponse.redirect(new URL("/orders/direct", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/my-activity",
    "/edit-profile",
    "/wallet",
    "/transport-requests/:path*",
    "/transport/provider/:path*",
    "/listings/:path*",
    "/direct/orders",
  ],
};
