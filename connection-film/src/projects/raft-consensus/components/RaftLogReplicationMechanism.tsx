import React from 'react';
import { AutoPill } from 'motion-kit';

export interface LogEntry {
  index: number;
  term: number;
  command: string;
  committed: boolean;
}

export interface RaftLogReplicationMechanismProps {
  entry: LogEntry;
  ackCount: number;
  totalNodes?: number;
  stateMachineApplied?: boolean;
}

/**
 * RaftLogReplicationMechanism: Visualizes Raft log replication and commit status.
 * Uses 100% smart primitive AutoPill with content-driven metrics and padding >= 30px.
 * Strictly bounded in Stage Zone 2 (y <= 1360px) preserving >= 50px buffer before subtitle zone.
 */
export const RaftLogReplicationMechanism: React.FC<RaftLogReplicationMechanismProps> = ({
  entry,
  ackCount,
  totalNodes = 5,
  stateMachineApplied = false,
}) => {
  const isCommitted = entry.committed;
  const quorumMet = ackCount >= Math.floor(totalNodes / 2) + 1;

  const entryLabel = isCommitted
    ? `MỤC [Idx ${entry.index}, T${entry.term}: ${entry.command}] • ĐÃ COMMIT`
    : `MỤC [Idx ${entry.index}, T${entry.term}: ${entry.command}] • CHƯA COMMIT`;

  const quorumLabel = stateMachineApplied
    ? `STATE MACHINE: ${entry.command.replace('SET ', '')} (ÁP DỤNG THÀNH CÔNG)`
    : `QUORUM TIẾN ĐỘ: ${ackCount}/${totalNodes} NODES XÁC NHẬN ${quorumMet ? '(ĐỦ QUÁ BÁN)' : '(CHƯA ĐỦ)'}`;

  return (
    <g className="raft-log-replication-mechanism">
      {/* Primary Log Entry Pill (Uncommitted orange dashed vs Committed emerald solid) */}
      <AutoPill
        x={540}
        y={1110}
        text={entryLabel}
        fontSize={30}
        fontWeight={700}
        color={isCommitted ? '#34D399' : '#FBBF24'}
        stroke={isCommitted ? '#10B981' : '#F59E0B'}
        strokeWidth={isCommitted ? 3 : 2}
        fill="#0F172A"
        height={96}
        paddingHorizontal={36}
      />

      {/* Quorum / State Machine Applied Pill */}
      <AutoPill
        x={540}
        y={1250}
        text={quorumLabel}
        fontSize={30}
        fontWeight={600}
        color={stateMachineApplied ? '#38BDF8' : quorumMet ? '#10B981' : '#94A3B8'}
        stroke={stateMachineApplied ? '#38BDF8' : quorumMet ? '#10B981' : '#475569'}
        strokeWidth={2}
        fill="#0F172A"
        height={96}
        paddingHorizontal={36}
      />
    </g>
  );
};
