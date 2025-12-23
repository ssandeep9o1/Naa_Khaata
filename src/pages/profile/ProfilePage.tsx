import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Box, CircularProgress, Avatar } from '@mui/material';
import EditIcon from '@mui/icons-material/EditRounded';
import EmailIcon from '@mui/icons-material/EmailOutlined';
import PhoneIcon from '@mui/icons-material/PhoneOutlined';
import LocationIcon from '@mui/icons-material/LocationOnOutlined';
import StoreIcon from '@mui/icons-material/StorefrontOutlined';
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded';
import DownloadIcon from '@mui/icons-material/DownloadOutlined';
import AnalyticsIcon from '@mui/icons-material/AnalyticsOutlined';
import HelpIcon from '@mui/icons-material/HelpOutlineRounded';
import LogoutIcon from '@mui/icons-material/LogoutRounded';
import CameraAltIcon from '@mui/icons-material/CameraAltRounded'; // Icon for upload overlay
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import './ProfilePage.css';

interface Transaction {
  id: string;
  customer_id: string;
  shop_id: string;
  total_amount: number;
  amount_paid: number;
  transaction_type: 'sale' | 'payment';
  notes: string;
  created_at: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  due_amount: number;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // State for form fields
  const [formData, setFormData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    email: '',
    ownerImage: '' // URL for the owner image
  });

  // State to hold original data for cancel using
  const [originalData, setOriginalData] = useState({
    shopName: '',
    ownerName: '',
    phone: '',
    address: '',
    email: '',
    ownerImage: ''
  });

  // New state for image preview during edit
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  useEffect(() => {
    const fetchShopProfile = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('shops')
          .select('shop_name, shop_address, owner_name, phone_number, owner_image')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
        }

        const initialData = {
          shopName: data?.shop_name || '',
          ownerName: data?.owner_name || '',
          phone: data?.phone_number || '',
          address: data?.shop_address || '',
          email: user?.email || '',
          ownerImage: data?.owner_image || '',
        };

        setFormData(initialData);
        setOriginalData(initialData);
        setImagePreview(data?.owner_image || ''); // Set initial preview
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchShopProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!formData.shopName) {
      alert('Shop name is required.');
      return;
    }

    try {
      let uploadedImageUrl = formData.ownerImage;

      // Upload image if a new file is selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `avatars/${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('Shop_owner_image')
          .upload(fileName, imageFile);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          throw uploadError;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('Shop_owner_image')
          .getPublicUrl(fileName);

        uploadedImageUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('shops')
        .upsert({
          id: user.id,
          shop_name: formData.shopName,
          owner_name: formData.ownerName,
          phone_number: formData.phone,
          shop_address: formData.address,
          owner_image: uploadedImageUrl
        });

      if (error) throw error;

      const updatedData = { ...formData, ownerImage: uploadedImageUrl };
      setFormData(updatedData);
      setOriginalData(updatedData);
      setImageFile(null); // Clear pending file
      setIsEditing(false);

    } catch (error: any) {
      alert(`Error saving profile: ${error.message}`);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setImagePreview(originalData.ownerImage);
    setImageFile(null);
    setIsEditing(false);
  };

  const handleDownloadAllData = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsDownloading(true);

      // 1. Fetch all customers
      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('id, name, phone, due_amount')
        .eq('shop_id', user.id);

      if (customerError) throw customerError;
      if (!customers || customers.length === 0) {
        alert("No customers found to download data.");
        setIsDownloading(false);
        return;
      }

      // 2. Fetch all transactions for this shop
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('shop_id', user.id)
        .order('created_at', { ascending: true });

      if (txError) throw txError;

      const zip = new JSZip();
      const folderName = `Shop_Statements_${new Date().toISOString().split('T')[0]}`;
      const imgFolder = zip.folder(folderName);
      if (!imgFolder) return;

      // 3. Generate PDF for each customer
      customers.forEach((customer: Customer) => {
        const customerTx = transactions?.filter(tx => tx.customer_id === customer.id) || [];

        // Skip if no transactions? Optional. Let's include all customers even if empty history.

        const doc = new jsPDF();

        // -- Header --
        doc.setFontSize(22);
        doc.setTextColor(40);
        doc.text(formData.shopName || "Shop Statement", 14, 20);

        // -- Customer Details --
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(`Customer Name: ${customer.name}`, 14, 32);
        doc.text(`Phone: ${customer.phone}`, 14, 38);
        doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, 14, 44);

        // -- Table --
        const tableRows = customerTx.map((tx, index) => {
          const date = new Date(tx.created_at).toLocaleDateString('en-IN');
          const credit = tx.transaction_type === 'sale' ? `+${tx.total_amount}` : '-';
          const paid = tx.transaction_type === 'payment' ? `-${tx.amount_paid}` : '-';
          return [index + 1, date, tx.notes || (tx.transaction_type === 'sale' ? 'Credit' : 'Payment'), credit, paid];
        });

        autoTable(doc, {
          startY: 50,
          head: [['No.', 'Date', 'Details', 'Credit (+)', 'Paid (-)']],
          body: tableRows,
          theme: 'grid',
          headStyles: { fillColor: [45, 55, 72], textColor: 255 },
        });

        // -- Footer --
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`Total Due Amount: ${customer.due_amount}`, 14, finalY);

        // -- Add to Zip --
        // Sanitize filename
        const safeName = customer.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        imgFolder.file(`${safeName}_statement.pdf`, doc.output('blob'));
      });

      // 4. Generate and Save Zip
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `${folderName}.zip`);

    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download data: ' + err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8f9fc' }}>
        <CircularProgress sx={{ color: '#5b4dff' }} />
      </Box>
    );
  }

  // Get initials for avatar if no image
  const getInitials = (name: string) => {
    return name
      ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
      : 'OP';
  };

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // The session change will be detected by AuthContext or onAuthStateChange
      // and ProtectedRoute will automatically redirect to login
    } catch (error: any) {
      console.error('Error logging out:', error.message);
      alert('Failed to log out');
    }
  };

  return (
    <div className="profile-page-wrapper">
      <div className="profile-container">

        {/* Header - Always visible with dynamic avatar */}
        <div className="profile-header">
          <div className={`avatar-wrapper ${isEditing ? 'editable' : ''}`}>
            <div className="avatar-circle">
              {imagePreview ? (
                <img src={imagePreview} alt="Profile" className="avatar-image" />
              ) : (
                getInitials(formData.shopName || formData.ownerName)
              )}
            </div>

            {/* Edit Overlay */}
            {isEditing && (
              <label htmlFor="owner-image-upload" className="avatar-upload-overlay">
                <CameraAltIcon sx={{ color: 'white', fontSize: 24 }} />
                <input
                  id="owner-image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  hidden
                />
              </label>
            )}
          </div>

          <h1 className="profile-name">{formData.shopName || 'My Shop'}</h1>
          <p className="profile-role">Owner: {formData.ownerName || 'Set Owner Name'}</p>
          <span className="header-meta">Member since {new Date().getFullYear()}</span>
        </div>

        {isEditing ? (
          /* --- EDIT MODE --- */
          <div className="edit-form-card">
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Shop Name</label>
                <input
                  name="shopName"
                  type="text"
                  className="modern-input"
                  value={formData.shopName}
                  onChange={handleChange}
                  placeholder="Enter shop name"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>Owner Name</label>
                <input
                  name="ownerName"
                  type="text"
                  className="modern-input"
                  value={formData.ownerName}
                  onChange={handleChange}
                  placeholder="Enter your name"
                />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  name="phone"
                  type="tel"
                  className="modern-input"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  name="address"
                  className="modern-textarea"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter shop address"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCancel}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        ) : (
          /* --- VIEW MODE --- */
          <>
            <div className="section-header">
              <h3 className="section-title">Personal Information</h3>
              <button className="edit-btn" onClick={() => setIsEditing(true)}>
                <EditIcon sx={{ fontSize: 18 }} /> Edit
              </button>
            </div>

            <div className="info-card">
              <div className="info-item">
                <div className="info-icon">
                  <EmailIcon fontSize="small" />
                </div>
                <div className="info-content">
                  <span className="info-label">Email</span>
                  <span className="info-value">{formData.email}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <PhoneIcon fontSize="small" />
                </div>
                <div className="info-content">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{formData.phone || 'Not set'}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <StoreIcon fontSize="small" />
                </div>
                <div className="info-content">
                  <span className="info-label">Shop Name</span>
                  <span className="info-value">{formData.shopName || 'Not set'}</span>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <LocationIcon fontSize="small" />
                </div>
                <div className="info-content">
                  <span className="info-label">Location</span>
                  <span className="info-value">{formData.address || 'Not set'}</span>
                </div>
              </div>
            </div>

            <div className="section-header">
              <h3 className="section-title">Utilities</h3>
            </div>

            <div className="utilities-nav">
              <a href="#" className="utility-item" onClick={handleDownloadAllData}>
                <span className="utility-icon">
                  {isDownloading ? <CircularProgress size={24} color="inherit" /> : <DownloadIcon />}
                </span>
                {isDownloading ? 'Downloading...' : 'Download All Data'}
                {!isDownloading && <span className="utility-arrow"><ChevronRightIcon /></span>}
              </a>
              <a href="#" className="utility-item" onClick={(e) => e.preventDefault()}>
                <span className="utility-icon"><HelpIcon /></span>
                Ask Help-Desk
                <span className="utility-arrow"><ChevronRightIcon /></span>
              </a>
              <a href="#" className="utility-item" style={{ color: '#ff4d4d' }} onClick={handleLogout}>
                <span className="utility-icon" style={{ color: '#ff4d4d' }}><LogoutIcon /></span>
                Log Out
                <span className="utility-arrow"><ChevronRightIcon /></span>
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;