import React from 'react';

const INK = '#111333';
const PURPLE = '#33245f';
const CORAL = '#ff6b78';
const GOLD = '#ffd16c';
const MINT = '#6fe0c2';

const positiveModulo = (value: number, modulus: number) =>
  ((value % modulus) + modulus) % modulus;

export type BirdMood = 'sad' | 'happy' | 'neutral' | (string & {});

export interface BirdProps {
  x?: number;
  y?: number;
  scale?: number;
  color?: string;
  frame?: number;
  mood?: BirdMood;
  flip?: boolean;
}

/**
 * A small, round storybook bird. Its local artboard is roughly 220 × 250 and
 * its feet sit on y=120, which makes it easy to place on a path or rooftop.
 */
export function Bird({
  x = 0,
  y = 0,
  scale = 1,
  color = '#ffbd69',
  frame = 0,
  mood = 'sad',
  flip = false,
}: BirdProps) {
  const tick = Number.isFinite(frame) ? frame : 0;
  const breathe = Math.sin(tick * 0.14) * 2.2;
  const wingBounce = Math.sin(tick * 0.18 + 0.8) * 2;
  const blinkTick = positiveModulo(tick, 137);
  const blinking = blinkTick > 128 && blinkTick < 135;
  const happy = mood === 'happy';
  const neutral = mood === 'neutral';
  const beakLift = happy ? -4 : neutral ? 0 : 3;
  const bodyTilt = happy ? -2 : 1;
  const wingLift = happy ? -17 + wingBounce : 4 + wingBounce;
  const eyeY = -54 + (happy ? -2 : 0);
  const inkStroke = {
    stroke: INK,
    strokeWidth: 7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <g
      transform={`translate(${x},${y}) scale(${flip ? -scale : scale},${scale})`}
      aria-hidden="true"
    >
      {/* The cast shadow stays still while the bird breathes above it. */}
      <ellipse cx="0" cy="132" rx="65" ry="10" fill={INK} opacity="0.22" />

      <g transform={`translate(0,${breathe}) rotate(${bodyTilt})`}>
        {/* Tail feathers peek out from behind the body. */}
        <path
          d="M56 45 C89 50 108 68 101 89 C94 103 72 96 54 77 Z"
          fill={CORAL}
          {...inkStroke}
        />
        <path
          d="M67 54 C90 61 97 72 92 82"
          fill="none"
          stroke={GOLD}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.9"
        />

        {/* Plump body and warm belly patch. */}
        <ellipse cx="0" cy="27" rx="78" ry="92" fill={color} {...inkStroke} />
        <ellipse
          cx="0"
          cy="45"
          rx="51"
          ry="64"
          fill={GOLD}
          opacity="0.72"
        />
        <path
          d="M-35 76 C-16 91 17 91 36 76"
          fill="none"
          stroke={CORAL}
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.72"
        />

        {/* Wings are intentionally asymmetric in the happy pose. */}
        <path
          d={
            happy
              ? `M-54 -20 C-99 -31 -111 -64 -93 -84 C-75 -102 -44 -78 -30 -47 C-25 -34 -29 -23 -39 -13 Z`
              : `M-57 -18 C-99 -2 -108 45 -82 72 C-65 90 -41 79 -29 56 C-40 35 -43 5 -57 -18 Z`
          }
          fill={color}
          {...inkStroke}
        />
        <path
          d={
            happy
              ? `M-66 -28 C-85 -48 -88 -67 -78 -75`
              : `M-73 12 C-87 30 -87 51 -75 62`
          }
          fill="none"
          stroke={MINT}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.86"
        />
        <path
          d={
            happy
              ? `M55 ${wingLift + 3} C91 ${wingLift - 3} 107 ${wingLift + 20} 92 ${wingLift + 39} C80 ${wingLift + 55} 55 ${wingLift + 39} 38 ${wingLift + 22} C40 ${wingLift + 12} 46 ${wingLift + 6} 55 ${wingLift + 3} Z`
              : `M57 ${wingLift + 5} C93 ${wingLift + 12} 105 ${wingLift + 46} 83 ${wingLift + 67} C67 ${wingLift + 82} 46 ${wingLift + 64} 34 ${wingLift + 43} C42 ${wingLift + 27} 46 ${wingLift + 13} 57 ${wingLift + 5} Z`
          }
          fill={color}
          {...inkStroke}
        />
        <path
          d={
            happy
              ? `M64 ${wingLift + 15} C79 ${wingLift + 19} 87 ${wingLift + 29} 83 ${wingLift + 36}`
              : `M69 ${wingLift + 22} C83 ${wingLift + 33} 87 ${wingLift + 47} 78 ${wingLift + 57}`
          }
          fill="none"
          stroke={MINT}
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.86"
        />

        {/* Head, crest, and a tiny side highlight give the silhouette character. */}
        <path
          d="M-38 -101 C-31 -125 -13 -126 -5 -108 C6 -132 26 -123 26 -100 C47 -111 62 -91 50 -75 C68 -66 65 -41 46 -31 C26 -21 -26 -21 -47 -34 C-68 -47 -67 -74 -48 -83 C-57 -94 -49 -108 -38 -101 Z"
          fill={color}
          {...inkStroke}
        />
        <path
          d="M-42 -93 C-30 -101 -23 -105 -11 -103"
          fill="none"
          stroke={GOLD}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.65"
        />
        <ellipse cx="-47" cy="-48" rx="11" ry="19" fill={GOLD} opacity="0.5" />

        {/* Cheeks sit behind the eyes, like two little coral brush marks. */}
        <ellipse cx="-45" cy="-32" rx="13" ry="8" fill={CORAL} opacity="0.7" />
        <ellipse cx="45" cy="-32" rx="13" ry="8" fill={CORAL} opacity="0.7" />

        {blinking ? (
          <>
            <path d={`M-47 ${eyeY} Q-35 ${eyeY + 7} -23 ${eyeY}`} fill="none" {...inkStroke} />
            <path d={`M23 ${eyeY} Q35 ${eyeY + 7} 47 ${eyeY}`} fill="none" {...inkStroke} />
          </>
        ) : (
          <>
            <circle cx="-35" cy={eyeY} r="18" fill="#fff7ef" {...inkStroke} />
            <circle cx="35" cy={eyeY} r="18" fill="#fff7ef" {...inkStroke} />
            <circle cx={happy ? -30 : -32} cy={eyeY + (happy ? -1 : 3)} r="9" fill={INK} />
            <circle cx={happy ? 30 : 32} cy={eyeY + (happy ? -1 : 3)} r="9" fill={INK} />
            <circle cx="-29" cy={eyeY - 3} r="3.5" fill="#fff7ef" />
            <circle cx="31" cy={eyeY - 3} r="3.5" fill="#fff7ef" />
          </>
        )}

        {/* Eyebrows tilt down for worry and arc up for the little victory pose. */}
        <path
          d={happy ? 'M-52 -78 Q-36 -89 -21 -81' : 'M-51 -75 Q-36 -67 -22 -75'}
          fill="none"
          {...inkStroke}
        />
        <path
          d={happy ? 'M21 -81 Q36 -89 52 -78' : 'M22 -75 Q36 -67 51 -75'}
          fill="none"
          {...inkStroke}
        />

        {/* The beak changes from a downturned worried wedge to an open chirp. */}
        {happy ? (
          <>
            <path
              d={`M-13 ${-29 + beakLift} Q0 ${-16 + beakLift} 13 ${-29 + beakLift} L0 ${-7 + beakLift} Z`}
              fill={CORAL}
              {...inkStroke}
            />
            <path
              d={`M-7 ${-18 + beakLift} Q0 ${-11 + beakLift} 7 ${-18 + beakLift}`}
              fill="none"
              stroke={GOLD}
              strokeWidth="4"
              strokeLinecap="round"
            />
          </>
        ) : (
          <path
            d={`M-14 ${-27 + beakLift} L14 ${-27 + beakLift} L0 ${-7 + beakLift} Z`}
            fill={CORAL}
            {...inkStroke}
          />
        )}

        {/* Legs remain grounded at local y=120 while the upper body breathes. */}
        <path d="M-28 101 L-30 120 M28 101 L30 120" fill="none" {...inkStroke} />
        <path d="M-47 124 Q-31 114 -16 124 M13 124 Q30 114 47 124" fill="none" {...inkStroke} />
        <path d="M-43 126 L-50 131 M-30 123 L-33 132 M-20 123 L-18 131" fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
        <path d="M18 123 L16 131 M30 123 L33 132 M43 126 L50 131" fill="none" stroke={GOLD} strokeWidth="5" strokeLinecap="round" />
      </g>
    </g>
  );
}

