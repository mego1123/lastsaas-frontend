// Import Dependencies
import { useEffect, useState, ReactNode, useCallback } from "react";

// Local Imports
import { brandingApi } from "@/utils/api";
import type { BrandingConfig } from "@/@types/lastsaas";
import {
  BrandingProvider as BrandingContext,
  BrandingContextValue,
  defaultBranding,
} from "./context";

// ----------------------------------------------------------------------

export function BrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await brandingApi.get();
      setBranding(data);
    } catch {
      // Use defaults if branding endpoint fails
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value: BrandingContextValue = {
    branding,
    loaded,
    reload: load,
  };

  return <BrandingContext value={value}>{children}</BrandingContext>;
}
