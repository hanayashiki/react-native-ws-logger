import React, { useState } from 'react';
import {
  SafeAreaView,
  Clipboard,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Alert,
} from 'react-native';
import { observer } from 'mobx-react-lite';

import { logger } from './logger';
import type { WebSocketConnection, WebSocketEvent } from './types';
import { plural } from './utils';
import moment from 'moment';

export type PageType = 'list' | 'connection';

export const styles = StyleSheet.create({
  entryContainer: {
    flexDirection: 'row',
  },
  entryStatusIndicator: {
    width: 5,
  },
  entryInfoContainer: {
    flex: 1,
    paddingLeft: 10,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 11,
    color: 'gray',
  },
  entryInfoRightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 10,
  },
  sectionHeader: {
    paddingVertical: 5,
    paddingHorizontal: 5,
    backgroundColor: 'lightgray',
  },
  eventViewContainer: {
    flexDirection: 'row',
    paddingRight: 10,
  },
});

export interface WebSocketLoggerProps {
  connectionList: WebSocketConnection[];
  events: Record<string, WebSocketEvent[]>;
}

export interface WebSocketLoggerEntryProps {
  connection: WebSocketConnection;
  events: WebSocketEvent[];
  onPress?: () => void;
  detailed?: boolean;
}

export interface WebSocketLoggerConnectionViewProps {
  connection: WebSocketConnection;
  events: WebSocketEvent[];
  onGoBack: () => void;
}

export interface EventViewProps {
  event: WebSocketEvent;
}

export function WebSocketLoggerEntry(props: WebSocketLoggerEntryProps) {
  if (props.connection === null || props.connection === undefined) {
    return null;
  }

  const indicatorColor: any = {
    '0': '#00BFFF',
    '1': 'green',
    '2': 'gray',
    '3': 'gray',
  };

  console.log(props.connection.readyState);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={styles.entryContainer}
      onPress={props.onPress}
    >
      <View
        style={[
          styles.entryStatusIndicator,
          { backgroundColor: indicatorColor[`${props.connection.readyState}`] },
        ]}
      />
      <View style={styles.entryInfoContainer}>
        <Text>{props.connection.url}</Text>
        <Text style={styles.infoText}>
          protocols: {props.connection.protocols?.join(', ') || 'none'}
        </Text>
        {props.detailed &&
          Object.entries(props.connection.headers).map(([name, value]) => (
            <Text style={styles.infoText} key={name}>
              {name.toLowerCase()}: {value}
            </Text>
          ))}
      </View>
      <View style={styles.entryInfoRightContainer}>
        <Text style={[styles.infoText, { color: 'darkgray' }]}>
          {props.connection.messageCount || 0}{' '}
          {plural(props.connection.messageCount, 'message')}
        </Text>
        <Text style={styles.infoText}>
          {moment(props.connection.start).format('HH:MM:ss')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function MessageView(props: EventViewProps) {
  const [spreaded, setSpreaded] = useState(false);

  const tryFormat = (data: string) => {
    let parsed;
    try {
      parsed = JSON.parse(data);
      return JSON.stringify(parsed, undefined, 2);
    } catch (e) {
      return data;
    }
  };

  const onCopyText = () => {
    Alert.alert('Confirm', 'Copied text!');
    Clipboard.setString((props.event.data as string) || '');
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => setSpreaded((x) => !x)}
      onLongPress={onCopyText}
    >
      {!spreaded ? (
        <Text numberOfLines={1}>{props.event.data}</Text>
      ) : (
        <Text numberOfLines={20} style={{ fontFamily: 'Menlo', fontSize: 12 }}>
          {tryFormat(props.event.data as string)}
        </Text>
      )}
    </TouchableWithoutFeedback>
  );
}

export function CloseView(props: EventViewProps) {
  return (
    <View>
      <Text style={[styles.infoText, { color: 'darkgray' }]}>
        Code {props.event.code}: {props.event.reason}
      </Text>
    </View>
  );
}

export function ErrorView(props: EventViewProps) {
  return (
    <View>
      <Text style={[styles.infoText, { color: 'darkgray' }]}>
        {props.event.message}
      </Text>
    </View>
  );
}

export function EventView(props: EventViewProps) {
  const tagColor = {
    OPEN: 'green',
    MESSAGE: '#1E90FF',
    ERROR: 'red',
    CLOSE: 'black',
    SEND: '#00BFFF',
  };

  const abstractViews = {
    MESSAGE: () => <MessageView event={props.event} />,
    CLOSE: () => <CloseView event={props.event} />,
    ERROR: () => <ErrorView event={props.event} />,
  };

  return (
    <View style={styles.eventViewContainer}>
      <View
        style={{
          width: 75,
          paddingVertical: 5,
          alignItems: 'center',
          backgroundColor: tagColor[props.event.type],
        }}
      >
        <Text style={{ color: 'white' }}>{props.event.type}</Text>
      </View>
      <View style={{ paddingLeft: 5, flex: 1, justifyContent: 'center' }}>
        {abstractViews[props.event.type as keyof typeof abstractViews]?.()}
      </View>
      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
        <Text style={{ color: 'gray' }}>
          {moment(props.event.date).format('HH:MM:ss')}
        </Text>
      </View>
    </View>
  );
}

export function WebSocketLoggerConnectionView(
  props: WebSocketLoggerConnectionViewProps
) {
  // const [eventLimit, setEventLimit] = useState(30);

  return (
    <ScrollView>
      <WebSocketLoggerEntry
        connection={props.connection}
        detailed
        onPress={props.onGoBack}
        events={props.events}
      />
      <View style={styles.sectionHeader}>
        <Text>Events: {props.events.length}</Text>
      </View>
      <View>
        {[...props.events]
          .reverse()
          .slice(0, 30)
          .map((e) => (
            <EventView event={e} key={e.eventId} />
          ))}
      </View>
    </ScrollView>
  );
}

export function WebSocketLoggerComponent(props: WebSocketLoggerProps) {
  const [page, setPage] = useState<PageType>('list');
  const [
    selectedConnection,
    setSelectedConnection,
  ] = useState<WebSocketConnection>();

  const onSelectEntry = (c: WebSocketConnection) => {
    setPage('connection');
    setSelectedConnection(c);
  };

  const listView = () =>
    props.connectionList?.map((c) => (
      <WebSocketLoggerEntry
        key={c.connectionId}
        connection={c}
        events={props.events[c.connectionId]}
        onPress={() => onSelectEntry(c)}
      />
    ));

  const connectionView = () => (
    <WebSocketLoggerConnectionView
      connection={selectedConnection!}
      events={props.events[selectedConnection!.connectionId]}
      onGoBack={() => setPage('list')}
    />
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView>
        {page === 'list'
          ? listView()
          : page === 'connection'
          ? connectionView()
          : null}
      </ScrollView>
    </SafeAreaView>
  );
}

export default observer(() => (
  <WebSocketLoggerComponent
    connectionList={logger.connectionList}
    events={logger.events}
  />
));
