const mysql = require('mysql2/promise');

const conexion = mysql.createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT
});

conexion.getConnection()
    .then((connection) => {
        console.log('✅ Conectado a la base de datos KAJA en Railway');
        connection.release();
    })
    .catch((error) => {
        console.error('❌ Error al conectar con MySQL en Railway');
        console.error(error);
    });

module.exports = conexion;
