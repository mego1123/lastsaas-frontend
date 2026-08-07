// Import Dependencies
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import DOMPurify from "dompurify";

// Local Imports
import { Spinner } from "@/components/ui/Spinner";
import { brandingApi } from "@/utils/api";
import type { CustomPage as CustomPageType } from "@/@types/lastsaas";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/public/CustomPage.tsx`.
// ----------------------------------------------------------------------

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<CustomPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    brandingApi
      .getPublicPage(slug)
      .then(setPage)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    if (!page) return;
    const prevTitle = document.title;
    if (page.title) document.title = page.title;

    let metaDesc = document.querySelector(
      'meta[name="description"]',
    ) as HTMLMetaElement | null;
    if (page.metaDescription) {
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content = page.metaDescription;
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && page.metaDescription) metaDesc.content = "";
    };
  }, [page]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Spinner className="h-8 w-8" color="primary" />
      </div>
    );
  }

  if (notFound || !page) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold">404</h1>
          <p className="text-gray-500 dark:text-dark-300">Page not found</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-background"
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(page.htmlBody ?? ""),
      }}
    />
  );
}
