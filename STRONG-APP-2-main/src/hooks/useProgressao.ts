import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import { Workout } from '../types';

export const useProgressao = (userId: string, selectedExercise: string) => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchWorkouts = async () => {
      const { data, error } = await supabase
        .from('treinos')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });
      if (!error && data) setWorkouts(data as Workout[]);
      setLoading(false);
    };

    fetchWorkouts();

    const channel = supabase
      .channel('treinos_progressao')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'treinos', filter: `user_id=eq.${userId}` }, fetchWorkouts)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const progressionData = useMemo(() => {
    return workouts
      .map(w => {
        const exercise = w.exercises.find(e => e.name === selectedExercise);
        if (!exercise) return null;
        const maxWeight = Math.max(...exercise.series.filter(s => s.tipo_serie === 'valida').map(s => s.weight), 0);
        return {
          date: new Date(w.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
          weight: maxWeight
        };
      })
      .filter((d): d is { date: string; weight: number } => d !== null && d.weight > 0);
  }, [workouts, selectedExercise]);

  const muscleVolume = useMemo(() => {
    const volume: Record<string, number> = {};
    workouts.forEach(w => {
      w.exercises.forEach(ex => {
        const validSets = ex.series.filter(s => s.tipo_serie === 'valida').length;
        volume[ex.muscle_group] = (volume[ex.muscle_group] || 0) + validSets;
      });
    });
    return Object.entries(volume)
      .map(([muscle, sets]) => ({ muscle, sets }))
      .sort((a, b) => b.sets - a.sets);
  }, [workouts]);

  return { progressionData, muscleVolume, loading };
};
