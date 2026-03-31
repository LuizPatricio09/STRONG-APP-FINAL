import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  History, 
  TrendingUp, 
  Dumbbell,
  ChevronRight,
  Trash2,
  Calendar,
  Award,
  Flame,
  X,
  Moon
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { format, parseISO, isWithinInterval, subDays, startOfWeek, endOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Workout, Exercise, Serie, TipoSerie, MUSCLE_GROUPS, CatalogExercise } from "./types";
import ExerciseSelector from "./components/ExerciseSelector";
import { useExercicio } from "./hooks/useExercicio";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";
import { login, cadastrar, logout } from "./lib/auth";

import { SemanaView } from "./components/SemanaView";
import { useSemana } from "./hooks/useSemana";
import { useProgressao } from "./hooks/useProgressao";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const tipoSerieConfig: Record<TipoSerie, { label: string; cor: string; textCor: string; borderCor: string; icone: string; descricao: string }> = {
  valida: {
    label: 'Válida',
    cor: 'bg-emerald-500',
    textCor: 'text-emerald-500',
    borderCor: 'border-emerald-500',
    icone: '✅',
    descricao: 'Série principal do treino'
  },
  ajuste: {
    label: 'Ajuste',
    cor: 'bg-amber-500',
    textCor: 'text-amber-500',
    borderCor: 'border-amber-500',
    icone: '⚙️',
    descricao: 'Ajuste de carga ou técnica'
  },
  aquecimento: {
    label: 'Aquecimento',
    cor: 'bg-blue-500',
    textCor: 'text-blue-500',
    borderCor: 'border-blue-500',
    icone: '🔥',
    descricao: 'Série de aquecimento'
  }
};

const musculoConfig: Record<string, { cor: string; icone: string; bg: string }> = {
  'Peito':       { cor: 'text-red-500',    bg: 'bg-red-50',    icone: '🏋️' },
  'Costas':      { cor: 'text-blue-500',   bg: 'bg-blue-50',   icone: '🔙' },
  'Ombros':      { cor: 'text-purple-500', bg: 'bg-purple-50', icone: '🔝' },
  'Bíceps':      { cor: 'text-green-500',  bg: 'bg-green-50',  icone: '💪' },
  'Tríceps':     { cor: 'text-orange-500', bg: 'bg-orange-50', icone: '🔱' },
  'Quadríceps':  { cor: 'text-yellow-500', bg: 'bg-yellow-50', icone: '🦵' },
  'Posterior':   { cor: 'text-stone-700',  bg: 'bg-stone-100', icone: '🦿' },
  'Glúteo':      { cor: 'text-pink-500',   bg: 'bg-pink-50',   icone: '🍑' },
  'Panturrilha': { cor: 'text-gray-500',   bg: 'bg-gray-50',   icone: '🦶' },
  'Core':        { cor: 'text-emerald-500', bg: 'bg-emerald-50', icone: '🧘' },
  'Cardio':      { cor: 'text-rose-500',   bg: 'bg-rose-50',   icone: '🏃' },
};

type View = "dashboard" | "register" | "history" | "analysis";

