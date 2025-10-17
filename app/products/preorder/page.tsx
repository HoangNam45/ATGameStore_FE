"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/lib/firebaseClient";
import { SakuraPetals } from "@/components/sakura-petals";

export default function PreorderProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serverFilter, setServerFilter] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 20;

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    filterProducts();
  }, [products, searchTerm, statusFilter, serverFilter, priceRange]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/products/preorder");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        setProducts(result.data);
      } else {
        console.error("API error:", result.error);
        setProducts([]);
      }
    } catch (error) {
      console.error("Error loading products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Format price to VND
  const formatPrice = (price: string): string => {
    // Remove any existing currency symbols and spaces
    const cleanPrice = price.replace(/[^\d]/g, "");
    if (!cleanPrice) return price;

    const number = parseInt(cleanPrice);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      minimumFractionDigits: 0,
    }).format(number);
  };

  // Parse price for filtering
  const parsePrice = (price: string): number => {
    const cleanPrice = price.replace(/[^\d]/g, "");
    return parseInt(cleanPrice) || 0;
  };

  // Handle search
  const handleSearch = () => {
    setSearchTerm(searchInput);
    setCurrentPage(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const filterProducts = () => {
    let filtered = products;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.productCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (product) => (product.status || "in_stock") === statusFilter
      );
    }

    // Filter by server
    if (serverFilter !== "all") {
      filtered = filtered.filter(
        (product) => (product.server || "JP") === serverFilter
      );
    }

    // Filter by price range
    if (priceRange !== "all") {
      filtered = filtered.filter((product) => {
        const price = parsePrice(product.price);
        switch (priceRange) {
          case "under-100k":
            return price < 100000;
          case "100k-500k":
            return price >= 100000 && price <= 500000;
          case "500k-1m":
            return price > 500000 && price <= 1000000;
          case "1m-5m":
            return price > 1000000 && price <= 5000000;
          case "over-5m":
            return price > 5000000;
          default:
            return true;
        }
      });
    }

    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Pagination logic
  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(
    indexOfFirstProduct,
    indexOfLastProduct
  );
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

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

  return (
    <div className="relative min-h-screen bg-background">
      <SakuraPetals />
      <Header />

      <main className="container mx-auto px-4 py-8 mt-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Tài khoản đặt trước
          </h1>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
          <div className="lg:col-span-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="in_stock">Còn hàng</SelectItem>
                <SelectItem value="out_of_stock">Hết hàng</SelectItem>
                <SelectItem value="discontinued">Ngừng bán</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={serverFilter} onValueChange={setServerFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả server" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả server</SelectItem>
                <SelectItem value="JP">JP (Japan)</SelectItem>
                <SelectItem value="NA">NA (North America)</SelectItem>
                <SelectItem value="TW">TW (Taiwan)</SelectItem>
                <SelectItem value="KR">KR (Korea)</SelectItem>
                <SelectItem value="EN">EN (English)</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Tất cả khoảng giá" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả khoảng giá</SelectItem>
                <SelectItem value="under-100k">Dưới 100,000 VND</SelectItem>
                <SelectItem value="100k-500k">100,000 - 500,000 VND</SelectItem>
                <SelectItem value="500k-1m">500,000 - 1,000,000 VND</SelectItem>
                <SelectItem value="1m-5m">1,000,000 - 5,000,000 VND</SelectItem>
                <SelectItem value="over-5m">Trên 5,000,000 VND</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results summary */}
        <div className="mb-6">
          <p className="text-muted-foreground">
            Hiển thị {currentProducts.length} trong tổng số{" "}
            {filteredProducts.length} sản phẩm
          </p>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Đang tải...</span>
          </div>
        ) : currentProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {currentProducts.map((product) => (
              <Link key={product.id} href={`/account/${product.productCode}`}>
                <Card className="group cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 hover:border-primary/20">
                  <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-t-lg">
                      <Image
                        src={
                          product.thumbnailImage ||
                          product.images[0] ||
                          "/placeholder.svg"
                        }
                        alt={product.name}
                        width={300}
                        height={200}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-2 right-2 space-y-1">
                        <Badge
                          variant={getStatusVariant(
                            product.status || "in_stock"
                          )}
                        >
                          {getStatusText(product.status || "in_stock")}
                        </Badge>
                        <Badge variant="secondary" className="block">
                          {product.server || "JP"}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Mã:{" "}
                          <span className="font-mono">
                            {product.productCode}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xl text-primary">
                          {formatPrice(product.price)}
                        </span>
                        <div className="flex gap-1">
                          <Badge variant="outline">Đặt trước</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              Không tìm thấy sản phẩm phù hợp
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSearchInput("");
                setStatusFilter("all");
                setServerFilter("all");
                setPriceRange("all");
              }}
            >
              Xóa bộ lọc
            </Button>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Trước
            </Button>

            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNumber = i + Math.max(1, currentPage - 2);
              if (pageNumber > totalPages) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNumber)}
                >
                  {pageNumber}
                </Button>
              );
            })}

            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Sau
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
