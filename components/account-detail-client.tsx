"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@/lib/firebaseClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Package, Facebook } from "lucide-react";
import Image from "next/image";

interface AccountDetailClientProps {
  account: Product;
}

export function AccountDetailClient({ account }: AccountDetailClientProps) {
  const router = useRouter();

  // Chỉ lấy tối đa 4 hình ảnh đầu tiên (không tính ảnh đại diện)
  const productImages = account.images.slice(0, 4);

  // State để quản lý ảnh preview hiện tại (mặc định là ảnh đầu tiên)
  const [currentPreviewImage, setCurrentPreviewImage] = useState(
    productImages[0] || account.thumbnailImage || "/placeholder.svg"
  );

  const getStatusText = (status: string) => {
    switch (status) {
      case "in_stock":
        return "Còn hàng";
      case "out_of_stock":
        return "Hết hàng";
      case "discontinued":
        return "Ngừng bán";
      default:
        return "Còn hàng";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "in_stock":
        return "default";
      case "out_of_stock":
        return "destructive";
      case "discontinued":
        return "secondary";
      default:
        return "default";
    }
  };

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

  // Kiểm tra xem có thể mua ngay hay không
  const canPurchase =
    account.type === "available" && account.status === "in_stock";
  const isPreorder = account.type === "preorder";
  const isUnavailable =
    account.status === "out_of_stock" || account.status === "discontinued";

  // Handle buy now button
  const handleBuyNow = () => {
    if (canPurchase) {
      router.push(`/checkout?productId=${account.productCode}`);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 mb-12">
      {/* Image Gallery */}
      <div className="space-y-4">
        {/* Main Preview Image */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-primary/20">
          <Image
            src={currentPreviewImage}
            alt={account.name}
            width={600}
            height={500}
            className="w-full h-[500px] object-cover"
          />
        </div>

        {/* Thumbnail Gallery - Chỉ hiển thị tối đa 4 hình */}
        {productImages.length > 0 && (
          <div className="grid grid-cols-4 gap-3">
            {productImages.map((image: string, index: number) => (
              <div
                key={index}
                className={`relative overflow-hidden rounded-lg border-2 transition-colors cursor-pointer ${
                  currentPreviewImage === image
                    ? "border-primary"
                    : "border-border hover:border-primary"
                }`}
                onClick={() => setCurrentPreviewImage(image)}
              >
                <Image
                  src={image || "/placeholder.svg"}
                  alt={`${account.name} ${index + 1}`}
                  width={96}
                  height={96}
                  className="w-full h-24 object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        <div>
          <h1 className="font-bold text-2xl mb-2 text-foreground text-balance">
            {account.name}
          </h1>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              <span>
                Mã:{" "}
                <span className="font-mono text-foreground">
                  {account.productCode}
                </span>
              </span>
            </div>
            <Badge variant={getStatusVariant(account.status || "in_stock")}>
              {getStatusText(account.status || "in_stock")}
            </Badge>
            <Badge
              variant={account.type === "available" ? "default" : "secondary"}
            >
              {account.type === "available" ? "Có sẵn" : "Đặt trước"}
            </Badge>
            <Badge variant="outline">Server: {account.server || "JP"}</Badge>
          </div>
        </div>

        <div className="border-t border-b border-border py-6">
          <div className="flex items-baseline gap-3 mb-2">
            <span className="font-bold text-5xl text-primary">
              {formatPrice(account.price)}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {canPurchase ? (
            <Button
              size="default"
              onClick={handleBuyNow}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 text-lg h-14"
            >
              Mua ngay
            </Button>
          ) : (
            <Button
              size="default"
              disabled
              className="w-full text-lg h-14 opacity-50 cursor-not-allowed"
            >
              {isPreorder ? "Liên hệ để đặt trước" : "Không thể mua"}
            </Button>
          )}

          {/* Note for preorder */}
          {isPreorder && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-sm text-blue-700">
                  <Facebook className="h-5 w-5" />
                  <span>
                    Với các tài khoản đặt trước vui lòng liên hệ qua Facebook
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Note for unavailable */}
          {isUnavailable && (
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Package className="h-5 w-5" />
                  <span>
                    {account.status === "out_of_stock"
                      ? "Sản phẩm hiện đang hết hàng"
                      : "Sản phẩm đã ngừng kinh doanh"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="bg-secondary/5 border-secondary/20">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Clock className="h-5 w-5 text-secondary" />
              <span className="text-foreground">Giao hàng ngay</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Package className="h-5 w-5 text-secondary" />
              <span className="text-foreground">Hỗ trợ 24/7</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
