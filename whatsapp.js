/**
 * ====================================================================
 * SERVIÇO WHATSAPP DO ZAPT DELIVERY (Conexão Direta via QR Code / Baileys)
 * Robô Autônomo para o número oficial (88) 98889-2782
 * Barbalha - Ceará
 * ====================================================================
 */

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const bot = require('./bot');

const AUTH_FOLDER = path.join(__dirname, 'auth_info_baileys');

// Estado global da conexão
let sock = null;
let connectionStatus = 'DISCONNECTED'; // 'DISCONNECTED' | 'CONNECTING' | 'WAITING_QR' | 'CONNECTED'
let currentQrCodeDataUrl = null;
let currentQrRaw = null;
let connectedPhone = null;
let reconnectAttempts = 0;
const messageLogs = [];

/**
 * Inicia o Socket do WhatsApp
 */
async function startWhatsApp() {
  if (connectionStatus === 'CONNECTING' || connectionStatus === 'CONNECTED') {
    console.log('⚡ [WHATSAPP] Socket já está em execução ou conectado.');
    return;
  }

  connectionStatus = 'CONNECTING';
  console.log('🔄 [WHATSAPP] Inicializando motor Baileys...');

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] }));

    sock = makeWASocket({
      version,
      logger: pino({ level: 'silent' }),
      auth: state,
      printQRInTerminal: false,
      browser: ['Zapt Delivery Bot', 'Chrome', '124.0.0'],
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
    });

    // Salvar credenciais automaticamente a cada atualização
    sock.ev.on('creds.update', saveCreds);

    // Monitorar eventos de conexão e QR Code
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        connectionStatus = 'WAITING_QR';
        currentQrRaw = qr;
        currentQrCodeDataUrl = await QRCode.toDataURL(qr, {
          margin: 2,
          scale: 8,
          color: {
            dark: '#0F172A',
            light: '#FFFFFF',
          },
        });
        console.log('📲 [WHATSAPP] Novo QR Code gerado! Abra http://localhost:3333/whatsapp para escanear no celular.');
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
        console.log(`⚠️ [WHATSAPP] Conexão encerrada. Motivo: ${lastDisconnect?.error?.message || statusCode}. Reconectar? ${shouldReconnect}`);

        connectionStatus = 'DISCONNECTED';
        currentQrCodeDataUrl = null;
        currentQrRaw = null;

        if (statusCode === DisconnectReason.loggedOut) {
          console.log('🔒 [WHATSAPP] Desconectado da sessão (Logout). Limpando credenciais antigas e gerando novo QR Code...');
          try {
            fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
          } catch (e) {}
          setTimeout(() => {
            startWhatsApp();
          }, 1500);
        } else if (shouldReconnect) {
          reconnectAttempts++;
          const delay = Math.min(reconnectAttempts * 2000, 10000);
          console.log(`⏳ [WHATSAPP] Tentando reconectar em ${delay / 1000}s... (Tentativa ${reconnectAttempts})`);
          setTimeout(() => {
            startWhatsApp();
          }, delay);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        reconnectAttempts = 0;
        currentQrCodeDataUrl = null;
        currentQrRaw = null;

        const userJid = sock.user?.id || '';
        connectedPhone = userJid.split(':')[0] || userJid.split('@')[0];
        console.log(`=================================================`);
        console.log(`✅ [WHATSAPP] CONECTADO COM SUCESSO!`);
        console.log(`📱 Número Conectado: ${connectedPhone}`);
        console.log(`⚡ Robô Zapt Delivery ativo para atender em Barbalha!`);
        console.log(`=================================================`);
      }
    });

    // Monitorar mensagens recebidas
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        // Ignorar mensagens enviadas pelo próprio bot ou sem conteúdo
        if (!msg.message || msg.key.fromMe) continue;

        const remoteJid = msg.key.remoteJid;
        // Ignorar grupos e transmissões de status
        if (!remoteJid || remoteJid.includes('@broadcast') || remoteJid.includes('@g.us')) continue;

        const senderPhone = remoteJid.replace('@s.whatsapp.net', '');
        const pushName = msg.pushName || 'Cliente Zapt';

        // Extrair texto da mensagem
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '';

        if (!text || !text.trim()) continue;

        const logEntry = {
          time: new Date().toLocaleTimeString('pt-BR'),
          phone: senderPhone,
          name: pushName,
          text: text.trim(),
          type: 'INCOMING',
        };
        messageLogs.unshift(logEntry);
        if (messageLogs.length > 50) messageLogs.pop();

        console.log(`📩 [WHATSAPP IN] De ${pushName} (${senderPhone}): "${text.trim()}"`);

        try {
          // Processar mensagem no motor do Zapt Bot
          const botResult = await bot.processIncomingMessage(senderPhone, text.trim(), {
            customerName: pushName,
          });

          if (botResult && botResult.reply) {
            // Enviar resposta no WhatsApp
            await sock.sendMessage(remoteJid, { text: botResult.reply });

            messageLogs.unshift({
              time: new Date().toLocaleTimeString('pt-BR'),
              phone: senderPhone,
              name: 'Zapt Bot',
              text: botResult.reply,
              type: 'OUTGOING',
            });
            if (messageLogs.length > 50) messageLogs.pop();

            console.log(`🤖 [WHATSAPP OUT] Resposta enviada para ${senderPhone}`);
          }
        } catch (err) {
          console.error(`❌ [WHATSAPP ERRO] Falha ao responder mensagem de ${senderPhone}:`, err.message);
        }
      }
    });
  } catch (error) {
    connectionStatus = 'DISCONNECTED';
    console.error('❌ [WHATSAPP ERRO INICIALIZAÇÃO]:', error.message);
  }
}

