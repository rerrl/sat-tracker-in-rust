import React, { useState, useEffect, useRef, useCallback } from "react";
import { TauriService, BalanceChangeEvent } from "./services/tauriService";
import "./App.css";

const EventItem = React.memo(({ event }: { event: BalanceChangeEvent }) => (
  <div className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 px-4 py-2 text-xs">
    <div className="grid grid-cols-4 gap-2 items-center">
      <div className="font-medium text-gray-900 dark:text-gray-100">
        {event.event_type}
      </div>
      <div className="text-gray-700 dark:text-gray-300">
        {event.amount_sats.toLocaleString()} sats
      </div>
      <div className="text-gray-700 dark:text-gray-300">
        {event.value_cents ? `$${(event.value_cents / 100).toFixed(2)}` : '-'}
      </div>
      <div className="text-gray-600 dark:text-gray-400 truncate">
        {event.memo || '-'}
      </div>
    </div>
  </div>
));

function App() {
  const [events, setEvents] = useState<BalanceChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const observer = useRef<IntersectionObserver>();
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMoreEvents();
          }
        },
        {
          rootMargin: "200px", // Start loading 200px before reaching the element
        }
      );
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Load more events - load big chunks for smooth experience
  async function loadMoreEvents() {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await TauriService.getBalanceChangeEvents(
        currentPage,
        200
      ); // Load 200 at once

      setEvents((prevEvents) => [...prevEvents, ...result.events]);
      setHasMore(result.has_more);
      setCurrentPage((prevPage) => prevPage + 1);
      setTotalCount(result.total_count);

      console.log(`Loaded page ${result.page}, has more: ${result.has_more}`);
    } catch (error) {
      console.error("Error loading events:", error);
    } finally {
      setLoading(false);
    }
  }

  // Load initial events
  async function loadInitialEvents() {
    setLoading(true);
    try {
      const result = await TauriService.getBalanceChangeEvents(0, 200); // Load 200 initially
      setEvents(result.events);
      setHasMore(result.has_more);
      setCurrentPage(1);
      setTotalCount(result.total_count);
    } catch (error) {
      console.error("Error loading initial events:", error);
    } finally {
      setLoading(false);
    }
  }


  // Load initial events on component mount
  useEffect(() => {
    loadInitialEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Title Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Sat Tracker
        </h1>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex h-[calc(100vh-73px)]"> {/* Subtract header height */}
        {/* Left Column - Events (40%) */}
        <div className="w-2/5 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Events ({events.length} of {totalCount})
              </h3>
              {/* Column Headers */}
              <div className="grid grid-cols-4 gap-2 mt-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                <div>Type</div>
                <div>Amount</div>
                <div>Value</div>
                <div>Memo</div>
              </div>
            </div>

            {/* Events List */}
            <div className="flex-1 overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  ref={index === events.length - 10 ? lastEventElementRef : undefined}
                >
                  <EventItem event={event} />
                </div>
              ))}
              
              {loading && (
                <div className="text-center py-4">
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Loading more events...
                  </div>
                </div>
              )}
              {!hasMore && events.length > 0 && (
                <div className="text-center py-4">
                  <div className="text-xs text-gray-500 dark:text-gray-500">
                    No more events to load
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Right Column - Split into top and bottom (60%) */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-900 flex flex-col">
          {/* Top Section (50%) */}
          <div className="flex-1 border-b border-gray-200 dark:border-gray-700">
            <div className="p-6">
              <div className="text-gray-500 dark:text-gray-400 text-center">
                Top section content coming soon...
              </div>
            </div>
          </div>
          
          {/* Bottom Section (50%) */}
          <div className="flex-1">
            <div className="p-6">
              <div className="text-gray-500 dark:text-gray-400 text-center">
                Bottom section content coming soon...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
