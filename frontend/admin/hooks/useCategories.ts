// useCategories.ts
import { useState, useEffect } from "react";
import type { Category } from "@/types/report";

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/categories");
      const data = await res.json();
      const processed = data.data.map((cat: any) => ({
        id: cat._id,
        name: cat.name,
        createdAt: new Date(cat.createdAt ?? Date.now()),
        updatedAt: new Date(cat.updatedAt ?? Date.now()),
        description: { en: "", th: "" },
        color: "", // ถ้ามี field color จริงให้ใส่
      }));
      setCategories(processed);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addCategory = async (payload: Partial<Category>) => {
    const res = await fetch("http://localhost:8080/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const saved = await res.json();
    await fetchCategories();
    return saved;
  };

  const updateCategory = async (id: string, payload: Partial<Category>) => {
    const res = await fetch(`http://localhost:8080/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const updated = await res.json();
    await fetchCategories();
    return updated;
  };

  const deleteCategory = async (id: string) => {
    await fetch(`http://localhost:8080/api/categories/${id}`, {
      method: "DELETE",
    });
    setCategories(categories.filter(c => c.id !== id));
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  };
}
