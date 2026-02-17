export type TrainingType = 'formation' | 'examen';

export interface Training {
  id: string | number;
  title: string;
  startDate: string;
  endDate?: string;
  type: TrainingType;
}

export interface TrainingCalendarProps {
  trainings: Training[];
  onTrainingPress?: (training: Training) => void;
}
