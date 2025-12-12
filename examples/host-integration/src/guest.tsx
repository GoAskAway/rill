/**
 * Guest example code
 * This code runs inside QuickJS sandbox
 */

import {
  ScrollView,
  Text,
  TouchableOpacity,
  useConfig,
  useHostEvent,
  useSendToHost,
  View,
} from '@rill/core/sdk';
import { useState } from 'react';

interface Config {
  userId?: string;
  theme?: 'light' | 'dark';
}

export default function Guest() {
  const config = useConfig<Config>();
  const sendToHost = useSendToHost();
  const [messages, setMessages] = useState<string[]>([]);

  // Listen to host events
  useHostEvent('HOST_MESSAGE', (payload: any) => {
    const msg = `Received from host: ${JSON.stringify(payload)}`;
    setMessages((prev) => [msg, ...prev].slice(0, 10));
  });

  useHostEvent<{ theme: string }>('THEME_CHANGE', (payload) => {
    const msg = `Theme changed to: ${payload.theme}`;
    setMessages((prev) => [msg, ...prev].slice(0, 10));
  });

  // Send message to host
  const handleSendToHost = () => {
    sendToHost('GUEST_ACTION', {
      timestamp: Date.now(),
      userId: config.userId,
      action: 'button_clicked',
    });
    setMessages((prev) => ['Sent message to host', ...prev].slice(0, 10));
  };

  const isDark = config.theme === 'dark';
  const bg = isDark ? '#1C1C1E' : '#F2F2F7';
  const cardBg = isDark ? '#2C2C2E' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryColor = isDark ? '#8E8E93' : '#6C6C70';

  return (
    <ScrollView style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: cardBg,
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? '#38383A' : '#E5E5EA',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: textColor }}>
          Host Integration Example
        </Text>
        <Text style={{ fontSize: 14, color: secondaryColor, marginTop: 4 }}>
          User ID: {config.userId || 'N/A'}
        </Text>
      </View>

      {/* Action Section */}
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, marginBottom: 12 }}>
            Bidirectional Communication
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: '#007AFF',
              paddingVertical: 12,
              paddingHorizontal: 20,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleSendToHost}
          >
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
              Send Message to Host
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Message Log */}
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, marginBottom: 12 }}>
            Message Log (Last 10)
          </Text>
          {messages.length === 0 ? (
            <Text style={{ color: secondaryColor, fontSize: 14 }}>No messages yet</Text>
          ) : (
            messages.map((msg, index) => (
              <View
                key={index}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: index < messages.length - 1 ? 1 : 0,
                  borderBottomColor: isDark ? '#38383A' : '#E5E5EA',
                }}
              >
                <Text style={{ color: textColor, fontSize: 14 }}>{msg}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Description */}
      <View style={{ padding: 16 }}>
        <View style={{ backgroundColor: cardBg, borderRadius: 12, padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: textColor, marginBottom: 12 }}>
            Integration Guide
          </Text>
          <Text style={{ color: textColor, fontSize: 14, lineHeight: 20 }}>
            This example demonstrates the complete communication flow between guest and host:
          </Text>
          <Text style={{ color: textColor, fontSize: 14, marginTop: 8 }}>
            • useHostEvent - Listen to host events
          </Text>
          <Text style={{ color: textColor, fontSize: 14 }}>
            • useSendToHost - Send messages to host
          </Text>
          <Text style={{ color: textColor, fontSize: 14 }}>
            • useConfig - Get configuration from host
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
