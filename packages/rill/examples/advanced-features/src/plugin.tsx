/**
 * Advanced Features Demo Plugin
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'rill/sdk';

export default function Plugin() {
  const [workload, setWorkload] = useState<'light' | 'heavy' | 'infinite'>('light');
  const [renderCount, setRenderCount] = useState(0);
  const [computeResult, setComputeResult] = useState<number | null>(null);

  // Re-render count
  useEffect(() => {
    setRenderCount((c) => c + 1);
  });

  // Lightweight computation
  const handleLightCompute = () => {
    const start = Date.now();
    let sum = 0;
    for (let i = 0; i < 1000; i++) {
      sum += i;
    }
    setComputeResult(sum);
    console.log('Light compute took:', Date.now() - start, 'ms');
  };

  // Heavy computation (test performance metrics)
  const handleHeavyCompute = () => {
    const start = Date.now();
    let sum = 0;
    for (let i = 0; i < 10_000_000; i++) {
      sum += Math.sqrt(i);
    }
    setComputeResult(Math.floor(sum));
    console.log('Heavy compute took:', Date.now() - start, 'ms');
  };

  // Recursive computation (test timeout mechanism)
  const handleRecursiveCompute = () => {
    const fibonacci = (n: number): number => {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    };

    const start = Date.now();
    const result = fibonacci(35); // Recursive calculation, may trigger timeout
    setComputeResult(result);
    console.log('Recursive compute took:', Date.now() - start, 'ms');
  };

  // Massive DOM updates (test batch processing limits)
  const handleMassiveUpdates = () => {
    // Trigger massive re-renders
    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        setRenderCount((c) => c + 1);
      }, i * 10);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F2F2F7' }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: 'white',
          padding: 20,
          borderBottomWidth: 1,
          borderBottomColor: '#E5E5EA',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Advanced Features Demo</Text>
        <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>
          Performance Metrics | Timeout Protection | Batch Processing Optimization
        </Text>
      </View>

      {/* Status Information */}
      <View style={{ padding: 16 }}>
        <View
          style={{ backgroundColor: 'white', borderRadius: 12, padding: 16 }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Runtime Status
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14 }}>Render Count: {renderCount}</Text>
            <Text style={{ fontSize: 14 }}>
              Computation Result: {computeResult ?? 'N/A'}
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
              Tip: Open the host application's console to view performance metrics
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Testing */}
      <View style={{ padding: 16 }}>
        <View
          style={{ backgroundColor: 'white', borderRadius: 12, padding: 16 }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Performance Testing
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
            Test onMetric callback and performance monitoring
          </Text>

          <View style={{ gap: 12 }}>
            <TouchableOpacity
              style={{
                backgroundColor: '#34C759',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleLightCompute}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                Light Computation (1K iterations)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#FF9500',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleHeavyCompute}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                Heavy Computation (10M iterations)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                backgroundColor: '#FF3B30',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: 'center',
              }}
              onPress={handleRecursiveCompute}
            >
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
                Recursive Computation (Fibonacci 35)
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Batch Processing Test */}
      <View style={{ padding: 16 }}>
        <View
          style={{ backgroundColor: 'white', borderRadius: 12, padding: 16 }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Batch Processing Test
          </Text>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 12 }}>
            Test receiverMaxBatchSize limit
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: '#007AFF',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 8,
              alignItems: 'center',
            }}
            onPress={handleMassiveUpdates}
          >
            <Text style={{ color: 'white', fontSize: 14, fontWeight: '600' }}>
              Trigger 100 Updates
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Monitoring Metrics Description */}
      <View style={{ padding: 16 }}>
        <View
          style={{ backgroundColor: 'white', borderRadius: 12, padding: 16 }}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 12 }}>
            Monitoring Metrics Description
          </Text>
          <View style={{ gap: 8 }}>
            <Text style={{ fontSize: 14 }}>
              • <Text style={{ fontWeight: '600' }}>engine.sendToSandbox</Text> -
              Message passing time
            </Text>
            <Text style={{ fontSize: 14 }}>
              • <Text style={{ fontWeight: '600' }}>receiver.render</Text> -
              Render operation time
            </Text>
            <Text style={{ fontSize: 14 }}>
              •{' '}
              <Text style={{ fontWeight: '600' }}>receiver.applyOperations</Text>{' '}
              - Operation application time
            </Text>
            <Text style={{ fontSize: 14, color: '#666', marginTop: 8 }}>
              Monitor these metrics to optimize performance and identify bottlenecks
            </Text>
          </View>
        </View>
      </View>

      {/* Timeout Protection Description */}
      <View style={{ padding: 16, paddingBottom: 40 }}>
        <View
          style={{
            backgroundColor: '#FFF3CD',
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: '#FFE69C',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8 }}>
            ⚠️ Timeout Protection
          </Text>
          <Text style={{ fontSize: 14, color: '#856404' }}>
            If computation time exceeds the configured timeout limit, the engine will attempt to interrupt execution. This is a best-effort protection mechanism and may not fully prevent synchronous infinite loops.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}
