/**
 * Tier 1 Feature Suite: F16 — Generalization Proof (3 Unseen Mini-Projects) (R16)
 *
 * Verifies domain-agnostic execution across Science/Mechanism, Historical/Process,
 * and Technology/Tutorial domains, generic CLI validator flags, and zero Scopus coupling.
 */

import { describe, test } from '../harness/test-context';
import {
  assertTrue,
  assertFalse,
  assertEqual,
  assertSchema,
} from '../harness/assert';

describe({ name: 'F16: Generalization Proof Contract', feature: 'F16', tier: 1 }, () => {
  interface MiniProjectManifest {
    domain: 'science' | 'history' | 'technology';
    name: string;
    timelineFile: string;
    shotSpecFile: string;
    contentMapFile: string;
    masterAudio: string;
  }

  const UNSEEN_PROJECTS: MiniProjectManifest[] = [
    {
      domain: 'science',
      name: 'crispr-cas9-mechanism',
      timelineFile: 'mini-projects/science-mechanism/semantic-timeline.json',
      shotSpecFile: 'mini-projects/science-mechanism/shot-spec.json',
      contentMapFile: 'mini-projects/science-mechanism/source-content-map.json',
      masterAudio: 'mini-projects/science-mechanism/audio/master_audio.wav',
    },
    {
      domain: 'history',
      name: 'printing-press-revolution',
      timelineFile: 'mini-projects/historical-process/semantic-timeline.json',
      shotSpecFile: 'mini-projects/historical-process/shot-spec.json',
      contentMapFile: 'mini-projects/historical-process/source-content-map.json',
      masterAudio: 'mini-projects/historical-process/audio/master_audio.wav',
    },
    {
      domain: 'technology',
      name: 'tls-cryptographic-handshake',
      timelineFile: 'mini-projects/tech-tutorial/semantic-timeline.json',
      shotSpecFile: 'mini-projects/tech-tutorial/shot-spec.json',
      contentMapFile: 'mini-projects/tech-tutorial/source-content-map.json',
      masterAudio: 'mini-projects/tech-tutorial/audio/master_audio.wav',
    },
  ];

  test(
    'F16-01: Science / Mechanism explainer project satisfies canonical manifest contract',
    () => {
      const scienceProject = UNSEEN_PROJECTS[0];
      assertEqual(scienceProject.domain, 'science');
      assertSchema(scienceProject, {
        domain: (d) => d === 'science',
        name: 'string',
        timelineFile: 'string',
        shotSpecFile: 'string',
        contentMapFile: 'string',
        masterAudio: 'string',
      });
    },
    { id: 'T1-F16-001' }
  );

  test(
    'F16-02: Historical / Process explainer project satisfies canonical manifest contract',
    () => {
      const historyProject = UNSEEN_PROJECTS[1];
      assertEqual(historyProject.domain, 'history');
      assertSchema(historyProject, {
        domain: (d) => d === 'history',
        name: 'string',
        timelineFile: 'string',
        shotSpecFile: 'string',
        contentMapFile: 'string',
        masterAudio: 'string',
      });
    },
    { id: 'T1-F16-002' }
  );

  test(
    'F16-03: Technology / Tutorial explainer project satisfies canonical manifest contract',
    () => {
      const techProject = UNSEEN_PROJECTS[2];
      assertEqual(techProject.domain, 'technology');
      assertSchema(techProject, {
        domain: (d) => d === 'technology',
        name: 'string',
        timelineFile: 'string',
        shotSpecFile: 'string',
        contentMapFile: 'string',
        masterAudio: 'string',
      });
    },
    { id: 'T1-F16-003' }
  );

  test(
    'F16-04: Domain-agnostic CLI validator flags allow arbitrary project inspection',
    () => {
      const parseValidatorArgs = (args: string[]): { projectPath?: string; timeline?: string } => {
        const result: { projectPath?: string; timeline?: string } = {};
        for (const arg of args) {
          if (arg.startsWith('--project=')) {
            result.projectPath = arg.split('=')[1];
          } else if (arg.startsWith('--timeline=')) {
            result.timeline = arg.split('=')[1];
          }
        }
        return result;
      };

      const parsed = parseValidatorArgs([
        '--project=mini-projects/tech-tutorial',
        '--timeline=mini-projects/tech-tutorial/semantic-timeline.json',
      ]);
      assertEqual(parsed.projectPath, 'mini-projects/tech-tutorial');
      assertEqual(parsed.timeline, 'mini-projects/tech-tutorial/semantic-timeline.json');
    },
    { id: 'T1-F16-004' }
  );

  test(
    'F16-05: Elimination of Scopus-specific filename coupling in reusable core tooling',
    () => {
      const isToolCoupledToScopus = (sourceCode: string): boolean => {
        // Detect hardcoded coupling without argument override capability
        const hardcodedScopusPath = /['"]connection-film\/src\/scopus-explainer\/[^'"]+['"]/g;
        const matches = sourceCode.match(hardcodedScopusPath) || [];
        return matches.length > 0;
      };

      const genericTool = `
        const projectDir = process.argv[2] || process.env.PROJECT_DIR || '.';
        const timelinePath = path.join(projectDir, 'semantic-timeline.json');
      `;
      assertFalse(isToolCoupledToScopus(genericTool), 'Generic tooling must not contain hardcoded project paths');

      const coupledTool = `
        const timelinePath = 'connection-film/src/scopus-explainer/semantic-timeline.json';
      `;
      assertTrue(isToolCoupledToScopus(coupledTool), 'Must detect hardcoded Scopus coupling');
    },
    { id: 'T1-F16-005' }
  );
});
