
export interface Problem {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  link: string;
  isCompleted: boolean;
}

export interface Flashcard {
  id: string;
  categoryId: string;
  question: string;
  answer: string;
  answerImage?: string; // Base64 encoded image string
  answerPdf?: string;   // Base64 encoded PDF string
  isFlipped?: boolean;
}

export interface Category {
  id: string;
  name: string;
  problems?: Problem[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
