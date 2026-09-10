# Original User Request

## Initial Request — 2026-09-09T17:01:43Z

Upgrade the educational flat vector motion animation system to V2 production grade, establishing a canonical self-contained `motion-kit`, decoupled character architecture, physics-backed performance profiles, continuous camera choreography, AST-based quality gates, temporal render QA, and independent evaluation on unseen tasks.

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: benchmark

---

## Requirements

### R1. Canonical Single Package (`motion-kit`)
Package `motion-kit/` as an independent, canonical workspace package (with complete `package.json`, TypeScript definitions, and zero runtime imports from `.agents/skills`). Production video compositions and benchmarks must import solely from `motion-kit` or local project sources.

### R2. Articulated Character Architecture & Rig Interface
Replace the monolithic bird-specific rig with a decoupled architecture:
- `CharacterController`: High-level state, action sequencing, and profile coordinator.
- `RigInterface`: Explicit contract for character geometry, joints, transforms, and expressive layers.
- Implementations: `BirdRig`, `HumanRig`, and an `ArbitraryCustomRigAdapter` for third-party or arbitrary vector characters.

### R3. Physics-Backed Performance Profiles
Upgrade character actions (`anticipate`, `overshoot`, `settle`, `react`, `gesture`) to consume explicit `PerformanceProfile` types:
- Profiles: `calm`, `energetic`, `playful`, `dramatic`, `solemn`.
- Profiles must parameterize physics timing, squash ratios, overshoot amplitudes, follow-through lag, and settle oscillations — not merely adjust easing curves.

### R4. Camera Continuity System
Implement continuous camera tracking in `CameraRig`:
- Velocity-aware target tracking with look-ahead offsets.
- Functional damping that genuinely affects camera inertia (no inert damping parameters).
- Configurable dead-zone thresholds to prevent micro-jitter.
- C0 (positional) and C1 (velocity/derivative) continuity across sequential camera states and shot transitions.

### R5. Real Object & Geometry Morphing Machinery
Replace faux morphing (`morphTransition`) with true geometric interpolation:
- Interpolate SVG paths or coordinate matrices through vertex matching or intermediate blend geometry.
- Hard conditional binary swaps (`progress < X ? A : B`) during a claimed morph must be disallowed and caught by validators.

### R6. Bezier Path-Following Helpers
Implement exact path-following mathematical utilities:
- `quadraticBezierPoint(p0, p1, p2, t)`
- `cubicBezierPoint(p0, p1, p2, p3, t)`
- Path packet travel utility (calculating tangent angle, velocity, and coordinate along curve).
- Animated path reveal stroke coordinator.
- Any packet or particle declared to travel along a Bezier path must compute and follow its exact trajectory.

### R7. Recursive AST-Based Motion Linter
Replace regex-based string matching in `motion-lint.ts` with a robust TypeScript/Babel AST visitor:
- Traverse the abstract syntax tree to detect generic anti-patterns (e.g. monolithic inline SVGs without articulated groups, binary opacity crossfades masquerading as pose blending, unmotivated linear transforms, conditional component flips during morphs).
- Must detect semantic code patterns independent of project-specific naming conventions.

### R8. Temporal Render Quality Assurance
Create an automated video inspection tool (`temporal-render-qa.ts`):
- Decode rendered MP4 frames using FFmpeg / image processing.
- Compute rolling adjacent-frame mean absolute difference (MAD).
- Automatically flag and log any unannotated frame discontinuity exceeding ~4× the rolling local median.
- Whitelist legitimate high-velocity impact frames through explicit declarations in the `ShotSpec`.

### R9. Mandatory Composition ShotSpec
Require a validated `shot-spec.json` for every production and benchmark composition:
- Validate continuity between consecutive shots (`shot[N].end_state == shot[N+1].start_state`).
- Missing or malformed ShotSpec triggers immediate quality gate failure.

### R10. Audio & Cue Manifest Synchronization
Establish a unified cue manifest interface connecting visual timing markers in Remotion to audio events and sound design generation.

### R11. V2 Benchmarking on NEW Unseen Tasks
Benchmark the upgraded V2 production system against 2–3 entirely **NEW, unseen tasks** (e.g., Human conversational explainer, complex mechanical physics transformation, or multi-stage network protocol data flow).
- **CRITICAL:** Do NOT reuse or tune against the original 3 diagnostic benchmark sequences.

### R12. Independent Reviewer Quality Scoring
Benchmark scoring and validation must be performed by an independent reviewer agent/subagent with an objective rubric. The implementing agent is strictly forbidden from self-awarding acceptance scores.

---

## Acceptance Criteria

### Canonical Packaging & Architecture
- [ ] `motion-kit` compiles cleanly as a standalone TypeScript package with zero imports from `.agents/skills`.
- [ ] `CharacterController` drives both `BirdRig` and `HumanRig` through the unified `RigInterface`.
- [ ] Custom rig adapter demonstrates successful mounting of an arbitrary SVG character.

### Motion Dynamics & Physics
- [ ] High-level actions respond dynamically to all 5 `PerformanceProfile` presets (`calm`, `energetic`, `playful`, `dramatic`, `solemn`) with distinct squash, overshoot, and settle metrics.
- [ ] Camera tracking exhibits verifiable damping, dead-zone stillness, and look-ahead without C0/C1 velocity spikes.
- [ ] Path travel utility accurately places packets along quadratic and cubic Bezier coordinates.
- [ ] Geometric morphs perform continuous shape transformation without binary conditional swaps.

### Quality Gates & Verification
- [ ] `motion-lint.ts` AST engine detects anti-patterns structurally without regex false positives or variable name dependencies.
- [ ] `temporal-render-qa.ts` decodes rendered MP4s, calculates rolling frame difference medians, and flags unannotated spikes (>4× local median).
- [ ] Every active composition possesses a valid `shot-spec.json` passing automated validation.

