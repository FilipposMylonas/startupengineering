'use client';

import { useState, useEffect } from 'react';
import { useCart } from '@/hooks/useCart';
import { ShoppingCart, Check, Plus, Minus } from 'lucide-react';

const basePath = process.env.NODE_ENV === 'production' ? '/startupengineering' : '';

type AddToCartProps = {
  productId: string; // This will be the actual numerical DB ID passed as a string
  name: string;
  price: number;
  variant?: string; // Will receive the variant name (e.g., "White With LED")
  image?: string; // Optional: Can pass specific image if needed
  modelType?: 'grip' | 'throttle' | 'bundle'; // Type of 3D model to show in cart
};

export default function AddToCart({ productId, name, price, variant, image, modelType }: AddToCartProps) {
  const { addItem, openCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddToCart = () => {
    // Use the numerical productId (as string) directly as the unique ID.
    // The variant prop now holds the descriptive name.
    addItem({
      id: productId, // Use the DB ID directly
      name,
      price,
      quantity,
      variant: variant, // Use the variant prop passed from Carousel
      image: image || `${basePath}/images/StartupEngineeringLogo.png`, // Use passed image or default
      modelType: modelType, // Type of 3D model to show in cart
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      openCart();
    }, 1500);
  };

  if (!mounted) {
    return <div className="mt-8 h-20"></div>; // Placeholder
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex items-center justify-center rounded-full border border-white/30 bg-white/10 backdrop-blur-sm p-1">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="flex h-12 w-12 items-center justify-center rounded-l-full transition-colors hover:bg-black/40"
            aria-label="Decrease quantity"
          >
            <Minus className="h-5 w-5 text-white" />
          </button>
          <span className="w-14 text-center font-medium text-lg">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="flex h-12 w-12 items-center justify-center rounded-r-full transition-colors hover:bg-black/40"
            aria-label="Increase quantity"
          >
            <Plus className="h-5 w-5 text-white" />
          </button>
        </div>
        <button
          onClick={handleAddToCart}
          disabled={isAdded}
          className={`flex-1 rounded-full px-6 py-4 font-medium transition-all shadow-lg ${
            isAdded
              ? 'bg-sky-600 text-white'
              : 'bg-sky-600 text-white hover:bg-sky-700'
          }`}
        >
          {isAdded ? (
            <span className="flex items-center justify-center">
              <Check className="mr-2 h-5 w-5" />
              Added to Cart
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <ShoppingCart className="mr-2 h-5 w-5" />
              {quantity > 1 ? `Add ${quantity} to Cart` : 'Add to Cart'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
} 