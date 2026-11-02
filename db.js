/**
 * ZAPT DELIVERY - CONEXÃO COM BANCO DE DADOS POSTGRESQL DEFINITIVO
 * Suporta PostgreSQL na Nuvem (Render, Supabase, Neon, Railway ou Local)
 * Com modo de contingência em memória caso DATABASE_URL não esteja definida.
 */

const { Pool } = require('pg');

let pool = null;
let isConnected = false;

// Conecta se DATABASE_URL existir no ambiente (.env ou painel do Render/Supabase)
if (process.env.DATABASE_URL) {
  const isCloudHost = !process.env.DATABASE_URL.includes('localhost') && !process.env.DATABASE_URL.includes('127.0.0.1');

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isCloudHost ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  pool.on('connect', () => {
    isConnected = true;
  });

  pool.on('error', (err) => {
    console.error('❌ Erro no Pool do PostgreSQL:', err.message);
  });
} else {
  console.log('ℹ️  DATABASE_URL não detectada. O servidor usará o cache rápido em memória.');
}

/**
 * Executa uma consulta SQL com tratamento de erro
 */
async function query(text, params) {
  if (!pool) return null;
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (err) {
    console.error('❌ Erro na consulta SQL:', err.message, '\nQuery:', text);
    throw err;
  }
}

/**
 * Criação e Migração Automática das Tabelas Definitivas
 */
async function initDatabase() {
  if (!pool) return false;

  console.log('🐘 Conectando ao PostgreSQL e verificando tabelas...');

  try {
    const client = await pool.connect();

    // 1. Tabela de Usuários / Clientes
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(30) UNIQUE NOT NULL,
        email VARCHAR(150),
        role VARCHAR(20) DEFAULT 'customer',
        city VARCHAR(100) DEFAULT 'Barbalha - CE',
        street TEXT,
        number VARCHAR(20),
        complement TEXT,
        neighborhood VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. Tabela de Lojas / Parceiros de Barbalha
    await client.query(`
      CREATE TABLE IF NOT EXISTS stores (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        category VARCHAR(50) NOT NULL,
        phone VARCHAR(30),
        address TEXT,
        city VARCHAR(100) DEFAULT 'Barbalha - CE',
        rating NUMERIC(2,1) DEFAULT 5.0,
        delivery_time VARCHAR(30) DEFAULT '30-45 min',
        min_order NUMERIC(10,2) DEFAULT 15.00,
        commission_rate NUMERIC(5,2) DEFAULT 10.00,
        pix_key VARCHAR(100),
        image_url TEXT,
        is_open BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 3. Tabela de Produtos / Itens do Cardápio
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        store_id VARCHAR(50) REFERENCES stores(id) ON DELETE CASCADE,
        name VARCHAR(150) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) NOT NULL,
        category_name VARCHAR(100),
        badge VARCHAR(50),
        image_url TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 4. Tabela de Pedidos
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        customer_name VARCHAR(150) NOT NULL,
        customer_phone VARCHAR(30) NOT NULL,
        delivery_address TEXT NOT NULL,
        neighborhood VARCHAR(100) NOT NULL,
        store_id VARCHAR(50) REFERENCES stores(id),
        store_name VARCHAR(150) NOT NULL,
        items JSONB NOT NULL,
        subtotal NUMERIC(10,2) NOT NULL,
        delivery_fee NUMERIC(10,2) NOT NULL,
        service_fee NUMERIC(10,2) DEFAULT 0.99,
        discount NUMERIC(10,2) DEFAULT 0.00,
        total NUMERIC(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(50) DEFAULT 'pending',
        order_status VARCHAR(50) DEFAULT 'pending',
        driver_name VARCHAR(100),
        delivery_code VARCHAR(10),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 5. Tabela de Transações de Pagamento (PIX e Cartão Asaas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id VARCHAR(100) PRIMARY KEY,
        order_id VARCHAR(50),
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        gross_amount NUMERIC(10,2) NOT NULL,
        net_amount NUMERIC(10,2),
        store_split NUMERIC(10,2),
        driver_split NUMERIC(10,2),
        platform_split NUMERIC(10,2),
        asaas_payment_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 6. Tabela de Motoboys Cadastrados
    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        phone VARCHAR(30) UNIQUE NOT NULL,
        vehicle_plate VARCHAR(20),
        pix_key VARCHAR(100),
        city VARCHAR(100) DEFAULT 'Barbalha - CE',
        is_online BOOLEAN DEFAULT FALSE,
        total_deliveries INT DEFAULT 0,
        rating NUMERIC(2,1) DEFAULT 5.0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ PostgreSQL Inicializado com Sucesso: Todas as tabelas prontas!');
    client.release();
    isConnected = true;
    return true;
  } catch (err) {
    console.error('⚠️  Falha ao inicializar tabelas do PostgreSQL:', err.message);
    return false;
  }
}

module.exports = {
  pool,
  query,
  initDatabase,
  isAvailable: () => isConnected && !!pool,
};
