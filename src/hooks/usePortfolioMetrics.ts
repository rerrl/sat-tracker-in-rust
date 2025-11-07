import { useState, useEffect } from 'react';
import { TauriService, PortfolioMetrics } from '../services/tauriService';

export const usePortfolioMetrics = (events: any[], isDatabaseInitialized: boolean) => {
  const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPortfolioMetrics = async (showLoading = false) => {
    if (!isDatabaseInitialized) return;
    
    if (showLoading) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const metrics = await TauriService.getPortfolioMetrics();
      setPortfolioMetrics(metrics);
    } catch (err) {
      console.error("Error loading portfolio metrics:", err);
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Load metrics when database is initialized
  useEffect(() => {
    if (isDatabaseInitialized) {
      loadPortfolioMetrics(true);
    }
  }, [isDatabaseInitialized]);

  // Refresh metrics when events change
  useEffect(() => {
    if (isDatabaseInitialized && events.length > 0) {
      loadPortfolioMetrics(false);
    }
  }, [events, isDatabaseInitialized]);

  return {
    portfolioMetrics,
    loading,
    error,
    refetch: () => loadPortfolioMetrics(true)
  };
};
