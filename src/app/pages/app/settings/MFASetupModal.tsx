// Import Dependencies
import { useEffect, useState } from "react";
import { Copy } from "lucide-react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import { Spinner } from "@/components/ui/Spinner";
import { authApi } from "@/utils/api";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/settings/MFASetupModal.tsx`.
// ----------------------------------------------------------------------

interface MFASetupModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function MFASetupModal({
  onClose,
  onComplete,
}: MFASetupModalProps) {
  const [step, setStep] = useState<"qr" | "verify" | "codes">("qr");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    authApi
      .mfaSetup()
      .then((data) => {
        setQrCodeUrl(data.qrCodeUrl);
        setSecret(data.secret);
      })
      .catch(() => setError("Failed to initialize MFA setup"));
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.mfaVerifySetup(code);
      setRecoveryCodes(data.recoveryCodes);
      setStep("codes");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as { error?: string })?.error;
      setError(msg || "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const copyRecoveryCodes = () => {
    navigator.clipboard.writeText(recoveryCodes.join("\n"));
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
        className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 dark:border-dark-600 dark:bg-dark-700"
      >
        {step === "qr" && (
          <>
            <h3 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Set Up Two-Factor Authentication
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
              Scan this QR code with your authenticator app (Google
              Authenticator, Authy, etc.)
            </p>
            {qrCodeUrl ? (
              <div className="mb-4 flex justify-center">
                <img
                  src={qrCodeUrl}
                  alt="QR Code"
                  className="h-48 w-48 rounded-lg bg-white p-2"
                />
              </div>
            ) : (
              <div className="mb-4 flex justify-center py-8">
                <Spinner className="h-8 w-8" color="primary" />
              </div>
            )}
            {secret && (
              <div className="mb-4">
                <p className="mb-1 text-xs text-gray-500 dark:text-dark-300">
                  Or enter this key manually:
                </p>
                <code className="block break-all rounded-lg bg-gray-100 px-3 py-2 font-mono text-xs text-gray-700 dark:bg-dark-600 dark:text-dark-200">
                  {secret}
                </code>
              </div>
            )}
            <Button
              color="primary"
              variant="filled"
              onClick={() => setStep("verify")}
              className="h-10 w-full"
            >
              Next
            </Button>
          </>
        )}

        {step === "verify" && (
          <>
            <h3 className="mb-4 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Verify Code
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
              Enter the 6-digit code from your authenticator app
            </p>
            {error && (
              <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
                {error}
              </div>
            )}
            <form onSubmit={handleVerify} className="space-y-4">
              <Input
                type="text"
                required
                autoFocus
                autoComplete="one-time-code"
                inputMode="numeric"
                value={code}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCode(e.target.value)
                }
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <Button
                type="submit"
                color="primary"
                variant="filled"
                disabled={loading}
                className="h-10 w-full"
              >
                {loading ? "Verifying..." : "Enable MFA"}
              </Button>
            </form>
          </>
        )}

        {step === "codes" && (
          <>
            <h3 className="mb-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-50">
              Recovery Codes
            </h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
              Save these codes in a safe place. Each code can only be used once.
            </p>
            <div className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-4 dark:bg-dark-600">
              {recoveryCodes.map((c, i) => (
                <code key={i} className="font-mono text-sm text-gray-700 dark:text-dark-200">
                  {c}
                </code>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outlined"
                color="neutral"
                onClick={copyRecoveryCodes}
                className="h-10 flex-1"
              >
                <Copy className="h-4 w-4" /> Copy
              </Button>
              <Button
                color="primary"
                variant="filled"
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="h-10 flex-1"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </TransitionChild>
    </Transition>
  );
}
