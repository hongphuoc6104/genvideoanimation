/**
 * tests/challenger_m1_offline_guard.test.ts
 * Empirical Adversarial Challenge Suite for validators/offline-network-guard.ts
 *
 * Authored by: challenger_m1_2 (Offline Security & Network Guard Challenger)
 * Roles: critic, specialist
 */

import * as http from 'node:http';
import * as https from 'node:https';
import * as net from 'node:net';
import * as dgram from 'node:dgram';
import * as dns from 'node:dns';
import * as tls from 'node:tls';
import * as http2 from 'node:http2';
import * as path from 'node:path';
import * as fs from 'node:fs';
import * as assert from 'node:assert/strict';

import {
  enableOfflineNetworkGuard,
  runWithOfflineGuard,
  isOfflineGuardActive,
  OfflineNetworkViolationError,
} from '../validators/offline-network-guard';

import { KokoroTtsEngine } from '../packages/narration-kit/src/tts/KokoroTtsEngine';
import { parseWavHeader } from '../packages/narration-kit/src/tts/wav';

export interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export const results: TestResult[] = [];

function recordTest(category: string, name: string, fn: () => void | Promise<void>) {
  return async () => {
    try {
      await fn();
      results.push({ category, name, passed: true });
      console.log(`  ✓ [${category}] ${name}`);
    } catch (err: any) {
      results.push({
        category,
        name,
        passed: false,
        error: err?.message || String(err),
        details: err?.stack,
      });
      console.error(`  ✗ [${category}] ${name}: ${err?.message || err}`);
    }
  };
}

