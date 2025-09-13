import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  CircularProgress,
  Box,
  Avatar,
  Chip,
  Typography,
  Alert,
  Paper,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import './DashboardPage.css';

interface Customer {
  id: string;
  name: string;
  phone: string;
  due_amount: number;
  image_url?: string;
}

interface Transaction {
  amount_paid: number;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- START: Added state for search and add-customer dialog ---
  const [search, setSearch] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  // --- END: Added state ---

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);

      try {
        const [customerRes, transactionRes] = await Promise.all([
          supabase
            .from('customers')
            .select('id, name, phone, due_amount, image_url')
            .eq('shop_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('transactions')
            .select('amount_paid')
            .eq('shop_id', user.id)
            .gte('created_at', new Date().toISOString().slice(0, 10))
        ]);

        if (customerRes.error) throw customerRes.error;
        setCustomers(customerRes.data || []);

        if (transactionRes.error) throw transactionRes.error;
        setTransactions(transactionRes.data || []);

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // --- START: Added functions for adding a customer ---
  const handleAddSubmit = async () => {
    if (!form.name || !user) return;
    
    let imageUrl: string | null = null;

    if (imageFile) {
      const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('customer-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        alert(`Error uploading image: ${uploadError.message}`);
        return;
      }
      
      const { data: urlData } = supabase.storage
        .from('customer-images')
        .getPublicUrl(uploadData.path);
      
      imageUrl = urlData.publicUrl;
    }

    const newCustomer = { 
      name: form.name, 
      phone: form.phone,
      address: form.address,
      shop_id: user.id,
      image_url: imageUrl,
      // You might want to initialize due_amount
      due_amount: 0,
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();

    if (error) {
      alert(`Error adding customer: ${error.message}`);
    } else if (data) {
      // Add the new customer to the list without a full reload
      setCustomers(prevCustomers => [data, ...prevCustomers]);
      handleCloseDialog();
    }
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCloseDialog = () => {
    setAddDialogOpen(false);
    setForm({ name: '', phone: '', address: '' });
    setImageFile(null);
    setImagePreview('');
  };
  // --- END: Added functions ---

  const summaryStats = useMemo(() => {
    const totalDue = customers.reduce((sum, c) => sum + (c.due_amount || 0), 0);
    const todaysCollection = transactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0);
    return {
      totalCustomers: customers.length,
      totalDue: totalDue,
      todaysCollection: todaysCollection,
    };
  }, [customers, transactions]);

  // --- MODIFIED: Added search filter to useMemo hook ---
  const filteredCustomers = useMemo(() => {
    return customers
      .filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.phone && c.phone.includes(search))
      )
      .sort((a, b) => b.due_amount - a.due_amount)
  }, [customers, search]);


  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh', padding: '2rem' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    
    <div>
      <div className="title-container">
        <h1 className="main-title">నా ఖాతా</h1>
        <p className="tagline">సులభమైన ఖాతా నిర్వహణ</p>
      </div>


      <div className="summary-container">
        <div className="statt-card">
          <span className="statt-label">Total Customers</span>
          <span className="statt-value">{summaryStats.totalCustomers}</span>
        </div>
        <div className="statt-card">
          <span className="statt-label">Total Due</span>
          <span className="statt-value">₹{summaryStats.totalDue.toFixed(0)}</span>
        </div>
        <div className="statt-card">
          <span className="statt-label">Today's Collection</span>
          <span className="statt-value">₹{summaryStats.todaysCollection.toFixed(0)}</span>
        </div>
      </div>

      <Box sx={{
                display: 'flex',
                flexDirection: 'column', // Stacks items vertically
                alignItems: 'center',     // Centers items horizontally
                gap: 2,                   // Creates space between the button and search bar
                mb: 4,                    // Margin below the search bar
              }}
            >
        {/*  "Add Customer" button */}
        <Button 
          variant="contained" 
          onClick={() => setAddDialogOpen(true)}
          sx={{ fontWeight: 'bold', backgroundColor: '#333',  borderRadius: '10px', height: '50px', width: '150px', '&:hover': { backgroundColor: '#555',},
          }}>
          Add Customer
        </Button>
        {/* Search bar */}
        
          <TextField
            placeholder="Search by customer name..."
            variant="outlined"
            value={search} 
            onChange={(e) => setSearch(e.target.value)}
            sx={{
            width: { xs: '80%', sm: '300px', md: '400px' },
            marginBottom: 3,
              '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon color="action" />
            </InputAdornment>
          ),
        }}
      />
 
      </Box>

      <div className="top-customers-section">
        <h2 className="section-title">Customers</h2>
        <div className="customer-cards-container">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="card"
                onClick={() => navigate(`/customer/${customer.id}`)}
              >
                <Avatar
                  src={customer.image_url}
                  alt={customer.name}
                  sx={{ width: 90, height: 90, marginBottom: '1rem' }}
                >
                  {customer.name[0]}
                </Avatar>
                <p className="customer-name">{customer.name}</p>
                <p className="customer-info">{customer.phone}</p>
                <Chip
                  label={`Due: ₹${customer.due_amount.toFixed(0)}`}
                  color="error" 
                  sx={{ fontWeight: 700, fontSize: 16, my: 1 }}
                />
              </div>
            ))
          ) : (
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 4 }}>
              No customers found. Try clearing your search or add a new customer!
            </Typography>
          )}
        </div>
      </div>

      <Dialog
        open={addDialogOpen}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>
          Add New Customer
        </DialogTitle>
        <DialogContent sx={{ p: 3, '&::-webkit-scrollbar': { display: 'none' }, scrollbarWidth: 'none' }}>
          <Box
            component="label"
            htmlFor="file-upload"
            sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 1, p: 2.5, mb: 2, border: '2px dashed #dcdcdc',
              borderRadius: '15px', cursor: 'pointer', textAlign: 'center',
              transition: 'border-color 0.2s, background-color 0.2s',
              '&:hover': { borderColor: '#999', backgroundColor: '#fafafa' }
            }}
          >
            <Avatar src={imagePreview} sx={{ width: 80, height: 80, mb: 1 }} />
            <Typography sx={{ fontWeight: 600, color: '#555' }}>
              {imageFile ? 'Change Photo' : 'Upload Photo'}
            </Typography>
            <Typography variant="caption" sx={{ color: '#888' }}>
              Click here to browse
            </Typography>
            <input id="file-upload" type="file" accept="image/*" hidden onChange={handleImageChange} />
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth autoFocus variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
            />
            <TextField
              label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
            />
            <TextField
              label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth multiline rows={2} variant="outlined"
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', backgroundColor: '#f9f9f9' } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: '0 24px 24px', display: 'flex', gap: 1 }}>
          <Button onClick={handleCloseDialog} sx={{ flex: 1, color: '#000000ff', fontWeight: 600, borderRadius: '10px', py: 1.25 }}>
            Cancel
          </Button>
          <Button onClick={handleAddSubmit} variant="contained" sx={{
            flex: 2, fontWeight: 'bold', backgroundColor: '#333',
            borderRadius: '10px', py: 1.25, '&:hover': { backgroundColor: '#555' }
          }}>
            Add Customer
          </Button>
        </DialogActions>
      </Dialog>
      {/* --- END: Added Floating Action Button and Dialog --- */}
    </div>
  );
};

export default DashboardPage;