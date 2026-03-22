import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMatchUpdates, useMatchEvents } from './realtime';

// --- Mock Supabase ---
const mockUnsubscribe = vi.fn();
const mockSubscribe = vi.fn();
const mockOn = vi.fn();
const mockChannel = vi.fn();

let subscribeCallback: ((status: string) => void) | null = null;
let realtimePayloadCallback: ((payload: unknown) => void) | null = null;

vi.mock('./client', () => ({
  createBrowserClient: () => ({
    channel: (name: string) => {
      mockChannel(name);
      return {
        on: (
          event: string,
          filter: Record<string, unknown>,
          callback: (payload: unknown) => void
        ) => {
          mockOn(event, filter);
          realtimePayloadCallback = callback;
          return {
            subscribe: (cb: (status: string) => void) => {
              subscribeCallback = cb;
              mockSubscribe(name);
              return { unsubscribe: mockUnsubscribe };
            },
          };
        },
      };
    },
    removeChannel: vi.fn(),
  }),
}));

// --- Helpers ---
function simulateConnected() {
  act(() => { subscribeCallback?.('SUBSCRIBED'); });
}

function simulateTimeout() {
  act(() => { subscribeCallback?.('TIMED_OUT'); });
}

function simulateRealtimePayload(payload: unknown) {
  act(() => { realtimePayloadCallback?.(payload); });
}

// --- Tests ---
describe('useMatchUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    subscribeCallback = null;
    realtimePayloadCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to the correct realtime channel on mount', () => {
    renderHook(() => useMatchUpdates('tournament-123'));
    expect(mockChannel).toHaveBeenCalledWith(
      expect.stringContaining('tournament-123')
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('subscribes to postgres_changes for match table filtered by tournament', () => {
    renderHook(() => useMatchUpdates('tournament-abc'));
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        schema: 'public',
        table: 'matches',
        filter: expect.stringContaining('tournament-abc'),
      })
    );
  });

  it('unsubscribes from channel on unmount', () => {
    const { unmount } = renderHook(() => useMatchUpdates('tournament-123'));
    simulateConnected();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('exposes secondsSinceUpdate that increments over time', async () => {
    const { result } = renderHook(() => useMatchUpdates('tournament-123'));
    simulateConnected();
    simulateRealtimePayload({ new: { id: '1', score: '2-1' } });

    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.secondsSinceUpdate).toBeGreaterThanOrEqual(5);
  });

  it('exposes lastUpdated timestamp when data arrives', () => {
    const { result } = renderHook(() => useMatchUpdates('tournament-123'));
    simulateConnected();

    expect(result.current.lastUpdated).toBeNull();

    simulateRealtimePayload({ new: { id: '1', score: '2-1' } });
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('starts in realtime connectionMode', () => {
    const { result } = renderHook(() => useMatchUpdates('tournament-123'));
    simulateConnected();
    expect(result.current.connectionMode).toBe('realtime');
  });

  it('falls back to polling mode after connection timeout', () => {
    const { result } = renderHook(() => useMatchUpdates('tournament-123'));
    simulateTimeout();
    expect(result.current.connectionMode).toBe('polling');
  });

  it('polls every 10 seconds in fallback mode', () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    const { result } = renderHook(() => useMatchUpdates('tournament-123'));
    simulateTimeout();
    expect(result.current.connectionMode).toBe('polling');

    act(() => { vi.advanceTimersByTime(10000); });
    act(() => { vi.advanceTimersByTime(10000); });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    fetchSpy.mockRestore();
  });

  it('multiple renders with same tournamentId share one subscription', () => {
    renderHook(() => useMatchUpdates('tournament-shared'));
    renderHook(() => useMatchUpdates('tournament-shared'));

    // channel should only be created once for same id
    expect(mockChannel).toHaveBeenCalledTimes(1);
  });
});

describe('useMatchEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    subscribeCallback = null;
    realtimePayloadCallback = null;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('subscribes to the correct realtime channel for a match on mount', () => {
    renderHook(() => useMatchEvents('match-456'));
    expect(mockChannel).toHaveBeenCalledWith(
      expect.stringContaining('match-456')
    );
    expect(mockSubscribe).toHaveBeenCalled();
  });

  it('subscribes to postgres_changes for match_events table filtered by match', () => {
    renderHook(() => useMatchEvents('match-xyz'));
    expect(mockOn).toHaveBeenCalledWith(
      'postgres_changes',
      expect.objectContaining({
        schema: 'public',
        table: 'match_events',
        filter: expect.stringContaining('match-xyz'),
      })
    );
  });

  it('unsubscribes from channel on unmount', () => {
    const { unmount } = renderHook(() => useMatchEvents('match-456'));
    simulateConnected();
    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('accumulates events as realtime payloads arrive', () => {
    const { result } = renderHook(() => useMatchEvents('match-456'));
    simulateConnected();

    expect(result.current.events).toHaveLength(0);

    simulateRealtimePayload({ new: { id: 'e1', type: 'goal', match_id: 'match-456' } });
    expect(result.current.events).toHaveLength(1);

    simulateRealtimePayload({ new: { id: 'e2', type: 'yellow_card', match_id: 'match-456' } });
    expect(result.current.events).toHaveLength(2);
  });

  it('falls back to polling after connection timeout', () => {
    const { result } = renderHook(() => useMatchEvents('match-456'));
    simulateTimeout();
    expect(result.current.connectionMode).toBe('polling');
  });

  it('polling interval is 10 seconds in fallback mode', () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify([]), { status: 200 })
    );

    const { result } = renderHook(() => useMatchEvents('match-456'));
    simulateTimeout();
    expect(result.current.connectionMode).toBe('polling');

    act(() => { vi.advanceTimersByTime(10000); });
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    fetchSpy.mockRestore();
  });
});
