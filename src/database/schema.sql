-- OLD SCHEMA NOT IN USE OR UPDATED IN FOREVER
-- Users Table
CREATE TABLE Users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

-- Heroes Table
CREATE TABLE Heroes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    role ENUM('Tank', 'DPS', 'Support') NOT NULL,
    image_url VARCHAR(255) NOT NULL
);

-- Items Table
CREATE TABLE Items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category ENUM('Weapon', 'Ability', 'Survival') NOT NULL,
    description TEXT NOT NULL,
    cost INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Powers Table
CREATE TABLE Powers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Builds Table
CREATE TABLE Builds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    hero_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(id),
    FOREIGN KEY (hero_id) REFERENCES Heroes(id)
);

-- Rounds Table
CREATE TABLE Rounds (
    id INT AUTO_INCREMENT PRIMARY KEY,
    build_id INT NOT NULL,
    round_number INT NOT NULL CHECK (round_number BETWEEN 1 AND 7),
    explanation TEXT NOT NULL,
    FOREIGN KEY (build_id) REFERENCES Builds(id) ON DELETE CASCADE
);

-- RoundItems Table (Many-to-Many relationship between Rounds and Items)
CREATE TABLE RoundItems (
    round_id INT NOT NULL,
    item_id INT NOT NULL,
    PRIMARY KEY (round_id, item_id),
    FOREIGN KEY (round_id) REFERENCES Rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES Items(id) ON DELETE CASCADE
);

-- RoundPowers Table (Many-to-Many relationship between Rounds and Powers)
CREATE TABLE RoundPowers (
    round_id INT NOT NULL,
    power_id INT NOT NULL,
    PRIMARY KEY (round_id, power_id),
    FOREIGN KEY (round_id) REFERENCES Rounds(id) ON DELETE CASCADE,
    FOREIGN KEY (power_id) REFERENCES Powers(id) ON DELETE CASCADE
);

-- SavedBuilds Table (Many-to-Many relationship between Users and Builds)
CREATE TABLE SavedBuilds (
    user_id INT NOT NULL,
    build_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, build_id),
    FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
    FOREIGN KEY (build_id) REFERENCES Builds(id) ON DELETE CASCADE
);

-- Insert default admin user (password: admin123)
INSERT INTO Users (username, email, password, is_admin)
VALUES ('admin', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', TRUE);

-- Insert sample heroes
INSERT INTO Heroes (name, role, image_url) VALUES
('Reinhardt', 'Tank', '/heroes/reinhardt.png'),
('D.Va', 'Tank', '/heroes/dva.png'),
('Tracer', 'DPS', '/heroes/tracer.png'),
('Genji', 'DPS', '/heroes/genji.png'),
('Mercy', 'Support', '/heroes/mercy.png'),
('Lucio', 'Support', '/heroes/lucio.png');

-- Insert sample items
INSERT INTO Items (name, category, description, cost) VALUES
('Pulse Rifle', 'Weapon', 'Standard issue rifle with good accuracy', 100),
('Rocket Launcher', 'Weapon', 'Deals explosive area damage', 300),
('Sniper Rifle', 'Weapon', 'High damage long-range weapon', 250),
('Healing Dart', 'Ability', 'Heals teammates from a distance', 150),
('Biotic Field', 'Ability', 'Creates a healing field for allies', 200),
('Barrier Shield', 'Ability', 'Creates a protective barrier', 250),
('Shield Generator', 'Survival', 'Creates a protective shield around the user', 200),
('Armor Pack', 'Survival', 'Provides temporary armor boost', 150),
('Health Pack', 'Survival', 'Instantly restores health', 100);

-- Insert sample powers
INSERT INTO Powers (name, description) VALUES
('Speed Boost', 'Increases movement speed by 30%'),
('Health Regeneration', 'Regenerates 10 health per second'),
('Damage Boost', 'Increases damage dealt by 20%'),
('Ultimate Charge', 'Ultimate charge rate increased by 15%');
