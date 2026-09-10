import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { DagNode } from '../components/DagNode';
import { DagEdge } from '../components/DagEdge';
import { BranchTag } from '../components/BranchTag';

export const Scene3BranchHeadMerge: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase interpolation within Scene 3 (frames 0 to 721 relative to Scene 3 Sequence)
  // Beat 7: 0 - 220 (global 1513 - 1733, Branch Pointers & HEAD)
  // Beat 8: 220 - 478 (global 1733 - 1991, Fast-forward Merge)
  // Beat 9: 478 - 721 (global 1991 - 2234, Three-way Recursive Merge)
  const isBeat7 = frame < 220;
  const isBeat8 = frame >= 220 && frame < 478;
  const isBeat9 = frame >= 478;

  const beat7Opacity = interpolate(frame, [0, 15, 205, 220], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beat8Opacity = interpolate(frame, [220, 235, 463, 478], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beat9Opacity = interpolate(frame, [478, 493, 705, 721], [0, 1, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Beat 8: Sliding tag animation for Fast-forward
  const ffSlideProgress = spring({
    frame: Math.max(0, frame - 280),
    fps: 30,
    config: { damping: 14, stiffness: 85 },
  });
  const mainTagX = interpolate(ffSlideProgress, [0, 1], [460, 720]);

  // Beat 9: Convergence of 2 parent branches into Merge Commit
  const mergeAppear = 530;
  const mergeScale = spring({
    frame: Math.max(0, frame - mergeAppear),
    fps: 30,
    config: { damping: 14, stiffness: 85 },
  });

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
      {/* Background Subtle Tech Lattice */}
      <svg
        width="1080"
        height="1920"
        style={{ position: 'absolute', top: 0, left: 0, opacity: 0.15 }}
      >
        <defs>
          <pattern id="scene3-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#F59E0B" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene3-grid)" />
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
            color: '#F59E0B',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          PHẦN 3: NHÁNH & CƠ CHẾ HỢP NHẤT
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 7: Branch Pointers & HEAD (0 - 240)                                   */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat7Opacity,
          display: isBeat7 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          BẢN CHẤT CỦA BRANCH & HEAD
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#F59E0B', textAlign: 'center', marginBottom: 48 }}>
          Nhánh chỉ là con trỏ di động 41 byte, không phải bản sao thư mục
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Edges connecting C3 -> C2 -> C1 */}
          <DagEdge x1={540} y1={500} x2={260} y2={500} stroke="#38BDF8" appearFrame={10} />
          <DagEdge x1={800} y1={500} x2={540} y2={500} stroke="#38BDF8" appearFrame={20} />

          {/* Commit Nodes */}
          <DagNode cx={260} cy={500} r={65} hash="c1a8901" label="C1 (Init)" fill="#0369A1" stroke="#38BDF8" appearFrame={10} />
          <DagNode cx={540} cy={500} r={65} hash="c2b4512" label="C2" fill="#0284C7" stroke="#38BDF8" appearFrame={20} />
          <DagNode cx={800} cy={500} r={65} hash="c3d7890" label="C3" fill="#0EA5E9" stroke="#38BDF8" isActive={true} appearFrame={30} />

          {/* Branch Tag: main on C2 */}
          <BranchTag x={540} y={410} name="main" color="#0284C7" appearFrame={40} />

          {/* Branch Tag: feature/auth on C3 with HEAD */}
          <BranchTag x={800} y={410} name="feature/auth" color="#10B981" isHead={true} appearFrame={50} />

          {/* Explanation Card */}
          <g transform="translate(460, 720)">
            <rect x="-380" y="-70" width="760" height="140" rx="20" fill="#1E293B" stroke="#F59E0B" strokeWidth="4" />
            <text x="0" y="-15" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="bold">
              CON TRỎ SIÊU NHẸ (41 BYTES)
            </text>
            <text x="0" y="35" textAnchor="middle" fill="#FEF3C7" fontSize={34} fontWeight="500">
              Tạo mới hay xóa nhánh chỉ tốn vài byte đĩa, tức thì 0 mili-giây!
            </text>
          </g>

          {/* HEAD Pointer Note */}
          <g transform="translate(460, 920)">
            <text x="0" y="0" textAnchor="middle" fill="#38BDF8" fontSize={32} fontWeight="600">
              HEAD: Con trỏ đặc biệt trỏ vào nhánh đang được checkout
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 8: Fast-Forward Merge (240 - 495)                                    */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat8Opacity,
          display: isBeat8 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          FAST-FORWARD MERGE
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#10B981', textAlign: 'center', marginBottom: 48 }}>
          Tịnh tiến con trỏ dọc đường thẳng, không tạo commit mới
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Linear DAG Edges */}
          <DagEdge x1={460} y1={480} x2={200} y2={480} stroke="#38BDF8" appearFrame={250} />
          <DagEdge x1={720} y1={480} x2={460} y2={480} stroke="#38BDF8" appearFrame={260} />

          {/* Commit Nodes */}
          <DagNode cx={200} cy={480} r={65} hash="a112233" label="C1" fill="#0369A1" stroke="#38BDF8" appearFrame={250} />
          <DagNode cx={460} cy={480} r={65} hash="b223344" label="C2" fill="#0284C7" stroke="#38BDF8" appearFrame={260} />
          <DagNode cx={720} cy={480} r={65} hash="c334455" label="C3 (Tip)" fill="#10B981" stroke="#34D399" isActive={true} appearFrame={270} />

          {/* Stationary feature tag */}
          <BranchTag x={720} y={390} name="feature" color="#10B981" appearFrame={270} />

          {/* Sliding main tag */}
          <BranchTag x={mainTagX} y={390} name="main" color="#0284C7" appearFrame={280} />

          {/* Motion Trail Indicator */}
          {frame >= 300 && frame < 360 && (
            <line x1="460" y1="360" x2="720" y2="360" stroke="#F59E0B" strokeWidth="4" strokeDasharray="6 6" />
          )}

          {/* Fast-Forward Invariant Card */}
          <g transform="translate(460, 720)">
            <rect x="-380" y="-70" width="760" height="140" rx="20" fill="#1E293B" stroke="#10B981" strokeWidth="4" />
            <text x="0" y="-15" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="bold">
              CƠ CHẾ FAST-FORWARD
            </text>
            <text x="0" y="35" textAnchor="middle" fill="#D1FAE5" fontSize={34} fontWeight="500">
              Nhánh main chỉ việc trượt tới đỉnh C3; 0 commit phát sinh!
            </text>
          </g>

          <g transform="translate(460, 920)">
            <text x="0" y="0" textAnchor="middle" fill="#94A3B8" fontSize={32} fontWeight="600">
              Giữ lịch sử hoàn toàn thẳng hàng và sạch sẽ
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 9: Three-Way Recursive Merge (495 - 750)                             */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat9Opacity,
          display: isBeat9 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          THREE-WAY RECURSIVE MERGE
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#A855F7', textAlign: 'center', marginBottom: 48 }}>
          Hợp nhất hai nhánh phân kỳ và nút Commit sở hữu hai cha
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* BCA to Main Branch Edge */}
          <DagEdge x1={500} y1={360} x2={220} y2={490} stroke="#0284C7" strokeWidth="5" appearFrame={505} />

          {/* BCA to Feature Branch Edge */}
          <DagEdge x1={500} y1={620} x2={220} y2={490} stroke="#10B981" strokeWidth="5" appearFrame={505} />

          {/* Two Converging Parent Edges from Merge Commit back to Main and Feature */}
          <DagEdge x1={780} y1={490} x2={500} y2={360} stroke="#A855F7" strokeWidth="6" appearFrame={mergeAppear} />
          <DagEdge x1={780} y1={490} x2={500} y2={620} stroke="#A855F7" strokeWidth="6" appearFrame={mergeAppear} />

          {/* BCA Node */}
          <DagNode cx={220} cy={490} r={60} hash="bca1100" label="BCA (Gốc)" fill="#475569" stroke="#94A3B8" appearFrame={500} />

          {/* Main Branch Commit */}
          <DagNode cx={500} cy={360} r={60} hash="m778899" label="main tip" fill="#0284C7" stroke="#38BDF8" appearFrame={510} />
          <BranchTag x={500} y={280} name="main" color="#0284C7" appearFrame={515} />

          {/* Feature Branch Commit */}
          <DagNode cx={500} cy={620} r={60} hash="f445566" label="feat tip" fill="#10B981" stroke="#34D399" appearFrame={510} />
          <BranchTag x={500} y={720} name="feature" color="#10B981" appearFrame={515} />

          {/* Merge Commit Node */}
          <g transform={`scale(${mergeScale})`} style={{ transformOrigin: '780px 490px' }}>
            <DagNode cx={780} cy={490} r={68} hash="merge88" label="Merge Commit" fill="#7E22CE" stroke="#A855F7" isActive={true} appearFrame={mergeAppear} />
            <BranchTag x={780} y={395} name="HEAD -> main" color="#7E22CE" appearFrame={mergeAppear + 15} />
          </g>

          {/* Three-Way Merge Synthesis Card */}
          <g transform="translate(460, 840)">
            <rect x="-380" y="-60" width="760" height="120" rx="20" fill="#1E293B" stroke="#A855F7" strokeWidth="4" />
            <text x="0" y="-10" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="bold">
              NÚT COMMIT ĐỒNG THỜI CÓ 2 CHA
            </text>
            <text x="0" y="35" textAnchor="middle" fill="#F3E8FF" fontSize={34} fontWeight="500">
              parent: [m778899 (main), f445566 (feature)] - Bảo toàn trọn vẹn 2 lịch sử!
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