### Deliverables & Benchmark Evaluation
- [ ] New unseen V2 benchmark sequences rendered to MP4.
- [ ] Independent reviewer agent scores all V2 benchmarks against `quality-rubric.md` (minimum threshold ≥ 4.5/5.0).
- [ ] Full Git commit and push to remote repository.
- [ ] Global installation deferred until all V2 criteria are independently certified.

## Follow-up — 2026-09-09T18:08:43Z

Build an offline-capable local narration, word-synchronized karaoke subtitle, and audio production subsystem (V3) for Remotion explainer animations with Kokoro-82M TTS and WhisperX forced alignment.

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: development

## Requirements

### R1. Canonical Narration Package (`packages/narration-kit/`)
Implement a unified TypeScript package providing the end-to-end audio/narration pipeline:
- TTS interfaces and Kokoro provider (`src/tts/`)
- WhisperX local forced alignment provider and validators (`src/alignment/`)
- Punctuation & pause-aware caption segmentation (`src/captions/`)
- Audio ducking, loudness normalization, and audio manifest (`src/audio/`)
- Pipeline orchestration (`src/pipeline/generateNarrationPipeline.ts`)
Must be the single canonical runtime implementation imported by Remotion compositions.

### R2. Local Kokoro-82M TTS Engine
Generate high-fidelity local narration without cloud APIs:
- Default voice `am_adam`, configurable (`am_fenrir`, `am_michael`, `am_onyx`, etc.)
- Strict local generation producing 24kHz mono PCM WAV files
- Intermediate MP3 conversion prohibited

### R3. Offline Asset Management & Strict Network Guard
- Explicit setup command (`npm run narration:setup`) to prepare local model assets under `models/kokoro` and `models/alignment`
- Strict offline generation mode (`--offline`) with automated network guard rejecting any external HTTP/API request

### R4. Text Normalization & Narration Chunking
- Deterministic preprocessing preserving bidirectional mapping: original text -> normalized text -> spoken text
- Handles numbers, abbreviations, acronyms, URLs, punctuation, and quotes
- Emits inspectable `narration-text-map.json`

### R5. Deterministic Prosody System
- Reusable profiles (`documentary`, `educational`, `energetic`, `calm`, `dramatic`, `solemn`) controlling speed, pause duration, and chunk boundaries
- Integration with ShotSpec (`narration_profile`, `emphasis_words`, `pause_after`)

### R6. Local Word Alignment (WhisperX Forced Alignment)
- Use original script as authoritative transcript (no ASR hallucination or wording drift)
- Produce exact word-level timings (`start`, `end`, `confidence`) outputting `words.json`

### R7. Alignment Quality Gates
- Automated validation checking: non-negative start, strictly increasing timestamps, duration consistency, missing/extra spoken words, and silence anomalies

### R8. Caption Segmentation & Safe Area Placement
- Segment captions from word timings (1-2 lines, short phrase groups)
- ShotSpec integration avoiding subject regions (`bottom`, `lower-left`, `lower-right`, `top`, `auto`)
- Emits `captions.json`

### R9. Karaoke Caption Kit (`packages/caption-kit/`)
- Remotion React components: `KaraokeCaptions`, `KaraokeGroup`, `KaraokeLine`, `KaraokeWord`
- Frame-deterministic progressive fill (0% -> 100% highlight via clip-path/mask) across spoken word duration
- Educational art direction: clean controlled ease, neutral upcoming, accent active, muted spoken (no TikTok bouncing/shaking)

### R10. Audio Mixing & Cue Manifest Integration
- Multi-track mixing (`narration`, `music`, `SFX`) with automatic ducking attack/release envelopes
- Emits `audio-manifest.json` with duration mismatch and clipping validation
- Derive semantic animation cues (`WORD_EMPHASIS`, `SENTENCE_START`, `SENTENCE_END`) into V2 `CueManifest`

### R11. Automated QA & Temporal Karaoke Validation
- Suite of validators: `validate-narration.ts`, `validate-alignment.ts`, `validate-captions.ts`, `validate-caption-layout.ts`, `validate-audio-mix.ts`, `offline-network-guard.ts`
- Diagnostic frame rendering for visual caption layout check
- Temporal QA verifying strictly monotonic word highlight progression

### R12. Benchmarks & Voice Comparison
- Benchmark A: Standard Educational Narration (20-30s)
- Benchmark B: Difficult Technical Narration (numbers, acronyms, punctuation)
- Benchmark C: Rapid/Expressive Narration (variable pauses, prosody)
- Voice Comparison: Multi-voice render (`am_adam`, `am_fenrir`, `am_michael`, `am_onyx`)
- All benchmarks produce `script.txt`, `narration.wav`, `narration-text-map.json`, `words.json`, `captions.json`, `audio-manifest.json`, and rendered MP4 video

## Acceptance Criteria

### Automated Verification
- [ ] `npm run narration:setup` installs local models into `models/` without global pollution
- [ ] `packages/narration-kit` and `packages/caption-kit` compile with TypeScript without errors
- [ ] All validators pass with 0 exit code on Benchmark A, B, and C
- [ ] Offline guard test passes with network disabled (`--offline` succeeds without network)
- [ ] Benchmark A, B, C and Voice Comparison MP4 videos render cleanly in `out/v3/`
- [ ] Diagnostic frames confirm captions stay within safe margin and avoid subject region
- [ ] Temporal karaoke QA confirms highlight progression is strictly monotonic (0% -> 100%)

### Deliverables
- [ ] `packages/narration-kit/`
- [ ] `packages/caption-kit/`
- [ ] `models/README.md`
- [ ] `validators/`
- [ ] `out/v3/benchmark-a/`, `out/v3/benchmark-b/`, `out/v3/benchmark-c/`, `out/v3/voice-comparison/`
- [ ] `benchmark-v3-report.md`

## Follow-up — 2026-09-09T17:26:34Z

User request: "tiếp tục cả các agents đang bị limit ngừng lần trước". Hãy tiếp tục thực thi các milestone M2, M3, M4, M5 ngay lập tức. Nếu có lệnh spawn subagent con, hãy đảm bảo luôn dùng Model: "inherit" (hoặc không truyền Model) để tránh lỗi MODEL_PLACEHOLDER_M322.

