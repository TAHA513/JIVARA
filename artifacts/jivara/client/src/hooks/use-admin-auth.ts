import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { safeStorage } from "@/lib/safe-storage";

interface AdminUser {
  id: number;
  username: string;
  role: string;
}

export function useAdminAuth() {
  const [, setLocation] = useLocation();
  const token = safeStorage.getItem("adminToken");

  const { data: admin, isLoading, error } = useQuery<AdminUser>({
    queryKey: ["/api/admin/verify"],
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isAuthenticated = !!admin && !!token;

  // Logout function
  const logout = () => {
    safeStorage.removeItem("adminToken");
    setLocation("/admin/login");
  };

  // Auto redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !token && window.location.pathname.startsWith("/admin") && window.location.pathname !== "/admin/login") {
      setLocation("/admin/login");
    }
  }, [token, isLoading, setLocation]);

  // Handle API errors (like token expiration)
  useEffect(() => {
    if (error && token) {
      // Token is invalid or expired
      safeStorage.removeItem("adminToken");
      setLocation("/admin/login");
    }
  }, [error, token, setLocation]);

  return {
    admin,
    isLoading,
    isAuthenticated,
    logout
  };
}