'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/shared/cart-context';
import { ShoppingCart, Check } from 'lucide-react';

interface AddToCartButtonProps {
  courseId: string;
}

export function AddToCartButton({
  courseId,
}: AddToCartButtonProps) {
  const { addToCart, cartItems } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  // Check if the course is already in the cart
  const isInCart = cartItems.some(item => item.course_id === courseId);

  const handleAddToCart = async () => {
    if (isInCart) return;
    
    setIsAdding(true);
    try {
      await addToCart(courseId);
      
      // Show success state temporarily
      setIsAdded(true);
      setTimeout(() => {
        setIsAdded(false);
      }, 2000);
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Button
      variant="outline"
      className="w-full text-base py-6"
      size="lg"
      onClick={handleAddToCart}
      disabled={isAdding || isInCart}
    >
      {isAdding ? (
        <div className="flex items-center">
          <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
          Adding...
        </div>
      ) : isAdded ? (
        <div className="flex items-center">
          <Check className="h-4 w-4 mr-2" />
          Added to Cart
        </div>
      ) : isInCart ? (
        <div className="flex items-center">
          <Check className="h-4 w-4 mr-2" />
          In Cart
        </div>
      ) : (
        <div className="flex items-center">
          <ShoppingCart className="h-4 w-4 mr-2" />
          Add to Cart
        </div>
      )}
    </Button>
  );
} 