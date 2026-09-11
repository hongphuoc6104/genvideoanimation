---
name: educational-flat-motion
description: "Production V3.4 standard specification for creating 1080x1920 (9:16) mobile-first educational flat-vector Remotion explainer videos with Vietnamese-first narration, content-driven duration, smart self-protecting geometric primitives (AutoClippingConnector, AutoPill, OpaqueCard, SafeStageZone, RadialLabelGroup), 7-stage canonical pipeline, and failure-first independent acceptance gates."
---

# Educational Flat Motion Video Production Skill (V3.4 Production Standard)

## 1. Triết Lý & Nguyên Tắc Cốt Lõi (Philosophy & Principles)

Kỹ năng này cung cấp quy trình chuẩn hóa, độc lập và tự chứa để sản xuất video hoạt hình giáo dục giải thích cơ chế (Educational Explainer) chuẩn phát sóng trên nền tảng **Remotion**, tối ưu hóa cho màn hình di động đứng **9:16 (1080x1920 px)**.

### Đơn Vị Sản Xuất Cơ Bản (Fundamental Unit of Production)
> **Đơn vị cơ bản của video là một khái niệm được người xem thấu suốt thông qua sự chuyển hóa trực quan (Visual Transformation), KHÔNG PHẢI là một bài thuyết trình hay danh sách gạch đầu dòng chữ.**

### 6 Nguyên Tắc Bất Biến:
1. **Visual Progression Over Slide Monoculture**: Cấm tuyệt đối việc tạo các slide hay thẻ bài chứa nhiều chữ (Card Monoculture). Mọi khái niệm phải được diễn hoạt thông qua cơ chế động học (Relational Mechanisms): đồ thị nút/cạnh (nodes & edges), mô hình phân tử, cơ cấu đòn bẩy, phễu hình học, hoặc máy trạng thái.
   - **Quy tắc Tam Giác Động Học (The Kinetic Triad)**:
     * *Danh từ (Subject)* $\to$ Chuyển thành Thực thể trực quan (Visual Entity: SVG shape, icon, hạt particle, màng, ống dẫn, khối).
     * *Động từ/Tác động (Action)* $\to$ Chuyển thành Phép biến đổi không gian (Spatial Transformation: dời chỗ `translate`, co giãn `scale`, biến hình `morph`, đổi màu `fill`, hoặc cắt/mở `mask`).
     * *Lời thoại (Narration)* $\to$ Gánh toàn bộ phần diễn giải chi tiết bằng âm thanh giọng đọc. Canvas KHÔNG nhắc lại lời dẫn dưới dạng đoạn văn chữ.
   - **Bài Test Câm & Che Chữ (The Mute-and-Blank Rule)**: Mọi scene phải vượt qua bài test: *Nếu tắt âm thanh và che sạch toàn bộ chữ trên canvas, sự chuyển động của các hình khối và vector vẫn phải truyền tải được bản chất cơ chế*. Nếu che chữ đi mà người xem chỉ thấy các hộp chữ nhật đứng yên $\to$ ĐÓ LÀ SLIDE BÀI GIẢNG TRÁ HÌNH.
   - **Chính sách Văn bản Duy nhất trên Màn hình (Two Text Categories Only)**:
     * *Nhóm 1: Nhãn định danh neo cơ học (Kinetic Anchor Labels)*: Chỉ gồm tên danh pháp, ký hiệu ngắn ($\le 3$ từ) hoặc công thức toán/hóa học, dòng lệnh code gắn trực tiếp vào vật thể chuyển động. Cấm tuyệt đối các đoạn văn xuôi mô tả giải thích.
     * *Nhóm 2: Phụ đề Karaoke*: Nằm gọn sát đáy màn hình ($y \in [1470, 1680\text{px}]$), không chiếm dụng diện tích trung tâm.
2. **Self-Protecting Content-Driven Geometry & Zero Collision**: Mọi layout đồ họa phải được xây dựng từ các **Smart Geometric Primitives** tự bảo vệ (`AutoPill`, `AutoClippingConnector`, `OpaqueCard`, `SafeStageZone`, `RadialLabelGroup`). Cấm tuyệt đối việc đoán mò hay hardcode tọa độ thủ công, cấm để chữ tràn viền hộp, cấm để vector đâm xuyên chữ, và cấm để nhãn đè nhau.
3. **Clean State Lifecycle & Zero Ghosting**: Khi chuyển đổi giữa các trạng thái diễn hoạt, các phần tử của trạng thái trước bắt buộc phải unmount có điều kiện hoặc exit transition sạch sẽ. Nghiêm cấm vẽ đè hai chuỗi text lên cùng một vị trí hoặc để lại bóng ma mờ đục bên dưới phần tử đang hoạt động.
4. **Core Pedagogical Question First**: Mọi video bắt buộc phải giải quyết một câu hỏi cơ chế trọng tâm duy nhất (The Core Pedagogical Question), đi sâu vào bản chất *tại sao* và *như thế nào*, không dàn trải lý thuyết chung chung.
5. **Audio-Driven Kinetic Rhythm with Smart Punctuation**: Thời lượng video là linh hoạt theo nội dung (`content-driven`), dẫn dắt hoàn toàn bởi âm thanh giọng đọc tiếng Việt tự nhiên (`vi-VN`), bảo toàn dấu câu ngắt giọng tự nhiên (250-400ms PCM silence pause).
6. **Fail-Closed Two-Tier Acceptance (NO_SELF_CERTIFICATION)**: Tác nhân lập trình (Tier 1) không bao giờ tự chấm điểm hay tự nghiệm thu cho sản phẩm của mình. Mọi đánh giá phải thông qua bộ cổng kiểm định độc lập (Tier 2 Gates) chạy trên video MP4 và file WAV thật với tiêu chí loại trừ nghiêm ngặt.

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
| **Vùng an toàn sân khấu (Zone 2)** | $[36, 1044] \times [180, 1420]\text{px}$ | Bắt buộc bao bọc bởi `<SafeStageZone>`, cách lề ngang $36\text{px}$ |
| **Khoảng đệm an toàn phụ đề** | $\ge 50\text{px}$ buffer | Toàn bộ đồ họa phải dừng tại $y \le 1420\text{px}$ trước phụ đề $y=1470\text{px}$ |
| **Lề an toàn hộp chữ (Padding)** | Ngang & Dọc $\ge 30\text{px}$ | Mặc định $34\text{px}$, $W_{min} \ge 140\text{px}$, bắt buộc dùng `AutoPill` |
| **Độ đục nền thẻ (Base Shield)** | $100\%$ (`opacity: 1.0`, `#0F172A`) | Bắt buộc dùng `OpaqueCard`, chống bẫy kế thừa CSS |
| **Đường nối & Tia quan hệ** | $100\%$ `AutoClippingConnector` | Cắt tia tại mép ngoài bounding box, cấm đâm vào tâm node/chữ |
| **Bố cục cực (Radial Layout)** | Bán kính so le ($R_{odd} \neq R_{even}$) | Bắt buộc khi $\Delta\theta < 45^\circ$, dùng `RadialLabelGroup` |
| **Vòng đời chuyển trạng thái** | Clean Mount/Unmount | Gỡ bỏ hoàn toàn phần tử cũ, cấm render 2 text cùng tọa độ |
| **Khung font chữ tối thiểu** | $\text{Floor} \ge 30\text{px}$ | Hero $\ge 64$, Section $\ge 48$, Card Title $\ge 38$, Subtitle $\ge 52\text{px}$ (`NEVER_SHRINK_TO_FIT`) |
| **Chống tràn phụ đề** | Semantic Chunking | **Cấm giảm cỡ chữ để né overflow**. Ngắt câu thành các cụm $\le 10-12$ từ ($\le 2$ dòng) |

