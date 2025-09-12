import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Typography, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Accordion, AccordionSummary, AccordionDetails, MenuItem, CircularProgress, Box
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import './ProductsPage.css';

interface Product {
  id: string;
  name: string;
  unit: string;
  selling_price: number;
  category: string;
}

const categories = [
  'Flour & Rava', 'Dals and Pulses', 'Rice', 'Oil', 'Dry Fruits', 'Pooja Items', 'Plates & Glasses', 'Uncategorized'
];

const ProductsPage: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', unit: 'piece', selling_price: '', category: 'Uncategorized' });
  const [editOpen, setEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', user.id);

      if (error) console.error('Error fetching products:', error);
      else setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [user]);

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
      setProducts([...products, data]);
      setOpen(false);
      setForm({ name: '', unit: 'piece', selling_price: '', category: 'Uncategorized' });
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) alert('Error deleting product: ' + error.message);
      else setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleEditOpen = (product: Product) => {
    setEditingProduct(product);
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    setEditingProduct(null); // Clear the editing state
  };

  const handleEditSave = async () => {
    if (!editingProduct) return;
    const { id, name, unit, selling_price, category } = editingProduct;

    const { error } = await supabase
      .from('products')
      .update({
        name,
        unit,
        selling_price: Number(selling_price),
        category,
      })
      .eq('id', id);

    if (error) {
      alert('Error updating product: ' + error.message);
    } else {
      setProducts(products.map(p => (p.id === id ? { ...p, name, unit, selling_price: Number(selling_price), category } : p)));
      handleEditClose();
    }
  };

  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.category || 'Uncategorized';
      (acc[category] = acc[category] || []).push(product);
      return acc;
    }, {} as Record<string, Product[]>);
  }, [products]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="products-page-container">
      <Typography variant="h4" className="products-page-title">
        My Products
      </Typography>

      {categories.map(category => (
        groupedProducts[category] && (
          <Accordion key={category} className="category-accordion">
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>{category}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <ul className="product-list" style={{ listStyle: 'none', padding: 0 }}>
                {groupedProducts[category].map((product, index) => (
                  <li key={product.id}>
                    <div className="product-list-item">
                      <div className="product-info">
                        <span className="product-index">{index + 1}.</span>
                        <div>
                          <div className="product-name">{product.name}</div>
                          <div className="product-details">{`₹${product.selling_price} / ${product.unit}`}</div>
                        </div>
                      </div>
                      <button className="edit-button" title="Edit Product" onClick={() => handleEditOpen(product)}>
                        <EditIcon fontSize="small" />
                      </button>
                      <button className="delete-button" title="Delete Product" onClick={() => handleDeleteProduct(product.id)}>
                        <svg viewBox="0 0 15 17.5" xmlns="http://www.w3.org/2000/svg">
                          <path d="M15,18.75H5A1.251,1.251,0,0,1,3.75,17.5V5H2.5V3.75h15V5H16.25V17.5A1.251,1.251,0,0,1,15,18.75ZM5,5V17.5H15V5Zm7.5,10H11.25V7.5H12.5V15ZM8.75,15H7.5V7.5H8.75V15ZM12.5,2.5h-5V1.25h5V2.5Z" transform="translate(-2.5 -1.25)" />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </AccordionDetails>
          </Accordion>
        )
      ))}

      <button className="fab-add-product" title="Add Product" onClick={() => setOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '20px', padding: '16px' } }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', mb: -5}}>
          Add New Product
        </DialogTitle>
        <br />
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            select label="Category" value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
          >
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
          <TextField
            label="Product Name" value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            autoFocus
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
          />
          <TextField
            label="Selling Price (₹)" type="number" value={form.selling_price}
            onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
          />
          <TextField
            label="Unit (e.g., kg, piece, litre)" value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e. target.value })}
            variant="outlined"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddProduct} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>
      
      {/* --- NEW EDIT PRODUCT DIALOG --- */}
      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="xs">
        <DialogTitle>Edit Product</DialogTitle>
        <DialogContent>
          <TextField
            label="Product Name" name="name" value={editingProduct?.name || ''}
            onChange={(e) => setEditingProduct(prev => prev ? { ...prev, name: e.target.value } : null)}
            autoFocus fullWidth margin="dense"
          />
          <TextField
            label="Selling Price (₹)" name="selling_price" type="number" value={editingProduct?.selling_price || ''}
            onChange={(e) => setEditingProduct(prev => prev ? { ...prev, selling_price: Number(e.target.value) } : null)}
            fullWidth margin="dense"
          />
          <TextField
            label="Unit (e.g., kg, piece, litre)" name="unit" value={editingProduct?.unit || ''}
            onChange={(e) => setEditingProduct(prev => prev ? { ...prev, unit: e.target.value } : null)}
            fullWidth margin="dense"
          />
          <TextField
            select label="Category" name="category" value={editingProduct?.category || ''}
            onChange={(e) => setEditingProduct(prev => prev ? { ...prev, category: e.target.value } : null)}
            fullWidth margin="dense"
          >
            {categories.map(cat => <MenuItem key={cat} value={cat}>{cat}</MenuItem>)}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProductsPage;