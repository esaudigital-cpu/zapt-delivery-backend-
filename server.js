const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
const bot = require('./bot');
const whatsapp = require('./whatsapp');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Servir o Painel Web do Restaurante (Gestor de Pedidos e Cardápio)
app.use('/painel', express.static(path.join(__dirname, 'public')));
app.get('/motoboy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'motoboy.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/whatsapp', (req, res) => res.sendFile(path.join(__dirname, 'public', 'whatsapp.html')));
app.use(express.static(path.join(__dirname, 'public')));

// ====================================================================
// BANCO DE DADOS EM MEMÓRIA (Espelho das tabelas do schema.sql)
// ====================================================================
const categories = [
  { id: 'lanches', name: 'Lanches', iconName: 'fast-food-outline', accentColor: '#FF6D00' },
  { id: 'farmacia', name: 'Farmácia', iconName: 'medkit-outline', accentColor: '#00B0FF' },
  { id: 'bebidas', name: 'Bebidas 24h', iconName: 'beer-outline', accentColor: '#7C4DFF' },
  { id: 'petshop', name: 'Pet Shop', iconName: 'paw-outline', accentColor: '#00BFA5' },
  { id: 'leva_traz', name: 'Leva e Traz', iconName: 'bicycle-outline', accentColor: '#0052FF' },
];

const neighborhoods = [
  { id: 'bairro_1', city: 'Barbalha', name: 'Centro (Barbalha)', baseDeliveryFee: 5.00, estimatedTimeMin: 20 },
  { id: 'bairro_2', city: 'Barbalha', name: 'Santo Antônio', baseDeliveryFee: 5.50, estimatedTimeMin: 25 },
  { id: 'bairro_3', city: 'Barbalha', name: 'Cirolândia', baseDeliveryFee: 6.50, estimatedTimeMin: 30 },
  { id: 'bairro_4', city: 'Barbalha', name: 'Bela Vista / Malvinas', baseDeliveryFee: 6.50, estimatedTimeMin: 30 },
  { id: 'bairro_5', city: 'Barbalha', name: 'Rosário', baseDeliveryFee: 6.00, estimatedTimeMin: 25 },
  { id: 'bairro_6', city: 'Barbalha', name: 'Alto da Alegria', baseDeliveryFee: 6.50, estimatedTimeMin: 30 },
  { id: 'bairro_7', city: 'Barbalha', name: 'Bulandeira', baseDeliveryFee: 7.50, estimatedTimeMin: 35 },
  { id: 'bairro_8', city: 'Barbalha', name: 'Distrito de Caldas', baseDeliveryFee: 12.00, estimatedTimeMin: 45 },
  { id: 'bairro_9', city: 'Barbalha', name: 'Arajara', baseDeliveryFee: 15.00, estimatedTimeMin: 50 },
];

let products = [
  {
    id: 'prod_1',
    storeId: 'store_1',
    name: 'Prime Smash Bacon Duplo',
    description: 'Dois blends smash artesanais de 100g, queijo cheddar derretido, fatias de bacon crocante e maionese especial no pão brioche.',
    price: 34.90,
    categoryName: 'Hambúrgueres',
    badge: 'O Mais Vendido',
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    isAvailable: true,
  },
  {
    id: 'prod_2',
    storeId: 'store_1',
    name: 'Monster Cheddar Ribs',
    description: 'Blend bovino 180g recheado com queijo prato, costela bovina desfiada ao barbecue artesanal e muito creme de cheddar.',
    price: 39.90,
    categoryName: 'Hambúrgueres',
    badge: 'Favorito',
    imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80',
    isAvailable: true,
  },
  {
    id: 'prod_3',
    storeId: 'store_1',
    name: 'Classic Cheese Burger',
    description: 'Blend bovino 150g, queijo mussarela, alface americana fresca, tomate italiano e maionese verde artesanal.',
    price: 27.90,
    categoryName: 'Hambúrgueres',
    badge: null,
    imageUrl: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80',
    isAvailable: true,
  },
  {
    id: 'prod_4',
    storeId: 'store_1',
    name: 'Batata Rústica com Cheddar e Bacon',
    description: '350g de batatas cortadas à mão com casca, temperadas com páprica e alecrim, fondue de cheddar e farofa de bacon.',
    price: 24.90,
    categoryName: 'Porções & Acompanhamentos',
    badge: 'Serve 2',
    imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80',
    isAvailable: true,
  },
  {
    id: 'prod_5',
    storeId: 'store_1',
    name: 'Onion Rings Crocantes (12 un)',
    description: 'Anéis de cebola empanados e dourados na hora, servidos com molho barbecue especial.',
    price: 21.00,
    categoryName: 'Porções & Acompanhamentos',
    badge: null,
    imageUrl: 'https://images.unsplash.com/photo-1639024471287-032f667712d5?w=500&q=80',
    isAvailable: true,
  },
  {
    id: 'prod_6',
    storeId: 'store_1',
    name: 'Milkshake de Nutella com Ninho (500ml)',
    description: 'Feito com sorvete artesanal de creme, camadas generosas de Nutella e leite Ninho polvilhado.',
    price: 19.90,
    categoryName: 'Bebidas & Sobremesas',
    badge: 'Top',
    imageUrl: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80',
    isAvailable: true,
  },
  {
    id: 'prod_7',
    storeId: 'store_1',
    name: 'Coca-Cola Original 350ml (Lata)',
    description: 'Lata bem gelada.',
    price: 6.50,
    categoryName: 'Bebidas & Sobremesas',
    badge: null,
    imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80',
    isAvailable: true,
  },
];

// Estabelecimentos Parceiros em Barbalha
let stores = [
  { id: 'store_1', name: 'Pizzaria Ellen', category: 'Pizzas & Massas', address: 'Centro, Barbalha', phone: '5588988892782', commissionRate: 0.10, isOpen: true },
  { id: 'store_2', name: 'La Pasta Barbalha', category: 'Italiana & Massas', address: 'Rosário, Barbalha', phone: '5588988892782', commissionRate: 0.10, isOpen: true },
  { id: 'store_3', name: 'Filipinho Lanches', category: 'Hambúrgueres & Pasteis', address: 'Santo Antônio, Barbalha', phone: '5588988892782', commissionRate: 0.10, isOpen: true },
  { id: 'store_4', name: 'Farmácia Gentil', category: 'Medicamentos & Cuidados', address: 'Centro, Barbalha', phone: '5588988892782', commissionRate: 0.08, isOpen: true },
  { id: 'store_5', name: 'Drogaria São João', category: 'Farmácia & Perfumaria', address: 'Cirolândia, Barbalha', phone: '5588988892782', commissionRate: 0.08, isOpen: true },
  { id: 'store_6', name: 'Express Moto-Frete Barbalha', category: 'Leva e Traz • Encomendas', address: 'Barbalha e Região', phone: '5588988892782', commissionRate: 0.10, isOpen: true },
  { id: 'store_7', name: 'Open Beach Açaí & Sorvetes', category: 'Açaí na Tigela • Barcas', address: 'Av. Cel. João Coelho, 142 - Centro', phone: '5588988892782', commissionRate: 0.10, isOpen: true },
  { id: 'store_8', name: 'Joel Burguer Artesanal', category: 'Smash Burgers & Batatas', address: 'Rua Miguel de Freitas Andrade, 176 - Cirolândia', phone: '5588988892782', commissionRate: 0.10, isOpen: true },
];

// Estado dos Pedidos
let orders = [
  {
    id: 'ord_1001',
    orderCode: '#1001',
    storeName: 'Pizzaria Ellen',
    customerName: 'Esaú Monteiro',
    customerPhone: '5588988892782',
    address: 'Rua do Rosário, 120 - Centro, Barbalha - CE',
    status: 'in_preparation', // pending, accepted, in_preparation, out_for_delivery, delivered
    items: [
      {
        name: 'Pizza Carne de Sol do Cariri com Queijo Coalho',
        quantity: 1,
        unitPrice: 49.90,
        options: ['Borda Catupiry Original'],
        notes: 'Caprichar na manteiga da terra por favor',
      },
    ],
    subtotal: 49.90,
    deliveryFee: 3.50,
    total: 53.40,
    platformCommission: 5.34, // 10%
    merchantNetAmount: 48.06,
    paymentMethod: 'PIX',
    paymentStatus: 'paid',
    deliveryPin: '4821',
    driverId: null,
    driverName: null,
    driverVehicle: null,
    createdAt: new Date().toISOString(),
  },
];

// Estado do Motoboy
let driver = {
  id: 'drv_1',
  name: 'Carlos Motoboy (Barbalha)',
  phone: '5588988892782',
  vehicle: 'Honda Fan 160 (Preta)',
  plate: 'BRA-3E19',
  isOnline: true,
  currentOrderId: null,
  wallet: {
    balance: 45.00,
    todayDeliveries: 9,
    totalEarnedToday: 45.00,
    history: [
      { id: 'tx_1', orderCode: '#1001', fee: 5.00, time: '13:20', address: 'Rua do Rosário, 120 - Centro' },
      { id: 'tx_2', orderCode: '#9842', fee: 5.00, time: '14:05', address: 'Cirolândia, Barbalha' },
      { id: 'tx_3', orderCode: '#9855', fee: 6.00, time: '14:40', address: 'Bulandeira, Barbalha' },
    ],
  },
};

// Clientes conectados para atualizações em tempo real (SSE)
let sseClients = [];

// ====================================================================
// ROTAS DO APLICATIVO DO CLIENTE
// ====================================================================

app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: categories });
});

