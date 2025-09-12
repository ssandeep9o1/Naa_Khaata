// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

// Import pages from their new folders
import LoginPage from './pages/Login/LoginPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import UpdatePasswordPage from './pages/UpdatePassword/UpdatePasswordPage';
import DashboardPage from './pages/Dashboard/DashboardPage';
import SignUpPage from './pages/SignUp/SignUpPage';
import CustomerPage from './pages/Customers/CustomerPage';
import ProfilePage from './pages/profile/ProfilePage';
import TransactionPage from './pages/Transactions/TransactionPage';
import ChillarKhataPage from './pages/ChillarKhata/ChillarKhataPage';
import NotesPage from './pages/Notes/NotesPage';
import ProductsPage from './pages/Products/ProductsPage';
import AnalyticsPage from './pages/Analytics/AnalyticsPage';

function App() {
  return (

    <div className="app-content-wrapper">
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/signup" element={<SignUpPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/customers" element={<CustomerPage />} />
            <Route path="/customer/:customerId" element={<TransactionPage />} />
            <Route path="/chillar-khata" element={<ChillarKhataPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}

export default App;