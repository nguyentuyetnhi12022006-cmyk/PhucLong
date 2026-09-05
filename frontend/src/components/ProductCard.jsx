import React from 'react';
import { Plus } from 'lucide-react';
import './ProductCard.css';

const ProductCard = ({ product, onSelect }) => {
  const { name, description, price, category, image, isAvailable } = product;

  // Format price to VND
  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

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
