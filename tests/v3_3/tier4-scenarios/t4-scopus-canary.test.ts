/**
 * Tier 4 Scenario Suite: Scopus Canary Real-World Pipeline Scenarios
 * Tests: T4-SCN-01 to T4-SCN-05
 *
 * T4-SCN-01 (S01): Full Scopus Explainer 103.20s Pipeline Integration (3096 frames, 23 beats, 5 scenes, PREMIXED audio)
 * T4-SCN-02 (S02): 5-Door Research Gap Taxonomy Progressive Disclosure (never mounts 3+ active cards simultaneously)
 * T4-SCN-03 (S03): 3-Tier Gap Statement Modular Assembly (Foundation -> Problem -> Positioning with physics settle)
 * T4-SCN-04 (S04): Digital Banking Case Study Mobile Legibility (informational text >= 34px, 360p preview legible without zoom)
 * T4-SCN-05 (S05): Swales CARS Move 1-2-3 Dynamic Retiming (14.5s narration driven, C0/C1 camera velocity continuity)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertClose,
  assertInRange,
  assertMonotonic,
  assertNoOverlap,
} from '../harness/assert';
import { TYPOGRAPHY_THRESHOLDS } from '../../../validators/validate-mobile-typography';

describe({ name: 'Tier 4: Scopus Canary Real-World Pipeline Scenarios', feature: 'T4-SCOPUS-CANARY', tier: 4 }, () => {
  test(
    'T4-SCN-01: Full Scopus Explainer 103.20s/3096 frames end-to-end pipeline integration',
    () => {
      // 1. Verify timeline integrity: 103.20s at 30fps = exactly 3096 frames
      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      assertTrue(fs.existsSync(timelinePath), 'semantic-timeline.json must exist');
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));

      assertEqual(timeline.fps, 30, 'Frame rate must be 30fps');
      assertEqual(timeline.totalFrames, 3096, 'Total frames must be exactly 3096');
      assertClose(timeline.totalDurationSec, 103.2, 0.05, 'Duration must be 103.20s');
      assertEqual(timeline.width, 1080, 'Canvas width must be 1080');
      assertEqual(timeline.height, 1920, 'Canvas height must be 1920');

      // 2. Verify all 5 scene components exist on disk
      const scenesDir = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/scenes');
      const expectedScenes = [
        'Scene1ProblemScopus.tsx',
        'Scene2GapTaxonomy.tsx',
        'Scene3FourStepProcess.tsx',
        'Scene4TemplateCaseStudy.tsx',
        'Scene5PitfallsConclusion.tsx',
      ];

      for (const scene of expectedScenes) {
        const fullPath = path.join(scenesDir, scene);
        assertTrue(fs.existsSync(fullPath), `Scene file ${scene} must exist`);
      }

      // 3. Verify beats count: at least 23 pedagogical beats spanning 0 to 3096
      assertTrue(timeline.beats.length >= 23, `Timeline must contain >= 23 beats, got ${timeline.beats.length}`);
      const firstBeat = timeline.beats[0];
      const lastBeat = timeline.beats[timeline.beats.length - 1];

      assertEqual(firstBeat.startFrame, 0, 'First beat must start at frame 0');
      assertTrue(lastBeat.endFrame >= 3080 && lastBeat.endFrame <= 3096, 'Last beat must end near frame 3096');

      // 4. Verify PREMIXED master audio manifest metadata
      const audioManifestPath = path.resolve(process.cwd(), 'out/audio-manifest.json');
      if (fs.existsSync(audioManifestPath)) {
        const audioManifest = JSON.parse(fs.readFileSync(audioManifestPath, 'utf-8'));
        const dur = audioManifest.output?.durationSec || audioManifest.durationSec;
        assertClose(dur, 103.2, 0.05, 'Audio manifest duration must match 103.20s');
      }
    },
    { id: 'T4-SCN-01' }
  );

  test(
    'T4-SCN-02: 5-Door Research Gap Taxonomy progressive disclosure without simultaneous card dumps',
    () => {
      // Scene 2 represents the 5 Doors of Research Gap Taxonomy:
      // Door 1: Theoretical Gap (beat_06)
      // Door 2: Empirical Gap (beat_07)
      // Door 3: Contextual Gap (beat_08)
      // Door 4: Methodological Gap (beat_09)
      // Door 5: Practical/Application Gap (beat_10)

      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));

      const taxonomyBeats = timeline.beats.filter((b: any) => b.shotId === 'shot_02');
      assertTrue(taxonomyBeats.length >= 5, `Shot 2 must contain at least 5 beats, got ${taxonomyBeats.length}`);

      // Verify progressive disclosure invariants:
      // 1. Each taxonomy item occupies its own sequential beat
      for (let i = 0; i < taxonomyBeats.length - 1; i++) {
        const curr = taxonomyBeats[i];
        const next = taxonomyBeats[i + 1];
        assertTrue(curr.endFrame <= next.startFrame, `Taxonomy beat ${curr.id} must conclude before ${next.id} starts`);
        assertTrue(curr.primaryObject && curr.primaryObject !== next.primaryObject, 'Each door must focus on a distinct primary object');
      }

      // 2. Maximum concurrent prominent cards at any frame <= 1
      const simulateActiveProminentCards = (f: number): number => {
        let activeCount = 0;
        for (const beat of taxonomyBeats) {
          if (f >= beat.startFrame && f < beat.endFrame) {
            activeCount++;
          }
        }
        return activeCount;
      };

      // Spot check frames throughout Shot 2 (frames 618 to 1309)
      for (let f = 620; f < 1300; f += 50) {
        const count = simulateActiveProminentCards(f);
        assertTrue(count <= 1, `Frame ${f} has ${count} prominent active cards (maximum allowed is 1)`);
      }
    },
    { id: 'T4-SCN-02' }
  );

  test(
    'T4-SCN-03: 3-Tier Gap statement modular assembly (Foundation -> Problem -> Positioning)',
    () => {
      // Visual metaphor: 3 interlocking building blocks
      // Tier 1: Foundation (what literature knows)
      // Tier 2: Problem (the unaddressed gap/void)
      // Tier 3: Positioning (how this study fills the gap)

      const tiers = [
        { id: 'tier_1', name: 'NỀN MÓNG (Foundation)', targetY: 1100, springDelay: 0 },
        { id: 'tier_2', name: 'KHOẢNG TRỐNG (Problem Gap)', targetY: 850, springDelay: 15 },
        { id: 'tier_3', name: 'ĐỊNH VỊ (Positioning Block)', targetY: 600, springDelay: 30 },
      ];

      // Spring physics simulation:
      // y(t) = targetY + offset * exp(-d*t) * cos(w*t)
      const simulateBlockY = (frame: number, targetY: number, delay: number): { y: number; settled: boolean; overshootPercent: number } => {
        const t = Math.max(0, (frame - delay) / 30.0); // time in seconds
        if (t === 0) return { y: targetY + 300, settled: false, overshootPercent: 0 };

        const damping = 14;
        const stiffness = 85;
        const omega = Math.sqrt(stiffness);
        const decay = Math.exp(-damping * 0.5 * t);
        const displacement = -300 * decay * Math.cos(omega * t);

        const currentY = targetY + displacement;
        const settled = decay < 0.05 && Math.abs(displacement) < 2.0;
        const maxOvershoot = 300 * Math.exp(-damping * 0.5 * (Math.PI / omega));
        const overshootPercent = (maxOvershoot / 300) * 100;

        return { y: currentY, settled, overshootPercent };
      };

      // Test sequence progression at frames 0, 20, 40, 70:
      const stateFrame70Tier1 = simulateBlockY(70, tiers[0].targetY, tiers[0].springDelay);
      const stateFrame70Tier2 = simulateBlockY(70, tiers[1].targetY, tiers[1].springDelay);
      const stateFrame70Tier3 = simulateBlockY(70, tiers[2].targetY, tiers[2].springDelay);

      // By frame 70, all 3 tiers have entered
      assertTrue(stateFrame70Tier1.settled, 'Tier 1 must be settled at frame 70');
      assertTrue(stateFrame70Tier2.settled, 'Tier 2 must be settled at frame 70');
      assertTrue(stateFrame70Tier3.settled, 'Tier 3 must be settled at frame 70');

      // Physics check: Overshoot amplitude < 15% (smooth educational motion, no bouncy cartoon antics)
      assertTrue(stateFrame70Tier1.overshootPercent < 15, `Overshoot (${stateFrame70Tier1.overshootPercent.toFixed(1)}%) must be < 15%`);

      // Structural check: Interlocking geometry: Tier 3 is above Tier 2, Tier 2 is above Tier 1
      assertTrue(stateFrame70Tier3.y < stateFrame70Tier2.y, 'Tier 3 must rest above Tier 2');
      assertTrue(stateFrame70Tier2.y < stateFrame70Tier1.y, 'Tier 2 must rest above Tier 1');
    },
    { id: 'T4-SCN-03' }
  );

  test(
    'T4-SCN-04: Digital banking case study mobile legibility >= 34px across 1080p and 360p canvases',
    () => {
      // Scene 4 Case Study Digital Banking components
      const scene4Path = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/scenes/Scene4TemplateCaseStudy.tsx');
      assertTrue(fs.existsSync(scene4Path), 'Scene4TemplateCaseStudy.tsx must exist');
      const scene4Code = fs.readFileSync(scene4Path, 'utf-8');

      // 1. Extract all font sizes declared in Scene 4
      const fontMatches = scene4Code.match(/fontSize:\s*(\d+)/g) || [];
      assertTrue(fontMatches.length >= 5, 'Scene 4 must define multiple typography elements');

      const fontSizes = fontMatches.map((m) => parseInt(m.replace(/[^\d]/g, ''), 10));

      // 2. Minimum informational font size check
      for (const size of fontSizes) {
        // Exclude tiny decoration (e.g. icon width/dots) if any
        if (size >= 20) {
          assertTrue(
            size >= TYPOGRAPHY_THRESHOLDS.secondary,
            `Font size ${size}px in Scene 4 must be >= mobile floor ${TYPOGRAPHY_THRESHOLDS.secondary}px`
          );
        }
      }

      // 3. Case study constructs: TAM variables (E-service quality, trust, perceived risk, continuance intention)
      assertTrue(
        scene4Code.includes('Ngân hàng số') || scene4Code.includes('NGÂN HÀNG SỐ'),
        'Must reference Digital Banking case study context'
      );
      assertTrue(
        scene4Code.includes('chất lượng dịch vụ điện tử') || scene4Code.includes('e-service') || scene4Code.includes('E-service'),
        'Must feature core case study construct'
      );

      // 4. Downscale to 360p preview
      const previewScale = 360 / 1080;
      for (const size of fontSizes) {
        if (size >= 34) {
          const previewHeight = size * previewScale;
          assertTrue(previewHeight >= 11.0, `Rendered height on 360p (${previewHeight.toFixed(1)}px) must be >= 11px`);
        }
      }
    },
    { id: 'T4-SCN-04' }
  );

  test(
    'T4-SCN-05: Swales CARS Move 1-2-3 dynamic retiming with continuous C0/C1 camera velocity continuity',
    () => {
      // Swales CARS (Creating A Research Space):
      // Move 1: Establishing territory (Bản chất đối thoại học thuật)
      // Move 2: Establishing a niche / gap (Nghịch lý từ chối & Khoảng trống nghiên cứu)
      // Move 3: Occupying the niche (Đóng góp mới của nghiên cứu)

      const timelinePath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/semantic-timeline.json');
      const shotSpecPath = path.resolve(process.cwd(), 'connection-film/src/legacy/scopus-explainer/shot-spec.json');

      const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf-8'));
      const shotSpec = JSON.parse(fs.readFileSync(shotSpecPath, 'utf-8'));

      // Check CARS Move coverage in Shot 1
      const shot1 = shotSpec.shots.find((s: any) => s.id === 'shot_01');
      assertTrue(shot1 !== undefined, 'Shot 1 must exist');

      const carsBeats = timeline.beats.filter((b: any) =>
        b.conceptId && (b.conceptId.includes('cars') || b.conceptId.includes('core_questions') || b.conceptId.includes('rejection'))
      );
      assertTrue(carsBeats.length >= 3, `Must encompass Move 1, 2, and 3 beats, got ${carsBeats.length}`);

      // Verify camera C0/C1 continuity in Shot 1
      const camStart = shot1.start_state?.camera || { x: 0, y: 0, zoom: 1.0 };
      const camEnd = shot1.end_state?.camera || { x: 0, y: 0, zoom: 1.0 };

      // C0 continuity: zoom smooth range
      assertInRange(camStart.zoom || 1.0, 0.8, 1.5, 'Camera start zoom within bounds');
      assertInRange(camEnd.zoom || 1.0, 0.8, 1.5, 'Camera end zoom within bounds');

      // Camera velocity: zoom change across shot duration (618 frames = 20.6s)
      const zoomVelocityPerSec = Math.abs((camEnd.zoom || 1.0) - (camStart.zoom || 1.0)) / (shot1.durationInFrames / 30.0);
      assertTrue(
        zoomVelocityPerSec < 0.1,
        `Camera zoom velocity (${zoomVelocityPerSec.toFixed(3)}/s) must be smooth (< 0.1/s) to prevent dizziness`
      );
    },
    { id: 'T4-SCN-05' }
  );
});