---

## 3. Quy Trình Sản Xuất Chuẩn 7 Bước (The Canonical 7-Stage Pipeline)

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
│ Bước 6  │ ANIMATION REMOTION TSX: Triển khai với Smart Geometric Primitives │
│         │ (AutoClippingConnector, AutoPill, OpaqueCard, SafeStageZone,      │
│         │ RadialLabelGroup), useBeatChoreography, 1 thẻ <Audio> duy nhất    │
│ Bước 7  │ REVIEW & QA GATES: Kiểm định độc lập 5 Geometric Invariants, AST, │
│         │ Headless DOM G04D, Temporal MAD, Parity PSNR >= 35dB, cấp QA      │
└─────────┴───────────────────────────────────────────────────────────────────┘
```

---

### Bước 1: Project Brief (Bản Đề Xuất Dự Án)
Tạo file `project-brief.md` từ template chuẩn (`templates/project-brief.md`):
- **Tên dự án & Mã định danh**: Viết thường, nối bằng dấu gạch ngang (ví dụ: `sodium-potassium-pump`, `raft-consensus`).
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
  - *Đúng*: "Làm thế nào các node trong cụm phân tán đồng thuận một thủ lĩnh duy nhất dù mạng bị phân rã?"
  - *Sai*: "Giao thức Raft là gì và có cấu tạo như thế nào?" (Dễ biến thành slide liệt kê định nghĩa).
- **Hero Visual Metaphor (Ẩn dụ trực quan chủ đạo)**: Xác định một mô hình hình học trực quan xuyên suốt toàn bộ video (ví dụ: mô hình cửa van lật luân phiên E1/E2, đồ thị vòng kín P-V, hoặc cây phân nhánh DAG).

---

### Bước 3: Khai Thác Nguồn & Soạn Kịch Bản Narration Khoa Học
1. **Lập bản đồ nguồn (`source-content-map.json`)**: Đảm bảo 100% các ý cốt lõi được ánh xạ vào các beat.
2. **Authoritative Factual Claims (`factual-claims.json`)**:
   - Mọi tuyên bố kỹ thuật hoặc khoa học phải liên kết với bằng chứng và nêu rõ **điều kiện biên** (boundary conditions).
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
   - Phân đoạn phụ đề (`captions.json`): Mỗi câu ngắt thành các cụm 1–2 dòng ($\le 18$ từ, $\le 75$ ký tự), định vị an toàn tại $y \in [1470, 1680\text{px}]$, font $\ge 52\text{px}$.

---

### Bước 6: Animation Remotion TSX (Áp Dụng Smart Primitives & Physics)

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
   │   └── MechanismRig.tsx
   └── <ProjectName>Film.tsx
   ```

2. **Sử dụng hook `useBeatChoreography`**:
   - Không dùng frame tuyệt đối (`if (frame > 120)`). Dẫn xuất trạng thái từ `shotBeats`:
     ```tsx
     const { currentBeat, intraBeatProgress, phase } = useBeatChoreography(shotBeats);
     ```