## Follow-up — 2026-09-09T23:42:38Z

Build an offline-capable local narration, word-synchronized karaoke subtitle, and audio production subsystem (V3) for Remotion explainer animations with Kokoro-82M TTS and WhisperX forced alignment.

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: development

RESUMPTION CONTEXT:
Milestone 1 is complete and committed to git (commit 8c8042c).
See CHECKPOINT_V3.md for verified state:
- packages/narration-kit/src/tts/ (Kokoro-82M engine, 24kHz mono PCM WAV, voice presets, asset manager, text normalizer, prosody chunker)
- packages/narration-kit/src/alignment/ (AlignmentProvider, WhisperXLocalAligner, normalizeAlignment, validateAlignment)
- scripts/align-transcript.py & scripts/generate-offline-narration.py
- validators/offline-network-guard.ts (hardened against IPv4 spoofing and c-ares DNS resolve leaks)
- models/ (kokoro ONNX weights, wav2vec2 alignment weights cached)
- tests/ (narration-kit 90/90 pass, challenger offline guard 29/29 pass, e2e contract suite 435/435 pass)

CONTINUE MILESTONES 2 THROUGH 6:

1. Finish Caption Subsystem in packages/narration-kit:
- src/captions/segmentCaptions.ts (1-2 line subtitle segmentation from word timings)
- src/captions/safePlacement.ts (ShotSpec-aware placement: bottom, lower-left, lower-right, top, auto avoiding subject_region)
- src/captions/index.ts

2. Build Canonical Audio Subsystem in packages/narration-kit:
- src/audio/normalizeLoudness.ts (EBU R128 / target loudness)
- src/audio/mixAudio.ts (multi-track mixing: narration, music, SFX with attack/release ducking envelopes)
- src/audio/audioManifest.ts (audio-manifest.json generation and validation)
- src/audio/index.ts

3. Build Canonical Pipeline Runner in packages/narration-kit:
- src/pipeline/generateNarrationPipeline.ts (end-to-end: script -> text map -> TTS chunks -> wav concat -> alignment -> captions -> audio mix -> cue derivation)
- src/pipeline/index.ts
- export from packages/narration-kit/src/index.ts

4. Build Remotion Karaoke Caption Kit (packages/caption-kit/):
- packages/caption-kit/src/KaraokeCaptions.tsx
- packages/caption-kit/src/KaraokeGroup.tsx
- packages/caption-kit/src/KaraokeLine.tsx
- packages/caption-kit/src/KaraokeWord.tsx (frame-deterministic progressive fill 0% -> 100% via clip-path/mask)
- packages/caption-kit/src/index.ts
- packages/caption-kit/package.json
- Link to root workspace and connection-film/node_modules

5. Build Standalone CLI Quality Gate Validators in validators/:
- validators/validate-narration.ts
- validators/validate-alignment.ts
- validators/validate-captions.ts
- validators/validate-caption-layout.ts
- validators/validate-audio-mix.ts
- validators/temporal-karaoke-qa.ts

6. Execute and Render Unseen Benchmarks in out/v3/:
- Benchmark A: Standard Educational Narration (20-30s, Adam voice)
- Benchmark B: Difficult Technical Narration (numbers, acronyms, technical terms)
- Benchmark C: Rapid / Expressive Narration (variable pauses, prosody)
- Voice Comparison: Multi-voice render (am_adam, am_fenrir, am_michael, am_onyx)
All benchmarks must generate: script.txt, narration.wav, narration-text-map.json, words.json, captions.json, audio-manifest.json, and final rendered MP4.

7. Deliverables:
- benchmark-v3-report.md with complete QA matrices, independent evaluation rubric, and offline proof.
- Clean git commit.


## Follow-up — 2026-09-10T01:35:21Z

# Teamwork Project Prompt — Scopus Research Gap Explainer TikTok 9:16

Tạo một video hoạt hình đồ họa chuyển động phẳng (Educational Flat Motion) định dạng dọc TikTok 9:16 (1080x1920) hướng dẫn toàn diện phương pháp luận xác định Research Gap chuẩn công bố quốc tế Scopus dựa trên tài liệu nghiên cứu trong `content/` (tổng quan bản chất học thuật, phân loại 5 loại gap, quy trình 4 bước lập luận, cấu trúc 3 tầng câu gap statement, template chuẩn và các cạm bẫy cần tránh).

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: development

## Requirements

### R1. Script & Narrative Beat Architecture (Tổng quát đến Chi tiết)
Phân rã kịch bản chi tiết dựa trên tài liệu `content/` (3 file ảnh tài liệu học thuật: "HƯỚNG DẪN XÁC ĐỊNH RESEARCH GAP THEO CHUẨN SCOPUS"):
1. **Phần 1 - Đặt vấn đề & Bản chất Scopus (Tổng quan)**:
   - Tại sao bài báo phương pháp mạnh, dữ liệu tốt vẫn bị từ chối (Rejection)? Lỗi không chứng minh được khoảng trống học thuật thuyết phục.
   - Bản chất chuẩn Scopus: Không phải nhãn hình thức hay câu chữ cảm tính, mà là khả năng đáp ứng kỳ vọng học thuật trong đối thoại tri thức.
   - 3 câu hỏi cốt lõi mà mọi Research Gap phải trả lời: (1) Tri thức hiện có đã biết gì? (2) Điểm nào chưa thỏa đáng? (3) Nghiên cứu này đóng góp gì mới?
   - 4 thuộc tính tối thiểu của Gap chuẩn Scopus: Tính định vị, Tính chứng cứ, Tính giải thích, Tính khả nghiên cứu (Mô hình Swales CARS 1990: Move 1 - Move 2 - Move 3).