app.get('/api/neighborhoods', (req, res) => {
  res.json({ success: true, data: neighborhoods });
});

app.post('/api/orders', (req, res) => {
  const { store, items, subtotal, deliveryFee, serviceFee, total, paymentMethod, address, notes, customerName, customerPhone } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'A sacola não pode estar vazia.' });
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `#${randomNum}`;
  const deliveryPin = String(Math.floor(1000 + Math.random() * 9000));

  const commissionRate = 0.10;
  const platformCommission = Number((subtotal * commissionRate).toFixed(2));
  const merchantNetAmount = Number((subtotal - platformCommission).toFixed(2));

  const newOrder = {
    id: `ord_${randomNum}`,
    orderCode,
    storeId: store?.id || 'store_1',
    storeName: store?.name || 'Pizzaria Ellen',
    customerName: customerName || 'Esaú Monteiro',
    customerPhone: customerPhone || '5588988892782',
    address: address || 'Rua do Rosário, 120 - Centro',
    status: 'pending',
    items: items || [],
    subtotal: Number(subtotal),
    deliveryFee: Number(deliveryFee) || 5.00,
    serviceFee: Number(serviceFee) || 0.99,
    total: Number(total),
    platformCommission,
    merchantNetAmount,
    paymentMethod: paymentMethod || 'PIX',
    paymentStatus: req.body.paymentStatus || (paymentMethod === 'DINHEIRO' ? 'pending' : (paymentMethod === 'PIX' ? 'pending' : 'paid')),
    deliveryPin,
    driverId: null,
    driverName: null,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  notifyAll('NEW_ORDER', newOrder);

  // Persistência no Banco de Dados PostgreSQL Definitivo
  if (db.isAvailable()) {
    const addrStr = typeof newOrder.address === 'object' 
      ? `${newOrder.address.street || ''}, ${newOrder.address.number || ''} ${newOrder.address.complement || ''}`.trim()
      : String(newOrder.address || '');
    const neighStr = typeof newOrder.address === 'object' && newOrder.address.neighborhood
      ? (newOrder.address.neighborhood.name || 'Barbalha')
      : 'Barbalha';

    db.query(`
      INSERT INTO orders (id, customer_name, customer_phone, delivery_address, neighborhood, store_id, store_name, items, subtotal, delivery_fee, service_fee, total, payment_method, payment_status, order_status, delivery_code)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (id) DO UPDATE SET order_status = EXCLUDED.order_status, updated_at = NOW()
    `, [
      newOrder.id,
      newOrder.customerName,
      newOrder.customerPhone,
      addrStr,
      neighStr,
      newOrder.storeId,
      newOrder.storeName,
      JSON.stringify(newOrder.items),
      newOrder.subtotal,
      newOrder.deliveryFee,
      newOrder.serviceFee,
      newOrder.total,
      newOrder.paymentMethod,
      newOrder.paymentStatus,
      newOrder.status,
      newOrder.deliveryPin
    ]).catch(err => console.error('⚠️ [PG] Erro ao persistir pedido:', err.message));
  }

  console.log(`[NOVO PEDIDO] ${orderCode} recebido para ${newOrder.storeName} - Total: R$ ${newOrder.total}`);

  res.status(201).json({
    success: true,
    message: 'Pedido realizado com sucesso!',
    order: newOrder,
  });
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id || o.orderCode === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  res.json({ success: true, order });
});