3. **Bắt Buộc Sử Dụng 5 Smart Geometric Primitives (`motion-kit`)**:
   - **`AutoClippingConnector`**: **BẮT BUỘC** cho 100% connector lines, paths, rays, mũi tên và đồ thị quan hệ. Cấm tuyệt đối nối tọa độ thủ công từ tâm tới tâm ($cx, cy \to cx, cy$) đâm xuyên qua hộp chữ hoặc node. Thuật toán tự động tính giao điểm tia với mép ngoài bounding box của thẻ nguồn và đích (`solveTwoBoxIntersection`).
   - **`AutoPill` & Dynamic Text Metrics (`computePillDimensions` / `estimateTextWidth`)**: **BẮT BUỘC** cho 100% các thẻ nhãn, badge, hoặc khung chữ. Cấm hardcode chiều rộng cố định (`width={280}`) làm tràn chữ hoặc thiếu hụt lề. Bắt buộc duy trì padding ngang và dọc $\ge 30\text{px}$ (mặc định 34px) và $W_{min} \ge 140\text{px}$.
   - **`OpaqueCard`**: **BẮT BUỘC** cho 100% các thẻ, hộp thoại, bảng điều khiển hoặc khiên che chắn. Thực thi nghiêm ngặt kiến trúc 2 lớp phân ly: Lớp 1 (Base Shield) luôn giữ độ đục 100% (`opacity: 1.0`, `#0F172A`) để chống triệt để **bẫy kế thừa CSS (CSS Opacity Inheritance Trap)**; Lớp 2 (Content Layer) nhận hiệu ứng salience làm mờ ($[0.20, 0.30]$ + desaturation) hoặc active ($1.05\times$ scale + glow).
   - **`SafeStageZone`**: **BẮT BUỘC** bao bọc toàn bộ khu vực diễn hoạt trong Stage Zone 2 ($y \in [180, 1420]\text{px}$, $x \in [36, 1044]\text{px}$), đảm bảo khoảng đệm an toàn $\ge 50\text{px}$ trước trần phụ đề Karaoke tại $y = 1470\text{px}$.
   - **`RadialLabelGroup`**: **BẮT BUỘC** cho các bố cục cực, chu trình pha tròn, phễu phân kỳ hoặc sơ đồ hình sao. Tự động áp dụng **Bán kính So le (Staggered Radii: $R_{odd} \neq R_{even}$)** khi góc lệch giữa hai nhãn liền kề $\Delta\theta < 45^\circ$, tự động lật chiều chữ (flip alignment khi $90^\circ < \theta < 270^\circ$) để chữ không bị lộn ngược, và clamp tọa độ ngang trong $[36, 1044]\text{px}$.
   - **Clean Mount/Unmount (Zero Ghosting)**: Khi chuyển đổi trạng thái (ví dụ từ Initial $\to$ Active $\to$ Complete), các phần tử của trạng thái trước **bắt buộc phải unmount sạch sẽ** (`{isState && <Element />}`) hoặc exit transition hoàn toàn. Nghiêm cấm render 2 chuỗi text cùng một tọa độ hoặc để lại các phần tử mờ đục $0.15 - 0.25$ dưới nền.

4. **Single Root Audio**:
   - Gắn âm thanh duy nhất tại `<ProjectName>Film.tsx`:
     ```tsx
     <Audio src={staticFile('projects/<name>/audio/master_audio.wav')} volume={1.0} />
     ```
   - Cấm hoàn toàn mọi thẻ `<Audio>` thứ cấp trong scene.

---

### Bước 7: Independent Review & Quality Gates (Tier 2 Acceptance)

Trước khi bàn giao, Tier 1 Motion Agent phải tự kiểm tra và đạt **100% 5 Geometric Invariants Checklist** (Mục 7). Sau đó, pipeline chạy cổng kiểm định chính thức:
```bash
npm run gate -- --project=projects/<project-name>
```

