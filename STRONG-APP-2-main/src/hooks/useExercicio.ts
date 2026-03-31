import { useState, useEffect } from 'react';
import { CatalogExercise } from '../types';

export const useExercicio = (exercicioNome: string | null) => {
  const [data, setData] = useState<CatalogExercise | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!exercicioNome) { setData(null); return; }
    setLoading(true);
    fetch('/api/catalog')
      .then(r => r.json())
      .then((catalog: CatalogExercise[]) => {
        const found = catalog.find(e => e.nome === exercicioNome) || null;
        setData(found);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [exercicioNome]);

  return { data, loading };
};
