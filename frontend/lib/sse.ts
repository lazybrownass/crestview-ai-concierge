// Wraps the browser's native EventSource (auto-reconnect on a dropped
// connection) with an explicit close on "done"/"error" so a stream that
// finished normally never lingers and reconnects into a stale GET.

export type Source = { label: string; text: string };

export type ChatStreamHandlers = {
  onToken: (text: string) => void;
  onCitations: (sources: Source[]) => void;
  onDone: (result: { corrected: boolean; text: string | null }) => void;
  onError: (error: Error) => void;
};

const MAX_RECONNECT_ATTEMPTS = 2;

export function streamChat(
  backendUrl: string,
  message: string,
  handlers: ChatStreamHandlers,
): () => void {
  const url = `${backendUrl}/api/chat?message=${encodeURIComponent(message)}`;
  let closed = false;
  let attempts = 0;
  let source: EventSource | null = null;

  function connect() {
    const es = new EventSource(url, { withCredentials: true });
    source = es;

    es.addEventListener("token", (event) => {
      handlers.onToken((event as MessageEvent<string>).data);
    });

    es.addEventListener("citations", (event) => {
      const sources = JSON.parse((event as MessageEvent<string>).data) as Source[];
      handlers.onCitations(sources);
    });

    es.addEventListener("done", (event) => {
      const result = JSON.parse((event as MessageEvent<string>).data) as {
        corrected: boolean;
        text: string | null;
      };
      closed = true;
      es.close();
      handlers.onDone(result);
    });

    es.onerror = () => {
      es.close();
      if (closed) return;
      if (attempts < MAX_RECONNECT_ATTEMPTS) {
        attempts += 1;
        setTimeout(connect, 300 * attempts);
      } else {
        closed = true;
        handlers.onError(new Error("Connection to the concierge was lost."));
      }
    };
  }

  connect();

  return () => {
    closed = true;
    source?.close();
  };
}
