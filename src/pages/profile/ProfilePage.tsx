import React from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { CircularProgress, Box } from '@mui/material'; // Only keeping these for loading state
import './ProfilePage.css';

const ProfilePage = () => {
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [shopName, setShopName] = React.useState('');
  const [shopAddress, setShopAddress] = React.useState('');
  const [shopPhone, setShopPhone] = React.useState('');
  const [shopOwner, setShopOwner] = React.useState('');

  React.useEffect(() => {
    const fetchShopProfile = async () => {
      if (!user) return;
      setLoading(true);
      const { data } = await supabase
        .from('shops')
        .select('shop_name, shop_address, owner_name, phone_number')
        .eq('id', user.id)
        .single();
      
      if (data) {
        setShopName(data.shop_name || '');
        setShopAddress(data.shop_address || '');
        setShopOwner(data.owner_name || '');
        setShopPhone(data.phone_number || '');
      }
      setLoading(false);
    };
    fetchShopProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !shopName) {
      alert('Shop name is required.');
      return;
    }

    const { error } = await supabase
      .from('shops')
      .upsert({
        id: user.id,
        shop_name: shopName,
        owner_name: shopOwner,
        phone_number: shopPhone,
        shop_address: shopAddress,
      });

    if (error) {
      alert(`Error saving profile: ${error.message}`);
    } else {
      alert('Profile saved successfully!');
    }
  };

  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  return (
    <div className="profile-container">
      <h1>Profile Settings</h1>
      <form onSubmit={handleSaveProfile}>
        <div className="profile-form-grid">
          <div className="form-field">
            <label htmlFor="shopName">Shop Name</label>
            <input
              id="shopName"
              type="text"
              className="profile-input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              required
            />
          </div>
          <div className="form-field">
            <label htmlFor="ownerName">Owner Name</label>
            <input
              id="ownerName"
              type="text"
              className="profile-input"
              value={shopOwner}
              onChange={(e) => setShopOwner(e.target.value)}
            />
          </div>
          <div className="form-field full-width-field">
            <label htmlFor="phone">Phone Number</label>
            <input
              id="phone"
              type="tel"
              className="profile-input"
              value={shopPhone}
              onChange={(e) => setShopPhone(e.target.value)}
            />
          </div>
          <div className="form-field full-width-field">
            <label htmlFor="address">Shop Address</label>
            <textarea
              id="address"
              className="profile-textarea"
              value={shopAddress}
              onChange={(e) => setShopAddress(e.target.value)}
            />
          </div>
        </div>
        
        <button type="submit" className="profile-save-button">
          Save
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;