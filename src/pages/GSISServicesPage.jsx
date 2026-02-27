import { Link } from 'react-router-dom';
import { services } from '@/landing/services-data';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }),
};

export default function GSISServicesPage() {
  return (
    <>
      <section className="relative py-16 sm:py-20 md:py-28 navy-gradient overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-4 sm:mb-6">
              Our <span className="text-gold-400">Services</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy-200 max-w-3xl mx-auto px-0">
              Six core low voltage disciplines delivered with precision, expertise, and an unwavering commitment to quality.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
            {services.map((service, i) => (
              <motion.div key={service.id} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <Link to={service.href} className="block min-h-[44px] touch-manipulation">
                  <div className="group bg-white rounded-2xl border border-navy-100 p-6 sm:p-8 hover:border-gold-300 hover:shadow-xl transition-all duration-300 h-full">
                    <div className="w-14 h-14 rounded-xl bg-gold-50 flex items-center justify-center mb-6 border border-gold-200">
                      <service.icon className="w-7 h-7 text-gold-600" />
                    </div>
                    <h2 className="text-xl font-bold font-serif text-navy-900 mb-2">{service.title}</h2>
                    <p className="text-gold-600 font-medium mb-3">{service.tagline}</p>
                    <p className="text-muted-foreground text-sm leading-relaxed mb-4">{service.description}</p>
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
    </>
  );
}