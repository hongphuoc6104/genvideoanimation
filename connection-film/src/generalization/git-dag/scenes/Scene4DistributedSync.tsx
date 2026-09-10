import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { DagNode } from '../components/DagNode';
import { DagEdge } from '../components/DagEdge';
import { BranchTag } from '../components/BranchTag';

export const Scene4DistributedSync: React.FC = () => {
  const frame = useCurrentFrame();

  // Phase interpolation within Scene 4 (frames 0 to 850 relative to Scene 4 Sequence)
  // Beat 10: 0 - 255 (global 2234 - 2489, Distributed Remote Tracking)
  // Beat 11: 255 - 549 (global 2489 - 2783, Rebase vs Merge Topology)
  // Beat 12: 549 - 850 (global 2783 - 3084, Immutable DAG Mental Model)
  const isBeat10 = frame < 255;
  const isBeat11 = frame >= 255 && frame < 549;
  const isBeat12 = frame >= 549;

  const beat10Opacity = interpolate(frame, [0, 15, 240, 255], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beat11Opacity = interpolate(frame, [255, 270, 534, 549], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beat12Opacity = interpolate(frame, [549, 564, 835, 850], [0, 1, 1, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Beat 10: Network Sync Packet animation
  const packetT = (frame % 60) / 60;
  const packetX = interpolate(packetT, [0, 1], [680, 240]);

  // Beat 12: Time travel HEAD slider
  const headTimeT = interpolate(Math.sin((frame / 40) * Math.PI), [-1, 1], [0, 1]);
  const headTravelX = interpolate(headTimeT, [0, 1], [180, 740]);

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
          <pattern id="scene4-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#A855F7" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene4-grid)" />
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
            color: '#A855F7',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          PHẦN 4: ĐỒNG BỘ & MÔ HÌNH BẤT BIẾN
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 10: Distributed Remote Tracking (0 - 240)                            */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat10Opacity,
          display: isBeat10 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          ĐỒNG BỘ PHÂN TÁN (REMOTE)
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#38BDF8', textAlign: 'center', marginBottom: 48 }}>
          Nhánh từ xa origin/main độc lập hoàn toàn với main cục bộ
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Local Repository Box */}
          <g transform="translate(240, 360)">
            <rect x="-190" y="-120" width="380" height="360" rx="20" fill="#1E293B" stroke="#0284C7" strokeWidth="4" />
            <text x="0" y="-70" textAnchor="middle" fill="#38BDF8" fontSize={38} fontWeight="bold">
              KHO CỤC BỘ (LOCAL)
            </text>
            {/* Local Nodes */}
            <DagNode cx={-80} cy={60} r={45} hash="loc01" label="C1" fill="#0284C7" stroke="#38BDF8" appearFrame={10} />
            <DagNode cx={80} cy={60} r={45} hash="loc02" label="C2" fill="#0EA5E9" stroke="#38BDF8" isActive={true} appearFrame={20} />
            <DagEdge x1={80} y1={60} x2={-80} y2={60} stroke="#38BDF8" strokeWidth="4" appearFrame={20} />
            <BranchTag x={80} y={0} name="main" color="#0284C7" appearFrame={30} />
          </g>

          {/* Remote Repository Box */}
          <g transform="translate(680, 360)">
            <rect x="-190" y="-120" width="380" height="360" rx="20" fill="#1E293B" stroke="#A855F7" strokeWidth="4" />
            <text x="0" y="-70" textAnchor="middle" fill="#C084FC" fontSize={38} fontWeight="bold">
              KHO TỪ XA (ORIGIN)
            </text>
            {/* Remote Nodes */}
            <DagNode cx={-80} cy={60} r={45} hash="loc01" label="C1" fill="#7E22CE" stroke="#C084FC" appearFrame={10} />
            <DagNode cx={0} cy={60} r={45} hash="loc02" label="C2" fill="#7E22CE" stroke="#C084FC" appearFrame={20} />
            <DagNode cx={90} cy={60} r={45} hash="rem03" label="C3" fill="#A855F7" stroke="#E9D5FF" isActive={true} appearFrame={30} />
            <DagEdge x1={0} y1={60} x2={-80} y2={60} stroke="#C084FC" strokeWidth="4" appearFrame={20} />
            <DagEdge x1={90} y1={60} x2={0} y2={60} stroke="#C084FC" strokeWidth="4" appearFrame={30} />
            <BranchTag x={90} y={0} name="origin/main" color="#A855F7" appearFrame={35} />
          </g>

          {/* Network Sync Bridge Line */}
          <line x1="430" y1="420" x2="490" y2="420" stroke="#38BDF8" strokeWidth="6" strokeDasharray="8 6" />

          {/* Traveling Commit Packet (Fetch) */}
          <circle cx={packetX} cy={420} r={14} fill="#F59E0B" filter="drop-shadow(0 0 6px #F59E0B)" />

          {/* Pedagogy Callout */}
          <g transform="translate(460, 780)">
            <rect x="-380" y="-70" width="760" height="140" rx="20" fill="#1E293B" stroke="#38BDF8" strokeWidth="4" />
            <text x="0" y="-15" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="bold">
              LỢI ÍCH CỦA MÔ HÌNH PHÂN TÁN
            </text>
            <text x="0" y="35" textAnchor="middle" fill="#BAE6FD" fontSize={34} fontWeight="500">
              Lệnh fetch tải các nút đồ thị mới về an toàn mà không chạm vào mã cục bộ!
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 11: Rebase vs Merge Topology Comparison (240 - 495)                  */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat11Opacity,
          display: isBeat11 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          SO SÁNH MERGE VÀ REBASE
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#F59E0B', textAlign: 'center', marginBottom: 48 }}>
          Bảo tồn lịch sử chân thực hay làm phẳng đồ thị tuyến tính
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Left Panel: Git Merge */}
          <g transform="translate(225, 240)">
            <rect x="-205" y="-100" width="410" height="600" rx="20" fill="#1E293B" stroke="#10B981" strokeWidth="4" />
            <text x="0" y="-40" textAnchor="middle" fill="#10B981" fontSize={42} fontWeight="900">
              GIT MERGE
            </text>

            {/* Merge Visual Graph */}
            <DagNode cx={-100} cy={100} r={38} hash="bca0" label="BCA" fill="#475569" stroke="#94A3B8" appearFrame={250} />
            <DagNode cx={0} cy={30} r={38} hash="m1" label="main" fill="#0284C7" stroke="#38BDF8" appearFrame={260} />
            <DagNode cx={0} cy={170} r={38} hash="f1" label="feat" fill="#10B981" stroke="#34D399" appearFrame={260} />
            <DagNode cx={100} cy={100} r={42} hash="mg8" label="Merge" fill="#7E22CE" stroke="#A855F7" isActive={true} appearFrame={270} />

            <DagEdge x1={0} y1={30} x2={-100} y2={100} stroke="#0284C7" strokeWidth="4" appearFrame={260} />
            <DagEdge x1={0} y1={170} x2={-100} y2={100} stroke="#10B981" strokeWidth="4" appearFrame={260} />
            <DagEdge x1={100} y1={100} x2={0} y2={30} stroke="#A855F7" strokeWidth="4" appearFrame={270} />
            <DagEdge x1={100} y1={100} x2={0} y2={170} stroke="#A855F7" strokeWidth="4" appearFrame={270} />

            {/* Bullets */}
            <text x="-175" y="290" fill="#F8FAFC" fontSize={30} fontWeight="bold">
              ✓ Bảo tồn lịch sử phân nhánh
            </text>
            <text x="-175" y="340" fill="#F8FAFC" fontSize={30} fontWeight="bold">
              ✓ Không đổi mã băm SHA cũ
            </text>
            <text x="-175" y="390" fill="#94A3B8" fontSize={30}>
              • Sinh thêm commit hợp nhất
            </text>
          </g>

          {/* Right Panel: Git Rebase */}
          <g transform="translate(695, 240)">
            <rect x="-205" y="-100" width="410" height="600" rx="20" fill="#1E293B" stroke="#F59E0B" strokeWidth="4" />
            <text x="0" y="-40" textAnchor="middle" fill="#F59E0B" fontSize={42} fontWeight="900">
              GIT REBASE
            </text>

            {/* Rebase Linear Graph */}
            <DagNode cx={-120} cy={100} r={36} hash="bca0" label="BCA" fill="#475569" stroke="#94A3B8" appearFrame={250} />
            <DagNode cx={-40} cy={100} r={36} hash="m1" label="main" fill="#0284C7" stroke="#38BDF8" appearFrame={260} />
            <DagNode cx={50} cy={100} r={36} hash="f1'" label="feat'" fill="#F59E0B" stroke="#FBBF24" appearFrame={270} />
            <DagNode cx={130} cy={100} r={36} hash="f2'" label="tip'" fill="#F59E0B" stroke="#FBBF24" isActive={true} appearFrame={280} />

            <DagEdge x1={-40} y1={100} x2={-120} y2={100} stroke="#38BDF8" strokeWidth="4" appearFrame={260} />
            <DagEdge x1={50} y1={100} x2={-40} y2={100} stroke="#F59E0B" strokeWidth="4" appearFrame={270} />
            <DagEdge x1={130} y1={100} x2={50} y2={100} stroke="#F59E0B" strokeWidth="4" appearFrame={280} />

            {/* Bullets */}
            <text x="-175" y="290" fill="#F8FAFC" fontSize={30} fontWeight="bold">
              ✓ Lịch sử thẳng hàng tuyệt đối
            </text>
            <text x="-175" y="340" fill="#F8FAFC" fontSize={30} fontWeight="bold">
              ✓ Loại bỏ commit hợp nhất rác
            </text>
            <text x="-175" y="390" fill="#EF4444" fontSize={30} fontWeight="bold">
              ⚠️ Viết lại toàn bộ mã SHA!
            </text>
          </g>

          {/* Golden Rule Banner */}
          <g transform="translate(460, 840)">
            <rect x="-380" y="-45" width="760" height="90" rx="16" fill="#1E293B" stroke="#F59E0B" strokeWidth="3" />
            <text x="0" y="10" textAnchor="middle" fill="#FEF3C7" fontSize={34} fontWeight="600">
              Nguyên tắc vàng: Không rebase trên các nhánh công khai đã push!
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 12: Immutable DAG Time-Travel Mental Model (495 - 750)               */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat12Opacity,
          display: isBeat12 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          DU HÀNH THỜI GIAN TRÊN DAG
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#10B981', textAlign: 'center', marginBottom: 48 }}>
          Đồ thị bất biến là chìa khóa làm chủ Git tuyệt đối
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* 5-Node Grand DAG Lattice */}
          <DagEdge x1={320} y1={460} x2={180} y2={460} stroke="#38BDF8" appearFrame={560} />
          <DagEdge x1={460} y1={460} x2={320} y2={460} stroke="#38BDF8" appearFrame={570} />
          <DagEdge x1={600} y1={460} x2={460} y2={460} stroke="#38BDF8" appearFrame={580} />
          <DagEdge x1={740} y1={460} x2={600} y2={460} stroke="#38BDF8" appearFrame={590} />

          <DagNode cx={180} cy={460} r={50} hash="01a9b2" label="v1.0" fill="#0369A1" stroke="#38BDF8" appearFrame={560} />
          <DagNode cx={320} cy={460} r={50} hash="02c4d6" label="v1.1" fill="#0284C7" stroke="#38BDF8" appearFrame={570} />
          <DagNode cx={460} cy={460} r={50} hash="03e8f0" label="v2.0" fill="#0284C7" stroke="#38BDF8" appearFrame={580} />
          <DagNode cx={600} cy={460} r={50} hash="04a1c3" label="v2.1" fill="#0EA5E9" stroke="#38BDF8" appearFrame={590} />
          <DagNode cx={740} cy={460} r={50} hash="05f7e9" label="v3.0" fill="#10B981" stroke="#34D399" isActive={true} appearFrame={600} />

          {/* Time-Traveling HEAD Slider */}
          <BranchTag x={headTravelX} y={380} name="HEAD" color="#F59E0B" isHead={true} appearFrame={610} />

          {/* Final Victory Seal Badge */}
          <g transform="translate(460, 720)">
            <rect x="-380" y="-80" width="760" height="160" rx="24" fill="#065F46" stroke="#10B981" strokeWidth="5" />
            <text x="0" y="-15" textAnchor="middle" fill="#FFFFFF" fontSize={42} fontWeight="900">
              GIT LÀ MỘT ĐỒ THỊ DAG BẤT BIẾN
            </text>
            <text x="0" y="40" textAnchor="middle" fill="#D1FAE5" fontSize={34} fontWeight="600">
              ✓ Không ma thuật • Không mất dữ liệu • Tự do du hành lịch sử
            </text>
          </g>

          {/* Signoff Quote */}
          <g transform="translate(460, 930)">
            <text x="0" y="0" textAnchor="middle" fill="#94A3B8" fontSize={30} fontWeight="500">
              "Content-addressed Directed Acyclic Graph - Linus Torvalds, 2005"
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
