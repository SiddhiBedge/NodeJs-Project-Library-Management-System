export type BookStatus = "available" | "borrowed";

export interface Book {
  id: number;
  title: string;
  author: string;
  category: string;
  publicationYear: number;
  status: BookStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookInput {
  title: string;
  author: string;
  category: string;
  publicationYear: number;
}
