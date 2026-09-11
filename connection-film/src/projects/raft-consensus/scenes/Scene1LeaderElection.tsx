import React from 'react';
import { AutoPill, useBeatChoreography } from 'motion-kit';
import {
  RaftClusterTopology,
  getClusterNodeBoxes,
  type NodeState,
} from '../components/RaftClusterTopology';
import { RaftRpcConnector } from '../components/RaftRpcConnector';
import { RaftMicroHUD } from '../components/RaftMicroHUD';

export interface Scene1LeaderElectionProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene1LeaderElection: React.FC<Scene1LeaderElectionProps> = ({
  durationInFrames = 450,
  shotBeats = [],
}) => {
  const { currentBeatIndex, beatProgress, getEventProgress } = useBeatChoreography(shotBeats);

  // Beat 1: currentBeatIndex === 0 (Follower baseline, countdown timers)
  // Beat 2: currentBeatIndex === 1 (S1 Candidate, RequestVote broadcast)
  // Beat 3: currentBeatIndex === 2 (Quorum majority reached, S1 Leader elected, Heartbeats)
  const currentBeat = currentBeatIndex + 1;

  // S1 role changes across beats
  const s1Role = currentBeat === 1 ? 'FOLLOWER' : currentBeat === 2 ? 'CANDIDATE' : 'LEADER';
  const currentTerm = currentBeat === 1 ? 1 : 2;

  const nodes: NodeState[] = [
    { id: 's1', label: 'S1', role: s1Role, term: currentTerm, active: true },
    { id: 's2', label: 'S2', role: 'FOLLOWER', term: currentTerm },
    { id: 's3', label: 'S3', role: 'FOLLOWER', term: currentTerm },
    { id: 's4', label: 'S4', role: 'FOLLOWER', term: currentTerm },
    { id: 's5', label: 'S5', role: 'FOLLOWER', term: currentTerm },
  ];

  const nodeBoxes = getClusterNodeBoxes(nodes);

  // Beat 2 RPC broadcast progress derived from intra-beat choreography
  const rpcProgressBeat2 = getEventProgress(0.08, 0.88);

  // Beat 3 Heartbeat pulse progress derived from beat progress
  const heartbeatProgress = (beatProgress * 3.75) % 1;

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
        term={currentTerm}
        shotNumber={1}
        shotTitle="BẦU CHỌN LEADER"
        quorumStatus={currentBeat === 3 ? 'QUORUM: 4/5 PHIẾU (ĐẮC CỬ)' : 'QUORUM YÊU CẦU: 3/5 NODES'}
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
            currentBeat === 1
              ? 'PHA 1: KHỞI TẠO CỤM & HẾT GIỜ BẦU CỬ'
              : currentBeat === 2
              ? 'PHA 2: CANDIDATE PHÁT REQUESTVOTE RPC'
              : 'PHA 3: QUORUM ĐA SỐ & S1 ĐẮC CỬ LEADER'
          }
          fontSize={30}
          fontWeight={700}
          color="#38BDF8"
          stroke="#0284C7"
          fill="#0F172A"
          height={96}
          paddingHorizontal={36}
        />

        {/* RPC Connectors for Beat 2 (RequestVote from S1 to Followers) */}
        {currentBeat === 2 && (
          <g className="rpc-broadcast-group">
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s2}
              rpcType="RequestVote"
              progress={rpcProgressBeat2}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s3}
              rpcType="RequestVote"
              progress={rpcProgressBeat2}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s4}
              rpcType="RequestVote"
              progress={rpcProgressBeat2}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s5}
              rpcType="RequestVote"
              progress={rpcProgressBeat2}
            />
          </g>
        )}

        {/* Heartbeats for Beat 3 (Leader S1 maintains authority) */}
        {currentBeat === 3 && (
          <g className="heartbeat-group">
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s2}
              rpcType="Heartbeat"
              progress={heartbeatProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s3}
              rpcType="Heartbeat"
              progress={heartbeatProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s4}
              rpcType="Heartbeat"
              progress={heartbeatProgress}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s5}
              rpcType="Heartbeat"
              progress={heartbeatProgress}
            />
          </g>
        )}

        {/* 5 Server Nodes Polar Layout */}
        <RaftClusterTopology
          nodes={nodes}
          activeNodeId="s1"
          centerX={540}
          centerY={640}
          radius={250}
          staggerRadii={[250, 300]}
        />

        {/* Clean State Explanation Pill (Zero Ghosting between beats) */}
        {currentBeat === 1 && (
          <AutoPill
            x={540}
            y={1180}
            text="ĐỒNG HỒ BẦU CỬ NGẪU NHIÊN (150ms - 300ms)"
            fontSize={30}
            fontWeight={600}
            color="#94A3B8"
            stroke="#475569"
            fill="#0F172A"
            height={96}
            paddingHorizontal={36}
          />
        )}

        {currentBeat === 2 && (
          <AutoPill
            x={540}
            y={1180}
            text="S1 TĂNG TERM 2 • GỬI REQUESTVOTE TỚI CỤM"
            fontSize={30}
            fontWeight={600}
            color="#F59E0B"
            stroke="#D97706"
            fill="#0F172A"
            height={96}
            paddingHorizontal={36}
          />
        )}

        {currentBeat === 3 && (
          <AutoPill
            x={540}
            y={1180}
            text="S1 ĐẮC CỬ LEADER • PHÁT HEARTBEAT ĐỊNH KỲ"
            fontSize={30}
            fontWeight={700}
            color="#10B981"
            stroke="#059669"
            fill="#0F172A"
            height={96}
            paddingHorizontal={36}
          />
        )}
      </svg>
    </div>
  );
};
