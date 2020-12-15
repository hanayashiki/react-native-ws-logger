export interface WebSocketConnection {
  connectionId: string;
  url: string;
  protocols: string[];
  headers: Record<string, string> & {};
  start: Date;
  end?: Date;
  readyState: number;
  messageCount?: integer;
}

export type EventType = 'OPEN' | 'SEND' | 'RECV' | 'ERROR' | 'CLOSE' | 'SEND';
export type DirectionType = 'UP' | 'DOWN';

export interface WebSocketEvent {
  date: Date;
  eventId: number;
  type: EventType;
  // message/send
  data?: string | Buffer;
  // direction
  direction?: DirectionType;
  // close
  code?: string;
  reason?: string;
  // error
  message?: string;
  // no payload for open
}