/**
 * Envia uma mensagem de texto para qualquer número de WhatsApp
 */
async function sendWhatsAppMessage(phone, text) {
  if (connectionStatus !== 'CONNECTED' || !sock) {
    console.warn(`⚠️ [WHATSAPP] Não conectado. Mensagem para ${phone} não pôde ser enviada.`);
    return { success: false, error: 'WhatsApp não está conectado' };
  }

  try {
    let clean = String(phone).replace(/\D/g, '');
    if (!clean.startsWith('55') && clean.length <= 11) {
      clean = '55' + clean;
    }
    const jid = `${clean}@s.whatsapp.net`;

    await sock.sendMessage(jid, { text });
    console.log(`📤 [WHATSAPP ENVIADO] Mensagem enviada com sucesso para ${clean}`);
    return { success: true, phone: clean };
  } catch (err) {
    console.error(`❌ [WHATSAPP ERRO AO ENVIAR] Para ${phone}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Desconectar sessão e apagar credenciais
 */
async function disconnectWhatsApp() {
  try {
    if (sock) {
      await sock.logout();
    }
  } catch (e) {}

  connectionStatus = 'DISCONNECTED';
  currentQrCodeDataUrl = null;
  currentQrRaw = null;
  connectedPhone = null;

  try {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
  } catch (e) {}

  console.log('🔌 [WHATSAPP] Sessão desconectada e limpa. Iniciando novo QR Code...');
  setTimeout(() => {
    startWhatsApp();
  }, 1000);
  return { success: true };
}

/**
 * Forçar reinicialização do Socket para gerar novo QR Code
 */
async function restartWhatsApp() {
  try {
    if (sock) {
      sock.end();
    }
  } catch (e) {}
  connectionStatus = 'DISCONNECTED';
  currentQrCodeDataUrl = null;
  currentQrRaw = null;
  reconnectAttempts = 0;
  return await startWhatsApp();
}

/**
 * Retorna o status atual do serviço
 */
function getStatus() {
  return {
    status: connectionStatus,
    isConnected: connectionStatus === 'CONNECTED',
    phone: connectedPhone,
    qrCodeDataUrl: currentQrCodeDataUrl,
    reconnectAttempts,
    logs: messageLogs.slice(0, 20),
  };
}

module.exports = {
  startWhatsApp,
  sendWhatsAppMessage,
  disconnectWhatsApp,
  restartWhatsApp,
  getStatus,
};
