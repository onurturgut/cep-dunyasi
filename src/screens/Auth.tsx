"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Eye, EyeOff, MailCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/provider";
import { postMarketingEvent } from "@/lib/marketing-events";
import { useNavigate, useSearchParams } from "@/lib/router";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type AuthTab = "login" | "signup";
type BannerTone = "success" | "error" | "info";
type PasswordResetStep = "request" | "confirm";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sanitizeResetCodeInput(value: string) {
  return value.replace(/\D/g, "").slice(0, 6);
}

function trackAuthEvent(eventType: "login_started" | "login_success" | "register_started" | "register_success" | "auth_error", metadata?: Record<string, string | number | boolean | null>) {
  void postMarketingEvent({ eventType, entityType: "auth", pagePath: "/auth", metadata });
}

function passwordStrengthLabel(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score, label: "Zayif" };
  if (score <= 3) return { score, label: "Orta" };
  return { score, label: "Guclu" };
}

export default function Auth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { signIn, signUp, verifyEmail, resendVerification } = useAuth();

  const isEnglish = locale === "en";
  const [activeTab, setActiveTab] = useState<AuthTab>(searchParams.get("tab") === "signup" ? "signup" : "login");
  const [pendingAction, setPendingAction] = useState<"login" | "signup" | "verify" | "resend" | null>(null);
  const [banner, setBanner] = useState<{ tone: BannerTone; title: string; description: string; email?: string } | null>(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");
  const [signupConsent, setSignupConsent] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState(false);
  const [passwordResetDialogOpen, setPasswordResetDialogOpen] = useState(false);
  const [passwordResetStep, setPasswordResetStep] = useState<PasswordResetStep>("request");
  const [passwordResetEmail, setPasswordResetEmail] = useState("");
  const [passwordResetCode, setPasswordResetCode] = useState("");
  const [passwordResetNewPassword, setPasswordResetNewPassword] = useState("");
  const [passwordResetConfirmPassword, setPasswordResetConfirmPassword] = useState("");
  const [passwordResetNotice, setPasswordResetNotice] = useState("");
  const [passwordResetErrors, setPasswordResetErrors] = useState<Record<string, string>>({});
  const [passwordResetPending, setPasswordResetPending] = useState<"send" | "confirm" | "resend" | null>(null);
  const [passwordResetCooldown, setPasswordResetCooldown] = useState(0);

  const [loginVerificationCode, setLoginVerificationCode] = useState("");
  const [loginVerificationRequired, setLoginVerificationRequired] = useState(false);
  const [loginVerificationPending, setLoginVerificationPending] = useState<"verify" | "resend" | null>(null);
  const [loginVerificationNotice, setLoginVerificationNotice] = useState("");
  const [loginVerificationCooldown, setLoginVerificationCooldown] = useState(0);
  const [loginVerificationError, setLoginVerificationError] = useState("");
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  const referralCode = searchParams.get("ref");
  const strength = useMemo(() => passwordStrengthLabel(signupPassword), [signupPassword]);

  const t = {
    eyebrow: isEnglish ? "Cep Dunyasi account" : "Cep Dünyası hesabı",
    title: isEnglish ? "Fast access to your mobile world" : "Mobil dünyana hızlı giriş",
    subtitle: isEnglish
      ? "Cep Dunyasi brings together reliable phones, standout accessories, and practical support in one clean account experience."
      : "Cep Dünyası; güvenilir telefonları, sevilen aksesuarları ve hızlı destek deneyimini tek hesapta bir araya getirir.",
    loginTab: isEnglish ? "Sign In" : "Giriş Yap",
    signupTab: isEnglish ? "Create Account" : "Kayıt Ol",
    loginTitle: isEnglish ? "Welcome back" : "Tekrar hoş geldin",
    loginIntro: isEnglish ? "Track orders, saved favorites, and account updates from one place." : "Siparişlerini, favorilerini ve hesap hareketlerini tek yerden takip et.",
    signupTitle: isEnglish ? "Create your account" : "Cep Dünyası'na katıl",
    signupIntro: isEnglish ? "Sign up to save favorites, follow orders, and be first to see selected opportunities." : "Kayıt ol; favorilerini kaydet, siparişlerini izle ve öne çıkan fırsatları ilk sen gör.",
    email: isEnglish ? "Email" : "E-posta",
    password: isEnglish ? "Password" : "Şifre",
    confirmPassword: isEnglish ? "Confirm password" : "Şifre Tekrar",
    fullName: isEnglish ? "Full name" : "Ad Soyad",
    rememberMe: isEnglish ? "Keep me signed in" : "Beni hatırla",
    forgotPassword: isEnglish ? "Forgot password?" : "Şifremi unuttum",
    resetPasswordTitle: isEnglish ? "Reset your password" : "Şifreni sıfırla",
    resetPasswordDescription: isEnglish ? "Enter your email, receive a 6-digit code, and set your new password." : "E-posta adresini gir, 6 haneli kodu al ve yeni şifreni oluştur.",
    resetPasswordEmailLabel: isEnglish ? "Email address" : "E-posta adresi",
    resetPasswordCodeLabel: isEnglish ? "Verification code" : "Doğrulama kodu",
    resetPasswordCodeHint: isEnglish ? "We sent a 6-digit code to your email." : "E-posta adresine gönderilen 6 haneli kodu gir.",
    resetPasswordNewPassword: isEnglish ? "New password" : "Yeni şifre",
    resetPasswordConfirmPassword: isEnglish ? "Confirm new password" : "Yeni şifre tekrar",
    resetPasswordSendCode: isEnglish ? "Send reset code" : "Şifre Sıfırlama Kodunu Gönder",
    resetPasswordSending: isEnglish ? "Sending code to your email..." : "Mailinize kod gönderiliyor...",
    resetPasswordSubmit: isEnglish ? "Update password" : "Şifreyi Güncelle",
    resetPasswordSubmitting: isEnglish ? "Updating password..." : "Şifre güncelleniyor...",
    resetPasswordChangeEmail: isEnglish ? "Use a different email" : "Farklı e-posta kullan",
    resetPasswordResend: isEnglish ? "Resend code" : "Kodu tekrar gönder",
    resetPasswordCooldown: isEnglish ? "You can request a new code in {seconds} seconds." : "{seconds} saniye sonra tekrar kod gönderebilirsiniz.",
    resetPasswordRequestSuccess: isEnglish ? "Reset code sent." : "Şifre sıfırlama kodu gönderildi.",
    resetPasswordConfirmSuccess: isEnglish ? "Password updated." : "Şifren başarıyla güncellendi.",
    resetPasswordInvalidEmail: isEnglish ? "Enter a valid email." : "Geçerli bir e-posta gir.",
    resetPasswordInvalidCode: isEnglish ? "Enter the 6-digit code." : "6 haneli doğrulama kodunu gir.",
    loginVerificationLabel: isEnglish ? "Verification code" : "Hesap doğrulama kodu",
    loginVerificationHint: isEnglish ? "We sent a 6-digit verification code to your email." : "E-posta adresine gönderilen 6 haneli doğrulama kodunu gir.",
    loginVerificationVerify: isEnglish ? "Verify" : "Doğrula",
    loginVerificationVerifying: isEnglish ? "Verifying..." : "Doğrulanıyor...",
    loginVerificationSent: isEnglish ? "Verification code sent to your email." : "Hesap doğrulama kodu e-posta adresine gönderildi.",
    loginVerificationResend: isEnglish ? "Resend code" : "Kodu tekrar gönder",
    loginVerificationCooldown: isEnglish ? "You can request a new code in {seconds} seconds." : "{seconds} saniye sonra tekrar kod gönderebilirsiniz.",
    loginVerificationSuccess: isEnglish ? "Your email is verified. Signing you in..." : "E-posta adresin doğrulandı. Giriş yapılıyor...",
    consent: isEnglish ? "I accept the membership agreement and privacy notice." : "Üyelik sözleşmesini ve KVKK metnini kabul ediyorum.",
    referralHint: isEnglish ? "Referral code detected. Your welcome benefit will be linked after sign up." : "Referans kodu algılandı. Avantajın kayıttan sonra hesabına bağlanacak.",
    loginSuccess: isEnglish ? "You are signed in." : "Giriş başarılı.",
    signupSuccess: isEnglish ? "Your account is ready." : "Hesabın hazır.",
    loginError: isEnglish ? "Sign in failed" : "Giriş başarısız",
    signupError: isEnglish ? "Sign up failed" : "Kayıt başarısız",
    resendSuccess: isEnglish ? "Verification code sent again." : "Doğrulama kodu yeniden gönderildi.",
    resendError: isEnglish ? "Resend failed" : "Yeniden gönderim başarısız",
    resend: isEnglish ? "Resend code" : "Kodu tekrar gönder",
    signingIn: isEnglish ? "Signing in..." : "Giriş yapılıyor...",
    signingUp: isEnglish ? "Creating account..." : "Hesap oluşturuluyor...",
    resending: isEnglish ? "Sending..." : "Gönderiliyor...",
    signIn: isEnglish ? "Sign In" : "Giriş Yap",
    signUp: isEnglish ? "Create Account" : "Hemen Kayıt Ol",
    unverifiedTitle: isEnglish ? "Verify your email first" : "Önce hesabını doğrula",
    unverifiedDescription: isEnglish ? "You need to enter the verification code sent to your email before signing in." : "Giriş yapmadan önce e-posta adresine gönderilen doğrulama kodunu girmelisin.",
    strength: isEnglish ? "Password strength" : "Şifre gücü",
    strengthHint: isEnglish ? "Use 8+ characters with upper, lower, number, and symbol." : "8+ karakter, büyük-küçük harf, rakam ve sembol kullan.",
    loginFooter: isEnglish ? "Need an account?" : "Cep Dünyası'nda yeni misin?",
    signupFooter: isEnglish ? "Already have an account?" : "Zaten üye misin?",
    toSignup: isEnglish ? "Create one now" : "Fırsatları kaçırma, kayıt ol",
    toLogin: isEnglish ? "Go to sign in" : "Giriş yapmaya dön",
  };

  useEffect(() => {
    setActiveTab(searchParams.get("tab") === "signup" ? "signup" : "login");
  }, [searchParams]);

  const setTab = (nextTab: AuthTab) => {
    setActiveTab(nextTab);
    const nextParams = new URLSearchParams(searchParams.toString());
    nextParams.set("tab", nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const resetLoginVerificationState = () => {
    setLoginVerificationRequired(false);
    setLoginVerificationCode("");
    setLoginVerificationPending(null);
    setLoginVerificationNotice("");
    setLoginVerificationCooldown(0);
    setLoginVerificationError("");
  };

  const resetPasswordModalState = () => {
    setPasswordResetStep("request");
    setPasswordResetCode("");
    setPasswordResetNewPassword("");
    setPasswordResetConfirmPassword("");
    setPasswordResetNotice("");
    setPasswordResetErrors({});
    setPasswordResetPending(null);
    setPasswordResetCooldown(0);
  };

  const openPasswordResetDialog = () => {
    setPasswordResetEmail((loginEmail || banner?.email || "").trim().toLowerCase());
    resetPasswordModalState();
    setPasswordResetDialogOpen(true);
  };

  useEffect(() => {
    if (loginVerificationCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setLoginVerificationCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [loginVerificationCooldown]);

  useEffect(() => {
    if (!passwordResetDialogOpen || passwordResetCooldown <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setPasswordResetCooldown((current) => {
        if (current <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [passwordResetCooldown, passwordResetDialogOpen]);

  const handleSendPasswordResetCode = async (mode: "send" | "resend" = "send") => {
    const targetEmail = passwordResetEmail.trim().toLowerCase();

    if (!emailPattern.test(targetEmail)) {
      setPasswordResetErrors({ email: t.resetPasswordInvalidEmail });
      return;
    }

    setPasswordResetErrors({});
    setPasswordResetNotice(t.resetPasswordSending);
    setPasswordResetPending(mode);

    try {
      const response = await fetch("/api/auth/password-reset/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: targetEmail }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        const retryAfter = typeof body?.retryAfter === "number" ? body.retryAfter : typeof body?.error?.retryAfter === "number" ? body.error.retryAfter : 0;

        if (body?.error?.code === "RESET_CODE_RATE_LIMITED") {
          setPasswordResetStep("confirm");
          setPasswordResetCooldown(retryAfter);
          setPasswordResetNotice(body?.error?.message || body?.message || t.resetPasswordRequestSuccess);
          setPasswordResetEmail(targetEmail);
          return;
        }

        setPasswordResetNotice("");
        setPasswordResetErrors({ email: body?.error?.message || "Kod gonderilemedi." });
        return;
      }

      setPasswordResetEmail(targetEmail);
      setPasswordResetStep("confirm");
      setPasswordResetCooldown(typeof body?.retryAfter === "number" ? body.retryAfter : 30);
      setPasswordResetNotice(body?.message || t.resetPasswordRequestSuccess);
      setPasswordResetCode("");
      setPasswordResetNewPassword("");
      setPasswordResetConfirmPassword("");
    } catch (error) {
      setPasswordResetNotice("");
      setPasswordResetErrors({ email: error instanceof Error ? error.message : "Kod gonderilemedi." });
    } finally {
      setPasswordResetPending(null);
    }
  };

  const handleConfirmPasswordReset = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextErrors: Record<string, string> = {};
    const normalizedEmail = passwordResetEmail.trim().toLowerCase();
    const normalizedCode = sanitizeResetCodeInput(passwordResetCode);

    if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = t.resetPasswordInvalidEmail;
    }

    if (normalizedCode.length !== 6) {
      nextErrors.code = t.resetPasswordInvalidCode;
    }

    if (passwordResetNewPassword.length < 8) {
      nextErrors.password = isEnglish ? "Use at least 8 characters." : "En az 8 karakter kullan.";
    }

    if (passwordResetNewPassword !== passwordResetConfirmPassword) {
      nextErrors.confirmPassword = isEnglish ? "Passwords do not match." : "Sifreler eslesmiyor.";
    }

    setPasswordResetErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setPasswordResetPending("confirm");
    setPasswordResetNotice("");

    try {
      const response = await fetch("/api/auth/password-reset/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: normalizedEmail,
          code: normalizedCode,
          password: passwordResetNewPassword,
          confirmPassword: passwordResetConfirmPassword,
        }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok) {
        setPasswordResetErrors({ code: body?.error?.message || "Şifre güncellenemedi." });
        return;
      }

      setLoginEmail(normalizedEmail);
      setLoginPassword("");
      setPasswordResetDialogOpen(false);
      resetPasswordModalState();
      setBanner({
        tone: "success",
        title: t.resetPasswordConfirmSuccess,
        description: body?.message || t.resetPasswordConfirmSuccess,
      });
      toast.success(t.resetPasswordConfirmSuccess, { description: body?.message });
      setTab("login");
    } catch (error) {
      setPasswordResetErrors({ code: error instanceof Error ? error.message : "Şifre güncellenemedi." });
    } finally {
      setPasswordResetPending(null);
    }
  };

  const handleResend = async (email?: string) => {
    const targetEmail = (email ?? banner?.email ?? signupEmail ?? loginEmail).trim().toLowerCase();
    if (!emailPattern.test(targetEmail)) return;

    setPendingAction("resend");
    const { data, error } = await resendVerification(targetEmail);
    setPendingAction(null);

    if (error) {
      trackAuthEvent("auth_error", { stage: "resend_verification", reason: error.code ?? error.message ?? "unknown" });
      toast.error(t.resendError, { description: error.message });
      return;
    }

    setBanner({ tone: "info", title: t.resendSuccess, description: data?.message ?? t.resendSuccess, email: targetEmail });
    toast.success(t.resendSuccess, { description: data?.message });
  };

  const handleLoginVerificationResend = async () => {
    const targetEmail = loginEmail.trim().toLowerCase();
    if (!emailPattern.test(targetEmail)) {
        setLoginErrors({ email: isEnglish ? "Enter a valid email." : "Geçerli bir e-posta gir." });
      return;
    }

    setLoginVerificationPending("resend");
    setLoginVerificationError("");

    const { data, error } = await resendVerification(targetEmail);

    if (error) {
      setLoginVerificationError(error.message ?? "Kod tekrar gonderilemedi.");
      if (typeof error.retryAfter === "number") {
        setLoginVerificationCooldown(error.retryAfter);
      }
      setLoginVerificationPending(null);
      return;
    }

    setLoginVerificationNotice(data?.message ?? t.loginVerificationSent);
    setLoginVerificationCooldown(typeof data?.retryAfter === "number" ? data.retryAfter : 30);
    setLoginVerificationPending(null);
  };

  const completeLogin = async (email: string, password: string, remember: boolean) => {
    const { error } = await signIn(email, password, remember);

    if (error) {
      trackAuthEvent("auth_error", { stage: "login", reason: error.code ?? error.message ?? "unknown" });
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setLoginVerificationRequired(true);
        setLoginVerificationNotice(error.message ?? t.loginVerificationSent);
        setLoginVerificationCooldown(typeof error.retryAfter === "number" ? error.retryAfter : 30);
        setLoginVerificationError("");
        return { ok: false as const, verificationRequired: true as const };
      }

      toast.error(t.loginError, { description: error.message });
      return { ok: false as const, verificationRequired: false as const };
    }

    resetLoginVerificationState();
    trackAuthEvent("login_success", { remember_me: remember });
    toast.success(t.loginSuccess);
    navigate("/");
    return { ok: true as const, verificationRequired: false as const };
  };

  const handleVerifyLoginCode = async () => {
    const normalizedEmail = loginEmail.trim().toLowerCase();
    const normalizedCode = sanitizeResetCodeInput(loginVerificationCode);

    if (!emailPattern.test(normalizedEmail)) {
      setLoginErrors({ email: isEnglish ? "Enter a valid email." : "Gecerli bir e-posta gir." });
      return;
    }

    if (normalizedCode.length !== 6) {
      setLoginVerificationError(t.resetPasswordInvalidCode);
      return;
    }

    setLoginVerificationPending("verify");
    setLoginVerificationError("");

    const { data, error } = await verifyEmail(normalizedEmail, normalizedCode);

    if (error) {
      setLoginVerificationError(error.message ?? "Doğrulama başarısız.");
      setLoginVerificationPending(null);
      return;
    }

    setLoginVerificationNotice(data?.message ?? t.loginVerificationSuccess);
    setLoginVerificationPending(null);
    setLoginVerificationRequired(false);
    setBanner({
      tone: "success",
      title: t.loginVerificationSuccess,
      description: data?.message ?? t.loginVerificationSuccess,
    });

    setPendingAction("login");
    const loginResult = await completeLogin(normalizedEmail, loginPassword, rememberMe);
    setPendingAction(null);

    if (!loginResult.ok) {
      setLoginVerificationRequired(loginResult.verificationRequired);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (!emailPattern.test(loginEmail.trim())) errors.email = isEnglish ? "Enter a valid email." : "Geçerli bir e-posta gir.";
    if (!loginPassword) errors.password = isEnglish ? "Password is required." : "Şifre zorunlu.";
    setLoginErrors(errors);
    setLoginVerificationError("");
    setBanner(null);
    if (Object.keys(errors).length > 0) return;

    setPendingAction("login");
    trackAuthEvent("login_started", { remember_me: rememberMe });
    const loginResult = await completeLogin(loginEmail.trim().toLowerCase(), loginPassword, rememberMe);
    setPendingAction(null);

    if (!loginResult.ok && !loginResult.verificationRequired) {
      return;
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    const errors: Record<string, string> = {};
    if (signupName.trim().length < 2) errors.name = isEnglish ? "Enter your full name." : "Ad soyad bilgini gir.";
    if (!emailPattern.test(signupEmail.trim())) errors.email = isEnglish ? "Enter a valid email." : "Geçerli bir e-posta gir.";
    if (signupPassword.length < 8) errors.password = isEnglish ? "Use at least 8 characters." : "En az 8 karakter kullan.";
    if (signupPassword !== signupConfirmPassword) errors.confirmPassword = isEnglish ? "Passwords do not match." : "Şifreler eşleşmiyor.";
    if (!signupConsent) errors.consent = isEnglish ? "You need to accept the agreement." : "Onay vermen gerekiyor.";
    setSignupErrors(errors);
    setBanner(null);
    if (Object.keys(errors).length > 0) return;

    setPendingAction("signup");
    trackAuthEvent("register_started", { referral: Boolean(referralCode) });
    const { data, error } = await signUp(signupEmail.trim().toLowerCase(), signupPassword, signupName.trim(), referralCode);
    setPendingAction(null);

    if (error) {
      trackAuthEvent("auth_error", { stage: "register", reason: error.code ?? error.message ?? "unknown" });
      if (error.code === "EMAIL_NOT_VERIFIED") {
        setBanner({ tone: "info", title: t.unverifiedTitle, description: error.message ?? t.unverifiedDescription, email: error.email ?? signupEmail.trim().toLowerCase() });
        setTab("login");
      }
      toast.error(t.signupError, { description: error.message });
      return;
    }

    trackAuthEvent("register_success", { verification_required: data.verificationRequired });
    setLoginEmail(data.email ?? signupEmail.trim().toLowerCase());
    setSignupPassword("");
    setSignupConfirmPassword("");
    setBanner({ tone: "success", title: t.signupSuccess, description: data.message ?? t.unverifiedDescription, email: data.email ?? signupEmail.trim().toLowerCase() });
    setTab("login");
    toast.success(t.signupSuccess, { description: data.message ?? t.unverifiedDescription });
  };

  const trustItems = [
    { icon: MailCheck, text: isEnglish ? "Stay close to new phone drops, accessory picks, and your saved products." : "Yeni telefonlar, dikkat çeken aksesuarlar ve kaydettiğin ürünler hep elinin altında olsun." },
    { icon: ShieldCheck, text: isEnglish ? "Follow orders and account activity with a clear, reliable member area." : "Siparişlerini ve hesap hareketlerini düzenli, güven veren bir üye alanından takip et." },
    { icon: Sparkles, text: isEnglish ? "Create your account in minutes and step into a faster Cep Dunyasi shopping flow." : "Dakikalar içinde hesabını oluştur, Cep Dünyası'nın daha hızlı ve keyifli alışveriş akışına geç." },
  ];

  return (
    <Layout>
      <section className="py-8 sm:py-12">
        <div className="container px-4 sm:px-6">
          <Card className="mx-auto overflow-hidden rounded-[32px] border-slate-200/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950 dark:shadow-[0_30px_80px_rgba(2,6,23,0.55)]">
            <div className="grid lg:grid-cols-[1.02fr_minmax(0,0.98fr)]">
              <div className="min-w-0 bg-white px-6 py-8 text-slate-950 sm:px-8 dark:bg-slate-950 dark:text-white">
                <Badge className="rounded-full border-slate-300 bg-white px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-800">{t.eyebrow}</Badge>
                <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">{t.title}</h1>
                <p className="mt-3 max-w-xl text-sm leading-7 text-slate-600 sm:text-base dark:text-slate-300">{t.subtitle}</p>
                <div className="mt-8 grid gap-3">
                  {trustItems.map((item) => (
                    <div key={item.text} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-slate-700 dark:bg-slate-800 dark:text-slate-200"><item.icon className="h-5 w-5" /></div>
                      <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="min-w-0 bg-white px-4 py-6 text-slate-950 sm:px-6 sm:py-8 lg:px-8 dark:bg-slate-950 dark:text-slate-100">
                <Tabs value={activeTab} onValueChange={(value) => setTab(value === "signup" ? "signup" : "login")}>
                  <TabsList className="grid h-14 w-full grid-cols-2 rounded-full border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-700 dark:bg-slate-900">
                    <TabsTrigger value="login" className="rounded-full font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white">{t.loginTab}</TabsTrigger>
                    <TabsTrigger value="signup" className="rounded-full font-semibold text-slate-700 data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-sm dark:text-slate-300 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-white">{t.signupTab}</TabsTrigger>
                  </TabsList>

                  {banner ? (
                    <div className={cn("mt-6 rounded-3xl border px-4 py-4", banner.tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200" : banner.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200" : "border-slate-200 bg-slate-50 text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100")}>
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold">{banner.title}</p>
                          <p className="mt-1 text-sm leading-6">{banner.description}</p>
                        </div>
                        {banner.email ? (
                          <Button type="button" variant="outline" className="h-10 rounded-full px-4 text-xs font-semibold" disabled={pendingAction === "resend"} onClick={() => handleResend(banner.email)}>
                            {pendingAction === "resend" ? t.resending : t.resend}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <TabsContent value="login" className="mt-6 space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{t.loginTitle}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.loginIntro}</p>
                    </div>
                    <form className="space-y-4" onSubmit={handleLogin}>
                      <div className="space-y-2">
                        <Label htmlFor="login-email">{t.email}</Label>
                        <Input
                          id="login-email"
                          type="email"
                          autoComplete="email"
                          className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", loginErrors.email && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500")}
                          value={loginEmail}
                          onChange={(event) => {
                            setLoginEmail(event.target.value);
                            if (loginVerificationRequired) {
                              resetLoginVerificationState();
                            }
                          }}
                        />
                        {loginErrors.email ? <p className="text-sm text-rose-600">{loginErrors.email}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">{t.password}</Label>
                        <div className="relative">
                          <Input
                            id="login-password"
                            type={showLoginPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", loginErrors.password && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500")}
                            value={loginPassword}
                            onChange={(event) => setLoginPassword(event.target.value)}
                          />
                          <button type="button" className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setShowLoginPassword((current) => !current)}>
                            {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {loginErrors.password ? <p className="text-sm text-rose-600">{loginErrors.password}</p> : null}
                      </div>

                      {loginVerificationRequired ? (
                        <div className="space-y-2">
                          <Label htmlFor="login-verification-code">{t.loginVerificationLabel}</Label>
                          <div className="flex gap-2">
                            <Input
                              id="login-verification-code"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              placeholder="123456"
                              className={cn(
                                "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-center text-base font-semibold tracking-[0.35em] text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                                loginVerificationError && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                              )}
                              value={loginVerificationCode}
                              onChange={(event) => setLoginVerificationCode(sanitizeResetCodeInput(event.target.value))}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="h-12 rounded-2xl px-5 font-semibold"
                              disabled={loginVerificationPending === "verify"}
                              onClick={() => void handleVerifyLoginCode()}
                            >
                              {loginVerificationPending === "verify" ? t.loginVerificationVerifying : t.loginVerificationVerify}
                            </Button>
                          </div>
                          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                            {loginVerificationNotice || t.loginVerificationHint}
                          </p>
                          {loginVerificationCooldown > 0 ? (
                            <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">
                              {t.loginVerificationCooldown.replace("{seconds}", String(loginVerificationCooldown))}
                            </p>
                          ) : (
                            <button
                              type="button"
                              className="text-xs font-medium text-slate-700 transition hover:text-primary dark:text-slate-300"
                              disabled={loginVerificationPending === "resend"}
                              onClick={() => void handleLoginVerificationResend()}
                            >
                              {loginVerificationPending === "resend" ? t.resending : t.loginVerificationResend}
                            </button>
                          )}
                          {loginVerificationError ? <p className="text-sm text-rose-600">{loginVerificationError}</p> : null}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/80">
                        <label className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <Checkbox checked={rememberMe} onCheckedChange={(checked) => setRememberMe(checked === true)} />
                          {t.rememberMe}
                        </label>
                        <button type="button" className="text-sm font-medium text-slate-700 transition hover:text-primary dark:text-slate-300" onClick={openPasswordResetDialog}>{t.forgotPassword}</button>
                      </div>

                      <Button type="submit" className="h-12 w-full rounded-2xl text-base font-semibold" disabled={pendingAction === "login"}>
                        {pendingAction === "login" ? t.signingIn : t.signIn}
                      </Button>
                    </form>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.loginFooter} <button type="button" className="font-semibold text-slate-950 hover:text-primary dark:text-white" onClick={() => setTab("signup")}>{t.toSignup}</button></p>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6 space-y-6">
                    <div>
                      <h2 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{t.signupTitle}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{t.signupIntro}</p>
                    </div>
                    <form className="space-y-4" onSubmit={handleSignup}>
                      {referralCode ? <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm leading-6 text-slate-700 dark:border-primary/30 dark:bg-primary/10 dark:text-slate-200">{t.referralHint}</div> : null}

                      <div className="space-y-2">
                        <Label htmlFor="signup-name">{t.fullName}</Label>
                        <Input id="signup-name" autoComplete="name" className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", signupErrors.name && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500")} value={signupName} onChange={(event) => setSignupName(event.target.value)} />
                        {signupErrors.name ? <p className="text-sm text-rose-600">{signupErrors.name}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-email">{t.email}</Label>
                        <Input id="signup-email" type="email" autoComplete="email" className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", signupErrors.email && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500")} value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} />
                        {signupErrors.email ? <p className="text-sm text-rose-600">{signupErrors.email}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-password">{t.password}</Label>
                        <div className="relative">
                          <Input id="signup-password" type={showSignupPassword ? "text" : "password"} autoComplete="new-password" className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", signupErrors.password && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500")} value={signupPassword} onChange={(event) => setSignupPassword(event.target.value)} />
                          <button type="button" className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setShowSignupPassword((current) => !current)}>
                            {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-900">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-slate-700 dark:text-slate-300">{t.strength}</span>
                            <span className="font-semibold text-slate-950 dark:text-white">{strength.label}</span>
                          </div>
                          <div className="mt-3 grid grid-cols-4 gap-2">
                            {[0, 1, 2, 3].map((item) => <span key={item} className={cn("h-1.5 rounded-full bg-slate-200", strength.score > item && (strength.score <= 1 ? "bg-rose-500" : strength.score <= 3 ? "bg-amber-500" : "bg-emerald-500"))} />)}
                          </div>
                          <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">{t.strengthHint}</p>
                        </div>
                        {signupErrors.password ? <p className="text-sm text-rose-600">{signupErrors.password}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="signup-confirm">{t.confirmPassword}</Label>
                        <div className="relative">
                          <Input id="signup-confirm" type={showSignupConfirmPassword ? "text" : "password"} autoComplete="new-password" className={cn("h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 pr-12 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100", signupErrors.confirmPassword && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500")} value={signupConfirmPassword} onChange={(event) => setSignupConfirmPassword(event.target.value)} />
                          <button type="button" className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white" onClick={() => setShowSignupConfirmPassword((current) => !current)}>
                            {showSignupConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {signupErrors.confirmPassword ? <p className="text-sm text-rose-600">{signupErrors.confirmPassword}</p> : null}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-300">
                          <Checkbox checked={signupConsent} onCheckedChange={(checked) => setSignupConsent(checked === true)} className="mt-1" />
                          <span>{t.consent}</span>
                        </label>
                        {signupErrors.consent ? <p className="text-sm text-rose-600">{signupErrors.consent}</p> : null}
                      </div>

                      <Button type="submit" className="h-12 w-full rounded-2xl text-base font-semibold" disabled={pendingAction === "signup"}>
                        {pendingAction === "signup" ? t.signingUp : t.signUp}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </form>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{t.signupFooter} <button type="button" className="font-semibold text-slate-950 hover:text-primary dark:text-white" onClick={() => setTab("login")}>{t.toLogin}</button></p>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </Card>
        </div>
      </section>
      <Dialog
        open={passwordResetDialogOpen}
        onOpenChange={(open) => {
          setPasswordResetDialogOpen(open);
          if (!open) {
            resetPasswordModalState();
          }
        }}
      >
        <DialogContent className="w-[calc(100%-1.5rem)] max-w-xl rounded-[28px] border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-950">
          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <DialogHeader className="space-y-2 text-left">
              <DialogTitle className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-white">{t.resetPasswordTitle}</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                {t.resetPasswordDescription}
              </DialogDescription>
            </DialogHeader>
          </div>
          <form
            className="space-y-5 px-6 py-6"
            onSubmit={(event) => {
              if (passwordResetStep === "request") {
                event.preventDefault();
                void handleSendPasswordResetCode("send");
                return;
              }

              void handleConfirmPasswordReset(event);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="password-reset-email">{t.resetPasswordEmailLabel}</Label>
              <Input
                id="password-reset-email"
                type="email"
                autoComplete="email"
                disabled={passwordResetStep === "confirm"}
                className={cn(
                  "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-950 disabled:cursor-not-allowed disabled:opacity-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                  passwordResetErrors.email && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                )}
                value={passwordResetEmail}
                onChange={(event) => setPasswordResetEmail(event.target.value)}
              />
              {passwordResetErrors.email ? <p className="text-sm text-rose-600">{passwordResetErrors.email}</p> : null}
            </div>

            {passwordResetNotice ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                {passwordResetNotice}
              </div>
            ) : null}

            {passwordResetStep === "confirm" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="password-reset-code">{t.resetPasswordCodeLabel}</Label>
                  <Input
                    id="password-reset-code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className={cn(
                      "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-center text-lg font-semibold tracking-[0.35em] text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                      passwordResetErrors.code && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                    )}
                    value={passwordResetCode}
                    onChange={(event) => setPasswordResetCode(sanitizeResetCodeInput(event.target.value))}
                  />
                  <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{t.resetPasswordCodeHint}</p>
                  {passwordResetErrors.code ? <p className="text-sm text-rose-600">{passwordResetErrors.code}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-reset-new-password">{t.resetPasswordNewPassword}</Label>
                  <Input
                    id="password-reset-new-password"
                    type="password"
                    autoComplete="new-password"
                    className={cn(
                      "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                      passwordResetErrors.password && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                    )}
                    value={passwordResetNewPassword}
                    onChange={(event) => setPasswordResetNewPassword(event.target.value)}
                  />
                  {passwordResetErrors.password ? <p className="text-sm text-rose-600">{passwordResetErrors.password}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password-reset-confirm-password">{t.resetPasswordConfirmPassword}</Label>
                  <Input
                    id="password-reset-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    className={cn(
                      "h-12 rounded-2xl border-slate-200 bg-slate-50 px-4 text-slate-950 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                      passwordResetErrors.confirmPassword && "border-rose-300 focus-visible:ring-rose-300 dark:border-rose-500 dark:focus-visible:ring-rose-500",
                    )}
                    value={passwordResetConfirmPassword}
                    onChange={(event) => setPasswordResetConfirmPassword(event.target.value)}
                  />
                  {passwordResetErrors.confirmPassword ? <p className="text-sm text-rose-600">{passwordResetErrors.confirmPassword}</p> : null}
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-700 dark:bg-slate-900">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {passwordResetCooldown > 0 ? t.resetPasswordCooldown.replace("{seconds}", String(passwordResetCooldown)) : t.resetPasswordCodeHint}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full"
                      disabled={passwordResetCooldown > 0 || passwordResetPending === "resend"}
                      onClick={() => void handleSendPasswordResetCode("resend")}
                    >
                      {passwordResetPending === "resend" ? t.resending : t.resetPasswordResend}
                    </Button>
                  </div>
                </div>
              </>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              {passwordResetStep === "request" ? (
                <Button type="submit" className="h-12 rounded-2xl px-6 text-sm font-semibold" disabled={passwordResetPending === "send"}>
                  {passwordResetPending === "send" ? t.resetPasswordSending : t.resetPasswordSendCode}
                </Button>
              ) : (
                <Button type="submit" className="h-12 rounded-2xl px-6 text-sm font-semibold" disabled={passwordResetPending === "confirm"}>
                  {passwordResetPending === "confirm" ? t.resetPasswordSubmitting : t.resetPasswordSubmit}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
