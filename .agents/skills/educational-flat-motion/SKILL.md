---
name: educational-flat-motion
description: "Production V3.4 standard specification for creating 1080x1920 (9:16) mobile-first educational flat-vector Remotion explainer videos with Vietnamese-first narration, content-driven duration, 7-stage canonical pipeline, and failure-first independent acceptance gates."
---

# Educational Flat Motion Video Production Skill (V3.4 Production Standard)

## 1. Triết Lý & Nguyên Tắc Cốt Lõi (Philosophy & Principles)

Kỹ năng này cung cấp quy trình chuẩn hóa, độc lập và tự chứa để sản xuất video hoạt hình giáo dục giải thích cơ chế (Educational Explainer) chuẩn phát sóng trên nền tảng **Remotion**, tối ưu hóa cho màn hình di động đứng **9:16 (1080x1920 px)**.

### Đơn Vị Sản Xuất Cơ Bản (Fundamental Unit of Production)
> **Đơn vị cơ bản của video là một khái niệm được người xem thấu suốt thông qua sự chuyển hóa trực quan (Visual Transformation), KHÔNG PHẢI là một bài thuyết trình hay danh sách gạch đầu dòng chữ.**

### 5 Nguyên Tắc Bất Biến:
1. **Visual Progression Over Slide Monoculture**: Cấm tuyệt đối việc tạo các slide hay thẻ bài chứa nhiều chữ (Card Monoculture). Mọi khái niệm phải được diễn hoạt thông qua cơ chế động học (Relational Mechanisms): đồ thị nút/cạnh (nodes & edges), mô hình phân tử, cơ cấu đòn bẩy, phễu hình học, hoặc máy trạng thái.
2. **Core Pedagogical Question First**: Mọi video bắt buộc phải giải quyết một câu hỏi cơ chế trọng tâm duy nhất (The Core Pedagogical Question), đi sâu vào bản chất *tại sao* và *như thế nào*, không dàn trải lý thuyết chung chung.
3. **Audio-Driven Kinetic Rhythm with Smart Punctuation**: Thời lượng video là linh hoạt theo nội dung (`content-driven`), dẫn dắt hoàn toàn bởi âm thanh giọng đọc tiếng Việt tự nhiên (`vi-VN`), bảo toàn dấu câu ngắt giọng tự nhiên (200-400ms PCM silence pause).
4. **Mobile Subtitle Clearance & Creative Layout Flexibility**: 
   - Bố cục màn hình di động 9:16 cần bảo tồn tối đa tính tự do sáng tạo hình ảnh (full-bleed graphs, split comparisons, circular phase cycles, kinetic focal hierarchies) miễn là giải thích đúng bản chất cơ chế.
   - **Tuyệt đối KHÔNG biến bố cục thành một khuôn mẫu 4 tầng bắt buộc hay chia ô cứng nhắc cho mọi cảnh**. Chọn hình thức diễn hoạt vì nó giải thích đúng mối quan hệ, không phải để lấp đầy một khung mẫu cố định.
   - **Ranh giới bất biến duy nhất**: Dành riêng vùng an toàn phụ đề (Subtitle Clearance Safe Zone: $y \in [1420, 1750\text{px}]$) để phụ đề không va chạm/đè lên các chi tiết động học trung tâm; giữ lề đáy an toàn $y > 1750\text{px}$ tránh UI di động.
5. **Fail-Closed Two-Tier Acceptance (NO_SELF_CERTIFICATION)**: Tác nhân lập trình (Tier 1) không bao giờ tự chấm điểm hay tự nghiệm thu cho sản phẩm của mình. Mọi đánh giá phải thông qua bộ cổng kiểm định độc lập (Tier 2 Gates) chạy trên video MP4 và file WAV thật với tiêu chí loại trừ nghiêm ngặt.

---

## 2. Thông Số Kỹ Thuật Chuẩn (Technical Production Standards)