// ====================================================================
// AUTENTICAÇÃO DE CLIENTES (LOGIN, CADASTRO, RECUPERAÇÃO DE SENHA)
// ====================================================================
let registeredUsers = [
  {
    id: 'user_esau',
    name: 'Esaú Monteiro',
    email: 'esau@zaptdelivery.com.br',
    phone: '(88) 98889-2782',
    city: 'Barbalha - CE',
    password: '123'
  }
];

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  // Verificar no PostgreSQL se disponível
  if (db.isAvailable()) {
    try {
      const dbRes = await db.query('SELECT * FROM users WHERE email = $1 LIMIT 1', [email.toLowerCase().trim()]);
      if (dbRes && dbRes.rows.length > 0) {
        const u = dbRes.rows[0];
        return res.json({
          success: true,
          user: { id: u.id, name: u.name, email: u.email, phone: u.phone, city: u.city || 'Barbalha - CE' }
        });
      }
    } catch (e) {
      console.error('Erro na consulta do login:', e.message);
    }
  }

  // Fallback em memória
  let user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: email.split('@')[0].toUpperCase(),
      email: email.trim(),
      phone: '(88) 98889-2782',
      city: 'Barbalha - CE',
      password
    };
    registeredUsers.push(user);
  }

  res.json({
    success: true,
    message: 'Login realizado com sucesso!',
    user: { id: user.id, name: user.name, email: user.email, phone: user.phone, city: user.city }
  });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, city } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
  }

  const userId = `usr_${Date.now()}`;
  const newUser = {
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : '',
    city: city || 'Barbalha - CE',
    password: password || '123'
  };

  registeredUsers.push(newUser);

  // Persistir no PostgreSQL se disponível
  if (db.isAvailable()) {
    db.query(`
      INSERT INTO users (id, name, email, phone, city)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, email = EXCLUDED.email
    `, [userId, newUser.name, newUser.email, newUser.phone, newUser.city])
    .catch(e => console.error('Erro ao cadastrar usuário no PostgreSQL:', e.message));
  }

  console.log(`[CADASTRO] Novo cliente cadastrado: ${newUser.name} (${newUser.email}) - ${newUser.city}`);

  res.status(201).json({
    success: true,
    message: 'Conta criada com sucesso!',
    user: { id: newUser.id, name: newUser.name, email: newUser.email, phone: newUser.phone, city: newUser.city }
  });
});

app.post('/api/auth/forgot-password', (req, res) => {
  const { email, phone } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`[RECUPERAÇÃO DE SENHA] Código ${code} gerado para ${email || phone}`);
  res.json({
    success: true,
    message: `Código de verificação enviado com sucesso para ${email || phone}!`,
    code
  });
});

// ====================================================================
// GATEWAY DE PAGAMENTO PIX AUTOMÁTICO (ASAAS + MERCADO PAGO + SIMULADOR)
// ====================================================================
const pixPayments = new Map();
let asaasDefaultCustomerId = null;

// Endpoint para verificar status do Gateway (Asaas, Mercado Pago ou Simulador)
app.get('/api/pix/config', (req, res) => {
  const hasAsaas = Boolean(process.env.ASAAS_API_KEY);
  const hasMP = Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);

  let provider = 'Simulador Inteligente (Modo Teste)';
  if (hasAsaas) provider = 'Asaas (Transferência Livre para Caixa/Next)';
  else if (hasMP) provider = 'Mercado Pago';

  res.json({
    success: true,
    provider,
    mode: (hasAsaas || hasMP) ? 'production' : 'sandbox_simulator',
    hasAsaas,
    hasMP,
  });
});

// Endpoint de diagnóstico do Asaas
app.get('/api/pix/diagnostics', async (req, res) => {
  const asaasKey = process.env.ASAAS_API_KEY;
  if (!asaasKey) return res.json({ error: 'Nenhuma chave ASAAS_API_KEY configurada' });
  const asaasUrl = asaasKey.includes('sandbox') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3';
  try {
    const custRes = await fetch(`${asaasUrl}/customers?limit=1`, {
      headers: { 'access_token': asaasKey }
    });
    const custData = await custRes.json();
    res.json({ success: custRes.ok, status: custRes.status, asaasResponse: custData });
  } catch (e) {
    res.json({ error: e.message });
  }
});

