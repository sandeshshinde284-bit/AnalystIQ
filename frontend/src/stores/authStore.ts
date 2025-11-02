import { defineStore } from "pinia";
import { auth, db } from "@/firebase/config"; // ← Import from config
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export const useAuthStore = defineStore("auth", {
  state: () => ({
    user: null as User | null,
    isLoading: false,
    isAuthenticated: false,
    authError: null as string | null,
  }),

  actions: {
    async loginWithGoogle() {
      this.isLoading = true;
      this.authError = null;
      try {
        console.log("🔐 Attempting Google login...");
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);

        this.user = result.user;
        this.isAuthenticated = true;

        // Save user to Firestore
        try {
          await setDoc(
            doc(db, "users", result.user.uid),
            {
              uid: result.user.uid,
              email: result.user.email,
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString(),
            },
            { merge: true }
          );
          console.log("✅ User saved to Firestore:", result.user.uid);
        } catch (dbError) {
          console.warn("⚠️ Could not save to Firestore:", dbError);
        }

        console.log("✅ Login successful:", this.user?.email);
        return result.user;
      } catch (error: any) {
        this.authError = error.message;
        console.error("❌ Login failed:", error.code, error.message);
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async logout() {
      try {
        await signOut(auth);
        this.user = null;
        this.isAuthenticated = false;
        console.log("✅ Logged out");
      } catch (error: any) {
        this.authError = error.message;
        console.error("❌ Logout failed:", error);
      }
    },

    initializeAuth() {
      return new Promise((resolve) => {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            this.user = user;
            this.isAuthenticated = true;
            console.log("✅ User already logged in:", user.email);
          } else {
            this.user = null;
            this.isAuthenticated = false;
          }
          resolve(user);
        });
      });
    },

    async getUserToken() {
      if (!this.user) return null;
      return await this.user.getIdToken();
    },
  },

  getters: {
    getUserEmail: (state) => state.user?.email,
    getUserId: (state) => state.user?.uid,
  },
});
