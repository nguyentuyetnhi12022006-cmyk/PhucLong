import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
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
              <Route path="tracking" element={<UserProfile />} />
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