// Criar cobrança PIX dinâmica
app.post('/api/pix/create-payment', async (req, res) => {
  try {
    const { orderId, amount, customerName, customerEmail, customerPhone, description } = req.body;
    const order = orders.find((o) => o.id === orderId || o.orderCode === orderId);

    const targetAmount = Number(amount || order?.total || 10.00);
    const asaasKey = process.env.ASAAS_API_KEY;
    const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

    // -------------------------------------------------------------
    // OPÇÃO 1: ASAAS (Preferencial - Sem dívidas e transfere p/ Caixa)
    // -------------------------------------------------------------
    if (asaasKey) {
      const asaasUrl = asaasKey.includes('sandbox') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3';

      // 1.1 Obter primeiro cliente existente na conta ou cadastrar cliente
      let customerId = asaasDefaultCustomerId;
      if (!customerId) {
        try {
          const listRes = await fetch(`${asaasUrl}/customers?limit=1`, {
            headers: { 'access_token': asaasKey }
          });
          const listData = await listRes.json();
          if (listData && listData.data && listData.data.length > 0) {
            customerId = listData.data[0].id;
            asaasDefaultCustomerId = customerId;
          }
        } catch (e) {
          console.warn('[ASAAS LIST ERR]', e.message);
        }
      }

      // Se ainda não houver nenhum cliente na conta, cria um cliente consumidor
      if (!customerId) {
        try {
          const custRes = await fetch(`${asaasUrl}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasKey,
            },
            body: JSON.stringify({
              name: customerName || order?.customerName || 'Cliente Consumidor',
              cpfCnpj: '00000000000',
              mobilePhone: (customerPhone || order?.customerPhone || '11999999999').replace(/\D/g, ''),
              notificationDisabled: true,
            })
          });
          const custData = await custRes.json();
          if (custData && custData.id) {
            customerId = custData.id;
            asaasDefaultCustomerId = customerId;
          } else {
            console.warn('[ASAAS CUSTOMER AVISO]', custData);
          }
        } catch (e) {
          console.warn('[ASAAS CUSTOMER ERR]', e.message);
        }
      }

      // 1.2 Criar cobrança PIX no Asaas
      const today = new Date().toISOString().split('T')[0];
      const asaasPayRes = await fetch(`${asaasUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasKey,
        },
        body: JSON.stringify({
          customer: customerId || 'cus_000000000000',
          billingType: 'PIX',
          value: targetAmount,
          dueDate: today,
          description: description || `Pedido ${order?.orderCode || ''} - Zapt Delivery`,
          externalReference: order?.id || orderId || `ref_${Date.now()}`,
          postalService: false,
        })
      });

      const asaasPayData = await asaasPayRes.json();

      if (asaasPayData && asaasPayData.id) {
        const paymentId = asaasPayData.id;

        // 1.3 Obter QR Code e Copia e Cola
        const qrRes = await fetch(`${asaasUrl}/payments/${paymentId}/pixQrCode`, {
          headers: { 'access_token': asaasKey }
        });
        const qrData = await qrRes.json();

        const qrCode = qrData.payload;
        const qrCodeBase64 = qrData.encodedImage ? `data:image/png;base64,${qrData.encodedImage}` : null;

        pixPayments.set(paymentId, {
          paymentId,
          orderId: order?.id || orderId,
          orderCode: order?.orderCode,
          amount: targetAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          provider: 'asaas',
        });

        if (order) {
          order.paymentId = paymentId;
        }

        console.log(`[PIX ASAAS CRIADO] ID: ${paymentId} | Valor: R$ ${targetAmount} | Pedido: ${order?.orderCode}`);

        return res.json({
          success: true,
          provider: 'asaas',
          mode: 'production',
          paymentId,
          qrCode,
          qrCodeBase64,
          amount: targetAmount,
        });
      } else {
        console.error('[ERRO ASAAS API]', asaasPayData);
      }
    }

    // -------------------------------------------------------------
    // OPÇÃO 2: MERCADO PAGO (Fallback)
    // -------------------------------------------------------------
    if (mpToken) {
      const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mpToken}`,
          'X-Idempotency-Key': `${orderId || 'ord'}-${Date.now()}`
        },
        body: JSON.stringify({
          transaction_amount: targetAmount,
          description: description || `Pedido ${order?.orderCode || ''} - Zapt Delivery`,
          payment_method_id: 'pix',
          payer: {
            email: customerEmail || 'cliente@zaptdelivery.com.br',
            first_name: customerName || order?.customerName || 'Cliente Zapt',
          },
          external_reference: order?.id || orderId || `ref_${Date.now()}`,
          notification_url: `${req.protocol}://${req.get('host')}/api/webhooks/mercadopago`
        })
      });

      const mpData = await mpResponse.json();

      if (mpData.id && mpData.point_of_interaction?.transaction_data) {
        const paymentId = String(mpData.id);
        const qrCode = mpData.point_of_interaction.transaction_data.qr_code;
        const qrCodeBase64 = mpData.point_of_interaction.transaction_data.qr_code_base64;
        const ticketUrl = mpData.point_of_interaction.transaction_data.ticket_url;

        pixPayments.set(paymentId, {
          paymentId,
          orderId: order?.id || orderId,
          orderCode: order?.orderCode,
          amount: targetAmount,
          status: 'pending',
          createdAt: new Date().toISOString(),
          provider: 'mercadopago',
        });

        if (order) {
          order.paymentId = paymentId;
        }

        console.log(`[PIX MERCADO PAGO CRIADO] ID: ${paymentId} | Valor: R$ ${targetAmount} | Pedido: ${order?.orderCode}`);

        return res.json({
          success: true,
          provider: 'mercadopago',
          mode: 'production',
          paymentId,
          qrCode,
          qrCodeBase64: `data:image/png;base64,${qrCodeBase64}`,
          ticketUrl,
          amount: targetAmount,
        });
      } else {
        console.error('[ERRO MERCADO PAGO API]', mpData);
      }
    }

    // -------------------------------------------------------------
    // OPÇÃO 3: MODO SIMULADOR INTELIGENTE (Permite testar tudo de graça sem cadastro)
    // -------------------------------------------------------------
    const simulatedPaymentId = `pix_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;
    const pixKey = 'pix@zaptdelivery.com.br';
    const fakeEMV = `00020126580014br.gov.bcb.pix0136${pixKey}520400005303986540${targetAmount.toFixed(2)}5802BR5915ZAPT DELIVERY6009SAO PAULO62070503${simulatedPaymentId.slice(-4)}6304`;
    const simulatedQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(fakeEMV)}&color=0052FF`;

    pixPayments.set(simulatedPaymentId, {
      paymentId: simulatedPaymentId,
      orderId: order?.id || orderId,
      orderCode: order?.orderCode,
      amount: targetAmount,
      status: 'pending',
      createdAt: new Date().toISOString(),
      provider: 'simulator',
    });

    if (order) {
      order.paymentId = simulatedPaymentId;
    }

    console.log(`[PIX SIMULADOR CRIADO] ID: ${simulatedPaymentId} | Valor: R$ ${targetAmount} | Pedido: ${order?.orderCode}`);

    return res.json({
      success: true,
      provider: 'simulator',
      mode: 'sandbox_simulator',
      paymentId: simulatedPaymentId,
      qrCode: fakeEMV,
      qrCodeUrl: simulatedQrCodeUrl,
      amount: targetAmount,
    });
  } catch (err) {
    console.error('[ERRO AO CRIAR PIX]', err);
    res.status(500).json({ error: 'Erro ao gerar cobrança PIX', details: err.message });
  }
});