2. **Phần 2 - Phân loại 5 loại Research Gap (Taxonomy)**:
   - Phân tích trực quan 5 cánh cửa / 5 loại gap:
     + Gap lý thuyết (Theoretical Gap): Cơ chế/biến trung gian/điều tiết chưa giải thích hết.
     + Gap thực nghiệm (Empirical Gap): Kết quả mâu thuẫn, chưa nhất quán giữa các nghiên cứu trước.
     + Gap bối cảnh (Contextual Gap): Đặc thù làm thay đổi cơ chế (không chỉ đơn thuần đổi tên địa phương).
     + Gap phương pháp (Methodological Gap): Hạn chế đo lường, thiết kế mẫu, sai lệch CMV.
     + Gap ứng dụng (Application/Practical Gap): Khoảng cách chính sách/quản trị gắn với lý thuyết.
3. **Phần 3 - Quy trình 4 bước xác định Research Gap**:
   - Bước 1: Thu hẹp từ chủ đề chung sang dòng nghiên cứu cụ thể (Narrowing funnel).
   - Bước 2: Lập bản đồ tri thức hiện có (Knowledge Matrix: khái niệm, bối cảnh, phương pháp, mâu thuẫn).
   - Bước 3: Chuyển hạn chế của nghiên cứu trước thành khoảng trống có thể kiểm định (Lọc 3 điều kiện: liên hệ cốt lõi, lặp lại nhiều bài báo uy tín, khả thi kiểm định).
   - Bước 4: Viết Gap Statement theo cấu trúc 3 tầng (3-Tier Architecture: Tầng nền -> Tầng vấn đề -> Tầng định vị).
4. **Phần 4 - Template & Ví dụ thực tế (Case Study)**:
   - Minh họa Template 4 câu chuẩn quốc tế.
   - Case study cụ thể về lĩnh vực Ngân hàng số (Digital Banking, e-service quality, trust, perceived risk, continuance intention).
5. **Phần 5 - 4 Lỗi chết người cần tránh & Kết luận**:
   - Tránh: Tuyên bố thiếu bằng chứng, đồng nhất bối cảnh mới với tính mới, liệt kê nguồn rời rạc, tách gap khỏi phương pháp.
   - Thông điệp chốt: Research gap là nền tảng của tính mới và lập luận khoa học.

### R2. Remotion TikTok 9:16 Composition Architecture
Thiết lập Remotion composition với tỷ lệ dọc 9:16 (1080x1920, 30fps), tuân thủ nghiêm ngặt safe zones của TikTok:
- Active zone: An toàn trong khoảng Y: 140px đến 1640px, tránh các khu vực bị che khuất bởi UI TikTok (avatar, like, comment, share bên phải; thanh caption/sound phía dưới).
- Hệ thống màu sắc học thuật chuyên nghiệp (Academic Palette Tokens): Nền Navy sâu (`#0F172A`), Màu học giả Teal/Cyan (`#06B6D4`), Màu cảnh báo Amber/Coral (`#F59E0B`, `#EF4444`), Điểm nhấn Emerald (`#10B981`), và Trắng xám thanh lịch (`#F8FAFC`, `#94A3B8`).
- Hệ thống phân chia layer đa tầng (Background, Midground, Foreground, UI/Overlay).

### R3. Visual Metaphors & Art Direction (`educational-flat-motion`)
Ứng dụng các ẩn dụ trực quan (visual metaphors) đặc trưng của phong cách phẳng hiện đại thay vì trình chiếu slide chữ nhàm chán:
- Nhân vật Nhà nghiên cứu (Researcher/Scientist Rig) với đầy đủ chuyển động khớp nối, biểu cảm (bối rối khi bị reject -> phân tích bản đồ tri thức -> tự tin công bố).
- Phễu lọc dòng nghiên cứu (Narrowing Funnel).
- Bản đồ tri thức (Knowledge Grid / Network Map) với các nút mạng kết nối và điểm đứt gãy (gap node).
- Khối xây dựng 3 tầng (3-Tier Block Assembly: Tầng nền móng vững chắc, Tầng khoảng trống khuyết, Tầng khối nghiên cứu mới gắn khít vào).
- Chiếc kính lúp / lăng kính kiểm định hạn chế.

### R4. Motion Choreography & System Primitives (`motion-kit`)
Sử dụng các primitive chuẩn từ `motion-kit` và `educational-flat-motion`:
- Không dùng hard cut hay ternary flip (`progress < 0.5 ? A : B`); toàn bộ chuyển cảnh phải có động cơ (motivated transitions: morphing hình học, match cut qua trục tọa độ, camera pan/push).
- Chuyển động vật lý với các profile phù hợp (`calm`, `energetic`, `dramatic`) có anticipation, overshoot, settle, không dùng chuyển động tuyến tính khô cứng.
- Đường dẫn Bezier chính xác cho dòng hạt dữ liệu tri thức di chuyển mượt mà.

### R5. Subtitles / Karaoke & Cue Manifest
Tích hợp hệ thống phụ đề chữ to, rõ ràng, phong cách TikTok (dễ đọc trên màn hình di động):
- Hiển thị theo cụm từ ngắn (1-2 dòng) đồng bộ nhịp nhàng theo diễn tiến của từng phân cảnh.
- Tạo tệp `shot-spec.json` và `cues.json` đồng bộ giữa nhịp hình ảnh và nhịp giải thích.

### R6. Quality Assurance & MP4 Export
- Chạy kiểm tra tĩnh AST linter (`npm run lint` hoặc `validators/motion-lint.ts`) đạt 0 CRITICAL và 0 MAJOR violations.
- Chạy kiểm tra ShotSpec (`validate-shot-spec.ts`) đảm bảo tính liên tục camera và trạng thái giữa các phân cảnh.
- Render hoàn chỉnh video MP4 tỷ lệ 9:16 (1080x1920) tại thư mục `out/` và kiểm tra trực quan chất lượng khung hình.

## Acceptance Criteria

