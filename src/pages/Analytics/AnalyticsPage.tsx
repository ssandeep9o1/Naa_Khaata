// src/pages/Analytics/AnalyticsPage.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Container, Typography, Grid, Box, List, ListItem, ListItemText, Avatar, ListItemAvatar, Card, CardContent, Divider, Tooltip as MuiTooltip } from '@mui/material';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import './AnalyticsPage.css';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import PaidIcon from '@mui/icons-material/Paid';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import Chip from '@mui/material/Chip';

// Interfaces for our data
interface Customer { id: string; name: string; due_amount: number; }
interface Transaction { shop_id: string; total_amount: number; amount_paid: number; created_at: string; }

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!user) return;
      setLoading(true);
      // Fetch both customers and transactions in parallel
      const [customerRes, transactionRes] = await Promise.all([
        supabase.from('customers').select('id, name, due_amount').eq('shop_id', user.id),
        supabase.from('transactions').select('shop_id, total_amount, amount_paid, created_at').eq('shop_id', user.id)
      ]);
      
      if (customerRes.error || transactionRes.error) {
        console.error(customerRes.error || transactionRes.error);
      } else {
        setCustomers(customerRes.data || []);
        setTransactions((transactionRes.data || []).map(t => ({ ...t, shop_id: t.shop_id || user.id })));
      }
      setLoading(false);
    };
    fetchAnalyticsData();
  }, [user]);

  // Perform all calculations using useMemo for efficiency
  const analytics = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const totalDue = customers.reduce((sum, c) => sum + (c.due_amount || 0), 0);
    const totalCustomers = customers.length;
    
    const monthlyTransactions = transactions.filter(t => new Date(t.created_at) >= startOfMonth);
    const totalCollectedThisMonth = monthlyTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0);
    const totalCreditThisMonth = monthlyTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    const highestDebtors = [...customers].sort((a, b) => (b.due_amount || 0) - (a.due_amount || 0)).slice(0, 5);

    // Chart Data: Group transactions by day for the last 30 days
    const chartData = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const day = date.toISOString().split('T')[0];
      return { date: day, Credit: 0, Collected: 0 };
    }).reverse();

    transactions.forEach(t => {
      const day = new Date(t.created_at).toISOString().split('T')[0];
      const dayData = chartData.find(d => d.date === day);
      if (dayData) {
        dayData.Credit += t.total_amount || 0;
        dayData.Collected += t.amount_paid || 0;
      }
    });

    return {
      totalDue,
      totalCustomers,
      totalCollectedThisMonth,
      totalCreditThisMonth,
      highestDebtors,
      chartData: chartData.map(d => ({...d, date: new Date(d.date).toLocaleDateString('en-IN', {day: '2-digit', month: 'short'})}))
    };
  }, [customers, transactions]);

  // Calculate slowest payers (customers with highest due and oldest transaction)
  const slowestPayers = useMemo(() => {
    // Find customers with due > 0
    const dueCustomers = customers.filter(c => c.due_amount > 0);
    // For each, find their oldest transaction date
    const customerOldestDue = dueCustomers.map(c => {
      const custTxns = transactions.filter(t => t.shop_id === user?.id && t.amount_paid < t.total_amount);
      // Find oldest transaction for this customer
      const oldest = custTxns.length > 0 ? custTxns.reduce((a, b) => new Date(a.created_at) < new Date(b.created_at) ? a : b) : null;
      return {
        ...c,
        oldestDueDate: oldest ? oldest.created_at : null,
        daysOverdue: oldest ? Math.floor((Date.now() - new Date(oldest.created_at).getTime()) / (1000 * 60 * 60 * 24)) : null
      };
    });
    // Sort by daysOverdue desc, then due_amount desc
    return customerOldestDue
      .filter(c => c.oldestDueDate)
      .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0) || (b.due_amount - a.due_amount))
      .slice(0, 5);
  }, [customers, transactions, user]);

  // Dues Distribution Pie Data
  const duesPieData = useMemo(() => {
    if (!customers.length) return [];
    const sorted = [...customers].sort((a, b) => b.due_amount - a.due_amount);
    const top = sorted.slice(0, 5);
    const othersDue = sorted.slice(5).reduce((sum, c) => sum + c.due_amount, 0);
    const pie = top.map(c => ({ name: c.name, value: c.due_amount }));
    if (othersDue > 0) pie.push({ name: 'Others', value: othersDue });
    return pie;
  }, [customers]);

  // Pie chart colors
  const PIE_COLORS = ['#d32f2f', '#1976d2', '#fbc02d', '#2e7d32', '#7b1fa2', '#90a4ae'];

  if (loading) return <Typography sx={{ textAlign: 'center', mt: 4 }}>Loading analytics...</Typography>;

  return (
    <Container maxWidth="lg" className="analytics-page-container">
      <Typography variant="h4" gutterBottom className="analytics-title">
        Shop Analytics
      </Typography>

      {/* 1. Summary Cards */}
      <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }} className="summary-grid">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-icon stat-due"><CreditCardIcon fontSize="large" /></Box>
              <Typography variant="subtitle2" className="stat-label">Total Due</Typography>
              <Typography variant="h5" className="stat-value">₹{analytics.totalDue.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-icon stat-customers"><PeopleIcon fontSize="large" /></Box>
              <Typography variant="subtitle2" className="stat-label">Total Customers</Typography>
              <Typography variant="h5" className="stat-value">{analytics.totalCustomers}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-icon stat-collected"><PaidIcon fontSize="large" /></Box>
              <Typography variant="subtitle2" className="stat-label">Paid This Month</Typography>
              <Typography variant="h5" className="stat-value stat-collected-value">₹{analytics.totalCollectedThisMonth.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card className="stat-card">
            <CardContent>
              <Box className="stat-icon stat-credit"><TrendingUpIcon fontSize="large" /></Box>
              <Typography variant="subtitle2" className="stat-label">Credit This Month</Typography>
              <Typography variant="h5" className="stat-value stat-credit-value">₹{analytics.totalCreditThisMonth.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 2b. Monthly Trend Line Chart */}
      <Card className="chart-card">
        <CardContent>
          <Typography variant="h6" className="chart-title">Monthly Trend (Credit vs. Collection)</Typography>
          <Divider sx={{ mb: 2 }} />
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="Credit" stroke="#d32f2f" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Collected" stroke="#2e7d32" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 2d. Dues Distribution Pie/Donut Chart */}
      <Card className="chart-card">
        <CardContent>
          <Typography variant="h6" className="chart-title">Dues Distribution</Typography>
          <Divider sx={{ mb: 2 }} />
          {duesPieData.length === 0 ? (
            <Box sx={{ textAlign: 'center', color: '#888', py: 6 }}>
              <em>No due data available.</em>
            </Box>
          ) : (
            <Box sx={{ width: '100%', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={duesPieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    label={({ name, percent }) => `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  >
                    {duesPieData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#888' }}>Total Due</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: '#d32f2f' }}>₹{analytics.totalDue.toFixed(2)}</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', mt: 1 }}>
                  {duesPieData.map((entry, idx) => (
                    <Box key={entry.name} sx={{ display: 'flex', alignItems: 'center', mr: 2, mb: 1 }}>
                      <Box sx={{ width: 16, height: 16, bgcolor: PIE_COLORS[idx % PIE_COLORS.length], borderRadius: '50%', mr: 1 }} />
                      <Typography variant="body2">{entry.name}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 3. Top Priority Lists */}
      <Grid container spacing={3} columns={{ xs: 12, md: 12 }} sx={{ mt: 2 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="list-card">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1} pl={1}>
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6" className="list-title" sx={{ mb: 0, pl: 0 }}>Highest Debtors</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <List>
                {analytics.highestDebtors.map((c, idx) => (
                  <ListItem key={c.id} className="debtor-list-item">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#fff0f0', color: '#d32f2f', fontWeight: 700 }}>{c.name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                          {c.name}
                          <Chip label={`₹${c.due_amount}`} color="error" size="medium" sx={{ ml: 40, fontWeight: 700, fontSize: '1.05rem', letterSpacing: 0.5 }} />
                        </span>
                      }
                      secondary={idx === 0 ? 'Top Debtor' : null}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="list-card">
            <CardContent>
              <Box display="flex" alignItems="center" mb={1} pl={1}>
                <AccessTimeIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6" className="list-title" sx={{ mb: 0, pl: 0 }}>Slowest Payers</Typography>
              </Box>
              <Divider sx={{ mb: 1 }} />
              <List>
                {slowestPayers.length === 0 ? (
                  <Typography className="coming-soon" sx={{ p: 2, opacity: 0.7 }}>No slow payers found. All dues are recent or paid on time!</Typography>
                ) : slowestPayers.map(c => (
                  <ListItem key={c.id} className="debtor-list-item">
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: '#fffde7', color: '#fbc02d', fontWeight: 700 }}>{c.name[0]}</Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                          {c.name}
                          <Chip label={`${c.daysOverdue} days`} color="warning" size="medium" sx={{ ml: 40, fontWeight: 700, fontSize: '1.05rem', letterSpacing: 0.5 }} />
                        </span>
                      }
                      secondary={`Due: ₹${c.due_amount}`}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsPage;