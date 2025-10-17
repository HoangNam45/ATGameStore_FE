"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, Eye, EyeOff, Shield, CheckCircle } from "lucide-react";
import { decryptGameCredential } from "@/lib/encryption";

interface GameAccountInfoProps {
  gameAccount: {
    username: string;
    password: string;
    encryptionKeyId: string;
  };
  productName: string;
  productCode: string;
  server: string;
  isPurchased: boolean; // Chỉ hiển thị nếu đã thanh toán
}

export function GameAccountInfo({
  gameAccount,
  productName,
  productCode,
  server,
  isPurchased,
}: GameAccountInfoProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!isPurchased) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 mx-auto text-orange-500 mb-4" />
          <h3 className="text-lg font-semibold text-orange-800 mb-2">
            Thông tin tài khoản sẽ hiển thị sau khi thanh toán
          </h3>
          <p className="text-orange-600">
            Vui lòng hoàn tất thanh toán để nhận thông tin đăng nhập tài khoản
            game.
          </p>
        </CardContent>
      </Card>
    );
  }

  let decryptedUsername = "";
  let decryptedPassword = "";

  try {
    decryptedUsername = decryptGameCredential(
      gameAccount.username,
      gameAccount.encryptionKeyId
    );
    decryptedPassword = decryptGameCredential(
      gameAccount.password,
      gameAccount.encryptionKeyId
    );
  } catch (error) {
    console.error("Failed to decrypt game credentials:", error);
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-6 text-center">
          <p className="text-red-600">
            Có lỗi xảy ra khi giải mã thông tin tài khoản. Vui lòng liên hệ hỗ
            trợ.
          </p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Thông tin tài khoản game
          </CardTitle>
          <Badge variant="default" className="bg-green-100 text-green-700">
            Server: {server}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-green-100 rounded-lg">
          <p className="text-sm text-green-700 mb-1">
            <strong>Sản phẩm:</strong> {productName}
          </p>
          <p className="text-sm text-green-700">
            <strong>Mã sản phẩm:</strong> {productCode}
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-800">
            Tài khoản / Username:
          </label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-white border border-green-200 rounded-md font-mono text-sm">
              {decryptedUsername}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(decryptedUsername, "username")}
              className="border-green-200 hover:bg-green-100"
            >
              {copiedField === "username" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-green-800">
            Mật khẩu / Password:
          </label>
          <div className="flex gap-2">
            <div className="flex-1 p-3 bg-white border border-green-200 rounded-md font-mono text-sm relative">
              {showPassword
                ? decryptedPassword
                : "•".repeat(decryptedPassword.length)}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="border-green-200 hover:bg-green-100"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(decryptedPassword, "password")}
              className="border-green-200 hover:bg-green-100"
            >
              {copiedField === "password" ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-700">
            <strong>Lưu ý quan trọng:</strong>
          </p>
          <ul className="text-sm text-blue-600 mt-1 space-y-1">
            <li>• Vui lòng đổi mật khẩu ngay sau khi đăng nhập lần đầu</li>
            <li>• Không chia sẻ thông tin tài khoản với người khác</li>
            <li>• Liên hệ hỗ trợ nếu gặp vấn đề khi đăng nhập</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