### Script & Content Completeness
- [ ] Kịch bản truyền tải trọn vẹn và chính xác 100% nội dung học thuật từ 3 trang tài liệu trong `content/`: Bản chất Scopus, 3 câu hỏi cốt lõi, 4 thuộc tính, 5 loại gap, quy trình 4 bước, cấu trúc 3 tầng, template 4 câu, case study ngân hàng số, 4 lỗi cần tránh.
- [ ] Cấu trúc video đi từ phân tích tổng quát (bức tranh lớn của công bố quốc tế) đến chi tiết từng bước thao tác thực tế.

### Visual & Motion Quality
- [ ] Định dạng video đạt chuẩn TikTok 9:16 (kích thước 1080x1920, 30 FPS).
- [ ] Tuân thủ nguyên tắc `educational-flat-motion`: không dùng slide chữ đơn thuần, sử dụng đồ họa vector phẳng SVG, ẩn dụ trực quan sinh động, bố cục có chiều sâu.
- [ ] Nhân vật được điều khiển qua hệ thống khớp nối (Character Rig) có hành động và biểu cảm, không phải hình tĩnh di chuyển.
- [ ] Chuyển cảnh giữa các phân đoạn mượt mà, có động cơ (motivated transitions), không giật cục.
- [ ] Bố cục tuân thủ TikTok safe zones, chữ và icon hiển thị sắc nét, dễ đọc trên thiết bị di động.

### Verification & Quality Gates
- [ ] Kiểm tra tĩnh `validators/motion-lint.ts` vượt qua với 0 CRITICAL và 0 MAJOR violations.
- [ ] Tệp `shot-spec.json` được định nghĩa đầy đủ và vượt qua kiểm tra liên tục trạng thái camera ($S_N.\text{end\_state} == S_{N+1}.\text{start\_state}$).
- [ ] Biên dịch TypeScript (`npm run typecheck`) không có bất kỳ lỗi nào.
- [ ] Video render thành công ra định dạng MP4 với âm thanh/phụ đề đồng bộ mượt mà.

## 2026-09-10T02:34:54Z

# Teamwork Project Prompt — V3.1 Vietnamese-First Bilingual Narration Hardening

> Status: Launched  
> Requested team: Full team (Speech Synthesis, Audio Alignment, Remotion Karaoke, Test & Validation)

Harden and upgrade the V3 video narration subsystem to a Vietnamese-first bilingual production engine for 1080x1920 (9:16, 30fps) vertical educational motion videos, replacing Kokoro with local VieNeu-TTS v3 Turbo while preserving speaker identity and natural sentence prosody across Vietnamese and English code-switching.

Working directory: `/home/hongphuoc6104/Desktop/videorenderhoathinh`  
Integrity mode: development

---

## Context & Invariants

- **V3 Core Architecture**: Retained and accepted. Do NOT redesign Motion Kit V2. Do NOT start V4 visual redesign yet.
- **Publishing Standard**: 1080x1920, 9:16 aspect ratio, 30fps vertical video targeting mobile phone screens (must remain legible when previewed at 360x640).
- **Caption & Karaoke Invariants**: Default font size 56px, max 2 lines. Safe margins: Left 72px, Right 180px, Top 120px, Bottom 320px. Never shrink font size merely to fit long content; re-segment into multiple captions instead.
- **Future V4 Invariants (Preserved in configuration)**: Duration is content-driven (`durationPolicy = content-driven`, `allowSemanticOmission = false`, `allowContentCompression = false`, `detailLevel = exhaustive`). Content is split into additional scenes rather than truncated or shrunk.

---

## Requirements

### R1. Primary TTS Engine Replacement: VieNeu-TTS v3 Turbo
- Replace Kokoro with **VieNeu-TTS v3 Turbo** as the primary production TTS engine.
- Must run **strictly local and offline** after initial setup (no cloud API, no external credits, no proprietary VieNeu v4 API calls).
- Output must be uncompressed 24kHz (or 48kHz downsampled/handled cleanly) mono PCM WAV format (`pcm_s16le`).
- Kokoro remains exclusively as an optional English-only fallback.

### R2. Vietnamese-First Language Policy
- Configure default `primaryLanguage = "vi-VN"` and `secondaryLanguage = "en"`.
- A sentence containing English terminology (e.g., "Research Gap là một phần quan trọng khi viết bài báo Scopus.") is classified as a Vietnamese sentence with overall Vietnamese prosody.
- Only the specific English words/phrases (e.g. "Research Gap", "Scopus") receive English pronunciation treatment.
- Synthesis must occur in a single bilingual utterance with the **same speaker identity** and continuous natural prosody; do not split English tokens into separate voice files.

### R3. Language-Aware Tokenizer & Pronunciation Modes
- Tokenize and classify script tokens and multi-token spans into semantic types:
  `VIETNAMESE`, `ENGLISH_WORD`, `ENGLISH_PHRASE`, `ACRONYM`, `INITIALISM`, `PROPER_NOUN`, `NUMBER`, `UNIT`, `FORMULA`, `MODEL_NAME`.
- Classification must not rely purely on naive uppercase regex.
- Support 5 distinct pronunciation modes:
  - `vi`: Native Vietnamese phonology.
  - `en_word`: English whole-word pronunciation (e.g., *BERT*, *Scopus*, *Springer*).
  - `en_phrase`: Multi-token English phrase prosody (e.g., *Research Gap*, *Desk Reject*, *Web of Science*).
  - `en_spell`: Letter-by-letter English spelling / initialism (e.g., *AI* → "A-I", *GPU* → "G-P-U", *GPT* → "G-P-T").
  - `custom`: Explicit phonetic or phoneme alias overrides.

### R4. Pronunciation Lexicon Architecture
- Implement hierarchical YAML pronunciation lexicons in `lexicons/`:
  - `lexicons/academic-vi-en.yaml` (academic publishing terms: Scopus, DOI, ORCID, Q1, H-index, Springer, Elsevier, etc.).
  - `lexicons/technology-vi-en.yaml` (tech terms: AI, GPU, GPT, BERT, API, ONNX, etc.).
  - `lexicons/custom.yaml` (user-defined and project-level overrides, taking highest priority).
