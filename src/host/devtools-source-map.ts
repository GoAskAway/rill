/**
 * DevTools Source Map Utility
 * Resolves minified code locations to original source locations
 */

import { SourceMapConsumer, type RawSourceMap } from 'source-map';

// Cache the source map consumer
let sourceMapConsumer: SourceMapConsumer | null = null;
let sourceMapPromise: Promise<SourceMapConsumer | null> | null = null;

/**
 * Configuration for source map loading
 */
interface SourceMapConfig {
  metroPort?: number;
  platform?: string;
}

const defaultConfig: SourceMapConfig = {
  metroPort: 8082,
  platform: 'macos',
};

/**
 * Load source map from Metro bundler
 */
export async function loadSourceMap(config: SourceMapConfig = {}): Promise<SourceMapConsumer | null> {
  // Return cached consumer if available
  if (sourceMapConsumer) {
    return sourceMapConsumer;
  }

  // Return existing promise if loading
  if (sourceMapPromise) {
    return sourceMapPromise;
  }

  const { metroPort, platform } = { ...defaultConfig, ...config };

  sourceMapPromise = (async () => {
    try {
      const url = `http://localhost:${metroPort}/index.map?platform=${platform}&dev=true`;
      const response = await fetch(url);
      if (!response.ok) {
        console.warn('[DevTools] Failed to load source map:', response.status);
        return null;
      }

      const rawSourceMap = (await response.json()) as RawSourceMap;
      sourceMapConsumer = await new SourceMapConsumer(rawSourceMap);
      console.log('[DevTools] Source map loaded successfully');
      return sourceMapConsumer;
    } catch (error) {
      console.warn('[DevTools] Error loading source map:', error);
      return null;
    }
  })();

  return sourceMapPromise;
}

/**
 * Get the source map consumer (must be loaded first)
 */
export function getSourceMapConsumer(): SourceMapConsumer | null {
  return sourceMapConsumer;
}

/**
 * Original source location
 */
export interface OriginalLocation {
  sourceFile: string;
  sourceLine: number;
  sourceColumn: number;
  name: string | null;
}

/**
 * Resolve a minified location to original source location
 */
export function resolveLocation(
  line: number,
  column: number
): OriginalLocation | null {
  if (!sourceMapConsumer) {
    return null;
  }

  try {
    const original = sourceMapConsumer.originalPositionFor({ line, column });
    if (original.source && original.line !== null) {
      return {
        sourceFile: original.source,
        sourceLine: original.line,
        sourceColumn: original.column ?? 0,
        name: original.name,
      };
    }
  } catch (error) {
    console.warn('[DevTools] Error resolving location:', error);
  }

  return null;
}

/**
 * Parse a stack trace line to extract file, line, column
 * Handles formats like:
 * - "at functionName (file:line:column)"
 * - "at file:line:column"
 * - "functionName@file:line:column"
 */
function parseStackFrame(frame: string): { line: number; column: number } | null {
  // Match patterns like ":123:45" at the end
  const match = frame.match(/:(\d+):(\d+)\)?$/);
  if (match && match[1] && match[2]) {
    return {
      line: parseInt(match[1], 10),
      column: parseInt(match[2], 10),
    };
  }
  return null;
}

/**
 * Get the original source location from a stack trace
 * @param skipFrames Number of frames to skip (to get past internal frames)
 */
export function getCallerLocation(skipFrames = 0): OriginalLocation | null {
  if (!sourceMapConsumer) {
    return null;
  }

  try {
    const err = new Error();
    const stack = err.stack;
    if (!stack) return null;

    const lines = stack.split('\n');
    // Skip "Error" line and the specified number of frames
    const targetFrame = lines[2 + skipFrames];
    if (!targetFrame) return null;

    const parsed = parseStackFrame(targetFrame);
    if (!parsed) return null;

    return resolveLocation(parsed.line, parsed.column);
  } catch {
    return null;
  }
}

/**
 * Try to find the original location of a function by its name
 * This searches through the source map's sources for matching function definitions
 */
export function findFunctionInSources(
  _functionSource: string, // Reserved for future use (e.g., AST matching)
  functionName?: string
): OriginalLocation | null {
  if (!sourceMapConsumer) {
    return null;
  }

  // If we have a function name, try to find it in the original sources
  if (functionName && functionName !== 'anonymous') {
    const sources = (sourceMapConsumer as unknown as { sources: string[] }).sources || [];

    for (const source of sources) {
      const content = sourceMapConsumer.sourceContentFor(source, true);
      if (!content) continue;

      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const currentLine = lines[i];
        if (!currentLine) continue;

        // Look for function definitions
        if (
          currentLine.includes(`function ${functionName}`) ||
          currentLine.includes(`const ${functionName} =`) ||
          currentLine.includes(`let ${functionName} =`) ||
          (currentLine.includes(`${functionName} =`) && currentLine.includes('=>')) ||
          (currentLine.includes(`${functionName}(`) && (currentLine.includes('function') || currentLine.includes('=>')))
        ) {
          return {
            sourceFile: source,
            sourceLine: i + 1,
            sourceColumn: 0,
            name: functionName,
          };
        }
      }
    }
  }

  return null;
}

/**
 * Clean up resources
 */
export function destroySourceMap(): void {
  if (sourceMapConsumer) {
    sourceMapConsumer.destroy();
    sourceMapConsumer = null;
  }
  sourceMapPromise = null;
}
