const WebSocketEvent = require('react-native/Libraries/WebSocket/WebSocketEvent');

import { logger } from './logger';

export class LoggedWebSocket extends window.WebSocket {
  static __LoggedWebSocket = true;
  static oldWebSocket = window.WebSocket;
  constructor(url, protocols, options) {
    super(url, protocols, options);

    const connectionId = Math.floor(Math.random() * 1e6);
    this.__connectionId = connectionId;
    logger.addConnection({
      connectionId,
      url,
      protocols: typeof protocols === 'string' ? [protocols] : protocols,
      headers: options?.headers || {},
      start: new Date(),
      readyState: 0,
    });
  }

  static patch() {
    if (window.WebSocket.__LoggedWebSocket !== true) {
      window.WebSocket = LoggedWebSocket;
    }
  }

  static unpatch() {
    window.WebSocket = LoggedWebSocket.oldWebSocket;
  }

  send(data) {
    logger.addEvent(this.__connectionId, {
      date: new Date(),
      eventId: Math.floor(Math.random() * 1e6),
      type: 'SEND',
      data,
    });

    super.send(data);
  }

  _registerEvents() {
    this._subscriptions = [
      this._eventEmitter.addListener('websocketMessage', (ev) => {
        if (ev.id !== this._socketId) {
          return;
        }
        let data = ev.data;
        switch (ev.type) {
          case 'binary':
          case 'blob':
            throw new Error('Binary debugging not supported');
        }

        logger.addEvent(this.__connectionId, {
          date: new Date(),
          eventId: Math.floor(Math.random() * 1e6),
          type: 'RECV',
          data,
        });

        this.dispatchEvent(new WebSocketEvent('message', { data }));
      }),
      this._eventEmitter.addListener('websocketOpen', (ev) => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.OPEN;
        this.protocol = ev.protocol;

        logger.addEvent(this.__connectionId, {
          date: new Date(),
          type: 'OPEN',
          eventId: Math.floor(Math.random() * 1e6),
        });

        this.dispatchEvent(new WebSocketEvent('open'));
      }),
      this._eventEmitter.addListener('websocketClosed', (ev) => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        this.dispatchEvent(
          new WebSocketEvent('close', {
            code: ev.code,
            reason: ev.reason,
          })
        );
        logger.addEvent(this.__connectionId, {
          date: new Date(),
          type: 'CLOSE',
          code: ev.code,
          reason: ev.reason,
          eventId: Math.floor(Math.random() * 1e6),
        });
        this._unregisterEvents();
        this.close();
      }),
      this._eventEmitter.addListener('websocketFailed', (ev) => {
        if (ev.id !== this._socketId) {
          return;
        }
        this.readyState = this.CLOSED;
        this.dispatchEvent(
          new WebSocketEvent('error', {
            message: ev.message,
          })
        );
        logger.addEvent(this.__connectionId, {
          date: new Date(),
          type: 'ERROR',
          message: ev.message,
          eventId: Math.floor(Math.random() * 1e6),
        });

        this.dispatchEvent(
          new WebSocketEvent('close', {
            message: ev.message,
          })
        );
        this._unregisterEvents();
        this.close();
      }),
    ];
  }
}