#### 6 Cổng Thẩm Định Nghiêm Ngặt (Layer 2 Acceptance Standard):
1. **Static AST Gate**:
   - Typography Mobile Floor: $\text{Font} \times \text{Scale} \ge 30\text{px}$.
   - Portability: 0 đường dẫn tuyệt đối (`/home/`, `C:\`, `/Users/`).
   - Single Audio Ownership: Đúng 1 thẻ `<Audio>` ở root composition.
   - Anti-Card Monoculture: Từ chối các thẻ bài chữ tĩnh, yêu cầu cơ chế quan hệ động học.
2. **Headless DOM Runtime Geometry Gate (Layer 2 Gate G04D - Zero AST Bypass)**:
   - Khởi chạy Chromium Headless thực tế qua CDP, tua đến từng keyframe thật (Start, Mid, End của mọi beat) và thu thập `getBoundingClientRect()` / `getBBox()` thực tế.
   - Chặn đứng 100% các vi phạm (Fail-Closed với Exit Code 1):
     * **INV-GEO-01 Text Collision**: $AABB_1 \cap AABB_2 \neq \emptyset$.
     * **INV-GEO-02 Container Padding Deficit / Overflow**: Padding ngang hoặc dọc $< 30\text{px}$, hoặc text tràn ngoài khung.
     * **INV-GEO-03 Unshielded Vector Pierce**: Đường nối/tia đâm xuyên lòng text/card không có Opaque Shield che chắn.
     * **INV-GEO-04 Subtitle Intrusion**: Đồ họa vượt quá $y = 1420\text{px}$ (khoảng đệm an toàn $< 50\text{px}$ trước phụ đề $y=1470$).
     * **INV-GEO-05 Viewport Overflow**: Phần tử nằm ngoài lề an toàn $[36, 1044]\text{px}$.
3. **Explanatory Invariants Gate**:
   - Kiểm tra tính đúng đắn toán học, topo và hình học của cơ chế (biến thiên liên tục, bảo toàn chiều dài thanh cứng, v.v.).
4. **Acoustic Compliance Gate**:
   - Master WAV: 48kHz, 2 kênh stereo, 16-bit PCM, loudness $-15.0 \pm 1.0\text{ LUFS}$, true peak $\le -1.8\text{ dBTP}$.
5. **Temporal QA Gate (Rawvideo MAD)**:
   - Giải mã luồng rawvideo FFmpeg, tính vi phân MAD giữa các frame liền kề. Bắt lỗi mọi cú giật khung hình bất thường ($> 4.0\times$ local median MAD) không khai báo.
6. **Mobile Preview Parity & Rubric Gate**:
   - Master 1080p và Preview 360p khớp thời lượng tuyệt đối ($\Delta T < 0.033\text{s}$), $\text{PSNR} \ge 35.0\text{ dB}$.
   - Rubric 18 tiêu chí trên frame giải mã thật: Overall $\ge 4.50/5.00$, Floor $\ge 4.00$, Caption Collision Clearance $\ge 4.30$.
   - Ký và xuất bản `qa-report.json`.

---

## 4. Lưu Trữ Dữ Liệu Hồi Quy & Cô Lập Legacy (Legacy Regression Baselines)

- Các video và pipeline cũ (`scopus-explainer`, `crispr`, `steam-engine`, `git-dag`) được lưu trữ tại `connection-film/src/legacy/` làm baseline đối chứng hồi quy.
- Chúng mang các khuyết tật lịch sử đã biết và được dùng duy nhất để kiểm tra không làm gãy nền tảng dùng chung (`packages/*`, `motion-kit`, `validators/*`).
- Lệnh chạy hồi quy riêng biệt: `npm run test:legacy`.

---

## 5. Danh Mục Lệnh Chuẩn (Standard CLI Commands)

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

# 5. Chạy bộ kiểm tra hồi quy trên các video legacy
npm run test:legacy
```

---

## 6. Luật Bất Biến Không Gian, Smart Primitives & Tiêu Điểm Thị Giác

Nhằm đảm bảo video đạt chuẩn chất lượng giáo dục cao cấp trên màn hình dọc 9:16 (1080x1920), mọi composition và component phải tuân thủ nghiêm ngặt các đặc tả hình học thông minh sau:

### 6.1. Stage 4-Zone Partitioning & SafeStageZone Architecture

Màn hình 1080x1920 được phân bổ nghiêm ngặt thành 4 tầng không gian dọc (Trục Y):

| Vùng | Dải tọa độ Y | Mục đích sử dụng | Quy tắc an toàn & Ràng buộc |
|---|---|---|---|
| **Zone 1: Top Micro-HUD** | $y \in [80, 180\text{px}]$ | Chapter dots vi mô, tiến trình bài giảng, tiêu đề phân đoạn | Font $\ge 30\text{px}$, không chiếm dụng không gian diễn hoạt |
| **Zone 2: Primary Relational Stage** | $y \in [180, 1420\text{px}]$ | Cơ chế hình học, đồ thị liên kết, thực thể trực quan | Bắt buộc nằm trong `<SafeStageZone>`, lề ngang $[36, 1044\text{px}]$ |
| **Zone 3: Subtitle Safe Zone** | $y \in [1470, 1680\text{px}]$ | Phụ đề Karaoke chữ to, rõ ràng | Cấm tuyệt đối vật thể stage xâm phạm ($y \le 1420\text{px}$, đệm $\ge 50\text{px}$) |
| **Zone 4: Bottom OS Gesture Margin** | $y \in [1680, 1920\text{px}]$ | Vùng đệm tránh thanh vuốt điều hướng Home của iOS/Android | Trống hoàn toàn |

#### Sử Dụng Component `<SafeStageZone>`:
`<SafeStageZone>` là component container bao bọc toàn bộ Zone 2, cung cấp tọa độ chuẩn và các helper qua Context:
```tsx
import React from 'react';
import { SafeStageZone, useSafeStage } from 'motion-kit';

export const MyStage: React.FC = () => {
  return (
    <SafeStageZone
      minX={36}
      maxX={1044}
      minY={180}
      maxY={1420}
      subtitleZoneY={1470}
      showDebugBounds={false} // Bật true khi debug layout
      as="svg" // 'svg' hoặc 'html'
    >
      {({ bounds, mapPoint, clampBox, checkClearance }) => {
        // mapPoint(u, v): Chuẩn hóa tọa độ [0, 1] sang pixel sân khấu
        const center = mapPoint(0.5, 0.5); // (540, 800)
        
        // checkClearance(bottomY): Kiểm tra an toàn trước phụ đề
        const clearance = checkClearance(1200); // isSafe: true, bufferPx: 270
        
        return (
          <g>
            {/* Nội dung cơ chế an toàn 100% trong bounds */}
          </g>
        );
      }}
    </SafeStageZone>
  );
};
```

---

### 6.2. AutoPill & Dynamic Text Metrics (Content-Driven Auto-Sizing)

#### Căn Nguyên Lỗi Tràn Viền Trong SVG:
Trong HTML DOM, các phần tử có CSS Box Model tự co giãn linh hoạt theo nội dung văn bản (`display: inline-block`, `padding: 12px 24px`). Ngược lại, trong SVG, thẻ `<rect>` và `<text>` hoàn toàn độc lập về mặt tọa độ. Nếu tác giả hardcode `<rect width={280}>` bao quanh chuỗi text tiếng Việt có độ dài 302px, chữ sẽ đâm xuyên viền hộp (Container Overflow) hoặc viền sát rạt chữ (Padding Deficit), bị Headless DOM Gate từ chối ngay lập tức.

#### Giải Thuật Đo Độ Rộng Văn Bản UTF-8 Tiếng Việt:
Hàm `estimateTextWidth` và `computePillDimensions` trong `motion-kit` ước tính chính xác độ rộng ký tự theo chuẩn Unicode NFC:
$$W_{\text{text}} = \text{ceil}\left( \sum c_i \cdot \text{multiplier}_{\text{bold}} \right)$$
- Chữ hoa Unicode (`\p{Lu}`): $0.74 \times \text{fontSize}$
- Chữ thường Unicode (`\p{Ll}`): $0.54 \times \text{fontSize}$
- Chữ rộng (`W`, `M`): $0.88 \times \text{fontSize}$; (`w`, `m`): $0.80 \times \text{fontSize}$
- Chữ số (`0-9`): $0.60 \times \text{fontSize}$
- Dấu câu và khoảng trắng: $0.32 \times \text{fontSize}$
- Ký tự thông thường: $0.62 \times \text{fontSize}$
- Bold multiplier: $1.08\times$ khi `fontWeight >= 700`

#### Công Thức Bất Biến Của AutoPill:
$$W_{\text{box}} = \max\left(W_{\text{min}}, \min\left(W_{\text{max}}, W_{\text{text}} + 2 \times \text{paddingHorizontal}\right)\right)$$
- **Quy chuẩn bắt buộc**:
  * $\text{paddingHorizontal} \ge 30\text{px}$ (mặc định $34\text{px}$).
  * $W_{\text{min}} \ge 140\text{px}$.
  * Nền đục vững chắc (`fill="#0F172A"`).
  * Gắn thuộc tính DOM `data-autopill="true"` và `data-badge="true"`.

#### Ví Dụ Triển Khai `<AutoPill>`:
```tsx
import React from 'react';
import { AutoPill } from 'motion-kit';