export default function App() {
  const [activeView, setActiveView] = useState<View>("dashboard");
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  // Login/Signup state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setWorkouts([]); setLoading(false); return; }

    const fetchWorkouts = async () => {
      const { data, error } = await supabase
        .from('treinos')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (!error && data) setWorkouts(data as Workout[]);
      setLoading(false);
    };

    fetchWorkouts();

    const channel = supabase
      .channel('treinos_app')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treinos', filter: `user_id=eq.${user.id}` }, fetchWorkouts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      if (isLoginMode) {
        await login(email, password);
      } else {
        if (password !== confirmPassword) {
          throw new Error("As senhas não coincidem");
        }
        await cadastrar(email, password);
      }
    } catch (error: any) {
      setAuthError(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => logout();

  const handleWorkoutSaved = () => {
    setActiveView("history");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-stone-200 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-emerald-500 p-4 rounded-2xl w-fit mx-auto mb-4">
              <Dumbbell className="text-white w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">FitTrack AI</h1>
            <p className="text-stone-500">
              {isLoginMode ? "Entre na sua conta" : "Crie sua conta gratuita"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400 ml-1">E-mail</label>
              <input 
                type="email" 
                placeholder="seu@email.com" 
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-stone-400 ml-1">Senha</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {!isLoginMode && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-stone-400 ml-1">Confirmar Senha</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-stone-50 border border-stone-100 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            )}

            {authError && (
              <p className="text-red-500 text-xs font-medium text-center bg-red-50 py-2 rounded-lg border border-red-100">
                {authError}
              </p>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {isAuthenticating ? "Processando..." : (isLoginMode ? "Entrar" : "Criar conta")}
            </button>
          </form>

          <div className="text-center">
            <button 
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setAuthError("");
              }}
              className="text-stone-500 text-sm hover:text-emerald-600 transition-colors font-medium"
            >
              {isLoginMode ? "Não tem conta? Criar conta" : "Já tem conta? Entrar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#1C1917] font-sans">
      {/* Sidebar / Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 px-4 py-2 flex justify-around items-center z-50 md:top-0 md:bottom-auto md:flex-col md:w-64 md:h-screen md:border-t-0 md:border-r md:py-8 md:justify-start md:gap-4">
        <div className="hidden md:flex items-center gap-3 px-4 mb-8 w-full">
          <div className="bg-emerald-500 p-2 rounded-xl">
            <Dumbbell className="text-white w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">FitTrack AI</h1>
        </div>

        <NavItem 
          active={activeView === "dashboard"} 
          onClick={() => setActiveView("dashboard")}
          icon={<LayoutDashboard size={20} />}
          label="Dashboard"
        />
        <NavItem 
          active={activeView === "register"} 
          onClick={() => setActiveView("register")}
          icon={<PlusCircle size={20} />}
          label="Novo Treino"
        />
        <NavItem 
          active={activeView === "history"} 
          onClick={() => setActiveView("history")}
          icon={<History size={20} />}
          label="Histórico"
        />
        <NavItem 
          active={activeView === "analysis"} 
          onClick={() => setActiveView("analysis")}
          icon={<TrendingUp size={20} />}
          label="Análise"
        />

        <div className="hidden md:block mt-auto w-full px-4">
          <button 
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-stone-500 hover:bg-stone-100 rounded-xl transition-all text-sm font-medium"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pb-24 pt-6 px-4 md:pl-72 md:pt-12 md:pr-12 max-w-7xl mx-auto">
        {activeView === "dashboard" && <Dashboard workouts={workouts} loading={loading} />}
        {activeView === "register" && <WorkoutForm onSaved={handleWorkoutSaved} userId={user.id} />}
        {activeView === "history" && <WorkoutHistory workouts={workouts} userId={user.id} />}
        {activeView === "analysis" && <Analysis workouts={workouts} userId={user.id} />}
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all w-full md:flex-row md:gap-4 md:px-4 md:py-3",
        active ? "text-emerald-600 bg-emerald-50 md:bg-emerald-500 md:text-white" : "text-stone-500 hover:bg-stone-100"
      )}
    >
      {icon}
      <span className="text-[10px] font-medium md:text-sm">{label}</span>
    </button>
  );
}

// --- Dashboard Component ---
function Dashboard({ workouts, loading }: { workouts: Workout[]; loading: boolean }) {
  const [selectedDay, setSelectedDay] = useState<{ date: Date; workout?: Workout } | null>(null);
  const { streak } = useSemana(workouts);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-stone-200 rounded-2xl w-full"></div></div>;

  const lastWorkout = workouts[0];
  const prs = calculatePRs(workouts);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Bem-vindo de volta!</h2>
        <p className="text-stone-500">Aqui está o resumo do seu progresso.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Flame className="text-orange-500" />} 
          label="Streak Atual" 
          value={`${streak} dias`} 
          subtext="Continue assim!"
        />
        <StatCard 
          icon={<Award className="text-yellow-500" />} 
          label="Recordes Pessoais" 
          value={`${prs.length}`} 
          subtext="Exercícios com PR"
        />
        <StatCard 
          icon={<Calendar className="text-blue-500" />} 
          label="Treinos este Mês" 
          value={`${workouts.filter(w => parseISO(w.date) > subDays(new Date(), 30)).length}`} 
          subtext="Últimos 30 dias"
        />
      </div>

      <SemanaView 
        workouts={workouts} 
        onSelectDay={(date, workout) => setSelectedDay({ date, workout })} 
      />

      {selectedDay && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold">
                {format(selectedDay.date, "EEEE, dd/MM", { locale: ptBR })}
              </h3>
              <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            {selectedDay.workout ? (
              <div className="space-y-4">
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                  <p className="text-emerald-800 font-bold text-lg">{selectedDay.workout.name}</p>
                  <p className="text-emerald-600 text-sm">{selectedDay.workout.exercises.length} exercícios realizados</p>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {selectedDay.workout.exercises.map((ex, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                      <span className="font-medium text-sm">{ex.name}</span>
                      <span className="text-[10px] bg-white px-2 py-1 rounded-lg border border-stone-100 font-bold text-stone-400">
                        {ex.muscle_group}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 space-y-4">
                <div className="bg-stone-50 p-6 rounded-3xl inline-block">
                  <Moon className="w-12 h-12 text-stone-300" />
                </div>
                <p className="text-stone-500 font-medium">Dia de descanso ou sem registro.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Last Workout */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg">Último Treino</h3>
            {lastWorkout && (
              <span className="text-xs font-medium bg-stone-100 px-3 py-1 rounded-full text-stone-600">
                {format(parseISO(lastWorkout.date), "dd 'de' MMMM", { locale: ptBR })}
              </span>
            )}
          </div>
          {lastWorkout ? (
            <div className="space-y-4">
              <h4 className="text-xl font-bold text-emerald-600">{lastWorkout.name}</h4>
              <div className="space-y-2">
                {lastWorkout.exercises.map((ex, i) => {
                  const config = musculoConfig[ex.muscle_group] || { icone: '🔥', cor: 'text-stone-500', bg: 'bg-stone-50' };
                  return (
                    <div key={i} className="border-t border-stone-100 pt-4 first:border-t-0 first:pt-0">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-bold text-stone-800">{ex.name}</h5>
                        <span className={cn("px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1", config.bg, config.cor)}>
                          {config.icone} {ex.muscle_group}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {ex.series.map((s, si) => (
                          <div key={si} className="flex items-center gap-3 text-xs text-stone-500 pl-2 border-l-2 border-stone-100">
                            <span className="w-4">{tipoSerieConfig[s.tipo_serie].icone}</span>
                            <span className="w-20 font-medium">{tipoSerieConfig[s.tipo_serie].label}</span>
                            <span className="font-bold text-stone-700">{s.weight}kg</span>
                            <span>x{s.reps}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-stone-400 italic text-center py-8">Nenhum treino registrado ainda.</p>
          )}
        </div>

        {/* Muscle Volume Chart */}
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Volume por Grupo Muscular</h3>
          <div className="h-64">
            <MuscleVolumeChart workouts={workouts} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext }: { icon: React.ReactNode; label: string; value: string; subtext: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm flex items-start gap-4">
      <div className="p-3 bg-stone-50 rounded-2xl">{icon}</div>
      <div>
        <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-bold mt-1">{value}</p>
        <p className="text-xs text-stone-500 mt-1">{subtext}</p>
      </div>
    </div>
  );
}

// --- Workout Form Component ---
function WorkoutForm({ onSaved, userId }: { onSaved: () => void; userId: string }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [exercises, setExercises] = useState<Partial<Exercise>[]>([
    { 
      name: "", 
      muscle_group: "Peito", 
      series: [{ reps: 10, weight: 0, tipo_serie: 'aquecimento' }] 
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState<{ open: boolean; index: number | null }>({
    open: false,
    index: null
  });

  const addExercise = () => {
    setExercises([...exercises, { 
      name: "", 
      muscle_group: "Peito", 
      series: [{ reps: 10, weight: 0, tipo_serie: 'aquecimento' }] 
    }]);
  };

  const handleSelectExercise = (exercise: CatalogExercise) => {
    console.log("Selecionando exercício:", exercise.nome, exercise.musculo_principal);
    if (selectorOpen.index !== null) {
      const newExercises = [...exercises];
      newExercises[selectorOpen.index] = {
        ...newExercises[selectorOpen.index],
        name: exercise.nome,
        muscle_group: exercise.musculo_principal,
        // Adicionando campos extras se necessário para persistência
      };
      setExercises(newExercises);
    }
    setSelectorOpen({ open: false, index: null });
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const addSerie = (exerciseIndex: number) => {
    const newExercises = [...exercises];
    const currentSeries = newExercises[exerciseIndex].series || [];
    const lastSerie = currentSeries[currentSeries.length - 1];
    
    newExercises[exerciseIndex].series = [
      ...currentSeries,
      { 
        reps: lastSerie?.reps || 10, 
        weight: lastSerie?.weight || 0, 
        tipo_serie: currentSeries.length === 0 ? 'aquecimento' : 'valida' 
      }
    ];
    setExercises(newExercises);
  };

  const removeSerie = (exerciseIndex: number, serieIndex: number) => {
    const newExercises = [...exercises];
    newExercises[exerciseIndex].series = newExercises[exerciseIndex].series?.filter((_, i) => i !== serieIndex);
    setExercises(newExercises);
  };

  const updateExercise = (index: number, field: keyof Exercise, value: any) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

  const updateSerie = (exerciseIndex: number, serieIndex: number, field: keyof Serie, value: any) => {
    const newExercises = [...exercises];
    const series = [...(newExercises[exerciseIndex].series || [])];
    series[serieIndex] = { ...series[serieIndex], [field]: value };
    newExercises[exerciseIndex].series = series;
    setExercises(newExercises);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Iniciando salvamento do treino...");
    
    try {
      if (!userId) {
        console.error('Usuário não autenticado');
        alert('Você precisa estar logado para salvar um treino.');
        return;
      }

      if (!exercises || exercises.length === 0 || exercises.some(ex => !ex.name)) {
        alert('Adicione e preencha todos os exercícios antes de salvar');
        return;
      }

      setIsSubmitting(true);

      const diasSemana = [
        { nome: 'Domingo' }, { nome: 'Segunda-feira' }, { nome: 'Terça-feira' }, 
        { nome: 'Quarta-feira' }, { nome: 'Quinta-feira' }, { nome: 'Sexta-feira' }, { nome: 'Sábado' }
      ];

      const treinoData = {
        user_id: userId,
        name,
        date,
        exercises,
        dia_semana: new Date(date).getDay(),
        nome_dia: diasSemana[new Date(date).getDay()].nome,
      };

      const { error } = await supabase.from('treinos').insert(treinoData);
      if (error) throw error;

      console.log("Treino salvo com sucesso no Supabase!");
      alert('Treino salvo com sucesso! ✅');
      onSaved();

    } catch (erro) {
      console.error('Erro ao salvar treino:', erro);
      alert('Erro ao salvar treino. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-2">Registrar Treino</h2>
        <p className="text-stone-500">Adicione os exercícios realizados hoje.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400 ml-1">Nome do Treino</label>
            <input 
              type="text" 
              placeholder="Ex: Treino A - Peito" 
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase text-stone-400 ml-1">Data</label>
            <input 
              type="date" 
              className="w-full bg-white border border-stone-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Exercícios</h3>
            <button 
              type="button" 
              onClick={addExercise}
              className="text-emerald-600 text-sm font-bold flex items-center gap-1 hover:bg-emerald-50 px-3 py-1 rounded-full transition-all"
            >
              <PlusCircle size={16} /> Adicionar
            </button>
          </div>

          {exercises.map((ex, index) => (
            <ExerciseItem 
              key={index} 
              exercise={ex} 
              index={index}
              onRemove={() => removeExercise(index)}
              onUpdate={updateExercise}
              onUpdateSerie={updateSerie}
              onAddSerie={() => addSerie(index)}
              onRemoveSerie={(sIdx) => removeSerie(index, sIdx)}
              onOpenSelector={() => setSelectorOpen({ open: true, index })}
            />
          ))}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-emerald-600 text-white font-bold py-4 rounded-2xl shadow-lg shadow-emerald-200 hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Salvando..." : "Salvar Treino"}
        </button>
      </form>

      {selectorOpen.open && (
        <ExerciseSelector 
          onSelect={handleSelectExercise} 
          onClose={() => setSelectorOpen({ open: false, index: null })} 
        />
      )}
    </div>
  );
}

function ExerciseItem({ 
  exercise, 
  index, 
  onRemove, 
  onUpdate, 
  onUpdateSerie, 
  onAddSerie, 
  onRemoveSerie,
  onOpenSelector 
}: { 
  key?: any;
  exercise: Partial<Exercise>; 
  index: number; 
  onRemove: () => void; 
  onUpdate: (idx: number, field: keyof Exercise, val: any) => void;
  onUpdateSerie: (eIdx: number, sIdx: number, field: keyof Serie, val: any) => void;
  onAddSerie: () => void;
  onRemoveSerie: (sIdx: number) => void;
  onOpenSelector: () => void;
}) {
  const { data: catalogData } = useExercicio(exercise.name || null);

  useEffect(() => {
    if (catalogData) {
      onUpdate(index, "muscle_group", catalogData.musculo_principal);
    }
  }, [catalogData]);

  const config = musculoConfig[exercise.muscle_group || ""] || { icone: '🔥', cor: 'text-stone-500', bg: 'bg-stone-50' };

  return (
    <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm space-y-6 relative group">
      <button 
        type="button" 
        onClick={onRemove}
        className="absolute top-4 right-4 text-stone-300 hover:text-red-500 transition-colors"
      >
        <Trash2 size={18} />
      </button>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-stone-400">Selecionar Exercício</label>
          <button
            type="button"
            onClick={onOpenSelector}
            className="w-full bg-stone-50 border-none rounded-xl px-4 py-3 text-sm text-left focus:ring-2 focus:ring-emerald-500 outline-none flex justify-between items-center"
          >
            <span className={exercise.name ? "text-stone-700 font-medium" : "text-stone-400"}>
              {exercise.name || "Escolha um exercício do catálogo..."}
            </span>
            <ChevronRight size={14} className="text-stone-300" />
          </button>
        </div>

        {exercise.name && (
          <div className="space-y-2 pt-2">
            <div>
              <h2 className="text-xl font-bold text-stone-800">
                {exercise.name ?? 'Nenhum exercício selecionado'}
              </h2>
            </div>
            
            {exercise.muscle_group && (
              <div className="flex gap-2 flex-wrap mt-1">
                {/* Músculo principal */}
                <span className={cn("px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2", config.bg, config.cor)}>
                  {config.icone} {exercise.muscle_group}
                </span>

                {/* Músculos secundários */}
                {catalogData?.musculos_secundarios?.map(musculo => (
                  <span key={musculo} className="px-2 py-1 rounded-lg bg-stone-100 text-stone-500 text-[10px] font-medium border border-stone-200">
                    {musculo}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-4 border-t border-stone-100 pt-6">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold uppercase text-stone-400">Registro de Séries</h4>
          <button 
            type="button" 
            onClick={onAddSerie}
            className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold hover:bg-emerald-100 transition-all"
          >
            + Nova Série
          </button>
        </div>
        
        <div className="space-y-4">
          {exercise.series?.map((serie, sIdx) => (
            <div key={sIdx} className="bg-stone-50/50 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Série {sIdx + 1} — {exercise.name}</span>
                </div>
                <button 
                  type="button" 
                  onClick={() => onRemoveSerie(sIdx)}
                  className="text-stone-300 hover:text-red-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5 space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase ml-1">Tipo da série — {exercise.name}</span>
                  <div className="flex gap-1">
                    {(['aquecimento', 'ajuste', 'valida'] as TipoSerie[]).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => onUpdateSerie(index, sIdx, "tipo_serie", t)}
                        className={cn(
                          "flex-1 py-2 rounded-xl text-[10px] font-bold transition-all border flex items-center justify-center gap-1",
                          serie.tipo_serie === t 
                            ? cn(tipoSerieConfig[t].cor, "text-white border-transparent") 
                            : "bg-white text-stone-400 border-stone-100 hover:border-stone-200"
                        )}
                      >
                        <span>{tipoSerieConfig[t].icone}</span>
                        <span>{tipoSerieConfig[t].label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="md:col-span-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase ml-1">Carga</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-white border border-stone-100 rounded-xl pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={serie.weight}
                      onChange={e => onUpdateSerie(index, sIdx, "weight", parseFloat(e.target.value))}
                      min="0"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-300 font-bold">KG</span>
                  </div>
                </div>

                <div className="md:col-span-3 space-y-1.5">
                  <span className="text-[10px] font-bold text-stone-400 uppercase ml-1">Reps</span>
                  <div className="relative">
                    <input 
                      type="number" 
                      className="w-full bg-white border border-stone-100 rounded-xl pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={serie.reps}
                      onChange={e => onUpdateSerie(index, sIdx, "reps", parseInt(e.target.value))}
                      min="1"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-stone-300 font-bold">REPS</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Workout History Component ---
function WorkoutHistory({ workouts, userId }: { workouts: Workout[]; userId: string }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('treinos').delete().eq('id', id);
    } catch (error) {
      console.error("Error deleting workout", error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Histórico</h2>
        <p className="text-stone-500">Todos os seus treinos registrados.</p>
      </header>

      <div className="space-y-4">
        {workouts.length > 0 ? (
          workouts.map((workout) => (
            <div key={workout.id} className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
              <div 
                className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-stone-50 transition-colors"
                onClick={() => setExpandedId(expandedId === workout.id ? null : workout.id!)}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Calendar size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{workout.name}</h4>
                    <p className="text-sm text-stone-400">
                      {format(parseISO(workout.date), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Exercícios</p>
                    <p className="font-bold">{workout.exercises.length}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(workout.id!);
                      }}
                      className="p-2 text-stone-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                    <ChevronRight 
                      size={20} 
                      className={cn("text-stone-300 transition-transform", expandedId === workout.id && "rotate-90")} 
                    />
                  </div>
                </div>
              </div>

              {expandedId === workout.id && (
                <div className="px-6 pb-6 pt-2 border-t border-stone-100 bg-stone-50/30 space-y-6 animate-in slide-in-from-top-2 duration-200">
                  {workout.exercises.map((ex, i) => {
                    const config = musculoConfig[ex.muscle_group] || { icone: '🔥', cor: 'text-stone-500', bg: 'bg-stone-50' };
                    return (
                      <div key={i} className="space-y-3">
                        <div className="flex items-center justify-between border-b border-stone-200 pb-1">
                          <span className="text-sm font-bold text-stone-700">{ex.name}</span>
                          <span className={cn("px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1", config.bg, config.cor)}>
                            {config.icone} {ex.muscle_group}
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          {ex.series.map((s, si) => (
                            <div key={si} className="flex items-center gap-4 text-xs text-stone-500 pl-3 border-l-2 border-stone-200">
                              <span className="w-4">{tipoSerieConfig[s.tipo_serie].icone}</span>
                              <span className="w-20 font-medium">{tipoSerieConfig[s.tipo_serie].label}</span>
                              <span className="font-bold text-stone-700">{s.weight}kg</span>
                              <span>x{s.reps}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-stone-300">
            <p className="text-stone-400 italic">Nenhum treino encontrado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Analysis Component ---
function Analysis({ workouts, userId }: { workouts: Workout[]; userId: string }) {
  const allExercises = Array.from(new Set(workouts.flatMap(w => w.exercises.map(e => e.name))));
  const [selectedExercise, setSelectedExercise] = useState(allExercises[0] || "Supino Reto Barra");

  const { progressionData, muscleVolume, loading } = useProgressao(userId, selectedExercise);

  if (loading) return <div className="animate-pulse space-y-4"><div className="h-32 bg-stone-200 rounded-2xl w-full"></div></div>;

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Análise de Performance</h2>
        <p className="text-stone-500">Acompanhe sua evolução e volume de treino.</p>
      </header>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-xl flex items-center gap-2">
            <TrendingUp className="text-emerald-600" /> Evolução de Carga
          </h3>
          <select 
            className="bg-white border border-stone-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
          >
            {Array.from(new Set(workouts.flatMap(w => w.exercises.map(e => e.name)))).map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm h-80">
          {progressionData.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={progressionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F5F5F4" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#A8A29E" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#A8A29E" }} />
                <Tooltip 
                  contentStyle={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
                  labelStyle={{ fontWeight: "bold", marginBottom: "4px" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#10B981" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: "#10B981", strokeWidth: 2, stroke: "#fff" }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-stone-400 italic text-sm">
              Dados insuficientes para gerar o gráfico. Registre mais treinos com este exercício.
            </div>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Distribuição Muscular (Séries)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={muscleVolume} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="muscle" type="category" axisLine={false} tickLine={false} width={80} tick={{ fontSize: 12, fontWeight: 500 }} />
                <Tooltip cursor={{ fill: "transparent" }} />
                <Bar dataKey="sets" radius={[0, 4, 4, 0]}>
                  {muscleVolume.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10B981" : "#34D399"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-sm">
          <h3 className="font-bold text-lg mb-6">Resumo de Volume Semanal</h3>
          <div className="space-y-4">
            {muscleVolume.slice(0, 5).map((mv, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm font-medium">{mv.muscle}</span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="h-2 bg-stone-100 rounded-full flex-1 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${Math.min((mv.sets / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-stone-500 w-8">{mv.sets}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

// --- Helper Functions ---

function calculatePRs(workouts: Workout[]) {
  const prs: Record<string, number> = {};
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      ex.series.forEach(s => {
        if (s.tipo_serie === 'valida') {
          if (!prs[ex.name] || s.weight > prs[ex.name]) {
            prs[ex.name] = s.weight;
          }
        }
      });
    });
  });
  return Object.entries(prs).map(([name, weight]) => ({ name, weight }));
}

function calculateMuscleVolume(workouts: Workout[]) {
  const volume: Record<string, number> = {};
  workouts.forEach(w => {
    w.exercises.forEach(ex => {
      const validSetsCount = ex.series.filter(s => s.tipo_serie === 'valida').length;
      if (validSetsCount > 0) {
        volume[ex.muscle_group] = (volume[ex.muscle_group] || 0) + validSetsCount;
      }
    });
  });
  return Object.entries(volume)
    .map(([muscle, sets]) => ({ muscle, sets }))
    .sort((a, b) => b.sets - a.sets);
}

function MuscleVolumeChart({ workouts }: { workouts: Workout[] }) {
  const data = calculateMuscleVolume(workouts);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <XAxis dataKey="muscle" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
        <Tooltip 
          cursor={{ fill: "#F5F5F4" }}
          content={({ active, payload }) => {
            if (active && payload && payload.length) {
              const muscle = payload[0].payload.muscle;
              const config = musculoConfig[muscle] || { icone: '🔥' };
              return (
                <div className="bg-white p-3 rounded-xl shadow-xl border border-stone-100">
                  <p className="text-xs font-bold flex items-center gap-2">
                    <span>{config.icone}</span> {muscle}
                  </p>
                  <p className="text-emerald-600 font-bold">{payload[0].value} séries válidas</p>
                </div>
              );
            }
            return null;
          }}
        />
        <Bar dataKey="sets" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={musculoConfig[entry.muscle]?.cor.replace('text-', '#').replace('500', 'B981') || '#10B981'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
