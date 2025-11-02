import React, { useEffect, useRef, useState } from 'react';
import Header from './components/Header';
import FeaturesSection from './components/FeaturesSection';
import ProductsSection from './components/ProductsSection';
import CartSection from './components/CartSection';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import FloatingCall from './components/FloatingCall';
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';
import type { OrderPayload, OrderResponse } from './types';

type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'order-ieeja-theme';

const getPreferredTheme = (): Theme => {
  if (typeof window === 'undefined') {
    return 'light';
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

function App(): JSX.Element {
  const productsSectionRef = useRef<HTMLElement | null>(null);
  const { categories, filter, setFilter, filteredProducts, highlights, productsStatusText } = useProducts();
  const { cartItems, cartTotal, addItem, updateQuantity, clearCart, hasItems } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme());

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.dataset.theme = theme;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    }
  }, [theme]);

  const handleBrowseClick = () => {
    productsSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleFilterChange = (category: string) => {
    setFilter(category);
  };

  const toggleTheme = () => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'));
  };

  const handleSubmitOrder = async () => {
    if (!hasItems) {
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = cartItems.map(({ product, quantity }) => ({
        id: product.id,
        name: product.name,
        quantity,
        unit: product.unit,
        price: product.price,
      }));

      const payload: OrderPayload = {
        items: orderItems,
        customer: {
          name: 'Walk-in customer',
        },
      };

      const response = await fetch('/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as OrderResponse;
      if (!response.ok) {
        throw new Error(result.message || 'Unable to place order right now.');
      }

      window.alert(result.message ?? 'Order placed.');
      clearCart();
    } catch (error) {
      console.error(error);
      window.alert('Unable to place order right now. Please call the store.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const year = new Date().getFullYear();

  return (
    <>
      <Header highlights={highlights} onBrowse={handleBrowseClick} theme={theme} onToggleTheme={toggleTheme} />
      <main>
        <FeaturesSection />
        <ProductsSection
          sectionRef={productsSectionRef}
          categories={categories}
          filter={filter}
          onFilterChange={handleFilterChange}
          products={filteredProducts}
          statusText={productsStatusText}
          onAddToCart={addItem}
        />
        <CartSection
          items={cartItems}
          total={cartTotal}
          onUpdateQuantity={updateQuantity}
          onSubmit={handleSubmitOrder}
          isSubmitting={isSubmitting}
          hasItems={hasItems}
        />
        <ContactSection />
      </main>
      <Footer year={year} />
      <FloatingCall />
    </>
  );
}

export default App;
