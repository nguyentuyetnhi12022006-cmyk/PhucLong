import React from 'react';
import { Plus, Star, Sparkles } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onSelect }) => {
  const { name, description, price, category, image, isAvailable, isFeatured, isNewItem, isNew, createdAt, updatedAt } = product;

  // Format price to VND
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Determine if product is "Best Seller" (Featured)
  const isBestSeller = isFeatured === true;

  // Determine if product is "Mới" (Newly added or updated)
  const isNewBadge =
    isNewItem !== false &&
    isNew !== false &&
    (isNewItem === true ||
      isNew === true ||
      !createdAt ||
      new Date().getTime() - new Date(createdAt || updatedAt).getTime() < 14 * 24 * 60 * 60 * 1000);

  return (
    <div className={`product-card ${!isAvailable ? 'sold-out' : ''}`}>
      <div className="product-image-wrapper">
        <img 
          src={image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60'} 
          alt={name} 
          className="product-image"
          loading="lazy"
        />
        <span className="product-category-tag">{category}</span>

        {/* Badges Top Right (Best Seller & Mới) */}
        <div className="product-badges-top-right">
          {isBestSeller && (
            <span className="product-badge badge-best-seller">
              <Star size={11} fill="currentColor" /> Best Seller
            </span>
          )}
          {isNewBadge && (
            <span className="product-badge badge-new">
              <Sparkles size={11} /> Mới
            </span>
          )}
        </div>

        {!isAvailable && <div className="sold-out-overlay">Hết Hàng</div>}
      </div>

      <div className="product-info">
        <h3 className="product-name">{name}</h3>
        <p className="product-desc" title={description}>
          {description || 'Hương vị trà sữa Phúc Long thơm ngon đặc trưng, đậm vị ngọt ngào.'}
        </p>
        
        <div className="product-footer">
          <span className="product-price">{formatPrice(price)}</span>
          <button 
            className="btn-add-cart" 
            onClick={() => onSelect(product)}
            disabled={!isAvailable}
            aria-label={`Select options for ${name}`}
          >
            <Plus size={18} />
            <span>Chọn mua</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
