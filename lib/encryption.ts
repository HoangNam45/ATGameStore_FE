import CryptoJS from "crypto-js";

// Key bảo mật cho mã hóa - trong production nên lưu trong environment variable
const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY || "default-fallback-key-for-dev-only";
const ENCRYPTION_KEY_ID = "v1"; // Version của key để quản lý key rotation

/**
 * Mã hóa thông tin tài khoản game bằng AES-256
 * @param plainText - Text cần mã hóa
 * @returns Object chứa ciphertext và keyId
 */
export function encryptGameCredential(plainText: string): {
  encryptedData: string;
  keyId: string;
} {
  try {
    if (!plainText || plainText.trim() === "") {
      return { encryptedData: "", keyId: ENCRYPTION_KEY_ID };
    }

    // Sử dụng AES-256-CBC với IV ngẫu nhiên
    const encrypted = CryptoJS.AES.encrypt(
      plainText,
      ENCRYPTION_KEY
    ).toString();

    return {
      encryptedData: encrypted,
      keyId: ENCRYPTION_KEY_ID,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt credential");
  }
}

/**
 * Giải mã thông tin tài khoản game (chỉ dành cho owner)
 * @param encryptedData - Dữ liệu đã mã hóa
 * @param keyId - ID của key đã sử dụng
 * @returns Plain text đã giải mã
 */
export function decryptGameCredential(
  encryptedData: string,
  keyId: string
): string {
  try {
    if (!encryptedData || encryptedData.trim() === "") {
      return "";
    }

    // Kiểm tra version của key
    if (keyId !== ENCRYPTION_KEY_ID) {
      throw new Error("Invalid encryption key version");
    }

    const decrypted = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    const plainText = decrypted.toString(CryptoJS.enc.Utf8);

    if (!plainText) {
      throw new Error("Failed to decrypt data");
    }

    return plainText;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt credential");
  }
}

/**
 * Kiểm tra xem dữ liệu có được mã hóa hay không
 * @param data - Dữ liệu cần kiểm tra
 * @returns true nếu dữ liệu đã được mã hóa
 */
export function isEncrypted(data: string): boolean {
  if (!data || data.trim() === "") return false;

  // Kiểm tra format của AES encrypted string
  try {
    CryptoJS.AES.decrypt(data, ENCRYPTION_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Tạo một placeholder an toàn để hiển thị trong UI
 * @param originalLength - Độ dài của text gốc
 * @returns Chuỗi ẩn dạng "••••••••"
 */
export function createSecurePlaceholder(originalLength: number = 8): string {
  return "•".repeat(Math.min(originalLength, 12));
}
