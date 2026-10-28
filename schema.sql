-- ====================================================================
-- BANCO DE DADOS: DELIVERY MULTIVERTICAIS (PostgreSQL / Supabase)
-- Arquitetura completa para Cliente, Estabelecimento, Motoboy e Admin
-- ====================================================================

-- 1. TIPOS ENUMERADOS (STATUS E PAPEIS)
CREATE TYPE user_role AS ENUM ('customer', 'merchant', 'driver', 'admin');
CREATE TYPE order_status AS ENUM (
    'pending',          -- Aguardando confirmação do restaurante
    'accepted',         -- Aceito pelo restaurante
    'in_preparation',   -- Na cozinha / em preparo
    'ready_for_pickup', -- Pronto aguardando motoboy
    'out_for_delivery', -- Motoboy em trânsito
    'delivered',        -- Entregue com sucesso
    'cancelled'         -- Cancelado
);
CREATE TYPE payment_method AS ENUM ('pix', 'credit_card', 'cash');
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded', 'failed');

-- ====================================================================
-- 2. TABELA DE USUÁRIOS (Clientes, Donos de Lojas, Motoboys e Admin)
-- ====================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20) UNIQUE NOT NULL,      -- Chave principal para WhatsApp e login
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'customer',
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 3. TABELA DE BAIRROS E TAXAS DE ENTREGA DA CIDADE
-- ====================================================================
CREATE TABLE neighborhoods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_name VARCHAR(100) NOT NULL DEFAULT 'Sua Cidade',
    name VARCHAR(100) NOT NULL,             -- Ex: "Centro", "Jardim América"
    base_delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 5.00,
    estimated_time_min INT NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE
);

-- ====================================================================
-- 4. TABELA DE CATEGORIAS PRINCIPAIS (VERTICAIS)
-- ====================================================================
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,             -- Ex: Lanches, Farmácia, Bebidas 24h
    slug VARCHAR(100) UNIQUE NOT NULL,
    icon_name VARCHAR(50) NOT NULL,         -- Nome do ícone
    accent_color VARCHAR(20) DEFAULT '#0052FF',
    sort_order INT DEFAULT 0
);

-- ====================================================================
-- 5. TABELA DE ESTABELECIMENTOS / PARCEIROS
-- ====================================================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id),
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    description TEXT,
    phone VARCHAR(20) NOT NULL,             -- WhatsApp da loja para alertas
    address TEXT NOT NULL,
    logo_url TEXT,
    banner_url TEXT,
    rating NUMERIC(2,1) DEFAULT 5.0,
    reviews_count INT DEFAULT 0,
    min_order_value NUMERIC(10,2) DEFAULT 15.00,
    
    -- Configurações Financeiras e de Repasse
    commission_rate NUMERIC(5,2) DEFAULT 10.00,  -- Sua comissão (ex: 10%)
    pix_key VARCHAR(100),                        -- Chave Pix da loja para o split automático
    
    -- Status Operacional
    is_open BOOLEAN DEFAULT TRUE,
    opening_hours TEXT DEFAULT '18:00 às 23:45',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 6. TABELA DE PRODUTOS / ITENS DO CARDÁPIO
-- ====================================================================
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    image_url TEXT,
    category_name VARCHAR(100) NOT NULL,   -- Ex: "Hambúrgueres", "Bebidas"
    badge VARCHAR(50),                     -- Ex: "Mais Vendido", "Serve 2"
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 7. GRUPOS DE ADICIONAIS / COMPLEMENTOS (Obrigatórios e Opcionais)
-- ====================================================================
CREATE TABLE product_option_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,           -- Ex: "Ponto da Carne", "Turbine seu Burger"
    subtitle VARCHAR(150),                 -- Ex: "Escolha até 3 opções"
    is_required BOOLEAN DEFAULT FALSE,
    min_options INT DEFAULT 0,
    max_options INT DEFAULT 1,
    sort_order INT DEFAULT 0
);

CREATE TABLE product_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES product_option_groups(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,            -- Ex: "Bacon Crocante Extra"
    price NUMERIC(10,2) DEFAULT 0.00,      -- Preço adicional (ex: + R$ 4,50)
    is_available BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0
);

-- ====================================================================
-- 8. TABELA DE PEDIDOS (A Engrenagem de Venda e Split Financeiro)
-- ====================================================================
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_code VARCHAR(10) UNIQUE NOT NULL, -- Ex: "#1048"
    customer_id UUID REFERENCES users(id),
    store_id UUID REFERENCES stores(id),
    driver_id UUID REFERENCES users(id),    -- Motoboy alocado
    neighborhood_id UUID REFERENCES neighborhoods(id),
    
    status order_status DEFAULT 'pending',
    
    -- Valores Financeiros e Divisão (Split)
    subtotal NUMERIC(10,2) NOT NULL,            -- Valor da comida
    delivery_fee NUMERIC(10,2) NOT NULL,        -- Valor do frete
    total_amount NUMERIC(10,2) NOT NULL,        -- Subtotal + Frete
    platform_commission NUMERIC(10,2) NOT NULL, -- O SEU LUCRO (ex: 10% do subtotal)
    merchant_net_amount NUMERIC(10,2) NOT NULL, -- O que o restaurante recebe líquido
    
    -- Pagamento
    payment_method payment_method NOT NULL,     -- pix, credit_card, cash
    payment_status payment_status DEFAULT 'pending',
    change_for NUMERIC(10,2),                   -- Troco para quanto (se dinheiro)
    
    -- Entrega e Segurança
    delivery_address TEXT NOT NULL,
    delivery_pin VARCHAR(4) NOT NULL,           -- Código PIN de 4 dígitos (ex: "4821")
    customer_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- 9. ITENS DO PEDIDO E ADICIONAIS SELECIONADOS
-- ====================================================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(150) NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    total_price NUMERIC(10,2) NOT NULL,
    customer_notes TEXT
);

CREATE TABLE order_item_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES order_items(id) ON DELETE CASCADE,
    option_name VARCHAR(150) NOT NULL,
    price NUMERIC(10,2) DEFAULT 0.00
);

-- ====================================================================
-- 10. CARTEIRA E EXTRATO DO MOTOBOY (Controle de Repasses de Frete)
-- ====================================================================
CREATE TABLE driver_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    pix_key VARCHAR(100) NOT NULL,
    current_balance NUMERIC(10,2) DEFAULT 0.00,  -- Saldo acumulado de corridas a receber
    total_earned NUMERIC(10,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE driver_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES driver_wallets(id),
    order_id UUID REFERENCES orders(id),
    amount NUMERIC(10,2) NOT NULL,               -- Valor ganho na entrega (ex: R$ 8,00)
    status VARCHAR(20) DEFAULT 'paid',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ====================================================================
-- ÍNDICES PARA VELOCIDADE E TEMPO REAL
-- ====================================================================
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_products_store ON products(store_id);
