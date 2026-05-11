import React, { createContext, useContext, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { safeStorage } from "@/lib/safe-storage";
import type { Product, CartItem as DBCartItem } from "@shared/schema";

export interface CartItem {
  id: number;
  product: Product;
  quantity: number;
}

interface ServerCartItem extends DBCartItem {
  product: Product;
}

function getOrCreateSessionId(): string {
  let id = safeStorage.getItem("sessionId");
  if (!id) {
    id = Math.random().toString(36).substring(7);
    safeStorage.setItem("sessionId", id);
  }
  return id;
}

interface CartContextType {
  cartItems: CartItem[];
  isLoading: boolean;
  sessionId: string;
  addToCart: (product: Product, quantity: number) => Promise<void>;
  removeFromCart: (productId: number) => Promise<void>;
  removeCartItem: (cartItemId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  updateCartItemQuantity: (cartItemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  refetch: () => Promise<unknown>;
  totalItems: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const cartKey = useMemo(() => ["/api/cart", sessionId] as const, [sessionId]);

  const { data: serverItems = [], isLoading, refetch } = useQuery<ServerCartItem[]>({
    queryKey: cartKey,
    queryFn: async () => {
      const res = await fetch(`/api/cart/${sessionId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cart");
      return res.json();
    },
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const cartItems: CartItem[] = useMemo(
    () =>
      (serverItems || [])
        .filter((it) => it.product)
        .map((it) => ({
          id: it.id,
          product: it.product,
          quantity: it.quantity,
        })),
    [serverItems]
  );

  // Force a real network refetch (not just mark stale)
  const forceRefetch = async () => {
    await queryClient.refetchQueries({ queryKey: cartKey, type: "active", exact: true });
  };

  const addMutation = useMutation({
    mutationFn: async ({ product, quantity }: { product: Product; quantity: number }) => {
      await apiRequest("POST", "/api/cart", {
        sessionId,
        productId: product.id,
        quantity,
      });
    },
    onMutate: async ({ product, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<ServerCartItem[]>(cartKey);
      queryClient.setQueryData<ServerCartItem[]>(cartKey, (old) => {
        const list = old || [];
        const existing = list.find((it) => it.productId === product.id);
        if (existing) {
          return list.map((it) =>
            it.productId === product.id ? { ...it, quantity: it.quantity + quantity } : it
          );
        }
        // optimistic temporary item with a negative id placeholder
        const tempItem: ServerCartItem = {
          id: -Date.now(),
          sessionId,
          productId: product.id,
          quantity,
          addedAt: new Date(),
          product,
        };
        return [...list, tempItem];
      });
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(cartKey, ctx.previous);
    },
    onSettled: () => forceRefetch(),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, quantity }: { id: number; quantity: number }) => {
      await apiRequest("PUT", `/api/cart/${id}`, { quantity });
    },
    onMutate: async ({ id, quantity }) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<ServerCartItem[]>(cartKey);
      queryClient.setQueryData<ServerCartItem[]>(cartKey, (old) =>
        (old || []).map((it) => (it.id === id ? { ...it, quantity } : it))
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(cartKey, ctx.previous);
    },
    onSettled: () => forceRefetch(),
  });

  const removeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/cart/${id}`);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: cartKey });
      const previous = queryClient.getQueryData<ServerCartItem[]>(cartKey);
      queryClient.setQueryData<ServerCartItem[]>(cartKey, (old) =>
        (old || []).filter((it) => it.id !== id)
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(cartKey, ctx.previous);
    },
    onSettled: () => forceRefetch(),
  });

  const findCartItemByProductId = (productId: number): CartItem | undefined =>
    cartItems.find((it) => it.product.id === productId);

  const totalItems = cartItems.reduce((sum, it) => sum + it.quantity, 0);
  const totalAmount = cartItems.reduce(
    (sum, it) => sum + parseFloat(it.product.price) * it.quantity,
    0
  );

  const value: CartContextType = {
    cartItems,
    isLoading,
    sessionId,
    totalItems,
    totalAmount,
    addToCart: async (product, quantity) => {
      await addMutation.mutateAsync({ product, quantity });
    },
    removeCartItem: async (cartItemId) => {
      await removeMutation.mutateAsync(cartItemId);
    },
    removeFromCart: async (productId) => {
      const item = findCartItemByProductId(productId);
      if (item) await removeMutation.mutateAsync(item.id);
    },
    updateCartItemQuantity: async (cartItemId, quantity) => {
      if (quantity <= 0) {
        await removeMutation.mutateAsync(cartItemId);
        return;
      }
      await updateMutation.mutateAsync({ id: cartItemId, quantity });
    },
    updateQuantity: async (productId, quantity) => {
      const item = findCartItemByProductId(productId);
      if (!item) return;
      if (quantity <= 0) {
        await removeMutation.mutateAsync(item.id);
        return;
      }
      await updateMutation.mutateAsync({ id: item.id, quantity });
    },
    clearCart: async () => {
      const previous = queryClient.getQueryData<ServerCartItem[]>(cartKey);
      // optimistic clear
      queryClient.setQueryData<ServerCartItem[]>(cartKey, []);
      const ids = (previous || []).map((it) => it.id).filter((id) => id > 0);
      const results = await Promise.allSettled(
        ids.map((id) => apiRequest("DELETE", `/api/cart/${id}`))
      );
      await forceRefetch();
      const failed = results.filter((r) => r.status === "rejected").length;
      if (failed > 0) {
        throw new Error(`Failed to remove ${failed} cart item(s)`);
      }
    },
    refetch: () => refetch(),
  };

  return React.createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
