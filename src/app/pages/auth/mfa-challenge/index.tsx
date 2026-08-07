// Import Dependencies
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { KeyIcon as KeyIconSolid } from "@heroicons/react/24/solid";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { Button } from "@/components/ui/Button";

// ----------------------------------------------------------------------

export default function MFAChallengePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mfaToken = searchParams.get("token") || "";
  const { completeMfaChallenge } = useAuthContext();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!mfaToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md rounded-2xl border border-dark-800 bg-dark-900/50 p-8 text-center backdrop-blur-sm">
          <h1 className="mb-2 text-xl font-bold text-white">Invalid Request</h1>
          <p className="mb-4 text-dark-400">Missing MFA token.</p>
          <Button
            color="neutral"
            variant="filled"
            onClick={() => navigate("/login")}
          >
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await completeMfaChallenge(mfaToken, code);
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
          onSubmit={handleSubmit}
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
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
            onClick={() => navigate("/login")}
            className="w-full text-sm text-dark-400 transition-colors hover:text-dark-300"
          >
            Back to login
          </button>
        </form>
      </div>
    </div>
  );
}