export interface CityProps {
  frame?: number;
}

type Building = {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  roof: 'flat' | 'gable' | 'dome' | 'spire';
  accent: string;
  windows: number;
};

const rearBuildings: Building[] = [
  { x: -34, y: 642, w: 138, h: 438, fill: '#28204e', roof: 'spire', accent: GOLD, windows: 2 },
  { x: 108, y: 710, w: 156, h: 370, fill: '#2c2357', roof: 'gable', accent: MINT, windows: 3 },
  { x: 268, y: 666, w: 124, h: 414, fill: '#29204e', roof: 'dome', accent: GOLD, windows: 2 },
  { x: 397, y: 744, w: 148, h: 336, fill: '#241d47', roof: 'flat', accent: CORAL, windows: 3 },
  { x: 550, y: 700, w: 132, h: 380, fill: '#2d2358', roof: 'gable', accent: GOLD, windows: 2 },
  { x: 690, y: 814, w: 174, h: 266, fill: '#29204e', roof: 'flat', accent: MINT, windows: 3 },
  { x: 1054, y: 780, w: 164, h: 300, fill: '#2b2052', roof: 'flat', accent: GOLD, windows: 3 },
  { x: 1229, y: 706, w: 136, h: 374, fill: '#291f50', roof: 'spire', accent: MINT, windows: 2 },
  { x: 1377, y: 652, w: 166, h: 428, fill: '#2f2359', roof: 'dome', accent: GOLD, windows: 3 },
  { x: 1554, y: 733, w: 134, h: 347, fill: '#261d49', roof: 'gable', accent: CORAL, windows: 2 },
  { x: 1698, y: 624, w: 168, h: 456, fill: '#2d2255', roof: 'spire', accent: MINT, windows: 3 },
  { x: 1875, y: 715, w: 95, h: 365, fill: '#251c46', roof: 'flat', accent: GOLD, windows: 2 },
];

