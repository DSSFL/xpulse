'use client';

import VitalCard from './VitalCard';

interface AccountAgeRiskProps {
  accountAgeRisk: number;
  accountAgeDistribution: {
    under7days: number;
    days7to30: number;
    days30to180: number;
    over180days: number;
  };
  averageAccountAge: number;
  onClick?: () => void;
}

export default function AccountAgeRisk({
  accountAgeRisk,
  accountAgeDistribution,
  averageAccountAge,
  onClick
}: AccountAgeRiskProps) {
  // Determine status based on risk score
  const getStatus = () => {
    if (accountAgeRisk >= 70) return 'critical';
    if (accountAgeRisk >= 40) return 'warning';
    return 'healthy';
  };

  // Icon for account age
  const icon = (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  // Distribution bar chart
  const distributionBars = (
    <div className="mt-4 space-y-2">
      <div className="text-xs text-x-gray-text mb-3">Account Age Distribution:</div>

      {/* <7 days */}
      <div className="flex items-center gap-2">
        <div className="w-20 text-xs text-x-gray-text">&lt;7 days</div>
        <div className="flex-1 bg-x-gray-border rounded h-2 overflow-hidden">
          <div
            className="h-full bg-vital-critical transition-all duration-500"
            style={{ width: `${accountAgeDistribution.under7days}%` }}
          />
        </div>
        <div className="w-12 text-right text-xs text-vital-critical font-bold">
          {accountAgeDistribution.under7days}%
        </div>
      </div>

      {/* 7-30 days */}
      <div className="flex items-center gap-2">
        <div className="w-20 text-xs text-x-gray-text">7-30 days</div>
        <div className="flex-1 bg-x-gray-border rounded h-2 overflow-hidden">
          <div
            className="h-full bg-vital-warning transition-all duration-500"
            style={{ width: `${accountAgeDistribution.days7to30}%` }}
          />
        </div>
        <div className="w-12 text-right text-xs text-vital-warning font-bold">
          {accountAgeDistribution.days7to30}%
        </div>
      </div>

      {/* 30-180 days */}
      <div className="flex items-center gap-2">
        <div className="w-20 text-xs text-x-gray-text">1-6 months</div>
        <div className="flex-1 bg-x-gray-border rounded h-2 overflow-hidden">
          <div
            className="h-full bg-vital-neutral transition-all duration-500"
            style={{ width: `${accountAgeDistribution.days30to180}%` }}
          />
        </div>
        <div className="w-12 text-right text-xs text-vital-neutral font-bold">
          {accountAgeDistribution.days30to180}%
        </div>
      </div>

      {/* >180 days */}
      <div className="flex items-center gap-2">
        <div className="w-20 text-xs text-x-gray-text">&gt;6 months</div>
        <div className="flex-1 bg-x-gray-border rounded h-2 overflow-hidden">
          <div
            className="h-full bg-vital-healthy transition-all duration-500"
            style={{ width: `${accountAgeDistribution.over180days}%` }}
          />
        </div>
        <div className="w-12 text-right text-xs text-vital-healthy font-bold">
          {accountAgeDistribution.over180days}%
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-x-gray-border text-xs text-x-gray-text">
        Average Account Age: <span className="font-bold text-white">{averageAccountAge}</span> days
      </div>
    </div>
  );

  return (
    <VitalCard
      title="Account Age Risk"
      value={accountAgeRisk}
      unit="/100"
      status={getStatus()}
      icon={icon}
      subtitle="Bot detection via account age analysis"
      onClick={onClick}
    >
      {distributionBars}
    </VitalCard>
  );
}
