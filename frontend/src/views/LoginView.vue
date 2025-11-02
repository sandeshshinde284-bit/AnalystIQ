<!-- File: src/views/LoginView.vue -->
<template>
  <div class="login-page-wrapper">
    <!-- Main Content -->
    <div class="login-content">
      <!-- Background Elements -->
      <div class="bg-grid"></div>
      <div class="bg-glow glow-1"></div>
      <div class="bg-glow glow-2"></div>

      <!-- Centered Login Form -->
      <div class="login-form-container">
        <div class="form-wrapper">
          <div class="form-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your AnalystIQ account</p>
          </div>

          <form @submit.prevent="handleGoogleLogin" class="login-form">
            <!-- Email Input -->
            <div class="form-group">
              <label for="email" class="form-label">
                <i class="ri-mail-line"></i>
                Email Address
              </label>
              <div class="input-wrapper">
                <input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  placeholder="name@company.com"
                  class="form-input"
                  :class="{ 'input-error': formErrors.email }"
                  required
                />
                <div v-if="formErrors.email" class="error-message">
                  <i class="ri-error-warning-line"></i>
                  {{ formErrors.email }}
                </div>
              </div>
            </div>

            <!-- Password Input -->
            <div class="form-group">
              <div class="password-header">
                <label for="password" class="form-label">
                  <i class="ri-lock-line"></i>
                  Password
                </label>
                <router-link to="/forgot-password" class="forgot-link">
                  Forgot password?
                </router-link>
              </div>
              <div class="input-wrapper">
                <input
                  id="password"
                  v-model="formData.password"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="Enter your password"
                  class="form-input"
                  :class="{ 'input-error': formErrors.password }"
                  required
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                  tabindex="-1"
                >
                  <i
                    :class="showPassword ? 'ri-eye-line' : 'ri-eye-off-line'"
                  ></i>
                </button>
                <div v-if="formErrors.password" class="error-message">
                  <i class="ri-error-warning-line"></i>
                  {{ formErrors.password }}
                </div>
              </div>
            </div>

            <!-- Remember Me -->
            <div class="checkbox-group">
              <input
                id="remember"
                v-model="formData.rememberMe"
                type="checkbox"
                class="checkbox-input"
              />
              <label for="remember" class="checkbox-label">
                Remember me on this device
              </label>
            </div>

            <!-- Login Button -->
            <button
              type="submit"
              class="login-btn"
              :class="{ loading: isLoading }"
              :disabled="isLoading"
            >
              <i
                :class="
                  isLoading ? 'ri-loader-line spinning' : 'ri-login-box-line'
                "
              ></i>
              <span>{{ isLoading ? "Signing In..." : "Sign In" }}</span>
            </button>

            <!-- Error Alert -->
            <div v-if="loginError" class="alert-error">
              <i class="ri-error-warning-fill"></i>
              <div>
                <p class="error-title">Login Failed</p>
                <p class="error-text">{{ loginError }}</p>
              </div>
            </div>
          </form>

          <!-- Divider -->
          <div class="divider">
            <span>or</span>
          </div>

          <!-- Social Login Options -->
          <div class="social-login">
            <button
              type="button"
              class="social-btn google-btn"
              title="Sign in with Google"
              @click="handleGoogleLogin"
            >
              <i class="ri-google-fill"></i>
            </button>
          </div>

          <!-- Sign Up Link -->
          <div class="signup-section">
            <p>
              Don't have an account?
              <button type="button" class="signup-link" @click="goToSignup">
                Sign up here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="login-footer">
      <p class="footer-links">
        <a href="#privacy">Privacy Policy</a> •
        <a href="#terms">Terms of Service</a> •
        <a href="#support">Support</a>
      </p>
      <p class="copyright">© 2025 AnalystIQ. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useAuthStore } from "@/stores/authStore";

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

interface FormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface FormErrors {
  email: string;
  password: string;
}

const isLoading = ref(false);
const showPassword = ref(false);
const loginError = ref("");

const formData = ref<FormData>({
  email: "",
  password: "",
  rememberMe: false,
});

const formErrors = ref<FormErrors>({
  email: "",
  password: "",
});

// ✅ ADD: Check if already logged in
onMounted(() => {
  if (authStore.isAuthenticated) {
    console.log("✅ User already logged in, redirecting to analysis");
    router.push("/app/new-analysis");
  }
});

