const mysql = require('mysql2/promise');
require('dotenv').config();

const conexion = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

conexion.getConnection()
    .then((connection) => {
        console.log('✅ Conectado a la base de datos KAJA');
        connection.release();
    })
    .catch((error) => {
        console.error('❌ Error al conectar con MySQL');
        console.error(error);
    });

module.exports = conexion;