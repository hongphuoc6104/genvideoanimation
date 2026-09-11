# Project Brief: Raft Distributed Consensus Protocol

## 1. Executive Summary
- **Title**: Đồng Thuận Phân Tán Với Giao Thức Raft (Raft Distributed Consensus Protocol)
- **Target Audience**: Kỹ sư hệ thống phân tán, sinh viên Khoa học Máy tính
- **Canvas Format**: Mobile-First 9:16 (1080x1920) @ 30 FPS
- **Duration**: 45.0 seconds (1350 frames, 3 shots, 9 beats)
- **Primary Creative Metaphor**: Cụm 5 server nodes ($S_1, S_2, S_3, S_4, S_5$) với vòng hào quang trạng thái (Follower: slate `#64748B`, Candidate: amber `#F59E0B`, Leader: emerald `#10B981`), các RPC request/response bay dọc theo đường kết nối tự động ngắt viền (`AutoClippingConnector`), và chuỗi khối nhật ký log entries co giãn tự động (`AutoPill`) chuyển từ Uncommitted sang Committed.

## 2. Pedagogical Objectives
1. **Explain Leader Election**: How randomized election timeouts prevent split votes and form a majority quorum ($\lfloor 5/2 \rfloor + 1 = 3$).
2. **Demonstrate Replicated Log Consistency**: How client commands travel from Leader to Followers via `AppendEntries` RPCs and commit only upon majority acknowledgment.
3. **Illustrate Network Partitioning & Safety**: How network splits create minority and majority partitions, strictly preventing split-brain writes, and how healing resolves uncommitted log discrepancies.

## 3. Shot & Beat Architecture
- **Shot 1: Leader Election & Quorum Formation (`shot_01`, Frames 0–450, Beats 1–3)**
  - *Beat 1 (0–150)*: Baseline state — 5 follower nodes with randomized countdown timers.
  - *Beat 2 (150–300)*: Timeout expiration — Node $S_1$ becomes Candidate, broadcasts `RequestVote` RPCs.
  - *Beat 3 (300–450)*: Quorum formation — $S_1$ secures 4/5 votes, becomes Leader, broadcasts Heartbeats.
- **Shot 2: Log Replication & State Machine Commitment (`shot_02`, Frames 450–900, Beats 4–6)**
  - *Beat 4 (450–600)*: Client write `SET x = 1` arrives at Leader $S_1$, appended as uncommitted entry.
  - *Beat 5 (600–750)*: Leader replicates entry to Followers via `AppendEntries` RPCs; Followers acknowledge.
  - *Beat 6 (750–900)*: Majority quorum reached, Leader marks entry Committed, applies to State Machine.
- **Shot 3: Network Partition & Split-Brain Prevention (`shot_03`, Frames 900–1350, Beats 7–9)**
  - *Beat 7 (900–1050)*: Partition barrier isolates {$S_1, S_2$} from {$S_3, S_4, S_5$}; $S_1$ cannot commit (2/5 < 3).
  - *Beat 8 (1050–1200)*: Majority partition elects $S_3$ as Term 3 Leader; $S_3$ commits authoritative entries.
  - *Beat 9 (1200–1350)*: Partition heals; $S_1$ yields to $S_3$; uncommitted log healed; linearizable safety preserved.

## 4. Geometric Quality Standards
- 100% smart primitives: `AutoClippingConnector`, `AutoPill`, `OpaqueCard`, `SafeStageZone`, `RadialLabelGroup`.
- Zero manual coordinate hacks: all connectors compute ray-box intersections dynamically.
- Zero viewport overflow ($x \in [36, 1044]$, stage $y \in [180, 1420]$).
- Subtitle safe zone protected ($y \ge 1470$, clearance buffer $\ge 50\text{px}$).
