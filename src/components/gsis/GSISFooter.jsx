import { Link } from 'react-router-dom';
import { services } from '@/landing/services-data';
import { getLoginUrl } from '@/landing/getLoginUrl';
import { MapPin, Phone, Mail, Clock, ArrowRight } from 'lucide-react';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663375686059/KwYfGPUqYeASoXIC.png';

const quickLinks = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about' },
  { label: 'Our Projects', href: '/projects' },
  { label: 'Contact Us', href: '/contact' },
  { label: 'MYGSIS App', href: null, appLink: true },
  { label: 'Get a Quote', href: '/contact' },
];

export default function GSISFooter() {
  const appUrl = getLoginUrl();

  return (
    <footer className="bg-navy-900 text-white">
      <div className="gold-gradient">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-white">Ready to Start Your Project?</h3>
            <p className="text-white/90 mt-1 text-base sm:text-lg">Let us bring your vision to life with expert low voltage solutions.</p>
          </div>
          <Link to="/contact" className="w-full sm:w-auto">
            <button className="w-full sm:w-auto min-h-[48px] bg-white text-gold-700 hover:bg-navy-900 hover:text-white px-6 sm:px-8 py-3.5 rounded-lg font-semibold text-base sm:text-lg transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 whitespace-nowrap touch-manipulation">
              Get a Free Quote
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <img src={LOGO_URL} alt="GSIS" className="h-14 w-auto" />
            </Link>
            <p className="text-navy-300 text-sm leading-relaxed mb-6">
              Golden State Integrated Systems is a premier low voltage contractor serving California with expert ISP, cabling, security, and fire alarm solutions. Licensed, insured, and committed to excellence.
            </p>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-navy-300">C-7 Low Voltage Licensed</span>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold font-serif text-white mb-6">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.appLink ? (
                    <Link
                      to={appUrl}
                      className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2 group"
                    >
                      <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold font-serif text-white mb-6">Our Services</h4>
            <ul className="space-y-3">
              {services.map((service) => (
                <li key={service.id}>
                  <Link
                    to={service.href}
                    className="text-navy-300 hover:text-gold-400 transition-colors text-sm flex items-center gap-2 group"
                  >
                    <ArrowRight className="w-3 h-3 opacity-0 -ml-5 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                    {service.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold font-serif text-white mb-6">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                <a href="tel:+19165550123" className="text-navy-200 hover:text-gold-400 transition-colors text-sm">
                  (916) 555-0123
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                <a
                  href="mailto:info@goldenstateintegrated.com"
                  className="text-navy-200 hover:text-gold-400 transition-colors text-sm"
                >
                  info@goldenstateintegrated.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                <span className="text-navy-200 text-sm">
                  Sacramento, California
                  <br />
                  Serving All of Northern CA
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gold-400 mt-0.5 shrink-0" />
                <div className="text-navy-200 text-sm">
                  <div>Mon – Fri: 7:00 AM – 5:00 PM</div>
                  <div>Emergency: 24/7 Available</div>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-navy-800">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <p className="text-navy-400 text-sm">
            &copy; {new Date().getFullYear()} Golden State Integrated Systems. All rights reserved.
          </p>
          <div className="flex items-center justify-center sm:justify-end gap-4 sm:gap-6">
            <Link to="/about" className="text-navy-400 hover:text-gold-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/about" className="text-navy-400 hover:text-gold-400 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
