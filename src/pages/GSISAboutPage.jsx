import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Award, Users, Zap } from 'lucide-react';

export default function GSISAboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold mb-4">About Golden State Integrated Systems</h1>
          <p className="text-xl text-blue-100">
            California's Premier Low Voltage Contractor
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="text-lg text-slate-700 space-y-4">
            <p>
              At Golden State Integrated Systems, we are committed to delivering enterprise-grade low voltage solutions that protect, connect, and empower California businesses.
            </p>
            <p>
              From structured cabling and security systems to fire alarm installations and ISP services, we provide comprehensive infrastructure solutions tailored to your needs.
            </p>
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-6 h-6 text-yellow-500" />
                Structured Cabling
              </CardTitle>
            </CardHeader>
            <CardContent>
              Professional network infrastructure and data cabling solutions for modern businesses.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-500" />
                Security Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              Comprehensive security solutions including CCTV, access control, and monitoring.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-red-500" />
                Fire Alarm Systems
              </CardTitle>
            </CardHeader>
            <CardContent>
              Professional fire detection and alarm systems for complete protection.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-6 h-6 text-purple-500" />
                ISP Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              Reliable internet service provider solutions for businesses of all sizes.
            </CardContent>
          </Card>
        </div>

        {/* Why Choose Us */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Why Choose Us?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Licensed & Certified</h4>
                  <p className="text-slate-600">Fully licensed contractors with industry certifications</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Expert Team</h4>
                  <p className="text-slate-600">Experienced technicians with decades of combined expertise</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">Quality Guaranteed</h4>
                  <p className="text-slate-600">Premium materials and workmanship on every project</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-slate-900">24/7 Support</h4>
                  <p className="text-slate-600">Round-the-clock support and maintenance services</p>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact CTA */}
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Get Started?</CardTitle>
            <CardDescription>
              Contact us today for a free consultation and project quote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Get a Quote
              </Button>
              <Button size="lg" variant="outline">
                Contact Us
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
