'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { User } from '@supabase/supabase-js';

type CartItem = {
  id: string;
  course_id: string;
  title: string;
  price: number;
  image_url?: string;
  slug: string;
};

type CartContextType = {
  cartItems: CartItem[];
  cartCount: number;
  isLoading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (courseId: string) => Promise<void>;
  removeFromCart: (courseId: string) => Promise<void>;
  clearCart: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Define the structure for the raw item fetched from Supabase
// interface RawCartItem { // Removed as it's unused after using 'any'
//     id: string;
//     course_id: string;
//     courses: {
//         title: string;
//         price: number;
//         image_url: string | null;
//         slug: string;
//     };
// }

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  // Initialize Supabase client
  const supabase = createClient();

  // Load cart items from the database (wrapped in useCallback)
  const loadCartItems = useCallback(async (userId: string) => {
    setIsLoading(true);
    try {
      // Join cart_items with courses to get course details
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          course_id,
          courses:course_id (
            title,
            price,
            thumbnail_image_url,
            slug
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Format the data for easier consumption
      // FIXME: Linter incorrectly infers item.courses as an array type from Supabase join. Using any temporarily.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedItems = data?.map((item: any) => ({
        id: item.id,
        course_id: item.course_id,
        title: item.courses.title,
        price: item.courses.price,
        image_url: item.courses.thumbnail_image_url ?? undefined,
        slug: item.courses.slug
      })) ?? [];

      setCartItems(formattedItems);
    } catch (error) {
      console.error('Error loading cart items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // Check for user and load cart items
  useEffect(() => {
    const getUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
        setIsLoading(false);
        return;
      }
      
      if (data?.user) {
        setUser(data.user);
        loadCartItems(data.user.id);
      } else {
        setIsLoading(false);
      }
    };

    getUser();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        loadCartItems(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCartItems([]);
        setIsLoading(false);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [supabase.auth, loadCartItems]);

  // Add item to cart
  const addToCart = async (courseId: string) => {
    if (!user) {
      // Redirect to login or show login dialog
      setIsCartOpen(false);
      // Consider adding a redirect or showing a login dialog
      return;
    }

    try {
      // Check if the course is already in the cart
      const exists = cartItems.some(item => item.course_id === courseId);
      if (exists) {
        // Course is already in cart, just open the cart
        setIsCartOpen(true);
        return;
      }

      // Add to database
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          course_id: courseId,
        });

      if (error) throw error;

      // Refetch cart items from database to update local state consistently
      await loadCartItems(user.id);

      // Open the cart to show the item was added
      setIsCartOpen(true);
    } catch (error) {
      console.error('Error adding item to cart:', error);
    }
  };

  // Remove item from cart
  const removeFromCart = async (courseId: string) => {
    if (!user) return;

    try {
      // Remove from database
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('course_id', courseId);

      if (error) throw error;

      // Update local state
      setCartItems(cartItems.filter(item => item.course_id !== courseId));
    } catch (error) {
      console.error('Error removing item from cart:', error);
    }
  };

  // Clear the entire cart
  const clearCart = async () => {
    if (!user) return;

    try {
      // Delete all cart items for the user
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount: cartItems.length,
        isLoading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}; 