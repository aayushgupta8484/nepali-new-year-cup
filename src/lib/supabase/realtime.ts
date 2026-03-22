'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createBrowserClient } from './client';

const POLLING_INTERVAL_MS = 10_000;
const CONNECTION_TIMEOUT_MS = 15_000;

type ConnectionMode = 'realtime' | 'polling';

interface RealtimeHookState {
  lastUpdated: Date | null;
  secondsSinceUpdate: number;
  connectionMode: ConnectionMode;
  isConnected: boolean;
}

// --- Shared channel registry (prevents >2 concurrent channels on free tier) ---

interface ChannelEntry {
  channel: ReturnType<ReturnType<typeof createBrowserClient>['channel']>;
  subscription: ReturnType<
    ReturnType<ReturnType<typeof createBrowserClient>['channel']>['on']
  >['subscribe'] extends (...args: unknown[]) => infer R ? R : never;
  refCount: number;
  callbacks: Set<(payload: unknown) => void>;
  statusCallbacks: Set<(status: string) => void>;
}

const channelRegistry = new Map<string, ChannelEntry>();

function subscribeToChannel(
  channelName: string,
  filter: { schema: string; table: string; filter: string },
  onPayload: (payload: unknown) => void,
  onStatus: (status: string) => void
): () => void {
  const existing = channelRegistry.get(channelName);

  if (existing) {
    existing.refCount++;
    existing.callbacks.add(onPayload);
    existing.statusCallbacks.add(onStatus);
    return () => unsubscribeFromChannel(channelName, onPayload, onStatus);
  }

  const client = createBrowserClient();
  const callbacks = new Set<(payload: unknown) => void>([onPayload]);
  const statusCallbacks = new Set<(status: string) => void>([onStatus]);

  const channelObj = client.channel(channelName);
  const subscribed = channelObj
    .on('postgres_changes', filter, (payload: unknown) => {
      callbacks.forEach((cb) => cb(payload));
    })
    .subscribe((status: string) => {
      statusCallbacks.forEach((cb) => cb(status));
    });

  channelRegistry.set(channelName, {
    channel: channelObj,
    subscription: subscribed,
    refCount: 1,
    callbacks,
    statusCallbacks,
  });

  return () => unsubscribeFromChannel(channelName, onPayload, onStatus);
}

function unsubscribeFromChannel(
  channelName: string,
  onPayload: (payload: unknown) => void,
  onStatus: (status: string) => void
): void {
  const entry = channelRegistry.get(channelName);
  if (!entry) return;

  entry.callbacks.delete(onPayload);
  entry.statusCallbacks.delete(onStatus);
  entry.refCount--;

  if (entry.refCount <= 0) {
    entry.subscription.unsubscribe();
    channelRegistry.delete(channelName);
  }
}

// --- Shared hook logic ---

function useRealtimeChannel<T>(
  channelName: string,
  filter: { schema: string; table: string; filter: string },
  onPayload: (payload: unknown, prev: T) => T,
  initialData: T,
  pollingFetcher: () => Promise<T>
): RealtimeHookState & { data: T } {
  const [data, setData] = useState<T>(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>('realtime');
  const [isConnected, setIsConnected] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markUpdated = useCallback(() => {
    setLastUpdated(new Date());
    setSecondsSinceUpdate(0);
  }, []);

  const startTick = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => {
      setSecondsSinceUpdate((s) => s + 1);
    }, 1000);
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingRef.current = setInterval(async () => {
      try {
        const result = await pollingFetcher();
        setData(result);
        markUpdated();
      } catch {
        // polling error: try again next interval
      }
    }, POLLING_INTERVAL_MS);
  }, [pollingFetcher, markUpdated]);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handlePayload = (payload: unknown) => {
      setData((prev) => onPayload(payload, prev));
      markUpdated();
    };

    const handleStatus = (status: string) => {
      if (status === 'SUBSCRIBED') {
        setIsConnected(true);
        setConnectionMode('realtime');
        stopPolling();
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      } else if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR' || status === 'CLOSED') {
        setIsConnected(false);
        setConnectionMode('polling');
        startPolling();
      }
    };

    // Set connection timeout
    timeoutRef.current = setTimeout(() => {
      setConnectionMode('polling');
      startPolling();
    }, CONNECTION_TIMEOUT_MS);

    const unsubscribe = subscribeToChannel(channelName, filter, handlePayload, handleStatus);
    startTick();

    return () => {
      unsubscribe();
      stopPolling();
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [channelName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, lastUpdated, secondsSinceUpdate, connectionMode, isConnected };
}

// --- Public hooks ---

export interface MatchScore {
  id: string;
  score?: string;
  status?: string;
  [key: string]: unknown;
}

export interface MatchEvent {
  id: string;
  type: string;
  match_id: string;
  [key: string]: unknown;
}

export function useMatchUpdates(tournamentId: string) {
  return useRealtimeChannel<MatchScore[]>(
    `matches:tournament:${tournamentId}`,
    {
      schema: 'public',
      table: 'matches',
      filter: `tournament_id=eq.${tournamentId}`,
    },
    (payload, prev) => {
      const incoming = (payload as { new: MatchScore }).new;
      const idx = prev.findIndex((m) => m.id === incoming.id);
      if (idx === -1) return [...prev, incoming];
      const next = [...prev];
      next[idx] = { ...next[idx], ...incoming };
      return next;
    },
    [],
    async () => {
      const res = await fetch(`/api/matches?tournament_id=${tournamentId}`);
      return res.json();
    }
  );
}

export function useMatchEvents(matchId: string) {
  const result = useRealtimeChannel<MatchEvent[]>(
    `match_events:match:${matchId}`,
    {
      schema: 'public',
      table: 'match_events',
      filter: `match_id=eq.${matchId}`,
    },
    (payload, prev) => {
      const incoming = (payload as { new: MatchEvent }).new;
      return [...prev, incoming];
    },
    [],
    async () => {
      const res = await fetch(`/api/match-events?match_id=${matchId}`);
      return res.json();
    }
  );

  return { ...result, events: result.data };
}
