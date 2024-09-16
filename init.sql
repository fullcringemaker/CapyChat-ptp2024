CREATE TABLE IF NOT EXISTS users (
                                     id SERIAL PRIMARY KEY,
                                     surname VARCHAR(50),
                                     name VARCHAR(50),
                                     nickname VARCHAR(50) UNIQUE,
                                     password VARCHAR(100),
                                     phone VARCHAR(20) UNIQUE
);

CREATE TABLE IF NOT EXISTS messages (
                                        id SERIAL PRIMARY KEY,
                                        user_id INTEGER REFERENCES users(id),
                                        content TEXT,
                                        datetime TIMESTAMP
);
