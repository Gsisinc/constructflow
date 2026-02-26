import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { services } from '@/landing/services-data';
import { Phone, Mail, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const contactInfo = [
  { icon: Phone, title: 'Phone', primary: '(916) 555-0123', secondary: 'Mon-Fri 7AM-5PM PST', href: 'tel:+19165550123' },
  { icon: Mail, title: 'Email', primary: 'info@goldenstateintegrated.com', secondary: 'We respond within 24 hours', href: 'mailto:info@goldenstateintegrated.com' },
  { icon: MapPin, title: 'Office', primary: 'Sacramento, California', secondary: 'Serving All of Northern CA', href: null },
  { icon: Clock, title: 'Business Hours', primary: 'Mon – Fri: 7:00 AM – 5:00 PM', secondary: 'Emergency: 24/7 Available', href: null },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } }),
};

export default function GSISContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    serviceInterest: '',
    projectDescription: '',
    timeline: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.serviceInterest) {
      toast.error('Please fill in all required fields.');
      return;
    }
    setSubmitted(true);
    toast.success('Your message has been sent successfully! We will get back to you soon.');
  };

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  return (
    <>
      <section className="relative py-16 sm:py-20 md:py-28 navy-gradient overflow-hidden">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-serif text-white mb-4 sm:mb-6">
              Get in <span className="text-gold-400">Touch</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-navy-200 max-w-3xl mx-auto">
              Ready to start your project? Send us a message and we will respond within 24 hours.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="py-12 sm:py-20 md:py-28 bg-white">
        <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-16">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="space-y-8">
              <h2 className="text-2xl font-bold font-serif text-navy-900">Contact Information</h2>
              {contactInfo.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-50 flex items-center justify-center shrink-0">
                    <item.icon className="w-6 h-6 text-gold-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-navy-800">{item.title}</h3>
                    {item.href ? (
                      <a href={item.href} className="text-navy-600 hover:text-gold-600 transition-colors">
                        {item.primary}
                      </a>
                    ) : (
                      <p className="text-navy-600">{item.primary}</p>
                    )}
                    <p className="text-sm text-muted-foreground">{item.secondary}</p>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
              {submitted ? (
                <div className="rounded-2xl border border-gold-200 bg-gold-50 p-8 text-center">
                  <CheckCircle2 className="w-16 h-16 text-gold-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-navy-800 mb-2">Thank you!</h3>
                  <p className="text-muted-foreground">We have received your message and will get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-navy-100 p-8 bg-white">
                  <h2 className="text-2xl font-bold font-serif text-navy-900">Send a Message</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Your name" required className="border-navy-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input id="email" type="email" value={formData.email} onChange={(e) => handleChange('email', e.target.value)} placeholder="you@company.com" required className="border-navy-200" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" value={formData.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="(916) 555-0123" className="border-navy-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Company</Label>
                      <Input id="company" value={formData.company} onChange={(e) => handleChange('company', e.target.value)} placeholder="Company name" className="border-navy-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceInterest">Service of interest *</Label>
                    <select
                      id="serviceInterest"
                      value={formData.serviceInterest}
                      onChange={(e) => handleChange('serviceInterest', e.target.value)}
                      required
                      className="flex h-10 w-full rounded-md border border-navy-200 bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select a service</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDescription">Project description</Label>
                    <Textarea id="projectDescription" value={formData.projectDescription} onChange={(e) => handleChange('projectDescription', e.target.value)} placeholder="Tell us about your project..." rows={4} className="border-navy-200" />
                  </div>
                  <Button type="submit" className="w-full sm:w-auto min-h-[48px] bg-gold-500 hover:bg-gold-600 text-white font-semibold touch-manipulation">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
