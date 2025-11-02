import React from 'react';
import { useOutletContext } from 'react-router-dom';
import CartSection from '../components/CartSection';
import type { AppOutletContext } from '../layouts/MainLayout';

function CartPage(): JSX.Element {
  const { cart, submitOrder, isSubmitting } = useOutletContext<AppOutletContext>();

  return (
    <CartSection
      items={cart.cartItems}
      total={cart.cartTotal}
      onUpdateQuantity={cart.updateQuantity}
      onSubmit={submitOrder}
      isSubmitting={isSubmitting}
      hasItems={cart.hasItems}
    />
  );
}

export default CartPage;
