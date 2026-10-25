# Library Management System

A REST API built with Node.js and TypeScript to manage a library's books. It supports creating, viewing, updating, and deleting books, as well as borrowing, returning, and filtering books.

## Features

- View all books and retrieve a book by ID
- Add new books
- Delete books
- Return books
- Filter books using query parameters
- Store book data in a JSON file

## Technologies Used

- Node.js
- TypeScript
- HTTP REST API
- JSON file storage

## Prerequisites

Install Node.js and npm before running the project.

Check the installation:

```bash
node -v
npm -v
```

## Installation and Setup

1. Clone the repository:

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
```

2. Open the project folder:

```bash
cd YOUR_PROJECT_FOLDER
```

3. Install dependencies:

```bash
npm install
```

4. Build the TypeScript project, if a build script is configured:

```bash
npm run build
```

5. Start the server using the script configured in `package.json`:

```bash
npm start
```

The example API base URL is:

`http://localhost:3000`


```

### Add a Book

```http
POST http://localhost:3000/books
Content-Type: application/json
```

Example request body (adjust fields to match your model):

```json
{
  "title": "The Alchemist",
  "author": "Paulo Coelho"
}
```


## Testing

Use a browser for GET requests or Postman for testing GET, POST, PATCH, and DELETE requests.

Verify that borrowing, returning, and filtering produce the expected results.

## Project Structure

```text
NodeProject/
│
├── data/
│   └── books.json
│
├── public/
│   └── index.html
│
├── src/
│   ├── models.ts
│   ├── storage.ts
│   ├── server.ts
│   └── index.ts
│
├── dist/
│   ├── models.js
│   ├── storage.js
│   ├── server.js
│   └── index.js
│
├── node_modules/
│
├── package.json
├── package-lock.json
├── tsconfig.json
└── .gitignore
```
