import React from 'react';
import { useSemana, diasSemanaConfig } from '../hooks/useSemana';
import { Workout } from '../types';
import { CheckCircle2, Moon, Plus } from 'lucide-react';
import { cn } from '../lib/utils';

interface SemanaViewProps {
  workouts: Workout[];
  onSelectDay: (date: Date, workout?: Workout) => void;
}

export const SemanaView: React.FC<SemanaViewProps> = ({ workouts, onSelectDay }) => {
  const { semanaAtual } = useSemana(workouts);

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
      <h3 className="font-bold text-lg mb-6">Visão Semanal</h3>
      <div className="grid grid-cols-7 gap-2">
        {semanaAtual.map((dia) => (
          <button
            key={dia.data.toISOString()}
            onClick={() => onSelectDay(dia.data, dia.treino)}
            className={cn(
              "flex flex-col items-center gap-3 p-2 rounded-2xl transition-all",
              dia.isHoje ? "bg-emerald-50 ring-2 ring-emerald-500 ring-offset-2" : "hover:bg-stone-50"
            )}
          >
            <span className="text-[10px] font-bold uppercase text-stone-400">
              {dia.config.abrev}
            </span>
            
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all",
              dia.treino ? dia.config.cor : "bg-stone-100"
            )}>
              {dia.treino ? (
                <CheckCircle2 className="text-white w-5 h-5" />
              ) : (
                dia.isHoje ? <Plus className="text-emerald-500 w-5 h-5" /> : <Moon className="text-stone-300 w-5 h-5" />
              )}
            </div>

            {dia.treino && (
              <div className="flex flex-col items-center gap-1">
                <span className="text-[8px] font-bold text-stone-600 truncate max-w-[40px]">
                  {dia.treino.name}
                </span>
                <div className="flex gap-0.5">
                  {Array.from(new Set(dia.treino.exercises.map(e => e.muscle_group))).slice(0, 2).map(m => (
                    <div key={m} className="w-1 h-1 rounded-full bg-stone-300" />
                  ))}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
