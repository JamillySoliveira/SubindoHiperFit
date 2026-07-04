import { Award, Flag, TrendingDown, Clock, ArrowRight, CirclePlay, Sparkles } from "lucide-react";
import { User, WeightEntry, DashboardStats } from "../types";
import BMIChart from "./BMIChart";
import BMIGauge, { getBMICategory } from "./BMIGauge";

interface DashboardViewProps {
  user: User;
  stats: DashboardStats;
  selectedRange: string;
  onRangeChange: (range: string) => void;
  onAddEntryClick: () => void;
  onViewChange: (view: string) => void;
}

export default function DashboardView({
  user,
  stats,
  selectedRange,
  onRangeChange,
  onAddEntryClick,
  onViewChange
}: DashboardViewProps) {
  const currentBMIStatus = getBMICategory(stats.currentBMI);

  // Formatting values
  const bmiDeltaStr = stats.bmiDeltaThisWeek > 0 
    ? `+${stats.bmiDeltaThisWeek}` 
    : `${stats.bmiDeltaThisWeek}`;

  const monthlyChangeStr = stats.monthlyChangePercent > 0 
    ? `+${stats.monthlyChangePercent}%` 
    : `${stats.monthlyChangePercent}%`;

  const weightLostStr = stats.monthlyChangeKgLost > 0 
    ? `+${stats.monthlyChangeKgLost}kg acumulados.` 
    : `${Math.abs(stats.monthlyChangeKgLost)}kg perdidos.`;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-250">
      
      {/* Welcome Screen Header */}
      <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="font-headline font-extrabold text-3xl md:text-4xl text-black dark:text-white uppercase tracking-tight">
            Progress Overview
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-1">
            Welcome back, {user.name}. Your evolution is looking strong this month.
          </p>
        </div>
        
        {/* ADD ENTRY action */}
        <button
          onClick={onAddEntryClick}
          className="bg-[#ff6b00] text-white border-2 border-black font-headline font-extrabold text-sm px-6 py-3.5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-normal"
        >
          ADD ENTRY
        </button>
      </section>

      {/* Summary Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Current BMI Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] relative overflow-hidden transition-colors duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs font-bold uppercase tracking-wider">
              Current BMI
            </span>
            <span className="p-1 px-1.5 bg-zinc-100 dark:bg-zinc-800 rounded font-mono text-[10px] font-bold text-zinc-500">
              IMC
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="font-headline font-black text-5xl text-black dark:text-white tracking-tighter">
              {stats.currentBMI > 0 ? stats.currentBMI.toFixed(1) : "--"}
            </span>
            {stats.currentBMI > 0 && (
              <span className="bg-[#a4f0be] text-black text-[10px] font-mono font-extrabold px-1.5 py-0.5 border border-black rounded-sm">
                {bmiDeltaStr} this week
              </span>
            )}
          </div>

          <p className={`font-mono text-xs font-extrabold mt-2 ${currentBMIStatus.textClass}`}>
            {currentBMIStatus.label}
          </p>

          {/* BMI Gradient Range Slider */}
          {stats.currentBMI > 0 && <BMIGauge bmi={stats.currentBMI} />}
        </div>

        {/* Goal Progress Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] transition-colors duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs font-bold uppercase tracking-wider">
              Goal Progress
            </span>
            <Flag className="h-4 w-4 text-[#ff6b00]" />
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="font-headline font-black text-5xl text-black dark:text-white tracking-tighter col">
              {stats.currentBMI > 0 ? `${stats.goalProgressPercent}%` : "0%"}
            </span>
            <span className="text-zinc-450 dark:text-zinc-400 font-mono text-[10px]">
              to target {stats.targetBMI}
            </span>
          </div>

          {/* Brutalist Progress Frame bar */}
          <div className="mt-5 bg-zinc-100 dark:bg-zinc-800 h-7 border-2 border-black relative rounded-sm overflow-hidden shadow-inner font-mono text-xs font-extrabold flex items-center">
            <div 
              style={{ width: `${stats.currentBMI > 0 ? stats.goalProgressPercent : 0}%` }}
              className="bg-[#a04100] h-full transition-all duration-1000 border-r border-black"
            ></div>
            <div className="absolute inset-x-0 text-center select-none mix-blend-difference text-white">
              Progress
            </div>
          </div>
        </div>

        {/* Monthly Change Card */}
        <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] transition-colors duration-200">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 dark:text-zinc-500 font-mono text-xs font-bold uppercase tracking-wider">
              Monthly Change
            </span>
            <TrendingDown className="h-4 w-4 text-emerald-500" />
          </div>

          <div className="flex items-baseline gap-2.5">
            <span className="font-headline font-black text-5xl text-emerald-500 dark:text-emerald-400 tracking-tighter">
              {stats.currentBMI > 0 ? monthlyChangeStr : "--"}
            </span>
            <span className="text-zinc-450 dark:text-zinc-400 font-mono text-[10px]">
              since Oct 1st
            </span>
          </div>

          {stats.currentBMI > 0 ? (
            <p className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 mt-3.5 leading-relaxed">
              Equates to approximately {weightLostStr}
            </p>
          ) : (
            <p className="text-xs font-mono font-medium text-zinc-500 dark:text-zinc-400 mt-3.5">
              Sem dados históricos para medir.
            </p>
          )}
        </div>
      </section>

      {/* Main Evolution Bento Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Bento Segment: Evolution Chart */}
        <div className="lg:col-span-2">
          <BMIChart
            trendData={stats.trendData}
            selectedRange={selectedRange}
            onRangeChange={onRangeChange}
          />
        </div>

        {/* Right Bento Segment: Measurement history feed */}
        <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex flex-col justify-between overflow-hidden transition-colors duration-200">
          
          {/* Recent History Table Header */}
          <div className="p-6 border-b-2 border-black bg-zinc-100 dark:bg-zinc-800 flex justify-between items-center">
            <h2 className="font-headline font-bold text-base text-black dark:text-white uppercase tracking-tight">
              Recent History
            </h2>
            <Clock className="h-4 w-4 text-[#ff6b00]" />
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto max-h-[280px]">
            {stats.recentHistory.length === 0 ? (
              <div className="h-48 flex items-center justify-center p-6 text-center text-zinc-400 font-mono text-xs">
                Nenhum registro ainda. Adicione na calculadora ou no botão de entrada acima!
              </div>
            ) : (
              <table className="w-full font-mono text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 text-zinc-400 font-bold border-b border-black/10 dark:border-white/10">
                    <th className="p-3.5 uppercase tracking-wider">Date</th>
                    <th className="p-3.5 text-right uppercase tracking-wider">Weight</th>
                    <th className="p-3.5 text-right uppercase tracking-wider">BMI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/10 dark:divide-white/10 dark:text-zinc-300 font-semibold">
                  {stats.recentHistory.slice(0, 5).map((entry) => {
                    const status = getBMICategory(entry.bmi);
                    return (
                      <tr 
                        key={entry.id} 
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="p-3.5 font-bold">
                          {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                            month: "short",
                            day: "2-digit",
                            year: "numeric"
                          })}
                        </td>
                        <td className="p-3.5 text-right font-bold">
                          {entry.weight.toFixed(1)} kg
                        </td>
                        <td className="p-3.5 text-right">
                          <span className={`${status.textClass} font-black`}>
                            {entry.bmi.toFixed(1)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* View Full History Trigger button */}
          <button
            onClick={() => onViewChange("history")}
            className="p-4 border-t-2 border-black font-headline font-extrabold text-xs text-center text-[#a04100] dark:text-[#ff6b00] hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors cursor-pointer uppercase tracking-tight"
          >
            View Full History
          </button>
        </div>
      </section>

      {/* Insights Bento Block */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
        
        {/* Knowledge Base Card */}
        <div 
          onClick={() => onViewChange("history")}
          className="bg-stone-100 dark:bg-zinc-900/60 border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] group cursor-pointer relative overflow-hidden transition-colors"
        >
          <div className="relative z-10">
            <h3 className="font-headline font-bold text-base text-black dark:text-white uppercase mb-2">
              Health Insight
            </h3>
            <p className="text-xs text-zinc-505 dark:text-zinc-400 font-mono leading-relaxed mb-4">
              {stats.healthInsight}
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-headline font-black text-[#a04100] dark:text-[#ff6b00] group-hover:gap-3 transition-all uppercase">
              Explore Strategy <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-[#ff6b00]/10 dark:bg-[#ff6b00]/5 rounded-full blur-2xl group-hover:bg-[#ff6b00]/15 transition-all"></div>
        </div>

        {/* Action Body Fat% Promotion Card */}
        <div className="bg-[#a4f0be] dark:bg-[#1f6b43]/30 border-2 border-black dark:border-white/20 p-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] flex items-center justify-between transition-colors">
          <div className="space-y-4">
            <div>
              <h3 className="font-headline font-bold text-base text-black dark:text-white uppercase mb-1">
                Advanced Metrics
              </h3>
              <p className="text-xs font-mono text-zinc-700 dark:text-zinc-300">
                Calculate Body Fat % for more accuracy.
              </p>
            </div>
            
            <button
              onClick={() => onViewChange("calculator")}
              className="bg-black text-white hover:bg-zinc-900 border-2 border-black px-4 py-2 font-mono font-bold text-[10px] uppercase tracking-wide shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all cursor-pointer"
            >
              Try Now
            </button>
          </div>

          {/* Aesthetic mathematical calculator graphic icon */}
          <div className="w-16 h-16 rotate-12 opacity-30 group-hover:rotate-6 transition-all hidden sm:block text-black dark:text-white">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <line x1="8" y1="6" x2="16" y2="6" strokeWidth="2" />
              <line x1="12" y1="1" x2="12" y2="1" strokeWidth="3" strokeLinecap="round" />
              <circle cx="8" cy="11" r="1.5" />
              <circle cx="12" cy="11" r="1.5" />
              <circle cx="16" cy="11" r="1.5" />
              <circle cx="8" cy="15" r="1.5" />
              <circle cx="12" cy="15" r="1.5" />
              <circle cx="16" cy="15" r="1.5" />
              <circle cx="8" cy="19" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
              <circle cx="16" cy="19" r="1.5" />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
}
