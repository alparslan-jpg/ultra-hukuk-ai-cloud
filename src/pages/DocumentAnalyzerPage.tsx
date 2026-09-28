import React from 'react';
import { DavaDerinAnaliz } from '../components/DavaDerinAnaliz';

export const DocumentAnalyzerPage: React.FC = () => {
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Dava Evrak Analizörü</h2>
      <DavaDerinAnaliz 
        lawyerSicilNo="8109" 
        onApplyToPetition={() => {}}
        onNavigateToTimeline={() => {}}
        onNavigateToCrossref={() => {}}
      />
    </div>
  );
};