- Ambiguous acronyms must never be silently guessed. Unregistered acronyms must be logged for human review and trigger validation failure if unresolved.

### R5. Dual Text Representation (Display Text vs. Spoken Text) & Karaoke Subunit Mapping
- Strictly decouple `displayText` from `spokenText`:
  - `displayText`: Authoritative original script shown in captions and subtitles (e.g., `"AI hỗ trợ xác định Research Gap."`). Phonetic normalizations must never appear in captions.
  - `spokenText`: Pronunciation-normalized string passed to TTS synthesis.
- Maintain a bidirectional token mapping: `display_token ↔ spoken_token(s) ↔ timestamp_range`.
- For initialisms/acronyms where one display token expands to multiple spoken units (e.g. `GPU` → spoken `"G" "P" "U"`):
  - Karaoke highlighter must support mapping one display token across multiple aligned spoken subunit intervals.
  - Subunit progressive highlighting (or whole-token highlight across the aggregate range) without altering caption text to `"G P U"` unless spaces were present in original script.

### R6. Vietnamese Number & Alphanumeric Normalization
- Numbers in Vietnamese prose must follow Vietnamese reading grammar (e.g. `"năm 2026"` → "năm hai nghìn không trăm hai mươi sáu", never "twenty twenty-six").
- Mixed alphanumeric model/product names (e.g., *GPT-5*, *Q1*, *Q2*, *H-index*) must follow lexicon-controlled bilingual pronunciations.

### R7. Local Multilingual Forced Alignment & Token Reconciliation
- Implement local multilingual forced alignment that does not assume a single language for the entire sentence.
- The original script remains strictly authoritative. ASR output is used solely for timestamp boundary evidence and must never overwrite script text.
- Reconcile detected speech boundaries back to display tokens, with seamless handling of `Vietnamese → English → Vietnamese` phonetic transitions.

### R8. Mobile 9:16 Karaoke Caption Rendering & Preview QA
- Update Caption Kit / Karaoke components to enforce vertical safe areas (Left 72px, Right 180px, Top 120px, Bottom 320px), max 2 lines, 56px base font size.
- Implement automated re-segmentation for lines exceeding safe boundaries.
- Add a mobile-preview QA render step generating a 360x640 preview video for readability verification.

### R9. Voice Benchmark Suite
- Synthesize a Vietnamese academic test script (>= 80% Vietnamese containing: *AI*, *GPU*, *GPT*, *Scopus*, *Web of Science*, *Research Gap*, *Desk Reject*, *Springer*, *Q1*, *DOI*) across 4 voices:
  1. `Minh Quân`
  2. `Minh Đức`
  3. `Adam`
  4. At least one Vietnamese female voice (e.g. `Mai Phương` or standard female preset)
- Output WAV files to `out/voice-benchmarks/` for human auditory review without auto-declaring a winner.

### R10. Three Unseen V3.1 End-to-End Benchmarks
Generate complete end-to-end video packages for three distinct scenarios:
- **Benchmark A (Academic Vietnamese)**: >= 90% Vietnamese, containing *Scopus*, *Research Gap*, *Springer*.
- **Benchmark B (Technology Code-Switch)**: >= 75% Vietnamese, containing *AI*, *GPU*, *GPT*, *BERT*, *API*.
- **Benchmark C (Dense Academic Metadata)**: Dense numbers, percentages, *DOI*, *ORCID*, *Q1/Q2*, *Web of Science*, *Elsevier*, *H-index*.
- Each benchmark must produce:
  1. `original-script.txt`
  2. `spoken-script.txt`
  3. `language-spans.json`
  4. `pronunciation-map.json`
  5. `narration.wav` (24kHz/48kHz mono PCM WAV)
  6. `words.json`
  7. `captions.json`
  8. `final.mp4` (1080x1920 30fps)

### R11. Automated CLI Quality Gate Validators
Add dedicated CLI validator scripts in `validators/`:
- `validators/validate-language-spans.ts`
- `validators/validate-pronunciation-map.ts`
- `validators/validate-token-reconciliation.ts`
- `validators/validate-bilingual-alignment.ts`
- `validators/validate-vietnamese-normalization.ts`
- Strict FAIL conditions:
  - Vietnamese year normalized into English words.
  - English acronym pronounced with unintended Vietnamese spelling when lexicon specifies English.
  - Caption text differs from original display text.
  - A display token loses all aligned spoken tokens.
  - Unknown uppercase acronym is silently guessed.

### R12. Strict Offline Network Guard Enforcement
- Intercept and block all outbound network traffic during synthesis, alignment, and rendering.
- Any attempt to reach cloud TTS, external APIs, or remote servers must trigger an immediate fatal failure.

### R13. Real Project Acceptance: Scopus / Research Gap Explainer
- Re-render the complete Scopus / Research Gap explainer video (`connection-film`) using the V3.1 engine.
- Narration must be primarily Vietnamese while retaining natural English pronunciation for *Scopus*, *Research Gap*, *Desk Reject*, *Web of Science*, and *Swales CARS*.
- Visual motion graphics must remain intact.

---

## Acceptance Criteria

### TTS & Voice Benchmarks
- [ ] Primary TTS engine is VieNeu-TTS v3 Turbo operating locally without network/API keys.
- [ ] 4 WAV benchmarks (`Minh Quân`, `Minh Đức`, `Adam`, and female voice) generated and saved in `out/voice-benchmarks/`.
- [ ] Kokoro preserved as an optional fallback provider under `@videorender/narration-kit`.

### Text Normalization & Lexicon
- [ ] Vietnamese years (e.g. 2026) normalized into Vietnamese number words.
- [ ] Lexicon files created under `lexicons/` with project overrides taking precedence.
- [ ] Unknown acronym detector halts execution with an explicit log message.

