import {
  ServerSentEvent,
  ServerSentEventStreamTarget,
} from "https://deno.land/std@0.184.0/http/server_sent_event.ts";
import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.184.0/http/file_server.ts";

await serve((req, connInfo) => {
  const path = new URL(req.url).pathname;
  if (path.startsWith("/api/sse")) {
    const target = new ServerSentEventStreamTarget();
    let counter = 1;

    const id = setInterval(() => {
      const evt = new ServerSentEvent(
        "message",
        { data: { counter }, id: counter}, // id -> e.lastEventId
      );
      counter++;
      target.dispatchEvent(evt);
    }, 1000);
    console.log("start", id);
    target.addEventListener("close", () => {
      console.log("close", id, counter);
      clearInterval(id);
    });
    return target.asResponse();
  }
  return serveDir(req, { fsRoot: "static/" });
}, { port: 8001 });
