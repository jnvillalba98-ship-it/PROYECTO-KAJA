const fs = require('fs');
const path = require('path');
require('dotenv').config();
const conexion = require('./config/conexion');

const sqlPath = path.join(__dirname, '..', 'crear_bd_kaja.sql');

async function ejecutar() {
    const connection = await conexion.getConnection();
    try {
        // Leer el archivo SQL
        const sql = fs.readFileSync('/tmp/crear_bd_kaja.sql', 'utf8');
        
        // Dividir por puntos y coma y ejecutar cada statement
        const statements = sql
            .split(/;\s*$/m)
            .map(s => s.trim())
            .filter(s => s && !s.startsWith('--'));

        console.log(`\n📋 Ejecutando ${statements.length} statements SQL...\n`);

        for (let i = 0; i < statements.length; i++) {
            try {
                await connection.query(statements[i]);
                console.log(`✅ [${i + 1}/${statements.length}] Statement ejecutado`);
            } catch (err) {
                console.error(`❌ [${i + 1}/${statements.length}] Error:`, err.message);
            }
        }

        console.log('\n✅ Scripts SQL completados. Verificando estructura...\n');
        
        // Verificar tablas
        const [tables] = await connection.query(
            "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() ORDER BY TABLE_NAME"
        );
        
        console.log('📊 TABLAS CREADAS:');
        tables.forEach((t, i) => {
            console.log(`  ${i + 1}. ${t.TABLE_NAME}`);
        });

        // Verificar roles
        const [roles] = await connection.query("SELECT id, nombre FROM roles ORDER BY nombre");
        console.log('\n🔐 ROLES:');
        roles.forEach((r, i) => {
            console.log(`  ${i + 1}. ${r.nombre} (ID: ${r.id})`);
        });

        // Verificar permisos
        const [permisos] = await connection.query("SELECT COUNT(*) as total FROM permisos");
        console.log(`\n🔑 PERMISOS: ${permisos[0].total} registrados`);
        
        const [permisosList] = await connection.query("SELECT codigo FROM permisos ORDER BY codigo");
        permisosList.forEach((p, i) => {
            console.log(`  ${i + 1}. ${p.codigo}`);
        });

        // Verificar rol_permisos
        const [rolPermisos] = await connection.query(
            `SELECT r.nombre, COUNT(rp.permiso_id) as total_permisos 
             FROM roles r 
             LEFT JOIN rol_permisos rp ON r.id = rp.rol_id 
             GROUP BY r.nombre ORDER BY r.nombre`
        );
        console.log('\n🔗 RELACIONES ROL-PERMISOS:');
        rolPermisos.forEach((rp, i) => {
            console.log(`  ${i + 1}. ${rp.nombre}: ${rp.total_permisos} permisos`);
        });

        // Verificar columnas en empresas
        const [empresasColumns] = await connection.query(
            "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'empresas' ORDER BY ORDINAL_POSITION"
        );
        console.log('\n📦 COLUMNAS EN TABLA EMPRESAS:');
        empresasColumns.forEach((col, i) => {
            console.log(`  ${i + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
        });

        // Verificar columnas en usuarios (empresa_id y rol_id)
        const [usuariosColumns] = await connection.query(
            "SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME IN ('empresa_id', 'rol_id') ORDER BY ORDINAL_POSITION"
        );
        console.log('\n👤 COLUMNAS CLAVE EN USUARIOS:');
        if (usuariosColumns.length > 0) {
            usuariosColumns.forEach((col, i) => {
                console.log(`  ${i + 1}. ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
            });
        } else {
            console.log('  ❌ No se encontraron columnas empresa_id o rol_id');
        }

        // Contar registros en cada tabla
        console.log('\n📊 CONTEO DE REGISTROS:');
        const tables_to_count = [
            'empresas', 'usuarios', 'roles', 'permisos', 'rol_permisos',
            'categorias', 'productos_producto', 'ventas', 'venta_detalles', 'movimientos_inventario'
        ];
        
        for (const tableName of tables_to_count) {
            const [result] = await connection.query(`SELECT COUNT(*) as total FROM ${tableName}`);
            console.log(`  ${tableName}: ${result[0].total} registros`);
        }

        console.log('\n✅ ¡VERIFICACIÓN COMPLETADA!\n');

    } catch (error) {
        console.error('❌ Error durante ejecución:', error.message);
    } finally {
        connection.release();
        await conexion.end();
    }
}

ejecutar();

