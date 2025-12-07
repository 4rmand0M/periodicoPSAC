create database periodico_psac;
use periodico_psac;

create table usuarios (
  id int auto_increment primary key,
  username varchar(100) unique not null,
  password_hash varchar(255) not null,
  nombre varchar(150),
  rol varchar(20) default 'usuario',
  creado timestamp default current_timestamp
);

create table publicaciones (
  id int auto_increment primary key,
  tipo enum('texto','imagen','video') not null,
  contenido text not null,
  archivo varchar(255),
  area varchar(50) default 'general', -- por área (informatica, mercadeo, etc.)
  destacado tinyint(1) default 0,
  author_id int null,
  creado timestamp default current_timestamp
);

create table votos (
  id int auto_increment primary key,
  publicacion_id int not null,
  user_id int null,
  session_id varchar(128) null,
  tipo enum('up','down') not null,
  creado timestamp default current_timestamp,
  unique (publicacion_id, user_id, session_id)
);

-- Tabla principal de noticias
CREATE TABLE IF NOT EXISTS noticias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    contenido LONGTEXT NOT NULL,
    categoria VARCHAR(50) DEFAULT 'general',
    imagen_principal VARCHAR(255),
    video_principal VARCHAR(255),
    autor_id INT,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla para galería adicional de cada noticia
CREATE TABLE IF NOT EXISTS noticias_galeria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    noticia_id INT NOT NULL,
    tipo ENUM('imagen', 'video') NOT NULL,
    archivo VARCHAR(255) NOT NULL,
    orden INT DEFAULT 0,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Índices para mejor rendimiento
CREATE INDEX idx_noticias_categoria ON noticias(categoria);
CREATE INDEX idx_noticias_creado ON noticias(creado DESC);
CREATE INDEX idx_noticias_autor ON noticias(autor_id);
CREATE INDEX idx_galeria_noticia ON noticias_galeria(noticia_id);

