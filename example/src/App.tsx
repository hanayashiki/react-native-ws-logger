import * as React from 'react';
import { StyleSheet, View, Button } from 'react-native';
import WebSocketLogger from 'react-native-ws-logger';
import { LoggedWebSocket } from 'react-native-ws-logger';

export default function App() {
  const [enabled, setEnabled] = LoggedWebSocket.useWsInterceptor();

  return (
    <View style={styles.container}>
      <WebSocketLogger />

      <Button
        title={enabled ? 'unpatch' : 'patch'}
        onPress={() => setEnabled(!enabled as boolean)}
      />
      <Button
        title={'new conn'}
        onPress={() => {
          const params = ([
            'ws://echo.websocket.org',
            [],
            {
              headers: {
                Host: 'echo.websocket.org',
              },
            },
          ] as any) as [any, any];
          const ws = new WebSocket(...params);
          ws.onopen = () => {
            ws.send('123123321');
          };

          setTimeout(() => {
            ws.close();
          }, 5000);

          const params2 = ([
            'ws://echo.websocket.org',
            [],
            {
              headers: {
                Host: 'echoxxxx.websocket.org',
              },
            },
          ] as any) as [any, any];

          const ws2 = new WebSocket(...params2);
          ws2.onopen = () => {
            ws2.send('123123321');
          };

          setTimeout(() => {
            ws2.close();
          }, 5000);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
