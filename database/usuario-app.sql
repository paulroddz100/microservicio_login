-- =====================================================================
-- Pegar y ejecutar en MySQL Workbench conectado como root.
-- Crea el usuario exclusivo del microservicio de login.
-- Si Workbench no esta disponible, usar:
--   mysql -u root -p < database/usuario-app.sql
-- =====================================================================

CREATE USER IF NOT EXISTS 'login_app'@'localhost' IDENTIFIED BY 'CambiaEstaClave2026';
CREATE DATABASE IF NOT EXISTS ventas_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON ventas_db.* TO 'login_app'@'localhost';
FLUSH PRIVILEGES;
