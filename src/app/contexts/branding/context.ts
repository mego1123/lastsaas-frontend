import { BrandingConfig } from "@/@types/lastsaas";
import { createSafeContext } from "@/utils/createSafeContext";

export interface BrandingContextValue {
  branding: BrandingConfig;
  loaded: boolean;
  reload: () => Promise<void>;
}

const defaultBranding: BrandingConfig = {
  appName: "LastSaaS",
  tagline: "",
  logoMode: "text",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "",
  accentColor: "",
  backgroundColor: "",
  surfaceColor: "",
  textColor: "",
  fontFamily: "",
  headingFont: "",
  landingEnabled: false,
  landingTitle: "",
  landingMeta: "",
  landingHtml: "",
  dashboardHtml: "",
  loginHeading: "",
  loginSubtext: "",
  signupHeading: "",
  signupSubtext: "",
  customCss: "",
  headHtml: "",
  ogImageUrl: "",
  analyticsSnippet: "",
};

export const [BrandingProvider, useBranding] =
  createSafeContext<BrandingContextValue>(
    "useBranding must be used within a BrandingProvider",
  );

export { defaultBranding };
