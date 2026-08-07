// Import Dependencies
import { useState } from "react";
import { useNavigate } from "react-router";
import {
  CheckCircle,
  ChevronRight,
  User,
  Users,
  CreditCard,
} from "lucide-react";

// Local Imports
import { Page } from "@/components/shared/Page";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Form/Input";
import { useAuthContext } from "@/app/contexts/auth/context";
import { authApi, tenantApi } from "@/utils/api";

// ----------------------------------------------------------------------
// Migration of `frontend/src/pages/app/OnboardingPage.tsx` (191 LOC).
// ----------------------------------------------------------------------

type Step = "profile" | "team" | "complete";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthContext();
  const [step, setStep] = useState<Step>("profile");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const steps: { key: Step; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Profile", icon: User },
    { key: "team", label: "Team", icon: Users },
    { key: "complete", label: "Done", icon: CreditCard },
  ];

  const currentIndex = steps.findIndex((s) => s.key === step);

  const handleProfileNext = () => {
    setStep("team");
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteError("");
    try {
      await tenantApi.inviteMember(inviteEmail.trim(), "user");
      setInvitedEmails((prev) => [...prev, inviteEmail.trim()]);
      setInviteEmail("");
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ||
        (err as { error?: string })?.error;
      setInviteError(msg || "Failed to invite");
    }
  };

  const handleTeamNext = () => {
    setStep("complete");
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await authApi.completeOnboarding();
      await refreshUser();
      navigate("/dashboard");
    } catch {
      navigate("/dashboard");
    }
  };

  return (
    <Page title="Onboarding">
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-lg">
          {/* Stepper */}
          <div className="mb-8 flex items-center justify-center gap-2">
            {steps.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    i < currentIndex
                      ? "bg-success/20 text-success"
                      : i === currentIndex
                        ? "bg-primary-500/20 text-primary-500 dark:text-primary-400"
                        : "bg-gray-200 text-gray-400 dark:bg-dark-600 dark:text-dark-400"
                  }`}
                >
                  {i < currentIndex ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{s.label}</span>
                </div>
                {i < steps.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-gray-400 dark:text-dark-500" />
                )}
              </div>
            ))}
          </div>

          {/* Profile Step */}
          {step === "profile" && (
            <Card className="p-6">
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-dark-50">
                Welcome! Let's set up your profile
              </h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-dark-300">
                Confirm your display name
              </p>

              <div className="space-y-4">
                <Input
                  label="Display Name"
                  type="text"
                  value={displayName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setDisplayName(e.target.value)
                  }
                  placeholder="Your name"
                />

                <Button
                  color="primary"
                  variant="filled"
                  onClick={handleProfileNext}
                  disabled={!displayName.trim()}
                  className="h-10 w-full"
                >
                  Continue
                </Button>
              </div>
            </Card>
          )}

          {/* Team Step */}
          {step === "team" && (
            <Card className="p-6">
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-dark-50">
                Invite your team
              </h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-dark-300">
                Optionally invite team members to join your organization
              </p>

              <div className="space-y-4">
                {invitedEmails.length > 0 && (
                  <div className="space-y-1">
                    {invitedEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 dark:bg-dark-600/50"
                      >
                        <CheckCircle className="h-4 w-4 text-success" />
                        <span className="text-sm text-gray-900 dark:text-dark-50">
                          {email}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {inviteError && (
                  <div className="rounded-lg border border-error/20 bg-error/10 p-3 text-sm text-error dark:text-error-light">
                    {inviteError}
                  </div>
                )}

                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setInviteEmail(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleInvite();
                      }
                    }}
                    placeholder="colleague@example.com"
                    className="flex-1 text-sm"
                  />
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={handleInvite}
                    disabled={!inviteEmail.trim()}
                    className="h-10 min-w-[5rem]"
                  >
                    Invite
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    color="primary"
                    variant="filled"
                    onClick={handleTeamNext}
                    className="h-10 flex-1"
                  >
                    Continue
                  </Button>
                  <Button
                    variant="flat"
                    color="neutral"
                    onClick={handleTeamNext}
                    className="h-10 min-w-[4rem] text-sm"
                  >
                    Skip
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Complete Step */}
          {step === "complete" && (
            <Card className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-success to-info">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-dark-50">
                You're all set!
              </h2>
              <p className="mb-6 text-sm text-gray-500 dark:text-dark-300">
                Your account is ready. Let's get started.
              </p>

              <Button
                color="primary"
                variant="filled"
                onClick={handleComplete}
                disabled={loading}
                className="h-10 w-full"
              >
                {loading ? "Getting started..." : "Go to Dashboard"}
              </Button>
            </Card>
          )}
        </div>
      </div>
    </Page>
  );
}