// Consultar status do pagamento PIX (Polling pelo App)
app.get('/api/pix/status/:paymentId', async (req, res) => {
  const { paymentId } = req.params;
  const asaasKey = process.env.ASAAS_API_KEY;
  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;

  let paymentRecord = pixPayments.get(paymentId);

  // Consulta Asaas
  if (asaasKey && (!paymentRecord || paymentRecord.status !== 'approved')) {
    try {
      const asaasUrl = asaasKey.includes('sandbox') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3';
      const asaasRes = await fetch(`${asaasUrl}/payments/${paymentId}`, {
        headers: { 'access_token': asaasKey },
      });
      if (asaasRes.ok) {
        const asaasData = await asaasRes.json();
        if (asaasData.status === 'RECEIVED' || asaasData.status === 'CONFIRMED') {
          if (!paymentRecord) {
            paymentRecord = { paymentId, status: 'approved' };
            pixPayments.set(paymentId, paymentRecord);
          } else {
            paymentRecord.status = 'approved';
          }

          const order = orders.find(
            (o) => o.paymentId === paymentId || o.id === asaasData.externalReference
          );
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.status = 'in_preparation';
            order.paidAt = new Date().toISOString();
            notifyAll('STATUS_CHANGE', order);
            console.log(`[PIX APROVADO ASAAS] Pedido ${order.orderCode} pago via Asaas!`);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar Asaas:', e.message);
    }
  }

  // Consulta Mercado Pago
  if (mpToken && (!paymentRecord || paymentRecord.status !== 'approved')) {
    try {
      const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${mpToken}` },
      });
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        if (mpData.status === 'approved') {
          if (!paymentRecord) {
            paymentRecord = { paymentId, status: 'approved' };
            pixPayments.set(paymentId, paymentRecord);
          } else {
            paymentRecord.status = 'approved';
          }

          const order = orders.find(
            (o) => o.paymentId === paymentId || o.id === mpData.external_reference
          );
          if (order && order.paymentStatus !== 'paid') {
            order.paymentStatus = 'paid';
            order.status = 'in_preparation';
            order.paidAt = new Date().toISOString();
            notifyAll('STATUS_CHANGE', order);
            console.log(`[PIX APROVADO MP] Pedido ${order.orderCode} pago via Mercado Pago!`);
          }
        }
      }
    } catch (e) {
      console.warn('Erro ao consultar Mercado Pago:', e.message);
    }
  }

  if (!paymentRecord) {
    const order = orders.find((o) => o.paymentId === paymentId);
    if (order) {
      return res.json({
        success: true,
        paymentId,
        status: order.paymentStatus === 'paid' ? 'approved' : 'pending',
        orderId: order.id,
        orderCode: order.orderCode,
      });
    }
    return res.status(404).json({ error: 'Cobrança PIX não encontrada' });
  }

  res.json({
    success: true,
    paymentId,
    status: paymentRecord.status,
    orderId: paymentRecord.orderId,
    orderCode: paymentRecord.orderCode,
  });
});

// Simular aprovação instantânea (Botão do modo teste no App e no Painel)
app.post('/api/pix/simulate-approval/:paymentId', (req, res) => {
  const { paymentId } = req.params;
  const paymentRecord = pixPayments.get(paymentId);

  const order = orders.find(
    (o) => o.paymentId === paymentId || o.id === paymentRecord?.orderId || o.orderCode === paymentRecord?.orderCode
  );

  if (paymentRecord) {
    paymentRecord.status = 'approved';
    paymentRecord.paidAt = new Date().toISOString();
  }

  if (order) {
    order.paymentStatus = 'paid';
    order.status = 'in_preparation';
    order.paidAt = new Date().toISOString();
    notifyAll('STATUS_CHANGE', order);
    console.log(`[PIX SIMULADO APROVADO] Pedido ${order.orderCode} marcado como pago e em preparo!`);
  }

  res.json({
    success: true,
    message: 'Pagamento PIX simulado aprovado com sucesso!',
    paymentId,
    order,
  });
});

// Webhook Oficial do Asaas
app.post('/api/webhooks/asaas', async (req, res) => {
  try {
    const { event, payment } = req.body || {};
    console.log(`[WEBHOOK ASAAS RECEBIDO] Evento: ${event} | ID: ${payment?.id}`);

    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const paymentId = payment?.id;
      const externalRef = payment?.externalReference;

      let paymentRecord = pixPayments.get(paymentId);
      if (paymentRecord) {
        paymentRecord.status = 'approved';
      }

      const order = orders.find(
        (o) => o.paymentId === paymentId || o.id === externalRef || o.orderCode === externalRef
      );

      if (order && order.paymentStatus !== 'paid') {
        order.paymentStatus = 'paid';
        order.status = 'in_preparation';
        order.paidAt = new Date().toISOString();
        notifyAll('STATUS_CHANGE', order);
        console.log(`[WEBHOOK ASAAS PIX APROVADO] Pedido ${order.orderCode} aprovado na cozinha!`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('[ERRO WEBHOOK ASAAS]', err);
    res.status(200).json({ received: true });
  }
});

// Webhook Oficial do Mercado Pago
app.post('/api/webhooks/mercadopago', async (req, res) => {
  try {
    const paymentId = req.query['data.id'] || req.body?.data?.id || req.body?.id;
    const action = req.body?.action || req.query?.topic;

    console.log(`[WEBHOOK MERCADO PAGO RECEBIDO] ID: ${paymentId} | Action: ${action}`);

    if (paymentId) {
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (mpToken) {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: { Authorization: `Bearer ${mpToken}` },
        });
        if (mpRes.ok) {
          const mpData = await mpRes.json();
          if (mpData.status === 'approved') {
            const order = orders.find(
              (o) => o.paymentId === String(paymentId) || o.id === mpData.external_reference
            );
            if (order) {
              order.paymentStatus = 'paid';
              order.status = 'in_preparation';
              order.paidAt = new Date().toISOString();
              notifyAll('STATUS_CHANGE', order);
              console.log(`[WEBHOOK PIX APROVADO] Pedido ${order.orderCode} aprovado na cozinha!`);
            }
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (err) {
    console.error('[ERRO WEBHOOK MERCADO PAGO]', err);
    res.status(200).send('OK');
  }
});

// ====================================================================
// ROTAS DE PAGAMENTO COM CARTÃO DE CRÉDITO (ASAAS GATEWAY)
// ====================================================================

app.post('/api/card/create-payment', async (req, res) => {
  try {
    const {
      amount,
      storeName,
      cardholderName,
      cardNumber,
      expiryMonth,
      expiryYear,
      cvv,
      cpf,
      customerName,
      customerPhone,
      installments,
    } = req.body;

    const targetAmount = Number(amount || 10.00);
    const asaasKey = process.env.ASAAS_API_KEY;

    if (asaasKey) {
      const asaasUrl = asaasKey.includes('sandbox') ? 'https://api-sandbox.asaas.com/v3' : 'https://api.asaas.com/v3';

      let customerId = asaasDefaultCustomerId;
      if (!customerId) {
        try {
          const listRes = await fetch(`${asaasUrl}/customers?limit=1`, {
            headers: { 'access_token': asaasKey }
          });
          const listData = await listRes.json();
          if (listData && listData.data && listData.data.length > 0) {
            customerId = listData.data[0].id;
            asaasDefaultCustomerId = customerId;
          }
        } catch (e) {
          console.warn('[ASAAS CARD LIST ERR]', e.message);
        }
      }

      if (!customerId) {
        try {
          const custRes = await fetch(`${asaasUrl}/customers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'access_token': asaasKey,
            },
            body: JSON.stringify({
              name: customerName || cardholderName || 'Cliente Zapt Barbalha',
              cpfCnpj: (cpf || '00000000000').replace(/\D/g, ''),
              mobilePhone: (customerPhone || '88988892782').replace(/\D/g, ''),
              notificationDisabled: true,
            })
          });
          const custData = await custRes.json();
          if (custData && custData.id) {
            customerId = custData.id;
            asaasDefaultCustomerId = customerId;
          }
        } catch (e) {
          console.warn('[ASAAS CARD CUST ERR]', e.message);
        }
      }

      const today = new Date().toISOString().split('T')[0];
      const cardPayload = {
        customer: customerId || 'cus_000000000000',
        billingType: 'CREDIT_CARD',
        value: targetAmount,
        dueDate: today,
        description: `Pedido Zapt Delivery - ${storeName || 'Barbalha'}`,
        creditCard: {
          holderName: cardholderName,
          number: (cardNumber || '').replace(/\s/g, ''),
          expiryMonth: String(expiryMonth || '12').padStart(2, '0'),
          expiryYear: String(expiryYear).length === 2 ? `20${expiryYear}` : String(expiryYear || '2028'),
          ccv: String(cvv || '123'),
        },
        creditCardHolderInfo: {
          name: cardholderName,
          email: 'cliente@zaptdelivery.com.br',
          cpfCnpj: (cpf || '00000000000').replace(/\D/g, ''),
          postalCode: '63180000', // Barbalha - CE
          addressNumber: '120',
          phone: (customerPhone || '88988892782').replace(/\D/g, ''),
        },
        installmentCount: Number(installments) || 1,
        postalService: false,
      };

      const asaasPayRes = await fetch(`${asaasUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': asaasKey,
        },
        body: JSON.stringify(cardPayload),
      });

      const asaasData = await asaasPayRes.json();

      if (asaasData && asaasData.id && (asaasData.status === 'CONFIRMED' || asaasData.status === 'RECEIVED')) {
        console.log(`[CARTAO APROVADO ASAAS] ID: ${asaasData.id} | R$ ${targetAmount}`);
        return res.json({
          success: true,
          provider: 'asaas',
          transactionId: asaasData.id,
          status: asaasData.status,
          amount: targetAmount,
        });
      }

      if (asaasData && asaasData.errors && asaasData.errors.length > 0) {
        console.warn('[ASAAS CARD AVISO]', asaasData.errors);
        return res.json({
          success: false,
          error: asaasData.errors[0]?.description || 'Cartão não autorizado pela operadora.',
        });
      }
    }

    // Modo contingência / teste local garantido
    const mockTxId = `card_tx_${Date.now()}`;
    console.log(`[CARTAO SIMULADO APROVADO] ID: ${mockTxId} | R$ ${targetAmount}`);
    return res.json({
      success: true,
      provider: 'demo',
      transactionId: mockTxId,
      status: 'CONFIRMED',
      amount: targetAmount,
    });
  } catch (err) {
    console.error('[ERRO CARTAO ENDPOINT]', err.message);
    res.status(500).json({ success: false, error: 'Erro ao processar transação de cartão.' });
  }
});


// ====================================================================
// ROTAS DE GESTÃO DE PEDIDOS (COZINHA / PAINEL)
// ====================================================================

app.get('/api/merchant/orders', (req, res) => {
  res.json({ success: true, orders });
});

app.patch('/api/merchant/orders/:id/status', (req, res) => {
  const { status, paymentStatus } = req.body;
  const order = orders.find((o) => o.id === req.params.id || o.orderCode === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  if (status) order.status = status;
  if (paymentStatus) {
    order.paymentStatus = paymentStatus;
  } else if (status === 'in_preparation' && order.paymentMethod === 'PIX') {
    // Ao aceitar o pedido para preparo, o lojista aprova o pedido e o PIX
    order.paymentStatus = 'paid';
  }

  order.updatedAt = new Date().toISOString();
  notifyAll('STATUS_CHANGE', order);

  console.log(`[STATUS ATUALIZADO] Pedido ${order.orderCode} mudou para: ${order.status} | Pagamento: ${order.paymentStatus}`);
  res.json({ success: true, message: `Status alterado para ${order.status}`, order });
});

// Endpoint exclusivo para o restaurante confirmar pagamento do PIX com 1 clique
app.patch('/api/merchant/orders/:id/confirm-payment', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id || o.orderCode === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }
  order.paymentStatus = 'paid';
  order.updatedAt = new Date().toISOString();
  notifyAll('STATUS_CHANGE', order);
  console.log(`[PAGAMENTO CONFIRMADO PELO RESTAURANTE] Pedido ${order.orderCode} marcado como PAGO!`);
  res.json({ success: true, message: 'Pagamento confirmado com sucesso!', order });
});

// ====================================================================
// ROTAS DO MOTOBOY / ENTREGADOR
// ====================================================================

// Perfil do Motoboy, Status e Pedido Ativo
app.get('/api/driver/me', (req, res) => {
  let activeOrder = null;
  if (driver.currentOrderId) {
    activeOrder = orders.find((o) => o.id === driver.currentOrderId || o.orderCode === driver.currentOrderId);
    if (!activeOrder || activeOrder.status === 'delivered') {
      driver.currentOrderId = null;
      activeOrder = null;
    }
  }
  res.json({
    success: true,
    driver,
    activeOrder,
  });
});

// Alternar Online / Offline
app.post('/api/driver/toggle-online', (req, res) => {
  driver.isOnline = !driver.isOnline;
  console.log(`[MOTOBOY] ${driver.name} agora está ${driver.isOnline ? '🟢 ONLINE' : '🔴 OFFLINE'}`);
  res.json({ success: true, isOnline: driver.isOnline });
});

// Listar chamadas disponíveis para entrega
app.get('/api/driver/orders/available', (req, res) => {
  const available = orders.filter(
    (o) =>
      (o.status === 'in_preparation' || o.status === 'out_for_delivery') &&
      (!o.driverId || o.id === driver.currentOrderId) &&
      o.status !== 'delivered'
  );
  res.json({ success: true, orders: available });
});

// Motoboy aceita a corrida
app.post('/api/driver/orders/:id/accept', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id || o.orderCode === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (order.status === 'delivered') return res.status(400).json({ error: 'Pedido já foi entregue.' });

  order.status = 'out_for_delivery';
  order.driverId = driver.id;
  order.driverName = driver.name;
  order.driverPhone = driver.phone;
  order.driverVehicle = driver.vehicle;
  order.driverPlate = driver.plate;
  order.updatedAt = new Date().toISOString();

  driver.currentOrderId = order.id;

  notifyAll('STATUS_CHANGE', order);
  console.log(`[MOTOBOY] Pedido ${order.orderCode} aceito por ${driver.name}`);
  res.json({ success: true, message: 'Corrida aceita com sucesso!', order });
});

// Motoboy confirma entrega digitando o PIN do cliente
app.post('/api/driver/orders/:id/deliver', (req, res) => {
  const { pin } = req.body;
  const order = orders.find((o) => o.id === req.params.id || o.orderCode === req.params.id);
  if (!order) return res.status(404).json({ error: 'Pedido não encontrado.' });
  if (order.status === 'delivered') return res.status(400).json({ error: 'Pedido já foi entregue anteriormente.' });

  if (!pin || String(order.deliveryPin).trim() !== String(pin).trim()) {
    return res.status(400).json({
      error: 'PIN incorreto! Solicite ao cliente o código de 4 dígitos exibido na tela de rastreio do app.',
    });
  }

  order.status = 'delivered';
  order.deliveredAt = new Date().toISOString();
  order.updatedAt = new Date().toISOString();

  const fee = order.deliveryFee || 5.00;
  driver.currentOrderId = null;
  driver.wallet.balance = Number((driver.wallet.balance + fee).toFixed(2));
  driver.wallet.todayDeliveries += 1;
  driver.wallet.totalEarnedToday = Number((driver.wallet.totalEarnedToday + fee).toFixed(2));

  driver.wallet.history.unshift({
    id: `tx_${Date.now()}`,
    orderCode: order.orderCode,
    fee: fee,
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    address: order.address,
  });

  notifyAll('STATUS_CHANGE', order);
  console.log(`[ENTREGA CONCLUÍDA] Pedido ${order.orderCode} finalizado com sucesso! PIN validado (${pin}). Taxa de R$ ${fee.toFixed(2)} creditada a ${driver.name}.`);

  res.json({
    success: true,
    message: `🎉 Entrega confirmada! R$ ${fee.toFixed(2)} creditados na sua carteira.`,
    order,
    wallet: driver.wallet,
  });
});

// Saque PIX dos ganhos do motoboy
app.post('/api/driver/wallet/withdraw', (req, res) => {
  const { pixKey, pixKeyType } = req.body;
  if (!pixKey) return res.status(400).json({ error: 'Chave PIX é obrigatória.' });
  if (driver.wallet.balance <= 0) return res.status(400).json({ error: 'Saldo insuficiente para saque.' });

  const withdrawnAmount = driver.wallet.balance;
  driver.wallet.balance = 0;

  console.log(`[SAQUE PIX MOTOBOY] R$ ${withdrawnAmount.toFixed(2)} enviado para ${pixKey} (${pixKeyType || 'Chave'})`);
  res.json({
    success: true,
    message: `Saque de R$ ${withdrawnAmount.toFixed(2)} processado via PIX com sucesso!`,
    amount: withdrawnAmount,
    pixKey,
    txId: `PIX-${Date.now()}`,
  });
});

// ====================================================================
// ROTAS DE GESTÃO DE CARDÁPIO (PRODUTOS, PREÇOS E PAUSAR ITENS)
// ====================================================================

app.get('/api/merchant/products', (req, res) => {
  res.json({ success: true, products });
});

app.post('/api/merchant/products', (req, res) => {
  const { name, description, price, categoryName, badge, imageUrl } = req.body;
  if (!name || !price) {
    return res.status(400).json({ error: 'Nome e preço são obrigatórios.' });
  }

  const newProduct = {
    id: `prod_${Date.now()}`,
    storeId: 'store_1',
    name,
    description: description || '',
    price: Number(price),
    categoryName: categoryName || 'Hambúrgueres',
    badge: badge || null,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80',
    isAvailable: true,
  };

  products.unshift(newProduct);
  console.log(`[NOVO PRODUTO] ${newProduct.name} adicionado ao cardápio - R$ ${newProduct.price}`);
  res.status(201).json({ success: true, product: newProduct });
});

app.patch('/api/merchant/products/:id/toggle', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

  product.isAvailable = !product.isAvailable;
  console.log(`[CARDÁPIO] Produto ${product.name} agora está: ${product.isAvailable ? 'DISPONÍVEL' : 'PAUSADO / ESGOTADO'}`);
  res.json({ success: true, product });
});

app.patch('/api/merchant/products/:id', (req, res) => {
  const product = products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Produto não encontrado.' });

  const { name, description, price, categoryName, badge, imageUrl } = req.body;
  if (name !== undefined) product.name = name;
  if (description !== undefined) product.description = description;
  if (price !== undefined) product.price = Number(price);
  if (categoryName !== undefined) product.categoryName = categoryName;
  if (badge !== undefined) product.badge = badge;
  if (imageUrl !== undefined) product.imageUrl = imageUrl;

  console.log(`[CARDÁPIO] Produto ${product.name} editado - Novo preço: R$ ${product.price}`);
  res.json({ success: true, product });
});

app.delete('/api/merchant/products/:id', (req, res) => {
  const initialLen = products.length;
  products = products.filter((p) => p.id !== req.params.id);
  if (products.length === initialLen) {
    return res.status(404).json({ error: 'Produto não encontrado.' });
  }
  console.log(`[CARDÁPIO] Produto removido.`);
  res.json({ success: true, message: 'Produto excluído com sucesso.' });
});

// ====================================================================
// TEMPO REAL COM SERVER-SENT EVENTS (SSE)
// ====================================================================
app.get('/api/realtime', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const clientId = Date.now();
  const newClient = { id: clientId, res };
  sseClients.push(newClient);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

function notifyAll(type, order) {
  sseClients.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify({ type, order })}\n\n`);
    } catch (e) {
      // client disconnected
    }
  });
}