export const MyBadgeGroup: React.FC = () => {
  return (
    <g>
      {/* AutoPill tự động tính toán width = 346px cho text "BẢN THẢO SCOPUS" */}
      <AutoPill
        x={540}
        y={600}
        text="BẢN THẢO SCOPUS"
        fontSize={32}
        fontWeight={800}
        color="#FFFFFF"
        fill="#0F172A"
        stroke="#38BDF8"
        strokeWidth={3}
        rx={18}
        paddingHorizontal={34} // Đảm bảo padding >= 30px
        minWidth={160}
        height={64}
        anchor="center" // 'center' hoặc 'top-left'
      />
    </g>
  );
};
```

---

### 6.3. AutoClippingConnector & Ray-AABB Boundary Clipping Math

#### Căn Nguyên Lỗi Vector Đâm Xuyên Chữ:
Khi nối hai nút trong đồ thị, việc dùng thẳng tọa độ tâm ($cx_1, cy_1 \to cx_2, cy_2$) khiến đoạn thẳng vẽ xuyên qua nửa lòng node nguồn và nửa lòng node đích. Nếu node chứa text, nét vẽ vector sẽ đè ngang qua mặt chữ, tạo nên sự cẩu thả thị giác nghiêm trọng.

#### Giải Thuật Ray-AABB Boundary Intersection Solver:
`AutoClippingConnector` giải phương trình giao điểm tia (Ray) với biên ngoài của hộp hình chữ nhật, hình chữ nhật bo góc (RoundedRect) hoặc hình elip/tròn:
1. Xác định tia nối từ tâm $C_1(x_1, y_1)$ đến tâm $C_2(x_2, y_2)$ với góc $\theta = \text{atan2}(dy, dx)$.
2. Tìm điểm giao $P_{\text{start}}$ trên mép ngoài của Box 1 theo hướng $\theta$, lùi thêm một khoảng hở `startGap` (mặc định 4px).
3. Tìm điểm giao $P_{\text{end}}$ trên mép ngoài của Box 2 theo hướng $\theta + 180^\circ$, lùi thêm một khoảng hở `endGap` (mặc định 4px).
4. Đường nối chỉ được vẽ trong đoạn $P_{\text{start}} \to P_{\text{end}}$. Hoàn toàn không có pixel nào đi vào lòng hộp chữ!

#### Hỗ Trợ 3 Chế Độ Định Tuyến (Connector Routing):
- **`straight`**: Đường thẳng trực tiếp giữa 2 mép ngoài.
- **`curved`**: Đường cong Bezier bậc 2 (Quadratic Bezier) với điểm điều khiển vuông góc, kiểm soát bởi `curvature` (dương cong sang phải, âm cong sang trái).
- **`orthogonal`**: Đường gấp khúc vuông góc Manhattan có bo góc fillet mượt mà (`rf = 16px`).

#### Prop Aliases Linh Hoạt:
- Hộp nguồn: `from`, `source`, hoặc `sourceBox` (`BoxDescriptor`).
- Hộp đích: `to`, `target`, hoặc `targetBox` (`BoxDescriptor`).
- Màu sắc: `color` hoặc `stroke`.
- Nét đứt: `dashArray` hoặc `strokeDasharray`.
- Khoảng hở mép: `clearanceMargin`, `startGap`, `endGap`.

#### Ví Dụ Triển Khai `<AutoClippingConnector>`:
```tsx
import React from 'react';
import { AutoClippingConnector, BoxDescriptor } from 'motion-kit';

export const FlowDiagram: React.FC = () => {
  const nodeA: BoxDescriptor = {
    x: 200,
    y: 400,
    width: 240,
    height: 70,
    shape: 'rounded-rect',
    cornerRadius: 16,
  };

  const nodeB: BoxDescriptor = {
    cx: 540,
    cy: 700,
    width: 280,
    height: 80,
    shape: 'rounded-rect',
    cornerRadius: 18,
  };

  return (
    <g>
      {/* Đường nối cong tự động cắt tại mép ngoài, không đâm xuyên lòng node */}
      <AutoClippingConnector
        from={nodeA}
        to={nodeB}
        routing="curved"
        curvature={0.2}
        stroke="#38BDF8"
        strokeWidth={3}
        arrowhead="end"
        arrowheadSize={12}
        label="DỮ LIỆU ĐỒNG THUẬN"
        labelOffset={24}
        startGap={6}
        endGap={6}
      />
    </g>
  );
};
```

---

### 6.4. OpaqueCard & 2-Layer Decoupled Architecture (The CSS Opacity Trap Solution)

#### Vạch Trần Bẫy Kế Thừa CSS (The CSS Opacity Inheritance Trap):
Khi muốn làm mờ một thẻ không active (inactive state), các lập trình viên thường mắc sai lầm nghiêm trọng: gán trực tiếp `opacity: 0.25` lên container thẻ chứa nền:
```tsx
// ❌ SAI LẦM TAI HẠI: Bẫy kế thừa biến nền thành kính trong suốt!
<g opacity={0.25}>
  <rect fill="#0F172A" width={300} height={100} /> {/* Biến thành kính trong suốt 25%! */}
  <text>Nội dung mờ</text>
</g>
```
Theo chuẩn rendering CSS/SVG, khi container cha nhận `opacity: 0.25`, **mọi phần tử con đều trở nên trong suốt 75%**, bao gồm cả hình chữ nhật màu xanh đậm `#0F172A`. Kết quả: nền thẻ biến thành **tấm kính trong suốt**, làm lộ toàn bộ đường lưới, vector nối và các hình vẽ phức tạp chạy bên dưới!

