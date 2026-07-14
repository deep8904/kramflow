#!/usr/bin/env node
/**
 * Minimal reference WebSocket relay for the KramFlow Display Engine.
 *
 * The engine's transport abstraction (lib/display-engine/transport.ts)
 * defaults to BroadcastChannel, which only syncs tabs in the same browser.
 * For genuine cross-device sync (a phone and a lobby TV in different
 * browsers/rooms), point every device at a server implementing this
 * contract: broadcast every message it receives to every *other* connected
 * client, verbatim, as fast as possible. That's the entire protocol — the
 * engine's own state store already knows how to merge/replace state from
 * an EngineMessage, so the relay stays intentionally dumb.
 *
 * Deliberately dependency-free (no `ws` package) so this script doesn't
 * require adding anything to package.json — it's optional infrastructure,
 * not part of the Next.js app or its build. Implements just enough of
 * RFC 6455 to relay text frames: handshake, frame parsing/masking, ping/
 * pong keep-alive, and clean close.
 *
 * Usage:
 *   node scripts/display-engine-ws-server.mjs [port]
 *
 * Then set, on every device you want synced:
 *   NEXT_PUBLIC_DISPLAY_ENGINE_WS_URL=wss://your-host:port
 *
 * This is a reference implementation for small-scale internal use (a few
 * dozen displays on trusted a network) — no auth, no TLS termination (put
 * it behind a reverse proxy for wss:// in production), no persistence
 * beyond what the engine's own clients already do via localStorage.
 */

import { createServer } from "node:http";
import { createHash } from "node:crypto";

const PORT = Number(process.argv[2] ?? process.env.PORT ?? 8787);
const WS_GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

const OPCODE_TEXT = 0x1;
const OPCODE_CLOSE = 0x8;
const OPCODE_PING = 0x9;
const OPCODE_PONG = 0xa;

/** @type {Set<import("node:net").Socket>} */
const clients = new Set();

function acceptKey(clientKey) {
  return createHash("sha1").update(clientKey + WS_GUID).digest("base64");
}

/** Encodes a single unmasked server->client text frame (fragmentation not needed at our message sizes). */
function encodeFrame(opcode, payload) {
  const payloadBuf = Buffer.isBuffer(payload) ? payload : Buffer.from(payload);
  const len = payloadBuf.length;
  let header;
  if (len < 126) {
    header = Buffer.from([0x80 | opcode, len]);
  } else if (len < 65536) {
    header = Buffer.alloc(4);
    header[0] = 0x80 | opcode;
    header[1] = 126;
    header.writeUInt16BE(len, 2);
  } else {
    header = Buffer.alloc(10);
    header[0] = 0x80 | opcode;
    header[1] = 127;
    header.writeBigUInt64BE(BigInt(len), 2);
  }
  return Buffer.concat([header, payloadBuf]);
}

function broadcast(sender, text) {
  const frame = encodeFrame(OPCODE_TEXT, text);
  for (const socket of clients) {
    if (socket !== sender && socket.writable) socket.write(frame);
  }
}

/** Incrementally parses frames out of a per-connection buffer, handling one client at a time. */
function makeFrameReader(onMessage, onClose, onPing) {
  let buffer = Buffer.alloc(0);

  return function feed(chunk) {
    buffer = Buffer.concat([buffer, chunk]);

    while (true) {
      if (buffer.length < 2) return;
      const first = buffer[0];
      const second = buffer[1];
      const opcode = first & 0x0f;
      const masked = (second & 0x80) !== 0;
      let payloadLen = second & 0x7f;
      let offset = 2;

      if (payloadLen === 126) {
        if (buffer.length < offset + 2) return;
        payloadLen = buffer.readUInt16BE(offset);
        offset += 2;
      } else if (payloadLen === 127) {
        if (buffer.length < offset + 8) return;
        payloadLen = Number(buffer.readBigUInt64BE(offset));
        offset += 8;
      }

      let maskKey = null;
      if (masked) {
        if (buffer.length < offset + 4) return;
        maskKey = buffer.subarray(offset, offset + 4);
        offset += 4;
      }

      if (buffer.length < offset + payloadLen) return;
      let payload = buffer.subarray(offset, offset + payloadLen);
      if (masked && maskKey) {
        payload = Buffer.from(payload);
        for (let i = 0; i < payload.length; i++) payload[i] ^= maskKey[i % 4];
      }

      buffer = buffer.subarray(offset + payloadLen);

      if (opcode === OPCODE_TEXT) onMessage(payload.toString("utf8"));
      else if (opcode === OPCODE_CLOSE) onClose();
      else if (opcode === OPCODE_PING) onPing(payload);
      // Pong frames need no action — they just reset the peer's own timeout.
    }
  };
}

const server = createServer((req, res) => {
  res.writeHead(200, { "content-type": "text/plain" });
  res.end("KramFlow Display Engine WS relay is running. Connect via ws:// or wss://.\n");
});

server.on("upgrade", (req, socket) => {
  const key = req.headers["sec-websocket-key"];
  if (typeof key !== "string") {
    socket.destroy();
    return;
  }

  const responseHeaders = [
    "HTTP/1.1 101 Switching Protocols",
    "Upgrade: websocket",
    "Connection: Upgrade",
    `Sec-WebSocket-Accept: ${acceptKey(key)}`,
    "\r\n",
  ].join("\r\n");
  socket.write(responseHeaders);

  clients.add(socket);
  console.log(`[display-engine-ws] client connected (${clients.size} total)`);

  const feed = makeFrameReader(
    (text) => broadcast(socket, text),
    () => socket.end(),
    (payload) => socket.write(encodeFrame(OPCODE_PONG, payload))
  );

  socket.on("data", feed);
  socket.on("error", () => clients.delete(socket));
  socket.on("close", () => {
    clients.delete(socket);
    console.log(`[display-engine-ws] client disconnected (${clients.size} total)`);
  });
});

// Keep-alive: ping every connected client periodically so dead sockets get
// pruned by their own error/close handlers instead of leaking silently.
setInterval(() => {
  for (const socket of clients) {
    if (socket.writable) socket.write(encodeFrame(OPCODE_PING, ""));
  }
}, 30000);

server.listen(PORT, () => {
  console.log(`[display-engine-ws] listening on ws://localhost:${PORT}`);
});
