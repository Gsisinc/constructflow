import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';

export default function ProjectDeadlines({ projectId }) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => base44.entities.Project.filter({ id: projectId }).then(p => p[0]),
    enabled: !!projectId
  });

  const { data: customPhases = [] } = useQuery({
    queryKey: ['customPhases', projectId],
    queryFn: () => base44.entities.CustomPhase.filter({ project_id: projectId, status: 'in_progress' }, 'order'),
    enabled: !!projectId
  });

  const currentPhase = customPhases[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Project Deadline */}
      {project?.end_date && (
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-blue-600" />
              Project Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Target Date</p>
                <p className="text-2xl font-bold text-slate-900">
                  {format(new Date(project.end_date), 'MMM dd, yyyy')}
                </p>
              </div>
              <CountdownTimer targetDate={project.end_date} label="Project" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Phase Deadline */}
      {currentPhase && (
        <Card className="border-2 border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-purple-600" />
              Current Phase
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-lg font-semibold text-slate-900">{currentPhase.display_name}</p>
                  <Badge variant="secondary">{currentPhase.progress_percent}% Complete</Badge>
                </div>
                <p className="text-sm text-slate-500">
                  {currentPhase.completed_date ? 
                    `Completed ${format(new Date(currentPhase.completed_date), 'MMM dd, yyyy')}` : 
                    'In Progress'
                  }
                </p>
              </div>
              {!currentPhase.completed_date && project?.end_date && (
                <CountdownTimer targetDate={project.end_date} label="Phase Target" />
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CountdownTimer({ targetDate, label }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const target = new Date(targetDate);
      const diff = target - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
      }

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
        expired: false
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const totalDays = differenceInDays(new Date(targetDate), new Date());
  const isUrgent = totalDays < 7;
  const isWarning = totalDays < 30;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {timeLeft.expired ? (
          <>
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm font-medium text-red-600">Deadline Passed</span>
          </>
        ) : isUrgent ? (
          <>
            <AlertCircle className="h-5 w-5 text-red-600 animate-pulse" />
            <span className="text-sm font-medium text-red-600">Urgent - Less than 7 days</span>
          </>
        ) : isWarning ? (
          <>
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-600">Less than 30 days</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium text-green-600">On Track</span>
          </>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <div className={`text-center p-3 rounded-lg ${timeLeft.expired ? 'bg-red-50' : isUrgent ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className={`text-3xl font-bold ${timeLeft.expired ? 'text-red-600' : isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'} animate-pulse`}>
            {timeLeft.days}
          </div>
          <div className="text-xs text-slate-500 mt-1">Days</div>
        </div>
        <div className={`text-center p-3 rounded-lg ${timeLeft.expired ? 'bg-red-50' : isUrgent ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className={`text-3xl font-bold ${timeLeft.expired ? 'text-red-600' : isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'} animate-pulse`}>
            {String(timeLeft.hours).padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Hours</div>
        </div>
        <div className={`text-center p-3 rounded-lg ${timeLeft.expired ? 'bg-red-50' : isUrgent ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className={`text-3xl font-bold ${timeLeft.expired ? 'text-red-600' : isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'} animate-pulse`}>
            {String(timeLeft.minutes).padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Minutes</div>
        </div>
        <div className={`text-center p-3 rounded-lg ${timeLeft.expired ? 'bg-red-50' : isUrgent ? 'bg-red-50' : isWarning ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className={`text-3xl font-bold ${timeLeft.expired ? 'text-red-600' : isUrgent ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-green-600'} animate-pulse`}>
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
          <div className="text-xs text-slate-500 mt-1">Seconds</div>
        </div>
      </div>
    </div>
  );
}