const frontBuildings: Building[] = [
  { x: -90, y: 790, w: 230, h: 290, fill: '#1f1940', roof: 'flat', accent: MINT, windows: 3 },
  { x: 150, y: 842, w: 196, h: 238, fill: '#211a42', roof: 'gable', accent: GOLD, windows: 3 },
  { x: 357, y: 806, w: 210, h: 274, fill: '#201940', roof: 'flat', accent: CORAL, windows: 3 },
  { x: 579, y: 866, w: 184, h: 214, fill: '#1d173a', roof: 'flat', accent: GOLD, windows: 2 },
  { x: 1153, y: 858, w: 187, h: 222, fill: '#1d173a', roof: 'flat', accent: CORAL, windows: 2 },
  { x: 1350, y: 804, w: 217, h: 276, fill: '#201940', roof: 'dome', accent: MINT, windows: 3 },
  { x: 1580, y: 850, w: 196, h: 230, fill: '#211a42', roof: 'gable', accent: GOLD, windows: 3 },
  { x: 1790, y: 774, w: 220, h: 306, fill: '#1e183d', roof: 'flat', accent: CORAL, windows: 3 },
];

function BuildingShape({ building, index, foreground = false }: { building: Building; index: number; foreground?: boolean }) {
  const { x, y, w, h, fill, roof, accent, windows } = building;
  const rows = Math.max(2, Math.floor((h - 55) / 58));
  const columns = windows;
  const windowWidth = Math.min(28, (w - 36) / columns - 9);
  const windowHeight = foreground ? 23 : 20;

  return (
    <g key={`${foreground ? 'front' : 'rear'}-building-${index}`}>
      <rect x={x} y={y} width={w} height={h} rx="8" fill={fill} stroke={INK} strokeWidth="7" />
      {roof === 'flat' && (
        <>
          <path d={`M${x - 6} ${y} H${x + w + 6}`} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" />
          <rect x={x + w * 0.2} y={y - 17} width={w * 0.17} height="17" rx="5" fill={accent} opacity="0.9" />
        </>
      )}
      {roof === 'gable' && (
        <path d={`M${x - 9} ${y} L${x + w / 2} ${y - 47} L${x + w + 9} ${y} Z`} fill={accent} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      )}
      {roof === 'dome' && (
        <>
          <path d={`M${x + 13} ${y} Q${x + w / 2} ${y - 63} ${x + w - 13} ${y} Z`} fill={accent} stroke={INK} strokeWidth="7" />
          <circle cx={x + w / 2} cy={y - 67} r="8" fill={GOLD} stroke={INK} strokeWidth="5" />
        </>
      )}
      {roof === 'spire' && (
        <>
          <path d={`M${x - 8} ${y} L${x + w / 2} ${y - 41} L${x + w + 8} ${y} Z`} fill={accent} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
          <path d={`M${x + w / 2} ${y - 41} V${y - 92}`} fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" />
          <circle cx={x + w / 2} cy={y - 98} r="7" fill={GOLD} stroke={INK} strokeWidth="5" />
        </>
      )}
      <g opacity={foreground ? 1 : 0.8}>
        {Array.from({ length: rows }).flatMap((_, row) =>
          Array.from({ length: columns }).map((__, column) => {
            const lit = (row * 3 + column * 5 + index) % 7 !== 1;
            const wx = x + 18 + column * ((w - 36) / columns) + ((w - 36) / columns - windowWidth) / 2;
            const wy = y + 28 + row * 55;
            return (
              <g key={`window-${row}-${column}`}>
                <rect x={wx} y={wy} width={windowWidth} height={windowHeight} rx="5" fill={lit ? accent : PURPLE} stroke={INK} strokeWidth="4" />
                {lit && <path d={`M${wx + windowWidth / 2} ${wy + 4} V${wy + windowHeight - 4}`} stroke={INK} strokeWidth="3" opacity="0.55" />}
              </g>
            );
          }),
        )}
      </g>
      {foreground && (
        <path d={`M${x + 12} ${y + 80} V${y + h - 14} M${x + w - 12} ${y + 80} V${y + h - 14}`} stroke={INK} strokeWidth="4" opacity="0.6" />
      )}
    </g>
  );
}

