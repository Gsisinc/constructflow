import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { services } from '@/landing/services-data';
import { getLoginUrl } from '@/landing/getLoginUrl';
import { Menu, X, ChevronDown, Phone } from 'lucide-react';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663375686059/KwYfGPUqYeASoXIC.png';

const navLinks = [
  { label: 'Home', href: '/' },
  { label: 'Services', href: '/services', hasDropdown: true },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
  { label: 'MYGSIS App', href: null, appLink: true },
];

export default function GSISNavbar() {
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileServicesOpen, setMobileServicesOpen] = useState(false);
  const appUrl = getLoginUrl();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setServicesOpen(false);
    setMobileServicesOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, [mobileOpen]);

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return href && location.pathname.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-gold-200/50'
          : 'bg-white/80 backdrop-blur-sm'
      }`}
    >
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex items-center justify-between h-20">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <img src={LOGO_URL} alt="Golden State Integrated Systems" className="h-12 w-auto" />
            <div className="hidden sm:block">
              <div className="text-lg font-bold font-serif text-navy-800 leading-tight">Golden State</div>
              <div className="text-xs font-medium tracking-widest uppercase text-gold-600">Integrated Systems</div>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => setServicesOpen(true)}
                  onMouseLeave={() => setServicesOpen(false)}
                >
                  <Link
                    to={link.href}
                    className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive(link.href) ? 'text-gold-600 bg-gold-50' : 'text-navy-700 hover:text-gold-600 hover:bg-gold-50/50'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className={`w-4 h-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                  </Link>
                  {servicesOpen && (
                    <div className="absolute top-full left-0 pt-2 w-72">
                      <div className="bg-white rounded-xl shadow-xl border border-gold-100 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                        {services.map((service) => (
                          <Link
                            key={service.id}
                            to={service.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gold-50 transition-colors group"
                          >
                            <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center group-hover:bg-gold-100 transition-colors">
                              <service.icon className="w-4.5 h-4.5 text-navy-600 group-hover:text-gold-600 transition-colors" />
                            </div>
                            <div>
                              <div className="text-sm font-medium text-navy-800 group-hover:text-gold-700">{service.title}</div>
                              <div className="text-xs text-muted-foreground">{service.tagline}</div>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : link.appLink ? (
                <Link
                  key={link.label}
                  to={appUrl}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === '/Home' ? 'text-gold-600 bg-gold-50' : 'text-navy-700 hover:text-gold-600 hover:bg-gold-50/50'
                  }`}
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href) ? 'text-gold-600 bg-gold-50' : 'text-navy-700 hover:text-gold-600 hover:bg-gold-50/50'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href="tel:+1234567890"
              className="flex items-center gap-2 text-sm font-medium text-navy-600 hover:text-gold-600 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden xl:inline">(916) 555-0123</span>
            </a>
            <Link to="/contact">
              <Button className="bg-gold-500 hover:bg-gold-600 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                Get a Quote
              </Button>
            </Link>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-3 -m-2 rounded-lg hover:bg-gold-50 active:bg-gold-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X className="w-6 h-6 text-navy-700" /> : <Menu className="w-6 h-6 text-navy-700" />}
          </button>
        </nav>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gold-100 shadow-xl animate-in slide-in-from-top-2 duration-200 max-h-[calc(100vh-5rem)] overflow-y-auto overscroll-contain touch-manipulation">
          <div className="container max-w-7xl mx-auto px-4 py-4 space-y-1">
            {navLinks.map((link) =>
              link.hasDropdown ? (
                <div key={link.label}>
                  <button
                    type="button"
                    onClick={() => setMobileServicesOpen(!mobileServicesOpen)}
                    className={`flex items-center justify-between w-full px-4 py-3 min-h-[44px] rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                      isActive(link.href) ? 'text-gold-600 bg-gold-50' : 'text-navy-700 hover:bg-gold-50 active:bg-gold-100'
                    }`}
                  >
                    {link.label}
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileServicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileServicesOpen && (
                    <div className="ml-4 space-y-1 mt-1">
                      <Link to="/services" className="block px-4 py-2 rounded-lg text-sm font-medium text-navy-600 hover:bg-gold-50">
                        All Services
                      </Link>
                      {services.map((service) => (
                        <Link
                          key={service.id}
                          to={service.href}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-navy-600 hover:bg-gold-50"
                        >
                          <service.icon className="w-4 h-4 text-gold-500" />
                          {service.title}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : link.appLink ? (
                <Link
                  key={link.label}
                  to={appUrl}
                  className="block px-4 py-3 min-h-[44px] flex items-center rounded-lg text-sm font-medium text-navy-700 hover:bg-gold-50 active:bg-gold-100 touch-manipulation"
                >
                  {link.label}
                </Link>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`block px-4 py-3 min-h-[44px] flex items-center rounded-lg text-sm font-medium transition-colors touch-manipulation ${
                    isActive(link.href) ? 'text-gold-600 bg-gold-50' : 'text-navy-700 hover:bg-gold-50 active:bg-gold-100'
                  }`}
                >
                  {link.label}
                </Link>
              )
            )}
            <div className="pt-3 border-t border-gold-100">
              <Link to="/contact" className="block">
                <Button className="w-full min-h-[44px] bg-gold-500 hover:bg-gold-600 text-white font-semibold touch-manipulation">Get a Quote</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
