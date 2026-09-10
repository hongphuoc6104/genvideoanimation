import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { DagNode } from '../components/DagNode';
import { DagEdge } from '../components/DagEdge';

export const Scene1CentralizedVsDistributed: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase interpolation
  // Beat 1: 0 - 268 (CVCS Centralized Bottleneck)
  // Beat 2: 268 - 563 (Cryptographic Snapshot Condensation)
  // Beat 3: 563 - 795 (DAG Commit Graph Formation)
  const isBeat1 = frame < 268;
  const isBeat2 = frame >= 268 && frame < 563;
  const isBeat3 = frame >= 563;

  const beat1Opacity = interpolate(frame, [0, 15, 253, 268], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beat2Opacity = interpolate(frame, [268, 283, 548, 563], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beat3Opacity = interpolate(frame, [563, 578, 780, 795], [0, 1, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Beat 1: Central Server Lock Animation
  const serverPulse = 1 + 0.05 * Math.sin((frame / 20) * Math.PI * 2);

  // Beat 2: Scanning Laser Progress
  const scanProgress = interpolate(frame, [280, 520], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Beat 3: DAG Commit Nodes animation
  const c1Appear = 580;
  const c2Appear = 640;
  const c3Appear = 700;

  return (
    <div
      style={{
        position: 'absolute',
        width: 1080,
        height: 1920,
        backgroundColor: '#0F172A',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Background Subtle Tech Grid */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15 }}
      >
        <defs>
          <pattern id="scene1-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#38BDF8" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene1-grid)" />
      </svg>

      {/* Top Section Header */}
      <div
        style={{
          position: 'absolute',
          top: 140,
          left: 80,
          right: 80,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 48,
            fontWeight: 800,
            color: '#38BDF8',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          PHẦN 1: BỐI CẢNH & MÔ HÌNH DAG
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 1: Centralized VCS Bottleneck (0 - 240)                              */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat1Opacity,
          display: isBeat1 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          HỆ THỐNG PHIÊN BẢN TẬP TRUNG
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#94A3B8', textAlign: 'center', marginBottom: 48 }}>
          Khóa tệp và tắc nghẽn cổ chai mạng (SVN / CVS)
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Central Server */}
          <g transform={`translate(460, 360) scale(${serverPulse})`}>
            <circle cx="0" cy="0" r="110" fill="#1E293B" stroke="#EF4444" strokeWidth="6" />
            <rect x="-50" y="-45" width="100" height="30" rx="6" fill="#EF4444" opacity="0.8" />
            <rect x="-50" y="-5" width="100" height="30" rx="6" fill="#EF4444" opacity="0.8" />
            <rect x="-50" y="35" width="100" height="30" rx="6" fill="#EF4444" opacity="0.8" />
            <text x="0" y="90" textAnchor="middle" fill="#FFFFFF" fontSize={34} fontWeight="bold">
              SERVER SVN
            </text>
          </g>

          {/* Radiating Lock Rays & Client Workstations */}
          {[
            { angle: -140, name: 'Dev A', locked: true, x: 160, y: 720 },
            { angle: -100, name: 'Dev B', locked: true, x: 360, y: 760 },
            { angle: -40, name: 'Dev C', locked: true, x: 560, y: 760 },
            { angle: 0, name: 'Dev D', locked: true, x: 760, y: 720 },
          ].map((client, idx) => (
            <g key={idx}>
              {/* Ray from server to workstation */}
              <line
                x1="460"
                y1="470"
                x2={client.x}
                y2={client.y - 40}
                stroke="#EF4444"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
              {/* Client Workstation */}
              <circle cx={client.x} cy={client.y} r="54" fill="#0F172A" stroke="#94A3B8" strokeWidth="4" />
              <text x={client.x} y={client.y + 10} textAnchor="middle" fill="#F8FAFC" fontSize={30} fontWeight="bold">
                {client.name}
              </text>
              {/* Lock Badge */}
              <g transform={`translate(${client.x}, ${client.y - 70})`}>
                <rect x="-55" y="-18" width="110" height="36" rx="8" fill="#EF4444" />
                <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
                  🔒 KHÓA
                </text>
              </g>
            </g>
          ))}

          {/* Centralized Dilemma Card */}
          <g transform="translate(460, 920)">
            <rect x="-380" y="-45" width="760" height="90" rx="16" fill="#1E293B" stroke="#EF4444" strokeWidth="3" />
            <text x="0" y="10" textAnchor="middle" fill="#FECACA" fontSize={34} fontWeight="600">
              Điểm lỗi đơn: Mất kết nối mạng = Tê liệt cam kết!
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 2: Distributed Cryptographic Snapshots (240 - 495)                   */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat2Opacity,
          display: isBeat2 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          ĐỘT PHÁ ẢNH CHỤP MẬT MÃ
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#38BDF8', textAlign: 'center', marginBottom: 48 }}>
          Git lưu toàn vẹn Snapshot, không lưu vi phân delta
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Project Filesystem Representation */}
          <g transform="translate(460, 260)">
            <rect x="-360" y="-120" width="720" height="240" rx="20" fill="#1E293B" stroke="#0284C7" strokeWidth="4" />
            <text x="-320" y="-60" fill="#38BDF8" fontSize={38} fontWeight="bold">
              📂 Thư mục dự án (Filesystem Snapshot)
            </text>
            <text x="-320" y="-10" fill="#F8FAFC" fontSize={34} fontFamily="monospace">
              ├── main.rs (4.2 KB)
            </text>
            <text x="-320" y="35" fill="#F8FAFC" fontSize={34} fontFamily="monospace">
              ├── lib/auth.rs (12.8 KB)
            </text>
            <text x="-320" y="80" fill="#F8FAFC" fontSize={34} fontFamily="monospace">
              └── assets/logo.svg (85.4 KB)
            </text>

            {/* Scanning Laser Beam */}
            <line
              x1="-360"
              y1={-120 + 240 * scanProgress}
              x2="360"
              y2={-120 + 240 * scanProgress}
              stroke="#06B6D4"
              strokeWidth="6"
              filter="drop-shadow(0 0 8px #06B6D4)"
            />
          </g>

          {/* Projecting Compression Arrow */}
          <g transform="translate(460, 480)">
            <line x1="0" y1="0" x2="0" y2="120" stroke="#06B6D4" strokeWidth="6" strokeDasharray="10 8" />
            <polygon points="0,140 -16,110 16,110" fill="#06B6D4" />
            <text x="30" y="70" fill="#06B6D4" fontSize={30} fontWeight="bold">
              Băm mật mã SHA
            </text>
          </g>

          {/* Snapshot Token Result */}
          <g transform="translate(460, 750)">
            <rect x="-380" y="-80" width="760" height="160" rx="24" fill="#0284C7" stroke="#38BDF8" strokeWidth="4" />
            <text x="0" y="-20" textAnchor="middle" fill="#FFFFFF" fontSize={42} fontWeight="900">
              ẢNH CHỤP TOÀN DIỆN (SNAPSHOT)
            </text>
            <text x="0" y="40" textAnchor="middle" fill="#F0F9FF" fontSize={34} fontWeight="bold" fontFamily="monospace">
              SHA-1: 7a9f82d1c0b34e...
            </text>
          </g>

          {/* Pedagogy Callout */}
          <g transform="translate(460, 940)">
            <text x="0" y="0" textAnchor="middle" fill="#10B981" fontSize={34} fontWeight="700">
              ✓ Không tốn công tính toán chắp vá delta giữa các phiên bản
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 3: Directed Acyclic Graph (DAG) Foundation (495 - 750)               */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat3Opacity,
          display: isBeat3 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          ĐỒ THỊ CÓ HƯỚNG KHÔNG CHU TRÌNH
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#10B981', textAlign: 'center', marginBottom: 48 }}>
          Directed Acyclic Graph (DAG) - Nút mới luôn trỏ về cha
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Edge from C2 back to C1 */}
          <DagEdge x1={460} y1={420} x2={220} y2={420} stroke="#38BDF8" appearFrame={c2Appear} />

          {/* Edge from C3 back to C2 */}
          <DagEdge x1={700} y1={420} x2={460} y2={420} stroke="#38BDF8" appearFrame={c3Appear} />

          {/* Commit C1 */}
          <DagNode
            cx={220}
            cy={420}
            r={65}
            hash="9f83a1b"
            label="Commit 1"
            fill="#0369A1"
            stroke="#38BDF8"
            appearFrame={c1Appear}
          />

          {/* Commit C2 */}
          <DagNode
            cx={460}
            cy={420}
            r={65}
            hash="4b28f7c"
            label="Commit 2"
            fill="#0284C7"
            stroke="#38BDF8"
            appearFrame={c2Appear}
          />

          {/* Commit C3 */}
          <DagNode
            cx={700}
            cy={420}
            r={65}
            hash="e512a89"
            label="Commit 3"
            fill="#0EA5E9"
            stroke="#38BDF8"
            isActive={true}
            appearFrame={c3Appear}
          />

          {/* Directed Invariant Callout */}
          <g transform="translate(460, 680)">
            <rect x="-380" y="-60" width="760" height="120" rx="20" fill="#1E293B" stroke="#10B981" strokeWidth="4" />
            <text x="0" y="-10" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="bold">
              QUY TẮC CỐT LÕI CỦA ĐỒ THỊ DAG
            </text>
            <text x="0" y="35" textAnchor="middle" fill="#E2E8F0" fontSize={34} fontWeight="500">
              Mũi tên luôn trỏ ngược về quá khứ; không thể tạo chu trình khép kín!
            </text>
          </g>

          {/* Immutability Seal */}
          <g transform="translate(460, 890)">
            <rect x="-340" y="-40" width="680" height="80" rx="16" fill="#0F172A" stroke="#38BDF8" strokeWidth="2" />
            <text x="0" y="12" textAnchor="middle" fill="#38BDF8" fontSize={30} fontWeight="700">
              Định danh nội dung mã băm (Content-Addressable Storage)
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
