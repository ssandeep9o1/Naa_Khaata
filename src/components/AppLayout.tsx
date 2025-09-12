// src/components/AppLayout.tsx
import { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import '../pages/Dashboard/DashboardPage.css';

const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const leaveTimer = useRef<number | null>(null);

  const handleMouseEnter = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
    }
    setDrawerOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimer.current = window.setTimeout(() => {
      setDrawerOpen(false);
    }, 200); // 300ms delay to allow moving mouse between button and drawer
  };

  return (
    <>
      <Sidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />

      {/* This is the hover-trigger button for the sidebar */}
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 1301 }} // zIndex must be higher than drawer
      >
        <button className="setting-btn">
          <span className="bar bar2"></span>
          <span className="bar bar1"></span>
        </button>
      </div>
      
      {/* A container for the page content itself */}
      <div style={{ padding: '20px', width: '100%' }}>
        
        {/* Outlet renders the matched child route (DashboardPage, ProfilePage, etc.) */}
        <Outlet />
      </div>
    </>
  );
};

export default AppLayout;