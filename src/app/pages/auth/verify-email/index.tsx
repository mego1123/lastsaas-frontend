// Import Dependencies
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { EnvelopeOpenIcon, XCircleIcon } from "@heroicons/react/24/outline";

// Local Imports
import { authApi } from "@/utils/api";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/Button";

// ----------------------------------------------------------------------

type VerifyStatus = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<VerifyStatus>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Missing verification token");
      return;
    }

    authApi
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified successfully.");
      })
      .catch(
        (err: { response?: { data?: { error?: string } } }) => {
          setStatus("error");
          setMessage(
            err.response?.data?.error ||
              "Verification failed. The token may have expired.",
          );
        },
      );
  }, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md text-center">
        {status === "loading" && (
          <>
            <Spinner className="mx-auto mb-4 size-12" color="primary" />
            <h1 className="text-xl font-bold text-white">
              Verifying your email...
            </h1>
          </>
        )}

        {status === "success" && (
          <div className="rounded-2xl border border-dark-800 bg-dark-900/50 p-8 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-success/20">
              <EnvelopeOpenIcon className="size-7 text-success-light" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">Email Verified</h1>
            <p className="mb-6 text-dark-400">{message}</p>
            <Link to="/login">
              <Button color="primary" variant="filled">
                Continue to Login
              </Button>
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-dark-800 bg-dark-900/50 p-8 backdrop-blur-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-red-500/20">
              <XCircleIcon className="size-7 text-red-400" />
            </div>
            <h1 className="mb-2 text-xl font-bold text-white">
              Verification Failed
            </h1>
            <p className="mb-6 text-dark-400">{message}</p>
            <Link to="/login">
              <Button color="neutral" variant="outlined">
                Back to Login
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
