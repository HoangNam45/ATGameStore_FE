"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, Search } from "lucide-react";
import { withOwnerProtection } from "@/lib/ownerProtection";
import { ProductWithCredentials } from "@/lib/firebaseClient";
import apiHelpers from "@/lib/apiHelpers";
import { useAuth } from "@/lib/authContext";
import { AccountForm } from "@/components/account-form";
import { deleteImage } from "@/lib/imageUploadService";

function OwnerDashboard() {
  const { user } = useAuth();
  console.log("Authenticated user:", user);
  const [products, setProducts] = useState<ProductWithCredentials[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] =
    useState<ProductWithCredentials | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Load products
  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user]);

  const loadProducts = async () => {
    if (!user) return;

    try {
      setLoading(true);
      // Use backend API instead of direct Firebase call
      const response =
        await apiHelpers.ownerProductApi.getAllProductsWithCredentials();

      if (response.success && response.data) {
        setProducts(response.data);
      } else {
        console.error("Error loading products:", response.message);
        alert(response.message || "Có lỗi xảy ra khi tải danh sách sản phẩm");
      }
    } catch (error) {
      console.error("Error loading products:", error);
      alert("Có lỗi xảy ra khi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle delete product
  const handleDeleteProduct = async (productId: string) => {
    if (!user) return;

    if (confirm("Bạn có chắc chắn muốn xóa sản phẩm này?")) {
      try {
        // Find the product to get its images
        const productToDelete = products.find((p) => p.id === productId);

        // Use backend API to delete product
        const response = await apiHelpers.ownerProductApi.deleteProduct(
          productId
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to delete product");
        }

        // Collect all image URLs to delete
        const imageUrlsToDelete: string[] = [];

        if (productToDelete) {
          // Add regular images
          if (productToDelete.images && productToDelete.images.length > 0) {
            imageUrlsToDelete.push(...productToDelete.images);
          }

          // Add thumbnail image if different from regular images
          if (
            productToDelete.thumbnailImage &&
            !imageUrlsToDelete.includes(productToDelete.thumbnailImage)
          ) {
            imageUrlsToDelete.push(productToDelete.thumbnailImage);
          }
        }

        // Delete all images from server
        console.log("🗑️ Deleting images:", imageUrlsToDelete);

        for (const imageUrl of imageUrlsToDelete) {
          try {
            // Extract filename from URL (handle both localhost and production URLs)
            const urlParts = imageUrl.split("/");
            const filename = urlParts[urlParts.length - 1]; // Get last part after '/'

            if (filename && filename.includes(".")) {
              // Basic check for valid filename
              console.log("🗑️ Deleting image file:", filename);
              await deleteImage(filename);
            } else {
              console.warn("⚠️ Invalid filename extracted from URL:", imageUrl);
            }
          } catch (error) {
            console.error(
              "❌ Error deleting image from server:",
              imageUrl,
              error
            );
            // Continue with other images even if one fails
          }
        }

        await loadProducts(); // Reload products
      } catch (error) {
        console.error("Error deleting product:", error);
        alert("Có lỗi xảy ra khi xóa sản phẩm");
      }
    }
  };

  // Handle edit product button click
  const handleEditProductClick = (product: ProductWithCredentials) => {
    setSelectedProduct(product);
    setIsEditDialogOpen(true);
  };

  // Check if product code already exists
  const checkProductCodeExists = (
    productCode: string,
    excludeId?: string
  ): boolean => {
    return products.some(
      (product) =>
        product.productCode === productCode && product.id !== excludeId
    );
  };

  // Handle adding product
  const handleAddProduct = async (
    productData: Omit<
      ProductWithCredentials,
      "id" | "createdAt" | "updatedAt" | "createdBy"
    >
  ) => {
    try {
      if (!user) return;

      // Check if product code already exists
      if (checkProductCodeExists(productData.productCode)) {
        alert("Mã sản phẩm đã tồn tại. Vui lòng chọn mã khác.");
        return;
      }

      // Use backend API to add product
      const response = await apiHelpers.ownerProductApi.addProduct(productData);

      if (!response.success) {
        throw new Error(response.message || "Failed to add product");
      }

      handleFormSuccess();
    } catch (error) {
      console.error("Error adding product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi thêm sản phẩm"
      );
    }
  };

  // Handle updating product
  const handleUpdateProduct = async (
    productData: Omit<
      ProductWithCredentials,
      "id" | "createdAt" | "updatedAt" | "createdBy"
    >
  ) => {
    try {
      if (!selectedProduct || !user) return;

      // Check if product code already exists (excluding current product)
      if (checkProductCodeExists(productData.productCode, selectedProduct.id)) {
        alert("Mã sản phẩm đã tồn tại. Vui lòng chọn mã khác.");
        return;
      }

      // Use backend API to update product
      const response = await apiHelpers.ownerProductApi.updateProduct(
        selectedProduct.id,
        productData
      );

      if (!response.success) {
        throw new Error(response.message || "Failed to update product");
      }

      handleFormSuccess();
    } catch (error) {
      console.error("Error updating product:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Có lỗi xảy ra khi cập nhật sản phẩm"
      );
    }
  };

  // Handle form success
  const handleFormSuccess = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setSelectedProduct(null);
    loadProducts(); // Reload products
  };

  // Get type badge variant
  const getTypeVariant = (type: string) => {
    return type === "available" ? "default" : "secondary";
  };

  // Get status badge variant
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

  // Get status text
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 mt-20">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Quản lý sản phẩm
            </h1>
          </div>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Thêm sản phẩm mới
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Thêm sản phẩm mới</DialogTitle>
              </DialogHeader>
              <AccountForm
                onSubmit={handleAddProduct}
                onCancel={() => setIsAddDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Tổng sản phẩm
              </CardTitle>
              <Package className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {products.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Có sẵn</CardTitle>
              <Package className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {
                  products.filter((product) => product.type === "available")
                    .length
                }
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Đặt trước</CardTitle>
              <Package className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {
                  products.filter((product) => product.type === "preorder")
                    .length
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm theo tên, mã sản phẩm hoặc danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Đang tải...</span>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ảnh</TableHead>
                    <TableHead>Tên sản phẩm</TableHead>
                    <TableHead>Mã sản phẩm</TableHead>
                    <TableHead>Giá</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Loại</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <Image
                          src={
                            product.thumbnailImage ||
                            product.images[0] ||
                            "/placeholder.svg"
                          }
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-12 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        <div className="truncate" title={product.name}>
                          {product.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="px-2 py-1 bg-muted rounded text-xs">
                          {product.productCode}
                        </code>
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatPrice(product.price)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {product.server || "JP"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.gameAccount ? (
                          <Badge
                            variant="default"
                            className="bg-green-100 text-green-700"
                          >
                            Có
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-orange-300 text-orange-600"
                          >
                            Chưa có
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getTypeVariant(product.type)}>
                          {product.type === "available"
                            ? "Có sẵn"
                            : "Đặt trước"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusVariant(
                            product.status || "in_stock"
                          )}
                        >
                          {getStatusText(product.status || "in_stock")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditProductClick(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteProduct(product.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchTerm
                    ? "Không tìm thấy sản phẩm phù hợp"
                    : "Chưa có sản phẩm nào"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chỉnh sửa sản phẩm</DialogTitle>
            </DialogHeader>
            {selectedProduct && (
              <AccountForm
                account={selectedProduct}
                onSubmit={handleUpdateProduct}
                onCancel={() => setIsEditDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </main>

      <Footer />
    </div>
  );
}

export default withOwnerProtection(OwnerDashboard);
