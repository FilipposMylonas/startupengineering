'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import { Check } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const { clearCart } = useCart();

  useEffect(() => {
    // Clear the cart in case it wasn't already cleared by the backend
    clearCart();
  }, [clearCart]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="mx-auto max-w-xl rounded-xl bg-slate-900/80 backdrop-blur-sm p-8 text-center shadow-xl border border-sky-500/20">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600">
            <Check className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="mb-2 text-3xl font-bold">Order Confirmed</h1>
        <p className="mb-8 text-gray-400">
          Thank you for your order. A confirmation email has been sent to your inbox.
        </p>
        <div className="mb-8 p-4 bg-gray-800/50 rounded-lg text-left">
          <h2 className="text-xl font-medium mb-3">What to Expect</h2>
          <ol className="list-decimal pl-5 space-y-2 text-gray-300">
            <li>Order processing: 1–2 business days</li>
            <li>Shipping notification with tracking details via email</li>
            <li>Estimated delivery: 3–5 business days (EU)</li>
          </ol>
        </div>
        <Link
          href="/"
          className="inline-block rounded-full bg-sky-600 px-6 py-3 font-medium text-white transition-colors hover:bg-sky-700"
        >
          Return to Shop
        </Link>
      </div>
    </div>
  );
} 