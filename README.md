### 1. Настройка

```bash
# Backend
cd backend
cp .env.example .env
nano .env  # укажите API ключи

# Firebase
# Скачайте firebase-credentials.json из Firebase Console
# (Project Settings → Service Accounts → Generate new private key)
mv ~/Downloads/firebase-credentials.json .

# Настройте каналы
nano config.yaml
```

### 2. Запуск

**Быстрый запуск:**

```bash
./run-backend    # Терминал 1
./run-frontend   # Терминал 2
```

**Ручной запуск:**

```bash
# Backend
cd backend
source venv/bin/activate  # или: ./venv/bin/activate
uvicorn app.web:app --reload --port 8000

# Frontend
cd frontend
npm install
npm start
```

Откроется **http://localhost:3000**

---
