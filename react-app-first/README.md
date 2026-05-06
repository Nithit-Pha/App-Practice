# React App First — Healthy Habits Demo

A small full-stack React + Vite + Express + SQLite project. The frontend is a
"Want to be healthy?" landing page with **Exercise** and **Food** sub-pages,
plus auth (Login / Sign Up) protected by a CAPTCHA.

---

## Project structure

```
react-app-first/
├── src/                # React frontend (Vite)
├── my-api/             # Express + SQLite backend (port 5000)
└── ../database/        # SQLite database + schema (created on first run)
```

The frontend runs on `http://localhost:5173` (Vite default) and talks to the
backend on `http://localhost:5000`.

---

## Prerequisites

- **Node.js** 18+ (check with `node -v`)
- **npm** 9+ (comes with Node) or any equivalent (pnpm / yarn)
- A terminal — PowerShell, Command Prompt, Git Bash, or any shell

---

## How to open & run the project from the terminal

You'll need **two terminals**: one for the backend, one for the frontend.

### 1. Open the project folder

```bash
cd E:\app\demo1\App-Demo1\react-app-first
```

> On macOS / Linux replace the path with wherever you cloned the repo, e.g.
> `cd ~/projects/react-app-first`.

### 2. Install dependencies (first time only)

Frontend:

```bash
npm install
```

Backend:

```bash
cd my-api
npm install
cd ..
```

### 3. Start the backend (Terminal #1)

```bash
cd my-api
npm start
```

You should see:

```
Server running on http://localhost:5000
```

Leave this terminal running.

### 4. Start the frontend (Terminal #2)

Open a **new** terminal window in the project root and run:

```bash
npm run dev
```

Vite will print something like:

```
  VITE v8.x.x  ready in 400 ms
  ➜  Local:   http://localhost:5173/
```

Open that URL in your browser. The app is now live.

---

## Available scripts

### Frontend (`react-app-first/`)

| Command          | What it does                                    |
| ---------------- | ----------------------------------------------- |
| `npm run dev`    | Start the Vite dev server with hot reload       |
| `npm run build`  | Build the production bundle into `dist/`        |
| `npm run preview`| Preview the production build locally            |
| `npm run lint`   | Run ESLint over the source                      |

### Backend (`react-app-first/my-api/`)

| Command       | What it does                          |
| ------------- | ------------------------------------- |
| `npm start`   | Start the Express API on port 5000    |

---

## Routes

| Path         | Page                                       |
| ------------ | ------------------------------------------ |
| `/`          | Home — "Want to be healthy?" landing       |
| `/exercise`  | Exercise plan                              |
| `/food`      | Food / calorie tracking                    |
| `/about`     | About                                      |
| `/contact`   | Contact                                    |
| `/login`     | Log in (CAPTCHA required)                  |
| `/signup`    | Sign up (CAPTCHA required)                 |

## API endpoints

| Method | Path              | Description                         |
| ------ | ----------------- | ----------------------------------- |
| POST   | `/api/signup`     | Create a new user (role hardcoded)  |
| POST   | `/api/login`      | Log in with email + password        |
| GET    | `/api/users`      | List users (debug helper)           |
| GET    | `/api/activities` | Get demo activities                 |
| PUT    | `/api/activities/:id` | Update activity status          |

---

## Stopping the servers

In each terminal, press **Ctrl + C** to stop the running process.

## Troubleshooting

- **"Could not reach the server"** on Login/Signup → make sure the backend
  terminal is still running on port 5000.
- **Port 5000 already in use** → another process owns it. Either stop that
  process or change `PORT` in `my-api/server.js`.
- **`better-sqlite3` install fails** → it needs build tools. On Windows run
  `npm install --global windows-build-tools` once, or install the prebuilt
  binary by re-running `npm install` after upgrading Node.
- **Port 5173 already in use** → Vite will offer to use the next free port;
  just press `y`.
