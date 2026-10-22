
const pool = require("../config/database");

// =====================================================
// CLIENTES
// =====================================================

async function obtenerClientes() {
    const result = await pool.query(`
        SELECT
            c.*,
            CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable
        FROM cliente c
        LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
        ORDER BY c.id_cliente DESC
    `);

    return result.rows;
}

async function obtenerClientePorId(id) {
    const result = await pool.query(`
        SELECT
            c.*,
            CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable
        FROM cliente c
        LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
        WHERE c.id_cliente = $1
    `, [id]);

    return result.rows[0] || null;
}

async function crearCliente(cliente) {
    const {
        tipo_cliente,
        razon_social_nombres,
        num_documento,
        email,
        telefono,
        direccion,
        id_usuario
    } = cliente;

    const result = await pool.query(`
        INSERT INTO cliente (
            tipo_cliente,
            razon_social_nombres,
            num_documento,
            email,
            telefono,
            direccion,
            id_usuario
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [
        tipo_cliente,
        razon_social_nombres,
        num_documento || null,
        email || null,
        telefono || null,
        direccion || null,
        id_usuario || null
    ]);

    return result.rows[0];
}

async function actualizarCliente(id, cliente) {
    const {
        tipo_cliente,
        razon_social_nombres,
        num_documento,
        email,
        telefono,
        direccion,
        id_usuario,
        estado
    } = cliente;

    const result = await pool.query(`
        UPDATE cliente
        SET
            tipo_cliente = $1,
            razon_social_nombres = $2,
            num_documento = $3,
            email = $4,
            telefono = $5,
            direccion = $6,
            id_usuario = $7,
            estado = COALESCE($8, estado)
        WHERE id_cliente = $9
        RETURNING *
    `, [
        tipo_cliente,
        razon_social_nombres,
        num_documento || null,
        email || null,
        telefono || null,
        direccion || null,
        id_usuario || null,
        estado || null,
        id
    ]);

    return result.rows[0] || null;
}

async function cambiarEstadoCliente(id, estado) {
    const result = await pool.query(`
        UPDATE cliente
        SET estado = $1
        WHERE id_cliente = $2
        RETURNING *
    `, [estado, id]);

    return result.rows[0] || null;
}

// =====================================================
// RESPONSABLES
// =====================================================

async function obtenerResponsables() {
    const result = await pool.query(`
        SELECT
            u.id_usuario,
            u.nombres,
            u.apellidos,
            CONCAT_WS(' ', u.nombres, u.apellidos) AS nombre_completo,
            u.email
        FROM usuario u
        ORDER BY u.nombres, u.apellidos
    `);

    return result.rows;
}

// =====================================================
// LEADS / CLIENTES POTENCIALES
// =====================================================

async function obtenerLeads() {
    const result = await pool.query(`
        SELECT
            l.*,
            c.razon_social_nombres AS cliente_convertido
        FROM cliente_potencial l
        LEFT JOIN cliente c ON c.id_cliente = l.id_cliente
        ORDER BY l.id_lead DESC
    `);

    return result.rows;
}

async function obtenerLeadPorId(id) {
    const result = await pool.query(`
        SELECT
            l.*,
            c.razon_social_nombres AS cliente_convertido
        FROM cliente_potencial l
        LEFT JOIN cliente c ON c.id_cliente = l.id_cliente
        WHERE l.id_lead = $1
    `, [id]);

    return result.rows[0] || null;
}

async function crearLead(lead) {
    const {
        nombre,
        contacto,
        cargo_contacto,
        email,
        telefono,
        fuente,
        estado,
        id_cliente
    } = lead;

    const result = await pool.query(`
        INSERT INTO cliente_potencial (
            nombre,
            contacto,
            cargo_contacto,
            email,
            telefono,
            fuente,
            estado,
            id_cliente
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
    `, [
        nombre,
        contacto || null,
        cargo_contacto || null,
        email || null,
        telefono || null,
        fuente || null,
        estado || "Activo",
        id_cliente || null
    ]);

    return result.rows[0];
}

async function actualizarLead(id, lead) {
    const {
        nombre,
        contacto,
        cargo_contacto,
        email,
        telefono,
        fuente,
        estado,
        id_cliente
    } = lead;

    const result = await pool.query(`
        UPDATE cliente_potencial
        SET
            nombre = $1,
            contacto = $2,
            cargo_contacto = $3,
            email = $4,
            telefono = $5,
            fuente = $6,
            estado = COALESCE($7, estado),
            id_cliente = $8
        WHERE id_lead = $9
        RETURNING *
    `, [
        nombre,
        contacto || null,
        cargo_contacto || null,
        email || null,
        telefono || null,
        fuente || null,
        estado || null,
        id_cliente || null,
        id
    ]);

    return result.rows[0] || null;
}

async function cambiarEstadoLead(id, estado) {
    const result = await pool.query(`
        UPDATE cliente_potencial
        SET estado = $1
        WHERE id_lead = $2
        RETURNING *
    `, [estado, id]);

    return result.rows[0] || null;
}

async function convertirLeadACliente(id, conversion) {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const leadResult = await client.query(`
            SELECT *
            FROM cliente_potencial
            WHERE id_lead = $1
            FOR UPDATE
        `, [id]);
        const lead = leadResult.rows[0];

        if (!lead) {
            const error = new Error("El lead no existe.");
            error.code = "LEAD_NOT_FOUND";
            throw error;
        }

        if (lead.estado === "Convertido" || lead.id_cliente) {
            const error = new Error("Este lead ya fue convertido en cliente.");
            error.code = "LEAD_ALREADY_CONVERTED";
            throw error;
        }

        if (lead.estado !== "Activo") {
            const error = new Error("Solo se pueden convertir leads activos.");
            error.code = "LEAD_CANNOT_CONVERT";
            throw error;
        }

        const clienteResult = await client.query(`
            INSERT INTO cliente (
                tipo_cliente,
                razon_social_nombres,
                num_documento,
                contacto_nombre,
                contacto_cargo,
                email,
                telefono,
                direccion,
                id_usuario
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `, [
            conversion.tipo_cliente,
            lead.nombre,
            conversion.num_documento || null,
            lead.contacto || null,
            lead.cargo_contacto || null,
            lead.email || null,
            lead.telefono || null,
            conversion.direccion || null,
            conversion.id_usuario || null
        ]);

        const cliente = clienteResult.rows[0];
        const leadActualizado = await client.query(`
            UPDATE cliente_potencial
            SET id_cliente = $1, estado = 'Convertido'
            WHERE id_lead = $2
            RETURNING *
        `, [cliente.id_cliente, id]);

        const oportunidades = await client.query(`
            UPDATE oportunidad_comercial
            SET id_cliente = $1, id_lead = NULL
            WHERE id_lead = $2
            RETURNING id_oportunidad
        `, [cliente.id_cliente, id]);

        await client.query("COMMIT");

        return {
            lead: leadActualizado.rows[0],
            cliente,
            oportunidades_actualizadas: oportunidades.rowCount
        };
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

// =====================================================
// OPORTUNIDADES COMERCIALES
// =====================================================

const SELECT_OPORTUNIDADES = `
    SELECT
        o.id_oportunidad,
        o.valor_estimado,
        o.etapa,
        o.notas,
        o.fecha_registro,
        o.id_cliente,
        c.razon_social_nombres AS cliente,
        o.id_lead,
        l.nombre AS lead,
        l.contacto AS contacto_lead,
        l.fuente AS fuente_lead,
        o.id_usuario,
        CONCAT_WS(' ', u.nombres, u.apellidos) AS responsable,
        o.id_servicio,
        s.nombre AS servicio,
        s.categoria AS categoria_servicio
    FROM oportunidad_comercial o
    LEFT JOIN cliente c ON c.id_cliente = o.id_cliente
    LEFT JOIN cliente_potencial l ON l.id_lead = o.id_lead
    LEFT JOIN usuario u ON u.id_usuario = o.id_usuario
    LEFT JOIN servicio s ON s.id_servicio = o.id_servicio
`;

async function obtenerOportunidades() {
    const result = await pool.query(`
        ${SELECT_OPORTUNIDADES}
        ORDER BY o.id_oportunidad DESC
    `);

    return result.rows;
}

async function obtenerOportunidadPorId(id) {
    const result = await pool.query(`
        ${SELECT_OPORTUNIDADES}
        WHERE o.id_oportunidad = $1
    `, [id]);

    return result.rows[0] || null;
}

async function crearOportunidad(oportunidad) {
    const {
        valor_estimado,
        etapa,
        notas,
        id_cliente,
        id_lead,
        id_usuario,
        id_servicio
    } = oportunidad;

    const result = await pool.query(`
        INSERT INTO oportunidad_comercial (
            valor_estimado,
            etapa,
            notas,
            id_cliente,
            id_lead,
            id_usuario,
            id_servicio
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
    `, [
        valor_estimado ?? 0,
        etapa || "Nuevo lead",
        notas || null,
        id_cliente || null,
        id_lead || null,
        id_usuario,
        id_servicio || null
    ]);

    return result.rows[0];
}

async function actualizarOportunidad(id, oportunidad) {
    const {
        valor_estimado,
        etapa,
        notas,
        id_cliente,
        id_lead,
        id_usuario,
        id_servicio
    } = oportunidad;

    const result = await pool.query(`
        UPDATE oportunidad_comercial
        SET
            valor_estimado = $1,
            etapa = $2,
            notas = $3,
            id_cliente = $4,
            id_lead = $5,
            id_usuario = $6,
            id_servicio = $7
        WHERE id_oportunidad = $8
        RETURNING *
    `, [
        valor_estimado,
        etapa,
        notas || null,
        id_cliente || null,
        id_lead || null,
        id_usuario,
        id_servicio || null,
        id
    ]);

    return result.rows[0] || null;
}

async function cambiarEtapaOportunidad(id, etapa) {
    const result = await pool.query(`
        UPDATE oportunidad_comercial
        SET etapa = $1
        WHERE id_oportunidad = $2
        RETURNING *
    `, [etapa, id]);

    return result.rows[0] || null;
}

// =====================================================
// SEGUIMIENTOS DE OPORTUNIDADES
// =====================================================

async function obtenerSeguimientos(idOportunidad) {
    const result = await pool.query(`
        SELECT *
        FROM seguimiento_oportunidad
        WHERE id_oportunidad = $1
        ORDER BY fecha DESC, id_seguimiento DESC
    `, [idOportunidad]);

    return result.rows;
}

async function crearSeguimiento(idOportunidad, seguimiento) {
    const {
        fecha,
        tipo,
        descripcion,
        proxima_fecha_contacto
    } = seguimiento;

    const result = await pool.query(`
        INSERT INTO seguimiento_oportunidad (
            fecha,
            tipo,
            descripcion,
            proxima_fecha_contacto,
            id_oportunidad
        )
        VALUES (
            COALESCE($1, CURRENT_TIMESTAMP),
            $2,
            $3,
            $4,
            $5
        )
        RETURNING *
    `, [
        fecha || null,
        tipo,
        descripcion,
        proxima_fecha_contacto || null,
        idOportunidad
    ]);

    return result.rows[0];
}

// =====================================================
// EXPORTACIONES
// =====================================================

module.exports = {
    // Clientes
    obtenerClientes,
    obtenerClientePorId,
    crearCliente,
    actualizarCliente,
    cambiarEstadoCliente,

    // Responsables
    obtenerResponsables,

    // Leads
    obtenerLeads,
    obtenerLeadPorId,
    crearLead,
    actualizarLead,
    cambiarEstadoLead,
    convertirLeadACliente,

    // Oportunidades
    obtenerOportunidades,
    obtenerOportunidadPorId,
    crearOportunidad,
    actualizarOportunidad,
    cambiarEtapaOportunidad,

    // Seguimientos
    obtenerSeguimientos,
    crearSeguimiento
};
