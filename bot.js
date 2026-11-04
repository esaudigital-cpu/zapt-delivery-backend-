/**
 * ====================================================================
 * ZAPT BOT - ROBÔ DE ATENDIMENTO RÁPIDO & RESOLUÇÃO COM ESTABELECIMENTOS
 * Suporte Oficial Zapt Delivery - Barbalha, Ceará
 * Direção: Esaú Monteiro - WhatsApp: (88) 98889-2782
 * ====================================================================
 */

const botSessions = new Map();
const supportTickets = [];

// Referência global aos dados do servidor (injetados via initBot)
let serverOrders = [];
let serverStores = [];
let notifyFunction = null;
let whatsappMessenger = null;

function initBot(ordersRef, storesRef, notifyFn, whatsappMessengerFn) {
  serverOrders = ordersRef;
  serverStores = storesRef;
  notifyFunction = notifyFn;
  whatsappMessenger = whatsappMessengerFn;
  console.log('🤖 [ZAPT BOT] Robô de Atendimento do WhatsApp inicializado!');
}

/**
 * Processa a mensagem recebida de um cliente (via WhatsApp ou App)
 */
async function processIncomingMessage(phone, text, meta = {}) {
  const cleanPhone = String(phone).replace(/\D/g, '');
  const cleanText = (text || '').trim();
  const lowerText = cleanText.toLowerCase();

  // Buscar ou criar sessão do cliente
  let session = botSessions.get(cleanPhone);
  const now = Date.now();

  // Reset de sessão se inativa por mais de 30 minutos
  if (!session || (now - session.lastActivity > 30 * 60 * 1000)) {
    session = {
      phone: cleanPhone,
      customerName: meta.customerName || 'Cliente Zapt',
      step: 'START',
      activeOrderId: null,
      storeId: null,
      issueType: null,
      lastActivity: now,
      history: [],
    };
    botSessions.set(cleanPhone, session);
  }

  session.lastActivity = now;
  session.history.push({ sender: 'customer', text: cleanText, time: new Date().toISOString() });

  // Tentar identificar o pedido mais recente desse cliente
  const recentOrder = serverOrders.find(
    (o) => o.customerPhone && o.customerPhone.replace(/\D/g, '').includes(cleanPhone.slice(-8))
  );

  if (recentOrder) {
    session.activeOrderId = recentOrder.id;
    session.storeId = recentOrder.storeId;
    session.storeName = recentOrder.storeName;
    session.orderCode = recentOrder.orderCode;
  }

  let botResponse = '';
  let autoActions = [];

  // ==================================================================
  // FLUXO DE CONVERSAÇÃO DO ROBÔ
  // ==================================================================

  // 1. PRIMEIRA CHAMADA / REINÍCIO OU SAUDAÇÃO
  if (
    session.step === 'START' ||
    ['oi', 'olá', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'menu', 'iniciar', 'ajuda', 'suporte'].includes(lowerText)
  ) {
    session.step = 'AWAITING_CHOICE';

    let orderBadge = '';
    if (session.orderCode) {
      orderBadge = `\n📍 *Pedido Identificado:* ${session.orderCode} na loja *${session.storeName}*\n`;
    }

    botResponse = 
`⚡ *Olá! Bem-vindo ao Suporte do Zapt Delivery!* ⚡
Sou o assistente virtual da plataforma e estou aqui para te responder na hora!
${orderBadge}
Como posso te ajudar agora? Digite o número da opção:

*1* - ⏳ Meu pedido está demorando / atrasado
*2* - ❌ Veio item faltando ou trocado
*3* - 🛵 Quero saber onde está o motoboy
*4* - 💳 Dúvida sobre pagamento / Pix
*5* - 💬 Outros assuntos (descreva o que precisa)`;

    return formatReply(session, botResponse, autoActions);
  }

  // 2. OPÇÃO 1: PEDIDO DEMORANDO / ATRASADO
  if (cleanText === '1' || lowerText.includes('atras') || lowerText.includes('demor')) {
    session.step = 'STORE_INVESTIGATION';
    session.issueType = 'ATRASO';

    const storeName = session.storeName || 'o estabelecimento parceiro';
    const orderCode = session.orderCode || 'seu pedido recente';

    // AÇÃO AUTÔNOMA DO ROBÔ: Acionar a loja imediatamente
    triggerAutonomousStoreCheck(session, 'PEDIDO ATRASADO');

    botResponse = 
`🚨 *Entendido! Não vamos te deixar esperando.*

Já acionei a cozinha da *${storeName}* em tempo real para verificar a situação do seu pedido (*${orderCode}*).

O gerente da loja já recebeu o alerta na tela da cozinha e está verificando se a comanda já saiu para entrega ou o tempo exato para o motoboy retirar.

⏳ *Estou aguardando a confirmação da loja e te respondo aqui em instantes...*`;

    return formatReply(session, botResponse, ['STORE_ALERT_SENT']);
  }

  // 3. OPÇÃO 2: ITEM FALTANDO OU ERRADO
  if (cleanText === '2' || lowerText.includes('falt') || lowerText.includes('errad')) {
    session.step = 'STORE_INVESTIGATION';
    session.issueType = 'ITEM_ERRADO';

    const storeName = session.storeName || 'a loja';
    const orderCode = session.orderCode || 'seu pedido';

    triggerAutonomousStoreCheck(session, 'ITEM FALTANDO OU TROCADO');

    botResponse = 
`⚠️ *Sentimos muito por isso! Vamos resolver imediatamente.*

Notifiquei a gerência da *${storeName}* sobre a divergência no pedido *${orderCode}*.

O estabelecimento foi instruído a entrar em contato com você ou enviar o item faltante imediatamente com nosso motoboy expresso.

Qual item veio trocado ou faltando? (Pode digitar o nome do produto ou mandar uma foto aqui que repasso à cozinha na hora!)`;

    return formatReply(session, botResponse, ['STORE_ALERT_SENT']);
  }

  // 4. OPÇÃO 3: RASTREIO DO MOTOBOY
  if (cleanText === '3' || lowerText.includes('motoboy') || lowerText.includes('entregador')) {
    const order = serverOrders.find((o) => o.id === session.activeOrderId);

    if (order && order.status === 'out_for_delivery') {
      botResponse = 
`🛵 *Seu pedido já está em trânsito com o motoboy!*

Ele está a caminho do seu endereço em Barbalha. 
Lembre-se de deixar o telefone por perto e o seu PIN de confirmação com quem for receber: *${order.deliveryPin || '1234'}*.`;
    } else if (order && (order.status === 'in_preparation' || order.status === 'accepted')) {
      botResponse = 
`👨‍🍳 *Seu pedido ainda está na cozinha da ${session.storeName || 'loja'} sendo preparado.*

Assim que o chapeiro/cozinheiro finalizar, o motoboy parceiro mais próximo já faz a coleta para levar até você!`;
    } else {
      botResponse = 
`📍 *Verificando status do entregador...*
Ainda não identificamos motoboy em trânsito para este pedido. Deseja que eu acione a loja para agilizar? Digite *1* para cobrar a cozinha!`;
    }

    return formatReply(session, botResponse);
  }

  // 5. OPÇÃO 4: DÚVIDAS DE PAGAMENTO / PIX
  if (cleanText === '4' || lowerText.includes('pix') || lowerText.includes('pagamento')) {
    botResponse = 
`💳 *Dúvidas sobre Pagamentos no Zapt Delivery:*

• *Pagamentos no Pix:* O valor é processado automaticamente e a confirmação é instantânea pelo gateway bancário Asaas.
• *Cartão de Crédito:* Se o pagamento foi aprovado no app, a loja já começou a preparar.
• *Pagamento na Entrega:* Você paga direto para o motoboy na maquininha ou dinheiro.

Se o seu Pix foi pago e não confirmou no aplicativo, por favor envie o comprovante nesta conversa para validação.`;

    return formatReply(session, botResponse);
  }

  // 6. OPÇÃO 5: OUTROS ASSUNTOS (CLIENTE RELATA O QUE DESEJA)
  if (cleanText === '5' || lowerText.includes('outro') || lowerText.includes('outros')) {
    session.step = 'AWAITING_CUSTOM_ISSUE';

    botResponse = 
`💬 *Por favor, digite abaixo o que você deseja ou qual é a sua dúvida:*
Pode relatar com suas palavras que irei analisar imediatamente para te ajudar! ⚡`;

    return formatReply(session, botResponse);
  }

  // 7. SE ESTÁ AGUARDANDO O RELATO DE OUTROS ASSUNTOS
  if (session.step === 'AWAITING_CUSTOM_ISSUE') {
    session.step = 'CUSTOM_ISSUE_ANALYZED';
    session.customIssue = cleanText;

    recordSupportTicket(session, cleanText);

    // Respostas inteligentes para dúvidas comuns
    if (lowerText.includes('cupom') || lowerText.includes('desconto')) {
      botResponse = 
`🎟️ *Cupons de Desconto Zapt Delivery:*
Você pode usar o cupom *BEMVINDO10* na sua primeira compra para ganhar 10% de desconto, ou *ZAPT5* para R$ 5,00 OFF em compras acima de R$ 30!
Basta digitar o cupom na sacola antes de confirmar o pedido.`;
      return formatReply(session, botResponse);
    }

    if (lowerText.includes('cancelar') || lowerText.includes('cancelamento')) {
      botResponse = 
`🚫 *Cancelamento de Pedido:*
Se o estabelecimento ainda não começou a preparar seu pedido, o cancelamento é realizado na hora.
Estou notificando a gerência da loja *${session.storeName || 'parceira'}* para pausar a preparação e verificar o cancelamento do pedido *${session.orderCode || ''}* imediatamente!`;
      triggerAutonomousStoreCheck(session, 'SOLICITAÇÃO DE CANCELAMENTO');
      return formatReply(session, botResponse, ['STORE_ALERT_SENT']);
    }

    if (lowerText.includes('trabalhar') || lowerText.includes('motoboy') || lowerText.includes('entregador') || lowerText.includes('cadastrar loja')) {
      botResponse = 
`🤝 *Parcerias Zapt Delivery:*
• *Quer ser motoboy parceiro?* Envie foto da sua CNH e placa da moto por aqui.
• *Quer cadastrar seu restaurante/loja?* Nossa equipe cadastra seu cardápio com 30 dias grátis de teste!
Um Especialista de Atendimento entrará em contato por este número em instantes!`;
      escalateToHumanSupport(session, `Parceria/Cadastro: ${cleanText}`);
      return formatReply(session, botResponse, ['ESCALATED_TO_SPECIALIST']);
    }

    // Para outros relatos gerais: transfere para o Especialista de Atendimento (sem expor nome)
    escalateToHumanSupport(session, `Outros: ${cleanText}`);

    botResponse = 
`✅ *Recebi o seu relato:*
_"${cleanText}"_

Já registrei sua solicitação e encaminhei para um Especialista de Atendimento da nossa Central de Suporte. 
Um analista da nossa equipe irá te responder diretamente por aqui em instantes com a solução! ⚡`;

    return formatReply(session, botResponse, ['ESCALATED_TO_SPECIALIST']);
  }

  // 6. TRANSFERÊNCIA SOMENTE QUANDO O BOT NÃO CONSEGUIR RESOLVER OU CLIENTE SOLICITAR EXPLICITAMENTE
  if (
    lowerText.includes('humano') ||
    lowerText.includes('atendente') ||
    lowerText.includes('especialista') ||
    lowerText.includes('falar com alguem') ||
    lowerText.includes('falar com alguém') ||
    lowerText.includes('pessoa')
  ) {
    session.step = 'TRANSFERRED_TO_SPECIALIST';

    escalateToHumanSupport(session, cleanText);

    botResponse = 
`👨‍💼 *Transferindo seu atendimento para um Especialista da nossa Central de Suporte.*

Já encaminhei o histórico da conversa e os dados do seu pedido para o especialista de plantão. 
Ele está sendo acionado neste momento para assumir este chamado e resolver sua solicitação com prioridade! ⚡`;

    return formatReply(session, botResponse, ['ESCALATED_TO_SPECIALIST']);
  }

  // 7. SE ESTÁ AGUARDANDO RESPOSTA DE DETALHES DE ITEM ERRADO
  if (session.step === 'STORE_INVESTIGATION' && session.issueType === 'ITEM_ERRADO') {
    session.step = 'AWAITING_STORE_REPLY';

    // Registra a descrição do item
    recordSupportTicket(session, cleanText);

    botResponse = 
`✅ *Anotado e encaminhado com urgência!*
Registrei a informação: _"${cleanText}"_ e já enviei para a cozinha da *${session.storeName}*.

Estamos aguardando o retorno da gerência da loja. Caso a loja não resolva em instantes, nosso sistema transferirá automaticamente para um Especialista de Atendimento.`;

    return formatReply(session, botResponse);
  }

  // RESPOSTA PADRÃO SE NÃO COMPREENDEU (SE ERRAR DUAS VEZES, TRANSFERE PARA ESPECIALISTA)
  if (!session.failCount) session.failCount = 0;
  session.failCount += 1;

  if (session.failCount >= 2) {
    session.step = 'TRANSFERRED_TO_SPECIALIST';
    escalateToHumanSupport(session, 'Não compreendeu após 2 tentativas');

    botResponse = 
`👨‍💼 *Para agilizar seu atendimento, estou transferindo você para um Especialista da nossa Central de Suporte.*

Um de nossos analistas já recebeu sua mensagem e vai te responder diretamente por aqui em instantes! ⚡`;

    return formatReply(session, botResponse, ['ESCALATED_TO_SPECIALIST']);
  }

  botResponse = 
`Olá! Sou o assistente automático do Zapt Delivery. ⚡

Por favor, escolha uma das opções para que eu possa resolver seu problema imediatamente:
*1* - ⏳ Pedido atrasado / demorando
*2* - ❌ Item errado / faltando
*3* - 🛵 Onde está o motoboy
*4* - 💳 Dúvida sobre Pix ou pagamento`;

  return formatReply(session, botResponse);
}

