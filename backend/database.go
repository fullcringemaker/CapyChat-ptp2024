package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB() *sql.DB {
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", dbHost, dbPort, dbUser, dbPassword, dbName)

	var err error
	for i := 0; i < 10; i++ {
		db, err = sql.Open("postgres", connStr)
		if err != nil {
			log.Printf("Attempt %d: could not connect to the database: %v", i+1, err)
			time.Sleep(2 * time.Second)
			continue
		}

		if err := db.Ping(); err != nil {
			log.Printf("Attempt %d: could not ping the database: %v", i+1, err)
			time.Sleep(2 * time.Second)
			continue
		}

		log.Println("Successfully connected to the database")
		return db
	}

	log.Fatalf("Could not connect to the database after 10 attempts: %v", err)
	return nil
}
