import React, { useState, useMemo, useEffect } from "react";
import { Search, Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { MUSCLE_GROUPS, CatalogExercise } from "../types";

interface ExerciseSelectorProps {
  onSelect: (exercise: CatalogExercise) => void;
  onClose: () => void;
}

export default function ExerciseSelector({ onSelect, onClose }: ExerciseSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [catalog, setCatalog] = useState<CatalogExercise[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    MUSCLE_GROUPS.reduce((acc, group) => ({ ...acc, [group]: true }), {})
  );

  useEffect(() => {
    fetch('/api/catalog')
      .then(r => r.json())
      .then((data: CatalogExercise[]) => setCatalog(data))
      .catch(err => console.error("Failed to fetch catalog", err));
  }, []);

  const filteredCatalog = useMemo(() => {
    return catalog.filter((ex) =>
      ex.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, catalog]);

  const groupedExercises = useMemo(() => {
    const groups: Record<string, CatalogExercise[]> = {};
    filteredCatalog.forEach((ex) => {
      if (!groups[ex.musculo_principal]) groups[ex.musculo_principal] = [];
      groups[ex.musculo_principal].push(ex);
    });
    return groups;
  }, [filteredCatalog]);

  const toggleGroup = (group: string) => {
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-stone-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Selecionar Exercício</h3>
            <p className="text-sm text-stone-500">Escolha um exercício do catálogo</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-400"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4 bg-stone-50/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={18} />
            <input
              type="text"
              placeholder="Buscar exercício..."
              className="w-full bg-white border border-stone-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {Object.keys(groupedExercises).length > 0 ? (
            MUSCLE_GROUPS.map((group) => {
              const exercises = groupedExercises[group];
              if (!exercises || exercises.length === 0) return null;

              const isExpanded = expandedGroups[group];

              return (
                <div key={group} className="space-y-2">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="w-full flex items-center justify-between px-2 py-1 hover:bg-stone-50 rounded-lg transition-colors group"
                  >
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 group-hover:text-stone-600">
                      {getMuscleEmoji(group)} {group}
                    </span>
                    {isExpanded ? <ChevronUp size={14} className="text-stone-300" /> : <ChevronDown size={14} className="text-stone-300" />}
                  </button>

                  {isExpanded && (
                    <div className="grid grid-cols-1 gap-1">
                      {exercises.map((ex) => (
                        <button
                          key={ex.nome}
                          onClick={() => onSelect(ex)}
                          className="flex items-center justify-between w-full px-4 py-3 rounded-xl hover:bg-emerald-50 text-left transition-all group"
                        >
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-stone-700 group-hover:text-emerald-700">
                              {ex.nome}
                            </span>
                            <span className="text-[10px] text-stone-400 uppercase tracking-tighter">
                              {ex.tipo}
                            </span>
                          </div>
                          <Plus size={16} className="text-stone-300 group-hover:text-emerald-500" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-stone-400 italic text-sm">Nenhum exercício encontrado para "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getMuscleEmoji(muscle: string) {
  switch (muscle) {
    case "Bíceps": return "💪";
    case "Tríceps": return "🔱";
    case "Peito": return "🏋️";
    case "Costas": return "🔙";
    case "Ombros": return "🔝";
    case "Quadríceps": return "🦵";
    case "Glúteo": return "🍑";
    case "Posterior": return "🦿";
    case "Panturrilha": return "🦶";
    default: return "🔥";
  }
}