/**
 * AÇÃO AUTÔNOMA: Notifica o estabelecimento sobre a reclamação do cliente
 */
function triggerAutonomousStoreCheck(session, issueCategory) {
  const ticketId = `tkt_${Date.now()}`;
  const store = serverStores.find((s) => s.id === session.storeId || s.name === session.storeName);

  const ticket = {
    id: ticketId,
    orderId: session.activeOrderId,
    orderCode: session.orderCode || '#9999',
    customerName: session.customerName,
    customerPhone: session.phone,
    storeId: session.storeId,
    storeName: session.storeName || (store ? store.name : 'Loja Parceira'),
    storePhone: store ? store.phone : '5588988892782',
    issueCategory,
    status: 'WAITING_STORE',
    createdAt: new Date().toISOString(),
  };

  supportTickets.unshift(ticket);

  // Alerta no painel web da cozinha via SSE
  if (notifyFunction) {
    notifyFunction('SUPPORT_ALERT', {
      ticketId: ticket.id,
      orderCode: ticket.orderCode,
      customerName: ticket.customerName,
      customerPhone: ticket.customerPhone,
      storeName: ticket.storeName,
      issue: issueCategory,
      message: `🚨 O cliente ${ticket.customerName} abriu chamado sobre: ${issueCategory}!`,
    });
  }

  // Notificação direta via WhatsApp para o telefone da loja
  if (whatsappMessenger && ticket.storePhone) {
    const alertMsg = 
`🚨 *ALERTA ZAPT DELIVERY - COZINHA*
Cliente: *${ticket.customerName}* (${ticket.customerPhone})
Pedido: *${ticket.orderCode}*
Problema: *${issueCategory}*

Por favor, responda com uma opção:
*1* - Pedido já saiu com motoboy
*2* - Em preparo final (10 min)
*3* - Estamos ligando para o cliente agora`;
    whatsappMessenger(ticket.storePhone, alertMsg).catch(() => {});
  }

  console.log(`🚨 [BOT -> LOJA] Alerta enviado para ${ticket.storeName}: Cliente ${ticket.customerName} reclama de ${issueCategory}`);
  return ticket;
}

