import React, { useState, useEffect, useRef, useCallback } from "react";
import { TauriService, BalanceChangeEvent } from "./services/tauriService";
import "./App.css";

const EventItem = React.memo(({ event }: { event: BalanceChangeEvent }) => (
  <div className="border-b border-[rgba(247,243,227,0.1)] hover:bg-[rgba(247,243,227,0.1)] px-4 py-2 text-xs">
    <div className="grid grid-cols-5 gap-2 items-center">
      <div className="text-[rgba(247,243,227,0.6)]">
        {new Date(event.created_at).toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }).replace(',', '')}
      </div>
      <div className="font-medium text-[#F7F3E3]">
        {event.event_type}
      </div>
      <div className="text-[rgba(247,243,227,0.8)]">
        {event.amount_sats.toLocaleString()} sats
      </div>
      <div className="text-[rgba(247,243,227,0.8)]">
        {event.value_cents ? `$${(event.value_cents / 100).toFixed(2)}` : '-'}
      </div>
      <div className="text-[rgba(247,243,227,0.6)] truncate">
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
    <div className="min-h-screen bg-[#090C08]">
      {/* Title Header */}
      <div className="bg-[#2A2633] border-b border-[rgba(247,243,227,0.2)] px-6 py-4">
        <h1 className="text-2xl font-bold text-[#F7F3E3]">
          Sat Tracker
        </h1>
      </div>

      {/* Main Content - Two Columns */}
      <div className="flex h-[calc(100vh-73px)]"> {/* Subtract header height */}
        {/* Left Column - Portfolio Metrics (40%) */}
        <div className="w-2/5 border-r border-[rgba(247,243,227,0.2)] bg-[#2A2633] flex flex-col">
          <div className="p-6 pb-4 shrink-0">
            <h2 className="text-lg font-semibold text-[#F7F3E3]">
              Portfolio Metrics
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto px-6 pb-6">
            {/* Overview Section */}
            <div className="mb-5">
              <h3 className="text-md font-semibold text-[#F7F3E3] mb-2 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Overview
              </h3>
              <div className="flex gap-3 mb-3">
                <div className="flex-1 text-center border border-[#61dafb] bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-[#61dafb] mb-1">Bitcoin Price</p>
                  <p className="text-lg text-[#61dafb]">$97,234</p>
                </div>
                <div className="flex-1 text-center border border-[#f7931a] bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-[#f7931a] mb-1">Portfolio Value</p>
                  <p className="text-lg text-[#f7931a]">$12,847.32</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1 text-center border border-[#f7931a] bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-[#f7931a] mb-1">Current Sats</p>
                  <p className="text-lg text-[#f7931a]">13,214,567</p>
                </div>
                <div className="flex-1 text-center border border-[#f7931a] bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-[#f7931a] mb-1">Total Sats Stacked</p>
                  <p className="text-lg text-[#f7931a]">15,234,567</p>
                </div>
              </div>
            </div>

            {/* Buys Section */}
            <div className="mb-5">
              <h3 className="text-md font-semibold text-[#F7F3E3] mb-2 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Buys
              </h3>
              <div className="flex gap-3">
                <div className="flex-1 text-center border border-lightgreen bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-lightgreen mb-1">Total Buys</p>
                  <p className="text-lg text-lightgreen">42</p>
                  <p className="text-xs text-lightgreen">$11,823.45</p>
                </div>
                <div className="flex-1 text-center border border-lightgreen bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-lightgreen mb-1">Avg Buy Price</p>
                  <p className="text-lg text-lightgreen">$89,456</p>
                </div>
              </div>
            </div>

            {/* Sells Section */}
            <div className="mb-5">
              <h3 className="text-md font-semibold text-[#F7F3E3] mb-2 border-b border-[rgba(247,243,227,0.2)] pb-1">
                Sells
              </h3>
              <div className="flex gap-3">
                <div className="flex-1 text-center border border-lightcoral bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-lightcoral mb-1">Total Sells</p>
                  <p className="text-lg text-lightcoral">3</p>
                  <p className="text-xs text-lightcoral">$2,156.78</p>
                </div>
                <div className="flex-1 text-center border border-lightcoral bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-lightcoral mb-1">Avg Sell Price</p>
                  <p className="text-lg text-lightcoral">$95,234</p>
                </div>
                <div className="flex-1 text-center border border-lightcoral bg-[#090C08] p-3">
                  <p className="text-sm font-bold text-lightcoral mb-1">Total Fees</p>
                  <p className="text-lg text-lightcoral">$234.56</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Column - Split into top and bottom (60%) */}
        <div className="flex-1 flex flex-col">
          {/* Top Section (50%) */}
          <div className="h-1/2 border-b border-[rgba(247,243,227,0.2)] bg-[rgba(9,12,8,0.8)]">
            <div className="p-6">
              <div className="text-[rgba(247,243,227,0.5)] text-center">
                Top section content coming soon...
              </div>
            </div>
          </div>
          
          {/* Bottom Section (50%) - Events */}
          <div className="h-1/2 bg-[#2A2633] flex flex-col">
            {/* Header */}
            <div className="px-4 py-3 border-b border-[rgba(247,243,227,0.2)] bg-[rgba(42,38,51,0.8)] shrink-0">
              <h3 className="text-sm font-semibold text-[#F7F3E3]">
                Events ({events.length} of {totalCount})
              </h3>
              {/* Column Headers */}
              <div className="grid grid-cols-5 gap-2 mt-2 text-xs font-medium text-[rgba(247,243,227,0.6)]">
                <div>Date</div>
                <div>Type</div>
                <div>Amount</div>
                <div>Value</div>
                <div>Memo</div>
              </div>
            </div>

            {/* Events List - Scrollable within this section only */}
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
                  <div className="text-xs text-[rgba(247,243,227,0.6)]">
                    Loading more events...
                  </div>
                </div>
              )}
              {!hasMore && events.length > 0 && (
                <div className="text-center py-4">
                  <div className="text-xs text-[rgba(247,243,227,0.5)]">
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
