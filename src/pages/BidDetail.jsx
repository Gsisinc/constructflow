import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function BidDetail() {
  const navigate = useNavigate();
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    navigate(createPageUrl('BidOpportunityDetail') + (id ? `?id=${id}` : ''), { replace: true });
  }, [navigate]);
  
  return null;
}