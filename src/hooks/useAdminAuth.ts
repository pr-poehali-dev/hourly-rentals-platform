import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAdminAuth() {
  const [adminInfo, setAdminInfo] = useState<any>(null);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  
  const hasPermission = (permission: string) => {
    if (!adminInfo?.permissions) return false;
    return adminInfo.permissions[permission] === true;
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  useEffect(() => {
    if (!token) {
      navigate('/admin/login');
      return;
    }
    
    try {
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      setAdminInfo(tokenPayload);
    } catch (e) {
      console.error('Invalid token', e);
      handleLogout();
      return;
    }
  }, [token, navigate]);

  return {
    adminInfo,
    token,
    hasPermission,
    handleLogout,
  };
}
