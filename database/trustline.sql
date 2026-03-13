-- Trustline Capital Limited Database Schema
-- Generated for MySQL/MariaDB

CREATE DATABASE IF NOT EXISTS trustline;
USE trustline;

-- Admin Table
CREATE TABLE IF NOT EXISTS admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    min_investment DECIMAL(15, 2),
    expected_return DECIMAL(5, 2),
    duration_months INT,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Uploads Table
CREATE TABLE IF NOT EXISTS uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    path VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed Default Admin
INSERT INTO admin (email, password) VALUES ('admin@trustline.com', 'admin123');

-- Seed Initial Products
INSERT INTO products (title, description, min_investment, expected_return, duration_months, image_url) VALUES 
('Fixed Income Fund', 'Stable returns with low risk. Ideal for conservative investors.', 1000.00, 8.50, 12, 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=800'),
('Equity Growth Fund', 'High growth potential by investing in top-performing stocks.', 5000.00, 15.00, 36, 'https://images.unsplash.com/photo-1611974708602-ac524856505d?auto=format&fit=crop&q=80&w=800'),
('Real Estate REIT', 'Diversified portfolio of commercial and residential properties.', 10000.00, 12.00, 24, 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&q=80&w=800');
