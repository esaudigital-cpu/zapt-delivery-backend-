-- ====================================================================
-- DADOS INICIAIS (SEED) PARA POPULAR O BANCO DE DADOS
-- ====================================================================

-- 1. Inserir Categorias Multiverticais
INSERT INTO categories (name, slug, icon_name, accent_color, sort_order) VALUES
('Lanches', 'lanches', 'fast-food-outline', '#FF6D00', 1),
('Farmácia', 'farmacia', 'medkit-outline', '#00B0FF', 2),
('Bebidas 24h', 'bebidas', 'beer-outline', '#7C4DFF', 3),
('Pet Shop', 'petshop', 'paw-outline', '#00BFA5', 4),
('Leva e Traz', 'leva_traz', 'bicycle-outline', '#0052FF', 5);

-- 2. Inserir Bairros da Cidade com Taxas de Entrega
INSERT INTO neighborhoods (name, base_delivery_fee, estimated_time_min) VALUES
('Centro', 3.50, 25),
('Jardim América', 5.00, 30),
('Vila Nova', 6.00, 35),
('Bairro Industrial', 7.50, 40),
('Zona Rural / Chácaras', 12.00, 50);

-- 3. Inserir Usuários (Admin, Restaurante, Cliente e Motoboy)
INSERT INTO users (id, name, phone, email, role) VALUES
('00000000-0000-0000-0000-000000000001', 'Administrador da Plataforma', '5511999990000', 'admin@seudelivery.com.br', 'admin'),
('00000000-0000-0000-0000-000000000002', 'Dono Burguer Prime', '5511999991111', 'loja@burguerprime.com.br', 'merchant'),
('00000000-0000-0000-0000-000000000003', 'Carlos Silva (Motoboy)', '5511999992222', 'carlos.motoboy@gmail.com', 'driver'),
('00000000-0000-0000-0000-000000000004', 'Lucas Cliente', '5511999993333', 'lucas.cliente@gmail.com', 'customer');

-- 4. Inserir Restaurante Parceiro (Burguer Prime)
INSERT INTO stores (
    id, merchant_user_id, name, slug, description, phone, address,
    rating, reviews_count, min_order_value, commission_rate, pix_key,
    is_open, opening_hours, logo_url, banner_url
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '00000000-0000-0000-0000-000000000002',
    'Burguer Prime Artesanal',
    'burguer-prime',
    'Os melhores hambúrgueres artesanais na brasa da cidade.',
    '5511999991111',
    'Av. Brasil, 780 - Centro',
    4.9, 342, 20.00, 10.00, 'loja@burguerprime.com.br',
    TRUE, '18:00 às 23:45',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80',
    'https://images.unsplash.com/photo-1550547660-d9450f859349?w=1000&q=80'
);

-- 5. Inserir Produto Principal (Prime Smash Bacon Duplo)
INSERT INTO products (
    id, store_id, name, description, price, category_name, badge, image_url
) VALUES (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Prime Smash Bacon Duplo',
    'Dois blends smash artesanais de 100g, queijo cheddar derretido, bacon crocante e maionese especial no pão brioche.',
    34.90,
    'Hambúrgueres',
    'O Mais Vendido',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80'
);

-- 6. Inserir Grupo de Adicionais Obrigatório (Ponto da Carne)
INSERT INTO product_option_groups (
    id, product_id, title, subtitle, is_required, min_options, max_options
) VALUES (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Ponto da Carne',
    'Escolha 1 opção',
    TRUE, 1, 1
);

INSERT INTO product_options (group_id, name, price) VALUES
('33333333-3333-3333-3333-333333333333', 'Ao Ponto (Mais Suculenta)', 0.00),
('33333333-3333-3333-3333-333333333333', 'Bem Passada', 0.00),
('33333333-3333-3333-3333-333333333333', 'Ao Ponto para Mal', 0.00);

-- 7. Inserir Grupo de Adicionais Opcional (Turbine seu Burger)
INSERT INTO product_option_groups (
    id, product_id, title, subtitle, is_required, min_options, max_options
) VALUES (
    '44444444-4444-4444-4444-444444444444',
    '22222222-2222-2222-2222-222222222222',
    'Turbine seu Lanche',
    'Escolha até 3 adicionais',
    FALSE, 0, 3
);

INSERT INTO product_options (group_id, name, price) VALUES
('44444444-4444-4444-4444-444444444444', 'Bacon Artesanal Extra', 5.00),
('44444444-4444-4444-4444-444444444444', 'Queijo Cheddar Duplo', 4.00),
('44444444-4444-4444-4444-444444444444', 'Cebola Caramelizada', 3.50);
