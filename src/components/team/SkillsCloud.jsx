import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Award, AlertTriangle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays } from 'date-fns';

export default function SkillsCloud({ workers = [], onSelectWorker }) {
  const [skillFilter, setSkillFilter] = useState('');
  const [certFilter, setCertFilter] = useState('');

  // Aggregate all skills
  const allSkills = [...new Set(workers.flatMap(w => w.skills || []))];
  
  // Filter workers by skill or certification
  const filteredWorkers = workers.filter(worker => {
    const matchesSkill = !skillFilter || 
      worker.skills?.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()));
    const matchesCert = !certFilter ||
      worker.certifications?.some(c => c.name?.toLowerCase().includes(certFilter.toLowerCase()));
    return matchesSkill && matchesCert;
  });

  // Check certification status
  const getCertStatus = (cert) => {
    if (!cert.expiry_date) return 'valid';
    const daysUntilExpiry = differenceInDays(new Date(cert.expiry_date), new Date());
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry < 30) return 'expiring_soon';
    return 'valid';
  };

  const workersWithExpiringCerts = workers.filter(w => 
    w.certifications?.some(c => getCertStatus(c) === 'expiring_soon' || getCertStatus(c) === 'expired')
  );

  return (
    <div className="space-y-6">
      {/* Certification Alerts */}
      {workersWithExpiringCerts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-amber-700 mb-3">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Certification Alerts</span>
          </div>
          <div className="space-y-2">
            {workersWithExpiringCerts.slice(0, 3).map(worker => {
              const expiringCert = worker.certifications?.find(c => 
                getCertStatus(c) === 'expiring_soon' || getCertStatus(c) === 'expired'
              );
              return (
                <div key={worker.id} className="flex items-center justify-between text-sm">
                  <span className="text-amber-800">{worker.name}</span>
                  <span className="text-amber-600">
                    {expiringCert?.name} - {getCertStatus(expiringCert) === 'expired' ? 'EXPIRED' : 'Expiring Soon'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <h3 className="font-semibold text-slate-900 mb-4">Find Qualified Workers</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by skill..."
              value={skillFilter}
              onChange={(e) => setSkillFilter(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="relative">
            <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by certification..."
              value={certFilter}
              onChange={(e) => setCertFilter(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Skills Cloud */}
        <div className="flex flex-wrap gap-2 mb-4">
          {allSkills.slice(0, 15).map(skill => (
            <Badge
              key={skill}
              variant="outline"
              className={cn(
                "cursor-pointer transition-colors",
                skillFilter === skill 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "hover:bg-slate-100"
              )}
              onClick={() => setSkillFilter(skillFilter === skill ? '' : skill)}
            >
              {skill}
            </Badge>
          ))}
        </div>

        {/* Filtered Results */}
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {filteredWorkers.map(worker => (
            <div
              key={worker.id}
              onClick={() => onSelectWorker?.(worker)}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={worker.avatar_url} />
                  <AvatarFallback className="bg-slate-200 text-slate-600">
                    {worker.name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-slate-900">{worker.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{worker.role?.replace('_', ' ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {worker.status === 'available' && (
                  <Badge className="bg-green-100 text-green-700">Available</Badge>
                )}
                {worker.certifications?.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Award className="h-4 w-4 text-amber-500" />
                    <span className="text-xs text-slate-500">{worker.certifications.length}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredWorkers.length === 0 && (
            <div className="text-center py-4 text-slate-500">
              <User className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">No workers match your criteria</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}