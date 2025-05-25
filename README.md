# 🛠️ HLLC CLI

A lightweight CLI for managing local development tasks across a fullstack monorepo, including NestJS, Go services, Next.js, Expo, and Docker.

## 📦 Project Structure

```
📦 HLLC Monorepo
├── backend/
│   ├── app/         # NestJS API
│   └── chat/        # Go WebSocket Server
├── frontend/
│   ├── admin/       # Next.js Admin Panel
│   └── student/     # Expo React Native App
├── docker-compose.yml  # Redis and other services
├── scripts/
│   ├── hllc.js       # CLI Entry
│   └── commands/
│       ├── dev.js    # hllc dev
│       ├── install.js # hllc install
│       └── upgrade.js # hllc upgrade (optional)
```

---

## 📦 Installation

### 1. Clone this repo (or download it)
```bash
git clone https://github.com/HLLC-MFU/HLLC-2025
cd HLLC-2025
```


### 2. Install Workspace Dependency
```bash
pnpm i
```

### 3. Link the CLI globally
```bash
npm i -g .
# or
pnpm link --global
```

---

## 🚀 Usage
### Install dependencies

```bash
hllc install
```

- Installs dependencies for:
  - `backend/app` (pnpm)
  - `backend/chat` (go mod tidy)
  - `frontend/admin` (pnpm)
  - `frontend/student` (pnpm)
- Also runs:
  ```bash
  docker-compose up -d redis
  ```

### Start a service

```bash
hllc dev
```

> Choose **one** service to run in the same terminal:
- `Docker Compose`
- `NestJS Backend`
- `Go Chat Server`
- `Next.js Admin Frontend`
- `Expo Student App`


### (Optional) Upgrade all dependencies except Tailwind CSS

```bash
npx npm-check-updates -u --reject tailwindcss --workspace && pnpm install
```

You can also add this as a future command:
```bash
hllc upgrade
```

---

## 🧾 License

MIT © 2025 How to Live and Learn On Campus
