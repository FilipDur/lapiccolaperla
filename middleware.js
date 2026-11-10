import { next, rewrite } from "@vercel/functions";
import { getRedirectUrl } from "./src/restaurant/seo.js";

export const config = { matcher: ["/((?!api/|assets/|images/|src/|node_modules/|_vercel/|@).*)"] };

export default function middleware(request) {
  const url = new URL(request.url);
  if (/^\/google260a340fd746cdf3(?:\.html)?$/.test(url.pathname)) return next();
  if (/^\/admin(?:\.html)?\/?$/.test(url.pathname)) {
    if (url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
      return Response.redirect(url, 308);
    }
    return next();
  }
  const redirect = getRedirectUrl(url);
  if (redirect) return Response.redirect(new URL(redirect, url.origin), 308);
  // Unknown HTML documents need the same localized 404 as extensionless pages.
  if (url.pathname.includes(".") && !/\.html\/?$/.test(url.pathname) && url.pathname !== "/sitemap.xml") return next();
  if (!["GET", "HEAD"].includes(request.method)) return next();
  const target = new URL("/api/public-page", url.origin);
  target.searchParams.set("url", url.pathname + url.search);
  return rewrite(target);
}
