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
  Wifi
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
        <div className="max-w-7xl mx-auto px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-500/50 blur-3xl"></div>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/1037cb786_ChatGPTImageJan20202602_32_55PM.png"
                alt="Golden State Integrated Systems"
                className="relative h-32 w-auto"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tight">Golden State Integrated Systems</h1>
              <p className="text-sm text-amber-300/90 font-medium">Low Voltage • Security • AV Solutions</p>
            </div>
          </div>
          <Button 
            onClick={handleLogin}
            variant="outline"
            className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400"
          >
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
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
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 backdrop-blur-sm border border-amber-500/20 rounded-full px-4 py-2 mb-8">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="text-sm text-amber-200">AI-Powered Construction Intelligence Platform</span>
            </div>

            <h1 className="text-6xl lg:text-8xl font-black text-white mb-6 leading-tight tracking-tight">
              Build the Future.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400">
                Win Every Bid.
              </span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
              The all-in-one platform for low voltage contractors, integrating bid discovery, 
              project management, and AI-powered insights to dominate your market.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg"
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-lg px-10 py-7 h-auto shadow-2xl shadow-amber-500/50"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={handleLogin}
                className="border-amber-400/40 text-amber-400 hover:bg-amber-400/10 hover:border-amber-400 text-lg px-10 py-7 h-auto"
              >
                Watch Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-8 justify-center text-slate-400 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
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
      <section className="py-24 px-6 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/20">Platform Features</Badge>
            <h2 className="text-5xl font-bold text-white mb-6">
              Everything You Need to Win
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
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
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-orange-600/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.1),transparent_70%)]"></div>
        
        <div className="relative max-w-4xl mx-auto text-center">
          <h2 className="text-5xl lg:text-6xl font-bold text-white mb-6">
            Ready to Dominate Your Market?
          </h2>
          <p className="text-xl text-slate-300 mb-10">
            Join the leading low voltage contractors who've transformed their business with GSIS Manager
          </p>
          <Button 
            size="lg"
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xl px-12 py-8 h-auto shadow-2xl shadow-amber-500/50"
          >
            Start Your Free Trial
            <ArrowRight className="ml-3 h-6 w-6" />
          </Button>
          <p className="text-slate-400 mt-6">
            No credit card • 14 days free • Cancel anytime
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/50 backdrop-blur-sm border-t border-white/10 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <img 
                src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6983e2500291b5dfd8507ab1/1037cb786_ChatGPTImageJan20202602_32_55PM.png"
                alt="Golden State Integrated Systems"
                className="h-24 w-auto mb-4"
              />
              <p className="text-sm text-slate-400">
                Empowering low voltage contractors with AI-powered construction intelligence.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
                <li><a href="#" className="hover:text-white transition">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Careers</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-slate-400">
              © 2026 Golden State Integrated Systems Inc. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}