import { onAuthStateChanged, signInWithPopup, signOut, type User } from "firebase/auth";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { getAdminByEmail } from "../lib/db";
import { isActiveAdminProfile } from "../lib/adminAccess";
import { auth, googleProvider, isFirebaseConfigured } from "../lib/firebase";
import type { AdminUser } from "../types";
import { AuthContext } from "./authContext";

function errorMessage(e: unknown) {
  if (e && typeof e === "object" && "code" in e) {
    const code = String((e as { code: string }).code);
    const message = e instanceof Error ? e.message : code;
    return message.includes(code) ? message : `${message} (${code})`;
  }
  return e instanceof Error ? e.message : "Sign-in failed";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);
  const [adminCheckError, setAdminCheckError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      if (!nextUser?.email) {
        setAdmin(null);
        setAdminCheckError(null);
        setLoading(false);
        return;
      }
      setAuthError(null);
      void getAdminByEmail(nextUser.email)
        .then((profile) => {
          const email = nextUser.email ?? "";
          setAdmin(isActiveAdminProfile(profile) ? profile : null);
          setAdminCheckError(
            isActiveAdminProfile(profile)
              ? null
              : `No active admin doc for ${email}. Create Firestore admins/${email.toLowerCase()}.`
          );
        })
        .catch((e) => {
          setAdmin(null);
          setAdminCheckError(e instanceof Error ? e.message : "Failed to load admin profile");
        })
        .finally(() => setLoading(false));
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      admin,
      isAdmin: Boolean(admin),
      loading,
      authError,
      adminCheckError,
      signIn: async () => {
        if (!auth) return;
        setAuthError(null);
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (e) {
          setAuthError(errorMessage(e));
          throw e;
        }
      },
      logout: async () => {
        if (!auth) return;
        await signOut(auth);
      }
    }),
    [admin, adminCheckError, authError, loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
