// Import Dependencies
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { EnvelopeIcon, FingerPrintIcon } from "@heroicons/react/24/outline";
import {
  ArrowRightOnRectangleIcon as ArrowRightOnRectangleIconSolid,
  EnvelopeIcon as EnvelopeIconSolid,
  KeyIcon as KeyIconSolid,
} from "@heroicons/react/24/solid";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";
import { authApi } from "@/utils/api";
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "@/configs/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// ----------------------------------------------------------------------

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
    </svg>
  );
}

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .5C5.37.5 0 5.78 0 12.292c0 5.211 3.438 9.63 8.205 11.188.6.111.82-.254.82-.567 0-.28-.01-1.022-.015-2.005-3.338.711-4.042-1.582-4.042-1.582-.546-1.361-1.335-1.725-1.335-1.725-1.087-.731.084-.716.084-.716 1.205.082 1.838 1.215 1.838 1.215 1.07 1.803 2.809 1.282 3.495.981.108-.763.417-1.282.76-1.577-2.665-.295-5.466-1.309-5.466-5.827 0-1.287.465-2.339 1.235-3.164-.135-.298-.54-1.497.105-3.121 0 0 1.005-.316 3.3 1.209.96-.262 1.98-.392 3-.398 1.02.006 2.04.136 3 .398 2.28-1.525 3.285-1.209 3.285-1.209.645 1.624.24 2.823.12 3.121.765.825 1.23 1.877 1.23 3.164 0 4.53-2.805 5.527-5.475 5.817.42.354.81 1.077.81 2.182 0 1.578-.015 2.846-.015 3.229 0 .309.21.678.825.561C20.565 21.917 24 17.495 24 12.292 24 5.78 18.627.5 12 .5z" />
    </svg>
  );
}

