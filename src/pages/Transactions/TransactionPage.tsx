// src/pages/Transactions/TransactionPage.tsx
import React, { useState, useEffect, useMemo,useRef   } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useParams} from 'react-router-dom';
import {
  Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Avatar, Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Button, IconButton, Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import './TransactionPage.css';

// Define types based on your Supabase schema
interface Customer {
  id: string; name: string; phone: string; image_url: string | null; due_amount: number;
}
interface Transaction {
  id: string; customer_id: string; shop_id: string;
  total_amount: number; amount_paid: number;
  transaction_type: 'sale' | 'payment';
  notes: string; created_at: string;
}

const TransactionPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ amount: '', notes: '', type: 'sale' as 'sale' | 'payment' });
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const transactionsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (transactionsContainerRef.current) {
      transactionsContainerRef.current.scrollTop = transactionsContainerRef.current.scrollHeight;
    }
  }, [transactions]);

  useEffect(() => {
    const fetchData = async () => {
      if (!customerId || !user) return;
      setLoading(true);

      const { data: customerData, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, image_url, due_amount')
        .eq('id', customerId)
        .single();
      
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions').select('*').eq('customer_id', customerId).order('created_at', { ascending: true });

      if (customerError || transactionsError) {
        console.error(customerError || transactionsError);
        alert('Failed to fetch data.');
      } else {
        setCustomer(customerData);
        setTransactions(transactionsData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, [customerId, user]);

  const sendWhatsAppConfirmation = (customerData: Customer, newTransaction: Transaction, updatedDue: number) => {
    if (!customerData || !newTransaction) {
      console.error("Cannot send WhatsApp message: missing customer or transaction data.");
      return;
    }
    const transactionLabel = newTransaction.transaction_type === 'sale' ? 'Purchased' : 'Paid';
    const amount = newTransaction.transaction_type === 'sale' ? newTransaction.total_amount : newTransaction.amount_paid;
    const details = newTransaction.notes || '';

    const transactionDate = new Date(newTransaction.created_at);
    
    const formattedTime = transactionDate.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase();
    const formattedDate = transactionDate.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
    let message = ``;
    message += `*${transactionLabel} : ${amount}₹*`;
    if (details) {
      message += ` , ${details}`; 
    }
    message += ` , ${formattedTime}, ${formattedDate}`;
    if (newTransaction.transaction_type === 'payment') {
        message += `\n\nTotal Due *₹${updatedDue.toFixed(2)}*.`;
    }

    const phoneNumber = `91${customerData.phone.replace(/\D/g, '')}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, '_blank');
  };

  const handleAddTransaction = async () => {
    if (!form.amount || !customerId || !user || !customer) return;
    
    const newTransactionPayload = {
      customer_id: customerId,
      shop_id: user.id,
      transaction_type: form.type,
      total_amount: form.type === 'sale' ? Number(form.amount) : 0,
      amount_paid: form.type === 'payment' ? Number(form.amount) : 0,
      notes: form.notes,
    };

    const { data: newTransaction, error } = await supabase.from('transactions').insert(newTransactionPayload).select().single();

    if (error) {
      alert('Error adding transaction: ' + error.message);
    } else if (newTransaction) {
      // Refetch customer data to get the updated due_amount
      const { data: updatedCustomer } = await supabase
        .from('customers')
        .select('id, name, phone, image_url, due_amount')
        .eq('id', customerId)
        .single();
        
      if (updatedCustomer) {
        setCustomer(updatedCustomer);
        setTransactions([...transactions, newTransaction]);
        'sendWhatsAppConfirmation(updatedCustomer, newTransaction, updatedCustomer.due_amount); #To send messages to customer on adding a transaction'

      } else {
        setTransactions([...transactions, newTransaction]);
      }
      setOpen(false);
      setForm({ amount: '', notes: '', type: 'sale' });
    }
  };
  
  const handleDeleteTransaction = async (txId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const { error } = await supabase.from('transactions').delete().eq('id', txId);
      if (error) {
        alert('Error deleting transaction: ' + error.message);
      } else {
        const { data: updatedCustomer } = await supabase
          .from('customers')
          .select('id, name, phone, image_url, due_amount')
          .eq('id', customerId)
          .single();

        setCustomer(updatedCustomer);
        setTransactions(transactions.filter(tx => tx.id !== txId));
      }
    }
  };
  
  const transactionPages = useMemo(() => {
    const pages: Transaction[][] = [];
    let currentPage: Transaction[] = [];

    transactions.forEach(tx => {
      currentPage.push(tx);
      if (tx.transaction_type === 'payment') {
        pages.push(currentPage);
        currentPage = [];
      }
    });

    if (currentPage.length > 0) {
      pages.push(currentPage);
    }

    return pages;
  }, [transactions]);

    const handleEditOpen = () => {
    if (customer) {
      setEditForm({ name: customer.name, phone: customer.phone });
      setEditOpen(true);
    }
  };

  const handleEditClose = () => setEditOpen(false);

  const handleEditSave = async () => {
    if (!customerId) return;
    const { data, error } = await supabase
      .from('customers')
      .update({ name: editForm.name, phone: editForm.phone })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      alert('Error updating customer: ' + error.message);
    } else if (data) {
      setCustomer(data);
      handleEditClose();
    }
  };

  const handleSendWhatsApp = () => {
    // 1. Guard clauses
    if (!customer || transactionPages.length === 0) {
      alert("No transaction data to send.");
      return;
    }

    // 2. Get data and calculate previous due
    const latestPage = transactionPages[transactionPages.length - 1];
    const previousPages = transactionPages.slice(0, transactionPages.length - 1);
    const previousDue = previousPages.reduce((total, page) => {
      const pageTotal = page.reduce((sum, tx) => sum + (tx.total_amount || 0) - (tx.amount_paid || 0), 0);
      return total + pageTotal;
    }, 0);

    // 3. Format the message string
    let message = `Hi *${customer.name}* గారు,\n\nమీ ఖాతా బిల్లు:\n`;

    if (previousDue > 0) {
      message += `\n*Previous Due:* ₹${previousDue.toFixed(2)}\n\n`;
    }

    message += "```"; 
    message += `${'Item'.padEnd(12)}${'Price'.padEnd(10)}${'Date'.padEnd(1)}\n\n`;
    latestPage.forEach(tx => {
      const date = new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' });
      const itemText = tx.notes || (tx.transaction_type === 'sale' ? 'Purchase' : 'Payment');
      const item = itemText.length > 14 ? itemText.substring(0, 13) + '…' : itemText;
      const price = tx.transaction_type === 'sale' 
        ? `+${tx.total_amount}` 
        : `-${tx.amount_paid}`;

      message += `${item.padEnd(12)}${price.padEnd(10)}${date.padEnd(1)}\n`;
    });
    message += "```";

    const latestPageTotal = latestPage.reduce((sum, tx) => sum + (tx.total_amount || 0) - (tx.amount_paid || 0), 0);
    const currentTotalDue = previousDue + latestPageTotal;
    message += `\n*Total Due:* *₹${currentTotalDue.toFixed(2)}*\n\nThank you!`;

    const phoneNumber = `91${customer.phone.replace(/\D/g, '')}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  console.log('Rendering Transaction Page with Customer Data:', customer);

  if (loading) return <Typography sx={{ textAlign: 'center', mt: 4 }}>Loading...</Typography>;
  if (!customer) return <Typography sx={{ textAlign: 'center', mt: 4 }}>Customer not found.</Typography>;

  let previousDue = 0;

  return (
    <Container maxWidth="md" className="transaction-page-container">
      <Paper className="customer-header-paper">
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={customer.image_url || ''} sx={{ width: 90, height: 90 }}>
            {customer.name[0]}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, ml: 1 }}>{customer.name}</Typography>
              <IconButton size="small" onClick={handleEditOpen}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
            <div className="whatsapp-button" role="button" tabIndex={0} onClick={handleSendWhatsApp}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="whatsapp-icon">
                    <path fill="currentColor" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.8 0-67.3-8.8-95.2-25.4l-6.7-4-70.8 18.5 18.8-69.1-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
                </svg>
                <span>{customer.phone}</span>
            </div>
          </Box>
        </Box>
        <Box>
          <Typography variant="subtitle2" color="text.secondary" sx={{ textAlign: 'left' }}>Total Due</Typography>
          <Chip 
            label={`₹${customer.due_amount}`} 
            color={customer.due_amount > 0 ? 'warning' : 'success'} 
            sx={{ fontWeight: 700, fontSize: 18 }} 
          />
        </Box>
      </Paper>

      {/* --- NEW RENDERING LOGIC: Map over pages --- */}
      <div className="scrollable-transactions-container" ref={transactionsContainerRef}>
      {transactionPages.map((page, pageIndex) => {
        const pageTotal = page.reduce((sum, tx) => sum + (tx.total_amount || 0) - (tx.amount_paid || 0), 0);
        const currentDue = previousDue + pageTotal;

        const component = (
          <Box key={pageIndex} sx={{ mt: pageIndex > 0 ? 5 : 0 }}>
            {pageIndex > 0 && (
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                New Page
              </Typography>
            )}
            <TableContainer component={Paper} className="transaction-table-container">
              <Table>
                <TableHead className="transaction-table-head">
                  <TableRow>
                    <TableCell sx={{ width: '5%' }}>No.</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right">Credit (+)</TableCell>
                    <TableCell align="right">Paid (-)</TableCell>
                    <TableCell align="right">Delete</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pageIndex > 0 && (
                     <TableRow sx={{ backgroundColor: 'rgba(0,0,0,0.02)'}}>
                      <TableCell colSpan={3} sx={{ fontWeight: 700 }}>Previous Due</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{previousDue}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  )}
                  {page.map((tx, index) => (
                    <TableRow key={tx.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' })}</TableCell>
                      <TableCell>{tx.notes}</TableCell>
                      <TableCell align="right" sx={{ color: 'green' }}>
                        {tx.transaction_type === 'sale' ? `₹${tx.total_amount}` : ''}
                      </TableCell>
                      <TableCell align="right" sx={{ color: 'red' }}>
                        {tx.transaction_type === 'payment' ? `₹${tx.amount_paid}` : ''}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton size="small" color="error" onClick={() => handleDeleteTransaction(tx.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                      <TableCell colSpan={5} align="right" sx={{ fontWeight: 700 }}>Total</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 700 }}>₹{currentDue}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        );

        previousDue = currentDue; // Update previous due for the next page
        return component;
      })}
      </div>

      <button className="fab-add-product" title="Add Transaction" onClick={() => setOpen(true)}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Add Transaction</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            select label="Type" name="type" value={form.type}
            onChange={(e) => setForm({...form, type: e.target.value as 'sale' | 'payment'})}
          >
            <MenuItem value="sale">Credit</MenuItem>
            <MenuItem value="payment">Paid</MenuItem>
          </TextField>
          <TextField
            label="Amount" name="amount" type="number" value={form.amount}
            onChange={(e) => setForm({...form, amount: e.target.value})}
          />
          <TextField
            label="Details (e.g., '5kg Rice')" name="notes" value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAddTransaction} variant="contained">Add</Button>
        </DialogActions>
      </Dialog>

            {/* --- NEW: Edit Customer Dialog --- */}
      <Dialog open={editOpen} onClose={handleEditClose} fullWidth maxWidth="xs">
        <DialogTitle>Edit Customer Details</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            fullWidth
            autoFocus
          />
          <TextField
            label="Phone Number"
            value={editForm.phone}
            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default TransactionPage;