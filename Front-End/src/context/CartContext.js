import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { fetchCart, addToCart as apiAdd, updateCartItem, removeCartItem, clearCartApi } from '../utils/api';
import { calculateSellingPrice } from '../utils/PricingUtils'; 

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  
  const [selectedItems, setSelectedItems] = useState(() => {
    try {
        const saved = sessionStorage.getItem('cart_selected_items');
        return saved ? JSON.parse(saved) : [];
    } catch (e) {
        return [];
    }
  });

  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    sessionStorage.setItem('cart_selected_items', JSON.stringify(selectedItems));
  }, [selectedItems]);

  const refreshCart = useCallback(async () => {
    setLoading(true); 
    
    const token = localStorage.getItem('token');
    if (!token) {
        setCartItems([]);
        setCartCount(0);
        setLoading(false);
        return;
    }
    
    try {
      const data = await fetchCart();
      if (data.cart_items) {
        setCartItems(data.cart_items);
        const count = data.cart_items.reduce((acc, item) => acc + item.quantity, 0);
        setCartCount(count);
      }
    } catch (error) {
      console.error("Failed to sync cart", error);
    } finally {
      setLoading(false);
    }
  }, [setCartItems, setCartCount, setLoading]);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const toggleSelectItem = (itemId) => {
    setSelectedItems(prevSelected =>
      prevSelected.includes(itemId)
        ? prevSelected.filter(id => id !== itemId)
        : [...prevSelected, itemId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === cartItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(cartItems.map(item => item.id));
    }
  };

  // Logic: Calculate total based on SELECTED items and their DISCOUNTED prices
  const selectedSubtotal = cartItems
    .filter(item => selectedItems.includes(item.id))
    .reduce((total, item) => {
      if (!item.product) return total;
      
      const validQuantity = parseInt(item.quantity) || 0;
      const price = parseFloat(item.product.price) || 0;
      const discount = parseFloat(item.product.discount) || 0;
      
      // Use utility to get the real discounted price
      const finalPrice = calculateSellingPrice(price, discount);
      
      return total + (validQuantity * finalPrice);
    }, 0);

  const wrapApiAction = async (apiCall, successMsg, errorMsg, localUpdate = () => {}) => {
      setLoading(true);
      try {
          await apiCall();
          localUpdate();
          await refreshCart();
          console.log(`SUCCESS: ${successMsg}`);
          return true;
      } catch (error) {
          console.error(`ERROR: ${errorMsg}`, error);
          return false;
      } finally {
          setLoading(false);
      }
  };

  const addToCart = (productToAdd, quantity = 1) => {
    const productId = productToAdd.id ? productToAdd.id : productToAdd;
    return wrapApiAction(
        () => apiAdd(productId, quantity),
        'Item added to cart successfully!',
        'Failed to add item to cart.'
    );
  };

  const removeFromCart = (cartItemId) => {
    return wrapApiAction(
        () => removeCartItem(cartItemId),
        'Item removed from cart!',
        'Failed to remove item.',
        () => setSelectedItems(prev => prev.filter(id => id !== cartItemId))
    );
  };

  const increaseQuantity = async (cartItemId) => {
    const item = cartItems.find(i => i.id === cartItemId);
    if (item) {
        return wrapApiAction(
            () => updateCartItem(cartItemId, item.quantity + 1),
            'Quantity increased!',
            'Failed to update quantity.'
        );
    }
  };

  const decreaseQuantity = async (cartItemId) => {
    const item = cartItems.find(i => i.id === cartItemId);
    if (item && item.quantity > 1) {
        return wrapApiAction(
            () => updateCartItem(cartItemId, item.quantity - 1),
            'Quantity decreased!',
            'Failed to update quantity.'
        );
    }
  };

  const clearCart = () => {
    return wrapApiAction(
        () => clearCartApi(),
        'Your cart has been cleared.',
        'Failed to clear cart.',
        () => {
            setCartItems([]);
            setSelectedItems([]);
        }
    );
  };

  const removeSelectedItems = () => {
    return wrapApiAction(
      async () => {
        for (const id of selectedItems) {
            await removeCartItem(id);
        }
      },
      'Selected items removed!',
      'Failed to remove all selected items.',
      () => setSelectedItems([])
    );
  };

  const setUser = (userId) => { };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        selectedItems,
        setSelectedItems,
        selectedSubtotal,
        loading,
        toggleSelectItem,
        toggleSelectAll,
        addToCart,
        removeFromCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        removeSelectedItems,
        refreshCart,
        setUser
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);