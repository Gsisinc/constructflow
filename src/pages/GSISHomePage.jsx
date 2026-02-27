import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { services } from '@/landing/services-data';
import { getLoginUrl } from '@/landing/getLoginUrl';
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Award,
  Users,
  Building2,
  Zap,
  Clock,
  Star,
} from 'lucide-react';
import { motion } from 'framer-motion';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663375686059/KwYfGPUqYeASoXIC.png';

const stats = [
  { value: '500+', label: 'Projects Completed', icon: Building2 },
  { value: '15+', label: 'Years Experience', icon: Clock },
  { value: '100%', label: 'Licensed & Insured', icon: Shield },
  { value: '24/7', label: 'Emergency Service', icon: Zap },
];

const whyUs = [
  { icon: Award, title: 'Licensed & Certified', description: 'C-7 Low Voltage Licensed with manufacturer certifications from industry leaders.' },
  { icon: Users, title: 'Expert Technicians', description: 'NICET-certified technicians with deep expertise across all low voltage disciplines.' },
  { icon: Shield, title: 'Code Compliant', description: 'Every installation meets NFPA, TIA/EIA, and local AHJ requirements without compromise.' },
  { icon: Star, title: 'End-to-End Service', description: 'From design and bidding through installation, testing, and ongoing maintenance.' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }),
};

export default function GSISHomePage() {
  const appUrl = getLoginUrl();

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 navy-gradient" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 sm:py-24 md:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-gold-500/30">
                <Zap className="w-4 h-4" />
                California's Premier Low Voltage Contractor
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white leading-tight mb-4 sm:mb-6">
                Powering Your
                <span className="gold-text-gradient block">Connected Future</span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-navy-200 leading-relaxed mb-6 sm:mb-8 max-w-xl">
                From structured cabling and security systems to fire alarm installations and ISP services, we deliver enterprise-grade low voltage solutions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/contact" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full sm:w-auto min-h-[48px] bg-gold-500 hover:bg-gold-600 text-white font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 shadow-xl hover:shadow-2xl transition-all touch-manipulation">
                    Get a Quote
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/projects" className="w-full sm:w-auto">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px] border-2 border-white/30 text-white hover:bg-white/10 font-semibold text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 touch-manipulation">
                    View Our Work
                  </Button>
                </Link>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex justify-center"
            >
              <div className="relative">
                <div className="absolute -inset-4 bg-gold-500/20 rounded-full blur-3xl" />
                <img src={LOGO_URL} alt="Golden State Integrated Systems" className="relative w-80 h-80 object-contain drop-shadow-2xl" />
              </div>
            </motion.div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
          </svg>
        </div>
      </section>

      <section className="py-6 sm:py-8 -mt-1 bg-white relative z-10">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center p-4 sm:p-6 rounded-xl bg-navy-50/50 border border-navy-100"
              >
                <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-gold-500 mx-auto mb-2 sm:mb-3" />
                <div className="text-xl sm:text-3xl font-bold font-serif text-navy-800">{stat.value}</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 bg-gold-50 text-gold-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-gold-200">Our Expertise</div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif text-navy-900 mb-4">Comprehensive Low Voltage Solutions</h2>
            <p className="text-lg text-muted-foreground">Six core disciplines. One trusted partner.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, i) => (
              <motion.div key={service.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Link to={service.href} className="block min-h-[44px]">
                  <div className="group relative bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 hover:border-gold-300 hover:shadow-xl transition-all duration-300 h-full touch-manipulation">
                    <div className="w-14 h-14 rounded-xl bg-navy-50 flex items-center justify-center mb-6 group-hover:bg-gold-50 transition-colors">
                      <service.icon className="w-7 h-7 text-navy-600 group-hover:text-gold-600 transition-colors" />
                    </div>
                    <h3 className="text-xl font-bold font-serif text-navy-800 mb-2 group-hover:text-gold-700 transition-colors">{service.title}</h3>
                    <p className="text-sm text-gold-600 font-medium mb-3">{service.tagline}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">{service.description.slice(0, 150)}...</p>
                    <div className="flex items-center gap-1 text-sm font-medium text-navy-600 group-hover:text-gold-600 transition-colors">
                      Learn More
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-navy-50/50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="inline-flex items-center gap-2 bg-gold-50 text-gold-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-gold-200">Why Golden State</div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-navy-900 mb-6">
                Built on Expertise. <span className="text-gold-600">Driven by Excellence.</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                With over 15 years of experience in the low voltage industry, Golden State Integrated Systems has earned a reputation for delivering projects on time, within budget, and to the highest standards.
              </p>
              <div className="space-y-4">
                {[
                  'Full lifecycle project management from bid to closeout',
                  'Manufacturer-certified installation teams',
                  'Comprehensive testing and documentation',
                  '24/7 emergency service and support',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-gold-500 mt-0.5 shrink-0" />
                    <span className="text-navy-700">{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/about" className="inline-block mt-8">
                <Button variant="outline" className="border-2 border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-white font-semibold px-6">
                  About Our Company
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
            <div className="grid grid-cols-2 gap-6">
              {whyUs.map((item, i) => (
                <motion.div
                  key={item.title}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  className="bg-white rounded-2xl p-6 border border-navy-100 shadow-sm hover:shadow-md transition-shadow"
                >
                  <item.icon className="w-10 h-10 text-gold-500 mb-4" />
                  <h3 className="font-bold font-serif text-navy-800 mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl navy-gradient p-6 sm:p-8 md:p-12 lg:p-16">
            <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-gold-500/30">Introducing MYGSIS</div>
                <h2 className="text-3xl md:text-4xl font-bold font-serif text-white mb-6">
                  Manage Your Projects with <span className="text-gold-400">AI-Powered Intelligence</span>
                </h2>
                <p className="text-navy-200 text-lg leading-relaxed mb-8">
                  MYGSIS is our proprietary construction management platform featuring AI-powered bid analysis, specialized construction agents, real-time project tracking, and dedicated portals for technicians and clients.
                </p>
                <Link to={appUrl}>
                  <Button size="lg" className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-8">
                    Sign In to MYGSIS
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="hidden lg:flex justify-center">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="space-y-4">
                    {[
                      'AI-Powered Bid Discovery & Analysis',
                      'Specialized Construction AI Agents',
                      'Real-Time Project Tracking Dashboard',
                      'Technician & Client Portals',
                      'Blueprint Analysis & Quantity Takeoffs',
                    ].map((feature) => (
                      <div key={feature} className="flex items-center gap-3 text-white">
                        <CheckCircle2 className="w-5 h-5 text-gold-400 shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}