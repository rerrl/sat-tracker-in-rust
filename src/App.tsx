import { useState, useEffect, useRef, useCallback } from "react";
import { TauriService, BalanceChangeEvent } from "./services/tauriService";
import "./App.css";

function App() {
  const [events, setEvents] = useState<BalanceChangeEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const observer = useRef<IntersectionObserver>();

  // Ref callback for the last event element (for infinite scroll)
  const lastEventElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreEvents();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Load more events (for infinite scroll)
  async function loadMoreEvents() {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      const result = await TauriService.getBalanceChangeEvents(currentPage, 10);
      
      setEvents(prevEvents => [...prevEvents, ...result.events]);
      setHasMore(result.has_more);
      setCurrentPage(prevPage => prevPage + 1);
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
      const result = await TauriService.getBalanceChangeEvents(0, 10);
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
    <main className="container">
      <h1>Sat Tracker In Rust</h1>

      <div>
        <h2>Balance Change Events</h2>
        <button onClick={createTestEvent}>Create Test Event</button>

        <div>
          <h3>Events ({events.length} of {totalCount}):</h3>
          {events.map((event, index) => (
            <div
              key={event.id}
              ref={index === events.length - 1 ? lastEventElementRef : null}
              style={{
                border: "1px solid #ccc",
                margin: "10px",
                padding: "10px",
              }}
            >
              <p><strong>Type:</strong> {event.event_type}</p>
              <p><strong>Amount:</strong> {event.amount_sats} sats</p>
              <p><strong>Value:</strong> {event.value_cents ? `${event.value_cents} cents` : "N/A"}</p>
              <p><strong>Memo:</strong> {event.memo || "None"}</p>
              <p><strong>Created:</strong> {new Date(event.created_at).toLocaleString()}</p>
            </div>
          ))}
          
          {loading && <div style={{ textAlign: "center", padding: "20px" }}>Loading more events...</div>}
          {!hasMore && events.length > 0 && (
            <div style={{ textAlign: "center", padding: "20px" }}>No more events to load</div>
          )}
        </div>
      </div>
    </main>
  );
}

export default App;