function Bush({ x, y, scale = 1, color = MINT }: { x: number; y: number; scale?: number; color?: string }) {
  return (
    <g transform={`translate(${x},${y}) scale(${scale})`}>
      <path d="M-74 20 Q-66 -18 -36 2 Q-24 -42 6 -9 Q29 -43 51 -8 Q86 -22 86 20 Z" fill={color} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M-54 18 Q-47 -1 -35 18 M-5 18 Q4 -9 16 18 M43 18 Q51 -5 60 18" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" opacity="0.45" />
      <circle cx="-29" cy="-1" r="7" fill={GOLD} />
      <circle cx="28" cy="-8" r="6" fill={CORAL} />
    </g>
  );
}

/**
 * A complete 1920 × 1080 whimsical city plate. The middle stays low and
 * quiet so a character can read clearly against the hills and evening sky.
 */
export function City({ frame = 0 }: CityProps) {
  const tick = Number.isFinite(frame) ? frame : 0;
  const hillDrift = Math.sin(tick * 0.012) * 9;
  const rearDrift = Math.sin(tick * 0.019 + 0.7) * 3;
  const cloudDrift = Math.sin(tick * 0.008) * 16;

  const stars = [
    [96, 132, 5], [183, 261, 4], [310, 111, 7], [465, 214, 4], [594, 145, 5],
    [1314, 156, 5], [1450, 91, 4], [1598, 246, 6], [1778, 116, 5], [1888, 284, 4],
    [710, 172, 3], [1222, 286, 4],
  ] as const;

  return (
    <g aria-hidden="true">
      <rect width="1920" height="1080" fill={PURPLE} />
      <rect width="1920" height="620" fill="#3a286d" opacity="0.52" />

      <g transform={`translate(${cloudDrift},0)`} opacity="0.6">
        <path d="M218 350 Q266 307 316 347 Q361 315 406 357 Q449 351 473 380 H192 Q194 355 218 350 Z" fill={MINT} opacity="0.35" />
        <path d="M1450 390 Q1490 350 1530 383 Q1570 342 1626 390 Q1664 383 1686 418 H1411 Q1416 397 1450 390 Z" fill={GOLD} opacity="0.22" />
        <path d="M757 191 Q789 166 822 191 Q850 163 883 197 H735 Q739 192 757 191 Z" fill={MINT} opacity="0.26" />
      </g>

      {stars.map(([sx, sy, radius], i) => (
        <g key={`star-${i}`} opacity={0.55 + ((i % 3) * 0.15)}>
          <circle cx={sx} cy={sy} r={radius} fill={i % 2 ? GOLD : MINT} />
          {i % 3 === 0 && <path d={`M${sx} ${sy - radius - 7} V${sy + radius + 7} M${sx - radius - 7} ${sy} H${sx + radius + 7}`} stroke={GOLD} strokeWidth="3" strokeLinecap="round" />}
        </g>
      ))}

      <g transform={`translate(${hillDrift},0)`}>
        <path d="M-80 700 Q180 550 420 678 Q660 500 915 675 Q1138 527 1360 666 Q1584 507 1815 674 Q1935 597 2020 659 V1080 H-80 Z" fill="#28205a" opacity="0.92" />
        <path d="M-80 738 Q179 621 408 735 Q646 588 879 730 Q1107 612 1334 733 Q1586 578 1811 728 Q1955 657 2020 704 V1080 H-80 Z" fill="#211b4a" opacity="0.8" />
        <path d="M82 719 Q193 646 294 702 M469 690 Q590 612 704 687 M1328 690 Q1450 610 1569 693 M1695 703 Q1810 635 1902 689" fill="none" stroke={MINT} strokeWidth="8" strokeLinecap="round" opacity="0.42" />
      </g>

      <g transform={`translate(${rearDrift},0)`}>
        {rearBuildings.map((building, index) => (
          <BuildingShape key={`rear-${index}`} building={building} index={index} />
        ))}
      </g>

      {/* A low plaza gap around the middle preserves the focal area. */}
      <path d="M0 1038 Q308 1004 604 1041 Q812 1062 1002 1036 Q1221 1008 1458 1043 Q1694 1068 1920 1028 V1080 H0 Z" fill="#171633" opacity="0.95" />
      <path d="M0 1015 Q260 977 529 1013 T1053 1008 T1577 1015 T1920 1001" fill="none" stroke={GOLD} strokeWidth="8" strokeLinecap="round" opacity="0.32" />

      <g>
        {frontBuildings.map((building, index) => (
          <BuildingShape key={`front-${index}`} building={building} index={index} foreground />
        ))}
      </g>

      {/* Rooftop details break up the long horizontal skyline. */}
      <g fill="none" stroke={INK} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M511 796 V752 H530 V796 M530 752 H565" />
        <path d="M1437 801 V760 Q1460 739 1483 760 V801" />
        <path d="M1854 770 V727 M1838 742 H1872" />
      </g>
      <g fill={GOLD} stroke={INK} strokeWidth="5">
        <circle cx="520" cy="746" r="7" />
        <circle cx="1460" cy="752" r="7" />
        <circle cx="1854" cy="720" r="7" />
      </g>

      <g>
        <Bush x={116} y={1013} scale={1.22} color={MINT} />
        <Bush x={437} y={1016} scale={0.92} color="#58caae" />
        <Bush x={671} y={1017} scale={0.68} color={GOLD} />
        <Bush x={1261} y={1013} scale={0.82} color={MINT} />
        <Bush x={1574} y={1018} scale={1.1} color="#58caae" />
        <Bush x={1848} y={1014} scale={0.8} color={GOLD} />
      </g>

      <path d="M0 1073 H1920" stroke={INK} strokeWidth="16" strokeLinecap="round" />
    </g>
  );
}

