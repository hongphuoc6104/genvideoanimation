import React from 'react';
import { interpolate, spring, useCurrentFrame } from 'remotion';
import { useBeatChoreography } from 'motion-kit';
import { GitObjectCard } from '../components/GitObjectCard';

export interface Scene2ObjectTriadDagProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene2ObjectTriadDag: React.FC<Scene2ObjectTriadDagProps> = ({
  shotBeats,
}) => {
  const frame = useCurrentFrame();

  // Dynamic choreography derived from semantic timeline
  // Beat 4 (Phase 1): Blob Object
  // Beat 5 (Phase 2): Tree Object
  // Beat 6 (Phase 3): Commit Triad Binding
  const choreography = useBeatChoreography(shotBeats, frame, 720);
  const isBeat4 = choreography.phase === 1;
  const isBeat5 = choreography.phase === 2;
  const isBeat6 = choreography.phase >= 3;

  const beat4Opacity = isBeat4
    ? interpolate(choreography.beatProgress, [0, 0.06, 0.94, 1.0], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const beat5Opacity = isBeat5
    ? interpolate(choreography.beatProgress, [0, 0.06, 0.94, 1.0], [0, 1, 1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

  const beat6Opacity = isBeat6
    ? interpolate(choreography.beatProgress, [0, 0.06, 0.95, 1.0], [0, 1, 1, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })
    : 0;

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
          <pattern id="scene2-grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#10B981" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#scene2-grid)" />
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
            color: '#10B981',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
          }}
        >
          PHẦN 2: BỘ BA ĐỐI TƯỢNG GIT
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 4: Blob Object (0 - 240)                                             */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat4Opacity,
          display: isBeat4 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          ĐỐI TƯỢNG BLOB
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#38BDF8', textAlign: 'center', marginBottom: 48 }}>
          Lưu trữ dữ liệu nhị phân thô, hoàn toàn tách rời tên tệp
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Hexagonal Blob Visual Icon */}
          <g transform="translate(460, 240)">
            <polygon
              points="0,-100 86,-50 86,50 0,100 -86,50 -86,-50"
              fill="#0369A1"
              stroke="#38BDF8"
              strokeWidth="5"
            />
            <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="900" fontFamily="monospace">
              BLOB
            </text>
          </g>

          {/* Git Object Card for Blob */}
          <GitObjectCard
            x={460}
            y={420}
            width={840}
            height={280}
            type="BLOB"
            hash="d670460b4b4aece5915caf5c68d12f560a9fe3e4"
            title="Nội dung nhị phân"
            details={[
              'type: blob (compressed zlib)',
              'data: "println!(\\"Git DAG\\");"',
              'sha1: sha1("blob 35\\0" + data)',
              'Tên tệp/quyền KHÔNG lưu ở đây',
            ]}
            color="#0284C7"
            appearFrame={30}
          />

          {/* Key Insight Card */}
          <g transform="translate(460, 840)">
            <rect x="-420" y="-45" width="840" height="90" rx="16" fill="#1E293B" stroke="#0284C7" strokeWidth="3" />
            <text x="0" y="10" textAnchor="middle" fill="#BAE6FD" fontSize={30} fontWeight="700">
              Hai tệp cùng nội dung sẽ dùng chung một Blob
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 5: Tree Object (240 - 495)                                           */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat5Opacity,
          display: isBeat5 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          ĐỐI TƯỢNG TREE
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#10B981', textAlign: 'center', marginBottom: 48 }}>
          Bản đồ định tuyến và cấu trúc thư mục phân cấp
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Tree Directory Card */}
          <GitObjectCard
            x={460}
            y={120}
            width={840}
            height={290}
            type="TREE"
            hash="a1b2c3d4e5f60718293a4b5c6d7e8f9012345678"
            title="Thư mục gốc"
            details={[
              '100644 blob d670460...  main.rs',
              '100644 blob e891a23...  README.md',
              '040000 tree f45c991...  src/',
              '040000 tree 88b3f10...  tests/',
            ]}
            color="#10B981"
            appearFrame={270}
          />

          {/* Directed Downward Branching Links */}
          <g transform="translate(460, 480)">
            {/* Left Branch to Blob */}
            <line x1="-180" y1="0" x2="-260" y2="120" stroke="#10B981" strokeWidth="4" strokeDasharray="8 6" />
            {/* Right Branch to Blob */}
            <line x1="180" y1="0" x2="260" y2="120" stroke="#10B981" strokeWidth="4" strokeDasharray="8 6" />
          </g>

          {/* Connected Children Blobs Preview */}
          <g transform="translate(460, 640)">
            {/* Child Blob 1 */}
            <g transform="translate(-260, 0)">
              <rect x="-100" y="-40" width="200" height="80" rx="12" fill="#1E293B" stroke="#0284C7" strokeWidth="3" />
              <text x="0" y="-8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
                BLOB
              </text>
              <text x="0" y="24" textAnchor="middle" fill="#94A3B8" fontSize={30} fontFamily="monospace">
                main.rs
              </text>
            </g>

            {/* Child Blob 2 */}
            <g transform="translate(260, 0)">
              <rect x="-100" y="-40" width="200" height="80" rx="12" fill="#1E293B" stroke="#0284C7" strokeWidth="3" />
              <text x="0" y="-8" textAnchor="middle" fill="#FFFFFF" fontSize={30} fontWeight="bold">
                BLOB
              </text>
              <text x="0" y="24" textAnchor="middle" fill="#94A3B8" fontSize={30} fontFamily="monospace">
                README.md
              </text>
            </g>
          </g>

          {/* Explanatory Banner */}
          <g transform="translate(460, 860)">
            <rect x="-420" y="-45" width="840" height="90" rx="16" fill="#1E293B" stroke="#10B981" strokeWidth="3" />
            <text x="0" y="10" textAnchor="middle" fill="#D1FAE5" fontSize={32} fontWeight="700">
              Tree liên kết tên tệp với Blob thành cây thư mục
            </text>
          </g>
        </svg>
      </div>

      {/* ========================================================================= */}
      {/* BEAT 6: Commit Object (495 - 750)                                         */}
      {/* ========================================================================= */}
      <div
        style={{
          position: 'absolute',
          top: 240,
          left: 80,
          right: 80,
          bottom: 340,
          opacity: beat6Opacity,
          display: isBeat6 ? 'flex' : 'none',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 900, color: '#F8FAFC', textAlign: 'center', marginBottom: 16 }}>
          ĐỐI TƯỢNG COMMIT
        </div>
        <div style={{ fontSize: 34, fontWeight: 500, color: '#F59E0B', textAlign: 'center', marginBottom: 48 }}>
          Đóng gói Tree gốc, Tác giả và Danh sách con trỏ cha
        </div>

        <svg width="920" height="980" viewBox="0 0 920 980" style={{ overflow: 'visible' }}>
          {/* Commit Object Card */}
          <GitObjectCard
            x={460}
            y={120}
            width={840}
            height={320}
            type="COMMIT"
            hash="9f83a1b2c3d4e5f60718293a4b5c6d7e8f901234"
            title="Đỉnh cam kết DAG"
            details={[
              'tree   a1b2c3d... (Root Tree)',
              'parent 4b28f7c... (Nút cha)',
              'author Linus Torvalds <torvalds@kernel.org>',
              'committer Linus Torvalds <torvalds@kernel.org>',
              'message: "Implement cryptographic DAG"',
            ]}
            color="#F59E0B"
            appearFrame={490}
          />

          {/* Triad Binding Diagram */}
          <g transform="translate(460, 560)">
            {/* Box Commit */}
            <rect x="-360" y="-35" width="220" height="70" rx="14" fill="#F59E0B" />
            <text x="-250" y="10" textAnchor="middle" fill="#FFFFFF" fontSize={32} fontWeight="bold">
              COMMIT
            </text>

            {/* Pointer to Tree */}
            <line x1="-140" y1="0" x2="-40" y2="0" stroke="#F59E0B" strokeWidth="5" />
            <polygon points="-40,0 -55,-10 -55,10" fill="#F59E0B" />

            {/* Box Tree */}
            <rect x="-40" y="-35" width="180" height="70" rx="14" fill="#10B981" />
            <text x="50" y="10" textAnchor="middle" fill="#FFFFFF" fontSize={32} fontWeight="bold">
              TREE
            </text>

            {/* Pointer to Blob */}
            <line x1="140" y1="0" x2="220" y2="0" stroke="#10B981" strokeWidth="5" />
            <polygon points="220,0 205,-10 205,10" fill="#10B981" />

            {/* Box Blob */}
            <rect x="220" y="-35" width="160" height="70" rx="14" fill="#0284C7" />
            <text x="300" y="10" textAnchor="middle" fill="#FFFFFF" fontSize={32} fontWeight="bold">
              BLOB
            </text>
          </g>

          {/* Cryptographic Proof Card */}
          <g transform="translate(460, 780)">
            <rect x="-420" y="-60" width="840" height="120" rx="20" fill="#1E293B" stroke="#F59E0B" strokeWidth="4" />
            <text x="0" y="-10" textAnchor="middle" fill="#FFFFFF" fontSize={38} fontWeight="bold">
              TÍNH TOÀN VẸN MẬT MÃ BẤT BIẾN
            </text>
            <text x="0" y="35" textAnchor="middle" fill="#FEF3C7" fontSize={32} fontWeight="600">
              Mọi thay đổi nội dung đều tạo ra mã băm Commit mới!
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
