CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS cinema_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE auth_db;

CREATE TABLE User (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

USE cinema_db;

CREATE TABLE Movie (
    movie_id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    poster_url VARCHAR(500),
    genre VARCHAR(100),
    description TEXT,
    duration INT NOT NULL COMMENT 'Thời lượng tính bằng phút',
    release_date DATE,
    status TINYINT DEFAULT 0 COMMENT '1: Đang chiếu, 0: Sắp chiếu, -1: Ngừng chiếu'
);

INSERT INTO Movie (title, poster_url, genre, description, duration, release_date, status)
VALUES
    ('Inception', 'https://upload.wikimedia.org/wikipedia/vi/1/11/Inception_poster_1.jpg', 'Sci-Fi, Action', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 148, '2026-07-16', 0),
    ('The Shawshank Redemption', 'https://upload.wikimedia.org/wikipedia/vi/8/81/ShawshankRedemptionMoviePoster.jpg', 'Drama', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 142, '2026-03-23', 1),
    ('The Dark Knight', 'https://upload.wikimedia.org/wikipedia/vi/2/2d/Poster_phim_K%E1%BB%B5_s%C4%A9_b%C3%B3ng_%C4%91%C3%AAm_2008.jpg', 'Action, Crime, Drama', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 152, '2026-07-18', 0),
    ('Pulp Fiction', 'https://upload.wikimedia.org/wikipedia/en/3/3b/Pulp_Fiction_%281994%29_poster.jpg', 'Crime, Drama', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 154, '2026-03-14', 1),
    ('The Godfather', 'https://upload.wikimedia.org/wikipedia/en/1/1c/Godfather_ver1.jpg', 'Crime, Drama', 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', 175, '2026-03-24', 1),
    ('Fight Club', 'https://upload.wikimedia.org/wikipedia/en/f/fc/Fight_Club_poster.jpg', 'Drama', 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.', 139, '2026-10-15', 0),
    ('The Matrix', 'https://upload.wikimedia.org/wikipedia/en/d/db/The_Matrix.png', 'Sci-Fi, Action', 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.', 136, '2026-03-21',1),
    ('Forrest Gump', 'https://upload.wikimedia.org/wikipedia/en/6/67/Forrest_Gump_poster.jpg', 'Drama, Romance', 'The presidencies of Kennedy and Johnson, the events of Vietnam, Watergate, and other historical events unfold through the perspective of an Alabama man with an IQ of 75, whose only desire is to be reunited with his childhood sweetheart.', 142, '2026-07-06', 0);

SELECT * FROM Movie;

CREATE TABLE Room (
    room_id INT AUTO_INCREMENT PRIMARY KEY,
    room_name VARCHAR(100) NOT NULL
);

SELECT * FROM Room;

INSERT INTO Room (room_name) VALUES 
('Room01'), ('Room02'), ('Room03'), ('Room04'), ('Room05');

CREATE TABLE Seat (
    seat_id INT AUTO_INCREMENT PRIMARY KEY,
    room_id INT NOT NULL,
    row_index VARCHAR(5) NOT NULL COMMENT 'Hàng ngang (VD: A, B, C)',
    col_index INT NOT NULL COMMENT 'Hàng dọc (VD: 1, 2, 3)',
    UNIQUE KEY unique_seat (room_id, row_index, col_index),
    CONSTRAINT fk_seat_room FOREIGN KEY (room_id) REFERENCES Room(room_id) ON DELETE CASCADE
);



INSERT INTO Seat (room_id, row_index, col_index)
SELECT 
    t.room_id, 
    CHAR(64 + t.row_num) AS row_index, -- 65 là 'A', 66 là 'B'... 74 là 'J'
    t.col_num AS col_index
FROM (
    SELECT 
        r.room_id, 
        s.row_num, 
        c.col_num
    FROM 
        (SELECT room_id FROM Room) r,
        (SELECT 1 as row_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
         UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) s,
        (SELECT 1 as col_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 
         UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10) c
) t;

SELECT * FROM Seat;

CREATE TABLE Showtime (
    showtime_id INT AUTO_INCREMENT PRIMARY KEY,
    movie_id INT NOT NULL,
    show_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL COMMENT 'Có thể tính từ duration + start_time',
    room_id INT NOT NULL,
    CONSTRAINT fk_showtime_movie FOREIGN KEY (movie_id) REFERENCES Movie(movie_id),
    CONSTRAINT fk_showtime_room FOREIGN KEY (room_id) REFERENCES Room(room_id)
);



INSERT INTO Showtime (movie_id, show_date, start_time, end_time, room_id) VALUES
(2, '2026-03-24', '10:00:00', '12:00:00', 1),
(4, '2026-03-24', '13:00:00', '15:00:00', 1),
(5, '2026-03-24', '16:00:00', '18:00:00', 1),
(7, '2026-03-24', '19:00:00', '21:00:00', 1);

SELECT * FROM Showtime;

CREATE TABLE TemporarySeatLock (
    lock_id INT AUTO_INCREMENT PRIMARY KEY,
    showtime_id INT NOT NULL,
    seat_code VARCHAR(10) NOT NULL,
    user_id INT NOT NULL COMMENT 'Tham chiếu từ Auth DB, không đặt FK vật lý',
    locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL COMMENT 'VD: 10 phút kể từ khi chọn',
    status TINYINT DEFAULT 1 COMMENT '1: Đang khóa, 0: Đã hủy/Đã đặt',
    CONSTRAINT fk_lock_showtime FOREIGN KEY (showtime_id) REFERENCES Showtime(showtime_id)
);

USE order_db;

CREATE TABLE Booking (
    booking_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL COMMENT 'Tham chiếu từ Auth DB, không đặt FK vật lý',
    showtime_id INT NOT NULL COMMENT 'Tham chiếu từ Cinema DB, không đặt FK vật lý',
    total_amount DECIMAL(10, 2) NOT NULL COMMENT 'Tổng tiền tạm tính / cuối cùng',
    status TINYINT DEFAULT 0 COMMENT '0: Đang chờ thanh toán, 1: Thành công, -1: Hết hạn/Thất bại',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Tạo INDEX để tăng tốc độ truy vấn theo user hoặc showtime
    INDEX idx_user_booking (user_id),
    INDEX idx_showtime_booking (showtime_id)
);

CREATE TABLE BookingDetail (
    detail_id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    seat_code VARCHAR(10) NOT NULL COMMENT 'Mã ghế (VD: A1, B5)',
    seat_price DECIMAL(10, 2) NOT NULL COMMENT 'Giá vé tại thời điểm đặt để chống trượt giá',
    CONSTRAINT fk_detail_booking FOREIGN KEY (booking_id) REFERENCES Booking(booking_id) ON DELETE CASCADE
);




