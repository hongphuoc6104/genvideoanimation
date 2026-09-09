import * as net from 'node:net';
import * as dgram from 'node:dgram';
import { createRequire } from 'node:module';

const req = typeof require !== 'undefined' ? require : createRequire(import.meta.url);
const http = req('node:http');
const https = req('node:https');
const dns = req('node:dns');

export class OfflineNetworkViolationError extends Error {
  public readonly code = 'ERR_OFFLINE_VIOLATION';
  public readonly target: string;
  public readonly primitive: string;

  constructor(primitive: string, target: string) {
    super(
      `[OfflineNetworkGuard] Network access forbidden in offline mode: [${primitive}] attempted connection to [${target}]. All operations must run strictly locally.`
    );
    this.name = 'OfflineNetworkViolationError';
    this.primitive = primitive;
    this.target = target;
  }
}

export interface OfflineGuardOptions {
  /**
   * If true, allows connections to localhost, 127.0.0.1, ::1, or local Unix sockets.
   * Default: false (strict total isolation).
   */
  allowLocalhost?: boolean;
}

let activeGuardCount = 0;

export function isOfflineGuardActive(): boolean {
  return activeGuardCount > 0;
}

function isLocalhost(host?: string | null): boolean {
  if (!host) return false;
  const h = host.toLowerCase().trim();
  if (h === 'localhost' || h === '::1' || h.startsWith('/')) {
    return true;
  }
  // Match exact 127.0.0.0/8 IPv4 loopback (e.g. 127.0.0.1) without letting 127.evil.com pass
  return /^127(?:\.(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/.test(h);
}

/**
 * Enables in-process network interception guard.
 * Blocks net, dgram, http, https, fetch, and dns calls.
 * Returns a teardown function to restore normal operation.
 */
export function enableOfflineNetworkGuard(options: OfflineGuardOptions = {}): () => void {
  const allowLocalhost = Boolean(options.allowLocalhost);

  // Store original primitives
  const origNetConnect = net.Socket.prototype.connect;
  const origDgramSend = dgram.Socket.prototype.send;
  const origHttpRequest = http.request;
  const origHttpGet = http.get;
  const origHttpsRequest = https.request;
  const origHttpsGet = https.get;
  const origFetch = globalThis.fetch;
  const origDnsLookup = dns.lookup;
  const origDnsPromisesLookup = dns.promises ? dns.promises.lookup : undefined;

  const prevEnv = {
    HF_HUB_OFFLINE: process.env.HF_HUB_OFFLINE,
    TRANSFORMERS_OFFLINE: process.env.TRANSFORMERS_OFFLINE,
    OFFLINE_MODE: process.env.OFFLINE_MODE,
  };

  process.env.HF_HUB_OFFLINE = '1';
  process.env.TRANSFORMERS_OFFLINE = '1';
  process.env.OFFLINE_MODE = '1';

  activeGuardCount++;
  let restored = false;

  // 1. Intercept net.Socket.prototype.connect
  net.Socket.prototype.connect = function (this: net.Socket, ...args: any[]): any {
    let targetHost: string | undefined;
    let targetPort: number | undefined;

    const opt = Array.isArray(args[0]) ? args[0][0] : args[0];
    if (typeof opt === 'object' && opt !== null) {
      targetHost = opt.host || opt.hostname || opt.path;
      targetPort = opt.port;
    } else if (typeof args[0] === 'number') {
      targetPort = args[0];
      if (typeof args[1] === 'string') {
        targetHost = args[1];
      }
    } else if (typeof args[0] === 'string') {
      targetHost = args[0];
    }

    if (allowLocalhost && isLocalhost(targetHost)) {
      return origNetConnect.apply(this, args as any);
    }

    const targetDesc = targetHost ? `${targetHost}:${targetPort ?? ''}` : `port ${targetPort ?? 'unknown'}`;
    throw new OfflineNetworkViolationError('net.Socket.connect', targetDesc);
  };

  // 2. Intercept dgram.Socket.prototype.send
  dgram.Socket.prototype.send = function (this: dgram.Socket, ...args: any[]): any {
    let address: string | undefined;
    let port: number | undefined;

    // dgram send signatures:
    // (msg, offset, length, port, address, cb)
    // (msg, port, address, cb)
    if (typeof args[3] === 'string') {
      address = args[3];
      port = args[2];
    } else if (typeof args[2] === 'string') {
      address = args[2];
      port = args[1];
    } else if (typeof args[1] === 'number') {
      port = args[1];
    }

    if (allowLocalhost && isLocalhost(address)) {
      return origDgramSend.apply(this, args as any);
    }

    throw new OfflineNetworkViolationError('dgram.Socket.send', `${address || 'unknown'}:${port ?? ''}`);
  };

  // 3. Intercept http.request and http.get
  const createHttpGuard = (origFn: typeof http.request, name: string) => {
    return function (this: any, ...args: any[]): any {
      let target = 'unknown';
      let host: string | undefined;

      if (typeof args[0] === 'string' || args[0] instanceof URL) {
        target = args[0].toString();
        try {
          const parsed = new URL(target, 'http://localhost');
          host = parsed.hostname;
        } catch {}
      } else if (typeof args[0] === 'object' && args[0] !== null) {
        host = args[0].hostname || args[0].host;
        target = host || 'http-request';
      }

      if (allowLocalhost && isLocalhost(host)) {
        return origFn.apply(this, args as any);
      }

      throw new OfflineNetworkViolationError(name, target);
    };
  };

  http.request = createHttpGuard(origHttpRequest, 'http.request') as any;
  http.get = createHttpGuard(origHttpGet, 'http.get') as any;
  https.request = createHttpGuard(origHttpsRequest, 'https.request') as any;
  https.get = createHttpGuard(origHttpsGet, 'https.get') as any;

  // 4. Intercept globalThis.fetch
  if (typeof origFetch === 'function') {
    globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      let urlStr = 'unknown';
      let host: string | undefined;

      if (typeof input === 'string') {
        urlStr = input;
      } else if (input instanceof URL) {
        urlStr = input.toString();
      } else if (typeof input === 'object' && 'url' in input) {
        urlStr = input.url;
      }

      try {
        const parsed = new URL(urlStr, 'http://localhost');
        host = parsed.hostname;
      } catch {}

      if (allowLocalhost && isLocalhost(host)) {
        return origFetch(input, init);
      }

      return Promise.reject(new OfflineNetworkViolationError('globalThis.fetch', urlStr));
    };
  }

  // 5. Intercept dns.lookup, dns.resolve*, and promises counterparts
  const resolveMethods = [
    'resolve', 'resolve4', 'resolve6', 'resolveAny', 'resolveCname', 'resolveCaa',
    'resolveMx', 'resolveNaptr', 'resolveNs', 'resolvePtr', 'resolveSoa', 'resolveSrv', 'resolveTxt'
  ];

  dns.lookup = function (hostname: string, ...args: any[]): void {
    const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;

    if (allowLocalhost && isLocalhost(hostname)) {
      return (origDnsLookup as any).apply(dns, [hostname, ...args]);
    }

    const err = new OfflineNetworkViolationError('dns.lookup', hostname);
    if (cb) {
      process.nextTick(() => cb(err));
    } else {
      throw err;
    }
  } as any;

  if (dns.promises && origDnsPromisesLookup) {
    dns.promises.lookup = function (hostname: string, options?: any): Promise<any> {
      if (allowLocalhost && isLocalhost(hostname)) {
        return origDnsPromisesLookup.apply(dns.promises, [hostname, options]);
      }
      return Promise.reject(new OfflineNetworkViolationError('dns.promises.lookup', hostname));
    } as any;
  }

  const origDnsResolvers: Record<string, any> = {};
  for (const m of resolveMethods) {
    if (typeof (dns as any)[m] === 'function') {
      origDnsResolvers[m] = (dns as any)[m];
      (dns as any)[m] = function (hostname: string, ...args: any[]) {
        const cb = typeof args[args.length - 1] === 'function' ? args[args.length - 1] : undefined;
        if (allowLocalhost && isLocalhost(hostname)) {
          return origDnsResolvers[m].apply(dns, [hostname, ...args]);
        }
        const err = new OfflineNetworkViolationError(`dns.${m}`, hostname);
        if (cb) {
          process.nextTick(() => cb(err));
        } else {
          throw err;
        }
      };
    }
  }

  const origDnsPromisesResolvers: Record<string, any> = {};
  if (dns.promises) {
    for (const m of resolveMethods) {
      if (typeof (dns.promises as any)[m] === 'function') {
        origDnsPromisesResolvers[m] = (dns.promises as any)[m];
        (dns.promises as any)[m] = function (hostname: string, ...args: any[]) {
          if (allowLocalhost && isLocalhost(hostname)) {
            return origDnsPromisesResolvers[m].apply(dns.promises, [hostname, ...args]);
          }
          return Promise.reject(new OfflineNetworkViolationError(`dns.promises.${m}`, hostname));
        };
      }
    }
  }

  const restore = () => {
    if (restored) return;
    restored = true;
    activeGuardCount = Math.max(0, activeGuardCount - 1);

    net.Socket.prototype.connect = origNetConnect;
    dgram.Socket.prototype.send = origDgramSend;
    http.request = origHttpRequest;
    http.get = origHttpGet;
    https.request = origHttpsRequest;
    https.get = origHttpsGet;
    if (typeof origFetch === 'function') {
      globalThis.fetch = origFetch;
    }
    dns.lookup = origDnsLookup;
    if (dns.promises && origDnsPromisesLookup) {
      dns.promises.lookup = origDnsPromisesLookup;
    }
    for (const [m, fn] of Object.entries(origDnsResolvers)) {
      (dns as any)[m] = fn;
    }
    if (dns.promises) {
      for (const [m, fn] of Object.entries(origDnsPromisesResolvers)) {
        (dns.promises as any)[m] = fn;
      }
    }

    if (prevEnv.HF_HUB_OFFLINE !== undefined) {
      process.env.HF_HUB_OFFLINE = prevEnv.HF_HUB_OFFLINE;
    } else {
      delete process.env.HF_HUB_OFFLINE;
    }
    if (prevEnv.TRANSFORMERS_OFFLINE !== undefined) {
      process.env.TRANSFORMERS_OFFLINE = prevEnv.TRANSFORMERS_OFFLINE;
    } else {
      delete process.env.TRANSFORMERS_OFFLINE;
    }
    if (prevEnv.OFFLINE_MODE !== undefined) {
      process.env.OFFLINE_MODE = prevEnv.OFFLINE_MODE;
    } else {
      delete process.env.OFFLINE_MODE;
    }
  };

  return restore;
}

/**
 * Runs an asynchronous block under strict offline guard, guaranteeing restoration.
 */
export async function runWithOfflineGuard<T>(
  fn: () => Promise<T>,
  options: OfflineGuardOptions = {}
): Promise<T> {
  const restore = enableOfflineNetworkGuard(options);
  try {
    return await fn();
  } finally {
    restore();
  }
}