### Text Decoupling & Karaoke Alignment
- [ ] Display text is 100% identical to author script; phonetic aliases appear only in spoken text.
- [ ] Display-to-spoken token map reconciles acronyms (e.g., `GPU` maps to 3 spoken phonetic subunits without displaying spaces).
- [ ] Multilingual alignment produces monotonic, non-negative word and subunit timestamps in `words.json`.
- [ ] Captions conform to 56px font size, max 2 lines, safe areas (L72, R180, T120, B320) at 1080x1920.

### Three Unseen Benchmarks
- [ ] Benchmark A, B, and C generated with all 8 specified artifacts in each output directory.
- [ ] 360x640 mobile preview video rendered for readability QA.

### Validators & Offline Guard
- [ ] `validate-language-spans`, `validate-pronunciation-map`, `validate-token-reconciliation`, `validate-bilingual-alignment`, and `validate-vietnamese-normalization` all exit with code 0 on valid inputs and non-zero on violation test cases.
- [ ] Full pipeline executes cleanly with network interfaces disabled / guarded.

### Real Project Acceptance
- [ ] `connection-film` (Scopus Research Gap explainer) re-rendered with V3.1 Vietnamese narration, bilingual terms preserved, 9:16 vertical 1080x1920, and karaoke captions aligned.

## 2026-09-10T11:05:38Z

# V3.3 — PRODUCTION INTEGRITY HARDENING (FAILURE-FIRST ACCEPTANCE)

Working directory: /home/hongphuoc6104/Desktop/videorenderhoathinh
Integrity mode: development
Requested team: Full multi-agent team across video rendering, audio DSP, Remotion choreography, and adversarial QA

Harden the 1080x1920 Remotion educational video production pipeline for the Scopus explainer film by eliminating every known false-positive acceptance path through failure-first static, acoustic, temporal, and mobile legibility verification gates.

## Reference Context
- Reference review commit: `51b14c2` (`scopus-v3_2-no-music.mp4`)
- Skill specification: `.agents/skills/educational-flat-motion/SKILL.md`
- Target film: `connection-film/src/scopus-explainer/`

## Requirements

### R1. Never Shrink To Fit & Static Typography Validator
- For 1080x1920 production, informational font sizes must strictly obey minimums:
  - Hero text >= 64px
  - Section title >= 48px
  - Card title >= 38px
  - Body text >= 34px
  - Secondary informational text >= 30px
  - Karaoke captions >= 52px
  (Tiny nonessential legal/citation metadata excluded).
- When content cannot fit, split into additional sequential visual beats/scenes instead of shrinking font, omitting content, or summarizing.
- Implement AST/static validator `validators/validate-mobile-typography.ts` recursively inspecting production TSX and failing on informational font sizes below thresholds without filename-specific regex.

### R2. Mobile Legibility Render Gate & QA Rubric
- Dual-render production: generate `1080x1920` final MP4 and `360x640` QA preview MP4.
- Implement automated QA rubric inspecting actual `360x640` frames:
  - Primary visual recognizable
  - Informational text readable without zooming
  - No dense PowerPoint-like card grids
  - One dominant focal idea per frame
  - Karaoke captions do not collide with visual subjects

### R3. One Primary Idea Per Visual Beat (Progressive Disclosure)
- Prohibit displaying dense multi-card information simultaneously when narration focuses on one item.
- Re-choreograph multi-item taxonomies and multi-step procedures into progressive disclosure beats (overview → item 1 full-screen → item 2 → ... → comparison recap).

### R4. Single Authoritative Semantic Timeline
- Create canonical timeline artifact `semantic-timeline.json`.
- Schema per beat: `id`, `narrationTokenRange`, `startSec`, `endSec`, `startFrame`, `endFrame`, `visualIntent`, `primaryObject`, `cameraIntent`, `transitionIntent`, `sfxIntent`, `captionIntent`.
- All visual, timing, audio, and subtitle manifests (`ShotSpec`, Remotion Sequence boundaries, scene internal phases, `CueManifest`, SFX timing, caption groups, transition timing) must derive strictly from `semantic-timeline.json`. Zero hardcoded frame constants.

### R5. Content-Driven Choreography
- When narration expands or reflows, internal scene action timing must dynamically expand/reflow.
- Visual components must derive local beats from `semantic-timeline.json` or receive explicit timing props generated from it. Prohibit hardcoded legacy frame assumptions.

### R6. Scopus Project Visual Retiming (103.20s Parity)
- Re-author existing Scopus explainer scene-local choreography to match the 103.20s narration timeline.
- Align each visual event directly with the narration phrase explaining it (no uniform stretching).

### R7. Strict ShotSpec Production Validation
- `validators/validate-shot-spec.ts` must run against real production `shot-spec.json` and terminate execution on any failure (out-of-bounds impact frames or invalid bounds). No warnings-only mode.

### R8. Explicit Transition Whitelist & Continuity
- Distinguish impact frames from transitions: declare `transition_frames`, `transition_type`, and `expected_visual_discontinuity` in `shot-spec.json`.
- Temporal QA may only whitelist adjacent-frame visual discontinuities where an explicit transition is declared.

### R9. Temporal QA on Rendered MP4
- Decode rendered MP4 to compute adjacent-frame visual differences.
- Flag unmotivated spikes. Ensure scene cuts at boundaries (specifically frames ~618, ~1309, ~1976, ~2531) are repaired, transitioned, and validated.

### R10. Motivated Transitions
- Prohibit naked hard cuts between major scene sequences unless explicitly motivated.
- Implement motivated transitions (object match, camera carry, shape morph, foreground wipe, continuing trajectory, semantic zoom, motivated iris, match cut).

### R11. Audio Asset Ownership & Double SFX Prevention
- Enforce `PREMIXED` audio strategy: master audio contains narration + all mixed SFX; Remotion mounts master audio only.
- Implement `validators/validate-audio-ownership.ts` to detect and fail on dual audio ownership or duplicate playback.

### R12. Authoritative Audio Asset Graph
- Track all audible assets in final MP4 in a directed dependency graph. Detect duplicate SFX, unreferenced music, double mixing, multiple narration masters, or accidental overlapping copies.