-- Tabla de comentarios para publicaciones
CREATE TABLE IF NOT EXISTS comentarios_publicaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    publicacion_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(128) NULL,
    nombre_usuario VARCHAR(100),
    comentario TEXT NOT NULL,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publicacion_id) REFERENCES publicaciones(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_publicacion (publicacion_id),
    INDEX idx_usuario (user_id),
    INDEX idx_fecha (creado DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de comentarios para noticias
CREATE TABLE IF NOT EXISTS comentarios_noticias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    noticia_id INT NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(128) NULL,
    nombre_usuario VARCHAR(100),
    comentario TEXT NOT NULL,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (noticia_id) REFERENCES noticias(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_noticia (noticia_id),
    INDEX idx_usuario (user_id),
    INDEX idx_fecha (creado DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de respuestas a comentarios 
CREATE TABLE IF NOT EXISTS respuestas_comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comentario_id INT NOT NULL,
    tipo_comentario ENUM('publicacion', 'noticia') NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(128) NULL,
    nombre_usuario VARCHAR(100),
    respuesta TEXT NOT NULL,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_comentario (comentario_id),
    INDEX idx_fecha (creado DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Modificar tabla de comentarios existente para soportar respuestas
ALTER TABLE comentarios_publicaciones 
ADD COLUMN parent_id INT NULL,
ADD COLUMN editado TINYINT(1) DEFAULT 0,
ADD COLUMN editado_fecha TIMESTAMP NULL,
ADD FOREIGN KEY (parent_id) REFERENCES comentarios_publicaciones(id) ON DELETE CASCADE;

ALTER TABLE comentarios_noticias 
ADD COLUMN parent_id INT NULL,
ADD COLUMN editado TINYINT(1) DEFAULT 0,
ADD COLUMN editado_fecha TIMESTAMP NULL,
ADD FOREIGN KEY (parent_id) REFERENCES comentarios_noticias(id) ON DELETE CASCADE;

-- Tabla de reacciones a comentarios
CREATE TABLE IF NOT EXISTS comentarios_reacciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comentario_id INT NOT NULL,
    tipo_contenido ENUM('publicacion', 'noticia') NOT NULL,
    user_id INT NULL,
    session_id VARCHAR(128) NULL,
    tipo_reaccion ENUM('like', 'love', 'dislike') NOT NULL,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_reaccion (comentario_id, tipo_contenido, user_id, session_id, tipo_reaccion),
    INDEX idx_comentario (comentario_id),
    INDEX idx_tipo (tipo_reaccion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de menciones en comentarios
CREATE TABLE IF NOT EXISTS comentarios_menciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comentario_id INT NOT NULL,
    tipo_contenido ENUM('publicacion', 'noticia') NOT NULL,
    usuario_mencionado_id INT NOT NULL,
    usuario_menciono_id INT NULL,
    leido TINYINT(1) DEFAULT 0,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_mencionado_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_menciono_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario_mencionado (usuario_mencionado_id),
    INDEX idx_leido (leido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de notificaciones de comentarios
CREATE TABLE IF NOT EXISTS comentarios_notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    tipo_notificacion ENUM('respuesta', 'mencion', 'reaccion') NOT NULL,
    comentario_id INT NOT NULL,
    tipo_contenido ENUM('publicacion', 'noticia') NOT NULL,
    contenido_id INT NOT NULL,
    usuario_origen_id INT NULL,
    mensaje TEXT,
    leido TINYINT(1) DEFAULT 0,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_origen_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_usuario (usuario_id),
    INDEX idx_leido (leido),
    INDEX idx_creado (creado DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabla de reportes de comentarios (moderación)
CREATE TABLE IF NOT EXISTS comentarios_reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    comentario_id INT NOT NULL,
    tipo_contenido ENUM('publicacion', 'noticia') NOT NULL,
    usuario_reporta_id INT NULL,
    session_id VARCHAR(128) NULL,
    razon ENUM('spam', 'ofensivo', 'inapropiado', 'otro') NOT NULL,
    descripcion TEXT,
    estado ENUM('pendiente', 'revisado', 'aceptado', 'rechazado') DEFAULT 'pendiente',
    admin_revisor_id INT NULL,
    notas_admin TEXT,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    revisado_fecha TIMESTAMP NULL,
    FOREIGN KEY (usuario_reporta_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_revisor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_estado (estado),
    INDEX idx_creado (creado DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vista para comentarios con conteo de reacciones
CREATE OR REPLACE VIEW vista_comentarios_stats AS
SELECT 
    c.id,
    c.publicacion_id,
    c.user_id,
    c.nombre_usuario,
    c.comentario,
    c.parent_id,
    c.editado,
    c.creado,
    COUNT(DISTINCT CASE WHEN r.tipo_reaccion = 'like' THEN r.id END) as total_likes,
    COUNT(DISTINCT CASE WHEN r.tipo_reaccion = 'love' THEN r.id END) as total_loves,
    COUNT(DISTINCT CASE WHEN r.tipo_reaccion = 'dislike' THEN r.id END) as total_dislikes,
    COUNT(DISTINCT resp.id) as total_respuestas
FROM comentarios_publicaciones c
LEFT JOIN comentarios_reacciones r ON c.id = r.comentario_id AND r.tipo_contenido = 'publicacion'
LEFT JOIN comentarios_publicaciones resp ON c.id = resp.parent_id
GROUP BY c.id;

-- Índices adicionales para optimización
CREATE INDEX idx_comentarios_parent ON comentarios_publicaciones(parent_id);
CREATE INDEX idx_comentarios_noticias_parent ON comentarios_noticias(parent_id);
CREATE INDEX idx_reacciones_usuario ON comentarios_reacciones(user_id, session_id);
CREATE INDEX idx_notificaciones_usuario_leido ON comentarios_notificaciones(usuario_id, leido);

-- Trigger para crear notificación cuando se responde a un comentario
DELIMITER //

CREATE TRIGGER after_comentario_respuesta_publicacion
AFTER INSERT ON comentarios_publicaciones
FOR EACH ROW
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        -- Obtener el autor del comentario padre
        SET @parent_user_id = (SELECT user_id FROM comentarios_publicaciones WHERE id = NEW.parent_id);
        
        -- Si el autor del comentario padre es un usuario registrado y no es el mismo que responde
        IF @parent_user_id IS NOT NULL AND @parent_user_id != NEW.user_id THEN
            INSERT INTO comentarios_notificaciones 
                (usuario_id, tipo_notificacion, comentario_id, tipo_contenido, contenido_id, usuario_origen_id, mensaje)
            VALUES 
                (@parent_user_id, 'respuesta', NEW.id, 'publicacion', NEW.publicacion_id, NEW.user_id, 
                 CONCAT(NEW.nombre_usuario, ' respondió a tu comentario'));
        END IF;
    END IF;
END//

CREATE TRIGGER after_comentario_respuesta_noticia
AFTER INSERT ON comentarios_noticias
FOR EACH ROW
BEGIN
    IF NEW.parent_id IS NOT NULL THEN
        SET @parent_user_id = (SELECT user_id FROM comentarios_noticias WHERE id = NEW.parent_id);
        
        IF @parent_user_id IS NOT NULL AND @parent_user_id != NEW.user_id THEN
            INSERT INTO comentarios_notificaciones 
                (usuario_id, tipo_notificacion, comentario_id, tipo_contenido, contenido_id, usuario_origen_id, mensaje)
            VALUES 
                (@parent_user_id, 'respuesta', NEW.id, 'noticia', NEW.noticia_id, NEW.user_id, 
                 CONCAT(NEW.nombre_usuario, ' respondió a tu comentario'));
        END IF;
    END IF;
END//

DELIMITER ;

-- Procedimiento para limpiar notificaciones antiguas (más de 30 días)
DELIMITER //

CREATE PROCEDURE limpiar_notificaciones_antiguas()
BEGIN
    DELETE FROM comentarios_notificaciones 
    WHERE leido = 1 
    AND creado < DATE_SUB(NOW(), INTERVAL 30 DAY);
END//

DELIMITER ;

-- Evento programado para ejecutar limpieza semanalmente
CREATE EVENT IF NOT EXISTS evento_limpiar_notificaciones
ON SCHEDULE EVERY 1 WEEK
STARTS CURRENT_TIMESTAMP
DO CALL limpiar_notificaciones_antiguas();

-- Tabla de eventos del calendario
CREATE TABLE IF NOT EXISTS eventos_calendario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    fecha DATE NOT NULL,
    hora TIME NULL,
    color VARCHAR(7) DEFAULT '#3B82F6',
    autor_id INT,
    creado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_fecha (fecha),
    INDEX idx_autor (autor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

