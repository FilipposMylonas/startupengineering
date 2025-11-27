'use client';

import { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import { useCart, CartItem } from '@/hooks/useCart';
import Link from 'next/link';
import Cookies from 'js-cookie';
import { Center, Environment, Float } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Grip } from './Grip';
import { Throttle } from './Throttle';

const basePath = process.env.NODE_ENV === 'production' ? '/startupengineering' : '';

// Helper to prepare headers with CSRF token
const prepareHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  };
  
  const csrfToken = Cookies.get('csrftoken');
  if (csrfToken) {
    headers['X-CSRFToken'] = csrfToken;
  }
  
  return headers;
};

export default function Cart() {
  const { items, isOpen, closeCart, removeItem, updateItemQuantity, totalPrice } = useCart();
  const cartRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set mounted state after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle clicking outside of cart to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        closeCart();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeCart]);

  // Lock body scroll when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(item.id);
    } else {
      updateItemQuantity(item.id, newQuantity);
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Starting checkout process...");
      
      // Always use trailing slash for Django and include CSRF token
      const response = await fetch('/api/cart/create_checkout_session/', {
        method: 'POST',
        headers: prepareHeaders(),
        body: JSON.stringify({
          success_url: `${window.location.origin}/checkout-success`,
          cancel_url: `${window.location.origin}`,
        }),
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Checkout response error:', response.status, errorText);
        
        // Debug info without using Object.fromEntries
        console.log("Response URL:", response.url);
        console.log("Response status:", response.status);
        console.log("Response statusText:", response.statusText);
        
        throw new Error(`Checkout failed: ${response.status} ${errorText || 'Unknown error'}`);
      }

      let data;
      const responseText = await response.text();
      console.log("Raw response:", responseText);
      
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Could not parse checkout response');
      }

      console.log("Checkout session created:", data);

      // Redirect to Stripe checkout
      if (data && data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setError(error instanceof Error ? error.message : 'Unknown error during checkout');
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render anything on server or during hydration
  if (!mounted) return null;
  
  return (
    <div className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div 
        ref={cartRef}
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-slate-900/95 text-white shadow-xl transition-transform duration-300 ease-in-out border-l border-sky-500/20 sm:w-96 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          {/* Cart Header */}
          <div className="flex items-center justify-between border-b border-gray-700 px-4 py-4">
            <h2 className="text-xl font-bold">Your Cart</h2>
            <button 
              onClick={closeCart}
              className="rounded-full p-1 transition-colors hover:bg-gray-700"
              aria-label="Close cart"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Cart Items */}
          <div className="flex-grow overflow-auto py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                <ShoppingCart className="mb-4 h-16 w-16 text-gray-400" />
                <p className="mb-4 text-xl font-medium">Your Cart is Empty</p>
                <p className="mb-8 text-gray-400">
                  Browse our selection of flight simulation hardware.
                </p>
                <button
                  onClick={closeCart}
                  className="rounded-full bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-gray-700">
                {items.map((item) => (
                  <li key={item.id} className="px-4 py-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md bg-slate-800 border border-slate-700">
                        <Canvas camera={{ fov: 50, position: [0, 0, 2] }}>
                          <Center position={[0, -0.2, 0]}>
                            <Float speed={2} rotationIntensity={0.5} floatIntensity={0.3}>
                              <CartItemModel modelType={item.modelType} />
                            </Float>
                          </Center>
                          <Environment files={`${basePath}/hdr/lobby.hdr`} environmentIntensity={0.3} />
                          <ambientLight intensity={0.5} />
                          <directionalLight intensity={0.8} position={[1, 1, 1]} />
                        </Canvas>
                      </div>
                      <div className="flex flex-1 flex-col">
                        <h3 className="font-medium">{item.name}</h3>
                        {item.variant && (
                          <p className="text-sm text-gray-400">{item.variant}</p>
                        )}
                        <div className="mt-2 flex justify-between">
                          <p className="font-medium">${item.price.toFixed(2)}</p>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-gray-400 transition-colors hover:text-white"
                            aria-label={`Remove ${item.name} from cart`}
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-end">
                      <div className="flex items-center rounded-full border border-gray-600">
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity - 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-l-full transition-colors hover:bg-gray-700"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => handleQuantityChange(item, item.quantity + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-r-full transition-colors hover:bg-gray-700"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Cart Footer */}
          {items.length > 0 && (
            <div className="border-t border-gray-700 px-4 py-4">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-medium">Subtotal</span>
                <span className="font-medium">${totalPrice().toFixed(2)}</span>
              </div>
              <p className="mb-4 text-sm text-gray-400">
                Free shipping on all orders. VAT calculated at checkout.
              </p>
              {error && (
                <div className="mb-4 p-3 bg-red-900/50 border border-red-500/30 rounded-lg text-sm text-red-200">
                  {error}
                </div>
              )}
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className={`block w-full rounded-full bg-sky-600 py-3 text-center font-medium text-white transition-colors ${
                  isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-sky-700'
                }`}
              >
                {isLoading ? 'Processing...' : 'Checkout'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Component to render the correct 3D model based on modelType
function CartItemModel({ modelType }: { modelType?: 'grip' | 'throttle' | 'bundle' }) {
  const scale = 0.5;
  
  switch (modelType) {
    case 'grip':
      return <Grip scale={scale} position={[0, 0, 0]} />;
    case 'throttle':
      return <Throttle scale={scale} position={[0, 0, 0]} />;
    case 'bundle':
      return (
        <group scale={0.3}>
          <group position={[-0.3, 0, 0]} rotation={[0, 0.3, 0]}>
            <Grip scale={scale} position={[0, 0, 0]} />
          </group>
          <group position={[0.3, 0, 0]} rotation={[0, -0.3, 0]}>
            <Throttle scale={scale} position={[0, 0, 0]} />
          </group>
        </group>
      );
    default:
      // Default to grip if modelType is not specified
      return <Grip scale={scale} position={[0, 0, 0]} />;
  }
}

// Shopping cart icon component for empty state
function ShoppingCart({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="8" cy="21" r="1" />
      <circle cx="19" cy="21" r="1" />
      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
    </svg>
  );
} 