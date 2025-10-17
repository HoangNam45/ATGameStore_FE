"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/header";
import { Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { SakuraPetals } from "@/components/sakura-petals";
import { OTPVerification } from "@/components/otp-verification";
import {
  signUpWithEmail,
  signInWithGoogle,
  signInWithEmail,
} from "@/lib/firebaseClient";
import { authApi } from "@/lib/apiHelpers";
import { useAuth } from "@/lib/authContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState<"register" | "verify-otp">("register");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && user) {
      router.push("/");
    }
  }, [user, authLoading, router]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <>
        <Header />
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <SakuraPetals />
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Đang tải...</p>
          </div>
        </div>
      </>
    );
  }

  if (user) {
    return null;
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    if (!username.trim()) {
      errors.username = "Tên người dùng không được để trống";
    } else if (username.trim().length < 3) {
      errors.username = "Tên người dùng phải có ít nhất 3 ký tự";
    } else if (
      !/^[a-zA-Z0-9àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ\s_-]+$/.test(
        username
      )
    ) {
      errors.username =
        "Tên người dùng chỉ được chứa chữ cái, số, dấu cách, dấu _ và -";
    }

    if (!email.trim()) {
      errors.email = "Email không được để trống";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Email không hợp lệ";
    }

    if (!password) {
      errors.password = "Mật khẩu không được để trống";
    } else if (password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    if (!confirm) {
      errors.confirm = "Vui lòng xác nhận mật khẩu";
    } else if (password !== confirm) {
      errors.confirm = "Mật khẩu không khớp";
    }

    if (!terms) {
      errors.terms = "Bạn phải đồng ý với điều khoản dịch vụ";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Bước 1: Gửi OTP
      const otpResult = await authApi.register(email, username);

      if (otpResult.success) {
        // Kiểm tra nếu là gửi lại OTP
        if (otpResult.data?.isResend) {
          setSuccess("OTP mới đã được gửi đến email của bạn");
        }

        // Chuyển sang step verify OTP
        setStep("verify-otp");
      } else {
        setError(otpResult.message || "Gửi OTP thất bại");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  async function handleOTPVerificationSuccess() {
    setLoading(true);

    try {
      // Bước 1: Tạo tài khoản Firebase sau khi verify OTP (tự động đăng nhập)
      const userCredential = await signUpWithEmail(email, password, username);
      console.log("User created:", userCredential.user.uid);

      // Bước 2: Đánh dấu hoàn tất đăng ký (cleanup OTP)
      await authApi.completeRegistration(email);
      console.log("Registration completed");

      // Bước 3: Hiển thị thông báo thành công và chờ useAuth context cập nhật
      setSuccess("Đăng ký thành công! Đang chuyển hướng...");

      // useEffect sẽ tự động redirect khi useAuth context detect user login
    } catch (err: unknown) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error ? err.message : "Hoàn tất đăng ký thất bại"
      );
    } finally {
      setLoading(false);
    }
  }

  function handleBackToRegister() {
    setStep("register");
    setError(null);
    setSuccess(null);
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);

    try {
      await signInWithGoogle();
      // Router will automatically redirect due to useEffect
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Đăng ký Google thất bại");
    } finally {
      setLoading(false);
    }
  }

  // Hiển thị OTP verification step
  if (step === "verify-otp") {
    return (
      <>
        <Header />
        <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
          <SakuraPetals />
          <OTPVerification
            email={email}
            username={username}
            onVerificationSuccess={handleOTPVerificationSuccess}
            onBack={handleBackToRegister}
            loading={loading}
            error={error}
            success={success}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
        <SakuraPetals />

        <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
                {"AT"}
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Đăng ký tài khoản
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Tạo tài khoản để bắt đầu mua sắm tài khoản Project Sekai
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-foreground">
                  Tên người dùng
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className={`bg-background border-border text-foreground ${
                    fieldErrors.username ? "border-destructive" : ""
                  }`}
                  required
                  disabled={loading}
                />
                {fieldErrors.username && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`bg-background border-border text-foreground ${
                    fieldErrors.email ? "border-destructive" : ""
                  }`}
                  required
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-background border-border text-foreground pr-10 ${
                      fieldErrors.password ? "border-destructive" : ""
                    }`}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {fieldErrors.password && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground">
                  Xác nhận mật khẩu
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className={`bg-background border-border text-foreground pr-10 ${
                      fieldErrors.confirm ? "border-destructive" : ""
                    }`}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {fieldErrors.confirm && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.confirm}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={terms}
                  onCheckedChange={(checked) => setTerms(checked as boolean)}
                  className={fieldErrors.terms ? "border-destructive" : ""}
                  disabled={loading}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tôi đồng ý với{" "}
                  <Link href="/terms" className="text-primary hover:underline">
                    điều khoản dịch vụ
                  </Link>{" "}
                  và{" "}
                  <Link
                    href="/privacy"
                    className="text-primary hover:underline"
                  >
                    chính sách bảo mật
                  </Link>
                </Label>
              </div>

              {fieldErrors.terms && (
                <p className="text-sm text-destructive">{fieldErrors.terms}</p>
              )}

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang xử lý...
                  </div>
                ) : (
                  "Đăng ký"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">Hoặc</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleGoogle}
              className="w-full cursor-pointer border-border text-foreground hover:bg-accent bg-transparent"
              disabled={loading}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Đăng ký với Google
            </Button>
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Đăng nhập
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </>
  );
}
