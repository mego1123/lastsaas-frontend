// Import Dependencies
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { authApi } from "@/utils/api";
import type { AuthResponse } from "@/@types/lastsaas";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

// ----------------------------------------------------------------------

export default function MagicLinkVerifyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const { loginWithTokens } = useAuthContext();
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing verification token");
      return;
    }

    authApi
      .verifyMagicLink(token)
      .then((data) => {
        if ("mfaRequired" in data && data.mfaRequired) {
          navigate(`/auth/mfa?token=${encodeURIComponent(data.mfaToken)}`);
          return;
        }
        const authData = data as AuthResponse;
        return loginWithTokens(authData.accessToken, authData.refreshToken).then(
          () => navigate("/dashboard"),
        );
      })
      .catch((err: { response?: { data?: { error?: string } } }) => {
        const msg = err?.response?.data?.error;
        setError(msg || "Invalid or expired link");
      });
  }, [token, loginWithTokens, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md rounded-2xl border border-dark-800 bg-dark-900/50 p-8 text-center backdrop-blur-sm">
          <h1 className="mb-2 text-xl font-bold text-white">
            Verification Failed
          </h1>
          <p className="mb-4 text-dark-400">{error}</p>
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900">
      <div className="text-center">
        <Spinner className="mb-4 size-10" color="primary" />
        <p className="text-dark-400">Verifying your sign-in link...</p>
      </div>
    </div>
  );
}
