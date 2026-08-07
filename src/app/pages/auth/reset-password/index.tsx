// Import Dependencies
import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router";
import { KeyIcon as KeyIconSolid } from "@heroicons/react/24/solid";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

// Local Imports
import { authApi } from "@/utils/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// ----------------------------------------------------------------------

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { error?: string } } }
      )?.response?.data?.error;
      setError(msg || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md rounded-2xl border border-dark-800 bg-dark-900/50 p-8 text-center backdrop-blur-sm">
          <h1 className="mb-2 text-xl font-bold text-white">Invalid Link</h1>
          <p className="mb-4 text-dark-400">
            This password reset link is invalid or has expired.
          </p>
          <Link
            to="/forgot-password"
            className="text-primary-400 transition-colors hover:text-primary-300"
          >
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500">
            <KeyIconSolid className="size-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Set new password</h1>
        </div>

        <Card className="rounded-2xl border-dark-800 bg-dark-900/50 p-6 backdrop-blur-sm">
          {success ? (
            <div className="py-4 text-center">
              <CheckCircleIcon className="mx-auto mb-3 size-12 text-success-light" />
              <p className="text-dark-300">
                Password reset successfully. Redirecting to login...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-dark-700 bg-dark-800 px-4 py-2.5 text-white placeholder-dark-500 transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="Min 10 chars, mixed case, number, special"
                />
              </div>

              <Button
                type="submit"
                color="primary"
                variant="filled"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
