/**
 * GSIS website services data (for Navbar dropdown and Services page).
 */
import { Zap, Shield, Wifi, Camera, Lock, Cable } from 'lucide-react';

export const services = [
  { id: 'fire-alarm', title: 'Fire Alarm Systems', tagline: 'Life safety & code compliance', description: 'Design, installation, and inspection of fire alarm systems. NFPA 72 compliant.', href: '/services/fire-alarm', icon: Zap },
  { id: 'security', title: 'Security & Access Control', tagline: 'Access & surveillance', description: 'Access control, CCTV, and integrated security solutions.', href: '/services/security', icon: Shield },
  { id: 'structured-cabling', title: 'Structured Cabling', tagline: 'Data & voice', description: 'Cat6A, fiber backbone, and network infrastructure.', href: '/services/structured-cabling', icon: Cable },
  { id: 'cctv-cameras', title: 'CCTV / Camera Systems', tagline: 'Video surveillance', description: 'IP cameras, NVR, and video analytics.', href: '/services/cctv-cameras', icon: Camera },
  { id: 'access-control', title: 'Access Control', tagline: 'Credentials & biometrics', description: 'Card readers, electric strikes, and door hardware.', href: '/services/access-control', icon: Lock },
  { id: 'isp', title: 'ISP & Telecom', tagline: 'Fiber & wireless', description: 'Fiber backbone, DIA, and wireless infrastructure.', href: '/services/isp', icon: Wifi },
];

export function getServiceBySlug(slug) {
  return services.find((s) => s.id === slug || s.href === `/services/${slug}`) || services[0];
}
