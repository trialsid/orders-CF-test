import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import BrowsePage from './pages/BrowsePage';
import CartCheckoutPage from './pages/CartCheckoutPage';
import OrdersPage from './pages/OrdersPage';
import ProductDetailPage from './pages/ProductDetailPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import AdminPage from './pages/AdminPage';
import RiderPage from './pages/RiderPage';
import AuthPage from './pages/AuthPage';
import RequireAuth from './components/RequireAuth';
import AccountPage from './pages/AccountPage';

function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="browse" element={<BrowsePage />} />
          <Route path="discover" element={<Navigate to="/browse" replace />} />
          <Route path="products/:productId" element={<ProductDetailPage />} />
          <Route path="cart" element={<Navigate to="/checkout" replace />} />
          <Route path="checkout" element={<CartCheckoutPage />} />
          <Route path="checkout/success" element={<OrderSuccessPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route
            path="admin"
            element={
              <RequireAuth roles={['admin']}>
                <AdminPage />
              </RequireAuth>
            }
          />
          <Route
            path="rider"
            element={
              <RequireAuth roles={['rider', 'admin']}>
                <RiderPage />
              </RequireAuth>
            }
          />
          <Route
            path="account"
            element={
              <RequireAuth roles={['customer', 'admin', 'rider']}>
                <AccountPage />
              </RequireAuth>
            }
          />
          <Route path="auth/login" element={<AuthPage mode="login" />} />
          <Route path="auth/register" element={<AuthPage mode="register" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
