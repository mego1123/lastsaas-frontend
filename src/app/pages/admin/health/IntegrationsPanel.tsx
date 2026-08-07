import { useState } from "react";
import {
  CircleStackIcon,
  CreditCardIcon,
  EnvelopeIcon,
  AdjustmentsHorizontalIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
  ArrowTopRightOnSquareIcon,
  ArrowLeftEndOnRectangleIcon,
  CodeBracketIcon,
  FingerPrintIcon,
  KeyIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import {
  Dialog,
  DialogPanel,
  DialogTitle,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import { adminApi } from "@/utils/api";
import type { IntegrationCheck } from "@/@types/lastsaas";

// ----------------------------------------------------------------------

const ICONS: Record<string, typeof CircleStackIcon> = {
  mongodb: CircleStackIcon,
  stripe: CreditCardIcon,
  resend: EnvelopeIcon,
  google_oauth: ArrowLeftEndOnRectangleIcon,
  github_oauth: CodeBracketIcon,
  microsoft_oauth: ArrowLeftEndOnRectangleIcon,
  webauthn: FingerPrintIcon,
  saml_sso: KeyIcon,
};

const LABELS: Record<string, string> = {
  mongodb: "MongoDB",
  stripe: "Stripe",
  resend: "Resend",
  google_oauth: "Google Login",
  github_oauth: "GitHub Login",
  microsoft_oauth: "Microsoft Login",
  webauthn: "Passkeys (WebAuthn)",
  saml_sso: "SSO / SAML",
};

const CALLS_24H_LABEL: Record<string, string> = {
  stripe: "API calls",
  resend: "Emails",
};

interface SetupHelpItem {
  title: string;
  steps: string[];
  links: { label: string; url: string }[];
}

function getSetupHelp(origin: string): Record<string, SetupHelpItem> {
  const hostname = new URL(origin).hostname;
  return {
    stripe: {
      title: "Stripe Setup",
      steps: [
        "Create a Stripe account at stripe.com if you don't have one.",
        "Go to Dashboard > Developers > API keys and copy your Secret key and Publishable key.",
        `Set up a webhook endpoint at Dashboard > Developers > Webhooks pointing to ${origin}/api/billing/webhook. Choose "Your Account" (not Connected accounts) and the latest API version.`,
        'Subscribe the webhook to these events: checkout.session.completed, invoice.paid, invoice.payment_failed, customer.subscription.updated, customer.subscription.deleted',
        "Copy the webhook signing secret.",
        "Enable the Customer Portal at Dashboard > Settings > Billing > Portal.",
        "Add the following environment variables. For local development, create a .env file in the project root (this is auto-loaded on startup). For Fly.io, use: flyctl secrets set STRIPE_SECRET_KEY=sk_... STRIPE_PUBLISHABLE_KEY=pk_... STRIPE_WEBHOOK_SECRET=whsec_...",
        "The YAML config files (config/dev.yaml, config/prod.yaml) already reference these variables via ${STRIPE_SECRET_KEY} syntax. Do not edit the YAML files — just set the environment variables.",
        "Redeploy or restart the server for the changes to take effect.",
      ],
      links: [
        { label: "Stripe Dashboard", url: "https://dashboard.stripe.com" },
        { label: "API Keys", url: "https://dashboard.stripe.com/apikeys" },
        { label: "Webhooks", url: "https://dashboard.stripe.com/webhooks" },
        {
          label: "Customer Portal Settings",
          url: "https://dashboard.stripe.com/settings/billing/portal",
        },
      ],
    },
    resend: {
      title: "Resend Setup",
      steps: [
        "Create a Resend account at resend.com.",
        "Go to API Keys and create a new key with sending access.",
        "Add and verify your sending domain under Domains (or use the default onboarding domain for testing).",
        `Add the following environment variables. For local development, create a .env file in the project root (this is auto-loaded on startup). For Fly.io, use: flyctl secrets set RESEND_API_KEY=re_... FROM_EMAIL=noreply@${hostname} FROM_NAME=YourApp`,
        "The YAML config files (config/dev.yaml, config/prod.yaml) already reference these variables via ${RESEND_API_KEY} syntax. Do not edit the YAML files — just set the environment variables.",
        "Redeploy or restart the server for the changes to take effect.",
      ],
      links: [
        { label: "Resend Dashboard", url: "https://resend.com" },
        { label: "Resend API Keys", url: "https://resend.com/api-keys" },
        { label: "Resend Domains", url: "https://resend.com/domains" },
      ],
    },
    google_oauth: {
      title: "Google Login Setup",
      steps: [
        "Go to the Google Cloud Console and create a project (or select an existing one).",
        'Navigate to APIs & Services > OAuth consent screen. Choose "External" user type, fill in the app name and support email, and publish the consent screen.',
        'Go to APIs & Services > Credentials and click "Create Credentials" > "OAuth client ID". Select "Web application" as the application type.',
        `Add your frontend URL (${origin}) to "Authorized JavaScript origins".`,
        `Add your backend callback URL to "Authorized redirect URIs": ${origin}/api/auth/google/callback`,
        "Copy the Client ID and Client Secret from the credentials page.",
        `Add the following environment variables. For local development, create a .env file in the project root (this is auto-loaded on startup). For Fly.io, use: flyctl secrets set GOOGLE_CLIENT_ID=... GOOGLE_CLIENT_SECRET=... GOOGLE_REDIRECT_URL=${origin}/api/auth/google/callback`,
        "The YAML config files (config/dev.yaml, config/prod.yaml) already reference these variables via ${GOOGLE_CLIENT_ID} syntax. Do not edit the YAML files — just set the environment variables.",
        "Redeploy or restart the server for the changes to take effect.",
      ],
      links: [
        {
          label: "Google Cloud Console",
          url: "https://console.cloud.google.com",
        },
        {
          label: "OAuth Consent Screen",
          url: "https://console.cloud.google.com/apis/credentials/consent",
        },
        {
          label: "Credentials",
          url: "https://console.cloud.google.com/apis/credentials",
        },
      ],
    },
    github_oauth: {
      title: "GitHub Login Setup",
      steps: [
        'Go to GitHub Settings > Developer settings > OAuth Apps and click "New OAuth App".',
        `Set the Homepage URL to ${origin}`,
        `Set the Authorization callback URL to ${origin}/api/auth/github/callback`,
        "Copy the Client ID and generate a Client Secret.",
        `Add the following environment variables: GITHUB_CLIENT_ID=... GITHUB_CLIENT_SECRET=... GITHUB_REDIRECT_URL=${origin}/api/auth/github/callback`,
        "Redeploy or restart the server for the changes to take effect.",
      ],
      links: [
        {
          label: "GitHub OAuth Apps",
          url: "https://github.com/settings/developers",
        },
      ],
    },
    microsoft_oauth: {
      title: "Microsoft Login Setup",
      steps: [
        'Go to the Azure Portal > App registrations and click "New registration".',
        `Set the Redirect URI to ${origin}/api/auth/microsoft/callback (Web platform).`,
        'Under "Certificates & secrets", create a new client secret and copy its value.',
        "Copy the Application (client) ID from the Overview page.",
        `Add the following environment variables: MICROSOFT_CLIENT_ID=... MICROSOFT_CLIENT_SECRET=... MICROSOFT_REDIRECT_URL=${origin}/api/auth/microsoft/callback`,
        "Redeploy or restart the server for the changes to take effect.",
      ],
      links: [
        {
          label: "Azure App Registrations",
          url: "https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade",
        },
      ],
    },
  };
}

function timeAgo(dateStr: string): string {
  if (!dateStr) return "Never";
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function SetupModal({
  name,
  setupHelp,
  onClose,
}: {
  name: string;
  setupHelp: Record<string, SetupHelpItem>;
  onClose: () => void;
}) {
  const help = setupHelp[name];
  if (!help) return null;

  return (
    <Transition
      appear
      show
      as={Dialog}
      onClose={onClose}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
    >
      <TransitionChild
        as="div"
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
      />
      <TransitionChild
        as={DialogPanel}
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        className="scrollbar-sm relative max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white shadow-soft transition-all dark:bg-dark-700"
      >
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-dark-600">
          <DialogTitle className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            {help.title}
          </DialogTitle>
          <Button
            isIcon
            variant="flat"
            color="neutral"
            className="size-8"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="size-5" />
          </Button>
        </div>
        <div className="space-y-4 p-6">
          <ol className="space-y-3">
            {help.steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3 text-sm text-gray-700 dark:text-dark-200"
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-xs font-medium text-primary-500 dark:text-primary-400">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
          {help.links.length > 0 && (
            <div className="border-t border-gray-200 pt-4 dark:border-dark-600">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
                Useful Links
              </p>
              <div className="flex flex-wrap gap-2">
                {help.links.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs text-gray-700 transition-colors hover:text-gray-900 dark:border-dark-600 dark:bg-dark-600 dark:text-dark-200 dark:hover:text-dark-50"
                  >
                    <ArrowTopRightOnSquareIcon className="size-3" />
                    {link.label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </TransitionChild>
    </Transition>
  );
}

function SendTestEmailModal({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    error?: string;
  } | null>(null);

  const handleSend = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await adminApi.sendTestEmail(email.trim());
      setResult({ success: !!res.success, error: res.error });
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to send test email";
      setResult({ success: false, error: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition
      appear
      show
      as={Dialog}
      onClose={onClose}
      className="fixed inset-0 z-100 flex flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-5"
    >
      <TransitionChild
        as="div"
        enter="ease-out duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
        className="absolute inset-0 bg-gray-900/50 transition-opacity dark:bg-black/40"
      />
      <TransitionChild
        as={DialogPanel}
        enter="ease-out duration-300"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-200"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-soft transition-all dark:bg-dark-700"
      >
        <div className="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-dark-600">
          <DialogTitle className="text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
            Send Test Email
          </DialogTitle>
          <Button
            isIcon
            variant="flat"
            color="neutral"
            className="size-8"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon className="size-5" />
          </Button>
        </div>
        <div className="mt-4 space-y-4">
          <Input
            label="Recipient email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading) void handleSend();
            }}
            placeholder="you@example.com"
            disabled={loading}
            autoFocus
          />
          <Button
            color="success"
            className="h-10 w-full"
            onClick={handleSend}
            disabled={loading || !email.trim()}
          >
            <PaperAirplaneIcon className="size-4" />
            {loading ? "Sending..." : "Send Test Email"}
          </Button>
          {result && (
            <div
              className={`rounded-lg p-3 text-sm ${
                result.success
                  ? "border border-success/20 bg-success/5 text-success dark:text-success-light"
                  : "border border-error/20 bg-error/5 text-error"
              }`}
            >
              {result.success
                ? "Test email sent successfully. Check your inbox."
                : `Failed to send: ${result.error}`}
            </div>
          )}
        </div>
      </TransitionChild>
    </Transition>
  );
}

// ----------------------------------------------------------------------

export default function IntegrationsPanel({
  integrations,
}: {
  integrations: IntegrationCheck[];
}) {
  const [helpFor, setHelpFor] = useState<string | null>(null);
  const [showTestEmail, setShowTestEmail] = useState(false);
  const setupHelp = getSetupHelp(window.location.origin);

  if (integrations.length === 0) return null;

  return (
    <div id="integrations">
      <div className="mb-4 flex items-center gap-2">
        <AdjustmentsHorizontalIcon className="size-4 text-gray-400 dark:text-dark-300" />
        <h2 className="text-sm font-medium uppercase tracking-wide text-gray-500 dark:text-dark-300">
          Integrations
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {integrations.map((check) => {
          const Icon = ICONS[check.name] || AdjustmentsHorizontalIcon;
          const label = LABELS[check.name] || check.name;
          const isHealthy = check.status === "healthy";
          const isNotConfigured = check.status === "not_configured";
          const isUnhealthy = check.status === "unhealthy";
          const hasHelp = isNotConfigured && !!setupHelp[check.name];
          const callsLabel = CALLS_24H_LABEL[check.name];
          const canTestEmail = check.name === "resend" && isHealthy;

          return (
            <Card
              key={check.name}
              className={`p-5 ${
                isUnhealthy
                  ? "border-error/30 dark:border-error-lighter/30"
                  : isNotConfigured
                    ? "border-warning/20"
                    : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex size-10 items-center justify-center rounded-xl ${
                    isHealthy
                      ? "bg-success/15"
                      : isUnhealthy
                        ? "bg-error/15"
                        : "bg-warning/10"
                  }`}
                >
                  <Icon
                    className={`size-5 ${
                      isHealthy
                        ? "text-success dark:text-success-light"
                        : isUnhealthy
                          ? "text-error"
                          : "text-warning"
                    }`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-dark-50">
                      {label}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
                        isHealthy
                          ? "bg-success/15 text-success dark:text-success-light"
                          : isUnhealthy
                            ? "bg-error/15 text-error"
                            : "bg-warning/10 text-warning"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isHealthy
                            ? "bg-success dark:bg-success-light"
                            : isUnhealthy
                              ? "bg-error"
                              : "bg-warning"
                        }`}
                      />
                      {isNotConfigured
                        ? "Not Configured"
                        : isHealthy
                          ? "Healthy"
                          : "Unhealthy"}
                    </span>
                  </div>
                  {!isNotConfigured && (
                    <p
                      className={`mt-1 text-xs ${
                        isUnhealthy
                          ? "text-error"
                          : "text-gray-400 dark:text-dark-400"
                      }`}
                    >
                      {check.message}
                    </p>
                  )}
                </div>
              </div>
              {!isNotConfigured && check.lastCheck && (
                <div className="mt-3 space-y-1 text-xs text-gray-500 dark:text-dark-300">
                  <div className="flex justify-between">
                    <span>Last check</span>
                    <span className="text-gray-700 dark:text-dark-200">
                      {timeAgo(check.lastCheck)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Response</span>
                    <span className="text-gray-700 dark:text-dark-200">
                      {check.responseMs}ms
                    </span>
                  </div>
                  {callsLabel && (
                    <div className="flex justify-between">
                      <span>{callsLabel} (24h)</span>
                      <span className="text-gray-700 dark:text-dark-200">
                        {check.calls24h.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              )}
              {hasHelp && (
                <Button
                  variant="outlined"
                  color="warning"
                  className="mt-3 h-8 text-xs"
                  onClick={() => setHelpFor(check.name)}
                >
                  <QuestionMarkCircleIcon className="size-3.5" />
                  Setup Help
                </Button>
              )}
              {canTestEmail && (
                <Button
                  variant="outlined"
                  color="success"
                  className="mt-3 h-8 text-xs"
                  onClick={() => setShowTestEmail(true)}
                >
                  <PaperAirplaneIcon className="size-3.5" />
                  Send Test Email
                </Button>
              )}
            </Card>
          );
        })}
      </div>

      {helpFor && (
        <SetupModal
          name={helpFor}
          setupHelp={setupHelp}
          onClose={() => setHelpFor(null)}
        />
      )}
      {showTestEmail && (
        <SendTestEmailModal onClose={() => setShowTestEmail(false)} />
      )}
    </div>
  );
}
