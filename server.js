const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Servir o Painel Web do Restaurante (Gestor de Pedidos e Cardápio)
app.use('/painel', express.static(path.join(__dirname, 'public')));
app.get('/motoboy', (req, res) => res.sendFile(path.join(__dirname, 'public', 'motoboy.html')));
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
  { id: 'bairro_1', name: 'Centro', baseDeliveryFee: 3.50, estimatedTimeMin: 25 },
  { id: 'bairro_2', name: 'Jardim América', baseDeliveryFee: 5.00, estimatedTimeMin: 30 },
  { id: 'bairro_3', name: 'Vila Nova', baseDeliveryFee: 6.00, estimatedTimeMin: 35 },
  { id: 'bairro_4', name: 'Bairro Industrial', baseDeliveryFee: 7.50, estimatedTimeMin: 40 },
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

// Estado dos Pedidos
let orders = [
  {
    id: 'ord_1001',
    orderCode: '#1001',
    storeName: 'Burguer Prime Artesanal',
    customerName: 'Lucas Silva',
    customerPhone: '5511999993333',
    address: 'Rua das Flores, 142 - Centro',
    status: 'in_preparation', // pending, accepted, in_preparation, out_for_delivery, delivered
    items: [
      {
        name: 'Prime Smash Bacon Duplo',
        quantity: 1,
        unitPrice: 34.90,
        options: ['Ao Ponto', 'Bacon Artesanal Extra'],
        notes: 'Sem cebola por favor',
      },
    ],
    subtotal: 39.90,
    deliveryFee: 5.00,
    total: 44.90,
    platformCommission: 3.99, // 10%
    merchantNetAmount: 35.91,
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
  name: 'Carlos Motoboy',
  phone: '5511988887777',
  vehicle: 'Honda Fan 160 (Preta)',
  plate: 'BRA-3E19',
  isOnline: true,
  currentOrderId: null,
  wallet: {
    balance: 38.50,
    todayDeliveries: 7,
    totalEarnedToday: 38.50,
    history: [
      { id: 'tx_1', orderCode: '#1001', fee: 5.50, time: '13:20', address: 'Rua das Flores, 142' },
      { id: 'tx_2', orderCode: '#9842', fee: 6.00, time: '14:05', address: 'Av. Brasil, 890' },
      { id: 'tx_3', orderCode: '#9855', fee: 5.00, time: '14:40', address: 'Rua Paraná, 55' },
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
  const { store, items, subtotal, deliveryFee, total, paymentMethod, address, notes } = req.body;

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
    storeName: store?.name || 'Burguer Prime Artesanal',
    customerName: 'Cliente App',
    customerPhone: '5511999990000',
    address: address || 'Rua das Flores, 142 - Centro',
    status: 'pending',
    items: items || [],
    subtotal: Number(subtotal),
    deliveryFee: Number(deliveryFee) || 5.00,
    total: Number(total),
    platformCommission,
    merchantNetAmount,
    paymentMethod: paymentMethod || 'PIX',
    paymentStatus: paymentMethod === 'PIX' ? 'paid' : 'pending',
    deliveryPin,
    driverId: null,
    driverName: null,
    notes: notes || '',
    createdAt: new Date().toISOString(),
  };

  orders.unshift(newOrder);
  notifyAll('NEW_ORDER', newOrder);

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
// ROTAS DE GESTÃO DE PEDIDOS (COZINHA / PAINEL)
// ====================================================================

app.get('/api/merchant/orders', (req, res) => {
  res.json({ success: true, orders });
});

app.patch('/api/merchant/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const order = orders.find((o) => o.id === req.params.id || o.orderCode === req.params.id);

  if (!order) {
    return res.status(404).json({ error: 'Pedido não encontrado.' });
  }

  order.status = status;
  order.updatedAt = new Date().toISOString();
  notifyAll('STATUS_CHANGE', order);

  console.log(`[STATUS ATUALIZADO] Pedido ${order.orderCode} mudou para: ${status}`);
  res.json({ success: true, message: `Status alterado para ${status}`, order });
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

// Inicializar Servidor
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 SERVIDOR DO DELIVERY RODANDO NA PORTA ${PORT}`);
  console.log(`🔗 API Local: http://localhost:${PORT}/api/categories`);
  console.log(`🖥️ Painel Restaurante: http://localhost:${PORT}/painel`);
  console.log(`🛵 Painel do Motoboy: http://localhost:${PORT}/motoboy`);
  console.log(`=================================================`);
});
