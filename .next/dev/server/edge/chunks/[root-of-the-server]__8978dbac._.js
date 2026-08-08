(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push(["chunks/[root-of-the-server]__8978dbac._.js",
"[externals]/node:buffer [external] (node:buffer, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:buffer", () => require("node:buffer"));

module.exports = mod;
}),
"[externals]/node:async_hooks [external] (node:async_hooks, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

module.exports = mod;
}),
"[project]/src/middleware.ts [middleware-edge] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "config",
    ()=>config,
    "middleware",
    ()=>middleware
]);
/**
 * Next.js middleware for SSO authentication.
 *
 * In production, oauth2-proxy sits in front of the app and authenticates users
 * via OIDC/SAML. It passes the authenticated user as the `X-Forwarded-User`
 * header. This middleware reads that header and sets it as a cookie/env var
 * for the audit logger.
 *
 * If SSO is disabled (GRAPHIFY_SSO_ENABLED=false), all requests are allowed
 * and the user is set to "anonymous".
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$api$2f$server$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/api/server.js [middleware-edge] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/esm/server/web/exports/index.js [middleware-edge] (ecmascript)");
;
function middleware(request) {
    const ssoEnabled = process.env.GRAPHIFY_SSO_ENABLED === 'true';
    // Read the SSO user from the oauth2-proxy header
    const ssoUser = request.headers.get('x-forwarded-user') || '';
    const ssoEmail = request.headers.get('x-forwarded-email') || '';
    const ssoGroups = request.headers.get('x-forwarded-groups') || '';
    if (ssoEnabled && !ssoUser) {
        // SSO is enabled but no user header — redirect to oauth2-proxy login
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].redirect(new URL('/oauth2/start', request.url));
    }
    // Set the user info in a response cookie so client-side code can access it
    const response = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$esm$2f$server$2f$web$2f$exports$2f$index$2e$js__$5b$middleware$2d$edge$5d$__$28$ecmascript$29$__["NextResponse"].next();
    if (ssoUser) {
        response.cookies.set('graphify-user', ssoUser, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            path: '/'
        });
        if (ssoEmail) {
            response.cookies.set('graphify-email', ssoEmail, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                path: '/'
            });
        }
    }
    return response;
}
const config = {
    matcher: [
        /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (*.json, *.md, *.html)
     */ '/((?!_next/static|_next/image|favicon.ico|.*\\.json$|.*\\.md$|.*\\.html$).*)'
    ]
};
}),
]);

//# sourceMappingURL=%5Broot-of-the-server%5D__8978dbac._.js.map