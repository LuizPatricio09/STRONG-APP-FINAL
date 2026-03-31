import { useMemo } from 'react';
import { startOfWeek, addDays, format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Workout } from '../types';

export const diasSemanaConfig = {
  0: { nome: 'Domingo',       abrev: 'Dom', cor: 'bg-stone-400'   },
  1: { nome: 'Segunda-feira', abrev: 'Seg', cor: 'bg-blue-500'    },
  2: { nome: 'Terça-feira',   abrev: 'Ter', cor: 'bg-emerald-500' },
  3: { nome: 'Quarta-feira',  abrev: 'Qua', cor: 'bg-amber-500'   },
  4: { nome: 'Quinta-feira',  abrev: 'Qui', cor: 'bg-orange-500'  },
  5: { nome: 'Sexta-feira',   abrev: 'Sex', cor: 'bg-rose-500'    },
  6: { nome: 'Sábado',        abrev: 'Sab', cor: 'bg-purple-500'  },
};

export const useSemana = (workouts: Workout[]) => {
  const hoje = new Date();
  const diaAtual = hoje.getDay();
  const nomeAtual = diasSemanaConfig[diaAtual as keyof typeof diasSemanaConfig].nome;

  const semanaAtual = useMemo(() => {
    const inicio = startOfWeek(hoje, { weekStartsOn: 1 }); // Começa na Segunda
    return Array.from({ length: 7 }).map((_, i) => {
      const data = addDays(inicio, i);
      const diaSemana = data.getDay();
      const treino = workouts.find(w => isSameDay(new Date(w.date), data));
      
      return {
        data,
        diaSemana,
        config: diasSemanaConfig[diaSemana as keyof typeof diasSemanaConfig],
        treino,
        isHoje: isSameDay(data, hoje)
      };
    });
  }, [workouts, hoje]);

  const streak = useMemo(() => {
    let count = 0;
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let current = new Date();
    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].date);
      if (isSameDay(workoutDate, current)) {
        count++;
        current = addDays(current, -1);
      } else if (workoutDate < addDays(current, -1)) {
        break;
      }
    }
    return count;
  }, [workouts]);

  return {
    diaAtual,
    nomeAtual,
    semanaAtual,
    streak
  };
};
