import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { createPageUrl } from '@/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate(createPageUrl('Bids'));
  }, [navigate]);
  
  return null;
}