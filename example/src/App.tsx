import * as React from 'react';
import { StyleSheet, View, Button } from 'react-native';
import WebSocketLogger from 'react-native-ws-logger';

export default function App() {
  return (
    <View style={styles.container}>
      <WebSocketLogger />
      <Button
        title={'new conn'}
        onPress={() => {
          const ws = new WebSocket('ws://echo.websocket.org', [], {
            headers: {
              Host: 'echo.websocket.org',
            },
          });
          ws.onopen = () => {
            ws.send('123123321');
          };

          setTimeout(() => {
            ws.close();
          }, 5000);

          const ws2 = new WebSocket('ws://echo.websocket.org', [], {
            headers: {
              Host: 'ssssecho.websocket.org',
            },
          });
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