// ====================================================================
// ROBÔ DE ATENDIMENTO WHATSAPP & SUPORTE AUTÔNOMO (ZAPT BOT)
// ====================================================================
app.post('/api/bot/message', async (req, res) => {
  const { phone, text, customerName } = req.body;
  if (!phone || !text) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
  }
  const result = await bot.processIncomingMessage(phone, text, { customerName });
  res.json({ success: true, ...result });
});

app.post('/api/bot/store-response', (req, res) => {
  const { ticketId, responseCode, customNotes } = req.body;
  if (!ticketId || !responseCode) {
    return res.status(400).json({ error: 'ID do chamado e código de resposta são obrigatórios.' });
  }
  const result = bot.handleStoreResponse(ticketId, responseCode, customNotes);
  if (!result) {
    return res.status(404).json({ error: 'Chamado não encontrado.' });
  }
  notifyAll('SUPPORT_STORE_RESPONSE', result);
  res.json({ success: true, ...result });
});

app.get('/api/bot/tickets', (req, res) => {
  res.json({ success: true, tickets: bot.getTickets() });
});

app.get('/api/bot/sessions', (req, res) => {
  res.json({ success: true, sessions: bot.getSessions() });
});

// Webhook para WhatsApp (compatível com Z-API, Evolution API, Baileys, Meta Cloud API)
app.post('/api/bot/webhook', async (req, res) => {
  try {
    const body = req.body;
    const phone = body.phone || body.sender || body.from || (body.data && body.data.key && body.data.key.remoteJid);
    const message = body.text || body.message || (body.data && body.data.message && (body.data.message.conversation || body.data.message.extendedTextMessage?.text));
    const customerName = body.senderName || body.pushName || 'Cliente WhatsApp';

    if (phone && message) {
      const result = await bot.processIncomingMessage(phone, message, { customerName });
      console.log(`[WHATSAPP WEBHOOK] De: ${phone} -> Resposta: "${result.reply.slice(0, 50)}..."`);
      return res.json({ success: true, reply: result.reply });
    }
    res.json({ status: 'ignored_or_event' });
  } catch (err) {
    console.error('Erro no Webhook do WhatsApp:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ====================================================================
// CONEXÃO WHATSAPP EM TEMPO REAL (Baileys / QR Code)
// ====================================================================
app.get('/api/whatsapp/status', (req, res) => {
  res.json(whatsapp.getStatus());
});

app.post('/api/whatsapp/send-test', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
  }
  const result = await whatsapp.sendWhatsAppMessage(phone, message);
  res.json(result);
});

app.post('/api/whatsapp/disconnect', async (req, res) => {
  const result = await whatsapp.disconnectWhatsApp();
  res.json(result);
});

// Inicializar Servidor
app.listen(PORT, async () => {
  console.log(`=================================================`);
  console.log(`🚀 SERVIDOR DO DELIVERY RODANDO NA PORTA ${PORT}`);
  console.log(`🔗 API Local: http://localhost:${PORT}/api/categories`);
  console.log(`🖥️ Painel Restaurante: http://localhost:${PORT}/painel`);
  console.log(`🛵 Painel do Motoboy: http://localhost:${PORT}/motoboy`);
  console.log(`🤖 Robô Zapt Bot: http://localhost:${PORT}/painel/bot.html`);
  console.log(`📲 Conectar WhatsApp: http://localhost:${PORT}/whatsapp`);
  console.log(`=================================================`);

  // Inicializa o Robô de Atendimento com acesso aos pedidos, lojas e envio WhatsApp
  bot.initBot(orders, stores, notifyAll, whatsapp.sendWhatsAppMessage);

  // Iniciar conexão com WhatsApp via Baileys (gera QR Code)
  whatsapp.startWhatsApp();

  // Inicializa tabelas do PostgreSQL se configurado
  await db.initDatabase();
});
