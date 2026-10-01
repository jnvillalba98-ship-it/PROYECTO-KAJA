const mysql = require('mysql2/promise');

const getEnv = (names, fallback) => {
    const value = names
        .map((name) => process.env[name])
        .find((item) => item !== undefined && item !== null && item !== '');
    return value ?? fallback;
};

const conexion = mysql.createPool({
    host: getEnv(['MYSQLHOST', 'DB_HOST'], '127.0.0.1'),
    user: getEnv(['MYSQLUSER', 'DB_USER'], 'root'),
    password: getEnv(['MYSQLPASSWORD', 'DB_PASSWORD'], ''),
    database: getEnv(['MYSQLDATABASE', 'DB_NAME'], 'kaja'),
    port: Number(getEnv(['MYSQLPORT', 'DB_PORT'], '3306')),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
});

conexion.getConnection()
    .then((connection) => {
        console.log('✅ Conectado a la base de datos KAJA');
        connection.release();
    })
    .catch((error) => {
        console.error('❌ Error al conectar con MySQL');
        console.error(error.message || error);
    });

module.exports = conexion;
