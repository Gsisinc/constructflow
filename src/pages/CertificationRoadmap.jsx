import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import { Award, DollarSign, Calendar, CheckCircle2 } from 'lucide-react';

const certificationTracks = {
  safety: { title: 'Safety Fundamentals', color: 'red' },
  cabling: { title: 'Structured Cabling', color: 'blue' },
  security: { title: 'Security Systems', color: 'purple' },
  fire_alarm: { title: 'Fire Alarm Systems', color: 'orange' },
  isp: { title: 'ISP & Networking', color: 'green' },
  leadership: { title: 'Leadership', color: 'indigo' }
};

export default function CertificationRoadmap() {
  const [user, setUser] = useState(null);
  const [organization, setOrganization] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      if (userData?.organization_id) {
        const orgs = await base44.entities.Organization.filter({ id: userData.organization_id });
        setOrganization(orgs[0]);
      }
    };
    loadUser();
  }, []);

  const { data: certifications = [] } = useQuery({
    queryKey: ['allCertifications', organization?.id],
    queryFn: () => organization?.id ? base44.entities.IndustryCertification.filter({ organization_id: organization.id }) : [],
    enabled: !!organization?.id,
  });

  const { data: techCertifications = [] } = useQuery({
    queryKey: ['techCertifications', organization?.id],
    queryFn: () => organization?.id ? base44.entities.TechnicianCertification.filter({}) : [],
    enabled: !!organization?.id,
  });

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians', organization?.id],
    queryFn: () => organization?.id ? base44.entities.TechnicianProfile.filter({ organization_id: organization.id }) : [],
    enabled: !!organization?.id,
  });

  if (!user || !organization) return <div className="p-6">Loading...</div>;

  const certsByTrack = {};
  Object.keys(certificationTracks).forEach(track => {
    certsByTrack[track] = certifications.filter(c => c.category === track);
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Certification Roadmap</h1>
          <p className="text-slate-600">Industry certifications required for each training level</p>
        </motion.div>

        <Tabs defaultValue="safety" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-6">
            {Object.entries(certificationTracks).map(([key, { title }]) => (
              <TabsTrigger key={key} value={key} className="text-xs sm:text-sm">{title.split(' ')[0]}</TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(certsByTrack).map(([track, certs]) => (
            <TabsContent key={track} value={track} className="space-y-6">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle>{certificationTracks[track].title}</CardTitle>
                    <CardDescription>{certs.length} certifications in this track</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {certs.map(cert => {
                        const assigned = techCertifications.filter(tc => tc.certification_id === cert.id);
                        const earned = assigned.filter(tc => tc.status === 'valid').length;
                        return (
                          <motion.div
                            key={cert.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="font-semibold text-slate-900">{cert.cert_name}</h3>
                              <Badge variant="outline">{assigned.length} earned</Badge>
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Award className="w-4 h-4" />
                                <span>{cert.issuing_body}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <DollarSign className="w-4 h-4" />
                                <span>${cert.cost}</span>
                              </div>
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-4 h-4" />
                                <span>{cert.renewal_years || 0 ? `Renew every ${cert.renewal_years} years` : 'No renewal'}</span>
                              </div>
                              {cert.required_for_level && (
                                <div className="flex items-center gap-2 text-blue-600 font-medium">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span>Required for Level {cert.required_for_level}</span>
                                </div>
                              )}
                            </div>

                            <div className="mt-4 pt-4 border-t">
                              <p className="text-xs text-slate-500 mb-2">Team Progress</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-200 rounded-full h-2">
                                  <div
                                    className="bg-blue-600 h-2 rounded-full transition-all"
                                    style={{ width: `${(earned / Math.max(technicians.length, 1)) * 100}%` }}
                                  />
                                </div>
                                <span className="text-xs font-semibold text-slate-700">{earned}/{technicians.length}</span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}