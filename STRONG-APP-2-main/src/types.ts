export type TipoSerie = 'valida' | 'ajuste' | 'aquecimento';

export interface Serie {
  id?: number;
  exercise_id?: number;
  reps: number;
  weight: number;
  tipo_serie: TipoSerie;
}

export interface Exercise {
  id?: number;
  workout_id?: number;
  name: string;
  muscle_group: string;
  series: Serie[];
}

export interface Workout {
  id?: string;
  name: string;
  date: string;
  diaSemana: number;
  nomeDia: string;
  exercises: Exercise[];
}

export interface CatalogExercise {
  id: number;
  nome: string;
  musculo_principal: string;
  musculos_secundarios: string[];
  equipamento: string;
  tipo: 'Composto' | 'Isolado';
}

export const MUSCLE_GROUPS = [
  "Bíceps",
  "Tríceps",
  "Peito",
  "Costas",
  "Ombros",
  "Quadríceps",
  "Glúteo",
  "Posterior",
  "Panturrilha",
  "Core",
  "Cardio"
];

export const EXERCISE_CATALOG = [
  // Bíceps
  { name: "Rosca Direta", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Scott", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Scott com Halter", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Scott com Barra", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Concentrada", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Inclinada", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Inclinada Simultânea", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Martelo Sentado", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca Spider", muscle: "Bíceps", type: "Isolado" },
  { name: "Rosca na Polia", muscle: "Bíceps", type: "Isolado" },
  { name: "Bayesian Curl", muscle: "Bíceps", type: "Isolado" },
  // Tríceps
  { name: "Tríceps Testa", muscle: "Tríceps", type: "Isolado" },
  { name: "Tríceps Pulley", muscle: "Tríceps", type: "Isolado" },
  { name: "Tríceps Francês na Polia", muscle: "Tríceps", type: "Isolado" },
  { name: "Mergulho", muscle: "Tríceps", type: "Composto" },
  // Peito
  { name: "Supino Reto Barra", muscle: "Peito", type: "Composto" },
  { name: "Supino Reto Halter", muscle: "Peito", type: "Composto" },
  { name: "Supino Inclinado", muscle: "Peito", type: "Composto" },
  { name: "Supino Máquina", muscle: "Peito", type: "Composto" },
  { name: "Supino Inclinado com Halter", muscle: "Peito", type: "Composto" },
  { name: "Supino no Smith", muscle: "Peito", type: "Composto" },
  { name: "Paralela para Peito", muscle: "Peito", type: "Composto" },
  { name: "Crucifixo", muscle: "Peito", type: "Isolado" },
  { name: "Crucifixo na Máquina", muscle: "Peito", type: "Isolado" },
  { name: "Crossover", muscle: "Peito", type: "Isolado" },
  { name: "Crossover Polia Baixa no Banco", muscle: "Peito", type: "Isolado" },
  // Costas
  { name: "Puxada Frontal", muscle: "Costas", type: "Composto" },
  { name: "Puxada Frontal Pegada Neutra", muscle: "Costas", type: "Composto" },
  { name: "Puxada Aberta", muscle: "Costas", type: "Composto" },
  { name: "Pullup Barra Fixa", muscle: "Costas", type: "Composto" },
  { name: "Remada Curvada com Barra", muscle: "Costas", type: "Composto" },
  { name: "Remada Unilateral com Halter", muscle: "Costas", type: "Composto" },
  { name: "Remada Unilateral no Cabo", muscle: "Costas", type: "Composto" },
  { name: "Remada Baixa Unilateral Polia Neutra", muscle: "Costas", type: "Composto" },
  { name: "Remada Alta Pegada Supinada", muscle: "Costas", type: "Composto" },
  { name: "T-Bar Row", muscle: "Costas", type: "Composto" },
  { name: "Pullover", muscle: "Costas", type: "Composto" },
  { name: "Pullover na Polia", muscle: "Costas", type: "Isolado" },
  // Ombros
  { name: "Desenvolvimento com Barra", muscle: "Ombros", type: "Composto" },
  { name: "Elevação Lateral", muscle: "Ombros", type: "Isolado" },
  { name: "Elevação Lateral com Halter", muscle: "Ombros", type: "Isolado" },
  { name: "Elevação Lateral na Máquina", muscle: "Ombros", type: "Isolado" },
  { name: "Elevação Lateral na Polia", muscle: "Ombros", type: "Isolado" },
  { name: "Elevação Frontal", muscle: "Ombros", type: "Isolado" },
  { name: "Crucifixo Inverso na Polia Alta", muscle: "Ombros", type: "Isolado" },
  // Quadríceps
  { name: "Hack Squat", muscle: "Quadríceps", type: "Composto" },
  { name: "Leg Press", muscle: "Quadríceps", type: "Composto" },
  { name: "Agachamento Pêndulo", muscle: "Quadríceps", type: "Composto" },
  { name: "Agachamento Livre", muscle: "Quadríceps", type: "Composto" },
  { name: "Cadeira Extensora", muscle: "Quadríceps", type: "Isolado" },
  // Glúteo
  { name: "Elevação Pélvica", muscle: "Glúteo", type: "Isolado" },
  { name: "Agachamento Sumô", muscle: "Glúteo", type: "Composto" },
  { name: "Cadeira Abdutora", muscle: "Glúteo", type: "Isolado" },
  // Posterior
  { name: "Mesa Flexora", muscle: "Posterior", type: "Isolado" },
  { name: "Cadeira Flexora", muscle: "Posterior", type: "Isolado" },
  { name: "Stiff", muscle: "Posterior", type: "Composto" },
  // Panturrilha
  { name: "Panturrilha em Pé", muscle: "Panturrilha", type: "Isolado" },
  { name: "Panturrilha Sentado", muscle: "Panturrilha", type: "Isolado" },
  // Core & Others
  { name: "Prancha", muscle: "Core", type: "Isolado" },
  { name: "Abdominal Supra", muscle: "Core", type: "Isolado" }
];
