// Import Dependencies
import { useState } from "react";
import {
  KeyRound,
  CheckCircle,
  AlertCircle,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";

// Local Imports
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import { useAuthContext } from "@/app/contexts/auth/context";
import { authApi } from "@/utils/api";
import { getErrorMessage } from "@/utils/errors";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/settings/ProfileTab.tsx` (286 LOC).
// ----------------------------------------------------------------------

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "10+ characters", met: password.length >= 10 },
    { label: "Uppercase letter", met: /[A-Z]/.test(password) },
    { label: "Lowercase letter", met: /[a-z]/.test(password) },
    { label: "Number", met: /\d/.test(password) },
    { label: "Special character", met: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.met).length;
  const strength =
    score <= 2 ? "Weak" : score <= 3 ? "Fair" : score <= 4 ? "Good" : "Strong";
  const color =
    score <= 2
      ? "bg-error"
      : score <= 3
        ? "bg-warning"
        : score <= 4
          ? "bg-primary-500"
          : "bg-success";
  const textColor =
    score <= 2
      ? "text-error"
      : score <= 3
        ? "text-warning"
        : score <= 4
          ? "text-primary-500 dark:text-primary-400"
          : "text-success";

  return (
    <div className="mt-2">
      <div className="mb-1.5 flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-0.5 overflow-hidden rounded-full bg-gray-200 dark:bg-dark-600">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`flex-1 rounded-full transition-colors ${
                i <= score ? color : "bg-gray-200 dark:bg-dark-600"
              }`}
            />
          ))}
        </div>
        <span className={`text-xs font-medium ${textColor}`}>{strength}</span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map((c) => (
          <span
            key={c.label}
            className={`text-xs ${
              c.met
                ? "text-success"
                : "text-gray-400 dark:text-dark-400"
            }`}
          >
            {c.met ? "\u2713" : "\u2717"} {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProfileTab() {
  const { user, refreshUser } = useAuthContext();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed successfully");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as { error?: string })?.error;
      setPasswordError(msg || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const blob = await authApi.exportData();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "account-data.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount(deletePassword);
      toast.success("Account deleted");
      window.location.href = "/login";
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!user?.email) return;
    try {
      await authApi.resendVerification(user.email);
      await refreshUser();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Name
            </span>
            <span className="text-sm text-gray-900 dark:text-dark-50">
              {user?.displayName}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Email
            </span>
            <span className="text-sm text-gray-900 dark:text-dark-50">
              {user?.email}
            </span>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Email Verified
            </span>
            <div className="flex items-center gap-2">
              {user?.emailVerified ? (
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle className="h-4 w-4" /> Verified
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-sm text-warning">
                    <AlertCircle className="h-4 w-4" /> Not verified
                  </span>
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    className="text-xs text-primary-500 transition-colors hover:text-primary-600 dark:text-primary-400 dark:hover:text-primary-300"
                  >
                    Resend
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-gray-200 py-2 dark:border-dark-600">
            <span className="text-sm text-gray-500 dark:text-dark-300">
              Auth Methods
            </span>
            <div className="flex gap-2">
              {user?.authMethods.map((method) => (
                <span
                  key={method}
                  className="rounded bg-gray-200 px-2 py-0.5 text-xs capitalize text-gray-700 dark:bg-dark-600 dark:text-dark-200"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Change Password */}
      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
          <KeyRound className="h-5 w-5 text-gray-400 dark:text-dark-400" />
          Change Password
        </h2>

        {passwordError && (
          <div className="mb-4 rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="mb-4 rounded-lg border border-success/20 bg-success/10 p-3 text-sm text-success dark:text-success-light">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            label="Current Password"
            type="password"
            required
            value={currentPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setCurrentPassword(e.target.value)
            }
          />
          <div>
            <Input
              label="New Password"
              type="password"
              required
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setNewPassword(e.target.value)
              }
              placeholder="Min 10 chars, mixed case, number, special"
            />
            {newPassword && <PasswordStrength password={newPassword} />}
          </div>
          <Button
            type="submit"
            color="primary"
            variant="filled"
            disabled={changingPassword}
            className="h-10 min-w-[8rem]"
          >
            {changingPassword ? "Changing..." : "Change Password"}
          </Button>
        </form>
      </Card>

      {/* Data Export */}
      <Card className="p-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-medium tracking-wide text-gray-800 dark:text-dark-100">
          <Download className="h-5 w-5 text-gray-400 dark:text-dark-400" />
          Export My Data
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
          Download a JSON file containing your profile, memberships, and
          messages.
        </p>
        <Button
          variant="outlined"
          color="neutral"
          onClick={handleExportData}
          disabled={exporting}
          className="h-9 min-w-[8rem]"
        >
          {exporting ? "Exporting..." : "Download Data"}
        </Button>
      </Card>

      {/* Delete Account */}
      <Card className="border-error/20 bg-error/5 p-6">
        <h2 className="mb-2 flex items-center gap-2 text-base font-medium tracking-wide text-error">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </h2>
        <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
          Permanently delete your account and all associated data. This action
          cannot be undone.
        </p>
        <Button
          variant="outlined"
          color="error"
          onClick={() => setShowDeleteModal(true)}
          className="h-9 min-w-[10rem]"
        >
          Delete My Account
        </Button>
      </Card>

      {/* Delete Account Modal */}
      <Transition
        appear
        show={showDeleteModal}
        as={Dialog}
        onClose={() => setShowDeleteModal(false)}
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
          className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 transition-all dark:border-dark-600 dark:bg-dark-700"
        >
          <h3 className="mb-2 text-base font-medium tracking-wide text-error">
            Delete Account
          </h3>
          <p className="mb-4 text-sm text-gray-500 dark:text-dark-300">
            This will permanently delete your account and all data. If you own
            any teams with other members, you must transfer ownership first.
          </p>
          {user?.authMethods.includes("password") && (
            <div className="mb-4">
              <Input
                label="Confirm your password"
                type="password"
                value={deletePassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDeletePassword(e.target.value)
                }
                placeholder="Enter your password"
              />
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="flat"
              color="neutral"
              onClick={() => {
                setShowDeleteModal(false);
                setDeletePassword("");
              }}
              className="h-9 min-w-[5rem]"
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              color="error"
              onClick={handleDeleteAccount}
              disabled={
                deleting ||
                (user?.authMethods.includes("password") && !deletePassword)
              }
              className="h-9 min-w-[8rem]"
            >
              {deleting ? "Deleting..." : "Permanently Delete"}
            </Button>
          </div>
        </TransitionChild>
      </Transition>
    </div>
  );
}
