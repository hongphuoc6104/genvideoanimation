import {
  AbsoluteFill,
  Audio,
  interpolate,
  staticFile,
  useCurrentFrame,
} from 'remotion';
import { Bird, City, Planet } from './Art';

const WIDTH = 1920;
const HEIGHT = 1080;
const DURATION = 450;

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

const easeInOut = (value: number) => {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
};

const inOutCubic = (value: number) => {
  const t = clamp01(value);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const reveal = (frame: number, start: number, end: number) =>
  easeInOut((frame - start) / Math.max(1, end - start));

const fadeOut = (frame: number, start: number, end: number) =>
  1 - reveal(frame, start, end);

const pulse = (frame: number, period: number, phase = 0) =>
  (Math.sin((frame + phase) / period * Math.PI * 2) + 1) / 2;

const seeded = (index: number) => {
  const value = Math.sin(index * 91.173 + 17.71) * 43758.5453;
  return value - Math.floor(value);
};

const STAR_FIELD = Array.from({ length: 92 }, (_, index) => ({
  x: 26 + seeded(index * 3 + 1) * (WIDTH - 52),
  y: 22 + seeded(index * 3 + 2) * 540,
  r: 0.45 + seeded(index * 3 + 3) * 2.1,
  phase: seeded(index * 5 + 7) * 100,
  depth: 0.2 + seeded(index * 11 + 4) * 0.8,
}));

const DUST_FIELD = Array.from({ length: 34 }, (_, index) => ({
  x: 160 + seeded(index * 7 + 4) * 1600,
  y: 220 + seeded(index * 7 + 5) * 610,
  r: 1.2 + seeded(index * 7 + 6) * 4.2,
  phase: seeded(index * 9 + 1) * 100,
}));

const SIGNAL_PATHS = [
  {
    d: 'M 816 646 C 930 504 1085 496 1284 590',
    controls: [[816, 646], [930, 504], [1085, 496], [1284, 590]],
    delay: 0,
    width: 8,
  },
  {
    d: 'M 820 666 C 966 584 1114 560 1302 626',
    controls: [[820, 666], [966, 584], [1114, 560], [1302, 626]],
    delay: 11,
    width: 4,
  },
  {
    d: 'M 828 684 C 979 676 1138 640 1317 655',
    controls: [[828, 684], [979, 676], [1138, 640], [1317, 655]],
    delay: 23,
    width: 3,
  },
];

const WORLD_BIRDS = [
  { x: 0, y: -420, scale: 0.53, color: '#ffbf5f', flip: false, phase: 0 },
  { x: 418, y: -145, scale: 0.5, color: '#f47c6b', flip: true, phase: 19 },
  { x: 342, y: 278, scale: 0.5, color: '#7bc8e8', flip: true, phase: 34 },
  { x: -356, y: 282, scale: 0.5, color: '#e993d0', flip: false, phase: 52 },
  { x: -452, y: -110, scale: 0.52, color: '#a8d86e', flip: false, phase: 68 },
  { x: 9, y: 414, scale: 0.46, color: '#ffd16d', flip: true, phase: 85 },
];

const WORLD_LINKS = [
  { d: 'M 0 -254 C 4 -320 -4 -380 0 -420', end: [0, -420], delay: 0 },
  { d: 'M 222 -160 C 300 -170 358 -146 418 -145', end: [418, -145], delay: 9 },
  { d: 'M 190 194 C 260 246 300 273 342 278', end: [342, 278], delay: 18 },
  { d: 'M -185 184 C -254 248 -308 278 -356 282', end: [-356, 282], delay: 27 },
  { d: 'M -218 -132 C -312 -148 -382 -118 -452 -110', end: [-452, -110], delay: 36 },
  { d: 'M 0 252 C 16 314 10 372 9 414', end: [9, 414], delay: 45 },
  { d: 'M -205 -150 C -72 -360 102 -354 230 -161', end: [230, -161], delay: 52 },
];

const cubicPoint = (
  t: number,
  p0: readonly number[],
  p1: readonly number[],
  p2: readonly number[],
  p3: readonly number[],
): [number, number] => {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
};

const orbitPoint = (frame: number, index: number, radius: number) => {
  const angle = frame * (0.004 + index * 0.00055) + index * 1.11;
  const eccentricity = 0.82 + (index % 3) * 0.08;
  return [
    Math.cos(angle) * radius,
    Math.sin(angle) * radius * eccentricity,
  ] as [number, number];
};

const TextBlock = ({
  title,
  subtitle,
  titleY,
  subtitleY,
  titleSize,
  opacity,
  accent,
}: {
  title: string;
  subtitle: string;
  titleY: number;
  subtitleY: number;
  titleSize: number;
  opacity: number;
  accent: string;
}) => (
  <g opacity={opacity} textAnchor="middle" fontFamily="'DejaVu Sans', sans-serif">
    <text
      x={WIDTH / 2}
      y={titleY}
      fill="#fff6df"
      fontSize={titleSize}
      fontWeight={700}
      letterSpacing={titleSize > 45 ? 3.7 : 3}
    >
      {title}
    </text>
    <rect
      x={WIDTH / 2 - 34}
      y={titleY + 27}
      width={68}
      height={4}
      rx={2}
      fill={accent}
      opacity={0.9}
    />
    <text
      x={WIDTH / 2}
      y={subtitleY}
      fill="#d8d3ed"
      fontSize={25}
      fontWeight={400}
      letterSpacing={0.7}
    >
      {subtitle}
    </text>
  </g>
);

export function FilmFrame({frame}: {frame: number}) {
  const safeFrame = Math.min(DURATION - 1, Math.max(0, frame));

  const act0Opacity = fadeOut(safeFrame, 132, 181);
  const act1Opacity = reveal(safeFrame, 132, 164) * fadeOut(safeFrame, 286, 322);
  const act2Opacity = reveal(safeFrame, 283, 329);

  const cameraProgress = reveal(safeFrame, 0, DURATION);
  const cameraScale = 1 + cameraProgress * 0.035;
  const cameraX = Math.sin(safeFrame * 0.007) * 4 - reveal(safeFrame, 270, 430) * 22;
  const cameraY = Math.cos(safeFrame * 0.005) * 2 + reveal(safeFrame, 270, 430) * 10;
  const cameraTransform = `translate(${WIDTH / 2 + cameraX} ${HEIGHT / 2 + cameraY}) scale(${cameraScale}) translate(${-WIDTH / 2} ${-HEIGHT / 2})`;

  const skyShiftOpacity = reveal(safeFrame, 270, 390);
  const cityDrift = -safeFrame * 0.035;
  const birdBob = Math.sin(safeFrame * 0.095) * 7;
  const birdBreath = Math.sin(safeFrame * 0.075 + 1.3) * 0.018;
  const moodBlend = reveal(safeFrame, 172, 207);

  const secondBirdProgress = inOutCubic((safeFrame - 180) / 92);
  const secondBirdX = interpolate(secondBirdProgress, [0, 1], [2050, 1394]);
  const secondBirdY = 650 + Math.sin(safeFrame * 0.09 + 0.4) * 10;
  const signalStart = reveal(safeFrame, 148, 213);
  const signalEnd = reveal(safeFrame, 246, 283);

  const irisProgress = reveal(safeFrame, 291, 365);
  const irisRadius = irisProgress * 1410;
  const irisX = interpolate(reveal(safeFrame, 291, 340), [0, 1], [1080, 960]);
  const irisY = interpolate(reveal(safeFrame, 291, 340), [0, 1], [632, 552]);
  const planetScale = interpolate(reveal(safeFrame, 297, 382), [0, 1], [0.28, 0.83]);
  const planetFloat = Math.sin(safeFrame * 0.032) * 8;
  const planetCenterY = 625 + planetFloat;
  const endTextOpacity = reveal(safeFrame, 350, 390);

  return (
    <AbsoluteFill style={{ backgroundColor: '#100b2d', fontFamily: "'DejaVu Sans', sans-serif" }}>
      <svg
        width={WIDTH}
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="MỘT KẾT NỐI NHỎ — an animated story about a hello bringing a world closer"
        style={{ display: 'block', width: '100%', height: '100%' }}
      >
        <defs>
          <linearGradient id="film-sky" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0" stopColor="#170f43" />
            <stop offset="0.54" stopColor="#33205f" />
            <stop offset="1" stopColor="#171332" />
          </linearGradient>
          <linearGradient id="film-horizon" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#8154a6" stopOpacity="0" />
            <stop offset="0.55" stopColor="#f19b74" stopOpacity="0.17" />
            <stop offset="1" stopColor="#ffb663" stopOpacity="0.1" />
          </linearGradient>
          <radialGradient id="film-moon" cx="35%" cy="30%" r="75%">
            <stop offset="0" stopColor="#fff9d6" />
            <stop offset="0.5" stopColor="#ffd981" />
            <stop offset="1" stopColor="#e9a456" />
          </radialGradient>
          <radialGradient id="film-moon-halo">
            <stop offset="0" stopColor="#ffe1a1" stopOpacity="0.48" />
            <stop offset="0.4" stopColor="#ffbf79" stopOpacity="0.14" />
            <stop offset="1" stopColor="#ffbf79" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="film-iris-wash">
            <stop offset="0" stopColor="#fff1c4" stopOpacity="0.94" />
            <stop offset="0.62" stopColor="#c58ad6" stopOpacity="0.2" />
            <stop offset="1" stopColor="#110b30" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="film-vignette">
            <stop offset="0.48" stopColor="#07051a" stopOpacity="0" />
            <stop offset="0.86" stopColor="#07051a" stopOpacity="0.08" />
            <stop offset="1" stopColor="#07051a" stopOpacity="0.25" />
          </radialGradient>
          <filter id="film-blur-30" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="30" />
          </filter>
          <filter id="film-blur-12" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="12" />
          </filter>
          <filter id="film-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <clipPath id="film-iris" clipPathUnits="userSpaceOnUse">
            <circle cx={irisX} cy={irisY} r={irisRadius} />
          </clipPath>
        </defs>

        <rect width={WIDTH} height={HEIGHT} fill="url(#film-sky)" />
        <rect width={WIDTH} height={HEIGHT} fill="#0b0827" opacity={skyShiftOpacity * 0.62} />
        <rect width={WIDTH} height={HEIGHT} fill="url(#film-horizon)" opacity={1 - skyShiftOpacity * 0.4} />

        <g aria-hidden="true">
          {STAR_FIELD.map((star, index) => (
            <circle
              key={`star-${index}`}
              cx={star.x + cityDrift * star.depth}
              cy={star.y}
              r={star.r}
              fill={index % 9 === 0 ? '#ffd68d' : '#c7c6f1'}
              opacity={0.18 + (0.32 + 0.48 * pulse(safeFrame, 70 + (index % 4) * 11, star.phase)) * star.depth}
            />
          ))}
          {DUST_FIELD.map((dust, index) => (
            <circle
              key={`dust-${index}`}
              cx={dust.x + Math.sin(safeFrame * 0.006 + index) * 22}
              cy={dust.y + Math.cos(safeFrame * 0.008 + index) * 11}
              r={dust.r}
              fill={index % 2 ? '#ffd48c' : '#a8a3e5'}
              opacity={skyShiftOpacity * (0.08 + 0.16 * pulse(safeFrame, 100 + index * 2, dust.phase))}
            />
          ))}
        </g>

        <g transform={cameraTransform}>
          <g opacity={act0Opacity + act1Opacity * 0.47}>
            <g transform={`translate(${cityDrift} 0)`} opacity={0.97}>
              <City frame={safeFrame} />
            </g>
            <rect x="0" y="760" width={WIDTH} height="320" fill="url(#film-horizon)" opacity="0.7" />
          </g>

          <g opacity={act0Opacity}>
            <g transform="translate(0 2)">
              <circle cx="1542" cy={252 + Math.sin(safeFrame * 0.018) * 6} r="245" fill="url(#film-moon-halo)" filter="url(#film-blur-12)" />
              <circle cx="1542" cy={252 + Math.sin(safeFrame * 0.018) * 6} r="137" fill="url(#film-moon)" />
              <path
                d="M 1596 126 C 1552 167 1532 240 1555 304 C 1570 345 1598 370 1636 381 C 1581 407 1502 384 1464 333 C 1414 267 1427 174 1496 127 C 1527 106 1565 101 1596 126 Z"
                fill="#e4a55c"
                opacity="0.42"
              />
              <circle cx="1501" cy="217" r="13" fill="#efb86b" opacity="0.35" />
              <circle cx="1564" cy="302" r="7" fill="#efb86b" opacity="0.32" />
            </g>
            <g opacity={0.28 + pulse(safeFrame, 47) * 0.17} filter="url(#film-glow)">
              <path d="M 824 652 C 880 600 901 576 938 547" fill="none" stroke="#ffc767" strokeWidth="3" strokeLinecap="round" />
              <circle cx="824" cy="652" r="16" fill="none" stroke="#ffc767" strokeWidth="3" />
            </g>
          </g>

          <g opacity={act0Opacity}>
            <g transform={`translate(0 ${birdBob}) scale(${1 + birdBreath})`}>
              <circle cx="816" cy="760" r="120" fill="#f8bd6b" opacity="0.11" filter="url(#film-blur-30)" />
              <ellipse cx="816" cy="801" rx="128" ry="18" fill="#100b2d" opacity="0.38" />
              <Bird x={816} y={642} scale={1} color="#f6ae4f" frame={safeFrame} mood="sad" flip={false} />
            </g>
            <TextBlock
              title="GIỮA THẾ GIỚI RỘNG LỚN"
              subtitle="Đôi khi, ta thấy mình thật nhỏ."
              titleY={92}
              subtitleY={147}
              titleSize={45}
              opacity={reveal(safeFrame, 12, 37) * fadeOut(safeFrame, 133, 176)}
              accent="#ffc764"
            />
          </g>

          <g opacity={act1Opacity}>
            <g opacity={0.23 + signalStart * 0.1}>
              <ellipse cx="1068" cy="630" rx="390" ry="240" fill="#f8aa77" opacity="0.18" filter="url(#film-blur-30)" />
            </g>
            <g transform={`translate(0 ${birdBob * 0.85}) scale(${1 + birdBreath * 0.8})`}>
              <circle cx="816" cy="760" r={92 + signalEnd * 22} fill="none" stroke="#ffd07d" strokeWidth="2" opacity={0.18 + signalEnd * 0.16} />
              <circle cx="816" cy="760" r={122 + signalEnd * 34} fill="none" stroke="#ffd07d" strokeWidth="2" opacity={0.1 + signalEnd * 0.12} strokeDasharray="7 17" transform={`rotate(${safeFrame * 2.2} 816 760)`} />
              <g opacity={1 - moodBlend}>
                <Bird x={816} y={642} scale={1} color="#f6ae4f" frame={safeFrame} mood="sad" flip={false} />
              </g>
              <g opacity={moodBlend}>
                <Bird x={816} y={638} scale={1.02} color="#f6ae4f" frame={safeFrame} mood="happy" flip={false} />
              </g>
            </g>

            {SIGNAL_PATHS.map((path, index) => {
              const pathProgress = reveal(safeFrame, 153 + path.delay, 238 + path.delay);
              return (
                <g key={`signal-${index}`} opacity={0.52 + index * 0.12}>
                  <path
                    d={path.d}
                    fill="none"
                    stroke="#ffc86c"
                    strokeWidth={path.width * 2.8}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - pathProgress}
                    opacity="0.23"
                    filter="url(#film-blur-12)"
                  />
                  <path
                    d={path.d}
                    fill="none"
                    stroke={index === 0 ? '#ffdc8a' : '#ffd19a'}
                    strokeWidth={path.width}
                    strokeLinecap="round"
                    pathLength={1}
                    strokeDasharray="1"
                    strokeDashoffset={1 - pathProgress}
                    opacity={0.82 - index * 0.14}
                  />
                </g>
              );
            })}

            {Array.from({ length: 17 }, (_, index) => {
              const path = SIGNAL_PATHS[index % SIGNAL_PATHS.length];
              const travel = clamp01((safeFrame - 161 - index * 5.3) / 103);
              const point = cubicPoint(
                travel,
                path.controls[0],
                path.controls[1],
                path.controls[2],
                path.controls[3],
              );
              const particleOpacity = travel > 0 && travel < 1 ? Math.min(1, travel * 4, (1 - travel) * 6) : 0;
              return (
                <circle
                  key={`signal-particle-${index}`}
                  cx={point[0]}
                  cy={point[1]}
                  r={2.5 + (index % 3) * 1.25}
                  fill={index % 4 === 0 ? '#fff0b2' : '#ffc56f'}
                  opacity={particleOpacity * (0.58 + signalStart * 0.42)}
                  filter="url(#film-glow)"
                />
              );
            })}

            <g transform={`translate(${secondBirdX} ${secondBirdY})`} opacity={reveal(safeFrame, 176, 207)}>
              <ellipse cx="0" cy="126" rx="116" ry="17" fill="#100b2d" opacity="0.27" />
              <Bird x={0} y={0} scale={1} color="#ef806e" frame={safeFrame} mood="happy" flip={true} />
            </g>
            <g opacity={reveal(safeFrame, 173, 208)}>
              <circle cx={1394} cy={650} r={25 + pulse(safeFrame, 35) * 8} fill="none" stroke="#ffcc85" strokeWidth="2" opacity="0.45" />
              <circle cx={1394} cy={650} r="6" fill="#fff0b3" filter="url(#film-glow)" />
            </g>

            <TextBlock
              title="MỘT LỜI CHÀO"
              subtitle="có thể kéo chúng ta lại gần."
              titleY={91}
              subtitleY={146}
              titleSize={52}
              opacity={reveal(safeFrame, 154, 183) * fadeOut(safeFrame, 278, 318)}
              accent="#ff997d"
            />
          </g>

          <g clipPath="url(#film-iris)" opacity={act2Opacity}>
            <rect width={WIDTH} height={HEIGHT} fill="#13103a" opacity="0.34" />
            <circle cx={irisX} cy={irisY} r={Math.max(0, irisRadius * 0.92)} fill="url(#film-iris-wash)" opacity={0.6} />
            <g transform={`translate(${WIDTH / 2} ${planetCenterY}) scale(${planetScale})`}>
              <g opacity="0.22" filter="url(#film-blur-30)">
                <circle r="450" fill="#f4af90" />
              </g>

              {WORLD_LINKS.map((link, index) => {
                const linkProgress = reveal(safeFrame, 308 + link.delay * 0.3, 378 + link.delay * 0.3);
                return (
                  <g key={`world-link-${index}`}>
                    <path
                      d={link.d}
                      fill="none"
                      stroke="#f4bd86"
                      strokeWidth={10 - (index % 2) * 3}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - linkProgress}
                      opacity="0.16"
                      filter="url(#film-blur-12)"
                    />
                    <path
                      d={link.d}
                      fill="none"
                      stroke={index % 2 ? '#f4c587' : '#ffe1a1'}
                      strokeWidth={3.3 - (index % 3) * 0.45}
                      strokeLinecap="round"
                      pathLength={1}
                      strokeDasharray="1"
                      strokeDashoffset={1 - linkProgress}
                      opacity={0.75}
                    />
                    <circle
                      cx={link.end[0]}
                      cy={link.end[1]}
                      r={6 + pulse(safeFrame, 36, index * 11) * 3}
                      fill="#fff0b3"
                      opacity={linkProgress * 0.84}
                      filter="url(#film-glow)"
                    />
                  </g>
                );
              })}

              {Array.from({ length: 12 }, (_, index) => {
                const point = orbitPoint(safeFrame, index, 370 + (index % 3) * 48);
                return (
                  <circle
                    key={`orbit-${index}`}
                    cx={point[0]}
                    cy={point[1]}
                    r={1.8 + (index % 4) * 0.8}
                    fill={index % 3 === 0 ? '#fff0ad' : '#d8b8ff'}
                    opacity={act2Opacity * (0.38 + 0.34 * pulse(safeFrame, 53 + index * 3, index * 13))}
                    filter="url(#film-glow)"
                  />
                );
              })}

              <g transform="scale(1.005)">
                <Planet frame={safeFrame} />
              </g>

              {WORLD_BIRDS.map((bird, index) => {
                const entrance = reveal(safeFrame, 310 + index * 5, 370 + index * 5);
                const float = Math.sin(safeFrame * 0.06 + bird.phase) * 10;
                const radial = 1 - entrance * 0.1;
                return (
                  <g
                    key={`world-bird-${index}`}
                    transform={`translate(${bird.x * radial} ${bird.y * radial + float * entrance}) scale(${bird.scale * (0.82 + entrance * 0.18)})`}
                    opacity={entrance}
                  >
                    <Bird x={0} y={0} scale={1} color={bird.color} frame={safeFrame + bird.phase} mood="happy" flip={bird.flip} />
                  </g>
                );
              })}
            </g>

            <g
              opacity={reveal(safeFrame, 338, 388)}
              transform={`translate(${WIDTH / 2} ${planetCenterY}) scale(${planetScale})`}
            >
              <circle r="338" fill="none" stroke="#ffe0a0" strokeWidth="2" opacity="0.33" />
              <circle r="402" fill="none" stroke="#f8b2bb" strokeWidth="1.4" opacity="0.23" strokeDasharray="4 18" transform={`rotate(${safeFrame * 0.7})`} />
            </g>
          </g>

          <g opacity={endTextOpacity}>
            <TextBlock
              title="KẾT NỐI BẮT ĐẦU TỪ BẠN"
              subtitle="Một lời chào. Một thế giới gần hơn."
              titleY={89}
              subtitleY={144}
              titleSize={54}
              opacity={1}
              accent="#ffd17d"
            />
          </g>
        </g>

        <rect width={WIDTH} height={HEIGHT} fill="url(#film-vignette)" pointerEvents="none" />
        <rect
          width={WIDTH}
          height={HEIGHT}
          fill="none"
          stroke="#f7d493"
          strokeWidth="3"
          opacity={0.08 + 0.04 * pulse(safeFrame, 100)}
          pointerEvents="none"
        />
      </svg>
    </AbsoluteFill>
  );
}

export function Film() {
  const frame = useCurrentFrame();
  return <><Audio src={staticFile('soundtrack.wav')} /><FilmFrame frame={frame} /></>;
}
export default Film;
