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