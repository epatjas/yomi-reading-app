import React, { useState } from 'react';
import { View, Button, Text, ScrollView } from 'react-native';

const TestConnection = () => {
  const [status, setStatus] = useState('Not Connected');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const toggleConnection = () => {
    if (ws) {
      // Disconnect if connected
      console.log('Initiating disconnect...');
      addLog('Initiating disconnect...');
      ws.close();
      setWs(null);
    } else {
      // Connect if disconnected
      console.log('Attempting to connect...');
      addLog('Attempting to connect...');
      const socket = new WebSocket('ws://192.168.1.115:8001');
      
      socket.onopen = () => {
        console.log('Connected to server');
        addLog('Connected to server');
        setStatus('Connected to server');
        
        // Automatically send test message when connected
        const message = {
          type: 'session.create',
          options: {
            mode: 'transcription'
          }
        };
        
        try {
          socket.send(JSON.stringify(message));
          console.log('Sent session.create message:', message);
          addLog('Sent session.create message: ' + JSON.stringify(message));
        } catch (error) {
          console.error('Error sending message:', error);
          addLog('Error sending message: ' + error);
        }
      };

      socket.onmessage = (event) => {
        console.log('Received from server:', event.data);
        addLog(`Received from server: ${event.data}`);
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'status') {
            setStatus(data.message);
          }
        } catch (e) {
          console.error('Failed to parse server message:', e);
          addLog('Failed to parse server message: ' + e);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        addLog('WebSocket error occurred');
        setStatus('Error: Connection failed');
      };

      socket.onclose = (event) => {
        console.log(`Disconnected from server (code: ${event.code}, reason: ${event.reason})`);
        addLog(`Disconnected from server (code: ${event.code}, reason: ${event.reason})`);
        setStatus('Disconnected');
      };

      setWs(socket);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Status: {status}</Text>
      <Button 
        title={ws ? "Disconnect" : "Test Connection"} 
        onPress={toggleConnection}
      />
      <ScrollView 
        style={{ 
          flex: 1, 
          marginTop: 20,
          backgroundColor: '#f5f5f5',  // Light gray background to make it visible
          padding: 10,
          maxHeight: 300  // Set a maximum height
        }}
      >
        {logs.map((log, index) => (
          <Text key={index} style={{ marginBottom: 5, color: '#333' }}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

export default TestConnection;