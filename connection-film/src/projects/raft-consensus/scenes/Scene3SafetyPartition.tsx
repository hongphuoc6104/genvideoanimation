import React from 'react';
import { interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { AutoPill } from 'motion-kit';
import {
  RaftClusterTopology,
  getClusterNodeBoxes,
  type NodeState,
} from '../components/RaftClusterTopology';
import { RaftRpcConnector } from '../components/RaftRpcConnector';
import { RaftPartitionBarrier } from '../components/RaftPartitionBarrier';
import { RaftMicroHUD } from '../components/RaftMicroHUD';

export interface Scene3SafetyPartitionProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene3SafetyPartition: React.FC<Scene3SafetyPartitionProps> = ({
  durationInFrames = 450,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Local frame within Scene 3: 0..450 (global 900..1350)
  // Beat 7: 0..150 (Network partition barrier active, minority S1-S2 cannot commit)
  // Beat 8: 150..300 (Majority S3-S4-S5 elects S3 as Leader Term 3)
  // Beat 9: 300..450 (Partition heals, S1 steps down, logs reconciled)
  const currentBeat = frame < 150 ? 7 : frame < 300 ? 8 : 9;

  // Node states across the partition lifecycle
  let nodes: NodeState[];
  if (currentBeat === 7) {
    nodes = [
      { id: 's1', label: 'S1', role: 'ISOLATED', term: 2 },
      { id: 's2', label: 'S2', role: 'FOLLOWER', term: 2 },
      { id: 's3', label: 'S3', role: 'FOLLOWER', term: 2 },
      { id: 's4', label: 'S4', role: 'FOLLOWER', term: 2 },
      { id: 's5', label: 'S5', role: 'FOLLOWER', term: 2 },
    ];
  } else if (currentBeat === 8) {
    nodes = [
      { id: 's1', label: 'S1', role: 'ISOLATED', term: 2 },
      { id: 's2', label: 'S2', role: 'FOLLOWER', term: 2 },
      { id: 's3', label: 'S3', role: 'LEADER', term: 3, active: true },
      { id: 's4', label: 'S4', role: 'FOLLOWER', term: 3 },
      { id: 's5', label: 'S5', role: 'FOLLOWER', term: 3 },
    ];
  } else {
    // Beat 9: Healed cluster, S1 stepped down to follower
    nodes = [
      { id: 's1', label: 'S1', role: 'FOLLOWER', term: 3 },
      { id: 's2', label: 'S2', role: 'FOLLOWER', term: 3 },
      { id: 's3', label: 'S3', role: 'LEADER', term: 3, active: true },
      { id: 's4', label: 'S4', role: 'FOLLOWER', term: 3 },
      { id: 's5', label: 'S5', role: 'FOLLOWER', term: 3 },
    ];
  }

  const nodeBoxes = getClusterNodeBoxes(nodes);

  // Partition barrier opacity: 1.0 in Beat 7-8, fades to 0 in Beat 9
  const barrierOpacity = interpolate(frame, [290, 320], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Beat 8 AppendEntries in majority partition from S3 to S4, S5
  const majorityRpcProgress = ((frame - 150) % 50) / 50;

  // Beat 9 Heartbeats from S3 to all nodes
  const healedHeartbeatProgress = ((frame - 300) % 45) / 45;

  return (
    <div
      style={{
        position: 'relative',
        width: 1080,
        height: 1920,
        backgroundColor: '#0A0F1D',
        overflow: 'hidden',
      }}
    >
      {/* Micro HUD Header */}
      <RaftMicroHUD
        term={currentBeat === 7 ? 2 : 3}
        shotNumber={3}
        shotTitle="PHÂN VÙNG MẠNG & AN TOÀN"
        quorumStatus={
          currentBeat === 7
            ? 'CHIA CẮT MẠNG: S1 KHÔNG THỂ COMMIT (2/5 < 3)'
            : currentBeat === 8
            ? 'ĐA SỐ S3-S4-S5 (3/5): BẦU LEADER TERM 3'
            : 'MẠNG PHỤC HỒI: NHẤT QUÁN TUYẾN TÍNH'
        }
      />

      <svg
        width={1080}
        height={1920}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Stage Zone Section Header Pill */}
        <AutoPill
          x={540}
          y={180}
          text={
            currentBeat === 7
              ? 'PHA 7: PHÂN VÙNG MẠNG & CHỐNG NÃO ĐÔI'
              : currentBeat === 8
              ? 'PHA 8: PHÂN VÙNG ĐA SỐ BẦU LEADER TERM 3'
              : 'PHA 9: HÀN GẮN CỤM & ĐỒNG BỘ NHẤT QUÁN'
          }
          fontSize={30}
          fontWeight={700}
          color="#38BDF8"
          stroke="#0284C7"
          fill="#0F172A"
          height={96}
          paddingHorizontal={36}
        />

        {/* Physical Partition Barrier (Beats 7 & 8) */}
        {barrierOpacity > 0.01 && (
          <RaftPartitionBarrier active={true} opacity={barrierOpacity} />
        )}

        {/* RPC Connectors in Beat 8: S3 replicates to S4 and S5 within majority */}
        {currentBeat === 8 && (
          <g className="majority-rpc-group">
            <RaftRpcConnector
              sourceBox={nodeBoxes.s3}
              targetBox={nodeBoxes.s4}
              rpcType="AppendEntries"
              progress={majorityRpcProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s3}
              targetBox={nodeBoxes.s5}
              rpcType="AppendEntries"
              progress={majorityRpcProgress}
            />
          </g>
        )}

        {/* RPC Connectors in Beat 9: S3 heartbeats to entire cluster */}
        {currentBeat === 9 && (
          <g className="healed-heartbeat-group">
            <RaftRpcConnector
              sourceBox={nodeBoxes.s3}
              targetBox={nodeBoxes.s1}
              rpcType="Heartbeat"
              progress={healedHeartbeatProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s3}
              targetBox={nodeBoxes.s2}
              rpcType="Heartbeat"
              progress={healedHeartbeatProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s3}
              targetBox={nodeBoxes.s4}
              rpcType="Heartbeat"
              progress={healedHeartbeatProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s3}
              targetBox={nodeBoxes.s5}
              rpcType="Heartbeat"
              progress={healedHeartbeatProgress}
            />
          </g>
        )}

        {/* 5 Server Nodes Polar Topology */}
        <RaftClusterTopology
          nodes={nodes}
          activeNodeId={currentBeat === 7 ? 's1' : 's3'}
          centerX={540}
          centerY={640}
          radius={250}
          staggerRadii={[250, 300]}
        />

        {/* State Explanation Pill (Zero Ghosting between beats) */}
        {currentBeat === 7 && (
          <AutoPill
            x={540}
            y={1180}
            text="NHÓM THIỂU SỐ S1-S2 (2/5): KHÔNG THỂ COMMIT"
            fontSize={30}
            fontWeight={600}
            color="#FCA5A5"
            stroke="#EF4444"
            fill="#0F172A"
            height={96}
            paddingHorizontal={36}
          />
        )}

        {currentBeat === 8 && (
          <AutoPill
            x={540}
            y={1180}
            text="NHÓM ĐA SỐ BẦU S3 (TERM 3) • COMMIT THÀNH CÔNG"
            fontSize={30}
            fontWeight={600}
            color="#34D399"
            stroke="#10B981"
            fill="#0F172A"
            height={96}
            paddingHorizontal={36}
          />
        )}

        {currentBeat === 9 && (
          <AutoPill
            x={540}
            y={1180}
            text="MẠNG PHỤC HỒI • S1 THOÁI LUI • LOG ĐƯỢC CHUẨN HÓA"
            fontSize={30}
            fontWeight={700}
            color="#38BDF8"
            stroke="#0284C7"
            fill="#0F172A"
            height={96}
            paddingHorizontal={36}
          />
        )}
      </svg>
    </div>
  );
};
