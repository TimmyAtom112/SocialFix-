// ===== AUTH =====
const SESSION_KEY = 'sociafix_user';
const buyer = JSON.parse(localStorage.getItem(SESSION_KEY));

if(!buyer || buyer.role !== 'buyer'){
  location.href = 'register.html';
}

// ===== LOGOUT =====
const logoutBtn = document.getElementById('logoutBtn');
if(logoutBtn){
  logoutBtn.onclick = () => {
    localStorage.removeItem(SESSION_KEY);
    location.href = 'register.html';
  };
}

// ===== LOAD DATA =====
let conversations = JSON.parse(localStorage.getItem("sf_conversations")) || [];
let currentOrderId = null;

const conversationList = document.getElementById("conversationList");
const chatMessages = document.getElementById("chatMessages");
const chatHeader = document.getElementById("chatHeader");

// ===== LOAD CONVERSATIONS =====
function loadConversations(){
  if(!conversationList) return;

  conversationList.innerHTML = '';
  const myConvos = conversations.filter(c => c.buyerEmail === buyer.email);

  if(myConvos.length === 0){
    conversationList.innerHTML = '<p style="padding:15px;">No conversations yet.</p>';
    return;
  }

  myConvos.forEach(convo => {
    const div = document.createElement("div");
    div.className = "convo";
    div.innerHTML = `
      <strong>${convo.merchantName}</strong><br>
      <small>Order #ORD-${convo.orderId}</small>
    `;
    div.onclick = () => openChat(convo.orderId, div);
    conversationList.appendChild(div);
  });
}

// ===== OPEN CHAT =====
function openChat(orderId, element){
  currentOrderId = orderId;

  // Highlight active conversation
  document.querySelectorAll(".convo").forEach(c => c.classList.remove("active"));
  if(element) element.classList.add("active");

  const convo = conversations.find(c => c.orderId === orderId);
  if(!convo) return;

  if(chatHeader) chatHeader.innerText = "Chat with " + convo.merchantName;

  renderMessages(convo);
}

// ===== RENDER MESSAGES =====
function renderMessages(convo){
  if(!chatMessages) return;

  chatMessages.innerHTML = '';
  convo.messages = convo.messages || [];

  convo.messages.forEach(msg => {
    const div = document.createElement("div");
    div.className = "message " + (msg.sender === 'buyer' ? 'buyer' : 'merchant');
    div.innerHTML = `
      ${msg.text}
      <div style="font-size:11px;margin-top:4px;opacity:0.7;">${msg.time}</div>
    `;
    chatMessages.appendChild(div);
  });

  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== SEND MESSAGE =====
function sendMessage(){
  const input = document.getElementById("messageInput");
  if(!input || !currentOrderId) return;

  const text = input.value.trim();
  if(!text) return;

  const convoIndex = conversations.findIndex(c => c.orderId === currentOrderId);
  if(convoIndex === -1) return;

  const messageObj = {
    sender: "buyer",
    text: text,
    time: new Date().toLocaleTimeString()
  };

  // Add message to conversation
  conversations[convoIndex].messages = conversations[convoIndex].messages || [];
  conversations[convoIndex].messages.push(messageObj);

  // Update merchantOrders chat
  let merchantOrders = JSON.parse(localStorage.getItem('merchantOrders')) || [];
  const merchantOrder = merchantOrders.find(o => o.id === currentOrderId);
  if(merchantOrder){
    merchantOrder.chat = merchantOrder.chat || [];
    merchantOrder.chat.push(messageObj);
    localStorage.setItem('merchantOrders', JSON.stringify(merchantOrders));
  }

  // Save to localStorage
  localStorage.setItem("sf_conversations", JSON.stringify(conversations));
  input.value = '';

  renderMessages(conversations[convoIndex]);
}

// ===== AUTO REFRESH =====
setInterval(() => {
  conversations = JSON.parse(localStorage.getItem("sf_conversations")) || [];
  if(currentOrderId){
    const convo = conversations.find(c => c.orderId === currentOrderId);
    if(convo) renderMessages(convo);
  }
}, 1000);

// ===== INIT =====
loadConversations();