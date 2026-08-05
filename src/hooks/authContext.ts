import { createContext } from "react";
import type { User } from "firebase/auth";
import type { AdminUser } from "../types";

interface AuthContextValue {
  user: User | null;
  admin: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  adminCheckError: string | null;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
