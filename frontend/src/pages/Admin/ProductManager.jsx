import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, AlertCircle } from 'lucide-react';
import api from '../../services/api';
import './ProductManager.css';

const DEFAULT_TOPPINGS = [
  { name: 'Trân châu hoàng kim', price: 10000 },
  { name: 'Trân châu đen', price: 8000 },
  { name: 'Thạch đào', price: 10000 },
  { name: 'Thạch nha đam', price: 8000 },
  { name: 'Kem phô mai (Cheese Foam)', price: 12000 }
];

const DEFAULT_SIZES = [
  { size: 'M', priceAdjustment: 0 },
  { size: 'L', priceAdjustment: 7000 }
];

const FALLBACK_PRODUCTS = [
  {
    _id: 'fb-ts-1',
    name: 'Trà Sữa Phúc Long',
    description: 'Trà sữa Phúc Long đậm vị trà đặc trưng kết hợp cùng sữa béo ngậy hảo hạng.',
    price: 45000,
    category: 'Trà sữa',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
    sizes: DEFAULT_SIZES,
    toppings: DEFAULT_TOPPINGS.slice(0, 3),
    isAvailable: true,
    isFeatured: true
  },
  {
    _id: 'fb-tc-1',
    name: 'Trà Đào Phúc Long',
    description: 'Trà đen đậm đà kết hợp với syrup đào thanh ngọt và những miếng đào giòn thơm.',
    price: 50000,
    category: 'Trà trái cây',
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80',
    sizes: DEFAULT_SIZES,
    toppings: DEFAULT_TOPPINGS.slice(2, 4),
    isAvailable: true,
    isFeatured: true
  }
];

const CATEGORIES = ['Trà sữa', 'Trà trái cây', 'Cà phê', 'Đá xay', 'Bánh ngọt'];

