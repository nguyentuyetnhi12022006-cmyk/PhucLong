import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, Plus, Minus, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, cartTotal } = useCart();

  // Format price to VND
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Delivery fee logic: free shipping for orders >= 150,000 đ, otherwise 20,000 đ
  const deliveryFee = cartTotal >= 150000 || cartTotal === 0 ? 0 : 20000;
  const finalTotal = cartTotal + deliveryFee;

  if (cart.length === 0) {
    return (
      <div className="cart-page cart-empty-state animate-fade-in">
        <div className="container empty-cart-container">
          <div className="empty-cart-card">
            <div className="empty-cart-icon-box">
              <ShoppingBag size={48} />
            </div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Có vẻ như bạn chưa chọn món ăn hay đồ uống nào. Hãy quay lại thực đơn để chọn món nhé!</p>
            <Link to="/menu" className="btn btn-primary">
              Khám Phá Thực Đơn <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const renderCartItem = (item) => {
    const itemImage =
      item.image ||
      (typeof item.product === 'object' && item.product?.image) ||
      'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60';

    return (
      <div key={item.cartItemId} className="cart-item-card">
        <img src={itemImage} alt={item.name} className="cart-item-image" />

        <div className="cart-item-info">
          <div className="cart-item-header">
            <h3 className="cart-item-name">{item.name}</h3>
            <button
              className="btn-remove-item"
              onClick={() => removeFromCart(item.cartItemId)}
              aria-label={`Remove ${item.name} from cart`}
            >
              <Trash2 size={18} />
            </button>
          </div>

          <div className="cart-item-details">
            {item.size && <span className="cart-item-size-badge">Size {item.size}</span>}
            {item.toppings && item.toppings.length > 0 && (
              <div className="cart-item-toppings">
                <b>Toppings:</b> {item.toppings.join(', ')}
              </div>
            )}
          </div>

          <div className="cart-item-footer">
            <div className="quantity-selector cart-qty-selector">
              <button
                className="qty-btn"
                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
              >
                <Minus size={14} />
              </button>
              <span className="qty-value">{item.quantity}</span>
              <button
                className="qty-btn"
                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="cart-item-prices">
              <span className="cart-item-unit-price">{formatPrice(item.price)}</span>
              <span className="cart-item-subtotal">{formatPrice(item.price * item.quantity)}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cart-page animate-fade-in">
      <div className="container cart-container">
        <h1 className="cart-title">Giỏ Hàng Của Bạn</h1>

        <div className="cart-content-grid">
          {/* Cart Items List */}
          <div className="cart-items-list">
            {cart.map(renderCartItem)}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary-sidebar">
            <div className="cart-summary-card">
              <h2 className="summary-title">Tóm tắt đơn hàng</h2>

              <div className="summary-row">
                <span>Tạm tính ({cart.reduce((sum, item) => sum + item.quantity, 0)} món)</span>
                <span>{formatPrice(cartTotal)}</span>
              </div>

              <div className="summary-row">
                <span>Phí vận chuyển</span>
                <span>{deliveryFee === 0 ? 'Miễn phí' : formatPrice(deliveryFee)}</span>
              </div>

              {deliveryFee > 0 && (
                <div className="shipping-promo-notice">
                  Mua thêm <b>{formatPrice(150000 - cartTotal)}</b> để được miễn phí giao hàng!
                </div>
              )}

              <div className="summary-divider"></div>

              <div className="summary-row total-row">
                <span>Tổng cộng</span>
                <span className="final-total-amount">{formatPrice(finalTotal)}</span>
              </div>

              <Link to="/checkout" className="btn btn-primary btn-checkout-submit">
                Tiến Hành Thanh Toán <ArrowRight size={18} />
              </Link>

              <Link to="/menu" className="btn-continue-shopping">
                Quay lại chọn thêm món
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
