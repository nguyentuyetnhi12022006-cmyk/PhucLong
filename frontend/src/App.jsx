import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatWidget from './components/ChatWidget';
import Home from './pages/Home/Home';
import Menu from './pages/Menu/Menu';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import LoginRegister from './pages/Auth/LoginRegister';
import UserProfile from './pages/Profile/UserProfile';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import AdminLogin from './pages/Admin/AdminLogin';
import AdminLayout from './pages/Admin/AdminLayout';
import './styles/global.css';

// Whenever the user logs out, always send them back to the home page.
// This covers every logout entry point (Navbar, mobile menu, profile, admin) so
// screens like Checkout/QR-payment or OrderTracking can't stay on screen after logout.
const LogoutRedirect = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const wasAuthenticated = useRef(isAuthenticated);

  useEffect(() => {
    if (wasAuthenticated.current && !isAuthenticated) {
      navigate('/', { replace: true });
    }
    wasAuthenticated.current = isAuthenticated;
  }, [isAuthenticated, navigate]);

  return null;
};

// Layout for customer-facing pages (includes Navbar and Footer)
const CustomerLayout = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flexGrow: 1 }}>
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <LogoutRedirect />
          <Routes>
            {/* Customer Routes */}
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<Home />} />
              <Route path="menu" element={<Menu />} />
              <Route path="cart" element={<Cart />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="login" element={<LoginRegister />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="my-orders" element={<UserProfile />} />
              {/* Order tracking now lives inside the Profile's "Tra Cứu Đơn Hàng" tab */}
              <Route path="tracking" element={<Navigate to="/profile?tab=track" replace />} />
              <Route path="privacy" element={<PrivacyPolicy />} />
              <Route path="terms" element={<PrivacyPolicy />} />
            </Route>

            {/* Admin Routes (No Customer Navbar/Footer) */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />} />
            
            {/* Fallback redirect */}
            <Route path="*" element={<Home />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;
