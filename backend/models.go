package main

import (
	"database/sql"
	"errors"
	"log"
	"strconv"
)

type User struct {
	ID       int    `json:"id"`
	Surname  string `json:"surname"`
	Name     string `json:"name"`
	NickName string `json:"nickname"`
	Password string `json:"password"`
	Phone    string `json:"phone"`
}

type Credentials struct {
	NickName string `json:"nickname"`
	Password string `json:"password"`
}

type Message struct {
	ID       int    `json:"id"`
	UserID   int    `json:"user_id"`
	Content  string `json:"content"`
	DateTime string `json:"datetime"`
}

func (u *User) Create() error {
	hashedPassword, err := HashPassword(u.Password)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		return err
	}

	log.Printf("Inserting user into database: %+v", u)
	_, err = db.Exec("INSERT INTO users (surname, name, nickname, password, phone) VALUES ($1, $2, $3, $4, $5)", u.Surname, u.Name, u.NickName, hashedPassword, u.Phone)
	if err != nil {
		log.Printf("Error executing insert: %v", err)
		return err
	}
	return nil
}

func Authenticate(creds Credentials) (*User, error) {
	var user User
	row := db.QueryRow("SELECT id, surname, name, nickname, password, phone FROM users WHERE nickname = $1", creds.NickName)
	if err := row.Scan(&user.ID, &user.Surname, &user.Name, &user.NickName, &user.Password, &user.Phone); err != nil {
		if err == sql.ErrNoRows {
			return nil, errors.New("user not found")
		}
		return nil, err
	}

	if err := CheckPasswordHash(creds.Password, user.Password); err != nil {
		return nil, errors.New("invalid credentials")
	}

	return &user, nil
}

func (m *Message) Save() error {
	_, err := db.Exec("INSERT INTO messages (user_id, content, datetime) VALUES ($1, $2, $3)", m.UserID, m.Content, m.DateTime)
	return err
}

// Update method for User struct
func (u *User) Update() error {
	query := "UPDATE users SET "
	args := []interface{}{}
	argCount := 1

	if u.Surname != "" {
		query += "surname = $" + strconv.Itoa(argCount) + ", "
		args = append(args, u.Surname)
		argCount++
	}
	if u.Name != "" {
		query += "name = $" + strconv.Itoa(argCount) + ", "
		args = append(args, u.Name)
		argCount++
	}
	if u.NickName != "" {
		query += "nickname = $" + strconv.Itoa(argCount) + ", "
		args = append(args, u.NickName)
		argCount++
	}
	if u.Phone != "" {
		query += "phone = $" + strconv.Itoa(argCount) + ", "
		args = append(args, u.Phone)
		argCount++
	}

	query = query[:len(query)-2] + " WHERE id = $" + strconv.Itoa(argCount)
	args = append(args, u.ID)

	_, err := db.Exec(query, args...)
	if err != nil {
		log.Printf("Error updating user in database: %v", err)
		return err
	}
	return nil
}
