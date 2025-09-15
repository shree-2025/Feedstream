CREATE TABLE IF NOT EXISTS subjects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  credits INT NOT NULL,
  description TEXT,
  semester VARCHAR(50),
  type ENUM('Core', 'Elective', 'Lab', 'Project') NOT NULL,
  instructor_id INT,
  duration VARCHAR(50),
  prerequisites TEXT,
  objectives TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (instructor_id) REFERENCES staff(id) ON DELETE SET NULL
);