/**
 * RESPOSTA DA LOJA: Quando a loja responde pelo WhatsApp ou pelo Painel da Cozinha
 */
function handleStoreResponse(ticketId, responseCode, customNotes = '') {
  const ticket = supportTickets.find((t) => t.id === ticketId || t.orderCode === ticketId);
  if (!ticket) return null;

  ticket.status = 'RESOLVED_BY_STORE';
  ticket.storeResponse = responseCode;
  ticket.resolvedAt = new Date().toISOString();

  let customerMessage = '';

  if (responseCode === '1' || responseCode === 'DISPATCHED') {
    customerMessage = 
`🛵 *Notícia Boa da ${ticket.storeName}!*
A gerência da loja confirmou que seu pedido *${ticket.orderCode}* acabou de sair com o motoboy e está a caminho do seu endereço!
Tempo previsto: 10 a 15 minutos. Obrigado pela paciência! ⚡`;
  } else if (responseCode === '2' || responseCode === 'IN_OVEN') {
    customerMessage = 
`👨‍🍳 *Retorno da Cozinha da ${ticket.storeName}:*
Seu pedido *${ticket.orderCode}* está na fase final de preparo e embalagem. A previsão de saída com o motoboy é de aproximadamente 10 minutos!`;
  } else if (responseCode === '3' || responseCode === 'CALLING_CUSTOMER') {
    customerMessage = 
`📞 *A gerência da ${ticket.storeName} informou que está ligando agora para o seu número (${ticket.customerPhone}) para resolver o seu pedido com prioridade!*`;
  } else {
    customerMessage = 
`ℹ️ *Mensagem da ${ticket.storeName}:*
"${customNotes || 'Estamos agilizando seu pedido para entrega imediata!'}"`;
  }

  // Notificar cliente
  const session = botSessions.get(ticket.customerPhone);
  if (session) {
    session.history.push({ sender: 'bot', text: customerMessage, time: new Date().toISOString() });
  }

  return {
    success: true,
    ticket,
    customerPhone: ticket.customerPhone,
    customerMessage,
  };
}

/**
 * Escala para o Especialista de Atendimento da Central
 */
function escalateToHumanSupport(session, reason) {
  console.log(`🚨 [ESCALAÇÃO PARA ESPECIALISTA] Cliente ${session.phone} (${session.customerName}) transferido para especialista de atendimento! Motivo: ${reason}`);
}

function recordSupportTicket(session, notes) {
  const existing = supportTickets.find((t) => t.customerPhone === session.phone);
  if (existing) {
    existing.notes = notes;
  }
}

function formatReply(session, botResponse, actions = []) {
  session.history.push({ sender: 'bot', text: botResponse, time: new Date().toISOString() });
  return {
    reply: botResponse,
    session,
    actions,
  };
}

module.exports = {
  initBot,
  processIncomingMessage,
  handleStoreResponse,
  getTickets: () => supportTickets,
  getSessions: () => Array.from(botSessions.values()),
};
