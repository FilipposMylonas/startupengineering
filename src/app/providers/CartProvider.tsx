'use client';

import React from 'react';
import Cart from '@/components/Cart';
import CartIcon from '@/components/CartIcon';
import { useSyncCart } from '@/hooks/useCart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Initialize the cart by syncing with backend storage
  useSyncCart();
  
  return (
    <>
      {children}
      <Cart />
      <CartIcon />
    </>
  );
} 