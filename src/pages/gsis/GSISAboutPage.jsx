import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Award, Target, Handshake, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const LOGO_URL = 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663375686059/KwYfGPUqYeASoXIC.png';

const values = [
  { icon: Shield, title: 'Safety First', description: 'Every installation prioritizes life safety and code compliance.' },
  { icon: Award, title: 'Quality Craftsmanship', description: 'We take pride in installations that look as good as they perform.' },
  { icon: Handshake, title: 'Client Partnership', description: 'Transparent communication and honest timelines.' },
  { icon: Target, title: 'Continuous Innovation', description: 'We stay ahead of industry trends and new technologies.' },
];

const certifications = [
  'C-7 Low Voltage Contractor License',
  'NICET Certified Technicians',
  'BICSI Registered',
  'Manufacturer Certified Installers',
  'OSHA Safety Certified',
  'Fully Bonded & Insured',
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }),
};

export default function GSISAboutPage() {
  return (
    <>
      <section className="relative py-16 sm:py-20 md:py-28 navy-gradient overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-4 sm:mb-6">
              About <span className="text-gold-400">Golden State</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy-200 max-w-3xl mx-auto">
              Licensed, insured, and committed to excellence in low voltage systems across California.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}>
              <div className="inline-flex items-center gap-2 bg-gold-50 text-gold-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-gold-200">Our Story</div>
              <h2 className="text-3xl md:text-4xl font-bold font-serif text-navy-900 mb-6">Built on Expertise. Driven by Excellence.</h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Golden State Integrated Systems has been serving Northern California for over 15 years with structured cabling, security, fire alarm, and ISP solutions.
              </p>
              <Link to="/contact">
                <Button className="min-h-[48px] bg-gold-500 hover:bg-gold-600 text-white font-semibold touch-manipulation">
                  Get in Touch
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </motion.div>
            <div className="flex justify-center">
              <img src={LOGO_URL} alt="GSIS" className="max-h-64 w-auto object-contain" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-navy-50/50">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-12">
            <h2 className="text-3xl font-bold font-serif text-navy-900 mb-4">Our Values</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((item, i) => (
              <motion.div key={item.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-white rounded-2xl p-6 border border-navy-100">
                <item.icon className="w-10 h-10 text-gold-500 mb-4" />
                <h3 className="font-bold font-serif text-navy-800 mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold font-serif text-navy-900 mb-8 text-center">Certifications</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {certifications.map((c) => (
              <div key={c} className="flex items-center gap-2 bg-navy-50 px-4 py-2 rounded-lg border border-navy-100">
                <CheckCircle2 className="w-4 h-4 text-gold-500 shrink-0" />
                <span className="text-sm text-navy-700">{c}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
