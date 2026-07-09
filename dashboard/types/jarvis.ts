export interface Position {
  x: number;
  y: number;
}

export interface Dialogue {
  sender: "user" | "jarvis";
  text: string;
  timestamp: string;
}

export interface NewsArticle {
  id: string;
  category: string;
  time: string;
  title: string;
  content: string;
}
