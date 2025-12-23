import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, MenuItem, CircularProgress, Box, Typography
} from '@mui/material';

// Icons
import EditIcon from '@mui/icons-material/EditRounded';
import DeleteIcon from '@mui/icons-material/DeleteRounded';
import AddIcon from '@mui/icons-material/AddRounded';
import SearchIcon from '@mui/icons-material/SearchRounded';
import CategoryIcon from '@mui/icons-material/CategoryOutlined';
import GrainIcon from '@mui/icons-material/Grain';
import TapasIcon from '@mui/icons-material/Tapas';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import SpaIcon from '@mui/icons-material/Spa';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import LocalDrinkIcon from '@mui/icons-material/LocalDrink';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import CookieIcon from '@mui/icons-material/Cookie';
import LocalCafeIcon from '@mui/icons-material/LocalCafe';
import RiceBowlIcon from '@mui/icons-material/RiceBowl';

import './ProductsPage.css';

interface Product {
  id: string;
  name: string;
  unit: string;
  selling_price: number;
  category: string;
}

const categories = [
  'All', 'Flour & Rava', 'Dals and Pulses', 'Rice', 'Oil', 'Dry Fruits', 'Pooja Items',
  'Plates & Glasses', 'Juices', 'Masalas', 'Snacks', 'Beverages', 'Uncategorized'
];

interface CategoryStyle {
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

const categoryConfig: Record<string, CategoryStyle> = {
  'Flour & Rava': { icon: GrainIcon, color: '#795548', bgColor: '#efebe9' }, // Brown
  'Dals and Pulses': { icon: TapasIcon, color: '#f57f17', bgColor: '#fff8e1' }, // Orange/Yellow
  'Rice': { icon: RiceBowlIcon, color: '#616161', bgColor: '#f5f5f5' }, // Grey/White
  'Oil': { icon: WaterDropIcon, color: '#fbc02d', bgColor: '#fffde7' }, // Oil Gold
  'Dry Fruits': { icon: SpaIcon, color: '#8d6e63', bgColor: '#efebe9' }, // Brownish
  'Pooja Items': { icon: LocalFireDepartmentIcon, color: '#d32f2f', bgColor: '#ffebee' }, // Red
  'Plates & Glasses': { icon: LocalDiningIcon, color: '#1976d2', bgColor: '#e3f2fd' }, // Blue
  'Juices': { icon: LocalDrinkIcon, color: '#9c27b0', bgColor: '#f3e5f5' }, // Purple
  'Masalas': { icon: WhatshotIcon, color: '#c62828', bgColor: '#ffcdd2' }, // Red Spicy
  'Snacks': { icon: CookieIcon, color: '#ef6c00', bgColor: '#fff3e0' }, // Orange
  'Beverages': { icon: LocalCafeIcon, color: '#4e342e', bgColor: '#d7ccc8' }, // Coffee
  'Uncategorized': { icon: CategoryIcon, color: '#757575', bgColor: '#eeeeee' },
  'All': { icon: CategoryIcon, color: '#757575', bgColor: '#eeeeee' },
};

const getCategoryStyle = (cat: string) => {
  return categoryConfig[cat] || categoryConfig['Uncategorized'];
};

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Dialog States
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'piece', selling_price: '', category: 'Uncategorized' });
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', user.id)
        .order('name'); // Default sort

      if (error) console.error('Error fetching products:', error);
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

  // --- Handlers ---
  const handleAddProduct = async () => {
    if (!form.name || !form.selling_price || !user) return;
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: user.id,
        name: form.name,
        unit: form.unit,
        selling_price: Number(form.selling_price),
        category: form.category,
      })
      .select()
      .single();

    if (error) {
      alert('Error adding product: ' + error.message);
    } else if (data) {
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setOpen(false);
      setForm({ name: '', unit: 'piece', selling_price: '', category: 'Uncategorized' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) alert('Error deleting product: ' + error.message);
      else setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    const { id, name, unit, selling_price, category } = editingProduct;

    const { error } = await supabase
      .from('products')
      .update({ name, unit, selling_price: Number(selling_price), category })
      .eq('id', id);

    if (error) {
      alert('Error updating product: ' + error.message);
    } else {
      setProducts(products.map(p => (p.id === id ? { ...p, name, unit, selling_price: Number(selling_price), category } : p)));
      setEditOpen(false);
      setEditingProduct(null);
    }
  };

  // --- Filtering ---
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress sx={{ color: '#333' }} />
      </Box>
    );
  }

  return (
    <div className="products-page-container">
      <div className="products-header">
        <h1 className="products-title">Inventory</h1>
        <p className="products-subtitle">Shop Items prices</p>
      </div>

      <div className="controls-section">
        <div className="search-bar-wrapper">
          <SearchIcon className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-chips">
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="products-list">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => {
            const style = getCategoryStyle(product.category);
            const IconComponent = style.icon;

            return (
              <div key={product.id} className="product-card">
                <div className="product-thumb" style={{ backgroundColor: style.bgColor, color: style.color }}>
                  <IconComponent fontSize="large" />
                </div>
                <div className="product-details">
                  <div className="product-name">{product.name}</div>
                  <div className="product-meta">
                    <span className="price-tag">₹{product.selling_price}</span>
                    <span className="meta-item">/ {product.unit}</span>
                    <span className="meta-item category-tag">
                      {product.category}
                    </span>
                  </div>
                </div>
                <div className="product-actions">
                  <button className="action-btn edit-btn" onClick={() => handleEditOpen(product)}>
                    <EditIcon fontSize="small" />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => handleDeleteProduct(product.id)}>
                    <DeleteIcon fontSize="small" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ textAlign: 'center', color: '#999', marginTop: '40px' }}>
            <CategoryIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
            <p>No products found.</p>
          </div>
        )}
      </div>

      <button className="fab-add" onClick={() => setOpen(true)}>
        <AddIcon sx={{ fontSize: 32 }} />
      </button>

      {/* --- ADD DIALOG --- */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Product</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Product Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth variant="outlined" autoFocus
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Price (₹)" type="number" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                fullWidth variant="outlined"
              />
              <TextField
                label="Unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                fullWidth variant="outlined"
              />
            </Box>
            <TextField
              select label="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              fullWidth variant="outlined"
            >
              {categories.slice(1).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={handleAddProduct} variant="contained" sx={{ bgcolor: '#333', borderRadius: '10px' }}>Add Product</Button>
        </DialogActions>
      </Dialog>

      {/* --- EDIT DIALOG --- */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Product</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Product Name" value={editingProduct?.name || ''}
              onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
              fullWidth variant="outlined"
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Price (₹)" type="number" value={editingProduct?.selling_price || ''}
                onChange={(e) => setEditingProduct(prev => prev ? { ...prev, selling_price: Number(e.target.value) } : null)}
                fullWidth variant="outlined"
              />
              <TextField
                label="Unit" value={editingProduct?.unit || ''}
                onChange={(e) => setEditingProduct(prev => prev ? { ...prev, unit: e.target.value } : null)}
                fullWidth variant="outlined"
              />
            </Box>
            <TextField
              select label="Category" value={editingProduct?.category || ''}
              onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
              fullWidth variant="outlined"
            >
              {categories.slice(1).map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditOpen(false)} sx={{ color: '#666' }}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" sx={{ bgcolor: '#333', borderRadius: '10px' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProductsPage;