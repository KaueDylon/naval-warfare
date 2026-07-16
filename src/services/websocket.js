import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let stompClient = null;
let reconnectSubscriptions = []; // Callbacks para re-subscribe após reconexão

export function connect(token, onConnect, onError) {
  // Se já está conectado com o mesmo token, chama onConnect imediatamente
  // para que as subscriptions do contexto atual sejam registradas
  if (stompClient && stompClient.connected) {
    if (onConnect) onConnect();
    return stompClient;
  }

  // Limpa subscriptions de sessões anteriores antes de criar nova conexão
  reconnectSubscriptions = [];

  // Se existe mas não está conectado, desativa antes de criar novo
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }

  stompClient = new Client({
    webSocketFactory: () =>
      new SockJS("https://batalha-naval-9gfm.onrender.com/ws"),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    reconnectDelay: 3000, // Reconecta automaticamente após 3s
    onConnect: () => {
      console.info("[WS] Conectado");
      // Re-subscribe nas subscriptions registradas (reconexão)
      reconnectSubscriptions.forEach((entry) => entry.fn());
      if (onConnect) onConnect();
    },
    onStompError: (frame) => {
      console.error("[WS] STOMP error:", frame.headers?.message);
      if (onError) onError(frame);
    },
    onWebSocketClose: () => {
      console.warn("[WS] Conexão WebSocket fechada — tentando reconectar...");
    },
  });

  stompClient.activate();
  return stompClient;
}

export function disconnect() {
  reconnectSubscriptions = [];
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

export function subscribe(destination, callback) {
  if (!stompClient || !stompClient.connected) {
    console.error("[WS] Cliente não conectado");
    return null;
  }

  const sub = stompClient.subscribe(destination, (message) => {
    try {
      const body = JSON.parse(message.body);
      callback(body);
    } catch {
      callback(message.body);
    }
  });

  return sub;
}

/**
 * Subscribe com auto-resubscribe em reconexão.
 * Usa isso para subscriptions que devem sobreviver à reconexão.
 * Evita duplicação: se já existe subscription para o mesmo destination, ignora.
 */
export function subscribePersistent(destination, callback) {
  // Evita duplicação de subscriptions para o mesmo destino
  if (
    reconnectSubscriptions.some((entry) => entry.destination === destination)
  ) {
    return;
  }

  const doSubscribe = () => {
    if (stompClient && stompClient.connected) {
      stompClient.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch {
          callback(message.body);
        }
      });
    }
  };

  // Subscribe agora
  doSubscribe();

  // Registra para reconexão (com destination para dedup)
  reconnectSubscriptions.push({ destination, fn: doSubscribe });
}

export function publish(destination, body = {}) {
  if (!stompClient || !stompClient.connected) {
    console.error("[WS] Cliente não conectado — mensagem não enviada");
    return false;
  }
  stompClient.publish({
    destination,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
  return true;
}

export function isConnected() {
  return stompClient?.connected ?? false;
}
