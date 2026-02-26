import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle } from 'lucide-react';

const skillCategories = {
  safety: 'Safety & Foundation',
  cabling: 'Structured Cabling',
  access_control: 'Access Control',
  cctv: 'CCTV',
  fire_alarm: 'Fire Alarm',
  isp: 'ISP'
};

const getRatingColor = (rating) => {
  if (!rating) return 'bg-slate-100 text-slate-700';
  if (rating >= 4) return 'bg-green-100 text-green-800';
  if (rating >= 3) return 'bg-blue-100 text-blue-800';
  if (rating >= 2) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
};

export default function TeamSkillsMatrix() {
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

  const { data: technicians = [] } = useQuery({
    queryKey: ['technicians', organization?.id],
    queryFn: () => organization?.id ? base44.entities.TechnicianProfile.filter({ organization_id: organization.id }) : [],
    enabled: !!organization?.id,
  });

  const { data: skills = [] } = useQuery({
    queryKey: ['allSkills', organization?.id],
    queryFn: () => organization?.id ? base44.entities.SkillsMatrix.filter({}) : [],
    enabled: !!organization?.id,
  });

  if (!user || !organization) return <div className="p-6">Loading...</div>;

  const techniciansByEmail = {};
  technicians.forEach(t => { techniciansByEmail[t.email] = t; });

  const skillsByCategory = {};
  Object.keys(skillCategories).forEach(cat => {
    skillsByCategory[cat] = [...new Set(skills.filter(s => s.skill_category === cat).map(s => s.skill_name))];
  });

  const criticalGaps = skills.filter(s => s.supervisor_rating && s.supervisor_rating < 2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900">Team Skills Matrix</h1>
          <p className="text-slate-600">Track technician competencies across all skill areas</p>
        </motion.div>

        {criticalGaps.length > 0 && (
          <Card className="mb-6 bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-900">
                <AlertTriangle className="w-5 h-5" />
                Critical Gaps Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {criticalGaps.slice(0, 5).map(gap => (
                  <div key={gap.id} className="text-sm text-red-800">
                    <strong>{gap.technician_name}</strong> - {gap.skill_name} (Rating: {gap.supervisor_rating}/5)
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {Object.entries(skillCategories).map(([catKey, catName]) => {
            const categorySkills = skillsByCategory[catKey] || [];
            if (categorySkills.length === 0) return null;

            return (
              <motion.div key={catKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      {catName}
                    </CardTitle>
                    <CardDescription>{categorySkills.length} skills • {technicians.length} technicians</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-semibold text-slate-700">Skill</th>
                            {technicians.slice(0, 6).map(tech => (
                              <th key={tech.id} className="text-center p-2 font-semibold text-slate-700 max-w-12">
                                <div className="text-xs text-slate-600 truncate">{tech.full_name.split(' ')[0]}</div>
                              </th>
                            ))}
                            {technicians.length > 6 && <th className="text-center p-2 text-slate-500">+{technicians.length - 6}</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {categorySkills.map(skillName => (
                            <tr key={skillName} className="border-b hover:bg-slate-50">
                              <td className="text-left p-2 text-slate-900 font-medium">{skillName}</td>
                              {technicians.slice(0, 6).map(tech => {
                                const skillRecord = skills.find(s => s.technician_email === tech.email && s.skill_name === skillName);
                                const rating = skillRecord?.supervisor_rating || skillRecord?.self_rating || 0;
                                return (
                                  <td key={tech.id} className="text-center p-2">
                                    {rating > 0 ? (
                                      <Badge className={getRatingColor(rating)}>
                                        {rating}/5
                                      </Badge>
                                    ) : (
                                      <span className="text-slate-400 text-xs">—</span>
                                    )}
                                  </td>
                                );
                              })}
                              {technicians.length > 6 && <td className="text-center p-2">—</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}