export interface PlanetProps {
  frame?: number;
}

/** A hand-drawn planet badge with a gold rim, turquoise continents, and orbiting dots. */
export function Planet({ frame = 0 }: PlanetProps) {
  const tick = Number.isFinite(frame) ? frame : 0;
  const orbitAngle = tick * 0.022;
  const dot = (radius: number, angle: number) => ({
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius * 0.38,
  });
  const dotA = dot(380, orbitAngle);
  const dotB = dot(380, orbitAngle + Math.PI);
  const dotC = dot(380, orbitAngle + Math.PI * 0.5);
  const cloudDrift = Math.sin(tick * 0.018) * 7;

  return (
    <g aria-hidden="true">
      <ellipse cx="0" cy="0" rx="383" ry="148" fill="none" stroke={MINT} strokeWidth="7" opacity="0.48" transform="rotate(-14)" />
      <ellipse cx="0" cy="0" rx="344" ry="128" fill="none" stroke={GOLD} strokeWidth="4" opacity="0.32" transform="rotate(19)" />
      <circle cx={dotA.x} cy={dotA.y} r="13" fill={GOLD} stroke={INK} strokeWidth="6" />
      <circle cx={dotB.x} cy={dotB.y} r="9" fill={CORAL} stroke={INK} strokeWidth="5" />
      <circle cx={dotC.x} cy={dotC.y} r="7" fill={MINT} stroke={INK} strokeWidth="4" />

      <circle r="311" fill={INK} opacity="0.42" transform="translate(8,13)" />
      <circle r="306" fill="#1b5964" stroke={GOLD} strokeWidth="12" />
      <circle r="292" fill="#216f77" stroke={INK} strokeWidth="6" />

      {/* Ocean glints use broad flat shapes so the globe reads at small sizes. */}
      <path d="M-236 -169 Q-158 -236 -44 -235 Q-116 -194 -138 -134 Q-192 -117 -236 -169 Z" fill={MINT} opacity="0.2" />
      <path d="M105 232 Q185 205 237 132" fill="none" stroke={MINT} strokeWidth="10" strokeLinecap="round" opacity="0.25" />

      {/* North America and its island chain. */}
      <path d="M-238 -132 Q-201 -203 -129 -208 L-83 -184 L-68 -144 L-102 -122 L-126 -80 L-174 -73 L-192 -39 L-227 -53 L-216 -91 Z" fill={MINT} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M-99 -52 Q-70 -75 -42 -51 L-62 -16 L-92 -11 L-111 -29 Z" fill={MINT} stroke={INK} strokeWidth="7" />
      <circle cx="-205" cy="-22" r="9" fill={GOLD} stroke={INK} strokeWidth="4" />
      <circle cx="-190" cy="-8" r="6" fill={GOLD} />

      {/* South America. */}
      <path d="M-77 -1 Q-35 4 -28 43 L-46 81 L-41 120 L-70 179 L-100 217 L-122 179 L-112 132 L-133 93 L-117 50 Z" fill={MINT} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M-92 187 L-109 226" fill="none" stroke={GOLD} strokeWidth="8" strokeLinecap="round" opacity="0.8" />

      {/* Europe, Asia, Africa. */}
      <path d="M-9 -159 L44 -173 L74 -149 L129 -161 L191 -127 L242 -79 L215 -45 L171 -47 L147 -18 L99 -26 L68 -3 L30 -20 L37 -57 L1 -83 Z" fill={MINT} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M43 -22 Q86 -9 112 28 L103 83 L72 114 L45 81 L21 39 Z" fill={MINT} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M116 103 Q161 88 191 110 L210 145 L186 165 L146 153 L119 177 L95 150 Z" fill={MINT} stroke={INK} strokeWidth="7" strokeLinejoin="round" />
      <path d="M226 -45 L253 -30 L260 -8 L239 4 L219 -14 Z" fill={MINT} stroke={INK} strokeWidth="6" />
      <circle cx="178" cy="-104" r="8" fill={GOLD} stroke={INK} strokeWidth="4" />
      <circle cx="200" cy="-86" r="6" fill={GOLD} />

      {/* Cloud ribbons drift a few pixels with the frame. */}
      <g transform={`translate(${cloudDrift},0)`} fill="none" stroke="#dcfff1" strokeLinecap="round">
        <path d="M-267 44 Q-208 17 -150 45 Q-106 66 -54 45" strokeWidth="17" opacity="0.64" />
        <path d="M-12 173 Q57 141 125 170 Q167 187 215 169" strokeWidth="15" opacity="0.5" />
        <path d="M111 -205 Q159 -181 204 -195" strokeWidth="12" opacity="0.56" />
      </g>
      <path d="M-260 -194 Q-224 -235 -176 -247" fill="none" stroke="#fff1d5" strokeWidth="8" strokeLinecap="round" opacity="0.75" />
      <circle cx="-192" cy="-235" r="7" fill="#fff1d5" opacity="0.9" />
    </g>
  );
}

export default { Bird, City, Planet };