function validateForm(): boolean {
  formErrors.value = { email: "", password: "" };
  let isValid = true;

  if (!formData.value.email) {
    formErrors.value.email = "Email is required";
    isValid = false;
  } else if (!isValidEmail(formData.value.email)) {
    formErrors.value.email = "Please enter a valid email address";
    isValid = false;
  }

  if (!formData.value.password) {
    formErrors.value.password = "Password is required";
    isValid = false;
  } else if (formData.value.password.length < 6) {
    formErrors.value.password = "Password must be at least 6 characters";
    isValid = false;
  }

  return isValid;
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// async function handleLogin(): Promise<void> {
//   loginError.value = "";

//   if (!validateForm()) {
//     return;
//   }

//   isLoading.value = true;

//   try {
//     // ✅ Use AuthStore's Google login
//     console.log("🔑 Attempting Google login...");
//     await authStore.loginWithGoogle();

//     // ✅ Success - redirect to analysis or referrer
//     const redirectPath =
//       (route.query.redirect as string) || "/app/new-analysis";
//     console.log("✅ Login successful, redirecting to:", redirectPath);
//     router.push(redirectPath);
//   } catch (error: any) {
//     console.error("❌ Login failed:", error);
//     loginError.value = error.message || "Login failed. Please try again.";
//     isLoading.value = false;
//   }
// }

async function handleGoogleLogin(): Promise<void> {
  loginError.value = "";

  // ⚠️ NOTE: We skip validateForm() because social login doesn't need email/password fields.

  isLoading.value = true;

  try {
    console.log("🔑 Attempting Google login...");
    await authStore.loginWithGoogle(); // Directly call Google login

    // ✅ Success - redirect to analysis or referrer
    const redirectPath =
      (route.query.redirect as string) || "/app/new-analysis";
    console.log("✅ Login successful, redirecting to:", redirectPath);
    router.push(redirectPath);
  } catch (error: any) {
    console.error("❌ Login failed:", error);
    loginError.value = error.message || "Login failed. Please try again.";
    isLoading.value = false;
  }
}

function goToSignup(): void {
  router.push("/signup");
}
</script>

<style lang="scss" scoped>
// Variables
$color-accent: #00d4ff;
$color-accent-darker: #0099cc;
$text-primary: #ffffff;
$text-secondary: rgba(255, 255, 255, 0.7);
$error-color: #ef4444;

// Font import
@font-face {
  font-family: "AlibabaSans";
  src: url("https://assets-persist.lovart.ai/agent-static-assets/AlibabaSans-Regular.otf")
    format("opentype");
  font-weight: normal;
}

.login-page-wrapper {
  font-family: "AlibabaSans", sans-serif;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0c0c0c 100%);
  color: $text-primary;
  overflow: hidden;
}

// ============== NAVBAR ==============
.navbar {
  position: relative;
  z-index: 100;
  padding: 16px 0;
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);
  background: rgba(10, 10, 10, 0.7);
  backdrop-filter: blur(10px);
}

.nav-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    padding: 0 20px;
  }
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: bold;

  .logo-icon {
    color: $color-accent;
    font-size: 28px;
  }

  .logo-text {
    background: linear-gradient(135deg, $color-accent, #00ffff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
}

.nav-links {
  display: flex;
  list-style: none;
  gap: 40px;
  margin: 0;
  padding: 0;

  a {
    color: $text-secondary;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.3s ease;

    &:hover {
      color: $color-accent;
    }
  }

  @media (max-width: 1024px) {
    gap: 24px;
  }

  @media (max-width: 768px) {
    display: none;
  }
}

.nav-signup-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 20px;
  background: transparent;
  border: 2px solid $color-accent;
  border-radius: 8px;
  color: $color-accent;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.1);
  }

  @media (max-width: 768px) {
    padding: 6px 12px;
    font-size: 12px;
  }
}

// ============== MAIN CONTENT ==============
.login-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 40px 20px;
}

// Background Elements
.bg-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
  background-size: 50px 50px;
  pointer-events: none;
  opacity: 0.3;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  filter: blur(40px);
}

.glow-1 {
  width: 400px;
  height: 400px;
  background: rgba(0, 212, 255, 0.1);
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.glow-2 {
  width: 300px;
  height: 300px;
  background: rgba(0, 212, 255, 0.05);
  bottom: -50px;
  left: -100px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(20px);
  }
}

// Login Form Container
.login-form-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
  display: flex;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  padding: 40px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.form-header {
  text-align: center;
  margin-bottom: 36px;

  h1 {
    font-size: 32px;
    font-weight: bold;
    color: $text-primary;
    margin: 0 0 8px 0;
  }

  p {
    font-size: 14px;
    color: $text-secondary;
    margin: 0;
  }
}

// ============== FORM ELEMENTS ==============
.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  i {
    font-size: 16px;
    color: $color-accent;
  }
}

