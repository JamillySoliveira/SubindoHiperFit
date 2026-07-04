import { useState, FormEvent } from "react";
import { X, Calendar, Edit3, Plus, Weight } from "lucide-react";
import { WeightEntry } from "../types";

interface AddEntryModalProps {
  onClose: () => void;
  onSubmit: (weight: number, height: number, date: string, entryId?: string) => Promise<void>;
  defaultHeight?: number;
  entryToEdit?: WeightEntry | null;
}

export default function AddEntryModal({
  onClose,
  onSubmit,
  defaultHeight = 184.5,
  entryToEdit = null
}: AddEntryModalProps) {
  const [weight, setWeight] = useState(entryToEdit ? entryToEdit.weight.toString() : "");
  const [height, setHeight] = useState(entryToEdit ? entryToEdit.height.toString() : defaultHeight.toString());
  const [date, setDate] = useState(entryToEdit ? entryToEdit.date : new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFormSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    const weightNum = parseFloat(weight);
    const heightNum = parseFloat(height);

    if (isNaN(weightNum) || weightNum <= 0) {
      setError("Por favor, insira um peso válido.");
      return;
    }

    if (isNaN(heightNum) || heightNum <= 0) {
      setError("Por favor, insira uma altura válida.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(weightNum, heightNum, date, entryToEdit?.id);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Algo deu errado ao salvar o registro.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] border-2 border-black dark:border-white/20 p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-colors duration-200 animate-in fade-in zoom-in-95 duration-155">
        
        {/* Top-left neobrutalist accent label */}
        <div className="absolute -top-1 -left-1 px-3 py-0.5 bg-[#ff6b00] border-2 border-black font-mono text-[9px] text-white font-extrabold uppercase">
          {entryToEdit ? "EDIT WEIGHT" : "LOG WEIGHT"}
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 border-2 border-black hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-all active:translate-y-0.5 cursor-pointer shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="mb-6 mt-2">
          <h3 className="font-headline font-bold text-xl text-black dark:text-white uppercase tracking-tight">
            {entryToEdit ? "Alterar Registro" : "Add Daily Entry"}
          </h3>
          <p className="text-xs text-zinc-500 font-mono">
            {entryToEdit ? "Atualize suas métricas de evolução física salvas." : "Rastreie suas métricas de evolução física diárias."}
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border-2 border-red-500 text-red-700 p-2.5 text-xs font-mono">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {/* Weight Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-700 dark:text-zinc-300">
              Weight (KG)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                placeholder="00.0"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none font-mono text-zinc-900 dark:text-white text-lg font-bold"
                required
                autoFocus
              />
              <span className="absolute right-4 top-[50%] -translate-y-1/2 font-mono text-xs text-zinc-400 font-bold">
                KG
              </span>
            </div>
          </div>

          {/* Height Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-700 dark:text-zinc-300">
              Height (CM)
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                placeholder="184.5"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none font-mono text-zinc-900 dark:text-white font-bold"
                required
              />
              <span className="absolute right-4 top-[50%] -translate-y-1/2 font-mono text-xs text-zinc-400 font-bold">
                CM
              </span>
            </div>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5 text-zinc-700 dark:text-zinc-300">
              Measurement Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-zinc-900 border-2 border-black dark:border-white/20 focus:border-[#ff6b00] focus:ring-0 outline-none font-mono text-zinc-900 dark:text-white font-bold"
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-[#ff6b00] text-white border-2 border-black py-3.5 font-headline font-bold text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="animate-pulse">Salvando...</span>
            ) : (
              <>
                {entryToEdit ? "Salvar Alterações" : "Confirm Entry"}
                {entryToEdit ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
