/**
 * Minimal test case to debug React Reconciler behavior
 * Run directly without Engine to isolate the issue
 */

import React from 'react';
import * as RillReconciler from './src/let/reconciler';

console.log('=== Minimal Reconciler Test ===\n');

// biome-ignore lint/suspicious/noExplicitAny: Test array collecting batches with dynamic structure
const batches: any[] = [];

// biome-ignore lint/suspicious/noExplicitAny: Test function receiving batches with dynamic structure
function sendToHost(batch: any) {
  console.log('\n📦 Batch received:');
  console.log('  Batch ID:', batch.batchId);
  console.log('  Operations:', batch.operations.length);
  // biome-ignore lint/suspicious/noExplicitAny: Test operations have dynamic structure
  batch.operations.forEach((op: any, i: number) => {
    console.log(
      `    ${i + 1}. ${op.op} id=${op.id} type=${op.type || '-'} parentId=${op.parentId || '-'} childId=${op.childId || '-'}`
    );
  });
  batches.push(batch);
}

// Simple component with children
const App = () => {
  return React.createElement(
    'View',
    { testID: 'root' },
    React.createElement('Text', { testID: 'child1' }, 'Hello'),
    React.createElement('TouchableOpacity', { testID: 'child2' })
  );
};

console.log('Calling RillReconciler.render()...\n');
RillReconciler.render(React.createElement(App), sendToHost);

console.log('\n=== Summary ===');
console.log('Total batches:', batches.length);
console.log(
  'Total operations:',
  batches.reduce((sum, b) => sum + b.operations.length, 0)
);

const allOps = batches.flatMap((b) => b.operations);
const createOps = allOps.filter((op) => op.op === 'CREATE');
console.log('\nCREATE operations:', createOps.length);
createOps.forEach((op) => {
  console.log('  -', op.type, `id=${op.id}`);
});
