# ⚙️ Delivery Backend & Painel do Restaurante

Servidor central e Gestor de Pedidos para o ecossistema de delivery multiverticais.

---

## 🚀 Como Iniciar

1. Abra o terminal na pasta:
   ```powershell
   cd "C:\Users\esau_\.gemini\antigravity\scratch\delivery_backend"
   npm start
   ```
2. O servidor iniciará na porta **3333**.

---

## 🖥️ Acessar o Painel do Restaurante (Cozinha & Gestão)

Abra no seu navegador (Google Chrome, Edge ou no celular):
👉 **`http://localhost:3333/painel`**

### Recursos do Painel:
- 🔊 **Alarme Sonoro Automático:** Toca sinal sonoro de campainha de delivery na chegada de novo pedido.
- 📋 **Quadro Kanban em Tempo Real:**
  - 🔔 *Novos Pedidos* (botão "Aceitar - 30 min")
  - 🍳 *Na Cozinha / Em Preparo* (botão "Despachar Motoboy")
  - 🛵 *Em Trânsito / Saiu p/ Entrega* (botão "Concluir Entrega")
- 🖨️ **Impressão de Comanda Térmica (58mm e 80mm):** Botão com layout pronto para impressoras térmicas de balcão/chapa.
- 📊 **Métricas Financeiras do Dia:** Total faturado, comissão retida pelo app (10%) e valor líquido do restaurante.

---

## 🗄️ Banco de Dados (PostgreSQL / Supabase)

- **`schema.sql`:** Script completo das tabelas de Usuários (Clientes, Lojas, Motoboys, Admin), Bairros com taxas, Lojas, Produtos, Adicionais, Pedidos com Split e Carteira do Motoboy.
- **`seed.sql`:** Dados iniciais com as 5 verticais, bairros com taxas e produtos com adicionais prontos para rodar no Supabase com 1 clique.
