import React, { useCallback } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import CartSection from '../components/CartSection';
import type { AppOutletContext } from '../layouts/MainLayout';

function CartPage(): JSX.Element {
  const { cart, isSubmitting } = useOutletContext<AppOutletContext>();
  const navigate = useNavigate();

  const handleProceed = useCallback(() => {
    if (!cart.hasItems) {
      return;
    }
    navigate('/checkout');
  }, [cart.hasItems, navigate]);

  return (
    <CartSection
      items={cart.cartItems}
      total={cart.cartTotal}
      onUpdateQuantity={cart.updateQuantity}
      onSubmit={handleProceed}
      isSubmitting={isSubmitting}
      hasItems={cart.hasItems}
    />
  );
}

export default CartPage;