#### Kiến Trúc 2 Lớp Phân Ly Của `<OpaqueCard>`:
`<OpaqueCard>` giải quyết triệt để lỗi này bằng cách phân ly vật lý 2 lớp:
1. **Lớp 1 (Base Shield - Tấm Khiên Đục)**: `<rect>` hoặc `<div>` nền luôn luôn duy trì độ đục **$100\%$ tuyệt đối (`opacity: 1.0`, `#0F172A`)**. Tấm khiên này là một bức tường vật lý không thể xuyên thủng, che chắn hoàn toàn mọi vector hay chi tiết đồ họa phía sau.
2. **Lớp 2 (Foreground Content - Lớp Nội Dung Biểu Cảm)**: Một container độc lập chứa text, icon và số liệu. Khi thẻ inactive, **chỉ duy nhất lớp nội dung này** nhận hiệu ứng giảm opacity xuống $[0.20, 0.30]$ và bộ lọc giảm bão hòa `grayscale(0.75)`. Khi active, lớp nội dung đạt opacity 1.0, thẻ phóng to $1.05\times$ và viền phát sáng rực rỡ (`drop-shadow` / `boxShadow`).

#### Hỗ Trợ Cả SVG và HTML:
- `as="svg"` (mặc định): Render `<g>`, `<rect fill="#0F172A" opacity={1.0}>`, và `<g opacity={contentOpacity}>`.
- `as="html"`: Render `div.opaque-card-root`, `div.opaque-card-base-shield (opacity: 1.0)`, và `div.opaque-card-content-layer`.

#### Ví Dụ Triển Khai `<OpaqueCard>`:
```tsx
import React from 'react';
import { OpaqueCard } from 'motion-kit';

export const CardList: React.FC<{ activeIndex: number }> = ({ activeIndex }) => {
  const cards = ['LÝ THUYẾT', 'THỰC NGHIỆM', 'BỐI CẢNH'];

  return (
    <g>
      {cards.map((title, idx) => (
        <OpaqueCard
          key={title}
          x={140}
          y={400 + idx * 140}
          width={800}
          height={110}
          rx={20}
          isActive={idx === activeIndex}
          isDimmed={idx !== activeIndex}
          inactiveOpacity={0.25} // Chỉ áp dụng lên text/icon, nền vẫn đục 100%!
          activeScale={1.05}
          baseColor="#0F172A"
          activeBorderColor="#38BDF8"
        >
          {({ isActive, opacity, filter }) => (
            <g style={{ filter }}>
              <text
                x={180}
                y={465 + idx * 140}
                fill={isActive ? '#38BDF8' : '#94A3B8'}
                fontSize={36}
                fontWeight={800}
              >
                {title}
              </text>
            </g>
          )}
        </OpaqueCard>
      ))}
    </g>
  );
};
```

---

### 6.5. RadialLabelGroup & Staggered Radii Polar Layout

#### Sai Lầm Hình Học Trong Bố Cục Cực (The Polar Geometry Trap):
Khi bố trí các nhãn xung quanh một điểm trung tâm (như 5 lăng kính phân kỳ, 5 trạng thái vòng đời), các nhãn thường có góc phân kỳ hẹp ($\Delta\theta = 25^\circ - 35^\circ$). Nếu đặt tất cả các nhãn trên cùng một bán kính $R = 270\text{px}$, khoảng cách dây cung giữa hai nhãn liền kề chỉ là:
$$D = 2 R \sin\left(\frac{\Delta\theta}{2}\right) = 2 \times 270 \times \sin(12.5^\circ) \approx 116\text{px}$$
Trong khi mỗi nhãn có bề rộng $280\text{px}$, khoảng cách $116\text{px} < 280\text{px}$ dẫn đến **va chạm hình học và đè chữ không thể tránh khỏi**!

#### Giải Pháp Bán Kính So Le (Staggered Radii):
Bất cứ khi nào góc lệch $\Delta\theta < 45^\circ$, bắt buộc phải dùng bán kính so le:
- Phần tử chẵn: $R_{\text{even}} = R_{\text{base}} = 270\text{px}$
- Phần tử lẻ: $R_{\text{odd}} = R_{\text{base}} + \Delta R = 370\text{px}$ (với $\Delta R \ge 80 - 100\text{px}$)
Nhờ so le bán kính, không gian hiển thị của hai nhãn liền kề được tách rời hoàn toàn theo phương xuyên tâm, triệt tiêu 100% va chạm!

#### Cơ Chế Lật Chiều Chữ (Tangential Flip Alignment):
Khi xoay nhãn theo phương tiếp tuyến, các nhãn ở nửa vòng tròn bên trái (góc $90^\circ < \theta < 270^\circ$) sẽ bị lộn ngược đầu xuống đất nếu không lật chiều. `RadialLabelGroup` tự động cộng thêm $180^\circ$ vào góc xoay để bảo đảm người xem luôn đọc được chữ xuôi chiều.

#### Ví Dụ Triển Khai `<RadialLabelGroup>`:
```tsx
import React from 'react';
import { RadialLabelGroup, RadialItemData } from 'motion-kit';

export const PolarPrismCycle: React.FC<{ activeIndex: number }> = ({ activeIndex }) => {
  const prisms: RadialItemData[] = [
    { id: 1, label: 'LÝ THUYẾT', angleDeg: -90, color: '#38BDF8' },
    { id: 2, label: 'THỰC NGHIỆM', angleDeg: -55, color: '#10B981' }, // dTheta = 35 < 45 deg!
    { id: 3, label: 'BỐI CẢNH', angleDeg: -20, color: '#F59E0B' },
    { id: 4, label: 'PHƯƠNG PHÁP', angleDeg: 15, color: '#EC4899' },
    { id: 5, label: 'ỨNG DỤNG', angleDeg: 50, color: '#8B5CF6' },
  ];

  return (
    <RadialLabelGroup
      centerX={540}
      centerY={780}
      radius={270}
      staggerRadii={[260, 370]} // R_even = 260px, R_odd = 370px (So le chống va chạm)
      items={prisms}
      activeItemIndex={activeIndex}
      layoutMode="horizontal-pill" // hoặc 'tangential-rotated'
      useOpaqueShield={true} // Bọc tự động trong OpaqueCard 100% đục
      showRays={true}
      rayColor="#334155"
      rayWidth={2}
    />
  );
};
```

---

### 6.6. Clean Mount/Unmount Lifecycle & Zero Ghosting Invariant

