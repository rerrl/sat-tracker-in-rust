import React, { useState, useEffect, useRef, useCallback } from "react";
import { TauriService, BalanceChangeEvent } from "./services/tauriService";
import "./App.css";

const EventItem = React.memo(({ event }: { event: BalanceChangeEvent }) => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 cursor-pointer">
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
      <div>
        <span className="font-medium text-gray-600 dark:text-gray-400">
          Type:
        </span>
        <p className="text-gray-900 dark:text-gray-100">{event.event_type}</p>
      </div>
      <div>
        <span className="font-medium text-gray-600 dark:text-gray-400">
          Amount:
        </span>
        <p className="text-gray-900 dark:text-gray-100">
          {event.amount_sats} sats
        </p>
      </div>
      <div>
        <span className="font-medium text-gray-600 dark:text-gray-400">
          Value:
        </span>
        <p className="text-gray-900 dark:text-gray-100">
          {event.value_cents ? `${event.value_cents} cents` : "N/A"}
        </p>
      </div>
      <div>
        <span className="font-medium text-gray-600 dark:text-gray-400">
          Memo:
        </span>
        <p className="text-gray-900 dark:text-gray-100">
          {event.memo || "None"}
        </p>
      </div>
      <div>
        <span className="font-medium text-gray-600 dark:text-gray-400">
          Created:
        </span>
        <p className="text-gray-900 dark:text-gray-100">
          {new Date(event.created_at).toLocaleString()}
        </p>
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

  // Create test event and refresh list
  async function createTestEvent() {
    try {
      const event = await TauriService.createBalanceChangeEvent({
        amount_sats: 100000,
        value_cents: 5000,
        event_type: "Buy",
        memo: "Test purchase from React",
      });

      console.log("Created event:", event);

      // Reset and reload from the beginning
      setEvents([]);
      setCurrentPage(0);
      setHasMore(true);
      loadInitialEvents();
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  // Load initial events on component mount
  useEffect(() => {
    loadInitialEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-900 dark:text-gray-100 mb-8">
          Sat Tracker In Rust
        </h1>

        <div className="space-y-6">
          <div className="text-center">
            <button
              onClick={createTestEvent}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Create Test Event
            </button>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Events ({events.length} of {totalCount})
            </h3>

            {/* Simple scrollable list */}
            <div className="space-y-3 max-h-[540px] overflow-y-auto">
              {events.map((event, index) => (
                <div
                  key={event.id}
                  ref={
                    index === events.length - 10
                      ? lastEventElementRef
                      : undefined
                  }
                >
                  <EventItem event={event} />
                </div>
              ))}
              
              {/* Loading and end messages inside the scrollable area */}
              {loading && (
                <div className="text-center py-4">
                  <div className="text-gray-600 dark:text-gray-400">
                    Loading more events...
                  </div>
                </div>
              )}
              {!hasMore && events.length > 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-500">
                    No more events to load
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
