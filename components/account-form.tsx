"use client";

import React, { useState, useEffect } from "react";
import {
  ProductWithCredentials,
  AccountSpecification,
} from "@/lib/firebaseClient";
import { uploadMultipleImages, UploadedImage } from "@/lib/imageUploadService";
import {
  encryptGameCredential,
  decryptGameCredential,
  createSecurePlaceholder,
} from "@/lib/encryption";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { Plus, Eye, EyeOff, Shield } from "lucide-react";

interface AccountFormProps {
  account?: ProductWithCredentials;
  onSubmit: (
    productData: Omit<
      ProductWithCredentials,
      "id" | "createdAt" | "updatedAt" | "createdBy"
    >
  ) => void;
  onCancel: () => void;
}

export function AccountForm({ account, onSubmit, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    productCode: "",
    price: "",
    description: "",
    images: [] as string[],
    thumbnailImage: "" as string,
    specifications: [] as AccountSpecification[],
    type: "available" as "available" | "preorder",
    status: "in_stock" as "in_stock" | "out_of_stock" | "discontinued",
    server: "JP" as "NA" | "JP" | "TW" | "KR" | "EN" | "Global",
    // Thông tin tài khoản game (chỉ dành cho owner)
    gameUsername: "",
    gamePassword: "",
  });

  const [newSpec, setNewSpec] = useState({ label: "", value: "" });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    thumbnail: false,
    images: false,
  });

  const handleFileUpload = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      const currentImageCount = formData.images.length + uploadedFiles.length;
      const maxNewFiles = Math.max(0, 4 - currentImageCount);

      if (maxNewFiles === 0) {
        alert("Bạn chỉ có thể tải lên tối đa 4 hình ảnh sản phẩm");
        return;
      }

      const filesToAdd = fileArray.slice(0, maxNewFiles);

      if (fileArray.length > maxNewFiles) {
        alert(
          `Bạn chỉ có thể thêm ${maxNewFiles} hình nữa. Tối đa 4 hình ảnh sản phẩm.`
        );
      }

      setUploadedFiles((prev) => [...prev, ...filesToAdd]);

      // Create preview URLs
      filesToAdd.forEach((file) => {
        const url = URL.createObjectURL(file);
        setImageUrls((prev) => [...prev, url]);
      });

      // Reset validation error when user uploads images
      setValidationErrors((prev) => ({ ...prev, images: false }));
    }
  };

  const handleThumbnailUpload = (file: File | null) => {
    if (file) {
      setThumbnailFile(file);
      const url = URL.createObjectURL(file);
      setThumbnailPreview(url);
      // Reset validation error when user uploads thumbnail
      setValidationErrors((prev) => ({ ...prev, thumbnail: false }));
    }
  };

  const removeThumbnail = () => {
    if (thumbnailPreview && thumbnailPreview.startsWith("blob:")) {
      URL.revokeObjectURL(thumbnailPreview);
    }
    setThumbnailFile(null);
    setThumbnailPreview("");
    setFormData((prev) => ({ ...prev, thumbnailImage: "" }));
  };

  const removeUploadedFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imageUrls[index]);

    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (account) {
      // Giải mã thông tin tài khoản game nếu có
      let gameUsername = "";
      let gamePassword = "";

      if (
        account.gameAccount &&
        account.gameAccount.username &&
        account.gameAccount.password &&
        account.gameAccount.encryptionKeyId
      ) {
        try {
          // Chỉ giải mã nếu dữ liệu thực sự tồn tại và không rỗng
          if (
            account.gameAccount.username.trim() &&
            account.gameAccount.password.trim()
          ) {
            gameUsername = decryptGameCredential(
              account.gameAccount.username,
              account.gameAccount.encryptionKeyId
            );
            gamePassword = decryptGameCredential(
              account.gameAccount.password,
              account.gameAccount.encryptionKeyId
            );
          }
        } catch (error) {
          console.error("Failed to decrypt game credentials:", error);
          // Hiển thị placeholder thay vì lỗi
          gameUsername = createSecurePlaceholder();
          gamePassword = createSecurePlaceholder();
        }
      }

      setFormData({
        name: account.name,
        productCode: account.productCode,
        price: account.price,
        description: account.description,
        images: account.images,
        thumbnailImage: account.thumbnailImage || "",
        specifications: account.specifications,
        type: account.type,
        status: account.status || "in_stock",
        server: account.server || "JP",
        gameUsername,
        gamePassword,
      });
      setImageUrls(account.images);
      setThumbnailPreview(account.thumbnailImage || "");
    }
  }, [account]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    try {
      let imageUrls: string[] = formData.images; // Use existing images for edit
      let thumbnailUrl: string = formData.thumbnailImage; // Use existing thumbnail

      // Upload thumbnail if new file selected
      if (thumbnailFile) {
        const uploadedThumbnail = await uploadMultipleImages([thumbnailFile]);
        thumbnailUrl = uploadedThumbnail[0].url;
      }

      // Upload new files if any
      if (uploadedFiles.length > 0) {
        const uploadedImages = await uploadMultipleImages(uploadedFiles);
        const newImageUrls = uploadedImages.map((img) => img.url);
        imageUrls = [...formData.images, ...newImageUrls];

        // Ensure maximum 4 images
        imageUrls = imageUrls.slice(0, 4);
      }

      // Validation: Check for required images
      const hasValidThumbnail = thumbnailUrl && thumbnailUrl.trim() !== "";
      const hasValidImages = imageUrls && imageUrls.length > 0;

      setValidationErrors({
        thumbnail: !hasValidThumbnail,
        images: !hasValidImages,
      });

      if (!hasValidThumbnail) {
        alert("Vui lòng chọn ảnh đại diện");
        setUploading(false);
        return;
      }

      if (!hasValidImages) {
        alert("Vui lòng chọn ít nhất 1 ảnh sản phẩm");
        setUploading(false);
        return;
      }

      // Mã hóa thông tin tài khoản game
      let gameAccount:
        | { username: string; password: string; encryptionKeyId: string }
        | undefined;

      if (formData.gameUsername.trim() && formData.gamePassword.trim()) {
        try {
          const encryptedUsername = encryptGameCredential(
            formData.gameUsername
          );
          const encryptedPassword = encryptGameCredential(
            formData.gamePassword
          );

          gameAccount = {
            username: encryptedUsername.encryptedData,
            password: encryptedPassword.encryptedData,
            encryptionKeyId: encryptedUsername.keyId,
          };
        } catch (error) {
          console.error("Failed to encrypt game credentials:", error);
          alert("Có lỗi xảy ra khi mã hóa thông tin tài khoản game");
          setUploading(false);
          return;
        }
      }

      onSubmit({
        name: formData.name,
        productCode: formData.productCode,
        price: formData.price,
        description: formData.description,
        images: imageUrls,
        thumbnailImage: thumbnailUrl,
        specifications: formData.specifications,
        type: formData.type,
        status: formData.status,
        server: formData.server,
        gameAccount,
      });
    } catch (error) {
      console.error("Error uploading images:", error);
      alert("Có lỗi xảy ra khi upload hình ảnh");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const addSpecification = () => {
    if (newSpec.label && newSpec.value) {
      setFormData((prev) => ({
        ...prev,
        specifications: [...prev.specifications, { ...newSpec }],
      }));
      setNewSpec({ label: "", value: "" });
    }
  };

  const removeSpecification = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Tên sản phẩm *</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <Label htmlFor="productCode">Mã sản phẩm *</Label>
          <Input
            id="productCode"
            name="productCode"
            value={formData.productCode}
            onChange={handleChange}
            placeholder="Ví dụ: PJSK-001"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Giá (VNĐ) *</Label>
          <Input
            id="price"
            name="price"
            value={formData.price}
            onChange={handleChange}
            placeholder="Ví dụ: 500000"
            required
          />
        </div>
        <div>
          <Label htmlFor="server">Server *</Label>
          <Select
            value={formData.server}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, server: value as any }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn server" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="JP">JP (Japan)</SelectItem>
              <SelectItem value="NA">NA (North America)</SelectItem>
              <SelectItem value="TW">TW (Taiwan)</SelectItem>
              <SelectItem value="KR">KR (Korea)</SelectItem>
              <SelectItem value="EN">EN (English)</SelectItem>
              <SelectItem value="Global">Global</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Loại sản phẩm *</Label>
          <Select
            value={formData.type}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, type: value as any }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại sản phẩm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Có sẵn</SelectItem>
              <SelectItem value="preorder">Đặt trước</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Trạng thái *</Label>
          <Select
            value={formData.status}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, status: value as any }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_stock">Còn hàng</SelectItem>
              <SelectItem value="out_of_stock">Hết hàng</SelectItem>
              <SelectItem value="discontinued">Ngừng bán</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Thông tin tài khoản game - CHỈ DÀNH CHO OWNER */}
      <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-primary" />
          <Label className="text-primary font-semibold">
            Thông tin tài khoản game (Bảo mật cao - Chỉ Owner)
          </Label>
        </div>
        <div className="text-sm  mb-4 p-2 bg-primary/10 rounded">
          Thông tin này sẽ được mã hóa AES-256 và chỉ hiển thị sau khi khách
          hàng thanh toán thành công. Tuyệt đối không được chia sẻ với bất kỳ ai
          khác.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="gameUsername">Tài khoản game</Label>
            <Input
              id="gameUsername"
              name="gameUsername"
              type="text"
              value={formData.gameUsername}
              onChange={handleChange}
              placeholder="Nhập username/email"
              className="border-primary/30 focus:border-primary"
            />
          </div>
          <div>
            <Label htmlFor="gamePassword">Mật khẩu game</Label>
            <div className="relative">
              <Input
                id="gamePassword"
                name="gamePassword"
                type={showPassword ? "text" : "password"}
                value={formData.gamePassword}
                onChange={handleChange}
                placeholder="Nhập mật khẩu"
                className="border-primary/30 focus:border-primary pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-primary/10"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-primary/70" />
                ) : (
                  <Eye className="h-4 w-4 text-primary/70" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Image */}
      <div>
        <Label>Ảnh đại diện *</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            {/* Thumbnail Upload Box */}
            <div
              className={`w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden ${
                validationErrors.thumbnail
                  ? "border-red-500 hover:border-red-600"
                  : "border-gray-300 hover:border-gray-400"
              }`}
              onClick={() =>
                document.getElementById("thumbnail-upload")?.click()
              }
            >
              {thumbnailPreview || formData.thumbnailImage ? (
                <div className="relative w-full h-full">
                  <Image
                    src={thumbnailPreview || formData.thumbnailImage}
                    alt="Thumbnail preview"
                    fill
                    className="object-cover rounded-lg"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeThumbnail();
                    }}
                    className="absolute top-1 right-1 h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-4xl text-gray-400 mb-2">+</div>
                  <div className="text-sm text-gray-500">Chọn ảnh đại diện</div>
                </div>
              )}
            </div>
            <input
              id="thumbnail-upload"
              type="file"
              accept="image/*"
              onChange={(e) =>
                handleThumbnailUpload(e.target.files?.[0] || null)
              }
              className="hidden"
            />
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="text-red-500">*</span> Ảnh đại diện sẽ hiển thị
                trong danh sách sản phẩm
              </p>
              <p>Kích thước đề xuất: 300x300px</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Images */}
      <div>
        <Label>Ảnh sản phẩm *</Label>
        <div className="space-y-3">
          {/* Upload Box for Multiple Images */}
          <div
            className={`w-full min-h-32 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors p-4 ${
              validationErrors.images
                ? "border-red-500 hover:border-red-600"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onClick={() => document.getElementById("images-upload")?.click()}
          >
            <div className="text-center">
              <div className="text-4xl text-gray-400 mb-2">+</div>
              <div className="text-sm text-gray-500">
                Chọn ảnh sản phẩm (có thể chọn nhiều)
              </div>
            </div>
          </div>
          <input
            id="images-upload"
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />

          {/* Preview uploaded images */}
          {(imageUrls.length > 0 || uploadedFiles.length > 0) && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Show existing images */}
              {formData.images.map((image, index) => (
                <div key={`existing-${index}`} className="relative group">
                  <Image
                    src={image}
                    alt={`Existing ${index + 1}`}
                    width={96}
                    height={96}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <span className="absolute bottom-1 left-1 bg-green-500 text-white text-xs px-1 rounded">
                    Đã lưu
                  </span>
                </div>
              ))}

              {/* Show new upload previews */}
              {imageUrls.slice(formData.images.length).map((url, index) => (
                <div key={`new-${index}`} className="relative group">
                  <Image
                    src={url}
                    alt={`Preview ${index + 1}`}
                    width={96}
                    height={96}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      removeUploadedFile(formData.images.length + index)
                    }
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </Button>
                  <span className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-1 rounded">
                    Mới
                  </span>
                </div>
              ))}
            </div>
          )}

          <p className="text-sm text-muted-foreground">
            <span className="text-red-500">*</span> Ảnh sản phẩm chi tiết (tối
            thiểu 1 ảnh, tối đa 4 ảnh). Định dạng hỗ trợ: JPG, PNG, GIF, WEBP
          </p>
        </div>
      </div>

      <div>
        <Label>Chi tiết sản phẩm</Label>
        <div className="space-y-2">
          {formData.specifications.map((spec, index) => (
            <div key={index} className="flex gap-2 p-2 border rounded">
              <span className="font-medium">{spec.label}:</span>
              <span>{spec.value}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => removeSpecification(index)}
              >
                Xóa
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            value={newSpec.label}
            onChange={(e) =>
              setNewSpec((prev) => ({ ...prev, label: e.target.value }))
            }
            placeholder="Chi tiết"
          />
          <Input
            value={newSpec.value}
            onChange={(e) =>
              setNewSpec((prev) => ({ ...prev, value: e.target.value }))
            }
            placeholder="Giá trị"
          />
          <Button type="button" variant="outline" onClick={addSpecification}>
            Thêm
          </Button>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Mô tả</Label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Mô tả chi tiết về sản phẩm..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          rows={3}
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={uploading}
        >
          Hủy
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? "Đang tải..." : account ? "Cập nhật" : "Thêm mới"}
        </Button>
      </div>
    </form>
  );
}
