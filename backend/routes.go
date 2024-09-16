package main

import (
	"net/http"

	"github.com/gorilla/mux"
)

func NewRouter() *mux.Router {
	router := mux.NewRouter()
	router.HandleFunc("/register", RegisterHandler).Methods("POST")
	router.HandleFunc("/login", LoginHandler).Methods("POST")
	router.HandleFunc("/checkPhone", CheckPhoneHandler).Methods("POST")
	router.Handle("/chat", AuthMiddleware(http.HandlerFunc(ChatHandler))).Methods("POST")
	router.Handle("/messages", AuthMiddleware(http.HandlerFunc(GetMessagesHandler))).Methods("GET")
	router.Handle("/upload", AuthMiddleware(http.HandlerFunc(FileUploadHandler))).Methods("POST")
	router.Handle("/updateUser", AuthMiddleware(http.HandlerFunc(UpdateUserHandler))).Methods("PUT")
	router.Handle("/user", AuthMiddleware(http.HandlerFunc(GetUserHandler))).Methods("GET")

	return router
}
