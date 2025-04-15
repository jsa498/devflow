'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart } from 'lucide-react';
import { useCart } from './cart-context';
import { Button } from '@/components/ui/button';
import { createCheckoutSession } from '@/app/api/actions/stripe';

export const CartDropdown = () => {
  const { cartItems, cartCount, isLoading, isCartOpen, setIsCartOpen, removeFromCart } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Handle click outside to close the dropdown
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
    };

    if (isCartOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, setIsCartOpen]);

  // Calculate total price
  const totalPrice = cartItems.reduce((total, item) => total + item.price, 0);

  // Format price to display as currency
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  // Handle checkout for all cart items
  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    try {
      setIsCheckingOut(true);
      
      // Use the first course in cart for the checkout session
      // The backend will handle multiple items
      const firstItem = cartItems[0];
      
      const result = await createCheckoutSession(
        firstItem.course_id,
        `Cart (${cartCount} items)`,
        totalPrice,
        'cart-checkout', // Use a special slug for cart checkout
        firstItem.image_url || '',
        `Checkout for ${cartCount} items`
      );

      if (!result.success) {
        console.error('Error:', result.error);
        alert(result.error || 'An error occurred while creating the checkout session');
        setIsCheckingOut(false);
        return;
      }

      if (result.url) {
        window.location.href = result.url;
        return;
      }

      setIsCheckingOut(false);
    } catch (error) {
      console.error('Checkout error:', error);
      alert('An unexpected error occurred. Please try again.');
      setIsCheckingOut(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-12 right-0 z-50 w-96 max-h-[calc(100vh-6rem)] bg-background border border-border rounded-lg shadow-lg flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-medium text-lg">Your Cart ({cartCount})</h3>
        <button
          onClick={() => setIsCartOpen(false)}
          className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-full"
          aria-label="Close cart"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-4">
        {isLoading ? (
          <div className="py-8 flex justify-center">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
            <Button 
              asChild 
              variant="link" 
              className="mt-2"
              onClick={() => setIsCartOpen(false)}
            >
              <Link href="/courses">Browse Courses</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 border-b border-border pb-4">
                <div className="w-20 h-16 bg-muted rounded relative overflow-hidden flex-shrink-0">
                  {item.image_url ? (
                    <Image
                      src={item.image_url}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <svg
                        className="h-6 w-6 text-muted-foreground/50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <Link 
                      href={`/courses/${item.slug}`}
                      className="font-medium text-base line-clamp-2 hover:text-primary"
                      onClick={() => setIsCartOpen(false)}
                    >
                      {item.title}
                    </Link>
                    <button
                      onClick={() => removeFromCart(item.course_id)}
                      className="text-muted-foreground hover:text-foreground ml-2 p-1 flex-shrink-0"
                      aria-label={`Remove ${item.title} from cart`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="text-sm text-primary font-medium mt-1">
                    {formatPrice(item.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {cartItems.length > 0 && (
        <div className="border-t border-border p-4 space-y-3">
          <div className="flex justify-between items-center font-medium">
            <span>Subtotal</span>
            <span>{formatPrice(totalPrice)}</span>
          </div>
          <Button 
            className="w-full h-12 text-base" 
            onClick={handleCheckout}
            disabled={isCheckingOut || cartItems.length === 0}
          >
            {isCheckingOut ? 'Processing...' : 'Checkout'}
          </Button>
        </div>
      )}
    </div>
  );
}; 