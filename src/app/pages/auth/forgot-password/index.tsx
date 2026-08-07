// Import Dependencies
import { useState } from "react";
import { Link } from "react-router";
import { KeyIcon as KeyIconSolid } from "@heroicons/react/24/solid";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";

// Local Imports
import { authApi } from "@/utils/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

// ----------------------------------------------------------------------

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
    } catch {
      // Always show success to prevent email enumeration
    }
    setSent(true);
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500">
            <KeyIconSolid className="size-7 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Reset your password</h1>
          <p className="mt-2 text-dark-400">We'll send you a link to reset it.</p>
        </div>

        <Card className="rounded-2xl border-dark-800 bg-dark-900/50 p-6 backdrop-blur-sm">
          {sent ? (
            <div className="py-4 text-center">
              <p className="mb-4 text-dark-300">
                If an account exists for{" "}
                <span className="font-medium text-white">{email}</span>, you'll
                receive a password reset link shortly.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-primary-400 transition-colors hover:text-primary-300"
              >
                <ArrowLeftIcon className="size-4" />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-dark-300">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-dark-400 transition-colors hover:text-white"
                >
                  <ArrowLeftIcon className="size-4" />
                  Back to login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
