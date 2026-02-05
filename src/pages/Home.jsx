import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2, Users, Calendar, FileText, BarChart3, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Skip auth check - just show landing page
    setLoading(false);
  }, []);

  const handleLogin = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      navigate(createPageUrl('Dashboard'));
    } else {
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  const handleSignup = () => {
    navigate(createPageUrl('JoinRequest'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/c68ded0e2_Screenshot2026-01-20202907.png" 
                alt="GSIS Manager" 
                className="h-16 w-auto"
              />
              <span className="text-2xl font-bold text-slate-900">GSIS MANAGER</span>
            </div>
            <nav className="hidden md:flex gap-6">
              <button className="text-sm text-slate-600 hover:text-slate-900">Solutions</button>
              <button className="text-sm text-slate-600 hover:text-slate-900">Who We Serve</button>
              <button className="text-sm text-slate-600 hover:text-slate-900">Why Procore</button>
              <button className="text-sm text-slate-600 hover:text-slate-900">Resources</button>
              <button className="text-sm text-slate-600 hover:text-slate-900">Support</button>
              <button className="text-sm text-slate-600 hover:text-slate-900">Pricing</button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">(866) 477-6267</span>
            <Button onClick={handleLogin} variant="ghost" className="text-sm">
              Log in
            </Button>
            <Button onClick={handleSignup} className="bg-orange-600 hover:bg-orange-700 text-white">
              Sign up
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-100 to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block mb-4">
                <span className="bg-orange-100 text-orange-800 text-xs font-medium px-3 py-1 rounded-full">
                  CONSTRUCTION MANAGEMENT SOFTWARE
                </span>
              </div>
              <h1 className="text-5xl font-bold text-slate-900 mb-6">
                Together, we can build it all
              </h1>
              <p className="text-xl text-slate-600 mb-8">
                Manage your construction projects from preconstruction to closeout with the insights you need to maximize safety, efficiency, and ROI.
              </p>
              <div className="flex gap-4">
                <Button onClick={handleSignup} size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-base px-8">
                  Get Started
                </Button>
                <Button onClick={handleLogin} size="lg" variant="outline" className="text-base px-8">
                  Log in <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video bg-slate-800 rounded-lg overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80" 
                  alt="Construction worker" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              The #1 end-to-end construction management solution
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="relative group cursor-pointer">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80" 
                  alt="General Contractors" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">General Contractors</h3>
                  <p className="text-slate-600 text-sm mb-4">Keep projects within budget from the palm of your hand.</p>
                  <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group cursor-pointer">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=600&q=80" 
                  alt="Owners" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Owners</h3>
                  <p className="text-slate-600 text-sm mb-4">Improve return with industry-leading every step of the process.</p>
                  <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative group cursor-pointer">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden mb-4">
                <img 
                  src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=600&q=80" 
                  alt="Specialty Contractors" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-6">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Specialty Contractors</h3>
                  <p className="text-slate-600 text-sm mb-4">Give your teams from field to office the tools they need.</p>
                  <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                    Learn more <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-900 mb-4">
              Your platform for the future of construction
            </h2>
            <button className="text-orange-600 font-medium flex items-center gap-2 mx-auto hover:gap-3 transition-all">
              See all products <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1487058792275-0ad4aaf24ca7?w=600&q=80" 
                  alt="Preconstruction" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Preconstruction</h3>
              <p className="text-slate-600 text-sm mb-4">Manage designs, estimates, bids, and budgets across projects all-in-one. Integrated platform.</p>
              <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&q=80" 
                  alt="Project Management" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Project Management</h3>
              <p className="text-slate-600 text-sm mb-4">Mobile and desktop tools that improve efficiency by connecting field and office for real-time visibility.</p>
              <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80" 
                  alt="Financial Management" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Financial Management</h3>
              <p className="text-slate-600 text-sm mb-4">More accurate insights by delivering relevant financial insights to the field and timely closed job solutions to the...</p>
              <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-900 rounded-lg mb-4 overflow-hidden relative">
                <img 
                  src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&q=80" 
                  alt="Procore Helix" 
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-white text-2xl font-bold">AI-POWERED</span>
                </div>
              </div>
              <span className="text-xs text-slate-500 uppercase tracking-wide">WHY IS PROCORE</span>
              <h3 className="text-xl font-bold text-slate-900 mb-2 mt-1">Procore Helix</h3>
              <p className="text-slate-600 text-sm mb-4">Get real-time insights from an advanced-intelligence layer that answers questions and automates labor within...</p>
              <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-slate-100 rounded-lg mb-4 overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&q=80" 
                  alt="Procore Platform" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Procore Platform</h3>
              <p className="text-slate-600 text-sm mb-4">Drive Procore features by making data-driven decisions that help achieve greater project-level performance...</p>
              <button className="text-orange-600 font-medium text-sm flex items-center gap-2 hover:gap-3 transition-all">
                Learn more <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pick Your Path */}
      <section className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-orange-500 text-sm uppercase tracking-wide mb-4">PICK YOUR PATH</p>
          <h2 className="text-4xl font-bold mb-12">Let's find the right tools for you</h2>
          <Button onClick={handleSignup} size="lg" className="bg-orange-600 hover:bg-orange-700 text-white text-base px-12">
            Get Started
          </Button>
        </div>
      </section>



      {/* Footer */}
      <footer className="bg-white border-t py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-600">
          <p>&copy; 2026 GSIS Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}