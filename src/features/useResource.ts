import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import type { Result } from "../domain/models";
import { withTimeout } from "../domain/async";
export function useResource<T>(load: () => Promise<Result<T>>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const token = ++generation.current;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const result = await withTimeout(load(), 20000);
      if (token !== generation.current) return;
      if (result.ok) setData(result.data);
      else setError(result.error.message);
    } catch {
      if (token === generation.current)
        setError("Could not load. Please retry.");
    } finally {
      if (token === generation.current) setLoading(false);
    }
  }, [load]);
  useFocusEffect(
    useCallback(() => {
      void refresh();
      return () => {
        generation.current++;
      };
    }, [refresh]),
  );
  useEffect(
    () => () => {
      generation.current++;
    },
    [],
  );
  return { data, error, loading, refresh };
}
