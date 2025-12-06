create database periodico_psac;
use periodico_psac;

create table usuarios (
  id int auto_increment primary key,
  username varchar(100) unique not null,
  password_hash varchar(255) not null,
  nombre varchar(150),
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