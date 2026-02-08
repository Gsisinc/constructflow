import React from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Shield, 
  TrendingUp, 
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Network,
  Lock,
  Radio,
  Video,
  Wifi,
  Menu,
  Flame,
  FileStack,
  DollarSign
} from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      navigate(createPageUrl('Dashboard'));
    } else {
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  const handleGetStarted = async () => {
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      navigate(createPageUrl('Dashboard'));
    } else {
      base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-3 flex items-center justify-between lg:justify-start">
          <div className="flex items-center justify-end flex-1 lg:flex-none lg:justify-start">
            <div className="relative flex-shrink-0 h-40 w-40 sm:h-56 sm:w-56 lg:h-8 lg:w-8">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/d9a9b4af8_ChatGPT_Image_Jan_20__2026__08_11_07_PM-removebg.png"
                alt="Golden State Integrated Systems"
                className="h-full w-auto"
              />
            </div>
          </div>
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 text-sm h-9"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-56 sm:pt-72 pb-12 sm:pb-16 px-4 sm:px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-slate-950"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
          <div className="absolute top-20 left-10 h-72 w-72 bg-amber-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 h-96 w-96 bg-yellow-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-6 sm:mb-10 mt-8 sm:mt-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 mb-4 sm:mb-6 text-xs">
              <Sparkles className="h-3 w-3 text-amber-400 flex-shrink-0" />
              <span className="text-amber-200">AI-Powered Construction Intelligence</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-3 sm:mb-4 leading-tight">
              Complete Project Control.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400">
                From Bid to Built.
              </span>
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-slate-400 mb-6 sm:mb-8 max-w-2xl mx-auto leading-relaxed">
              End-to-end project management for contractors: discover bids, manage teams, track budgets, and deliver on time.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6 sm:mb-8">
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm px-8 py-2.5 shadow-xl shadow-amber-500/50 w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogin}
                className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 text-sm px-8 py-2.5 w-full sm:w-auto"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-col gap-3 sm:gap-6 text-slate-400 text-xs mx-auto w-fit">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>

          {/* Service Icons */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4 max-w-3xl mx-auto mt-10 sm:mt-16">
            {[
              { icon: Network, label: 'Structured Cabling', color: 'from-amber-500 to-yellow-500' },
              { icon: Lock, label: 'Access Control', color: 'from-orange-500 to-amber-600' },
              { icon: Video, label: 'Video Surveillance', color: 'from-yellow-500 to-orange-500' },
              { icon: Flame, label: 'Fire Alarm', color: 'from-amber-600 to-orange-600' },
              { icon: Wifi, label: 'Wireless Systems', color: 'from-yellow-400 to-amber-500' },
              { icon: Radio, label: 'AV Systems', color: 'from-orange-400 to-amber-500' }
            ].map((service, idx) => (
              <div key={idx} className="group relative">
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all">
                  <div className={`h-8 w-8 mx-auto mb-2 bg-gradient-to-r ${service.color} rounded-lg flex items-center justify-center`}>
                    <service.icon className="h-5 w-5 text-white" />
                  </div>
                  <p className="text-xs text-slate-400 text-center">{service.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8 sm:mb-12 px-2">
            <Badge className="mb-2 sm:mb-3 bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs">Features</Badge>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3">
              Everything You Need
            </h2>
            <p className="text-xs sm:text-sm lg:text-base text-slate-400 max-w-2xl mx-auto">
              From opportunity discovery to project completion
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {[
              {
                icon: Users,
                title: 'Team Management',
                description: 'Manage workers, skills, certifications, and productivity tracking.',
                gradient: 'from-yellow-500 to-orange-500'
              },
              {
                icon: FileStack,
                title: 'Task & Schedule Tracking',
                description: 'Real-time updates, phase gates, and milestone management.',
                gradient: 'from-orange-500 to-amber-600'
              },
              {
                icon: DollarSign,
                title: 'Budget & Cost Control',
                description: 'Live budget tracking, change orders, and financial forecasting.',
                gradient: 'from-amber-600 to-orange-600'
              },
              {
                icon: Zap,
                title: 'AI Bid Discovery',
                description: 'Find opportunities from 75+ government portals automatically.',
                gradient: 'from-amber-500 to-yellow-500'
              },
              {
                icon: Shield,
                title: 'Compliance & Safety',
                description: 'Manage permits, safety incidents, and documentation.',
                gradient: 'from-yellow-400 to-amber-500'
              },
              {
                icon: Network,
                title: 'Project Intelligence',
                description: 'AI monitors risks, suggests optimizations, and predicts outcomes.',
                gradient: 'from-orange-400 to-amber-500'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`}></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 sm:p-6 hover:border-white/20 transition-all h-full flex flex-col items-center text-center">
                  <div className={`flex h-10 w-10 rounded-lg bg-gradient-to-r ${feature.gradient} items-center justify-center mb-3`}>
                    <feature.icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-10 sm:py-16 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)]"></div>

        <div className="relative max-w-3xl mx-auto text-center px-2">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-3 sm:mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-sm sm:text-base text-slate-300 mb-6 sm:mb-8">
            Join leading contractors transforming their business
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm px-8 py-2.5 shadow-xl shadow-amber-500/50 w-full sm:w-auto"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <p className="text-slate-400 mt-4 text-xs sm:text-sm">
            No credit card • 14 days free • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-4 sm:py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/d9a9b4af8_ChatGPT_Image_Jan_20__2026__08_11_07_PM-removebg.png"
                alt="Golden State Integrated Systems"
                className="h-full w-auto"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-sm text-slate-400">
                © 2026 Golden State Integrated Systems Inc.
              </p>
            </div>
          </div>
          <div className="hidden lg:flex gap-6">
            <a href="#" className="text-xs text-slate-400 hover:text-white transition">Privacy</a>
            <a href="#" className="text-xs text-slate-400 hover:text-white transition">Terms</a>
            <a href="#" className="text-xs text-slate-400 hover:text-white transition">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  );
}