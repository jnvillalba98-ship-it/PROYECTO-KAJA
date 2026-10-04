const mysql = require('mysql2/promise');

const getEnv = (names, fallback) => {
    const value = names
        .map((name) => process.env[name])
        .find((item) => item !== undefined && item !== null && item !== '');
    return value ?? fallback;
};

const getMysqlConfig = () => {
    const config = {
        host: getEnv(['MYSQLHOST', 'DB_HOST'], '127.0.0.1'),
        user: getEnv(['MYSQLUSER', 'DB_USER', 'MYSQL_USERNAME'], 'root'),
        password: getEnv(['MYSQLPASSWORD', 'DB_PASSWORD'], ''),
        database: getEnv(['MYSQLDATABASE', 'DB_NAME'], 'kaja'),
        port: Number(getEnv(['MYSQLPORT', 'DB_PORT'], '3306'))
    };

    const mysqlUrl = getEnv(['MYSQL_URL', 'DATABASE_URL'], '');
    if (mysqlUrl) {
        try {
            const url = new URL(mysqlUrl);
            if (url.hostname) config.host = url.hostname;
            if (url.port) config.port = Number(url.port);
            if (url.username) config.user = decodeURIComponent(url.username);
            if (url.password) config.password = decodeURIComponent(url.password);
            if (url.pathname && url.pathname !== '/') {
                config.database = decodeURIComponent(url.pathname.replace(/^\/+/, ''));
            }
        } catch (error) {
            console.warn('La URL de MySQL no es válida, se usará la configuración manual:', error.message || error);
        }
    }

    return config;
};

const conexion = mysql.createPool({
    ...getMysqlConfig(),
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
