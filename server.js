import {
  ServerSentEvent,
  ServerSentEventStreamTarget,
} from "https://deno.land/std@0.184.0/http/server_sent_event.ts";
import { serve } from "https://deno.land/std@0.184.0/http/server.ts";
import { serveDir } from "https://deno.land/std@0.184.0/http/file_server.ts";

const port = Deno.args[0] || 8001;
const ipv6 = true;
const hostname = ipv6 ? "[::]" : "0.0.0.0";

const targets = {};

await serve(async (req, connInfo) => {
  const url = new URL(req.url);
  const path = url.pathname;
  if (path.startsWith("/api/wait")) {
    const [id, point] = url.search.substring(1).split(",");
    const target = new ServerSentEventStreamTarget();
    targets[id] = target;
    target.addEventListener("close", () => {
      console.log("close", id);
      delete target[id];
    });
    return target.asResponse();
  } else if (path.startsWith("/api/accept")) {
    const [id, point] = url.search.substring(1).split(",");
    const target = targets[id];
    if (target) {
      const evt = new ServerSentEvent(
        "message",
        { data: { id, point }, id}, // id -> e.lastEventId
      );
      target.dispatchEvent(evt);
      await target.close();
      delete targets[id];
      return new Response("1");
    }
    return new Response("0");
  }
  return serveDir(req, { fsRoot: "static/" });
}, { hostname, port });
