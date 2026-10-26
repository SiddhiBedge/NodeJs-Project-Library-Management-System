import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Book } from "./models.js";

// cwd: Current working directory
const filePath = path.join(process.cwd(), "data", "books.json");

export async function readBooks(): Promise<Book[]> {
  const data = await readFile(filePath, "utf-8");
  return JSON.parse(data) as Book[]; // converts a JSON string -> JavaScript object
}

export async function saveBooks(books: Book[]): Promise<void> {
  await writeFile(filePath, JSON.stringify(books, null, 2)); // converts a JSON object -> JavaScript string
}
