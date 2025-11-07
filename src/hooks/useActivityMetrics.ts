import { useState, useEffect } from 'react';
import { TauriService, ActivityMetrics } from '../services/tauriService';

export const useActivityMetrics = (events: any[], isDatabaseInitialized: boolean) => {
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadActivityMetrics = async (showLoading = false) => {
    if (!isDatabaseInitialized) return;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const metrics = await TauriService.getActivityMetrics();
      setActivityMetrics(metrics);
    } catch (err) {
      console.error("Error loading activity metrics:", err);
      setError(err instanceof Error ? err.message : 'Failed to load activity metrics');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Load metrics when database is initialized
  useEffect(() => {
    if (isDatabaseInitialized) {
      loadActivityMetrics(true);
    }
  }, [isDatabaseInitialized]);

  // Refresh metrics when events change
  useEffect(() => {
    if (isDatabaseInitialized && events.length > 0) {
      loadActivityMetrics(false);
    }
  }, [events, isDatabaseInitialized]);

  return {
    activityMetrics,
    loading,
    error,
    refetch: () => loadActivityMetrics(true)
  };
};
