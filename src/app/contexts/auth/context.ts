import { MembershipInfo, User } from "@/@types/lastsaas";
import { createSafeContext } from "@/utils/createSafeContext";

export interface MFAPendingState {
  mfaToken: string;
}

export interface AuthContextType {
  user: User | null;
  memberships: MembershipInfo[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  errorMessage: string | null;
  mfaPending: MFAPendingState | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    displayName: string;
    invitationToken?: string;
  }) => Promise<void>;
  loginWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  completeMfaChallenge: (mfaToken: string, code: string) => Promise<void>;
  clearMfaPending: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const [AuthProvider, useAuthContext] =
  createSafeContext<AuthContextType>(
    "useAuthContext must be used within AuthProvider",
  );