| Thuộc tính | Giá trị chuẩn | Ràng buộc & Ghi chú |
|---|---|---|
| **Tỷ lệ khung hình** | `9:16` (Dọc mobile) | Chuẩn dọc di động TikTok, Shorts, Reels |
| **Độ phân giải Master** | `1080 x 1920 px` | File MP4 bàn giao chất lượng cao |
| **Độ phân giải Preview QA** | `360 x 640 px` | File MP4 kiểm định độ nét mobile và rubric |
| **Tốc độ khung hình** | `30 fps` | Khung hình tính toán tất định theo frame |
| **Ngôn ngữ chính** | `vi-VN` (Tiếng Việt) | Giữ dấu câu tự nhiên, code-switching thuật ngữ chuẩn |
| **Công cụ TTS mặc định** | `VieNeu-TTS` (`GENVIDEO_ADAM_PROFILE`) | Voice: `"Adam"`, 48kHz, -15 LUFS |
| **Thời lượng video** | `content-driven` | Tự động thích ứng theo kịch bản và audio, cấm hardcode |
| **Chính sách âm thanh** | `narration-sfx` | Chỉ có giọng đọc + hiệu ứng âm thanh SFX, cấm nhạc nền phân tán |
| **Chuẩn âm lượng** | `-15.0 LUFS` ($\pm 1.0\text{ LUFS}$) | EBU R128 phát sóng, true peak $\le -1.8\text{ dBTP}$ |
| **Mã hóa phần cứng GPU** | `h264_nvenc` (`-cq 18`) | Bắt buộc NVIDIA NVENC, cấm fallback âm thầm sang CPU |
| **Khung font chữ tối thiểu** | $\text{Floor} \ge 30\text{px}$ | Hero $\ge 64$, Section $\ge 48$, Card Title $\ge 38$, Subtitle $\ge 52\text{px}$ (`NEVER_SHRINK_TO_FIT`) |
| **Chống tràn phụ đề** | Semantic Chunking | **Cấm giảm cỡ chữ để né overflow**. Ngắt câu thành các cụm $\le 10-12$ từ ($\le 2$ dòng) |

---

## 3. Quy Trình Sản Xuất Chuẩn 7 Bước (The Canonical 7-Stage Pipeline)

