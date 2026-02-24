import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }),
};

const placeholderProjects = [
  { title: 'Commercial Office – Structured Cabling', tag: 'Structured Cabling', location: 'Sacramento, CA', description: 'Full building Cat6A and fiber backbone.' },
  { title: 'Healthcare Facility – Fire Alarm & Security', tag: 'Fire Alarm & Security', location: 'Bay Area', description: 'NFPA 72 fire alarm and access control.' },
  { title: 'Education Campus – Network & AV', tag: 'Data & AV', location: 'Northern CA', description: 'Campus-wide network and audiovisual systems.' },
];

export default function GSISProjectsPage() {
  return (
    <>
      <section className="relative py-16 sm:py-20 md:py-28 navy-gradient overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-4 sm:mb-6">
              Our <span className="text-gold-400">Projects</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy-200 max-w-3xl mx-auto">
              A selection of recent low voltage and integrated systems work across Northern California.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {placeholderProjects.map((project, i) => (
              <motion.div key={project.title} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                <div className="group bg-white rounded-2xl border border-navy-100 p-6 hover:border-gold-300 hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center mb-4 border border-gold-200">
                    <Building2 className="w-6 h-6 text-gold-600" />
                  </div>
                  <span className="text-xs font-medium text-gold-600 uppercase tracking-wide">{project.tag}</span>
                  <h2 className="text-xl font-bold font-serif text-navy-900 mt-2 mb-1">{project.title}</h2>
                  <p className="text-sm text-muted-foreground mb-2">{project.location}</p>
                  <p className="text-sm text-navy-600 leading-relaxed flex-1">{project.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mt-12">
            <Link to="/contact">
              <Button size="lg" className="min-h-[48px] bg-gold-500 hover:bg-gold-600 text-white font-semibold touch-manipulation">
                Start Your Project
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </>
  );
}
