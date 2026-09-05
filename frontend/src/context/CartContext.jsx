import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  // Initialize lazily from localStorage so a page reload doesn't wipe the
  // guest cart (the persist effect must not clobber storage with [] before
  // the sync effect loads the saved cart).
  const [cart, setCart] = useState(() => {
    try {
      const guestData = localStorage.getItem('phuclong_guest_cart');
      return guestData ? JSON.parse(guestData) : [];
    } catch (err) {
      return [];
    }
  });
  const [syncedWithServer, setSyncedWithServer] = useState(false);

  // Sync cart when authentication status or logged-in user changes
  useEffect(() => {
    let isMounted = true;

    const syncCart = async () => {
      if (isAuthenticated && user) {
        try {
          // Clear guest local storage when logging into a user account
          localStorage.removeItem('phuclong_guest_cart');
          localStorage.removeItem('phuclong_cart');

          // Fetch user-isolated cart strictly from server database
          const response = await api.get('/cart');
          if (response.data.success && isMounted) {
            const formatted = response.data.data.map((item) => ({
              cartItemId: item._id,
              product: item.product?._id || item.product,
              name: item.name,
              image: item.image || item.product?.image || '',
              category: item.product?.category || '',
              size: item.size,
              toppings: item.toppings ? item.toppings.map((t) => t.name) : [],
              price: item.price,
              quantity: item.quantity,
            }));
            setCart(formatted);
            setSyncedWithServer(true);
          }
        } catch (err) {
          console.warn('Could not fetch user cart from server:', err);
          if (isMounted) setCart([]);
        }
      } else {
        // Logged out / Guest mode: clear server sync state & isolate user cart
        if (isMounted) {
          setSyncedWithServer(false);
          // Always purge legacy key if any
          localStorage.removeItem('phuclong_cart');
          const guestData = localStorage.getItem('phuclong_guest_cart');
          setCart(guestData ? JSON.parse(guestData) : []);
        }
      }
    };

    syncCart();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user?._id]);

  // Persist cart to localStorage ONLY when NOT authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      localStorage.setItem('phuclong_guest_cart', JSON.stringify(cart));
      localStorage.removeItem('phuclong_cart');
    }
  }, [cart, isAuthenticated]);

  const generateCartItemId = (productId, size, toppings) => {
    const sortedToppings = [...toppings].sort().join('-');
    return `${productId}-${size}-${sortedToppings}`;
  };

  const addToCart = async (product, quantity, selectedSize, selectedToppings) => {
    const sizeObj = product.sizes?.find((s) => s.size === selectedSize) || { priceAdjustment: 0 };
    const basePriceWithAdjustment = (product.price || 0) + sizeObj.priceAdjustment;

    const toppingsObjects = selectedToppings.map((tName) => {
      const toppingObj = product.toppings?.find((top) => top.name === tName);
      return { name: tName, price: toppingObj ? toppingObj.price : 0 };
    });

    const toppingsPrice = toppingsObjects.reduce((sum, t) => sum + t.price, 0);
    const unitPrice = basePriceWithAdjustment + toppingsPrice;
    const cartItemId = generateCartItemId(product._id, selectedSize, selectedToppings);

    // If logged in, save to server database cart
    if (isAuthenticated) {
      try {
        const response = await api.post('/cart', {
          product: product._id,
          name: product.name,
          image: product.image,
          price: unitPrice,
          size: selectedSize,
          toppings: toppingsObjects,
          quantity,
        });

        if (response.data.success) {
          const formatted = response.data.data.map((item) => ({
            cartItemId: item._id,
            product: item.product?._id || item.product,
            name: item.name,
            image: item.image || item.product?.image || product.image || '',
            category: item.product?.category || product.category,
            size: item.size,
            toppings: item.toppings ? item.toppings.map((t) => t.name) : [],
            price: item.price,
            quantity: item.quantity,
          }));
          setCart(formatted);
          return;
        }
      } catch (err) {
        console.warn('Backend cart add error, updating state locally.', err);
      }
    }

    // Unauthenticated / guest mode local state
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.cartItemId === cartItemId);
      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += quantity;
        if (product.image) newCart[existingIndex].image = product.image;
        return newCart;
      } else {
        return [
          ...prevCart,
          {
            cartItemId,
            product: product._id,
            name: product.name,
            image: product.image || '',
            category: product.category || '',
            size: selectedSize,
            toppings: selectedToppings,
            price: unitPrice,
            quantity,
          },
        ];
      }
    });
  };

  const removeFromCart = async (cartItemId) => {
    if (isAuthenticated) {
      try {
        const response = await api.delete(`/cart/${cartItemId}`);
        if (response.data.success) {
          const formatted = response.data.data.map((item) => ({
            cartItemId: item._id,
            product: item.product?._id || item.product,
            name: item.name,
            image: item.image || item.product?.image || '',
            category: item.product?.category || '',
            size: item.size,
            toppings: item.toppings ? item.toppings.map((t) => t.name) : [],
            price: item.price,
            quantity: item.quantity,
          }));
          setCart(formatted);
          return;
        }
      } catch (err) {
        console.warn('Backend cart delete error.', err);
      }
    }
    setCart((prevCart) => prevCart.filter((item) => item.cartItemId !== cartItemId));
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    if (isAuthenticated) {
      try {
        const response = await api.put(`/cart/${cartItemId}`, { quantity: newQuantity });
        if (response.data.success) {
          const formatted = response.data.data.map((item) => ({
            cartItemId: item._id,
            product: item.product?._id || item.product,
            name: item.name,
            image: item.image || item.product?.image || '',
            category: item.product?.category || '',
            size: item.size,
            toppings: item.toppings ? item.toppings.map((t) => t.name) : [],
            price: item.price,
            quantity: item.quantity,
          }));
          setCart(formatted);
          return;
        }
      } catch (err) {
        console.warn('Backend cart update error.', err);
      }
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      try {
        await api.delete('/cart');
      } catch (err) {
        console.warn('Backend cart clear error.', err);
      }
    }
    setCart([]);
    localStorage.removeItem('phuclong_guest_cart');
    localStorage.removeItem('phuclong_cart');
  };

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount,
        cartTotal,
        syncedWithServer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

