import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box, Avatar, Chip, Typography, Alert } from '@mui/material';
import './DashboardPage.css';

// Interfaces remain the same
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
  const [error, setError] = useState<string | null>(null); // NEW: Error state
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      setError(null); // Reset error on new fetch

      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

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
            .gte('created_at', today.toISOString())
            .lt('created_at', tomorrow.toISOString())
        ]);

        if (customerRes.error) throw customerRes.error;
        setCustomers(customerRes.data || []);

        if (transactionRes.error) throw transactionRes.error;
        setTransactions(transactionRes.data || []);

      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later."); // NEW: Set a user-friendly error message
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  // useMemo hooks remain the same
  const summaryStats = useMemo(() => {
    const totalDue = customers.reduce((sum, c) => sum + (c.due_amount || 0), 0);
    const todaysCollection = transactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0);
    return {
      totalCustomers: customers.length,
      totalDue: totalDue,
      todaysCollection: todaysCollection,
    };
  }, [customers, transactions]);

  const allDueCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.due_amount - a.due_amount)
  }, [customers]);

  // Loading state remains the same
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // NEW: Display error message if something went wrong
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

      {/* New container to hold the individual cards */}
<div className="summary-container">
  {/* Card 1: Total Customers */}
  <div className="statt-card">
    <span className="stat-label">Total Customers</span>
    <span className="stat-value">{summaryStats.totalCustomers}</span>
  </div>

  {/* Card 2: Total Due */}
  <div className="statt-card">
    <span className="stat-label">Total Due</span>
    <span className="stat-value">₹{summaryStats.totalDue}</span>
  </div>

  {/* Card 3: Today's Collection */}
  <div className="statt-card">
    <span className="stat-label">Today's Collection</span>
    <span className="stat-value">₹{summaryStats.todaysCollection}</span>
  </div>
</div>

      <div className="top-customers-section">
        <h2 className="section-title">Customers</h2>
        <div className="customer-cards-container">
          {/* NEW: Handle the empty state when there are no customers */}
          {allDueCustomers.length > 0 ? (
            allDueCustomers.map((customer) => (
              <div
                key={customer.id}
                className="card"
                onClick={() => navigate(`/customer/${customer.id}`)}
              >
                <Avatar
                  src={customer.image_url}
                  alt={customer.name}
                  sx={{ width: 90, height: 90, marginBottom: '1rem' }}
                />
                <p className="customer-name">{customer.name}</p>
                <p className="customer-info">{customer.phone}</p>
                <Chip
                  label={`Due: ₹${customer.due_amount.toFixed(2)}`}
                  color="error" // Correct semantic color
                  sx={{ fontWeight: 700, fontSize: 16, my: 1 }}
                />
              </div>
            ))
          ) : (
            <Typography variant="body1" sx={{ color: 'text.secondary', mt: 4 }}>
              No customers found. Add your first customer to see them here!
            </Typography>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;