// ----------------------------------------------------------------------

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, mfaPending, completeMfaChallenge, clearMfaPending } =
    useAuthContext();
  const { branding } = useBranding();
  const [form, setForm] = useState({ email: "", password: "" });
  const [mfaCode, setMfaCode] = useState("");
  const [magicLinkEmail, setMagicLinkEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [showMagicLink, setShowMagicLink] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const providers = branding.authProviders;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      setError(msg || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaPending) return;
    setError("");
    setLoading(true);
    try {
      await completeMfaChallenge(mfaPending.mfaToken, mfaCode);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      setError(msg || "Invalid verification code");
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.requestMagicLink(magicLinkEmail);
      setMagicLinkSent(true);
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      setError(msg || "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const options = await authApi.passkeyLoginBegin();
      const credential = await navigator.credentials.get({
        publicKey: options,
      });
      if (!credential) throw new Error("No credential returned");
      const data = await authApi.passkeyLoginFinish(credential);
      localStorage.setItem(ACCESS_TOKEN_KEY, data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
      navigate("/dashboard");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        "Passkey authentication failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const heading = branding.loginHeading || "Welcome back";
  const subtext = branding.loginSubtext || "Sign in to your account";
  const logoUrl = branding.logoUrl;

  const hasOAuth =
    providers && (providers.google || providers.github || providers.microsoft);

  // MFA challenge screen
  if (mfaPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500">
              <KeyIconSolid className="size-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              Two-Factor Authentication
            </h1>
            <p className="mt-2 text-dark-400">
              Enter the code from your authenticator app or a recovery code
            </p>
          </div>

          <form
            onSubmit={handleMfaSubmit}
            className="space-y-4 rounded-2xl border border-dark-800 bg-dark-900/50 p-6 backdrop-blur-sm"
          >
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                Verification Code
              </label>
              <input
                type="text"
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-center text-lg tracking-widest text-white placeholder-dark-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="000000"
                maxLength={32}
              />
            </div>

            <Button
              type="submit"
              color="primary"
              variant="filled"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Verify"}
            </Button>

            <button
              type="button"
              onClick={clearMfaPending}
              className="w-full text-sm text-dark-400 transition-colors hover:text-dark-300"
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Magic link form
  if (showMagicLink) {
    if (magicLinkSent) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
          <div className="w-full max-w-md">
            <div className="rounded-2xl border border-dark-800 bg-dark-900/50 p-8 text-center backdrop-blur-sm">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600">
                <EnvelopeIconSolid className="size-7 text-white" />
              </div>
              <h1 className="mb-2 text-xl font-bold text-white">
                Check your email
              </h1>
              <p className="mb-6 text-dark-400">
                We sent a sign-in link to{" "}
                <span className="text-white">{magicLinkEmail}</span>
              </p>
              <button
                onClick={() => {
                  setShowMagicLink(false);
                  setMagicLinkSent(false);
                }}
                className="text-sm text-primary-400 transition-colors hover:text-primary-300"
              >
                Back to login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500">
              <EnvelopeIconSolid className="size-7 text-white" />
            </div>
            <h1 className="text-xl font-semibold text-white">Sign in with email</h1>
            <p className="mt-2 text-dark-400">We'll send you a sign-in link</p>
          </div>

          <form
            onSubmit={handleMagicLink}
            className="space-y-4 rounded-2xl border border-dark-800 bg-dark-900/50 p-6 backdrop-blur-sm"
          >
            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                Email
              </label>
              <input
                type="email"
                required
                autoFocus
                value={magicLinkEmail}
                onChange={(e) => setMagicLinkEmail(e.target.value)}
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-white placeholder-dark-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="you@example.com"
              />
            </div>

            <Button
              type="submit"
              color="primary"
              variant="filled"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send sign-in link"}
            </Button>

            <button
              type="button"
              onClick={() => setShowMagicLink(false)}
              className="w-full text-sm text-dark-400 transition-colors hover:text-dark-300"
            >
              Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main login form
  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={branding.appName}
              className="mx-auto mb-4 h-14 object-contain"
            />
          ) : (
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500">
              <ArrowRightOnRectangleIconSolid className="size-7 text-white" />
            </div>
          )}
          <h1 className="text-xl font-semibold text-white">{heading}</h1>
          <p className="mt-2 text-dark-400">{subtext}</p>
        </div>

        <Card className="space-y-4 rounded-2xl border-dark-800 bg-dark-900/50 p-6 backdrop-blur-sm">
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* OAuth buttons */}
          {hasOAuth && (
            <>
              <div className="space-y-2">
                {providers?.google && (
                  <a
                    href="/api/auth/google"
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 font-medium text-white transition-all hover:bg-dark-700"
                  >
                    <GoogleIcon className="size-5" />
                    Continue with Google
                  </a>
                )}
                {providers?.github && (
                  <a
                    href="/api/auth/github"
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 font-medium text-white transition-all hover:bg-dark-700"
                  >
                    <GithubIcon className="size-5" />
                    Continue with GitHub
                  </a>
                )}
                {providers?.microsoft && (
                  <a
                    href="/api/auth/microsoft"
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 font-medium text-white transition-all hover:bg-dark-700"
                  >
                    <MicrosoftIcon className="size-4" />
                    Continue with Microsoft
                  </a>
                )}
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-dark-700" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-dark-900/50 px-3 text-dark-500">or</span>
                </div>
              </div>
            </>
          )}

          {/* Passkey button */}
          {providers?.passkeys && (
            <button
              type="button"
              onClick={handlePasskeyLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 font-medium text-white transition-all hover:bg-dark-700 disabled:opacity-50"
            >
              <FingerPrintIcon className="size-5" />
              Sign in with passkey
            </button>
          )}

          {/* Password form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                Email
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-white placeholder-dark-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-dark-300">
                Password
              </label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-white placeholder-dark-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="Your password"
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                to="/forgot-password"
                className="text-sm text-primary-400 transition-colors hover:text-primary-300"
              >
                Forgot password?
              </Link>
            </div>

            <Button
              type="submit"
              color="primary"
              variant="filled"
              className="w-full"
              disabled={loading}
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Magic link option */}
          {providers?.magicLink && (
            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="flex w-full items-center justify-center gap-2 text-sm text-dark-400 transition-colors hover:text-dark-300"
            >
              <EnvelopeIcon className="size-4" />
              Sign in with email link
            </button>
          )}

          <div className="text-center text-sm text-dark-400">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary-400 transition-colors hover:text-primary-300"
            >
              Sign up
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
