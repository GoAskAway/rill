import type { Engine } from './Engine';

type Metric = { name: string; value: number; extra?: Record<string, unknown>; time: number };

export interface DevOverlayProps {
  engine: Engine;
  metrics?: Metric[];
}

export function DevOverlay({ engine, metrics = [] }: DevOverlayProps) {
  const health = engine.getHealth();
  return (
    <div
      style={{
        position: 'absolute',
        right: 8,
        bottom: 8,
        background: 'rgba(0,0,0,0.7)',
        color: '#fff',
        padding: 8,
        borderRadius: 4,
        fontSize: 12,
        maxWidth: 360,
      }}
    >
      <div>
        <strong>Rill DevOverlay</strong>
      </div>
      <div>
        loaded: {String(health.loaded)} | destroyed: {String(health.destroyed)} | errors:{' '}
        {health.errorCount}
      </div>
      <div>
        receiverNodes: {health.receiverNodes} | batching:{' '}
        {String('batching' in health ? (health as { batching: boolean }).batching : false)}
      </div>
      <div style={{ marginTop: 6 }}>
        <div>
          <strong>Recent Metrics</strong>
        </div>
        <ul style={{ maxHeight: 140, overflow: 'auto', margin: 0, paddingLeft: 16 }}>
          {metrics
            .slice(-20)
            .reverse()
            .map((m, i) => (
              <li key={i}>
                {new Date(m.time).toLocaleTimeString()} {m.name} {m.value}{' '}
                {m.extra ? JSON.stringify(m.extra) : ''}
              </li>
            ))}
        </ul>
      </div>
    </div>
  );
}
