import { useState } from "react";
import { TauriService, BalanceChangeEvent } from "./services/tauriService";
import "./App.css";

function App() {
  const [events, setEvents] = useState<BalanceChangeEvent[]>([]);

  async function createTestEvent() {
    try {
      const event = await TauriService.createBalanceChangeEvent({
        amount_sats: 100000,
        value_cents: 5000,
        event_type: "Buy",
        memo: "Test purchase from React",
      });
      console.log("Created event:", event);

      // Refresh the events list
      const allEvents = await TauriService.getBalanceChangeEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error("Error creating event:", error);
    }
  }

  async function loadEvents() {
    try {
      const allEvents = await TauriService.getBalanceChangeEvents();
      setEvents(allEvents);
    } catch (error) {
      console.error("Error loading events:", error);
    }
  }

  return (
    <main className="container">
      <h1>Sat Tracker In Rust</h1>

      <div>
        <h2>Balance Change Events</h2>
        <button onClick={createTestEvent}>Create Test Event</button>
        <button onClick={loadEvents}>Load Events</button>

        <div>
          <h3>Events ({events.length}):</h3>
          {events.map((event) => (
            <div
              key={event.id}
              style={{
                border: "1px solid #ccc",
                margin: "10px",
                padding: "10px",
              }}
            >
              <p>
                <strong>Type:</strong> {event.event_type}
              </p>
              <p>
                <strong>Amount:</strong> {event.amount_sats} sats
              </p>
              <p>
                <strong>Value:</strong>{" "}
                {event.value_cents ? `${event.value_cents} cents` : "N/A"}
              </p>
              <p>
                <strong>Memo:</strong> {event.memo || "None"}
              </p>
              <p>
                <strong>Created:</strong>{" "}
                {new Date(event.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default App;
