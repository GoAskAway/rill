/**
 * FlatList Component (Web)
 *
 * Simple list rendering
 */

import React from 'react';

export interface FlatListProps<T> {
  data: T[];
  renderItem: (info: { item: T; index: number }) => React.ReactNode;
  keyExtractor?: (item: T, index: number) => string;
  style?: React.CSSProperties;
  className?: string;
  horizontal?: boolean;
  ListHeaderComponent?: React.ReactNode;
  ListFooterComponent?: React.ReactNode;
  ListEmptyComponent?: React.ReactNode;
  ItemSeparatorComponent?: React.ComponentType;
}

export function FlatList<T>({
  data,
  renderItem,
  keyExtractor,
  style,
  className,
  horizontal = false,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  ItemSeparatorComponent,
}: FlatListProps<T>): React.ReactElement {
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: horizontal ? 'row' : 'column',
    overflow: 'auto',
    ...style,
  };

  if (data.length === 0 && ListEmptyComponent) {
    return (
      <div style={containerStyle} className={className}>
        {ListEmptyComponent}
      </div>
    );
  }

  return (
    <div style={containerStyle} className={className}>
      {ListHeaderComponent}
      {data.map((item, index) => (
        <React.Fragment key={keyExtractor ? keyExtractor(item, index) : index}>
          {index > 0 && ItemSeparatorComponent && <ItemSeparatorComponent />}
          {renderItem({ item, index })}
        </React.Fragment>
      ))}
      {ListFooterComponent}
    </div>
  );
}

export default FlatList;