### R13. Safe VieNeu TTS Voice Default
- Default voice configuration must use `GENVIDEO_ADAM_PROFILE.synthesis.voice = "Adam"` (VieNeu-TTS). Prohibit default routing to Kokoro (`am_adam`); Kokoro is explicit fallback only.

### R14. Measured Audio Metadata Validation
- Read real WAV headers and ffprobe measurements (`sampleRate`, `channels`, `bitDepth`, `duration`) and write to `audio-manifest.json`. Fail on discrepancies.

### R15. Workspace Portability Gate
- Committed manifests, specs, and configs must contain zero machine-specific absolute paths (`/home/`, `C:\`, `/Users/`).
- Implement `validators/validate-portability.ts` enforcing workspace-relative URIs.

### R16. Audio Policy Hygiene (Zero Production Music)
- Enforce `audioPolicy = "narration-sfx"`. Legacy background music files (e.g. `background_soundtrack.wav`) must not reside in the production audio namespace (move to `fixtures/` or `legacy-assets/`).

### R17. Role-Aware Natural Pause Policy
- Remove rigid `interSentenceMax <= 0.30s`.
- Implement role-aware pause ranges:
  - Within clause: 0.08–0.20s
  - Normal sentence: 0.18–0.40s
  - Semantic turn: 0.25–0.55s
  - Major section transition: 0.40–0.80s
  - Payoff / important realization: 0.30–0.65s
- Update dead-air detection to respect intentional semantic pauses.

### R18. Audio Dynamics QA Gate
- Measure LUFS, dBTP, LRA, speech RMS, pause distribution, and speech rate. Enforce broadcast compliance (-15 LUFS, -1.8 dBTP ceiling) and flag extreme compression for human listening review.

### R19. Educational Flat Motion Skill Overhaul
- Rewrite `.agents/skills/educational-flat-motion/SKILL.md` production defaults:
  - 1080x1920 (9:16), 30fps, mobile-first, Vietnamese-first, content-driven duration (derive duration from content, remove mandatory `targetDuration`).
  - Add hard rules: `NEVER_SHRINK_TO_FIT`, `ONE_PRIMARY_IDEA_PER_BEAT`, `PROGRESSIVE_DISCLOSURE`, `MOBILE_FIRST_READABILITY`, `ONE_AUTHORITATIVE_TIMELINE`, `ONE_AUDIO_OWNER_PER_ASSET`, `FINAL_RENDER_IS_AUTHORITATIVE`, `NO_SELF_CERTIFICATION`.

### R20. Quality Rubric Overhaul
- Mandatory rubric categories: Mobile Readability, Information Density, Audio/Visual Synchronization, Narration Naturalness, Timing Integrity, Production Portability, Source-to-Video Content Coverage, Validator Reliability.
- Acceptance threshold: overall average >= 4.5, no category < 4.0, critical categories individually >= 4.3.

### R21. 100% Source Content Coverage Map
- Create `source-content-map.json` mapping every source concept to >= 1 semantic beat. Coverage must equal 100% without omitting content.

### R22. Adversarial False-Positive Test Suite
- Construct deliberate bad fixtures that validators must reject:
  - 14px body text
  - Invalid out-of-range impact frame
  - Naked scene cut
  - Duplicate SFX ownership
  - Absolute machine path
  - `am_adam` default voice
  - Audio metadata mismatch
  - Scene timing older than ShotSpec
  - Cue/visual mismatch
  - Five dense cards simultaneously
  - Fake content duration that only increases Sequence length
  - Unannotated temporal spike
- Acceptance fails if any bad fixture passes.

### R23. Real Project End-to-End Acceptance
- Rebuild Scopus explainer project under V3.3 integrity gates.
- Deliverables:
  - `final-v3_3.mp4` (1080x1920)
  - `preview-360x640.mp4`
  - `semantic-timeline.json`
  - `source-content-map.json`
  - `shot-spec.json`
  - `audio-manifest.json`
  - `qa-report.json`
- Perform independent inspection at 0%, 10%, ... 100%, all shot boundaries, all transition windows, and all major SFX cues.
- Implementation agents are prohibited from self-certifying final scores.

## Acceptance Criteria

### Automated Static & AST Validators
- [ ] `validators/validate-mobile-typography.ts` exists, passes on production TSX, and rejects typography below minimum thresholds.
- [ ] `validators/validate-portability.ts` exists and confirms zero machine-specific absolute paths.
- [ ] `validators/validate-audio-ownership.ts` exists and enforces PREMIXED single ownership with zero dual playback.
- [ ] `validators/validate-shot-spec.ts` executes and passes on real production `shot-spec.json`.
- [ ] Adversarial test suite runs all R22 bad fixtures and confirms 100% rejection rate.

### Audio & Pipeline Integrity
- [ ] `audio-manifest.json` contains real measured metadata matching ffprobe/WAV headers.
- [ ] Default TTS voice profile is confirmed as `Adam` (VieNeu-TTS) without Kokoro default fallback.
- [ ] Audio master meets -15 LUFS / -1.8 dBTP ceiling under `narration-sfx` policy without background music in production assets.
- [ ] Role-aware pause ranges are applied and verified.

### Video Rendering & Choreography
- [ ] `semantic-timeline.json` is generated as the single source of truth for all shot and cue timings.
- [ ] `source-content-map.json` achieves 100% coverage of source content items.
- [ ] Scopus explainer sequences and visual components are retimed to match the 103.20s narration timeline.
- [ ] Final renders `final-v3_3.mp4` (1080x1920) and `preview-360x640.mp4` are generated.
- [ ] Temporal QA on rendered MP4 confirms zero unwhitelisted discontinuity spikes across all shot boundaries.
- [ ] Mobile legibility rubric passes on 360x640 preview frames without zooming.

### Documentation & Skill
- [ ] `.agents/skills/educational-flat-motion/SKILL.md` is updated with V3.3 production defaults and rules.
- [ ] Independent QA report `qa-report.json` is generated with rubric scores meeting acceptance thresholds.