Quy trình sản xuất được chuẩn hóa thành 7 bước tuần tự, có cổng kiểm soát chất lượng tại từng giai đoạn:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    THE CANONICAL 7-STAGE PIPELINE                           │
├─────────┬───────────────────────────────────────────────────────────────────┤
│ Bước 1  │ PROJECT BRIEF: Mục tiêu sư phạm, phạm vi, đối tượng khán giả      │
│ Bước 2  │ CÂU HỎI TRUNG TÂM: Xác lập cơ chế then chốt & ẩn dụ trực quan     │
│ Bước 3  │ NGUỒN & NARRATION: Lập bản đồ tri thức, kịch bản khoa học có điều │
│         │ kiện, chia cụm câu ngắn chuẩn bị cho TTS và phụ đề                │
│ Bước 4  │ STORYBOARD & ANIMATIC 360p: Hợp đồng trực quan từng beat          │
│         │ (visualExplanationContract), duyệt animatic nháp trước master audio│
│ Bước 5  │ AUDIO & DYNAMIC TIMELINE: Tổng hợp VieNeu TTS, align MMS sạch     │
│         │ không 'a' giả, biên dịch semantic-timeline.json & shot-spec.json  │
│ Bước 6  │ ANIMATION REMOTION TSX: Triển khai 4 tầng safe zone, sử dụng      │
│         │ useBeatChoreography, motion-kit physics, 1 thẻ <Audio> duy nhất   │
│ Bước 7  │ REVIEW & QA GATES: Kiểm định độc lập (AST, Invariants, Temporal   │
│         │ MAD, Parity PSNR >= 35dB, Rubric >= 4.50), cấp qa-report.json     │
└─────────┴───────────────────────────────────────────────────────────────────┘
```

---

### Bước 1: Project Brief (Bản Đề Xuất Dự Án)
Tạo file `project-brief.md` từ template chuẩn (`templates/project-brief.md`):
- **Tên dự án & Mã định danh**: Viết thường, nối bằng dấu gạch ngang (ví dụ: `sodium-potassium-pump`).
- **Mục tiêu sư phạm (Pedagogical Objectives)**: Nêu rõ 2–3 tri thức then chốt người xem sẽ nắm vững sau khi xem.
- **Ranh giới phạm vi (Scope Boundaries)**:
  - `IN_SCOPE_PRIMARY`: Trọng tâm giải thích chi tiết trong video này.
  - `PREREQUISITE`: Khái niệm nền tảng người xem đã biết (chỉ nhắc lại hoặc làm nền).
  - `DEFERRED_TO_SERIES`: Các nhánh chuyên sâu mở rộng hoãn lại cho video tiếp theo.

---

### Bước 2: Xác Lập Câu Hỏi Trung Tâm (The Core Pedagogical Question)
Mọi video phải xoay quanh **một câu hỏi cơ chế duy nhất**:
- **Nguyên tắc**: Câu hỏi phải đòi hỏi một câu trả lời mang tính động học, cơ chế hoặc chuyển hóa hình học.
  - *Đúng*: "Làm thế nào bơm Na⁺/K⁺ đẩy ngược nồng độ ion mà không làm rò rỉ màng tế bào?"
  - *Sai*: "Bơm Na⁺/K⁺ là gì và có cấu tạo như thế nào?" (Dễ biến thành slide liệt kê định nghĩa).
- **Hero Visual Metaphor (Ẩn dụ trực quan chủ đạo)**: Xác định một mô hình hình học trực quan xuyên suốt toàn bộ video (ví dụ: mô hình cửa van lật luân phiên E1/E2, đồ thị vòng kín P-V, hoặc cây phân nhánh DAG).

---

### Bước 3: Khai Thác Nguồn & Soạn Kịch Bản Narration Khoa Học
1. **Lập bản đồ nguồn (`source-content-map.json`)**: Đảm bảo 100% các ý cốt lõi được ánh xạ vào các beat.
2. **Authoritative Factual Claims (`factual-claims.json`)**:
   - Mọi tuyên bố kỹ thuật hoặc sinh học phải liên kết với bằng chứng và nêu rõ **điều kiện biên** (boundary conditions).
   - **Quy tắc ngôn ngữ thận trọng**: Tuyệt đối tránh các khẳng định tuyệt đối hoá gây sai lệch khoa học (như *"bất hoạt hoàn toàn"*, *"không bao giờ mất"*, *"không tì vết"*). Thay bằng ngôn ngữ chính xác: *"thường tạo ra các đột biến indel nhỏ làm mất chức năng"*, *"kích hoạt cơ chế sửa chữa tương đồng theo thiết kế"*, *"toàn vẹn về mặt logic và nén vi phân vật lý bên dưới"*.
3. **Soạn kịch bản phân đoạn ngắn**:
   - Viết từng câu ngắn ($\le 18$ từ mỗi vế).
   - Bảo toàn dấu câu (chấm, phẩy, hai chấm) để hệ thống TTS ngắt nhịp thở tự nhiên.

---

### Bước 4: Storyboard & Hợp Đồng Trực Quan (Animatic 360p)
1. **visualExplanationContract trên từng Beat**:
   Mỗi beat trong kịch bản phải cam kết rõ ràng 3 yếu tố hình học:
   ```json
   "visualExplanationContract": {
     "spatialRelationship": "left_to_right_ion_transfer",
     "transformationType": "conformational_e1_to_e2_morph",
     "coreMechanism": "atp_phosphorylation_drives_gate_inversion"
   }
   ```
2. **Animatic 360p Draft Review**:
   - Xuất contact sheet (3 frame: Start, Mid, End cho mỗi beat) hoặc render animatic nháp 360x640 với scratch audio/cues.
   - Thẩm định trực quan: Nếu che hết lời dẫn thì người xem có hiểu được chuyển động của cơ chế không? Nếu chỉ thấy các hộp chữ xuất hiện, lập tức từ chối và yêu cầu vẽ lại cơ cấu động học!

---

### Bước 5: Audio DSP & Biên Dịch Timeline Tự Động
1. **Tổng Hợp Giọng Đọc VieNeu-TTS**:
   - Chạy script chuẩn:
     ```bash
     /home/hongphuoc6104/video3d/.genvideo/voice/vieneu/.venv/bin/python3 scripts/generate-vieneu-narration.py \
       --batch projects/<project-name>/audio/batch.json \
       --output projects/<project-name>/audio/master_audio.wav
     ```
   - Đảm bảo chất lượng: 48000 Hz, stereo, EBU R128 loudness $-15.0 \pm 1.0\text{ LUFS}$, true peak $\le -1.8\text{ dBTP}$.
2. **Căn Chỉnh Âm Vị MMS Không Sinh Ký Tự Giả**:
   - Chạy script aligner:
     ```bash
     .venv/bin/python scripts/align-multilingual.py \
       --audio projects/<project-name>/audio/master_audio.wav \
       --text projects/<project-name>/audio/timing.json \
       --output projects/<project-name>/subtitles/alignment.json
     ```
   - Đảm bảo dấu câu được lọc sạch khỏi acoustic targets CTC và map lại phụ đề hiển thị mà không tạo ký tự `'a'` giả.
3. **Biên Dịch Timeline & Phụ Đề Chunking Ngắn**:
   - Tự động biên dịch `semantic-timeline.json` và `shot-spec.json` thích ứng linh hoạt theo độ dài audio đo được.
   - Phân đoạn phụ đề (`captions.json`): Mỗi câu ngắt thành các cụm 1–2 dòng ($\le 18$ từ, $\le 75$ ký tự), định vị an toàn tại $x: 80, y: 1470, \text{width}: 920, \text{height}: 170$.

---

### Bước 6: Animation Remotion TSX (Áp Dụng Safe Zone & Physics)
1. **Cấu Trúc Tệp Dự Án**:
   ```
   connection-film/src/projects/<project-name>/
   ├── project-brief.md
   ├── source-content-map.json
   ├── factual-claims.json
   ├── semantic-timeline.json
   ├── shot-spec.json
   ├── audio/
   │   ├── batch.json
   │   ├── timing.json
   │   └── master_audio.wav
   ├── subtitles/
   │   └── captions.json
   ├── scenes/
   │   ├── Scene1Introduction.tsx
   │   ├── Scene2MechanismCore.tsx
   │   └── Scene3Synthesis.tsx
   ├── components/
   │   └── MolecularRig.tsx
   └── <ProjectName>Film.tsx
   ```
2. **Sử dụng hook `useBeatChoreography`**:
   - Không dùng frame tuyệt đối (`if (frame > 120)`). Dẫn xuất trạng thái từ `shotBeats`:
     ```tsx
     const { currentBeat, intraBeatProgress, phase } = useBeatChoreography(shotBeats);
     ```
3. **Quản lý không gian & Vùng an toàn phụ đề**:
   - Cho phép tác giả tự do tạo hình trực quan (full-bleed, split screen, radial phase diagram, hierarchical tree, etc.) để phục vụ trực tiếp việc giải thích bản chất cơ chế. **Không ép buộc chia 4 tầng cứng nhắc**.
   - Bắt buộc chừa vùng an toàn phụ đề (Subtitle Clearance Safe Zone): $y \in [1420, 1750\text{px}]$, bảo đảm không có vật thể chuyển động chính đè lên phụ đề karaoke.
   - Bắt buộc chừa lề đáy: $y > 1750\text{px}$ để tránh thanh điều hướng và giao diện mobile.
4. **Single Root Audio**:
   - Gắn âm thanh duy nhất tại `<ProjectName>Film.tsx`:
     ```tsx
     <Audio src={staticFile('projects/<name>/audio/master_audio.wav')} volume={1.0} />
     ```
   - Cấm hoàn toàn mọi thẻ `<Audio>` thứ cấp trong scene.

---

## 4. Lưu Trữ Dữ Liệu Hồi Quy & Cô Lập Legacy (Legacy Regression Baselines)
- Các video và pipeline cũ (`scopus-explainer`, `crispr`, `steam-engine`, `git-dag`) được lưu trữ tại `connection-film/src/legacy/` làm baseline đối chứng hồi quy.
- Chúng mang các khuyết tật lịch sử đã biết (ví dụ: Scopus card monoculture, một số câu audio cũ mang khẳng định tuyệt đối chưa tái tạo) và được dùng duy nhất để kiểm tra không làm gãy nền tảng dùng chung (`packages/*`, `motion-kit`, `validators/*`).
- Chúng được ngắt hoàn toàn khỏi entrypoint sản xuất mới (`npm run gate`). Lệnh chạy hồi quy riêng biệt: `npm run test:legacy`.

---

### Bước 7: Independent Review & Quality Gates (Tier 2 Acceptance)
Chạy cổng kiểm định chính thức cho dự án:
```bash
npm run gate -- --project=projects/<project-name>
```

#### 5 Cổng Thẩm Định Nghiêm Ngặt:
1. **Static AST Gate**:
   - Typography Mobile Floor: $\text{Font} \times \text{Scale} \ge 30\text{px}$.
   - Portability: 0 đường dẫn tuyệt đối (`/home/`, `C:\`, `/Users/`).
   - Single Audio Ownership: Đúng 1 thẻ `<Audio>` ở root composition.
   - Anti-Card Monoculture: Từ chối các thẻ bài chữ tĩnh, yêu cầu cơ chế quan hệ động học.
2. **Explanatory Invariants Gate**:
   - Kiểm tra tính đúng đắn toán học, topo và hình học của cơ chế (ví dụ: các biến thiên liên tục, không nhảy bước, không biến dạng thanh nối).
3. **Acoustic Compliance Gate**:
   - Master WAV: 48kHz, 2 kênh stereo, 16-bit PCM, loudness $-15.0 \pm 1.0\text{ LUFS}$, true peak $\le -1.8\text{ dBTP}$.
4. **Temporal QA Gate (Rawvideo MAD)**:
   - Giải mã luồng rawvideo FFmpeg, tính vi phân MAD giữa các frame liền kề.
   - Bắt lỗi mọi cú giật khung hình bất thường ($> 4.0\times$ local median MAD) nếu không nằm trong danh sách whitelisted impact frames hoặc beat transitions.
5. **Mobile Preview Parity & Rubric Gate**:
   - Master 1080p và Preview 360p khớp thời lượng tuyệt đối ($\Delta T < 0.033\text{s}$), $\text{PSNR} \ge 35.0\text{ dB}$.
   - Chấm điểm Rubric 18 tiêu chí trên frame giải mã thật: Overall $\ge 4.50/5.00$, Floor $\ge 4.00$, Caption Collision Clearance $\ge 4.30$.
   - Ký và xuất bản `qa-report.json`.

---

## 4. Danh Mục Lệnh Chuẩn (Standard CLI Commands)

```bash
# 1. Kiểm tra mã nguồn tĩnh & AST
npm run lint
npm run typecheck

# 2. Render video tăng tốc GPU NVIDIA NVENC (1080x1920)
npm run render:gpu -- --project=projects/<project-name>

# 3. Tạo preview 360x640 bằng FFmpeg Lanczos
npm run preview -- --project=projects/<project-name>

# 4. Chạy toàn bộ cổng kiểm định độc lập cho dự án
npm run gate -- --project=projects/<project-name>

# 5. Chạy bộ kiểm tra hồi quy trên các video legacy (CRISPR, Steam, Git, Scopus)
npm run test:legacy
```

---

## 5. Hướng Dẫn Dành Cho Clean-Room Agent

Khi một agent độc lập nhận một đề tài mới:
1. **Chỉ tham chiếu duy nhất tài liệu này (`SKILL.md`)** và các template trong thư mục `templates/`.
2. **Tuyệt đối không tham chiếu mã nguồn của các video legacy** (`connection-film/src/legacy/`) để tránh sao chép các thói quen cũ hoặc hardcode frame.
3. **Bám sát quy trình 7 bước**: Tạo `project-brief.md` $\to$ Xác định `Core Question` $\to$ Soạn `Narration` $\to$ Duyệt `Animatic 360p` $\to$ Tạo `Audio & Timeline` $\to$ Code `Remotion TSX` $\to$ Chạy `npm run gate`.
4. Nếu gặp bất kỳ điểm nào chưa rõ ràng hoặc lệnh bị lỗi, ghi lại chính xác vào `friction-log.md` để hoàn thiện kỹ năng.
