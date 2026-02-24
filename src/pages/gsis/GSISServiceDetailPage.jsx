import { useParams, Link } from 'react-router-dom';
import { getServiceBySlug } from '@/landing/services-data';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: (i || 0) * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }),
};

export default function GSISServiceDetailPage() {
  const { slug } = useParams();
  const service = getServiceBySlug(slug);
  const Icon = service?.icon;

  return (
    <>
      <section className="relative py-20 md:py-28 navy-gradient overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="flex items-center gap-4 mb-6">
            <Link to="/services" className="text-navy-200 hover:text-gold-400 transition-colors text-sm flex items-center gap-1">
              Services
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="flex items-start gap-6">
            {Icon && (
              <div className="w-14 h-14 rounded-xl bg-gold-500/20 flex items-center justify-center border border-gold-500/30">
                <Icon className="w-7 h-7 text-gold-300" />
              </div>
            )}
            <div>
              <h1 className="text-4xl md:text-5xl font-bold font-serif text-white mb-3">{service?.title}</h1>
              <p className="text-gold-400 font-medium mb-2">{service?.tagline}</p>
              <p className="text-lg text-navy-200 max-w-2xl">{service?.description}</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted-foreground leading-relaxed max-w-3xl mb-8">{service?.description}</p>
          <Link to="/contact">
            <button className="bg-gold-500 hover:bg-gold-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
              Get a Quote for This Service
            </button>
          </Link>
        </div>
      </section>
    </>
  );
}
