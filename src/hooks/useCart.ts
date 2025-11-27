import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';
import Cookies from 'js-cookie';

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
  modelType?: 'grip' | 'throttle' | 'bundle';
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  isLoading: boolean;
  cartId: string | null;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateItemQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setCartId: (id: string) => void;
  totalItems: () => number;
  totalPrice: () => number;
};

// Make sure the store is only created on the client
const isClient = typeof window !== 'undefined';
// Get API URL based on environment
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';  // Default to relative URL for production

// Disable backend sync for static deployments (GitHub Pages)
const DISABLE_BACKEND = process.env.NODE_ENV === 'production';

// Cookie options for different environments
const getCookieOptions = () => {
  return {
    expires: 30, // 30 days
    path: '/',
    secure: true, // Always use secure in production
    sameSite: 'none' as 'none', // Always use none for cross-domain in production
  };
};

// Custom storage adapter for using cookies
const cookieStorage = {
  getItem: (name: string): string | null => {
    if (!isClient) return null;
    const cookieValue = Cookies.get(name);
    return cookieValue ? cookieValue : null;
  },
  setItem: (name: string, value: string): void => {
    if (!isClient) return;
    Cookies.set(name, value, getCookieOptions());
  },
  removeItem: (name: string): void => {
    if (!isClient) return;
    Cookies.remove(name, { path: '/' });
  }
};

// Get CSRF token from cookies
const getCsrfToken = () => {
  return Cookies.get('csrftoken');
};

