import { createServer } from "node:http";
import type { Book, CreateBookInput } from "./models.js";
import { readBooks, saveBooks } from "./storage.js";

const server = createServer(async (req, res) => {
  const url = new URL(
    req.url ?? "/",
    `http://${req.headers.host ?? "localhost"}`
  );

  const path = url.pathname;
  const method = req.method ?? "GET";

  function send(status: number, data: unknown): void {
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // Challenge: All website origin can allow to use your browser
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });

    res.end(JSON.stringify(data));
  }

  if (method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    });
    res.end();
    return;
  }

  async function getBody(): Promise<unknown> {
    let body = "";

    for await (const chunk of req) {
      body += chunk.toString();
    }

    return JSON.parse(body);
  }

  // Check the server status
  if (method === "GET" && path === "/health") {
    send(200, { message: "Library server is running" });
    return;
  }

  let books: Book[];

  try {
    books = await readBooks();
  } catch (error: unknown) {
    console.error("File reading error:", error);
    send(500, { error: "Unable to read books.json" });
    return;
  }

  async function saveFile(): Promise<boolean> {
    try {
      await saveBooks(books);
      return true;
    } catch (error: unknown) {
      console.error("File saving error:", error);
      send(500, { error: "Unable to save books.json" });
      return false;
    }
  }

  // GET /books : To get all books 
  if (method === "GET" && path === "/books") {
    send(200, books);
    return;
  }

  // POST /books
  if (method === "POST" && path === "/books") {
    let body: unknown;

    try {
      body = await getBody();
    } catch {
      send(400, { error: "Invalid JSON body" });
      return;
    }
    
    // Challenge : If we don't specify typeOf body it unables to add the data 
    if (
      typeof body !== "object" ||
      body === null ||
      !("title" in body) ||
      !("author" in body) ||
      !("category" in body) ||
      !("publicationYear" in body) ||
      typeof body.title !== "string" ||
      !body.title.trim() ||
      typeof body.author !== "string" ||
      !body.author.trim() ||
      typeof body.category !== "string" ||
      !body.category.trim() ||
      typeof body.publicationYear !== "number" ||
      !Number.isInteger(body.publicationYear) ||
      body.publicationYear < 1 ||
      body.publicationYear > 2100
    ) {
      send(400, {
        error: "Provide a valid title, author, category, and publication year"
      });
      return;
    }

    const data: CreateBookInput = {
      title: body.title.trim(),
      author: body.author.trim(),
      category: body.category.trim(),
      publicationYear: body.publicationYear
    };

    const nextId = books.length === 0 ? 1 : Math.max(...books.map((book) => book.id)) + 1;

    const now = new Date().toISOString();

    const book: Book = {
      id: nextId,
      title: data.title,
      author: data.author,
      category: data.category,
      publicationYear: data.publicationYear,
      status: "available",
      createdAt: now,
      updatedAt: now
    };

    books.push(book);

    if (!(await saveFile())) return;

    send(201, book);
    return;
  }

  // Match /books/:id and /books/:id/borrow /return
  // Challenge: We have to convert id to number. fromramdomUUID convert to numbers like 1,2,3,..
  const match = path.match(/^\/books\/([^/]+)$/);
  const action = path.match(/^\/books\/([^/]+)\/(borrow|return)$/);
  const id = match?.[1] ?? action?.[1];

  if (!id) {
    send(404, { error: "Route not found" });
    return;
  }

  const bookId = Number(id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    send(400, { error: "Invalid book ID" });
    return;
  }

  const book = books.find((item) => item.id === bookId);

  if (!book) {
    send(404, { error: "Book not found" });
    return;
  }

  // GET /books/:id
  if (method === "GET" && match) {
    send(200, book);
    return;
  }

  // PATCH /books/:id
  if (method === "PATCH" && match) {
    let body: unknown;

    try {
      body = await getBody();
    } catch {
      send(400, { error: "Invalid JSON body" });
      return;
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      send(400, { error: "Request body must be an object" });
      return;
    }

    const data = body as Record<string, unknown>;
    const allowed = ["title", "author", "category", "publicationYear"];
    const keys = Object.keys(data);

    if (!keys.length || keys.some((key) => !allowed.includes(key))) {
      send(400, { error: "Invalid fields to update" });
      return;
    }

    if (
      ("title" in data &&
        (typeof data.title !== "string" || !data.title.trim())) ||
      ("author" in data &&
        (typeof data.author !== "string" || !data.author.trim())) ||
      ("category" in data &&
        (typeof data.category !== "string" || !data.category.trim())) ||
      ("publicationYear" in data &&
        (typeof data.publicationYear !== "number" ||
          !Number.isInteger(data.publicationYear) ||
          data.publicationYear < 1 ||
          data.publicationYear > 2100))
    ) {
      send(400, { error: "Invalid field values" });
      return;
    }

    if (typeof data.title === "string") {
      book.title = data.title.trim();
    }

    if (typeof data.author === "string") {
      book.author = data.author.trim();
    }

    if (typeof data.category === "string") {
      book.category = data.category.trim();
    }

    if (typeof data.publicationYear === "number") {
      book.publicationYear = data.publicationYear;
    }

    book.updatedAt = new Date().toISOString();

    if (!(await saveFile())) return;

    send(200, book);
    return;
  }

  // DELETE /books/:id
  if (method === "DELETE" && match) {
    if (book.status === "borrowed") {
      send(409, { error: "Cannot delete a borrowed book" });
      return;
    }

    const index = books.findIndex((item) => item.id === bookId);

    if (index === -1) {
      send(404, { error: "Book not found" });
      return;
    }

    books.splice(index, 1); // Give remaining files

    if (!(await saveFile())) return;

    send(200, { message: "Book deleted", book });
    return;
  }

  // POST /books/:id/borrow or /books/:id/return
  if (method === "POST" && action) {
    const operation = action[2];

    if (operation === "borrow") {
      if (book.status === "borrowed") {
        send(409, { error: "Book is already borrowed" });
        return;
      }

      book.status = "borrowed";
    } else {
      if (book.status !== "borrowed") {
        send(409, { error: "Book is not currently borrowed" });
        return;
      }

      book.status = "available";
    }

    book.updatedAt = new Date().toISOString();

    if (!(await saveFile())) return;

    send(200, book);
    return;
  }

  send(404, { error: "Route not found" });
});

export default server;
