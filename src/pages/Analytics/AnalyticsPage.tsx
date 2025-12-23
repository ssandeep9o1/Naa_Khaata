import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Container, Typography, Grid as Grid, Box, CircularProgress, Alert, Button, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { motion } from 'framer-motion';

// Icons
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import PaidIcon from '@mui/icons-material/Paid';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import RefreshIcon from '@mui/icons-material/Refresh';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

// Components
import StatCard from './components/StatCard';
import AnalyticsCharts from './components/AnalyticsCharts';
import DebtorsList from './components/DebtorsList';

// Interfaces
interface Customer { id: string; name: string; due_amount: number; }
interface Transaction { shop_id: string; total_amount: number; amount_paid: number; created_at: string; }

type DateRange = '7days' | '30days' | 'month' | 'year';

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>('month');

  const fetchAnalyticsData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [customerRes, transactionRes] = await Promise.all([
        supabase.from('customers').select('id, name, due_amount').eq('shop_id', user.id),
        supabase.from('transactions').select('shop_id, total_amount, amount_paid, created_at').eq('shop_id', user.id)
      ]);

      if (customerRes.error) throw customerRes.error;
      if (transactionRes.error) throw transactionRes.error;

      setCustomers(customerRes.data || []);
      setTransactions((transactionRes.data || []).map(t => ({ ...t, shop_id: t.shop_id || user.id })));
    } catch (err: any) {
      console.error(err);
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [user]);

  const handleDateRangeChange = (event: SelectChangeEvent) => {
    setDateRange(event.target.value as DateRange);
  };

  const analytics = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    if (dateRange === '7days') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === '30days') {
      startDate.setDate(now.getDate() - 30);
    } else if (dateRange === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (dateRange === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
    }

    // Filter transactions based on date range
    const filteredTransactions = transactions.filter(t => new Date(t.created_at) >= startDate);

    const totalDue = customers.reduce((sum, c) => sum + (c.due_amount || 0), 0);
    const totalCustomers = customers.length;

    const totalCollected = filteredTransactions.reduce((sum, t) => sum + (t.amount_paid || 0), 0);
    const totalCredit = filteredTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0);

    const highestDebtors = [...customers]
      .filter(c => c.due_amount > 0)
      .sort((a, b) => (b.due_amount || 0) - (a.due_amount || 0))
      .slice(0, 5);

    // Chart Data Generation
    let daysToGenerate = 0;
    if (dateRange === '7days') daysToGenerate = 7;
    else if (dateRange === '30days') daysToGenerate = 30;
    else if (dateRange === 'month') daysToGenerate = now.getDate(); // Days so far this month
    else if (dateRange === 'year') {
      // For year, we might want months? For now let's stick to days to be consistent or just simplified.
      // Actually for "Weekly Sales Trend" (AreaChart) daily is fine if not too many points. 365 is okay for Recharts.
      // Let's use day difference.
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const diffTime = Math.abs(now.getTime() - startOfYear.getTime());
      daysToGenerate = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    }

    const chartData = Array.from({ length: daysToGenerate }, (_, i) => {
      const date = new Date();
      date.setDate(now.getDate() - i);
      const day = date.toISOString().split('T')[0];
      return { date: day, Credit: 0, Collected: 0, count: 0 };
    }).reverse();

    filteredTransactions.forEach(t => {
      const day = new Date(t.created_at).toISOString().split('T')[0];
      const dayData = chartData.find(d => d.date === day);
      if (dayData) {
        dayData.Credit += t.total_amount || 0;
        dayData.Collected += t.amount_paid || 0;
        dayData.count += 1;
      }
    });

    // Busy Days Calculation
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const busyDaysMap = new Array(7).fill(0);
    filteredTransactions.forEach(t => {
      const dayIndex = new Date(t.created_at).getDay();
      busyDaysMap[dayIndex]++;
    });
    const busyDaysData = daysOfWeek.map((day, index) => ({ name: day, count: busyDaysMap[index] }));

    return {
      totalDue,
      totalCustomers,
      totalCollected,
      totalCredit,
      highestDebtors,
      busyDaysData,
      chartData: chartData.map(d => ({
        ...d,
        date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
      })),
      pieData: [
        { name: 'Collected', value: totalCollected, color: '#22c55e' },
        { name: 'Credit Given', value: totalCredit, color: '#f59e0b' }
      ]
    };
  }, [customers, transactions, dateRange]);

  const averageOrderValue = analytics.totalCollected / (analytics.totalCustomers || 1);
  const debtRatio = (analytics.totalDue / (analytics.totalCollected + analytics.totalDue || 1)) * 100;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={40} thickness={4} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={<Button color="inherit" size="small" onClick={fetchAnalyticsData}>Retry</Button>}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 8, md: 4 }, minHeight: '100vh', bgcolor: '#f1f5f9' }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="800" sx={{ fontFamily: "'Poppins', sans-serif", color: '#0f172a' }}>
            Analytics Dashboard
          </Typography>
        </Box>
        <Box display="flex" gap={2}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <Select
              value={dateRange}
              onChange={handleDateRangeChange}
              displayEmpty
              sx={{
                borderRadius: '12px',
                bgcolor: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                fontWeight: 600,
              }}
            >
              <MenuItem value="7days">Last 7 Days</MenuItem>
              <MenuItem value="30days">Last 30 Days</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
              <MenuItem value="year">This Year</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Key Metrics Row */}
      <Grid container spacing={3} mb={4}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Revenue"
            value={`₹${analytics.totalCollected.toLocaleString('en-IN')}`}
            icon={<PaidIcon />}
            color="#10b981"
            trend="+12%"
            isMainCard
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Total Due"
            value={`₹${analytics.totalDue.toLocaleString('en-IN')}`}
            icon={<CreditCardIcon />}
            color="#ef4444"
            delay={0.1}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Avg. Order Value"
            value={`₹${Math.round(averageOrderValue).toLocaleString('en-IN')}`}
            icon={<PaidIcon />}
            color="#3b82f6"
            delay={0.2}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            title="Debt Ratio"
            value={`${Math.round(debtRatio)}%`}
            icon={<TrendingUpIcon />}
            color="#f59e0b"
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* Main Charts Row */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <AnalyticsCharts
              data={analytics.chartData}
              pieData={analytics.pieData}
              type="trend"
            />
          </motion.div>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            style={{ height: '100%' }}
          >
            <AnalyticsCharts
              data={analytics.chartData}
              pieData={analytics.pieData}
              type="donut"
            />
          </motion.div>
        </Grid>

        {/* Secondary Charts Row */}
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {/* Swapping Customer Activity for Credit vs Collected (Recommended Option A) */}
            <AnalyticsCharts
              data={analytics.chartData}
              pieData={analytics.pieData}
              type="creditVsCollected"
            />
          </motion.div>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            <AnalyticsCharts
              data={[]}
              pieData={[]}
              debtorsData={analytics.highestDebtors}
              type="debtors"
            />
          </motion.div>
        </Grid>

        {/* New Chart: Busy Days (Option C) */}
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <AnalyticsCharts
              data={[]}
              pieData={[]}
              busyDaysData={analytics.busyDaysData}
              type="busyDays"
            />
          </motion.div>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <AnalyticsCharts
              data={analytics.chartData}
              pieData={[]}
              type="volume"
            />
          </motion.div>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AnalyticsPage;