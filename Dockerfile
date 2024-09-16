FROM golang:1.18-alpine

# Установка необходимых пакетов
RUN apk add --no-cache git curl

# Установка рабочей директории
WORKDIR /app

# Копирование зависимостей Go
COPY backend/go.mod backend/go.sum ./
RUN go mod download

# Копирование всех файлов проекта
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Сборка Go-приложения
WORKDIR /app/backend
RUN go build -o /app/main .

# Указываем директорию для статических файлов
WORKDIR /app

# Установка порта по умолчанию
EXPOSE 8080

# Команда для запуска приложения
CMD ["/app/main"]