// Helper to prepare headers with CSRF token
const prepareHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  const csrfToken = getCsrfToken();
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  return headers;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      isLoading: false,
      cartId: null,
      
      setCartId: (id: string) => {
        set({ cartId: id });
        if (isClient) {
          Cookies.set('cart_id', id, getCookieOptions());
        }
      },
      
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      syncWithBackend: async () => {
        if (!isClient || DISABLE_BACKEND) return;
        
        try {
          set({ isLoading: true });
          
          // Try to get cart ID from cookies if not in state
          const cartIdFromCookie = Cookies.get('cart_id');
          if (cartIdFromCookie && !get().cartId) {
            set({ cartId: cartIdFromCookie });
          }
          
          console.log('Syncing cart with backend...');
          
          // Always use trailing slash with Django
          const response = await fetch(`${API_URL}/cart/current/`, {
            credentials: 'include',
            headers: prepareHeaders()
          });
          
          if (!response.ok) {
            console.error('Bad response:', response.status, response.statusText);
            throw new Error(`Failed to fetch cart: ${response.status}`);
          }
          
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            throw new Error('Invalid response from server');
          }
          
          console.log('Cart data from backend:', data);
          
          // Save the cart ID for future requests
          if (data.cart_id) {
            set({ cartId: data.cart_id });
            // Store cart_id in a cookie
            Cookies.set('cart_id', data.cart_id, getCookieOptions());
          }
          
          // Transform backend items to match our format
          if (data.items && Array.isArray(data.items)) {
            const items = data.items.map((item: any) => ({
              id: item.product.id.toString(),
              name: item.product.name,
              price: parseFloat(item.product.price),
              quantity: item.quantity,
              image: item.product.image ? item.product.image : undefined
            }));
            
            set({ items });
          }
        } catch (error) {
          console.error('Error syncing cart with backend:', error);
          
          // If backend sync fails, try to load from cookies
          const cartDataJson = cookieStorage.getItem('freedom-puff-cart');
          if (cartDataJson) {
            try {
              const cartData = JSON.parse(cartDataJson);
              if (cartData.state && cartData.state.items) {
                set({ items: cartData.state.items });
              }
            } catch (e) {
              console.error('Error parsing cart data from cookies:', e);
            }
          }
        } finally {
          set({ isLoading: false });
        }
      },
      
      addItem: async (item) => {
        const currentItems = get().items;
        const existingItemIndex = currentItems.findIndex((i) => i.id === item.id);
        
        // First update local state for responsiveness
        if (existingItemIndex !== -1) {
          // Item already exists, update quantity
          const updatedItems = [...currentItems];
          updatedItems[existingItemIndex].quantity += item.quantity;
          set({ items: updatedItems });
        } else {
          // New item, add to cart
          set({ items: [...currentItems, item] });
        }
        
        // Then sync with backend (skip if disabled)
        if (DISABLE_BACKEND) return;
        
        try {
          // Ensure product_id is a valid number by extracting only digits
          // This handles both cases: when it's a numeric ID or a composite string
          let productId = item.id;
          
          // Check if ID contains non-numeric characters (like a composite ID)
          if (!/^\d+$/.test(productId)) {
            console.warn(`Converting non-numeric product ID "${productId}" to numerical ID. This may cause issues.`);
            
            // If it's a composite ID like "1-blackCherry", extract just the number
            const numericPart = productId.match(/^(\d+)/);
            if (numericPart && numericPart[1]) {
              productId = numericPart[1]; // Use just the numeric prefix
            } else {
              console.error("Could not extract numeric ID from:", productId);
              throw new Error("Invalid product ID format");
            }
          }
          
          console.log('Adding item to cart:', { productId, quantity: item.quantity });
          
          // Directly use URL with trailing slash and include CSRF token
          const response = await fetch(`${API_URL}/cart/add_item/`, {
            method: 'POST',
            headers: prepareHeaders(),
            body: JSON.stringify({
              product_id: productId, // Send the validated numeric ID
              quantity: item.quantity
            }),
            credentials: 'include',
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('Add item response error:', response.status, errorText);
            throw new Error(`Failed to add item to cart: ${response.status}`);
          }
          
          let data;
          try {
            data = await response.json();
          } catch (jsonError) {
            console.error('JSON parse error:', jsonError);
            throw new Error('Invalid response from server');
          }
          
          // Update cart ID if it's returned
          if (data.cart_id && !get().cartId) {
            set({ cartId: data.cart_id });
          }
          
          // Re-sync with backend to ensure consistency
          get().syncWithBackend();
        } catch (error) {
          console.error('Error adding item to cart:', error);
        }
      },
      
      removeItem: async (id) => {
        // Update local state first
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
        
        // Skip backend sync if disabled
        if (DISABLE_BACKEND) return;
        
        // Then update backend
        try {
          // Ensure product_id is a valid number by extracting only digits if needed
          let productId = id;
          
          // Check if ID contains non-numeric characters (like a composite ID)
          if (!/^\d+$/.test(productId)) {
            console.warn(`Converting non-numeric product ID "${productId}" to numerical ID`);
            
            // If it's a composite ID like "1-blackCherry", extract just the number
            const numericPart = productId.match(/^(\d+)/);
            if (numericPart && numericPart[1]) {
              productId = numericPart[1]; // Use just the numeric prefix
            } else {
              console.error("Could not extract numeric ID from:", productId);
              throw new Error("Invalid product ID format");
            }
          }
          
          // Include trailing slash for Django URL pattern and CSRF token
          const response = await fetch(`${API_URL}/cart/remove_item/`, {
            method: 'POST',
            headers: prepareHeaders(),
            body: JSON.stringify({
              product_id: productId
            }),
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to remove item from cart');
          }
          
          // Re-sync with backend to ensure consistency
          get().syncWithBackend();
        } catch (error) {
          console.error('Error removing item from cart:', error);
        }
      },
      
      updateItemQuantity: async (id, quantity) => {
        // Update local state first
        set((state) => ({
          items: state.items.map((item) => 
            item.id === id ? { ...item, quantity } : item
          ),
        }));
        
        // Skip backend sync if disabled
        if (DISABLE_BACKEND) return;
        
        // Then update backend
        try {
          // Ensure product_id is a valid number by extracting only digits if needed
          let productId = id;
          
          // Check if ID contains non-numeric characters (like a composite ID)
          if (!/^\d+$/.test(productId)) {
            console.warn(`Converting non-numeric product ID "${productId}" to numerical ID`);
            
            // If it's a composite ID like "1-blackCherry", extract just the number
            const numericPart = productId.match(/^(\d+)/);
            if (numericPart && numericPart[1]) {
              productId = numericPart[1]; // Use just the numeric prefix
            } else {
              console.error("Could not extract numeric ID from:", productId);
              throw new Error("Invalid product ID format");
            }
          }
          
          // Include trailing slash for Django URL pattern
          const response = await fetch(`${API_URL}/cart/update_item/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              product_id: productId,
              quantity
            }),
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to update item quantity');
          }
          
          // Re-sync with backend to ensure consistency
          get().syncWithBackend();
        } catch (error) {
          console.error('Error updating item quantity:', error);
        }
      },
      
      clearCart: async () => {
        // Update local state first
        set({ items: [] });
        
        // Skip backend sync if disabled
        if (DISABLE_BACKEND) return;
        
        // Then update backend
        try {
          // Include trailing slash for Django URL pattern
          const response = await fetch(`${API_URL}/cart/clear/`, {
            method: 'POST',
            credentials: 'include',
          });
          
          if (!response.ok) {
            throw new Error('Failed to clear cart');
          }
        } catch (error) {
          console.error('Error clearing cart:', error);
        }
      },
      
      totalItems: () => {
        return get().items.reduce((acc, item) => acc + item.quantity, 0);
      },
      
      totalPrice: () => {
        return get().items.reduce((acc, item) => acc + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'freedom-puff-cart',
      storage: createJSONStorage(() => cookieStorage),
    }
  )
);

// Hook to sync with the backend whenever the page loads
export const useSyncCart = () => {
  const { syncWithBackend } = useCart();
  
  useEffect(() => {
    // Check if we're on the client-side
    if (typeof window !== 'undefined') {
      syncWithBackend();
    }
  }, [syncWithBackend]);
}; 