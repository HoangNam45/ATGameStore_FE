"use server";

import { getAllProducts, Product } from "@/lib/firebaseClient";

// Server actions cho việc fetch data từ Firebase
// Chỉ sử dụng trong server components hoặc server actions

export async function getProductByCode(
  productCode: string
): Promise<Product | null> {
  try {
    const products = await getAllProducts();
    return products.find((p) => p.productCode === productCode) || null;
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export async function getAvailableProducts(): Promise<Product[]> {
  try {
    const allProducts = await getAllProducts();
    return allProducts.filter((product) => product.type === "available");
  } catch (error) {
    console.error("Error fetching available products:", error);
    return [];
  }
}

export async function getPreorderProducts(): Promise<Product[]> {
  try {
    const allProducts = await getAllProducts();
    return allProducts.filter((product) => product.type === "preorder");
  } catch (error) {
    console.error("Error fetching preorder products:", error);
    return [];
  }
}

export async function getAllProductsAction(): Promise<Product[]> {
  try {
    return await getAllProducts();
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
}
