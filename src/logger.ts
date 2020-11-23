import './ws-interceptor';

import { action, autorun, computed, makeObservable, observable } from 'mobx';

import type { WebSocketConnection, WebSocketEvent } from './types';

export class Logger {
  constructor() {
    makeObservable(this);
  }

  @observable
  connections: Record<string, WebSocketConnection> = {};

  @observable
  readyState: number = 0;

  @observable
  events: Record<string, WebSocketEvent[]> = {};

  @computed.struct
  get connectionList() {
    return [...Object.values({ ...this.connections })].sort(
      (x, y) => y.start.getTime() - x.start.getTime()
    );
  }

  @action
  addConnection(connection: WebSocketConnection) {
    this.connections = {
      ...this.connections,
      [connection.connectionId]: connection,
    };
  }

  @action
  addEvent(connectionId: string, event: WebSocketEvent) {
    const events = this.events[connectionId] || [];
    this.events = {
      ...this.events,
      [connectionId]: [...events, event],
    };

    let readyState = 0;

    if (event.type === 'OPEN') {
      readyState = 1;
    }
    if (event.type === 'ERROR' || event.type === 'CLOSE') {
      readyState = 3;
    }
    console.log({ readyState });

    this.connections = {
      ...this.connections,
      [connectionId]: {
        ...this.connections[connectionId],
        messageCount:
          (this.connections[connectionId]?.messageCount || 0) +
          (event.type === 'MESSAGE' ? 1 : 0),
        readyState,
      },
    };
  }
}

const logger = new Logger();

autorun(() => {
  console.log(logger.connectionList);
});

export { logger };
