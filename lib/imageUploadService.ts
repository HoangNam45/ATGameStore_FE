// Image upload service for backend API
export interface UploadedImage {
  filename: string;
  originalName: string;
  size: number;
  url: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  data?: UploadedImage | UploadedImage[];
  error?: string;
}

// Backend API base URL - adjust this to your backend URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Upload single image
export async function uploadSingleImage(file: File): Promise<UploadedImage> {
  try {
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`${API_BASE_URL}/api/images/upload`, {
      method: "POST",
      body: formData,
    });

    const result: UploadResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Upload failed");
    }

    return result.data as UploadedImage;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error(error instanceof Error ? error.message : "Upload failed");
  }
}

// Upload multiple images
export async function uploadMultipleImages(
  files: File[]
): Promise<UploadedImage[]> {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });

    const response = await fetch(`${API_BASE_URL}/api/images/upload-multiple`, {
      method: "POST",
      body: formData,
    });

    const result: UploadResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Upload failed");
    }

    return result.data as UploadedImage[];
  } catch (error) {
    console.error("Error uploading images:", error);
    throw new Error(error instanceof Error ? error.message : "Upload failed");
  }
}

// Delete image from server
export async function deleteImage(filename: string): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/images/${filename}`, {
      method: "DELETE",
    });

    const result: UploadResponse = await response.json();

    if (!result.success) {
      throw new Error(result.message || "Delete failed");
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    throw new Error(error instanceof Error ? error.message : "Delete failed");
  }
}
