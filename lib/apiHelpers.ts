import { Product } from "@/lib/firebaseClient";

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

// Generic API response interface
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

// Helper function to make API calls
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_BASE_URL}${endpoint}`;

    // Debug request details
    console.log("🌐 Making API call:", {
      url,
      method: options.method || "GET",
      body: options.body,
      bodyType: typeof options.body,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    // Luôn parse JSON response, kể cả khi có error
    const data = await response.json();

    if (!response.ok) {
      // Trả về error response từ server thay vì throw
      return {
        success: false,
        message: data.message || `HTTP error! status: ${response.status}`,
        error:
          data.error ||
          data.message ||
          `HTTP error! status: ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Product API functions
export const productApi = {
  // Get all products
  getAll: async (): Promise<Product[]> => {
    const result = await apiCall<Product[]>("/api/products");
    return result.success ? result.data || [] : [];
  },

  // Get product by code
  getByCode: async (productCode: string): Promise<Product | null> => {
    const result = await apiCall<Product>(`/api/products/${productCode}`);
    return result.success ? result.data || null : null;
  },

  // Get available products
  getAvailable: async (): Promise<Product[]> => {
    const result = await apiCall<Product[]>("/api/products/available");
    return result.success ? result.data || [] : [];
  },

  // Get preorder products
  getPreorder: async (): Promise<Product[]> => {
    const result = await apiCall<Product[]>("/api/products/preorder");
    return result.success ? result.data || [] : [];
  },
};

// Owner API functions (require authentication)
export const ownerApi = {
  // Get products with credentials (owner only)
  getProductsWithCredentials: async (ownerUid: string): Promise<any[]> => {
    const result = await apiCall<any[]>("/api/owner/products", {
      headers: {
        "x-owner-uid": ownerUid,
      },
    });
    return result.success ? result.data || [] : [];
  },
};

// Auth API functions
export const authApi = {
  // Đăng ký - Gửi OTP
  register: async (
    email: string,
    username: string
  ): Promise<ApiResponse<{ email: string; isResend?: boolean }>> => {
    return await apiCall<{ email: string; isResend?: boolean }>(
      "/api/auth/register",
      {
        method: "POST",
        body: JSON.stringify({ email, username }),
      }
    );
  },

  // Xác thực OTP
  verifyOTP: async (
    email: string,
    otp: string
  ): Promise<ApiResponse<{ email: string; username: string }>> => {
    return await apiCall<{ email: string; username: string }>(
      "/api/auth/verify-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }
    );
  },

  // Gửi lại OTP
  resendOTP: async (email: string): Promise<ApiResponse<any>> => {
    return await apiCall<any>("/api/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Kiểm tra trạng thái xác thực
  checkVerification: async (
    email: string
  ): Promise<ApiResponse<{ email: string; verified: boolean }>> => {
    return await apiCall<{ email: string; verified: boolean }>(
      `/api/auth/check-verification?email=${encodeURIComponent(email)}`
    );
  },

  // Hoàn tất đăng ký
  completeRegistration: async (
    email: string
  ): Promise<ApiResponse<{ email: string }>> => {
    return await apiCall<{ email: string }>("/api/auth/complete-registration", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },

  // Lấy thời gian countdown cho resend OTP
  getResendCountdown: async (
    email: string
  ): Promise<ApiResponse<{ email: string; countdown: number }>> => {
    return await apiCall<{ email: string; countdown: number }>(
      `/api/auth/resend-countdown?email=${encodeURIComponent(email)}`
    );
  },
};

// Product API với credentials (Owner only)
const ownerProductApi = {
  // Get Firebase ID token for authentication
  getAuthToken: async (): Promise<string | null> => {
    try {
      const { auth } = await import("./firebaseClient");
      if (auth.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  },

  // Get all products with credentials (Owner only)
  getAllProductsWithCredentials: async (): Promise<ApiResponse<any[]>> => {
    const token = await ownerProductApi.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    return await apiCall<any[]>("/api/products/credentials", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Get product by ID with credentials (Owner only)
  getProductByIdWithCredentials: async (
    productId: string
  ): Promise<ApiResponse<any>> => {
    const token = await ownerProductApi.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    return await apiCall<any>(`/api/products/credentials/${productId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // Add new product (Owner only)
  addProduct: async (productData: any): Promise<ApiResponse<any>> => {
    const token = await ownerProductApi.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    console.log("🔥 Sending product data:", productData);

    return await apiCall<any>("/api/products", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json", // Explicitly set
      },
      body: JSON.stringify(productData),
    });
  },

  // Update product (Owner only)
  updateProduct: async (
    productId: string,
    productData: any
  ): Promise<ApiResponse<any>> => {
    const token = await ownerProductApi.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    return await apiCall<any>(`/api/products/${productId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(productData),
    });
  },

  // Delete product (Owner only)
  deleteProduct: async (productId: string): Promise<ApiResponse<any>> => {
    const token = await ownerProductApi.getAuthToken();
    if (!token) {
      return {
        success: false,
        message: "Authentication required",
      };
    }

    return await apiCall<any>(`/api/products/${productId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};

export default {
  productApi,
  ownerApi,
  authApi,
  ownerProductApi,
};
