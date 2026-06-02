CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS cinema_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE auth_db;

CREATE TABLE IF NOT EXISTS User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE cinema_db;

CREATE TABLE IF NOT EXISTS Movie (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    poster_url VARCHAR(500),
    genre VARCHAR(100),
    description TEXT,
    duration INT NOT NULL,
    release_date DATE,
    status TINYINT DEFAULT 0
);

INSERT INTO Movie (movie_id, title, poster_url, genre, description, duration, release_date, status)
VALUES
    (1, 'Inception', 'https://upload.wikimedia.org/wikipedia/vi/1/11/Inception_poster_1.jpg', 'Sci-Fi, Action', 'A thief who steals corporate secrets through dream-sharing technology.', 148, '2026-07-16', 0),
    (2, 'The Shawshank Redemption', 'https://upload.wikimedia.org/wikipedia/vi/8/81/ShawshankRedemptionMoviePoster.jpg', 'Drama', 'Two imprisoned men bond over a number of years.', 142, '2026-03-23', 1),
    (3, 'The Dark Knight', 'https://upload.wikimedia.org/wikipedia/vi/2/2d/Poster_phim_K%E1%BB%B5_s%C4%A9_b%C3%B3ng_%C4%91%C3%AAm_2008.jpg', 'Action, Crime, Drama', 'Batman faces the Joker in Gotham.', 152, '2026-07-18', 0),
    (4, 'Pulp Fiction', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg', 'Crime, Drama', 'Intertwined stories of crime and redemption.', 154, '2026-03-14', 1),
    (5, 'The Godfather', 'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg', 'Crime, Drama', 'An organized crime dynasty transfers power.', 175, '2026-03-24', 1),
    (6, 'Fight Club', 'https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg', 'Drama', 'An office worker forms an underground fight club.', 139, '2026-10-15', 0),
    (7, 'The Matrix', 'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png', 'Sci-Fi, Action', 'A hacker learns the truth about reality.', 136, '2026-03-21', 1),
    (8, 'Forrest Gump', 'https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg', 'Drama, Romance', 'A life story across historic events.', 142, '2026-07-06', 0)
ON DUPLICATE KEY UPDATE title = VALUES(title);

CREATE TABLE IF NOT EXISTS Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL
);

INSERT INTO Room (room_id, room_name) VALUES
    (1, 'Room01'), (2, 'Room02'), (3, 'Room03'), (4, 'Room04'), (5, 'Room05')
ON DUPLICATE KEY UPDATE room_name = VALUES(room_name);

CREATE TABLE IF NOT EXISTS Seat (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    row_index VARCHAR(5) NOT NULL,
    col_index INT NOT NULL,
    UNIQUE KEY unique_seat (room_id, row_index, col_index),
    CONSTRAINT fk_seat_room FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE CASCADE
);

INSERT IGNORE INTO Seat (room_id, row_index, col_index)
SELECT r.room_id, CHAR(64 + rows.row_num), cols.col_num
FROM Room r
CROSS JOIN (SELECT 1 row_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) rows
CROSS JOIN (SELECT 1 col_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) cols;

CREATE TABLE IF NOT EXISTS Showtime (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_id INT NOT NULL,
    CONSTRAINT fk_showtime_movie FOREIGN KEY (movie_id) REFERENCES Movie(movie_id),
    CONSTRAINT fk_showtime_room FOREIGN KEY (room_id) REFERENCES Room(room_id)
);

INSERT INTO Showtime (showtime_id, movie_id, show_date, start_time, end_time, room_id) VALUES
    (1, 5, '2026-03-24', '10:00:00', '12:30:00', 1),
    (2, 5, '2026-03-24', '14:00:00', '16:30:00', 1),
    (3, 5, '2026-03-24', '16:00:00', '18:30:00', 1),
    (4, 2, '2026-03-24', '11:00:00', '13:30:00', 2),
    (5, 2, '2026-03-24', '15:00:00', '17:30:00', 2),
    (6, 2, '2026-03-24', '19:00:00', '21:30:00', 2),
    (7, 4, '2026-03-24', '10:30:00', '13:00:00', 3),
    (8, 4, '2026-03-24', '16:30:00', '19:00:00', 3),
    (9, 7, '2026-03-24', '12:00:00', '14:30:00', 4),
    (10, 7, '2026-03-24', '17:00:00', '19:30:00', 4),
    (11, 7, '2026-03-24', '20:00:00', '22:30:00', 4)
ON DUPLICATE KEY UPDATE movie_id = VALUES(movie_id);

CREATE TABLE IF NOT EXISTS TemporarySeatLock (
    lock_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_code VARCHAR(10) NOT NULL,
    user_id INT NOT NULL,
    locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    status TINYINT DEFAULT 1,
    CONSTRAINT fk_lock_showtime FOREIGN KEY (showtime_id) REFERENCES Showtime(showtime_id)
);

USE order_db;

CREATE TABLE IF NOT EXISTS Booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    showtime_id INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status TINYINT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_booking (user_id),
    INDEX idx_showtime_booking (showtime_id)
);

CREATE TABLE IF NOT EXISTS BookingDetail (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_code VARCHAR(10) NOT NULL,
    seat_price DECIMAL(10, 2) NOT NULL,
    CONSTRAINT fk_detail_booking FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE
);
