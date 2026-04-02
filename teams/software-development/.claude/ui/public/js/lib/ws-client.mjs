// WebSocket client with auto-reconnect (condition-based, not arbitrary timeout)

export class WsClient extends EventTarget {
  constructor(url) {
    super();
    this.url = url;
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.connect();
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      this.dispatch('connection', { connected: true });
    };

    this.ws.onclose = () => {
      this.connected = false;
      this.dispatch('connection', { connected: false });
      this.scheduleReconnect();
    };

    this.ws.onerror = () => {
      // onclose will fire after this
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.dispatch(msg.type, msg.payload);
      } catch {
        // ignore malformed messages
      }
    };
  }

  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay);
    setTimeout(() => this.connect(), delay);
  }

  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  dispatch(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, handler) {
    this.addEventListener(type, (e) => handler(e.detail));
  }
}
