import { useState, useEffect } from "react";
import CreateEvent from "./CreateEvent.tsx";
import Vote from "./Vote.tsx";
import ViewVotes from "./ViewVotes.tsx";
import "./App.css";

function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const path = hash.replace(/^#/, "") || "/";

  const voteMatch = path.match(/^\/vote\/(.+)$/);
  if (voteMatch) return <Vote eventId={voteMatch[1]} />;

  const viewMatch = path.match(/^\/view\/(.+)$/);
  if (viewMatch) return <ViewVotes eventId={viewMatch[1]} />;

  return <CreateEvent />;
}

export default App;
