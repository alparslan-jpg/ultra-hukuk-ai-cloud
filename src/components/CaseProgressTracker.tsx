import React from 'react';
import { Gavel, Clock, CheckCircle2 } from 'lucide-react';

export interface Stage {
  id: string;
  name: string;
  status: 'COMPLETED' | 'CURRENT' | 'PENDING';
}

interface CaseProgressTrackerProps {
  caseNumber: string;
  stages: Stage[];
}

export const CaseProgressTracker: React.FC<CaseProgressTrackerProps> = ({ caseNumber, stages }) => {
  const completedStages = stages.filter(s => s.status === 'COMPLETED').length;
  const currentStageIndex = stages.findIndex(s => s.status === 'CURRENT');
  const progress = ((currentStageIndex !== -1 ? currentStageIndex : (completedStages === stages.length ? stages.length : completedStages)) / stages.length) * 100;

  return (
    <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Gavel className="w-4 h-4 text-amber-500" />
          Dava Safahat Akış Takipçisi
        </h3>
        <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-full">
          {caseNumber}
        </span>
      </div>

      {/* Stage Nodes */}
      <div className="relative flex justify-between items-center px-2">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <div className="relative flex flex-col items-center gap-2 z-10">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                  stage.status === 'COMPLETED'
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : stage.status === 'CURRENT'
                    ? 'bg-amber-100 dark:bg-amber-900/50 border-amber-500 text-amber-600 dark:text-amber-400 ring-2 ring-amber-500/20 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400'
                }`}
              >
                {stage.status === 'COMPLETED' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : stage.status === 'CURRENT' ? (
                  <Clock className="w-4 h-4" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>
              <span className={`text-[10px] font-bold text-center w-20 ${
                stage.status === 'CURRENT' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
              }`}>
                {stage.name}
              </span>
            </div>

            {index < stages.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-slate-200 dark:bg-slate-800">
                <div 
                    className={`h-full bg-emerald-500 transition-all duration-500 ${stages[index + 1].status !== 'PENDING' ? 'w-full' : 'w-0'}`}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
            <span>Genel İlerleme</span>
            <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
                className="bg-indigo-500 h-full rounded-full transition-all duration-700 ease-in-out" 
                style={{ width: `${progress}%` }} 
            />
        </div>
      </div>
    </div>
  );
};
