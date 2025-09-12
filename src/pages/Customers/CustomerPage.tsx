import React, { useState, useEffect, useMemo} from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
  Box, Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, IconButton, Menu, MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useNavigate } from 'react-router-dom';
import './CustomerPage.css';

interface Customer {
  id: string;
  name: string;
  phone: string;
  image_url: string | null;
  due_amount: number;
}

const CustomerPage: React.FC = () => {
  const { user } = useAuth();
  const [shopProfileExists, setShopProfileExists] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Due (High-Low)');
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  
  // State for image handling (simplified)
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const navigate = useNavigate();

  useEffect(() => {
    const checkProfileAndFetchCustomers = async () => {
      if (!user) return;
      setLoading(true);

      const { data: shopData } = await supabase
        .from('shops')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!shopData) {
        setShopProfileExists(false);
        setLoading(false);
        return;
      }
      
      setShopProfileExists(true);

      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, image_url, due_amount')
        .eq('shop_id', user.id);

      if (error) {
        setError('Failed to fetch customers.');
        console.error(error);
      } else {
        setCustomers(data || []);
      }
      setLoading(false);
    };
    checkProfileAndFetchCustomers();
  }, [user]);

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
    };

    const { data, error } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();

    if (error) {
      alert(`Error adding customer: ${error.message}`);
    } else if (data) {
      setCustomers([...customers, data]);
      handleCloseDialog();
    }
  };

  const handleRemoveCustomer = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) {
        alert('Error deleting customer.');
      } else {
        setCustomers(customers.filter(c => c.id !== id));
      }
    }
  };
  
  const sortedAndFilteredCustomers = useMemo(() => {
    return customers
      .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search))
      .sort((a, b) => {
        switch (sortBy) {
          case 'Due (Low-High)': return (a.due_amount || 0) - (b.due_amount || 0);
          case 'Name (A-Z)': return a.name.localeCompare(b.name);
          default: return (b.due_amount || 0) - (a.due_amount || 0);
        }
      });
  }, [customers, search, sortBy]);

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

  const handleSortClick = (event: React.MouseEvent<HTMLElement>) => setSortAnchorEl(event.currentTarget);
  const handleSortClose = () => setSortAnchorEl(null);
  const handleSortSelect = (option: string) => {
    setSortBy(option);
    handleSortClose();
  };

  if (loading) {
    return <Container><Typography sx={{ textAlign: 'center', mt: 4 }}>Loading...</Typography></Container>;
  }

  if (!shopProfileExists) {
    return (
      <Container sx={{ textAlign: 'center', mt: 5 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Shop Profile Not Found</Typography>
          <Typography sx={{ mb: 3 }}>
            You need to create a shop profile before you can add and manage customers.
          </Typography>
          <Button component={Link} to="/profile" variant="contained">
            Create Profile
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" className="customer-page-container">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 5 }}>
        Customer Management
      </Typography>
       
      <Paper 
        elevation={0}
        sx={{ 
          p: '8px 16px',
          mb: 3,
          display: 'flex', 
          alignItems: 'center', 
          gap: 2, 
          borderRadius: '16px',
          border: '1px solid #e0e0e0',
          maxWidth: 1000, // Decreased width
          mx: 'auto',    // Center horizontally
        }}
      >
        <TextField
          variant="standard"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          InputProps={{ 
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'text.secondary' }} />
          </InputAdornment>
        ),
        disableUnderline: true,
          }}
          sx={{ flex: 1 }}
        />
        <Button 
          variant="text"
          onClick={handleSortClick}
          sx={{ 
        color: '#ffffff',
        fontWeight: 600,
        textTransform: 'none',
        borderRadius: '14px',
        backgroundColor: '#393939ff',
          }}
        >
          Sort
        </Button>
        <Menu 
          anchorEl={sortAnchorEl} 
          open={Boolean(sortAnchorEl)} 
          onClose={handleSortClose}
          PaperProps={{
        elevation: 2,
        sx: {
          borderRadius: '8px',
          mt: 1,
        },
          }}
        >
          {['Due (High-Low)', 'Due (Low-High)', 'Name (A-Z)'].map(option => (
        <MenuItem 
          key={option} 
          selected={option === sortBy} 
          onClick={() => handleSortSelect(option)}
        >
          {option}
        </MenuItem>
          ))}
        </Menu>
      </Paper>
      
      <TableContainer 
        component={Paper} 
        sx={{ 
          borderRadius: 5, 
          boxShadow: 3, 
          maxWidth: 1030, // Decreased width
          mx: 'auto'     // Center horizontally
        }}
      >
        <Table>
          <TableHead>
        <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
          <TableCell sx={{ fontWeight: 600 }}>Photo</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
          <TableCell sx={{ fontWeight: 600 }}>Phone</TableCell>
          <TableCell align="right" sx={{ fontWeight: 600 }}>Due (₹)</TableCell>
          <TableCell align="center" sx={{ fontWeight: 600 }}>Remove</TableCell>
        </TableRow>
          </TableHead>
          <TableBody>
        {!loading && sortedAndFilteredCustomers.map((customer) => (
          <TableRow key={customer.id} hover className="customer-table-row" sx={{ cursor: 'pointer' }}>
            {/* --- THIS IS THE CHANGE --- */}
            <TableCell onClick={() => navigate(`/customer/${customer.id}`)}>
          <Avatar src={customer.image_url || ''}>{customer.name[0]}</Avatar>
            </TableCell>
            <TableCell onClick={() => navigate(`/customer/${customer.id}`)}>{customer.name}</TableCell>
            <TableCell onClick={() => navigate(`/customer/${customer.id}`)}>{customer.phone}</TableCell>
            <TableCell align="right" onClick={() => navigate(`/customer/${customer.id}`)}>{customer.due_amount}</TableCell>
            <TableCell align="center">
          <IconButton color="error" onClick={() => handleRemoveCustomer(customer.id)}>
            <DeleteOutlineIcon />
          </IconButton>
            </TableCell>
          </TableRow>
        ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* The new floating action button is added here */}
      <button className="fab-add-customer" title="Add Customer" onClick={() => setAddDialogOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      
{/* Replace your old Dialog with this new one */}
<Dialog
  open={addDialogOpen}
  onClose={handleCloseDialog}
  fullWidth
  maxWidth="xs"
  PaperProps={{
    sx: {
      borderRadius: '20px', // Consistent rounded corners
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
    }
  }}
>
  <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>
    Add New Customer
  </DialogTitle>
  <DialogContent sx={{ p: 3,
    // Add these lines to hide the scrollbar
    // For WebKit browsers (Chrome, Safari, Edge)
    '&::-webkit-scrollbar': {
      display: 'none',
    },
    // For Firefox
    scrollbarWidth: 'none',}}>
    {/* --- Modern Photo Upload --- */}
    <Box
      component="label" // Makes the whole area clickable
      htmlFor="file-upload"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 1,
        p: 2.5,
        mb: 2,
        border: '2px dashed #dcdcdc',
        borderRadius: '15px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'border-color 0.2s, background-color 0.2s',
        '&:hover': {
          borderColor: '#999',
          backgroundColor: '#fafafa'
        }
      }}
    >
      <Avatar src={imagePreview} sx={{ width: 80, height: 80, mb: 1 }} />
      <Typography sx={{ fontWeight: 600, color: '#555' }}>
        {imageFile ? 'Change Photo' : 'Upload Photo'}
      </Typography>
      <Typography variant="caption" sx={{ color: '#888' }}>
        Click here to browse
      </Typography>
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        hidden
        onChange={handleImageChange}
      />
    </Box>

    {/* --- Styled Text Fields --- */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        label="Name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        fullWidth
        autoFocus
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
          },
        }}
      />
      <TextField
        label="Phone Number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        fullWidth
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
          },
        }}
      />
      <TextField
        label="Address"
        value={form.address}
        onChange={(e) => setForm({ ...form, address: e.target.value })}
        fullWidth
        multiline
        rows={2}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '10px',
            backgroundColor: '#f9f9f9',
          },
        }}
      />
    </Box>
  </DialogContent>

  {/* --- Styled Action Buttons --- */}
  <DialogActions sx={{ p: '0 24px 24px', display: 'flex', gap: 1 }}>
    <Button
      onClick={handleCloseDialog}
      sx={{
        flex: 1,
        color: '#000000ff',
        fontWeight: 600,
        borderRadius: '10px',
        py: 1.25,
      }}
    >
      Cancel
    </Button>
    <Button
      onClick={handleAddSubmit}
      variant="contained"
      sx={{
        flex: 2,
        fontWeight: 'bold',
        backgroundColor: '#333',
        borderRadius: '10px',
        py: 1.25,
        '&:hover': {
          backgroundColor: '#555',
        },
      }}
    >
      Add Customer
    </Button>
  </DialogActions>
</Dialog>
    </Container>
  );
};  

export default CustomerPage;