.password-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forgot-link {
  font-size: 12px;
  color: $color-accent;
  text-decoration: none;
  transition: color 0.3s ease;

  &:hover {
    color: lighten($color-accent, 10%);
  }
}

.input-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: $text-primary;
  font-size: 14px;
  transition: all 0.3s ease;
  font-family: "AlibabaSans", sans-serif;

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  &:focus {
    outline: none;
    border-color: $color-accent;
    background: rgba(0, 212, 255, 0.08);
    box-shadow: 0 0 16px rgba(0, 212, 255, 0.15);
  }

  &.input-error {
    border-color: $error-color;
    background: rgba(239, 68, 68, 0.05);

    &:focus {
      box-shadow: 0 0 16px rgba(239, 68, 68, 0.15);
    }
  }
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  color: $text-secondary;
  cursor: pointer;
  font-size: 18px;
  transition: color 0.3s ease;

  &:hover {
    color: $color-accent;
  }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: $error-color;
  font-size: 12px;
  margin-top: 4px;

  i {
    font-size: 14px;
  }
}

// ============== CHECKBOX ==============
.checkbox-group {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.checkbox-input {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: $color-accent;
}

.checkbox-label {
  font-size: 13px;
  color: $text-secondary;
  cursor: pointer;
  user-select: none;
}

// ============== LOGIN BUTTON ==============
.login-btn {
  width: 100%;
  padding: 14px 16px;
  background: linear-gradient(135deg, $color-accent, $color-accent-darker);
  border: none;
  border-radius: 10px;
  color: #000000;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 8px;

  &:hover:not(:disabled) {
    box-shadow: 0 0 24px rgba(0, 212, 255, 0.4);
    transform: translateY(-2px);
  }

  &.loading {
    opacity: 0.8;

    .spinning {
      animation: spin 1s linear infinite;
    }
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  i {
    font-size: 18px;
  }
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

// ============== ALERTS ==============
.alert-error {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 10px;
  color: $error-color;

  i {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .error-title {
    font-weight: 600;
    font-size: 13px;
    margin: 0 0 4px 0;
  }

  .error-text {
    font-size: 12px;
    margin: 0;
    opacity: 0.9;
  }
}

// ============== DIVIDER ==============
.divider {
  position: relative;
  margin: 24px 0;
  color: $text-secondary;
  font-size: 12px;
  text-align: center;

  &::before {
    content: "";
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
  }

  span {
    position: relative;
    background: rgba(255, 255, 255, 0.02);
    padding: 0 12px;
  }
}

// ============== SOCIAL LOGIN ==============
.social-login {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;
}

.social-btn {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: $text-secondary;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  &.google-btn:hover {
    color: #4285f4;
  }

  &.microsoft-btn:hover {
    color: #00a4ef;
  }

  &.linkedin-btn:hover {
    color: #0077b5;
  }
}

// ============== SIGNUP SECTION ==============
.signup-section {
  text-align: center;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  p {
    font-size: 13px;
    color: $text-secondary;
    margin: 0;
  }

  .signup-link {
    background: none;
    border: none;
    color: $color-accent;
    text-decoration: none;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.3s ease;
    font-size: 13px;

    &:hover {
      color: lighten($color-accent, 10%);
    }
  }
}

// ============== FOOTER ==============
.login-footer {
  text-align: center;
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(10, 10, 10, 0.5);
  backdrop-filter: blur(10px);

  .footer-links {
    font-size: 11px;
    color: $text-secondary;
    margin-bottom: 8px;

    a {
      color: $text-secondary;
      text-decoration: none;
      transition: color 0.3s ease;

      &:hover {
        color: $color-accent;
      }
    }
  }

  .copyright {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.4);
    margin: 0;
  }
}

// ============== RESPONSIVE ==============
@media (max-width: 768px) {
  .login-content {
    padding: 30px 16px;
  }

  .form-wrapper {
    padding: 32px 24px;
  }

  .form-header {
    margin-bottom: 28px;

    h1 {
      font-size: 26px;
    }
  }

  .glow-1,
  .glow-2 {
    opacity: 0.5;
  }
}

@media (max-width: 480px) {
  .form-wrapper {
    padding: 24px 16px;
    border-radius: 12px;
  }

  .form-header {
    margin-bottom: 24px;

    h1 {
      font-size: 22px;
    }

    p {
      font-size: 13px;
    }
  }

  .login-form {
    gap: 16px;
  }

  .glow-1 {
    width: 250px;
    height: 250px;
    opacity: 0.3;
  }

  .glow-2 {
    width: 200px;
    height: 200px;
    opacity: 0.3;
  }
}
</style>
