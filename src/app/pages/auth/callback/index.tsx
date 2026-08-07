// Import Dependencies
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";

// Local Imports
import { useAuthContext } from "@/app/contexts/auth/context";
import { authApi } from "@/utils/api";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

// ----------------------------------------------------------------------

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithTokens } = useAuthContext();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(errorParam);
      return;
    }

    if (!code) {
      setError("Missing authentication code");
      return;
    }

    authApi
      .exchangeCode(code)
      .then((data) => {
        if (data.mfaRequired && data.mfaToken) {
          navigate(`/auth/mfa?token=${encodeURIComponent(data.mfaToken)}`);
          return;
        }
        if (data.accessToken && data.refreshToken) {
          return loginWithTokens(data.accessToken, data.refreshToken).then(() =>
            navigate("/dashboard"),
          );
        }
        setError("Invalid authentication response");
      })
      .catch(() => setError("Failed to complete authentication"));
  }, [searchParams, loginWithTokens, navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
        <div className="max-w-md rounded-2xl border border-dark-800 bg-dark-900/50 p-8 text-center backdrop-blur-sm">
          <h1 className="mb-2 text-xl font-bold text-white">
            Authentication Failed
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
        <p className="text-dark-400">Completing authentication...</p>
      </div>
    </div>
  );
}
