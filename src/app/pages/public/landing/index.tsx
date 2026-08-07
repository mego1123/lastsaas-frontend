// Import Dependencies
import { useEffect } from "react";
import { Navigate } from "react-router";
import DOMPurify from "dompurify";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/public/LandingPage.tsx`.
// ----------------------------------------------------------------------

export default function LandingPage() {
  const { branding, loaded } = useBranding();
  const { isAuthenticated } = useAuthContext();

  useEffect(() => {
    if (!loaded || !branding.landingEnabled) return;
    const prevTitle = document.title;
    if (branding.landingTitle) document.title = branding.landingTitle;

    let metaDesc = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    if (branding.landingMeta) {
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = branding.landingMeta;
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && branding.landingMeta) metaDesc.content = "";
    };
  }, [
    loaded,
    branding.landingEnabled,
    branding.landingTitle,
    branding.landingMeta,
  ]);

  // If user is logged in, go to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // If landing page is not enabled, go to login
  if (loaded && !branding.landingEnabled) {
    return <Navigate to="/login" replace />;
  }

  if (!loaded) return null;

  return (
    <div
      className="min-h-screen bg-background"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(branding.landingHtml ?? ""),
      }}
    />
  );
}
