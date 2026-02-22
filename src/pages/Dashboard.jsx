import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export default function Dashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to Projects page
    navigate('/projects');
  }, [navigate]);
  
  return null;
}