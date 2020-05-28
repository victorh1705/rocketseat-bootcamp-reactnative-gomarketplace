import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketing:products',
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts) as Product[]);
      }
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Omit<Product, 'quantity'>) => {
      const updatedProducts = [...products];
      const productIndex = updatedProducts.findIndex(
        item => item.id === product.id,
      );

      if (productIndex === -1) {
        updatedProducts.push({ ...product, quantity: 1 });
      } else {
        updatedProducts[productIndex].quantity += 1;
      }
      setProducts(updatedProducts);
      await AsyncStorage.setItem(
        '@GoMarketing:products',
        JSON.stringify(updatedProducts),
      );
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productsToSave = products.map(prod =>
        prod.id === id ? { ...prod, quantity: prod.quantity + 1 } : prod,
      );
      setProducts(productsToSave);
      await AsyncStorage.setItem(
        '@GoMarketing:products',
        JSON.stringify(productsToSave),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      let productsToSave: Product[];

      if (products.find(item => item.id === id)?.quantity === 1) {
        productsToSave = products.filter(i => i.id !== id);
      } else {
        productsToSave = products.map(i =>
          i.id === id ? { ...i, quantity: i.quantity - 1 } : i,
        );
      }

      setProducts(productsToSave);
      await AsyncStorage.setItem(
        '@GoMarketing:products',
        JSON.stringify(productsToSave),
      );
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
