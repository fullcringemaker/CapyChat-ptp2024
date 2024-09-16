package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/dgrijalva/jwt-go"
)

func UpdateUserHandler(w http.ResponseWriter, r *http.Request) {
	var updateData map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	claims, _ := r.Context().Value(claimsKey).(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))

	// Create a User object and set the ID
	user := &User{ID: userID}

	// Update the User object based on the received data
	if surname, ok := updateData["surname"].(string); ok {
		user.Surname = surname
	}
	if name, ok := updateData["name"].(string); ok {
		user.Name = name
	}
	if nickname, ok := updateData["nickname"].(string); ok {
		user.NickName = nickname
	}
	if phone, ok := updateData["phone"].(string); ok {
		// Check if the phone number is already in use
		var exists bool
		err := db.QueryRow("SELECT EXISTS (SELECT 1 FROM users WHERE phone = $1 AND id != $2)", phone, userID).Scan(&exists)
		if err != nil {
			log.Printf("Error checking phone in database: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		if exists {
			http.Error(w, "Phone number already in use", http.StatusConflict)
			return
		}
		user.Phone = phone
	}

	if err := user.Update(); err != nil {
		log.Printf("Error updating user: %v", err)
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"success"}`))
}

func GetUserHandler(w http.ResponseWriter, r *http.Request) {
	claims, ok := r.Context().Value(claimsKey).(jwt.MapClaims)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	userID := int(claims["user_id"].(float64))

	// Fetch user data from database
	var user User
	err := db.QueryRow("SELECT surname, name, nickname, phone FROM users WHERE id = $1", userID).Scan(&user.Surname, &user.Name, &user.NickName, &user.Phone)
	if err != nil {
		log.Printf("Error fetching user data: %v", err)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	response, err := json.Marshal(user)
	if err != nil {
		log.Printf("Error marshalling user data: %v", err)
		http.Error(w, "Error processing request", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Received user data: %+v", user)

	if err := user.Create(); err != nil {
		log.Printf("Error creating user: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var userID int
	err := db.QueryRow("SELECT id FROM users WHERE nickname = $1", user.NickName).Scan(&userID)
	if err != nil {
		log.Printf("Error getting new user ID: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("User created with ID: %d", userID)
	log.Printf("User phone: %s", user.Phone)

	creds := Credentials{
		NickName: user.NickName,
		Password: user.Password,
	}

	// Аутентификация для генерации токена
	userAuthenticated, err := Authenticate(creds)
	if err != nil {
		log.Printf("Authentication error after registration: %v", err)
		http.Error(w, "Authentication failed", http.StatusInternalServerError)
		return
	}

	// Генерация JWT токена для нового пользователя
	token, err := GenerateJWT(userAuthenticated)
	if err != nil {
		log.Printf("Error generating token: %v", err)
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	log.Printf("Token generated for user ID: %d", userID)

	// Отправка токена и ID пользователя клиенту
	response := map[string]interface{}{
		"status":  "success",
		"user_id": userID,
		"token":   token,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var creds Credentials
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	user, err := Authenticate(creds)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	token, err := GenerateJWT(user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"token":   token,
		"user_id": user.ID,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func CheckPhoneHandler(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Phone string `json:"phone"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Checking if phone exists: %s", input.Phone)

	var userExists bool
	err := db.QueryRow("SELECT EXISTS(SELECT 1 FROM users WHERE phone=$1)", input.Phone).Scan(&userExists)
	if err != nil {
		log.Printf("Error checking phone existence: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Printf("Phone exists: %t", userExists)

	response := map[string]bool{
		"exists": userExists,
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(response)
	if err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}
 
func ChatHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("Received /chat request")
	var msg Message
	if err := json.NewDecoder(r.Body).Decode(&msg); err != nil {
		log.Printf("Error decoding message: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	claims, _ := r.Context().Value(claimsKey).(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))
	msg.UserID = userID

	msg.DateTime = time.Now().Format(time.RFC3339)
	if err := msg.Save(); err != nil {
		log.Printf("Error saving message: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	log.Println("Message saved successfully")
	w.WriteHeader(http.StatusCreated)
}

func GetMessagesHandler(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT id, user_id, content, datetime FROM messages ORDER BY datetime ASC")
	if err != nil {
		log.Printf("Error querying messages: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		if err := rows.Scan(&msg.ID, &msg.UserID, &msg.Content, &msg.DateTime); err != nil {
			log.Printf("Error scanning message: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		messages = append(messages, msg)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error with rows: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(messages)
	if err != nil {
		log.Printf("Error encoding messages: %v", err)
		http.Error(w, "Error encoding messages", http.StatusInternalServerError)
	}
}

// FileUploadHandler handles the file upload
func FileUploadHandler(w http.ResponseWriter, r *http.Request) {
	log.Println("File upload handler called")

	// Ограничиваем максимальный размер загружаемого файла (например, до 10 MB)
	err := r.ParseMultipartForm(10 << 20)
	if err != nil {
		log.Printf("Error parsing multipart form: %v", err)
		http.Error(w, "Error parsing form", http.StatusBadRequest)
		return
	}

	// Получаем файл из запроса
	file, handler, err := r.FormFile("file")
	if err != nil {
		log.Printf("Error retrieving the file: %v", err)
		http.Error(w, "Error retrieving the file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	log.Printf("Uploaded file: %s, size: %d, MIME header: %v", handler.Filename, handler.Size, handler.Header)

	// Сохраняем файл на сервере
	filePath := fmt.Sprintf("./uploads/%s", handler.Filename)
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("Error creating the file on disk: %v", err)
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	// Копируем содержимое файла в целевой файл на сервере
	_, err = io.Copy(dst, file)
	if err != nil {
		log.Printf("Error copying file content: %v", err)
		http.Error(w, "Error saving the file", http.StatusInternalServerError)
		return
	}

	// Извлечение user_id из контекста
	claims, _ := r.Context().Value(claimsKey).(jwt.MapClaims)
	userID := int(claims["user_id"].(float64))

	// Создаем сообщение с файлом
	message := Message{
		UserID:   userID,
		Content:  fmt.Sprintf("Файл отправлен: %s", filePath), // Сохраняем путь к файлу в содержимом сообщения
		DateTime: time.Now().Format(time.RFC3339),
	}

	// Сохраняем сообщение в базу данных
	err = message.Save()
	if err != nil {
		log.Printf("Error saving message: %v", err)
		http.Error(w, "Error saving message", http.StatusInternalServerError)
		return
	}

	log.Println("File saved successfully and message created")
	err = json.NewEncoder(w).Encode(map[string]string{"filePath": filePath})
	if err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}
