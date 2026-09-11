import React from 'react';
import { AutoPill, AutoClippingConnector, type BoxDescriptor, useBeatChoreography } from 'motion-kit';
import {
  RaftClusterTopology,
  getClusterNodeBoxes,
  type NodeState,
} from '../components/RaftClusterTopology';
import { RaftRpcConnector } from '../components/RaftRpcConnector';
import { RaftLogReplicationMechanism } from '../components/RaftLogReplicationMechanism';
import { RaftMicroHUD } from '../components/RaftMicroHUD';

export interface Scene2LogReplicationProps {
  durationInFrames?: number;
  shotBeats?: any[];
}

export const Scene2LogReplication: React.FC<Scene2LogReplicationProps> = ({
  durationInFrames = 450,
  shotBeats = [],
}) => {
  const { currentBeatIndex, getEventProgress } = useBeatChoreography(shotBeats);

  // Local beat within Scene 2:
  // Beat 4: currentBeatIndex === 0 (Client write command -> Leader S1 uncommitted)
  // Beat 5: currentBeatIndex === 1 (AppendEntries broadcast -> Followers ACK)
  // Beat 6: currentBeatIndex === 2 (Quorum majority -> Committed & State Machine apply)
  const currentBeat = currentBeatIndex + 4;

  const nodes: NodeState[] = [
    { id: 's1', label: 'S1', role: 'LEADER', term: 2, active: true },
    { id: 's2', label: 'S2', role: 'FOLLOWER', term: 2 },
    { id: 's3', label: 'S3', role: 'FOLLOWER', term: 2 },
    { id: 's4', label: 'S4', role: 'FOLLOWER', term: 2 },
    { id: 's5', label: 'S5', role: 'FOLLOWER', term: 2 },
  ];

  const nodeBoxes = getClusterNodeBoxes(nodes);

  // Client command box at y = 180
  const clientBox: BoxDescriptor = {
    cx: 540,
    cy: 180,
    width: 380,
    height: 96,
    cornerRadius: 18,
  };

  // Beat 4 Client to Leader command progress derived from intra-beat choreography
  const clientProgress = getEventProgress(0.08, 0.75);

  // Beat 5 AppendEntries broadcast progress derived from intra-beat choreography
  const rpcProgressBeat5 = getEventProgress(0.08, 0.85);

  // ACK count dynamic calculation across beats
  const ackCount = currentBeat === 4 ? 1 : currentBeat === 5 ? 3 : 4;
  const isCommitted = currentBeat === 6;
  const stateMachineApplied = currentBeat === 6;

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
        term={2}
        shotNumber={2}
        shotTitle="SAO CHÉP NHẬT KÝ"
        quorumStatus={
          isCommitted
            ? 'QUORUM ĐÃ CAM KẾT: 3/5 NODES'
            : currentBeat === 5
            ? 'TIẾN ĐỘ SAO CHÉP: ĐANG TRUYỀN APPENDENTRIES'
            : 'ĐANG NHẬN LỆNH GHI TỪ CLIENT'
        }
      />

      <svg
        width={1080}
        height={1920}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {/* Client Write Command Box at Top of Stage Zone */}
        <AutoPill
          x={540}
          y={180}
          text={
            currentBeat === 4
              ? 'CLIENT: GỬI LỆNH GHI [SET x = 1]'
              : currentBeat === 5
              ? 'APPENDENTRIES: PHÁT SÓNG ĐỒNG LOẠT'
              : 'CLIENT PHẢN HỒI: THÀNH CÔNG (OK 200)'
          }
          fontSize={30}
          fontWeight={700}
          color="#38BDF8"
          stroke="#0284C7"
          fill="#0F172A"
          height={96}
          paddingHorizontal={36}
        />

        {/* Client to Leader S1 Connector (Beat 4 and Beat 6 response) */}
        {(currentBeat === 4 || currentBeat === 6) && (
          <AutoClippingConnector
            source={clientBox}
            target={nodeBoxes.s1}
            color={currentBeat === 6 ? '#10B981' : '#38BDF8'}
            strokeWidth={3}
            startGap={6}
            endGap={6}
            arrowhead="end"
            arrowheadSize={12}
            progress={currentBeat === 4 ? clientProgress : 1.0}
          />
        )}

        {/* AppendEntries Broadcast from Leader S1 to Followers (Beat 5) */}
        {currentBeat === 5 && (
          <g className="append-entries-rpc-group">
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s2}
              rpcType="AppendEntries"
              progress={rpcProgressBeat5}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s3}
              rpcType="AppendEntries"
              progress={rpcProgressBeat5}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s4}
              rpcType="AppendEntries"
              progress={rpcProgressBeat5}
            />
            <RaftRpcConnector
              sourceBox={nodeBoxes.s1}
              targetBox={nodeBoxes.s5}
              rpcType="AppendEntries"
              progress={rpcProgressBeat5}
            />
          </g>
        )}

        {/* 5 Server Nodes Polar Topology */}
        <RaftClusterTopology
          nodes={nodes}
          activeNodeId="s1"
          centerX={540}
          centerY={640}
          radius={250}
          staggerRadii={[250, 300]}
        />

        {/* Log Replication & State Machine Mechanism (Pills at y = 1110 and y = 1250) */}
        <RaftLogReplicationMechanism
          entry={{
            index: 1,
            term: 2,
            command: 'SET x = 1',
            committed: isCommitted,
          }}
          ackCount={ackCount}
          totalNodes={5}
          stateMachineApplied={stateMachineApplied}
        />
      </svg>
    </div>
  );
};