#### Quy Tắc Loại Bỏ Bóng Ma (The Zero Ghosting Invariant):
Khi một phân cảnh chuyển trạng thái diễn hoạt (ví dụ: từ trạng thái Khủng hoảng sang Thành tựu, hoặc từ Vực thẳm sang Cây cầu hoàn chỉnh):
1. **Unmount Sạch Sẽ (Strict Conditional Unmounting)**:
   Phần tử của trạng thái cũ phải được gỡ bỏ hoàn toàn khỏi DOM cây SVG:
   ```tsx
   {/* ✅ ĐÚNG: Unmount sạch sẽ khi chuyển trạng thái */}
   {phase === 0 && <CrisisAbyss />}
   {phase === 1 && <SolutionBridge />}
   ```
2. **Cấm Vẽ Đè Hai Text Lên Cùng Tọa Độ**:
   Nghiêm cấm tuyệt đối việc render đồng thời hai thẻ `<text>` hoặc hai `<AutoPill>` tại cùng một vị trí với `opacity` chồng lên nhau (như vẽ chữ `"PASS"` đè lên chữ `"SCOPUS"`).
3. **Cấm Giữ Lại Inactive Elements Ở Opacity Nhạt Dưới Nền**:
   Không để lại các khối đồ họa của beat trước ở mức `opacity: 0.15 - 0.25` tại cùng một vùng không gian với beat mới nếu không có lý do sư phạm so sánh rõ ràng. Nếu cần so sánh, phải sắp xếp vào các vùng không gian tách biệt không giao nhau ($AABB_1 \cap AABB_2 = \emptyset$).

---

### 6.7. Cơ Chế Tiêu Điểm Kép (Dual Visual Focus & Salience Standard)

Khi màn hình trình bày danh sách $\ge 2$ mục, bắt buộc chọn một trong hai cơ chế:

| Tiêu chí | Chế độ 1: Spotlight & Dim | Chế độ 2: Progressive Unveil (Solo Focus) |
|---|---|---|
| **Mục đích** | Giữ vững bản đồ tư duy (Mental Map) toàn cảnh của hệ thống (DAG, SEM Causal, Network). | Đi sâu từng bước giải thích chi tiết, tránh quá tải chữ màn hình dọc. |
| **Phần tử Active** | Phóng to $1.05\times$, tăng sáng, viền phát sáng `#38BDF8`, opacity 1.0. | Render đầy đủ tiêu đề, nhãn, icon và chi tiết giải thích. |
| **Phần tử Inactive** | Opacity $[0.20, 0.30]$, giảm bão hòa `grayscale(0.75)`, **nền vẫn đục 100%** qua `OpaqueCard`. | Chỉ hiển thị chấm micro-pin `#idx` hoặc ẩn hoàn toàn khỏi màn hình. |

---

### 6.8. Subtitle Token Alignment & Crisp Anti-Blur Typography

1. **Vùng An Toàn Phụ Đề**: Nằm trong $y \in [1470, 1680\text{px}]$. Font chữ $\ge 52\text{px}$, tối đa 2 dòng, mỗi cụm $\le 10-12$ từ.
2. **Neo Khung Chặt (Zero-Hang)**: Chuyển giao giữa các nhóm phụ đề tức thì ($\Delta t \le 66\text{ms}$ / 2 frames), loại bỏ triệt để hiện tượng treo 2 từ cuối của câu trước sang câu sau.
3. **Anti-Blur Single-Layer Highlighting**:
   - Từ đang đọc chuyển trực tiếp sang màu tương phản cao (High-contrast Sky Blue `#38BDF8` hoặc Bright Amber `#FCD34D`), `textShadow: 'none'`, độ tương phản WCAG AA $\ge 7:1$.
   - **Cấm xẻ đôi chữ bằng `clipPath`** vì sub-pixel anti-aliasing làm nhòe lem các dấu thanh tiếng Việt (`?`, `~`, `.`, `'`).

---

## 7. Bộ Danh Sách Kiểm Tra 5 Bất Biến Hình Học Bắt Buộc (The 5 Geometric Invariants Checklist)

Trước khi Tier 1 Motion Agent nộp báo cáo bàn giao (Handoff Report), agent **BẮT BUỘC** phải tự rà soát và xác nhận đạt $100\%$ cả 5 bất biến hình học sau:

### INV-GEO-01: Text Collision Free (Không Va Chạm Chữ)
- **Công thức**: $AABB_1 \cap AABB_2 = \emptyset$ đối với mọi cặp phần tử văn bản hiển thị đồng thời.
- **Ràng buộc**: Không có hai chuỗi text nào đè lên nhau dù chỉ $1\text{px}$. Khoảng cách an toàn tối thiểu giữa các khối chữ khuyến nghị $\ge 30\text{px}$.
- **Công cụ kiểm định**: Headless DOM Gate G04D đo đạc `getBoundingClientRect()` trên toàn bộ các frame giải mã thật.
- **Giải pháp**: Phân chia không gian trục Y, dùng `AutoPill`, hoặc áp dụng Progressive Unveil / Clean Unmount.

### INV-GEO-02: Container Padding Clearance (Đảm Bảo Lề Hộp Chữ)
- **Công thức**: $\text{paddingHorizontal} \ge 30\text{px}$ VÀ $\text{paddingVertical} \ge 30\text{px}$ bên trong mọi thẻ, badge, card có viền/nền.
- **Ràng buộc**: $x_{\text{text}} - x_{\text{box}} \ge 30\text{px}$, $(x_{\text{box}} + W_{\text{box}}) - (x_{\text{text}} + W_{\text{text}}) \ge 30\text{px}$, và tương tự cho trục Y. $W_{\text{min}} \ge 140\text{px}$.
- **Công cụ kiểm định**: G04D đo khoảng cách từ viền ngoài text đến viền ngoài container.
- **Giải pháp**: **Bắt buộc dùng `AutoPill`** với `paddingHorizontal={34}` hoặc tính toán kích thước hộp qua `computePillDimensions`. Cấm hardcode `width={...}`.