const ProductManager = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null for Add, product object for Edit
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('Trà sữa');
  const [image, setImage] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [toppings, setToppings] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get('/products');
      if (response.data.success && response.data.data.length > 0) {
        setProducts(response.data.data);
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch (err) {
      console.warn('Backend connection failed, using fallback product database.');
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    superFetchProducts();
  }, []);

  const superFetchProducts = () => {
    fetchProducts();
  };

  // Open modal to Add Product
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setPrice('');
    setCategory('Trà sữa');
    setImage('');
    setIsAvailable(true);
    setIsFeatured(false);
    setToppings(DEFAULT_TOPPINGS.slice(0, 3)); // Default subset of toppings
    setError('');
    setIsModalOpen(true);
  };

  // Open modal to Edit Product
  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setCategory(product.category);
    setImage(product.image || '');
    setIsAvailable(product.isAvailable);
    setIsFeatured(product.isFeatured || false);
    setToppings(product.toppings || []);
    setError('');
    setIsModalOpen(true);
  };

  // Toggle availability directly in list
  const handleToggleAvailability = async (product) => {
    const updatedStatus = !product.isAvailable;
    try {
      await api.put(`/products/${product._id}`, { isAvailable: updatedStatus });
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: updatedStatus } : p));
    } catch (err) {
      console.warn('Backend offline, toggling availability locally.');
      setProducts(prev => prev.map(p => p._id === product._id ? { ...p, isAvailable: updatedStatus } : p));
    }
  };

  // Delete product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) return;
    
    try {
      await api.delete(`/products/${productId}`);
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      console.warn('Backend offline, deleting product locally.');
      setProducts(prev => prev.filter(p => p._id !== productId));
    }
  };

  // Handle Form Submit (Add or Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !price || !category) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setSubmitting(true);
    setError('');

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      image: image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=600&auto=format&fit=crop&q=80',
      isAvailable,
      isFeatured,
      sizes: CATEGORIES.includes(category) && category !== 'Bánh ngọt' ? DEFAULT_SIZES : [],
      toppings: category !== 'Bánh ngọt' ? toppings : []
    };

    try {
      if (editingProduct) {
        // Edit Mode
        const response = await api.put(`/products/${editingProduct._id}`, productData);
        if (response.data.success) {
          setProducts(prev => prev.map(p => p._id === editingProduct._id ? response.data.data : p));
          setIsModalOpen(false);
        }
      } else {
        // Add Mode
        const response = await api.post('/products', productData);
        if (response.data.success) {
          setProducts(prev => [response.data.data, ...prev]);
          setIsModalOpen(false);
        }
      }
    } catch (err) {
      console.warn('Backend offline, simulating product operation locally.');
      // Mock local update
      if (editingProduct) {
        const mockUpdated = {
          ...editingProduct,
          ...productData
        };
        setProducts(prev => prev.map(p => p._id === editingProduct._id ? mockUpdated : p));
      } else {
        const mockNew = {
          _id: 'MOCK-PR-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          ...productData
        };
        setProducts(prev => [mockNew, ...prev]);
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToppingToggle = (topping) => {
    const exists = toppings.some(t => t.name === topping.name);
    if (exists) {
      setToppings(toppings.filter(t => t.name !== topping.name));
    } else {
      setToppings([...toppings, topping]);
    }
  };

  const formatPrice = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className="product-manager-component animate-fade-in">
      <div className="product-manager-header">
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Thêm Sản Phẩm Mới
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tên sản phẩm</th>
                <th>Danh mục</th>
                <th>Giá cơ bản</th>
                <th>Nổi bật</th>
                <th>Còn hàng</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product._id}>
                  <td>
                    <img 
                      src={product.image || 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=100&auto=format&fit=crop&q=80'} 
                      alt={product.name} 
                      className="admin-product-thumb"
                    />
                  </td>
                  <td className="font-bold">{product.name}</td>
                  <td><span className="product-category-pill">{product.category}</span></td>
                  <td className="font-bold price-color">{formatPrice(product.price)}</td>
                  <td>
                    {product.isFeatured ? (
                      <span className="featured-dot-yes" title="Sản phẩm nổi bật"><Check size={16} /> Có</span>
                    ) : (
                      <span className="featured-dot-no"><X size={14} /> Không</span>
                    )}
                  </td>
                  <td>
                    <label className="toggle-switch">
                      <input 
                        type="checkbox" 
                        checked={product.isAvailable} 
                        onChange={() => handleToggleAvailability(product)}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </td>
                  <td>
                    <div className="product-actions-btn-group">
                      <button 
                        className="btn-table-action btn-edit" 
                        onClick={() => handleOpenEditModal(product)}
                        title="Sửa thông tin sản phẩm"
                      >
                        <Edit2 size={14} /> Sửa
                      </button>
                      <button 
                        className="btn-table-action btn-delete" 
                        onClick={() => handleDeleteProduct(product._id)}
                        title="Xóa sản phẩm"
                      >
                        <Trash2 size={14} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content product-form-modal animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="detail-modal-header">
              <h3>{editingProduct ? 'Cập Nhật Sản Phẩm' : 'Thêm Sản Phẩm Mới'}</h3>
              <button className="btn-close-detail" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit} className="product-form-body">
              <div className="product-form-scroll">
                {error && (
                  <div className="checkout-error-msg">
                    <AlertCircle size={18} /> <span>{error}</span>
                  </div>
                )}

                <div className="form-grid-2-col">
                  <div className="form-group">
                    <label htmlFor="prod-name">Tên sản phẩm *</label>
                    <input 
                      type="text" 
                      id="prod-name"
                      placeholder="e.g. Trà Sữa Phúc Long"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-price">Giá cơ bản (VND) *</label>
                    <input 
                      type="number" 
                      id="prod-price"
                      placeholder="e.g. 45000"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-grid-2-col">
                  <div className="form-group">
                    <label htmlFor="prod-category">Danh mục *</label>
                    <select
                      id="prod-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="form-control select-control"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="prod-image">Đường dẫn hình ảnh (URL)</label>
                    <input 
                      type="url" 
                      id="prod-image"
                      placeholder="https://images.unsplash.com/..."
                      value={image}
                      onChange={(e) => setImage(e.target.value)}
                      className="form-control"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="prod-desc">Mô tả sản phẩm</label>
                  <textarea 
                    id="prod-desc"
                    placeholder="Mô tả hương vị, nguyên liệu của sản phẩm..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="form-control"
                  ></textarea>
                </div>

                {/* Checkboxes */}
                <div className="checkboxes-row">
                  <label className="checkbox-label-card">
                    <input 
                      type="checkbox" 
                      checked={isAvailable}
                      onChange={(e) => setIsAvailable(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span>Còn hàng (Hiển thị bán)</span>
                  </label>

                  <label className="checkbox-label-card">
                    <input 
                      type="checkbox" 
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span>Sản phẩm nổi bật (Trang chủ)</span>
                  </label>
                </div>

                {/* Toppings (Only if not pastry) */}
                {category !== 'Bánh ngọt' && (
                  <div className="toppings-selection-group">
                    <label className="form-group-label">Chọn Toppings Hỗ Trợ</label>
                    <div className="toppings-check-grid">
                      {DEFAULT_TOPPINGS.map((topping) => {
                        const isChecked = toppings.some(t => t.name === topping.name);
                        return (
                          <label key={topping.name} className={`topping-checkbox-card ${isChecked ? 'active' : ''}`}>
                            <input 
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleToppingToggle(topping)}
                              className="sr-only"
                            />
                            <span className="topping-chk-name">{topping.name}</span>
                            <span className="topping-chk-price">+{formatPrice(topping.price)}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="detail-modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Hủy bỏ</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang xử lý...' : (editingProduct ? 'Lưu Thay Đổi' : 'Thêm Sản Phẩm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManager;
