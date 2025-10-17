"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Mail, Timer, RefreshCw } from "lucide-react";
import { authApi } from "@/lib/apiHelpers";

interface OTPVerificationProps {
  email: string;
  username: string;
  onVerificationSuccess: () => void;
  onBack: () => void;
  loading?: boolean; // External loading state
  error?: string | null; // External error state
  success?: string | null; // External success state
}

export function OTPVerification({
  email,
  username,
  onVerificationSuccess,
  onBack,
  loading: externalLoading = false,
  error: externalError = null,
  success: externalSuccess = null,
}: OTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Combine internal and external states
  const isLoading = loading || externalLoading;
  const currentError = externalError || error;
  const currentSuccess = externalSuccess || success;

  // Load countdown từ API khi component mount
  useEffect(() => {
    const loadCountdown = async () => {
      try {
        const result = await authApi.getResendCountdown(email);
        if (result.success && result.data?.countdown) {
          setCountdown(result.data.countdown);
        }
      } catch (err) {
        console.error("Failed to load countdown:", err);
      }
    };

    loadCountdown();
  }, [email]);

  // Countdown timer cho resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Auto-format OTP input (thêm space sau 3 số đầu)
  const handleOTPChange = (value: string) => {
    // Chỉ cho phép số
    const numericValue = value.replace(/\D/g, "");

    // Giới hạn 6 số
    const truncatedValue = numericValue.slice(0, 6);

    // Format: 123 456
    let formattedValue = truncatedValue;
    if (truncatedValue.length > 3) {
      formattedValue = `${truncatedValue.slice(0, 3)} ${truncatedValue.slice(
        3
      )}`;
    }

    setOtp(formattedValue);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Xóa space để lấy OTP thuần
    const cleanOTP = otp.replace(/\s/g, "");

    if (!cleanOTP || cleanOTP.length !== 6) {
      setError("Vui lòng nhập đầy đủ 6 số OTP");
      return;
    }

    setLoading(true);

    try {
      const result = await authApi.verifyOTP(email, cleanOTP);

      if (result.success) {
        setSuccess("Xác thực OTP thành công!");
        setTimeout(() => {
          onVerificationSuccess();
        }, 1500);
      } else {
        setError(result.message || "Xác thực OTP thất bại");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      const result = await authApi.resendOTP(email);

      if (result.success) {
        setSuccess("OTP mới đã được gửi đến email của bạn");
        setCountdown(60); // 60 giây countdown
        setOtp(""); // Clear OTP field
      } else {
        setError(result.message || "Gửi lại OTP thất bại");
      }
    } catch (err) {
      setError("Đã có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md relative z-10 border-border/50 bg-card/95 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Mail className="h-8 w-8" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-foreground">
          Xác thực OTP
        </CardTitle>
        <CardDescription className="text-muted-foreground">
          Chúng tôi đã gửi mã xác thực 6 số đến email
          <br />
          <span className="font-medium text-foreground">{email}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp" className="text-foreground">
              Mã xác thực (OTP)
            </Label>
            <Input
              id="otp"
              type="text"
              value={otp}
              onChange={(e) => handleOTPChange(e.target.value)}
              className="bg-background border-border text-foreground text-center text-2xl font-mono tracking-widest"
              maxLength={7} // 6 numbers + 1 space
              required
              disabled={isLoading || resendLoading}
              autoComplete="one-time-code"
            />
            <p className="text-xs text-muted-foreground text-center">
              Nhập 6 số mã xác thực từ email
            </p>
          </div>

          {currentError && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{currentError}</p>
            </div>
          )}

          {currentSuccess && (
            <div className="p-3 rounded-md bg-green-50 border border-green-200">
              <p className="text-sm text-green-700">{currentSuccess}</p>
            </div>
          )}

          <Button
            type="submit"
            className="w-full cursor-pointer bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={isLoading || resendLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Đang xác thực...
              </div>
            ) : (
              "Xác thực OTP"
            )}
          </Button>
        </form>

        <div className="space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Chưa nhận được mã?
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleResendOTP}
            className="w-full cursor-pointer border-border text-foreground hover:bg-accent bg-transparent"
            disabled={isLoading || resendLoading || countdown > 0}
          >
            {resendLoading ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Đang gửi...
              </div>
            ) : countdown > 0 ? (
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4" />
                Gửi lại sau {countdown}s
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4" />
                Gửi lại OTP
              </div>
            )}
          </Button>

          <Button
            variant="ghost"
            onClick={onBack}
            className="w-full text-muted-foreground hover:text-foreground"
            disabled={isLoading || resendLoading}
          >
            ← Quay lại trang đăng ký
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
