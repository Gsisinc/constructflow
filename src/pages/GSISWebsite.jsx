import { useLocation, Routes, Route } from 'react-router-dom';
import GSISLayout from '@/components/gsis/GSISLayout';
import GSISHomePage from '@/pages/gsis/GSISHomePage';
import GSISServicesPage from '@/pages/gsis/GSISServicesPage';
import GSISServiceDetailPage from '@/pages/gsis/GSISServiceDetailPage';
import GSISAboutPage from '@/pages/gsis/GSISAboutPage';
import GSISContactPage from '@/pages/gsis/GSISContactPage';
import GSISProjectsPage from '@/pages/gsis/GSISProjectsPage';

export default function GSISWebsite() {
  return (
    <GSISLayout>
      <Routes>
        <Route path="/" element={<GSISHomePage />} />
        <Route path="/services" element={<GSISServicesPage />} />
        <Route path="/services/:slug" element={<GSISServiceDetailPage />} />
        <Route path="/about" element={<GSISAboutPage />} />
        <Route path="/contact" element={<GSISContactPage />} />
        <Route path="/projects" element={<GSISProjectsPage />} />
      </Routes>
    </GSISLayout>
  );
}
