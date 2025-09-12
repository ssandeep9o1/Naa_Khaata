// src/pages/ChillarKhata/ChillarKhataPage.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer,Button, TableHead, TableRow, TextField, IconButton, InputAdornment
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import './ChillarKhataPage.css';

interface MiscTransaction {
  id: string;
  customer_name: string;
  amount: number;
  created_at: string;
}

const ChillarKhataPage: React.FC = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<MiscTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', amount: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('misc_transactions')
        .select('*')
        .eq('shop_id', user.id)
        .order('created_at', { ascending: false });

      if (error) console.error('Error fetching transactions:', error);
      else setTransactions(data || []);
      setLoading(false);
    };
    fetchTransactions();
  }, [user]);

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.amount || !user) return;

    const { data, error } = await supabase
      .from('misc_transactions')
      .insert({
        shop_id: user.id,
        customer_name: form.name,
        amount: Number(form.amount)
      })
      .select()
      .single();

    if (error) {
      alert('Error adding entry: ' + error.message);
    } else if (data) {
      setTransactions([data, ...transactions]);
      setForm({ name: '', amount: '' });
    }
  };
  
  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      const { error } = await supabase.from('misc_transactions').delete().eq('id', id);
      if (error) alert('Error deleting entry: ' + error.message);
      else setTransactions(transactions.filter(tx => tx.id !== id));
    }
  };
  
  const filteredTransactions = transactions.filter(tx =>
    tx.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    // Updated line: Added maxWidth="md" to make the container narrower
    <Container className="chillar-khata-container" maxWidth="md">
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
        Chillar Khata
      </Typography>
      <br />
      {/*  Search Bar  */}
      <TextField
        fullWidth
        placeholder="Search by customer name..."
        variant="outlined"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{
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

      <Paper component="form" onSubmit={handleAddEntry} sx={{ display: 'flex', gap: 2, padding: 2, marginBottom: 3, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' ,color:"primary"}}>
        <TextField
          label="Customer Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          variant="standard"
          size="small"
          sx={{ flex: 1, minWidth: '150px' }}
        />
        <TextField
          label="Credit(₹)"
          type="number"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          variant="standard"
          size="small"
          sx={{ flex: 1, maxWidth: '200px'}}
        />
        <Button
          variant="contained"
          onClick={handleAddEntry}
          sx={{
            flex: 0,
            fontWeight: 'bold',
            backgroundColor: '#333',
            borderRadius: '10px',
            py: 1.25,
            minWidth: '70px',
            width: '70px',
            height: '38px',
            '&:hover': {
              backgroundColor: '#555',
            },
          }}
        >
          Add
        </Button>

      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>No.</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Credit</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.map((tx, index) => (
              <TableRow key={tx.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{tx.customer_name}</TableCell>
                <TableCell>₹{tx.amount}</TableCell>
                <TableCell>{new Date(tx.created_at).toLocaleDateString()}</TableCell>
                <TableCell align="center">
                  <IconButton size="small" color="error" onClick={() => handleDeleteEntry(tx.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default ChillarKhataPage;