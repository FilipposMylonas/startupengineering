'use client';

import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useEffect, useState } from 'react';

export default function CartIcon() {
  const { toggleCart, totalItems, isOpen } = useCart();
  const [mounted, setMounted] = useState(false);
  const itemCount = totalItems();
  
  // Only show the cart item indicator after client-side hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render when cart is open
  if (isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <button
        onClick={toggleCart}
        aria-label="Open cart"
        className="relative flex items-center justify-center h-10 w-10 rounded-full bg-black/80 shadow-lg transition-colors hover:bg-black"
      >
        <ShoppingCart className="h-5 w-5 text-white" />
        {mounted && itemCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-xs font-medium text-white">
            {itemCount}
          </span>
        )}
      </button>
    </div>
  );
} 