### INV-GEO-03: Zero Vector Penetration (Triệt Tiêu Đâm Xuyên Vector)
- **Công thức**: $AABB_{\text{connector}} \cap AABB_{\text{text\_inner}} = \emptyset$.
- **Ràng buộc**: Nét vẽ của đường nối, mũi tên, tia quan hệ chỉ được phép xuất hiện ở khoảng không gian bên ngoài các hộp chữ. Cấm tuyệt đối đâm vào tâm node hay cắt ngang qua các dòng chữ.
- **Công cụ kiểm định**: G04D rời rạc hóa `<path>` và `<line>` với bước $\Delta s \le 15\text{px}$, phát hiện mọi điểm đâm xuyên lòng thẻ không có shield.
- **Giải pháp**: **Bắt buộc dùng `AutoClippingConnector`** để cắt tia chính xác tại mép ngoài bounding box của thẻ. Khi có giao cắt bắt buộc, phải bọc phần tử bằng `OpaqueCard` 100% đục.

### INV-GEO-04: Subtitle Safe Zone Clearance (Bảo Vệ Trần An Toàn Phụ Đề)
- **Công thức**: $y_{\text{bottom}} = y + h \le 1420\text{px}$ cho toàn bộ phần tử visual của bài giảng.
- **Ràng buộc**: Khoảng đệm an toàn trước trần phụ đề ($y = 1470\text{px}$) phải đạt $\Delta y = 1470 - y_{\text{bottom}} \ge 50\text{px}$.
- **Công cụ kiểm định**: G04D kiểm tra tọa độ cực đại dưới của mọi phần tử stage (ngoại trừ subtitle karaoke).
- **Giải pháp**: Bao bọc toàn bộ cảnh trong `<SafeStageZone maxY={1420} subtitleZoneY={1470}>`. Nâng cụm đồ họa lên cao hoặc thu nhỏ tỷ lệ nếu bài giảng có nhiều tầng dọc.

### INV-GEO-05: Viewport Bounds & Staggered Radii (Lề Màn Hình & So Le Bán Kính)
- **Công thức**: $x \ge 36\text{px}$ VÀ $x + w \le 1044\text{px}$ (lề an toàn màn hình $36\text{px}$). Trong bố cục cực/nan quạt: $R_{\text{odd}} \neq R_{\text{even}}$ ($\Delta R \ge 80\text{px}$) khi $\Delta\theta < 45^\circ$.
- **Ràng buộc**: Không có chi tiết nào bị cắt cụt ở 2 mép màn hình. Các nhãn nan quạt không được nằm cùng bán kính ở các góc hẹp.
- **Công cụ kiểm định**: G04D kiểm tra giới hạn viewport và đo đạc khoảng cách giữa các node cực.
- **Giải pháp**: Sử dụng `RadialLabelGroup` với `staggerRadii={[260, 370]}` và clamp tọa độ ngang qua `SafeStageZone`.

---

### Bảng Tự Đánh Giá Của Tier 1 Agent Trước Handoff (Self-Audit Matrix)

| Mã Bất Biến | Tên Bất Biến | Điều Kiện Đạt Chuẩn | Lỗi Kích Hoạt Đánh Trượt | Hành Động Sửa Chữa Bắt Buộc |
|---|---|---|---|---|
| **INV-GEO-01** | Text Collision Free | $AABB_1 \cap AABB_2 = \emptyset$ | 2 chuỗi text đè nhau $\ge 1\text{px}$ | Dùng `AutoPill`, dịch chuyển trục Y hoặc unmount sạch phần tử cũ |
| **INV-GEO-02** | Container Padding Clearance | Pad ngang & dọc $\ge 30\text{px}$, $W \ge 140\text{px}$ | Chữ sát mép hộp ($< 30\text{px}$) hoặc tràn hộp | Dùng `AutoPill` hoặc `computePillDimensions`, cấm hardcode `<rect width>` |
| **INV-GEO-03** | Zero Vector Penetration | Vector dừng ở mép ngoài bounding box | Đoạn thẳng/tia đâm vào lòng chữ | Dùng `AutoClippingConnector`, bọc thẻ trong `OpaqueCard` |
| **INV-GEO-04** | Subtitle Safe Zone Clearance | $y + h \le 1420\text{px}$, đệm $\ge 50\text{px}$ | Đồ họa stage vượt quá $y = 1420\text{px}$ | Bao bọc bởi `<SafeStageZone>`, nâng trục Y của cơ chế lên trên $1420\text{px}$ |
| **INV-GEO-05** | Viewport & Staggered Radii | $x \in [36, 1044]\text{px}$, $R_{odd} \neq R_{even}$ | Tràn lề màn hình hoặc đè chữ nan quạt | Dùng `RadialLabelGroup` với bán kính so le, clamp lề an toàn $36\text{px}$ |

---

## 8. Hướng Dẫn Dành Cho Clean-Room Agent

Khi một agent độc lập nhận một đề tài mới:
1. **Chỉ tham chiếu duy nhất tài liệu này (`SKILL.md`)** và các template trong thư mục `templates/`.
2. **Tuyệt đối không tham chiếu mã nguồn của các video legacy** (`connection-film/src/legacy/`) để tránh sao chép các thói quen cũ hoặc hardcode frame.
3. **Bắt buộc nhập và sử dụng 5 Smart Geometric Primitives từ `motion-kit`**:
   ```tsx
   import {
     AutoClippingConnector,
     AutoPill,
     OpaqueCard,
     SafeStageZone,
     RadialLabelGroup,
     computePillDimensions,
     estimateTextWidth,
     useSafeStage,
   } from 'motion-kit';
   ```
4. **Bám sát quy trình 7 bước**: Tạo `project-brief.md` $\to$ Xác định `Core Question` $\to$ Soạn `Narration` $\to$ Duyệt `Animatic 360p` $\to$ Tạo `Audio & Timeline` $\to$ Code `Remotion TSX` với Smart Primitives $\to$ Tự kiểm tra 5 Geometric Invariants $\to$ Chạy `npm run gate`.
5. Nếu gặp bất kỳ điểm nào chưa rõ ràng hoặc lệnh bị lỗi, ghi lại chính xác vào `friction-log.md` để hoàn thiện kỹ năng.
