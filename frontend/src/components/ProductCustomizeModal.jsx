import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, Zap, ShoppingBag } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import GuestCartNoticeModal from './GuestCartNoticeModal';
import './ProductCustomizeModal.css';

const ProductCustomizeModal = ({ product, onClose, onAddToCart }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [sweetness, setSweetness] = useState('100% Đường');
  const [ice, setIce] = useState('100% Đá');
  const [showGuestNotice, setShowGuestNotice] = useState(false);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!product) return null;

  // Format price to VND
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  const availableSizes =
    product.sizes && product.sizes.length > 0
      ? product.sizes
      : [
          { size: 'S', priceAdjustment: 0 },
          { size: 'M', priceAdjustment: 0 },
          { size: 'L', priceAdjustment: 10000 },
        ];

  // Get current size adjustment
  const sizeObj = availableSizes.find((s) => s.size === selectedSize) || { priceAdjustment: 0 };
  const basePriceWithAdjustment = (product.price || 0) + sizeObj.priceAdjustment;

  // Calculate toppings price
  const toppingsPrice = selectedToppings.reduce((sum, tName) => {
    const toppingObj = product.toppings?.find((top) => top.name === tName);
    return sum + (toppingObj ? toppingObj.price : 0);
  }, 0);

  const unitPrice = basePriceWithAdjustment + toppingsPrice;
  const totalPrice = unitPrice * quantity;

  const handleToppingChange = (toppingName) => {
    if (selectedToppings.includes(toppingName)) {
      setSelectedToppings(selectedToppings.filter((name) => name !== toppingName));
    } else {
      setSelectedToppings([...selectedToppings, toppingName]);
    }
  };

  const buildCustomToppings = () => {
    const customToppings = [...selectedToppings];
    if (sweetness !== '100% Đường') customToppings.push(sweetness);
    if (ice !== '100% Đá') customToppings.push(ice);
    return customToppings;
  };

  const handleAdd = () => {
    const customToppings = buildCustomToppings();
    onAddToCart(product, quantity, selectedSize, customToppings);

    if (!isAuthenticated) {
      // Unauthenticated guest: Show pop-up notice modal
      setShowGuestNotice(true);
    } else {
      onClose();
    }
  };

  const handleBuyNow = () => {
    const customToppings = buildCustomToppings();
    onAddToCart(product, quantity, selectedSize, customToppings);
    onClose();
    navigate('/checkout');
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content animate-slide-up" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={24} />
          </button>

          <div className="modal-grid">
            {/* Left Side: Image */}
            <div className="modal-image-section">
              <img
                src={
                  product.image ||
                  'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80'
                }
                alt={product.name}
                className="modal-product-image"
              />
            </div>

            {/* Right Side: Customization Options */}
            <div className="modal-options-section">
              <div className="modal-header">
                <div className="modal-header-title-row">
                  <span className="modal-category">{product.category}</span>
                  <h2 className="modal-product-name">{product.name}</h2>
                </div>
                <div className="modal-header-desc-row">
                  <p className="modal-product-desc">{product.description}</p>
                  <div className="modal-base-price">{formatPrice(product.price)}</div>
                </div>
              </div>

              <div className="modal-scroll-area">
                {/* Size Selection (Available for ALL products including Bakery) */}
                <div className="option-group">
                  <h3 className="option-title">Chọn Kích Cỡ (Size)</h3>
                  <div className="options-list-grid">
                    {availableSizes.map((s) => (
                      <label
                        key={s.size}
                        className={`option-item-card ${selectedSize === s.size ? 'selected' : ''}`}
                      >
                        <input
                          type="radio"
                          name="size"
                          value={s.size}
                          checked={selectedSize === s.size}
                          onChange={() => setSelectedSize(s.size)}
                          className="sr-only"
                        />
                        <div className="option-info">
                          <span className="option-name">Size {s.size}</span>
                          {s.priceAdjustment > 0 && (
                            <span className="option-price-adj">
                              +{formatPrice(s.priceAdjustment)}
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Sweetness Selection (Only for drinks) */}
                {product.category !== 'Bánh ngọt' && product.category !== 'Bánh' && (
                  <div className="option-group">
                    <h3 className="option-title">Chọn Mức Đường</h3>
                    <div className="options-list-grid">
                      {['100% Đường', '70% Đường', '50% Đường', 'Không Đường'].map((sugar) => (
                        <label
                          key={sugar}
                          className={`option-item-card ${sweetness === sugar ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="sweetness"
                            value={sugar}
                            checked={sweetness === sugar}
                            onChange={() => setSweetness(sugar)}
                            className="sr-only"
                          />
                          <span className="option-name">{sugar}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ice Selection (Only for drinks) */}
                {product.category !== 'Bánh ngọt' && product.category !== 'Bánh' && (
                  <div className="option-group">
                    <h3 className="option-title">Chọn Mức Đá</h3>
                    <div className="options-list-grid">
                      {['100% Đá', '70% Đá', '50% Đá', 'Không Đá'].map((iceLevel) => (
                        <label
                          key={iceLevel}
                          className={`option-item-card ${ice === iceLevel ? 'selected' : ''}`}
                        >
                          <input
                            type="radio"
                            name="ice"
                            value={iceLevel}
                            checked={ice === iceLevel}
                            onChange={() => setIce(iceLevel)}
                            className="sr-only"
                          />
                          <span className="option-name">{iceLevel}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings Selection */}
                {product.toppings && product.toppings.length > 0 && (
                  <div className="option-group">
                    <h3 className="option-title">Thêm Topping</h3>
                    <div className="options-list-column">
                      {product.toppings.map((t) => (
                        <label
                          key={t.name}
                          className={`topping-item-row ${
                            selectedToppings.includes(t.name) ? 'selected' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedToppings.includes(t.name)}
                            onChange={() => handleToppingChange(t.name)}
                            className="topping-checkbox"
                          />
                          <span className="topping-name">{t.name}</span>
                          <span className="topping-price">+{formatPrice(t.price)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* Footer: Quantity, Add to Cart & Buy Now Buttons */}
              <div className="modal-footer">
                <div className="quantity-selector">
                  <button
                    className="qty-btn"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="qty-value">{quantity}</span>
                  <button className="qty-btn" onClick={() => setQuantity(quantity + 1)}>
                    <Plus size={16} />
                  </button>
                </div>

                <div className="modal-footer-btns">
                  <button className="btn btn-outline btn-modal-add" onClick={handleAdd}>
                    <ShoppingBag size={16} />
                    <span>Thêm vào giỏ ({formatPrice(totalPrice)})</span>
                  </button>

                  <button className="btn btn-primary btn-modal-buynow" onClick={handleBuyNow}>
                    <Zap size={16} />
                    <span>Mua ngay</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guest Cart Notice Modal Popup */}
      <GuestCartNoticeModal
        isOpen={showGuestNotice}
        onClose={() => {
          setShowGuestNotice(false);
          onClose();
        }}
        onContinueGuestCheckout={() => {
          setShowGuestNotice(false);
          onClose();
          navigate('/checkout');
        }}
      />
    </>
  );
};

export default ProductCustomizeModal;

