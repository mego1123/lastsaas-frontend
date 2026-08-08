// Import Dependencies
import { useEffect, useState } from "react";
import { CheckCircle, Shield, Fingerprint, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Local Imports
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import { Spinner } from "@/components/ui/Spinner";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { useAuthContext } from "@/app/contexts/auth/context";
import { useBranding } from "@/app/contexts/branding/context";
import { authApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";
import type { PasskeyCredential } from "@/@types/lastsaas";
import MFASetupModal from "./MFASetupModal";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/settings/SecurityTab.tsx` (234 LOC).
// ----------------------------------------------------------------------

export default function SecurityTab() {
  const { user, refreshUser } = useAuthContext();
  const { branding } = useBranding();
  const passkeysEnabled = branding?.authProviders?.passkeys ?? false;
  const mfaConfigEnabled = branding?.authProviders?.mfa ?? false;
  const showMfaSection = mfaConfigEnabled || user?.totpEnabled;

  // MFA state
  const [showMfaSetup, setShowMfaSetup] = useState(false);
  const [mfaDisableCode, setMfaDisableCode] = useState("");
  const [mfaDisableError, setMfaDisableError] = useState("");
  const [mfaDisabling, setMfaDisabling] = useState(false);
  const [showDisableMfa, setShowDisableMfa] = useState(false);

  // Passkeys state
  const [passkeys, setPasskeys] = useState<PasskeyCredential[]>([]);
  const [passkeysLoading, setPasskeysLoading] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [addingPasskey, setAddingPasskey] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");
  const [confirmDeletePasskeyId, setConfirmDeletePasskeyId] = useState<
    string | null
  >(null);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const loadPasskeys = () => {
    setPasskeysLoading(true);
    authApi
      .listPasskeys()
      .then((data) => setPasskeys(data.passkeys || []))
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setPasskeysLoading(false));
  };

  useEffect(() => {
    loadPasskeys();
     
  }, []);

  const handleDisableMfa = async (e: React.FormEvent) => {
    e.preventDefault();
    setMfaDisableError("");
    setMfaDisabling(true);
    try {
      await authApi.mfaDisable(mfaDisableCode);
      await refreshUser();
      setShowDisableMfa(false);
      setMfaDisableCode("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as { error?: string })?.error;
      setMfaDisableError(msg || "Invalid code");
    } finally {
      setMfaDisabling(false);
    }
  };

  const handleAddPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasskeyError("");
    setAddingPasskey(true);
    try {
      const options = await authApi.passkeyRegisterBegin();
      const credential = await navigator.credentials.create({
        publicKey: options,
      });
      if (!credential) throw new Error("No credential created");
      await authApi.passkeyRegisterFinish({
        name: passkeyName || "My Passkey",
        credential,
      });
      setPasskeyName("");
      loadPasskeys();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as Error)?.message ||
        "Failed to add passkey";
      setPasskeyError(msg);
    } finally {
      setAddingPasskey(false);
    }
  };

  const handleDeletePasskey = async (id: string) => {
    setConfirmLoading(true);
    try {
      await authApi.deletePasskey(id);
      setPasskeys((p) => p.filter((pk) => pk.id !== id));
      toast.success("Passkey deleted");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setConfirmLoading(false);
      setConfirmDeletePasskeyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* MFA Section */}
      {showMfaSection && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
            <Shield className="h-5 w-5 text-gray-400 dark:text-dark-400" />
            Two-Factor Authentication
          </h2>

          {user?.totpEnabled ? (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="h-4 w-4" /> Enabled
                </span>
              </div>

              {showDisableMfa ? (
                <form onSubmit={handleDisableMfa} className="space-y-3">
                  {mfaDisableError && (
                    <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
                      {mfaDisableError}
                    </div>
                  )}
                  <Input
                    label="Enter TOTP code or recovery code to disable"
                    type="text"
                    required
                    autoFocus
                    value={mfaDisableCode}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMfaDisableCode(e.target.value)
                    }
                    placeholder="000000"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      variant="outlined"
                      color="error"
                      disabled={mfaDisabling}
                      className="h-9 min-w-[8rem]"
                    >
                      {mfaDisabling ? "Disabling..." : "Confirm Disable"}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      color="neutral"
                      onClick={() => {
                        setShowDisableMfa(false);
                        setMfaDisableCode("");
                        setMfaDisableError("");
                      }}
                      className="h-9 min-w-[5rem]"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <Button
                  variant="outlined"
                  color="neutral"
                  onClick={() => setShowDisableMfa(true)}
                  className="h-9 min-w-[7rem]"
                >
                  Disable MFA
                </Button>
              )}
            </div>
          ) : (
            <div>
              <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
                Add an extra layer of security to your account with a TOTP
                authenticator app.
              </p>
              <Button
                color="primary"
                variant="filled"
                onClick={() => setShowMfaSetup(true)}
                className="h-10 min-w-[16rem]"
              >
                Enable Two-Factor Authentication
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Passkeys Section */}
      {passkeysEnabled && (
        <Card className="p-6">
          <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
            <Fingerprint className="h-5 w-5 text-gray-400 dark:text-dark-400" />
            Passkeys
          </h2>

          {passkeysLoading ? (
            <div className="py-4">
              <Spinner className="h-5 w-5" color="primary" />
            </div>
          ) : (
            <>
              {passkeys.length > 0 && (
                <div className="mb-4 space-y-2">
                  {passkeys.map((pk) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark-600/50"
                    >
                      <div>
                        <p className="text-sm text-gray-900 dark:text-dark-50">
                          {pk.name}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-dark-400">
                          Added {new Date(pk.createdAt).toLocaleDateString()}
                          {pk.lastUsedAt &&
                            ` · Last used ${new Date(pk.lastUsedAt).toLocaleDateString()}`}
                        </p>
                      </div>
                      <Button
                        isIcon
                        variant="flat"
                        color="error"
                        className="h-8 w-8"
                        onClick={() => setConfirmDeletePasskeyId(pk.id)}
                        aria-label="Delete passkey"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {passkeyError && (
                <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
                  {passkeyError}
                </div>
              )}

              <form onSubmit={handleAddPasskey} className="flex gap-2">
                <Input
                  type="text"
                  value={passkeyName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasskeyName(e.target.value)
                  }
                  placeholder="Passkey name (e.g., MacBook)"
                  className="flex-1 text-sm"
                />
                <Button
                  type="submit"
                  variant="outlined"
                  color="neutral"
                  disabled={addingPasskey}
                  className="h-10 min-w-[7rem]"
                >
                  {addingPasskey ? "Adding..." : "Add Passkey"}
                </Button>
              </form>
            </>
          )}
        </Card>
      )}

      {/* MFA Setup Modal */}
      {showMfaSetup && (
        <MFASetupModal
          onClose={() => setShowMfaSetup(false)}
          onComplete={refreshUser}
        />
      )}

      {/* Confirm Delete Passkey */}
      <ConfirmModal
        show={confirmDeletePasskeyId !== null}
        state="pending"
        confirmLoading={confirmLoading}
        onClose={() => setConfirmDeletePasskeyId(null)}
        onOk={() =>
          confirmDeletePasskeyId && handleDeletePasskey(confirmDeletePasskeyId)
        }
        messages={{
          pending: {
            title: "Delete Passkey",
            description:
              "This passkey will be permanently removed. You won't be able to use it to sign in anymore.",
            actionText: "Delete",
          },
        }}
      />
    </div>
  );
}
