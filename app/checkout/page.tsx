"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { Product } from "@/lib/firebaseClient";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CreditCard, Mail, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("productId");

  const [user, setUser] = useState<User | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment states
  const [paymentStep, setPaymentStep] = useState<
    "form" | "payment" | "success"
  >("form");
  const [transactionId, setTransactionId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Ref to store polling interval for cleanup
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        setEmail(currentUser.email);
      }
    });
    return () => unsubscribe();
  }, []);

  // Cleanup polling interval when component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        console.log("🧹 Cleaning up payment polling interval");
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Generate order ID
  useEffect(() => {
    const generateOrderId = () => {
      const timestamp = Date.now().toString(36);
      const random = Math.random().toString(36).substr(2, 5);
      return `ORD-${timestamp}-${random}`.toUpperCase();
    };
    setOrderId(generateOrderId());
  }, []);

  // Load product data
  useEffect(() => {
    const loadProduct = async () => {
      if (productId) {
        try {
          const response = await fetch(`/api/products/${productId}`);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const result = await response.json();

          if (result.success) {
            setProduct(result.data);
          } else {
            console.error("API error:", result.error);
            router.push("/");
          }
        } catch (error) {
          console.error("Error loading product:", error);
          router.push("/");
        }
      }
    };
    loadProduct();
  }, [productId, router]);

  // Format price to VND
  const formatPrice = (price: string): string => {
    const cleanPrice = price.replace(/[^\d]/g, "");
    if (!cleanPrice) return price;

    const number = parseInt(cleanPrice);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(number);
  };

  const handleConfirm = async () => {
    if (!email) {
      alert("Vui lòng nhập email");
      return;
    }

    if (!email.includes("@")) {
      alert("Vui lòng nhập email hợp lệ");
      return;
    }

    if (!product) return;

    setIsSubmitting(true);

    try {
      // Create payment transaction via backend
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/payment/create`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orderId,
            amount: parseInt(product.price.replace(/[^\d]/g, "")),
            productCode: product.productCode,
            email: email,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setTransactionId(result.data.orderCode);
        setQrCode(result.data.qrCode);
        setBankInfo(result.data.bankInfo);
        setPaymentStep("payment");

        // Start polling for payment status
        startPaymentPolling(result.data.orderCode);
      } else {
        alert("Có lỗi xảy ra khi tạo đơn hàng: " + result.error);
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      alert("Có lỗi xảy ra khi tạo đơn hàng");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Poll payment status every 15 seconds
  const startPaymentPolling = (orderCode: string) => {
    // Clear any existing polling first
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    console.log("🔄 Starting payment polling for order:", orderCode);

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/payment/status/${orderCode}`
        );
        const result = await response.json();

        if (result.success && result.data.status === "completed") {
          setPaymentStatus("completed");
          setPaymentStep("success");

          // Clear interval when payment completed
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          console.log("✅ Payment completed, polling stopped");

          // Show success message
          alert(
            "Thanh toán thành công! Thông tin tài khoản game đã được gửi về email của bạn."
          );
        }
      } catch (error) {
        console.error("Error checking payment status:", error);
      }
    }, 15000); // 15 seconds

    // Store interval reference for cleanup
    pollIntervalRef.current = pollInterval;

    // Clear interval after 30 minutes to prevent infinite polling
    setTimeout(() => {
      if (pollIntervalRef.current) {
        console.log("⏰ Payment polling timeout reached, stopping");
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }, 30 * 60 * 1000);
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Đang tải...</h1>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Breadcrumb */}
        <div className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link
            href={`/account/${product.productCode}`}
            className="hover:text-primary transition-colors"
          >
            {product.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">Thanh toán</span>
        </div>

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {paymentStep === "form" && (
            <>
              {/* Order Summary */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      Thông tin đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Product Info */}
                    <div className="flex gap-4 p-4 bg-secondary/5 rounded-lg">
                      <img
                        src={product.thumbnailImage || "/placeholder.svg"}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Mã: {product.productCode}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Server: {product.server || "JP"}
                        </p>
                        <p className="font-bold text-xl text-primary mt-2">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* Order Details */}
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Mã đơn hàng:</span>
                        <span className="font-mono text-primary font-bold">
                          {orderId}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="font-medium">Số tiền thanh toán:</span>
                        <span className="font-bold text-xl text-primary">
                          {formatPrice(product.price)}
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Email Input */}
                    <div className="space-y-3">
                      <Label
                        htmlFor="email"
                        className="flex items-center gap-2"
                      >
                        <Mail className="h-4 w-4" />
                        Email nhận thông tin đơn hàng *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email của bạn"
                        className="text-lg h-12"
                        required
                      />
                      <p className="text-sm text-muted-foreground">
                        Đơn hàng sẽ được gửi tự động về email của bạn sau khi
                        thanh toán.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Method */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Phương thức thanh toán
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-4 h-4 bg-primary rounded-full"></div>
                        <span className="font-semibold">
                          Chuyển khoản ngân hàng
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Quét mã QR hoặc chuyển khoản thủ công
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary mb-2">
                          Tổng cộng
                        </div>
                        <div className="text-3xl font-bold text-foreground">
                          {formatPrice(product.price)}
                        </div>
                      </div>

                      <Button
                        onClick={handleConfirm}
                        disabled={!email || isSubmitting}
                        className="w-full h-14 text-lg"
                      >
                        {isSubmitting ? "Đang xử lý..." : "Xác nhận đơn hàng"}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Bằng cách nhấn "Xác nhận đơn hàng", bạn đồng ý với điều
                        khoản và chính sách của chúng tôi.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {paymentStep === "payment" && (
            <>
              {/* QR Code Payment */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      Thanh toán đơn hàng
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <div className="bg-white p-4 rounded-lg border-2 border-dashed border-primary/30 inline-block">
                        <img
                          src={qrCode}
                          alt="VietQR Code"
                          className="w-64 h-64 mx-auto"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-3">
                        Quét mã QR bằng app ngân hàng để thanh toán
                      </p>
                    </div>

                    <Separator />

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-800 mb-3">
                        Hướng dẫn thanh toán
                      </h3>
                      <ol className="text-sm text-blue-700 space-y-1">
                        <li>1. Mở app ngân hàng trên điện thoại</li>
                        <li>2. Chọn chức năng quét mã QR</li>
                        <li>3. Quét mã QR phía trên</li>
                        <li>4. Kiểm tra thông tin và xác nhận chuyển khoản</li>
                        <li>5. Chờ hệ thống xác nhận thanh toán</li>
                      </ol>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="font-semibold text-yellow-800 mb-2">
                        ⚠️ Lưu ý quan trọng
                      </h3>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        <li>
                          • Chuyển đúng số tiền: {formatPrice(product.price)}
                        </li>
                        <li>• Nội dung: {transactionId}</li>
                        <li>• Không thay đổi nội dung chuyển khoản</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Bank Info Sidebar */}
              <div>
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Thông tin chuyển khoản</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {bankInfo && (
                      <div className="space-y-3">
                        <div>
                          <Label className="text-sm font-medium">
                            Ngân hàng
                          </Label>
                          <p className="font-semibold">{bankInfo.bankName}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Số tài khoản
                          </Label>
                          <p className="font-mono font-semibold">
                            {bankInfo.accountNo}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Chủ tài khoản
                          </Label>
                          <p className="font-semibold">
                            {bankInfo.accountName}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Số tiền</Label>
                          <p className="font-bold text-xl text-primary">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            Nội dung
                          </Label>
                          <p className="font-mono font-semibold text-red-600">
                            {transactionId}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-sm font-medium">
                          Đang chờ thanh toán...
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                      className="w-full"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Quay lại
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {paymentStep === "success" && (
            <div className="lg:col-span-3">
              <Card>
                <CardContent className="text-center py-12">
                  <h2 className="text-2xl font-bold text-green-600 mb-2">
                    Thanh toán thành công
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Thông tin tài khoản game đã được gửi về email: {email}
                  </p>
                  <Button onClick={() => router.push("/")}>Về trang chủ</Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
