"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useI18n } from "@/i18n/provider";
import { toast } from "sonner";

export default function Auth() {
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupName, setSignupName] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();

  const copy =
    locale === "en"
      ? {
          loginTab: "Sign In",
          signupTab: "Sign Up",
          email: "Email",
          password: "Password",
          fullName: "Full Name",
          signingIn: "Signing in...",
          signIn: "Sign In",
          signingUp: "Creating account...",
          signUp: "Sign Up",
          loginError: "Sign-in failed",
          loginSuccess: "Signed in successfully!",
          signupError: "Sign-up failed",
          signupSuccess: "Account created successfully!",
          signupSuccessDescription: "Please verify your email address.",
        }
      : {
          loginTab: "Giris Yap",
          signupTab: "Kayit Ol",
          email: "E-posta",
          password: "Sifre",
          fullName: "Ad Soyad",
          signingIn: "Giris yapiliyor...",
          signIn: "Giris Yap",
          signingUp: "Kayit yapiliyor...",
          signUp: "Kayit Ol",
          loginError: "Giris basarisiz",
          loginSuccess: "Giris basarili!",
          signupError: "Kayit basarisiz",
          signupSuccess: "Kayit basarili!",
          signupSuccessDescription: "E-posta adresinizi dogrulayin.",
        };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setLoading(false);

    if (error) {
      toast.error(copy.loginError, { description: error.message });
    } else {
      toast.success(copy.loginSuccess);
      navigate("/");
    }
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupName);
    setLoading(false);

    if (error) {
      toast.error(copy.signupError, { description: error.message });
    } else {
      toast.success(copy.signupSuccess, { description: copy.signupSuccessDescription });
    }
  };

  return (
    <Layout>
      <div className="container flex items-center justify-center py-16">
        <Card className="w-full max-w-md">
          <Tabs defaultValue="login">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{copy.loginTab}</TabsTrigger>
                <TabsTrigger value="signup">{copy.signupTab}</TabsTrigger>
              </TabsList>
            </CardHeader>
            <CardContent>
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{copy.email}</Label>
                    <Input id="login-email" type="email" required value={loginEmail} onChange={(event) => setLoginEmail(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-pass">{copy.password}</Label>
                    <Input id="login-pass" type="password" required value={loginPassword} onChange={(event) => setLoginPassword(event.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? copy.signingIn : copy.signIn}
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">{copy.fullName}</Label>
                    <Input id="signup-name" required value={signupName} onChange={(event) => setSignupName(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{copy.email}</Label>
                    <Input id="signup-email" type="email" required value={signupEmail} onChange={(event) => setSignupEmail(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-pass">{copy.password}</Label>
                    <Input
                      id="signup-pass"
                      type="password"
                      required
                      minLength={6}
                      value={signupPassword}
                      onChange={(event) => setSignupPassword(event.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? copy.signingUp : copy.signUp}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}
