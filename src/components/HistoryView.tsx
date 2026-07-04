import { Calendar, Trash2, Edit2, ShieldCheck, Dumbbell } from "lucide-react";
import { WeightEntry } from "../types";
import { getBMICategory } from "./BMIGauge";

interface HistoryViewProps {
  entries: WeightEntry[];
  onDeleteEntry: (id: string) => Promise<void>;
  onEditEntry: (entry: WeightEntry) => void;
  onAddEntryClick: () => void;
}

export default function HistoryView({
  entries,
  onDeleteEntry,
  onEditEntry,
  onAddEntryClick
}: HistoryViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-250 select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="font-headline font-extrabold text-3xl text-black dark:text-white uppercase tracking-tight">
            Measurement History
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm mt-1">
            Complete records of your physical weights and computed BMI indices.
          </p>
        </div>

        {/* Quick Add action */}
        <button
          onClick={onAddEntryClick}
          className="bg-white hover:bg-zinc-50 dark:bg-zinc-900 border-2 border-black font-headline font-bold text-xs px-4 py-2.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 transition-all uppercase tracking-tight"
        >
          Add Record +
        </button>
      </div>

      {/* Main Table view */}
      <div className="bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,0.15)] overflow-hidden transition-colors">
        {entries.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto text-zinc-400 border-2 border-dashed border-zinc-200">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-black dark:text-white uppercase">Sem registros armazenados</p>
              <p className="text-xs text-zinc-400 font-mono mt-1">
                Para plotar sua evolução física, adicione logs na Calculadora ou no Painel.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-bold border-b-2 border-black">
                  <th className="p-4 uppercase tracking-wider">Date</th>
                  <th className="p-4 text-right uppercase tracking-wider">Weight</th>
                  <th className="p-4 text-right uppercase tracking-wider">Height</th>
                  <th className="p-4 text-right uppercase tracking-wider">BMI INDEX</th>
                  <th className="p-4 text-center uppercase tracking-wider">Range</th>
                  <th className="p-4 text-center uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10 dark:divide-white/10 dark:text-zinc-300 font-semibold">
                {entries.map((entry) => {
                  const status = getBMICategory(entry.bmi);
                  return (
                    <tr 
                      key={entry.id} 
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <td className="p-4 font-bold">
                        {new Date(entry.date + "T00:00:00").toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "long",
                          day: "2-digit",
                          year: "numeric"
                        })}
                      </td>
                      <td className="p-4 text-right font-black text-sm">
                        {entry.weight.toFixed(1)} kg
                      </td>
                      <td className="p-4 text-right">
                        {entry.height.toFixed(1)} cm
                      </td>
                      <td className="p-4 text-right">
                        <span className={`${status.textClass} font-black text-sm`}>
                          {entry.bmi.toFixed(1)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] text-white border border-black/20 ${status.colorClass}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onEditEntry(entry)}
                            className="p-1 px-2 border border-black hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors text-zinc-600 dark:text-zinc-300 rounded font-normal active:translate-y-0.5 cursor-pointer"
                            title="Alterar Registro"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Remover registro de ${entry.weight}kg em ${entry.date}?`)) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            className="p-1 px-2 border border-black hover:bg-red-550 hover:text-white dark:hover:bg-red-900/40 hover:border-red-500 rounded transition-colors text-zinc-400 font-normal active:translate-y-0.5 cursor-pointer"
                            title="Remover Registro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trust Badges bottom line */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
        <div className="bg-[#a4f0be]/25 border-2 border-[#1f6b43]/20 p-4 rounded-lg flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 font-semibold uppercase leading-tight">
            Banco de dados local isolado com criptografia ativa
          </div>
        </div>
        <div className="bg-stone-50 border-2 border-zinc-200 dark:bg-zinc-900/30 dark:border-zinc-800 p-4 rounded-lg flex items-center gap-3">
          <Dumbbell className="h-5 w-5 text-[#ff6b00] shrink-0" />
          <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400 font-semibold uppercase leading-tight">
            Evolução física sincronizada em tempo real
          </div>
        </div>
      </div>
    </div>
  );
}
