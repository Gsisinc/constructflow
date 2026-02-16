import React, { useState, useEffect } from 'react';
import { ChevronDown, Menu, X, ArrowRight, Star, CheckCircle2, Phone, Mail, MapPin, ExternalLink, Zap, Shield, Wifi, Volume2, Lock, Cable } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setIsMenuOpen(false);
    }
  };

  const openApp = () => {
    window.open('https://5173-ibv0ufipzhz4ioehqbrog-abad2830.us2.manus.computer', '_blank');
  };

  // Services data
  const services = [
    {
      id: 'fire-alarm',
      icon: <Zap className="h-8 w-8" />,
      title: 'Fire Alarm Systems',
      description: 'Advanced fire detection and alarm systems with real-time monitoring and compliance with all local codes.',
      features: ['NFPA 72 Compliant', 'Remote Monitoring', 'Integration Ready', 'Emergency Response']
    },
    {
      id: 'security',
      icon: <Shield className="h-8 w-8" />,
      title: 'Security Systems',
      description: 'Comprehensive security solutions including access control, surveillance, and intrusion detection.',
      features: ['24/7 Monitoring', 'Access Control', 'CCTV Integration', 'Mobile Alerts']
    },
    {
      id: 'data-network',
      icon: <Wifi className="h-8 w-8" />,
      title: 'Data & Network Cabling',
      description: 'Structured cabling infrastructure for high-speed data transmission and network reliability.',
      features: ['Cat6A/Cat7', 'Fiber Optic', 'Network Design', 'Future Proof']
    },
    {
      id: 'audio-visual',
      icon: <Volume2 className="h-8 w-8" />,
      title: 'Audio/Visual Systems',
      description: 'Professional AV solutions for conference rooms, auditoriums, and entertainment spaces.',
      features: ['4K/8K Ready', 'Wireless Integration', 'Control Systems', 'Custom Design']
    },
    {
      id: 'access-control',
      icon: <Lock className="h-8 w-8" />,
      title: 'Access Control',
      description: 'Sophisticated access control systems with biometric and credential-based authentication.',
      features: ['Biometric Auth', 'Credential Systems', 'Real-time Reporting', 'Mobile Access']
    },
    {
      id: 'structured-cabling',
      icon: <Cable className="h-8 w-8" />,
      title: 'Structured Cabling',
      description: 'Complete cabling infrastructure design and installation for enterprise environments.',
      features: ['Copper & Fiber', 'Termination', 'Testing & Cert', 'Documentation']
    }
  ];

  // Projects data
  const projects = [
    {
      id: 1,
      title: 'Downtown Medical Center',
      category: 'Fire Alarm & Security',
      description: 'Complete fire alarm system installation with integrated security for 150,000 sq ft medical facility.',
      value: '$450,000',
      image: '🏥',
      testimonial: 'GSIS delivered an exceptional fire alarm system that exceeded our expectations. Their team was professional and efficient.',
      client: 'Dr. James Mitchell, Facility Manager'
    },
    {
      id: 2,
      title: 'Tech Campus Expansion',
      category: 'Data & Network',
      description: 'Structured cabling and network infrastructure for new 200,000 sq ft tech campus.',
      value: '$680,000',
      image: '🏢',
      testimonial: 'The network infrastructure GSIS installed is rock solid. Their attention to detail and future-proofing approach was invaluable.',
      client: 'Sarah Chen, IT Director'
    },
    {
      id: 3,
      title: 'Corporate Headquarters',
      category: 'Access Control & AV',
      description: 'Access control system and AV infrastructure for 5-story corporate headquarters.',
      value: '$320,000',
      image: '🏛️',
      testimonial: 'GSIS transformed our security infrastructure. The access control system is intuitive and the AV setup is flawless.',
      client: 'Michael Rodriguez, Operations Manager'
    },
    {
      id: 4,
      title: 'Retail Complex Security',
      category: 'Security & Surveillance',
      description: 'Comprehensive security and surveillance system for 500,000 sq ft retail complex.',
      value: '$580,000',
      image: '🛍️',
      testimonial: 'GSIS provided a security solution that gives us complete peace of mind. Their support team is always responsive.',
      client: 'Jennifer Walsh, Security Director'
    },
    {
      id: 5,
      title: 'Educational Institution',
      category: 'Multi-System Integration',
      description: 'Integrated fire alarm, security, and data systems for university campus.',
      value: '$920,000',
      image: '🎓',
      testimonial: 'The multi-system integration GSIS delivered is seamless. They understand complex institutional requirements.',
      client: 'Dr. Robert Thompson, Campus Director'
    },
    {
      id: 6,
      title: 'Industrial Facility',
      category: 'Fire Alarm & Access Control',
      description: 'Fire alarm and access control systems for manufacturing facility with 24/7 operations.',
      value: '$410,000',
      image: '🏭',
      testimonial: 'GSIS installed systems that are reliable, scalable, and built for industrial environments. Excellent work.',
      client: 'Tom Anderson, Plant Manager'
    }
  ];

  // Blog data
  const blogPosts = [
    {
      id: 1,
      title: 'The Future of Fire Alarm Technology in 2026',
      category: 'Fire Safety',
      date: 'Feb 14, 2026',
      excerpt: 'Explore the latest advancements in fire alarm technology, including AI-powered detection systems and cloud-based monitoring.',
      image: '🔥'
    },
    {
      id: 2,
      title: 'Network Security: Best Practices for Structured Cabling',
      category: 'Network Infrastructure',
      date: 'Feb 10, 2026',
      excerpt: 'Learn how proper cabling infrastructure is the foundation of network security and performance.',
      image: '🔐'
    },
    {
      id: 3,
      title: 'Access Control Systems: Biometric vs. Credential-Based',
      category: 'Security',
      date: 'Feb 5, 2026',
      excerpt: 'Compare the pros and cons of different access control technologies and find the right solution for your facility.',
      image: '🔑'
    },
    {
      id: 4,
      title: 'Compliance Checklist: NFPA 72 Requirements for 2026',
      category: 'Compliance',
      date: 'Jan 28, 2026',
      excerpt: 'Stay compliant with the latest NFPA 72 standards for fire alarm systems. A comprehensive guide for facility managers.',
      image: '✅'
    }
  ];

  // Team data
  const team = [
    {
      name: 'David Chen',
      role: 'CEO & Founder',
      bio: '25+ years in low voltage systems',
      image: '👨‍💼'
    },
    {
      name: 'Maria Rodriguez',
      role: 'VP of Operations',
      bio: '20+ years project management',
      image: '👩‍💼'
    },
    {
      name: 'James Wilson',
      role: 'Lead Engineer',
      bio: '18+ years system design',
      image: '👨‍🔧'
    },
    {
      name: 'Lisa Park',
      role: 'Compliance Officer',
      bio: '15+ years regulatory expertise',
      image: '👩‍⚖️'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">GS</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Golden State</h1>
                <p className="text-xs text-slate-500">Integrated Systems</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {['home', 'services', 'projects', 'about', 'blog', 'contact'].map(item => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className={`capitalize text-sm font-medium transition-colors ${
                    activeSection === item
                      ? 'text-blue-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            {/* MyGSIS Button */}
            <div className="hidden md:flex items-center gap-4">
              <Button
                onClick={openApp}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white gap-2"
              >
                MyGSIS
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              {['home', 'services', 'projects', 'about', 'blog', 'contact'].map(item => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="block w-full text-left px-4 py-2 capitalize text-sm font-medium text-slate-600 hover:bg-slate-100 rounded"
                >
                  {item}
                </button>
              ))}
              <Button
                onClick={openApp}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white gap-2 mt-2"
              >
                MyGSIS
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                Low Voltage Excellence
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Golden State Integrated Systems delivers cutting-edge fire alarm, security, data, and AV solutions for enterprises across California.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => scrollToSection('contact')}
                  className="bg-white text-blue-600 hover:bg-blue-50 font-semibold gap-2"
                >
                  Request a Quote
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={openApp}
                  variant="outline"
                  className="border-white text-white hover:bg-white/10 font-semibold gap-2"
                >
                  MyGSIS Portal
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl p-12 text-center">
                <div className="text-8xl mb-4">⚡</div>
                <p className="text-lg font-semibold">Powering California's Infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Our Services</h2>
            <p className="text-xl text-slate-600">Comprehensive low voltage solutions for every need</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {services.map(service => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow border-0">
                <CardContent className="p-8">
                  <div className="text-blue-600 mb-4">{service.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{service.title}</h3>
                  <p className="text-slate-600 mb-6">{service.description}</p>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Featured Projects</h2>
            <p className="text-xl text-slate-600">Successful installations across California</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map(project => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow border-0 overflow-hidden">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 h-40 flex items-center justify-center text-6xl">
                  {project.image}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {project.category}
                    </span>
                    <span className="text-sm font-bold text-green-600">{project.value}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{project.title}</h3>
                  <p className="text-sm text-slate-600 mb-4">{project.description}</p>
                  <div className="border-t pt-4">
                    <p className="text-sm text-slate-700 italic mb-2">"{project.testimonial}"</p>
                    <p className="text-xs font-semibold text-slate-900">— {project.client}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">About Golden State</h2>
              <p className="text-lg text-slate-700 mb-4">
                For over 20 years, Golden State Integrated Systems has been the trusted partner for low voltage infrastructure across California. We specialize in designing and installing fire alarm, security, data, and AV systems that power businesses of all sizes.
              </p>
              <p className="text-lg text-slate-700 mb-6">
                Our commitment to excellence, compliance, and customer satisfaction has made us the preferred choice for enterprises seeking reliable, future-proof solutions.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="font-semibold text-slate-900">4.9/5 Average Rating</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-slate-900">500+ Successful Projects</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-slate-900">24/7 Support & Monitoring</span>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl p-12 text-center">
              <div className="text-7xl mb-4">🏆</div>
              <p className="text-lg font-semibold text-slate-900">Industry Leading</p>
              <p className="text-slate-600">Certified & Compliant</p>
            </div>
          </div>

          {/* Team */}
          <div className="mt-20">
            <h3 className="text-3xl font-bold text-slate-900 mb-12 text-center">Leadership Team</h3>
            <div className="grid md:grid-cols-4 gap-8">
              {team.map((member, idx) => (
                <Card key={idx} className="border-0 text-center hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="text-6xl mb-4">{member.image}</div>
                    <h4 className="text-lg font-bold text-slate-900 mb-1">{member.name}</h4>
                    <p className="text-sm font-semibold text-blue-600 mb-2">{member.role}</p>
                    <p className="text-sm text-slate-600">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">Industry Insights</h2>
            <p className="text-xl text-slate-600">Latest news and tips from our experts</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {blogPosts.map(post => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow border-0 overflow-hidden cursor-pointer">
                <div className="bg-gradient-to-br from-blue-100 to-blue-50 h-32 flex items-center justify-center text-5xl">
                  {post.image}
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-xs text-slate-500">{post.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{post.title}</h3>
                  <p className="text-slate-600 text-sm mb-4">{post.excerpt}</p>
                  <a href="#" className="text-blue-600 font-semibold text-sm hover:text-blue-700 flex items-center gap-2">
                    Read More <ArrowRight className="h-4 w-4" />
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
              <p className="text-lg text-blue-100 mb-8">
                Ready to discuss your low voltage infrastructure needs? Our team is ready to help.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <Phone className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Phone</p>
                    <p className="text-blue-100">(916) 555-0123</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Mail className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Email</p>
                    <p className="text-blue-100">info@goldenstateis.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <MapPin className="h-6 w-6 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-semibold mb-1">Address</p>
                    <p className="text-blue-100">Sacramento, CA 95814</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6">Request a Quote</h3>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="Your company"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Project Details</label>
                  <textarea
                    className="w-full px-4 py-2 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400 h-24"
                    placeholder="Tell us about your project..."
                  />
                </div>
                <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 font-semibold gap-2">
                  Send Request
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">GS</span>
                </div>
                <span className="font-bold text-white">Golden State</span>
              </div>
              <p className="text-sm">Integrated Systems for California</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Fire Alarm</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Data & Network</a></li>
                <li><a href="#" className="hover:text-white transition">Audio/Visual</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#about" className="hover:text-white transition">About Us</a></li>
                <li><a href="#projects" className="hover:text-white transition">Projects</a></li>
                <li><a href="#blog" className="hover:text-white transition">Blog</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition">Certifications</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-8 text-center text-sm">
            <p>&copy; 2026 Golden State Integrated Systems. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
