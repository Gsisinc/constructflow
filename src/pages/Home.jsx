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
  Menu
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-amber-400 hover:bg-amber-400/10">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="relative flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/b1ea08819_ChatGPT_Image_Jan_20__2026__08_11_07_PM-removebg.png"
                alt="Golden State Integrated Systems"
                className="h-full w-auto"
              />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-black text-white tracking-tight">GSIS</h1>
              <p className="text-sm text-amber-300/90 font-medium">Construction Platform</p>
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
      <section className="relative pt-40 sm:pt-56 pb-16 sm:pb-20 px-4 sm:px-6 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-slate-950"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_50%)]"></div>
          <div className="absolute top-20 left-10 h-72 w-72 bg-amber-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 h-96 w-96 bg-yellow-500/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
          
          {/* California Map Outline */}
          <div className="absolute right-20 top-1/4 opacity-5 hidden lg:block">
            <svg width="300" height="400" viewBox="0 0 300 400" fill="none" className="text-amber-400">
              <path d="M150 20 L180 50 L190 100 L200 150 L210 200 L220 250 L230 300 L240 350 L230 380 L200 390 L170 385 L150 380 L130 370 L110 350 L90 320 L80 280 L70 240 L60 200 L50 160 L40 120 L50 80 L70 50 L100 30 L130 25 Z" 
                    stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1"/>
            </svg>
          </div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 mb-6 sm:mb-8 text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 text-amber-400 flex-shrink-0" />
              <span className="text-amber-200">AI-Powered Construction Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-black text-white mb-4 sm:mb-6 leading-tight tracking-tight">
              Build the Future.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400">
                Win Every Bid.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl xl:text-2xl text-slate-400 mb-8 sm:mb-12 max-w-3xl mx-auto leading-relaxed px-2">
              The all-in-one platform for low voltage contractors, integrating bid discovery, 
              project management, and AI-powered insights to dominate your market.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm sm:text-base px-6 sm:px-10 py-5 sm:py-7 h-auto shadow-2xl shadow-amber-500/50 w-full sm:w-auto"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                variant="outline"
                onClick={handleLogin}
                className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 text-sm sm:text-base px-6 sm:px-10 py-5 sm:py-7 h-auto w-full sm:w-auto"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-8 justify-center text-slate-400 text-xs sm:text-sm px-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-400 flex-shrink-0" />
                <span>Setup in minutes</span>
              </div>
            </div>
          </div>

          {/* Service Icons */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto mt-20">
            {[
              { icon: Network, label: 'Structured Cabling', color: 'from-amber-500 to-yellow-500' },
              { icon: Lock, label: 'Access Control', color: 'from-orange-500 to-amber-600' },
              { icon: Video, label: 'Video Surveillance', color: 'from-yellow-500 to-orange-500' },
              { icon: Radio, label: 'Fire Alarm', color: 'from-amber-600 to-orange-600' },
              { icon: Wifi, label: 'Wireless Systems', color: 'from-yellow-400 to-amber-500' }
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
      <section className="py-16 sm:py-24 px-4 sm:px-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16 px-2">
            <Badge className="mb-3 sm:mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20 text-xs sm:text-sm">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
              Everything You Need to Win
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto">
              From opportunity discovery to project completion, powered by cutting-edge AI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Zap,
                title: 'AI Bid Discovery',
                description: 'Automatically find and analyze opportunities from 75+ government portals. Never miss a relevant project again.',
                gradient: 'from-amber-500 to-yellow-500'
              },
              {
                icon: TrendingUp,
                title: 'Smart Estimating',
                description: 'AI-powered cost estimation with historical data analysis and win probability scoring.',
                gradient: 'from-orange-500 to-amber-600'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Real-time updates, task management, and role-based permissions for your entire crew.',
                gradient: 'from-yellow-500 to-orange-500'
              },
              {
                icon: Shield,
                title: 'Compliance Tracking',
                description: 'Manage permits, certifications, and safety documentation with automated reminders.',
                gradient: 'from-amber-600 to-orange-600'
              },
              {
                icon: Network,
                title: 'Project Intelligence',
                description: 'AI agents monitor budgets, schedules, and risks to keep projects on track.',
                gradient: 'from-yellow-400 to-amber-500'
              },
              {
                icon: Video,
                title: 'Client Portals',
                description: 'Branded portals give clients 24/7 access to updates, schedules, and documents.',
                gradient: 'from-orange-400 to-amber-500'
              }
            ].map((feature, idx) => (
              <div key={idx} className="group relative">
                <div className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-10 blur-xl transition-opacity duration-500`}></div>
                <div className="relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all h-full">
                  <div className={`inline-flex h-12 w-12 rounded-xl bg-gradient-to-r ${feature.gradient} items-center justify-center mb-4`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-slate-400 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)]"></div>
        
        <div className="relative max-w-4xl mx-auto text-center px-2">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6">
            Ready to Dominate Your Market?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-slate-300 mb-8 sm:mb-10">
            Join the leading low voltage contractors who've transformed their business with GSIS Manager
          </p>
          <Button 
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-sm sm:text-lg px-8 sm:px-12 py-6 sm:py-8 h-auto shadow-2xl shadow-amber-500/50 w-full sm:w-auto"
          >
            Start Your Free Trial
            <ArrowRight className="ml-2 sm:ml-3 h-4 w-4 sm:h-6 sm:w-6" />
          </Button>
          <p className="text-slate-400 mt-4 sm:mt-6 text-sm sm:text-base">
            No credit card • 14 days free • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-4 sm:py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0 h-16 w-16 sm:h-20 sm:w-20">
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/b1ea08819_ChatGPT_Image_Jan_20__2026__08_11_07_PM-removebg.png"
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