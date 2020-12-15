const WebSocketEvent = require('react-native/Libraries/WebSocket/WebSocketEvent');

import { logger } from './logger';
import { useState } from 'react';

export class LoggedWebSocket extends WebSocket {
  __connectionId: string;
  static __LoggedWebSocket = true;
  static oldWebSocket = WebSocket;
  constructor(url, protocols, options) {
    super(...(([url, protocols, options] as any) as [any, any])); // An ugly workaround against typescript..

    const connectionId = `${Math.floor(Math.random() * 1e6)}`;
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
    if (!LoggedWebSocket.isPatched()) {
      window.WebSocket = LoggedWebSocket as any;
    }
  }

  static isPatched() {
    // eslint-disable-next-line dot-notation
    return window.WebSocket['__LoggedWebSocket'] === true;
  }

  static unpatch() {
    window.WebSocket = LoggedWebSocket.oldWebSocket;
  }

  static useWsInterceptor(): [boolean, (enabled: boolean) => void] {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [enabled, _setEnabled] = useState(LoggedWebSocket.isPatched());

    const setEnabled = (_enabled) => {
      if (_enabled) {
        LoggedWebSocket.patch();
        _setEnabled(true);
      } else {
        LoggedWebSocket.unpatch();
        _setEnabled(false);
      }
    };

    return [enabled, setEnabled];
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
    const anyThis = this as any;
    anyThis._subscriptions = [
      anyThis._eventEmitter.addListener('websocketMessage', (ev) => {
        if (ev.id !== anyThis._socketId) {
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
      anyThis._eventEmitter.addListener('websocketOpen', (ev) => {
        if (ev.id !== anyThis._socketId) {
          return;
        }
        anyThis.readyState = anyThis.OPEN;
        anyThis.protocol = ev.protocol;

        logger.addEvent(this.__connectionId, {
          date: new Date(),
          type: 'OPEN',
          eventId: Math.floor(Math.random() * 1e6),
        });

        this.dispatchEvent(new WebSocketEvent('open'));
      }),
      anyThis._eventEmitter.addListener('websocketClosed', (ev) => {
        if (ev.id !== anyThis._socketId) {
          return;
        }
        anyThis.readyState = this.CLOSED;
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
        anyThis._unregisterEvents();
        this.close();
      }),
      anyThis._eventEmitter.addListener('websocketFailed', (ev) => {
        if (ev.id !== anyThis._socketId) {
          return;
        }
        anyThis.readyState = this.CLOSED;
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
        anyThis._unregisterEvents();
        this.close();
      }),
    ];
  }
}