export async function runAllChallenges() {
  console.log('===============================================================');
  console.log(' EMPIRICAL ADVERSARIAL CHALLENGE: Offline Network Guard');
  console.log('===============================================================');

  // --------------------------------------------------------------------------
  // SECTION 1: Breach attempts across Node.js networking mechanisms
  // --------------------------------------------------------------------------
  console.log('\n--- Category 1: External Breach Resistance (Strict Offline) ---');

  await recordTest('Breach - fetch', 'blocks fetch to external domain (https://example.com)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        await fetch('https://example.com');
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError, 'Must throw OfflineNetworkViolationError');
        assert.strictEqual(err.code, 'ERR_OFFLINE_VIOLATION');
        assert.strictEqual(err.primitive, 'globalThis.fetch');
        assert.ok(err.target.includes('example.com'));
      }
      assert.ok(threw, 'fetch to external domain must be blocked');
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - fetch', 'blocks fetch to external raw IP (http://93.184.216.34)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        await fetch('http://93.184.216.34:80/index.html');
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
        assert.strictEqual(err.code, 'ERR_OFFLINE_VIOLATION');
      }
      assert.ok(threw, 'fetch to external IP must be blocked');
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - fetch', 'blocks fetch using Request object input', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        const req = new Request('https://api.openai.com/v1/models');
        await fetch(req);
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
        assert.strictEqual(err.primitive, 'globalThis.fetch');
      }
      assert.ok(threw, 'fetch(Request) must be blocked');
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - fetch', 'blocks fetch using URL object input', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        const urlObj = new URL('https://huggingface.co/api/models');
        await fetch(urlObj);
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
      }
      assert.ok(threw, 'fetch(URL) must be blocked');
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - http/https', 'blocks http.get to external URL', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => http.get('http://example.com/api'),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'http.get';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - http/https', 'blocks http.request with host option object', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => http.request({ host: '93.184.216.34', port: 80 }),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'http.request';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - http/https', 'blocks https.get to external domain', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => https.get('https://example.com/'),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'https.get';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - http/https', 'blocks https.request with URL object', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => https.request(new URL('https://huggingface.co/index.html')),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'https.request';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - net.Socket', 'blocks net.Socket.connect(port, host)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      const socket = new net.Socket();
      assert.throws(
        () => socket.connect(80, '93.184.216.34'),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'net.Socket.connect';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - net.Socket', 'blocks net.Socket.connect({ host, port })', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      const socket = new net.Socket();
      assert.throws(
        () => socket.connect({ host: 'example.com', port: 443 }),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'net.Socket.connect';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - net.Socket', 'blocks net.connect(port, host)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => net.connect(80, '93.184.216.34'),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'net.Socket.connect';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - net.Socket', 'blocks net.createConnection({ hostname, port })', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => net.createConnection({ hostname: 'api.openai.com', port: 443 } as any),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'net.Socket.connect';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - net.Socket', 'blocks tls.connect delegation to net.Socket', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => tls.connect(443, '93.184.216.34'),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'net.Socket.connect';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - net.Socket', 'blocks http2.connect delegation to net.Socket', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      assert.throws(
        () => http2.connect('https://example.com'),
        (err: any) => {
          return err instanceof OfflineNetworkViolationError && err.primitive === 'net.Socket.connect';
        }
      );
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - dgram.Socket', 'blocks dgram send with (msg, port, address, cb)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      const socket = dgram.createSocket('udp4');
      try {
        assert.throws(
          () => socket.send(Buffer.from('ping'), 53, '8.8.8.8'),
          (err: any) => {
            return err instanceof OfflineNetworkViolationError && err.primitive === 'dgram.Socket.send';
          }
        );
      } finally {
        socket.close();
      }
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - dgram.Socket', 'blocks dgram send with (msg, offset, length, port, address, cb)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      const socket = dgram.createSocket('udp4');
      try {
        const buf = Buffer.from('adversarial-udp-packet');
        assert.throws(
          () => socket.send(buf, 0, buf.length, 53, '1.1.1.1'),
          (err: any) => {
            return err instanceof OfflineNetworkViolationError && err.primitive === 'dgram.Socket.send';
          }
        );
      } finally {
        socket.close();
      }
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - dgram.Socket', 'blocks dgram send with array of buffers', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      const socket = dgram.createSocket('udp4');
      try {
        const bufs = [Buffer.from('chunk1'), Buffer.from('chunk2')];
        assert.throws(
          () => socket.send(bufs, 53, '8.8.4.4'),
          (err: any) => {
            return err instanceof OfflineNetworkViolationError && err.primitive === 'dgram.Socket.send';
          }
        );
      } finally {
        socket.close();
      }
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - dns.lookup', 'blocks dns.lookup with callback to external domain', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let caughtErr: any = null;
      await new Promise<void>((resolve) => {
        dns.lookup('example.com', (err) => {
          caughtErr = err;
          resolve();
        });
      });
      assert.ok(caughtErr !== null, 'Callback must receive error');
      assert.ok(caughtErr instanceof OfflineNetworkViolationError);
      assert.strictEqual(caughtErr.primitive, 'dns.lookup');
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - dns.lookup', 'blocks dns.lookup with options object and callback', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let caughtErr: any = null;
      await new Promise<void>((resolve) => {
        dns.lookup('api.openai.com', { family: 4 }, (err) => {
          caughtErr = err;
          resolve();
        });
      });
      assert.ok(caughtErr !== null, 'Callback must receive error');
      assert.ok(caughtErr instanceof OfflineNetworkViolationError);
    } finally {
      restore();
    }
  })();

  await recordTest('Breach - dns.promises', 'blocks dns.promises.lookup to external domain', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        await dns.promises.lookup('huggingface.co');
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
        assert.strictEqual(err.primitive, 'dns.promises.lookup');
      }
      assert.ok(threw, 'dns.promises.lookup must reject');
    } finally {
      restore();
    }
  })();

  // --------------------------------------------------------------------------
  // SECTION 2: Localhost behavior & Filtering
  // --------------------------------------------------------------------------
  console.log('\n--- Category 2: Localhost Behavior & Selective Allowance ---');

  await recordTest('Localhost - allowLocalhost: false', 'strictly blocks localhost when allowLocalhost is false', async () => {
    const restore = enableOfflineNetworkGuard({ allowLocalhost: false });
    try {
      // 1. fetch to 127.0.0.1 must fail
      let fetchFailed = false;
      try {
        await fetch('http://127.0.0.1:9999/test');
      } catch (err: any) {
        fetchFailed = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
      }
      assert.ok(fetchFailed, 'fetch to 127.0.0.1 must be blocked when allowLocalhost is false');

      // 2. net.connect to 127.0.0.1 must fail
      assert.throws(
        () => net.connect(9999, '127.0.0.1'),
        (err: any) => err instanceof OfflineNetworkViolationError
      );

      // 3. dns.promises.lookup to localhost must fail
      let dnsFailed = false;
      try {
        await dns.promises.lookup('localhost');
      } catch (err: any) {
        dnsFailed = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
      }
      assert.ok(dnsFailed, 'dns lookup for localhost must be blocked when allowLocalhost is false');
    } finally {
      restore();
    }
  })();

  await recordTest('Localhost - allowLocalhost: true', 'allows real local HTTP server on 127.0.0.1 while blocking external', async () => {
    // Start genuine local HTTP server
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', path: req.url }));
    });

    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = (server.address() as net.AddressInfo).port;

    const restore = enableOfflineNetworkGuard({ allowLocalhost: true });
    try {
      // 1. fetch to local server succeeds
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.strictEqual(data.status, 'ok');
      assert.strictEqual(data.path, '/health');

      // 2. http.get to local server succeeds
      const httpGetData = await new Promise<string>((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/http-test`, (response) => {
          let body = '';
          response.on('data', (c) => (body += c));
          response.on('end', () => resolve(body));
        }).on('error', reject);
      });
      assert.ok(httpGetData.includes('/http-test'));

      // 3. net.connect to local server succeeds
      const netConnSuccess = await new Promise<boolean>((resolve) => {
        const s = net.connect(port, '127.0.0.1', () => {
          s.end();
          resolve(true);
        });
        s.on('error', () => resolve(false));
      });
      assert.ok(netConnSuccess, 'net.connect to 127.0.0.1 must succeed');

      // 4. DNS lookup for localhost succeeds
      const dnsResult = await dns.promises.lookup('localhost');
      assert.ok(dnsResult.address === '127.0.0.1' || dnsResult.address === '::1');

      // 5. CRITICAL: External access STILL BLOCKED while allowLocalhost: true
      let extFetchBlocked = false;
      try {
        await fetch('https://example.com');
      } catch (err: any) {
        if (err instanceof OfflineNetworkViolationError) extFetchBlocked = true;
      }
      assert.ok(extFetchBlocked, 'External fetch must be blocked even when allowLocalhost is true');

      let extNetBlocked = false;
      try {
        net.connect(80, '93.184.216.34');
      } catch (err: any) {
        if (err instanceof OfflineNetworkViolationError) extNetBlocked = true;
      }
      assert.ok(extNetBlocked, 'External net.connect must be blocked even when allowLocalhost is true');

      let extDnsBlocked = false;
      try {
        await dns.promises.lookup('example.com');
      } catch (err: any) {
        if (err instanceof OfflineNetworkViolationError) extDnsBlocked = true;
      }
      assert.ok(extDnsBlocked, 'External DNS must be blocked even when allowLocalhost is true');
    } finally {
      restore();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  })();

  // --------------------------------------------------------------------------
  // SECTION 3: Guard Cleanup & Teardown Restoration
  // --------------------------------------------------------------------------
  console.log('\n--- Category 3: Teardown & Clean Restoration ---');

  await recordTest('Restoration', 'cleanly restores original networking primitives and env vars', async () => {
    // Capture pre-guard native primitives
    const origConnect = net.Socket.prototype.connect;
    const origDgram = dgram.Socket.prototype.send;
    const origHttpRequest = http.request;
    const origHttpGet = http.get;
    const origHttpsRequest = https.request;
    const origHttpsGet = https.get;
    const origFetch = globalThis.fetch;
    const origDnsLookup = dns.lookup;
    const origDnsPromisesLookup = dns.promises.lookup;

    const initialGuardActive = isOfflineGuardActive();
    assert.strictEqual(initialGuardActive, false, 'Guard should initially be inactive');

    // Set a custom env var to check restoration
    process.env.OFFLINE_MODE = 'custom_before_test';

    const restore = enableOfflineNetworkGuard();
    assert.strictEqual(isOfflineGuardActive(), true, 'Guard should report active');
    assert.notStrictEqual(net.Socket.prototype.connect, origConnect, 'net.Socket.connect must be patched');
    assert.notStrictEqual(globalThis.fetch, origFetch, 'fetch must be patched');
    assert.notStrictEqual(dns.lookup, origDnsLookup, 'dns.lookup must be patched');
    assert.strictEqual(process.env.OFFLINE_MODE, '1', 'OFFLINE_MODE set to 1');
    assert.strictEqual(process.env.HF_HUB_OFFLINE, '1', 'HF_HUB_OFFLINE set to 1');

    // Execute restore
    restore();

    assert.strictEqual(isOfflineGuardActive(), false, 'Guard should report inactive after restore');
    assert.strictEqual(net.Socket.prototype.connect, origConnect, 'net.Socket.connect restored');
    assert.strictEqual(dgram.Socket.prototype.send, origDgram, 'dgram.Socket.send restored');
    assert.strictEqual(http.request, origHttpRequest, 'http.request restored');
    assert.strictEqual(http.get, origHttpGet, 'http.get restored');
    assert.strictEqual(https.request, origHttpsRequest, 'https.request restored');
    assert.strictEqual(https.get, origHttpsGet, 'https.get restored');
    assert.strictEqual(globalThis.fetch, origFetch, 'fetch restored');
    assert.strictEqual(dns.lookup, origDnsLookup, 'dns.lookup restored');
    assert.strictEqual(dns.promises.lookup, origDnsPromisesLookup, 'dns.promises.lookup restored');
    assert.strictEqual(process.env.OFFLINE_MODE, 'custom_before_test', 'OFFLINE_MODE restored');

    // Cleanup env
    delete process.env.OFFLINE_MODE;

    // Idempotency: calling restore() a second time does not break or throw
    assert.doesNotThrow(() => restore(), 'Calling restore multiple times must be idempotent');
    assert.strictEqual(isOfflineGuardActive(), false);
  })();

  await recordTest('Restoration - Nested Guards', 'handles nested guard activation and decrements correctly', async () => {
    assert.strictEqual(isOfflineGuardActive(), false);

    const r1 = enableOfflineNetworkGuard();
    assert.strictEqual(isOfflineGuardActive(), true);

    const r2 = enableOfflineNetworkGuard();
    assert.strictEqual(isOfflineGuardActive(), true);

    // Release inner guard
    r2();
    assert.strictEqual(isOfflineGuardActive(), true, 'Guard must still be active when outer scope remains');

    // Release outer guard
    r1();
    assert.strictEqual(isOfflineGuardActive(), false, 'Guard must become inactive after all scopes released');
  })();

  // --------------------------------------------------------------------------
  // SECTION 4: Real Kokoro TTS Synthesis under runWithOfflineGuard
  // --------------------------------------------------------------------------
  console.log('\n--- Category 4: Real Kokoro TTS Execution with Zero Leaks ---');

  await recordTest('Kokoro TTS Offline', 'synthesizes speech under runWithOfflineGuard with zero leaks', async () => {
    const engine = new KokoroTtsEngine({ offline: true });

    // Ensure model assets exist
    const assetsOk = await engine.validateModelAssets();
    assert.ok(assetsOk, 'Kokoro model assets must exist and be valid');

    const testText = 'The offline network guard prevents all external network traffic while allowing local speech synthesis.';
    const tempWav = path.resolve(__dirname, `../temp_challenge_narration_${Date.now()}.wav`);

    try {
      const result = await runWithOfflineGuard(async () => {
        assert.ok(isOfflineGuardActive(), 'Guard must be active inside runWithOfflineGuard');
        return await engine.synthesize({
          text: testText,
          voice: 'am_adam',
          outputPath: tempWav,
        });
      });

      // Assertions on the synthesis result
      assert.ok(result.audioBuffer instanceof Buffer, 'audioBuffer must be Buffer');
      assert.strictEqual(result.sampleRate, 24000, 'sampleRate must be 24000 Hz');
      assert.strictEqual(result.channels, 1, 'channels must be 1 (mono)');
      assert.ok(result.durationSec >= 3.0, `durationSec (${result.durationSec}s) should be realistic`);

      // Verify WAV file on disk
      assert.ok(fs.existsSync(tempWav), 'WAV file must be written to disk');
      const fileBuffer = fs.readFileSync(tempWav);
      assert.strictEqual(fileBuffer.length, result.audioBuffer.length, 'File size matches audioBuffer');
      assert.ok(fileBuffer.subarray(0, 4).toString('ascii') === 'RIFF', 'Valid RIFF header');

      const parsed = parseWavHeader(fileBuffer);
      assert.strictEqual(parsed.sampleRate, 24000, 'Parsed sampleRate is 24000');
      assert.strictEqual(parsed.channels, 1, 'Parsed channels is 1');
      assert.strictEqual(parsed.bitDepth, 16, 'Parsed bitDepth is 16');
      assert.strictEqual(fileBuffer.readUInt16LE(20), 1, 'AudioFormat byte is 1 (PCM uncompressed)');

      // Verify guard restored afterwards
      assert.strictEqual(isOfflineGuardActive(), false, 'Guard must be inactive after runWithOfflineGuard');
    } finally {
      if (fs.existsSync(tempWav)) {
        fs.unlinkSync(tempWav);
      }
    }
  })();

  // --------------------------------------------------------------------------
  // SECTION 5: Adversarial Stress & Vulnerability Probing
  // --------------------------------------------------------------------------
  console.log('\n--- Category 5: Adversarial Stress & Vulnerability Probing ---');

  await recordTest('Adversarial - Case Insensitivity', 'blocks uppercase URLs (HTTP://EXAMPLE.COM)', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        await fetch('HTTP://EXAMPLE.COM/PATH');
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
      }
      assert.ok(threw, 'Uppercase HTTP URL must be blocked');
    } finally {
      restore();
    }
  })();

  await recordTest('Adversarial - Fake Localhost Domain', 'blocks tricky domain localhost.evil.com', async () => {
    const restore = enableOfflineNetworkGuard({ allowLocalhost: true });
    try {
      let threw = false;
      try {
        await fetch('http://localhost.evil.com');
      } catch (err: any) {
        threw = true;
        assert.ok(err instanceof OfflineNetworkViolationError);
      }
      assert.ok(threw, 'Domain localhost.evil.com must be blocked even when allowLocalhost: true');
    } finally {
      restore();
    }
  })();

  // VULNERABILITY TEST 1: Domain Prefix Spoofing Probe
  await recordTest('Vulnerability Probe 1 - Domain Prefix Spoofing', 'detects whether 127.* domain prefix slips through (127.evil.com)', async () => {
    const restore = enableOfflineNetworkGuard({ allowLocalhost: true });
    try {
      let threw = false;
      try {
        // Attempting to connect to 127.evil.com via http.get
        const req = http.get('http://127.evil.com/payload');
        req.on('error', () => {});
        req.destroy();
      } catch (err: any) {
        if (err instanceof OfflineNetworkViolationError) {
          threw = true;
        }
      }

      if (!threw) {
        // Vulnerability confirmed: guard let it pass without throwing OfflineNetworkViolationError!
        throw new Error('VULNERABILITY CONFIRMED: http.get("http://127.evil.com") bypassed offline guard because isLocalhost() uses h.startsWith("127.")');
      }
    } finally {
      restore();
    }
  })();

  // VULNERABILITY TEST 2: Unpatched dns.promises.resolve* Leak Probe
  await recordTest('Vulnerability Probe 2 - Unpatched c-ares DNS Resolver', 'detects whether dns.promises.resolve4 leaks outbound queries', async () => {
    const restore = enableOfflineNetworkGuard();
    try {
      let threw = false;
      try {
        const addresses = await dns.promises.resolve4('example.com');
        if (Array.isArray(addresses) && addresses.length > 0) {
          throw new Error(`VULNERABILITY CONFIRMED: dns.promises.resolve4("example.com") leaked outbound DNS query and returned IPs: ${addresses.join(', ')}`);
        }
      } catch (err: any) {
        if (err instanceof OfflineNetworkViolationError) {
          threw = true;
        } else if (err.message?.includes('VULNERABILITY CONFIRMED')) {
          throw err;
        }
      }
      if (!threw) {
        throw new Error('VULNERABILITY CONFIRMED: dns.promises.resolve4 is not intercepted by offline-network-guard');
      }
    } finally {
      restore();
    }
  })();

  // --------------------------------------------------------------------------
  // Summary and Verdict
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(' ADVERSARIAL CHALLENGE EXECUTION SUMMARY');
  console.log('===============================================================');

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`Total Challenges: ${results.length}`);
  console.log(`Passed: ${passedCount}`);
  console.log(`Failed / Vulnerabilities Flagged: ${failedCount}`);

  if (failedCount > 0) {
    console.log('\nVulnerabilities & Gaps Flagged:');
    for (const r of results.filter((r) => !r.passed)) {
      console.log(`  - [${r.category}] ${r.name}`);
      console.log(`    Error/Finding: ${r.error}`);
    }
  }

  return { total: results.length, passed: passedCount, failed: failedCount, results };
}

// Self-executing runner
if (require.main === module || process.argv[1]?.includes('challenger_m1_offline_guard')) {
  runAllChallenges()
    .then((summary) => {
      // Exit 0 so caller or scripts can inspect, or exit with status
      console.log(`\nRunner completed. Status: ${summary.failed > 0 ? 'VULNERABILITIES_DETECTED' : 'CLEAN'}`);
    })
    .catch((err) => {
      console.error('Fatal runner error:', err);
      process.exit(1);
    });
}
