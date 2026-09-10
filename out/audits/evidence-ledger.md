# Sổ Bằng Chứng Nghiệm Thu (Evidence Ledger) — Remotion V3.3+

> **Quy tắc nghiệm thu bất biến (NO_SELF_CERTIFICATION)**:
> Không một vấn đề nào được đánh dấu là hoàn thành nếu chỉ có mã nguồn hoặc kết quả `PASS` từ test helper. Mỗi mục phải có bằng chứng video/frame thực tế trích xuất từ MP4, chứng minh không còn lỗi gốc và không tạo regression (lỗi mới).
>
> **Quy ước trạng thái**:
> - `[CHƯA_XÁC_MINH]`: Chưa có thử nghiệm hoặc bằng chứng cụ thể.
> - `[SỬA_CODE]`: Đã sửa logic trong mã nguồn/test helper, nhưng chưa có video/clip đầu ra chứng minh tác động thực tế.
> - `[SỬA_MỘT_PHẦN]`: Đã tác động lên đầu ra nhưng còn khiếm khuyết phụ (ví dụ: phụ đề chưa ngắt dòng tốt, nhãn còn đè nhẹ).
> - `[ĐÃ_KIỂM_CHỨNG_ĐẦU_RA]`: Đã có video/frame thực tế chứng minh hết lỗi gốc, vượt qua gate độc lập và không tạo lỗi mới.

---

## Bảng Tổng Hợp Tiến Độ 15 Vấn Đề

| STT | Vấn đề | Phạm vi & Vị trí chính | Trạng thái hiện tại | Điều kiện đóng lỗi |
|:---:|:---|:---|:---:|:---|
| **01** | Mất dấu câu trước TTS | `languageAwareTokenizer.ts:149`, `align-multilingual.py:91` | `[SỬA_CODE]` | Re-run TTS/Audio pipeline: file WAV phát âm đúng dấu ngắt giọng, kịch bản giữ nguyên dấu câu. |
| **02** | Dấu câu bị aligner biến thành âm `"a"` | `align-multilingual.py:148-155` | `[SỬA_CODE]` | Acoustic target chỉ chứa phoneme thực phát âm; dấu câu map lại display; log aligner không chứa ký tự 'a' giả. |
| **03** | DNA cắt nhưng backbone vẫn nối liền | `DnaDoubleHelix.tsx:222-245`, CRISPR frame 72s | `[SỬA_CODE]` | Frame thực tế tại thời điểm cắt (frame 2160 / 72s) hiển thị 2 đường path SVG đứt rời hoàn toàn với khoảng cách $\ge 65\text{px}$. |
| **04** | NHEJ không đóng khoảng hở | `RepairMechanism.tsx:29`, CRISPR frame 80s | `[SỬA_CODE]` | Frame thực tế tại progress=1.0 thể hiện 2 đầu DNA khít kín (`gapWidth === 0`), mối sẹo hàn gắn hoàn chỉnh không còn khoảng trống. |
| **05** | Chấm P–V đi sai đường | `PVDiagram.tsx:42-153`, Steam frame 48s | `[SỬA_CODE]` | Điểm tracer trên frame thực tế bám sát đường cong chu trình nạp - giãn nở - xả - nén (sai số $\le 2\text{px}$). |
| **06** | Thanh nối thay đổi chiều dài | `ParallelMotionLinkage.tsx:35`, Steam frame 70s | `[SỬA_CODE]` | Chiều dài thanh C-D trên frame thực tế đo được chính xác $90.00\text{px}$ xuyên suốt toàn bộ hành trình quay. |
| **07** | Hardcode timing & gán sai ý nghĩa beat | `Scene3DualCleavage.tsx:23-38`, `Scene3ThermodynamicCycle.tsx:20-36` | `[SỬA_CODE]` | Khớp 1:1 ngữ nghĩa beat: Beat 7 (R-loop), Beat 8 (miền cắt hội tụ), Beat 9 (vết cắt kép DSB). Tự động co giãn theo timeline. |
| **08** | Phụ đề dài, tràn, chồng hình & đè nhãn | `caption-kit/KaraokeGroup.tsx`, `KaraokeLine.tsx`, safe zones | `[CHƯA_XÁC_MINH]` | Phụ đề chia thành các cụm ngắn 1–2 dòng, nằm gọn trong safe zone $y \in [1420, 1780]$, không tràn đáy và cách xa nhãn $\ge 40\text{px}$. |
| **09** | Khẳng định khoa học/kỹ thuật quá tuyệt đối | `timing.json` CRISPR line 10-11, Git line 02, 16 | `[SỬA_CODE]` | Kịch bản spoken audio và text đã chỉnh sửa: NHEJ có điều kiện/indel, HDR phụ thuộc hiệu suất, Git phân biệt logical vs physical packfile. |
| **10** | Gate kiểm đầy đủ cả bốn video | `run-v3_3-gate.ts:80-175`, `temporal-render-qa.ts`, parity, rubric | `[CHƯA_XÁC_MINH]` | G07b (contact sheet), G14 (temporal MAD), G15 (parity PSNR), G16 (rubric) chạy và đạt PASS trên cả 4 video thật. |
| **11** | Lỗ hổng validator cho PASS sai | `validate-visual-semantics.ts`, `validate-preview-rubric.ts` | `[SỬA_MỘT_PHẦN]` | Tất cả phản ví dụ (thư mục trống, hình tĩnh nhận 100% motion, card monoculture) đều fail-closed thoát exit code 1. |
| **12** | Animatic được duyệt trước TTS/render | Quy trình sản xuất Director → Animatic 360p → Master | `[CHƯA_XÁC_MINH]` | Có contact sheet/animatic 360p với scratch audio được trích xuất và duyệt trước khi khóa Master WAV và render 1080p. |
| **13** | Skill, rubric, template thống nhất | `SKILL.md:85`, `AGENTS.md`, template compositions | `[SỬA_CODE]` | Loại bỏ mọi tàn dư của rule "detailed body text"; thống nhất cấu trúc 1 root `<Audio>`, 1 timeline schema, 1 caption kit. |
| **14** | Video thoát khỏi kiểu slide nhiều chữ | Cấu trúc dàn cảnh: Title → Hero Diagram → Dynamic Label | `[SỬA_CODE]` | Cảnh duy trì đối tượng liên tục, chuyển động động học giải thích cơ chế, không còn khối văn bản dạng thẻ bài thuyết trình. |
| **15** | Tái tạo khi đổi narration/chủ đề | Pipeline tái tạo end-to-end từ text → WAV → timeline → render | `[CHƯA_XÁC_MINH]` | Thử nghiệm thay đổi câu narration thực tế trên CRISPR, chạy tái tạo và render MP4 thành công mà không sửa code TSX thủ công. |

---

## Chi Tiết Từng Vấn Đề

### Vấn đề 01: Mất dấu câu trước TTS
- **Lỗi gốc & Vị trí**: Normalizer trước đây loại bỏ toàn bộ dấu chấm, dấu phẩy khi tạo spoken text (`packages/narration-kit/src/normalization/languageAwareTokenizer.ts:149`).
- **Cách tái hiện**: Gọi hàm tokenize với chuỗi `"Đúng, nhưng vì sao?"` -> trả về `"Đúng nhưng vì sao"`.
- **Thay đổi đã thực hiện**: Bảo toàn dấu câu trong `spokenText` và mảng token.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Re-run TTS/Audio pipeline với câu sửa mới, nghe file WAV và kiểm tra waveform chứng minh có quãng ngắt nhịp tự nhiên tại dấu phẩy/chấm.

---

### Vấn đề 02: Dấu câu bị aligner biến thành âm `"a"`
- **Lỗi gốc & Vị trí**: `scripts/align-multilingual.py:148-155` khi gặp token không phải chữ thì thay chuỗi rỗng bằng `'a'`, dẫn đến mô hình acoustic CTC căn chỉnh âm vị ảo.
- **Cách tái hiện**: Chạy aligner với transcript có dấu phẩy -> log alignment xuất hiện token `'a'` với timestamp riêng.
- **Thay đổi đã thực hiện**: Lọc bỏ punctuation khỏi acoustic targets, chỉ căn chỉnh từ phát âm thực tế rồi map lại dấu câu cho display.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Chạy aligner trên audio CRISPR tái tạo, xuất log alignment xác minh 0 ký tự `'a'` giả và phụ đề hiển thị đúng vị trí dấu câu.

---

### Vấn đề 03: DNA cắt nhưng backbone vẫn nối liền (CRISPR F01)
- **Lỗi gốc & Vị trí**: `connection-film/src/generalization/crispr/components/DnaDoubleHelix.tsx:222-245` dùng một đường `path` liên tục `M` ... `Q` qua điểm cắt thay vì 2 đường riêng biệt.
- **Cách tái hiện**: Trích xuất frame tại $t = 72\text{s}$ (frame 2160) của `out/crispr-cas9-1080p.mp4`, phóng to trục liên kết thấy đường kẻ vẫn nối liền.
- **Thay đổi đã thực hiện**: Hàm `calculateDnaPointsAndPaths` tính toán 2 đường path SVG độc lập với khoảng cách mở rộng khi cắt.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Trích xuất frame 2160 từ video MP4 mới render lại, đo đạc khoảng cách giữa hai đầu cắt $\ge 65\text{px}$, backbone tách rời hoàn toàn.

---

### Vấn đề 04: NHEJ không đóng khoảng hở (CRISPR F02)
- **Lỗi gốc & Vị trí**: `connection-film/src/generalization/crispr/components/RepairMechanism.tsx:29` khi `progress = 1.0`, `gapWidth = 0` nhưng tọa độ hai đầu vẫn giữ $[-120, +120]$, để lại khoảng hở lớn $75\text{px}$.
- **Cách tái hiện**: Render frame $t = 80\text{s}$ (frame 2400), quan sát thấy vết sẹo ở giữa nhưng hai bên vẫn hở mạch.
- **Thay đổi đã thực hiện**: Hàm `calculateRepairState` di chuyển các phân đoạn DNA sát lại nhau khi `progress \to 1.0`, tại $1.0$ thì `gapWidth = 0` và hai đầu chạm khít vào mối sẹo.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Frame trích xuất tại frame 2430 từ MP4 thực tế chứng minh hai đầu mạch DNA chạm khít hoàn toàn vào mối sẹo (`gapWidth === 0`).

---

### Vấn đề 05: Chấm P–V đi sai đường (Steam Engine F03)
- **Lỗi gốc & Vị trí**: `connection-film/src/generalization/steam-engine/components/PVDiagram.tsx:42-153` tính tọa độ tracer bằng công thức độc lập với đường cong outline SVG, dẫn đến sai lệch $100\text{px}$ đi xuyên vào lòng diện tích.
- **Cách tái hiện**: Render frame $t = 48\text{s}$ (frame 1440) tại progress 0.9, tracer nằm ở $(275, 220)$ trong khi đường đáy ở $y = 320$.
- **Thay đổi đã thực hiện**: Hàm `calculatePVPoint` nội suy chính xác dọc theo 4 pha của chu trình P-V khép kín.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Frame trích xuất tại các mốc progress $0.25, 0.5, 0.75, 0.9$ chứng minh chấm tracer luôn nằm chính xác trên viền chu trình (sai số $\le 2\text{px}$).

---

### Vấn đề 06: Thanh nối thay đổi chiều dài (Steam Engine F04)
- **Lỗi gốc & Vị trí**: `connection-film/src/generalization/steam-engine/components/ParallelMotionLinkage.tsx:35` cố định hoành độ $X$ của piston, khiến thanh liên kết C-D bị co giãn từ $90\text{px}$ đến $95.2\text{px}$ khi đòn bẩy lắc $14^\circ$.
- **Cách tái hiện**: Tính toán khoảng cách $\sqrt{(x_D - x_C)^2 + (y_D - y_C)^2}$ trong animation góc quay $14^\circ$.
- **Thay đổi đã thực hiện**: Hàm `solveWattLinkage` giải hệ phương trình hình học bảo toàn khoảng cách cố định $90.00\text{px}$ ($\Delta L = 0.000\text{px}$).
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Frame trích xuất tại góc cực đại $+14^\circ$ và $-14^\circ$ chứng minh thanh giữ đúng tỷ lệ và chuyển động thẳng đứng xấp xỉ của điểm liên kết.

---

### Vấn đề 07: Hardcode timing & gán sai ý nghĩa beat (CRISPR & Steam F05)
- **Lỗi gốc & Vị trí**:
  - CRISPR `Scene3DualCleavage.tsx`: Gán Beat 7 (R-loop) thành "kích hoạt catalytic domains" và Beat 8 thành "cắt DNA", làm vết cắt xuất hiện trước khi lời đọc tới.
  - Steam `Scene3ThermodynamicCycle.tsx`: Cắt cảnh sớm tại 56s sang cơ cấu thanh nối trong khi lời còn nói về bình ngưng và chân không.
- **Cách tái hiện**: Khớp timestamp audio với hình ảnh tại 56s của Steam và 58s của CRISPR.
- **Thay đổi đã thực hiện**: Viết lại mapping của `useBeatChoreography`: Beat 7 = R-loop, Beat 8 = Catalytic Domains, Beat 9 = Cleavage Cut.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Video clip MP4 render lại chứng minh đúng $t = 50.56\text{s}$ bắt đầu tạo R-loop, đúng $t = 58.42\text{s}$ hai miền nuclease xuất hiện, và đúng $t = 67.66\text{s}$ vết cắt đôi mới diễn ra.

---

### Vấn đề 08: Phụ đề dài, tràn, chồng hình & đè nhãn (F06)
- **Lỗi gốc & Vị trí**:
  - `caption-kit`: Phụ đề dài 158 ký tự font 56px bị wrap thành 3-4 dòng, chiều cao container vượt $220\text{px}$, tràn xuống mép đáy màn hình ($y > 1750$).
  - Nhãn trạng thái ở $y = 1200$ hoặc $1330$ trong một số cảnh đè lên thành phần đồ họa phía trên.
- **Cách tái hiện**: Xem frame 48s của CRISPR và 48s của Steam Engine: phụ đề chiếm mảng lớn che khuất không gian hoặc sát mép đáy.
- **Thay đổi cần thực hiện**:
  1. Phân tách câu kịch bản thành các caption chunk ngắn hơn (tối đa 2 dòng, mỗi dòng $\le 38$ ký tự).
  2. Bố trí layout phân tầng an toàn: Canvas đồ họa $y \in [280, 1300]$, Status Badge $y \in [1320, 1400]$, Karaoke Subtitle $y \in [1420, 1750]$, lề đáy $y > 1750$ thông thoáng.
- **Trạng thái hiện tại**: `[CHƯA_XÁC_MINH]`.
- **Điều kiện đóng lỗi**: Trích xuất contact sheet toàn bộ video đại diện CRISPR, đo đạc tọa độ bounding box của phụ đề và nhãn: 0 pixel nào chạm vào nhau, 0 dòng nào vượt quá $y = 1760$.

---

### Vấn đề 09: Khẳng định khoa học/kỹ thuật quá tuyệt đối (F13)
- **Lỗi gốc & Vị trí**:
  - CRISPR: Kịch bản nói NHEJ "bất hoạt hoàn toàn các gen gây bệnh", HDR chèn gen "không tì vết" (`crispr/audio/timing.json:133, 145`).
  - Git: Kịch bản nói "không lưu vi phân delta, mà chụp lại trọn vẹn" và "không bao giờ mất dữ liệu" (`git-dag/audio/timing.json:37, 157`).
- **Cách tái hiện**: Đọc trực tiếp trường `spoken` trong `timing.json` và nghe audio line 10, 11 của CRISPR, line 02, 16 của Git.
- **Thay đổi cần thực hiện**:
  - CRISPR line 10: "Tế bào lập tức kích hoạt cơ chế nối đầu không tương đồng để hàn gắn thô sơ, thường tạo ra các đột biến mất hoặc thêm đoạn giúp bất hoạt gen mục tiêu."
  - CRISPR line 11: "Hoặc khi được cung cấp thêm một đoạn DNA mẫu lành lặn, tế bào có thể sử dụng cơ chế sửa chữa tương đồng để chèn chuỗi gen mới theo thiết kế với độ chính xác cao."
  - Git line 02: "...Git quản lý lịch sử dưới dạng chuỗi các ảnh chụp toàn vẹn về mặt logic, trong khi nén vi phân vật lý hiệu quả bên dưới."
  - Git line 16: "...cấu trúc dữ liệu bất biến tuyệt đẹp, cho phép bạn du hành thời gian và tự tin cộng tác mà không lo thất lạc các mốc lịch sử đã lưu."
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Tái tạo master WAV và captions mới; trích xuất transcript từ audio và phụ đề trong MP4 chứng minh lời dẫn khoa học chính xác, có điều kiện rõ ràng.

---

### Vấn đề 10: Gate kiểm đầy đủ cả bốn video (F10)
- **Lỗi gốc & Vị trí**: `scripts/run-v3_3-gate.ts` chỉ chạy G07b, G14, G15, G16 trên `out/final-v3_3.mp4` (Scopus), bỏ qua 3 video generalization (CRISPR, Steam, Git).
- **Cách tái hiện**: Kiểm tra tham số dòng lệnh trong `run-v3_3-gate.ts:80-175`.
- **Thay đổi cần thực hiện**:
  - Mở rộng các validator media chạy qua vòng lặp cả 4 video: trích xuất contact sheet, đo MAD temporal discontinuity, đo PSNR preview parity, và chấm điểm rubric 18 tiêu chí cho từng video.
- **Trạng thái hiện tại**: `[CHƯA_XÁC_MINH]`.
- **Điều kiện đóng lỗi**: Báo cáo `qa-report.json` và `preview-rubric-report.json` có kết quả đo đạc thực tế của cả 4 video với SHA-256 khớp tuyệt đối.

---

### Vấn đề 11: Các lỗ hổng validator cho PASS sai (F11)
- **Lỗi gốc & Vị trí**:
  - `validators/validate-visual-semantics.ts:322` bỏ qua path không tồn tại; slide tĩnh có 1 hình chữ nhật nhỏ vẫn PASS.
  - `validators/validate-preview-rubric.ts:609` mặc định tỷ lệ chuyển động = 1.0 cho ảnh tĩnh nếu không có biến thiên.
- **Cách tái hiện**: Chạy validator trên thư mục rỗng hoặc fixture slide tĩnh, lệnh vẫn exit 0.
- **Thay đổi đã thực hiện**: Fail-closed bắt buộc kiểm tra số file $> 0$, kiểm tra mật độ đồ thị quan hệ nodes/edges, tính toán tỷ lệ năng lượng chuyển động thực trên pipe video.
- **Trạng thái hiện tại**: `[SỬA_MỘT_PHẦN]`.
- **Điều kiện đóng lỗi**: Chạy suite 12 fixture tiêu cực + 17 bài test adversarial stress; xác minh 100% fixture lỗi đều bị chặn với exit code 1.

---

### Vấn đề 12: Animatic được duyệt trước TTS/render hoàn chỉnh (F12)
- **Lỗi gốc & Vị trí**: Pipeline thực tế trước đây nhảy thẳng từ kịch bản sang Master TTS và render 1080p, bỏ qua khâu kiểm duyệt Animatic 360p với scratch audio.
- **Cách tái hiện**: Không có artifact animatic 360p nháp nào được lưu trong thư mục `out/animatics/`.
- **Thay đổi cần thực hiện**:
  - Thiết lập bước xuất animatic 360p nhanh với scratch narration cues để kiểm tra bố cục và nhịp điệu hình ảnh trước khi khóa âm thanh master.
- **Trạng thái hiện tại**: `[CHƯA_XÁC_MINH]`.
- **Điều kiện đóng lỗi**: Xuất hiện artifact `out/animatics/crispr-animatic-360p.mp4` với log duyệt bố cục đạt yêu cầu trước khi render 1080p.

---

### Vấn đề 13: Skill, rubric, template thống nhất
- **Lỗi gốc & Vị trí**: `SKILL.md:85` còn giữ quy tắc cũ "detailed body text", mâu thuẫn với triết lý anti-card monoculture.
- **Thay đổi đã thực hiện**: Đã cập nhật `SKILL.md` và `AGENTS.md` loại bỏ quy tắc detailed body text, bổ sung quy tắc GPU và Explanatory Invariants.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Rà soát toàn bộ tài liệu template và schema, xác minh 0 còn câu chữ mâu thuẫn.

---

### Vấn đề 14: Video thoát khỏi kiểu slide nhiều chữ
- **Lỗi gốc & Vị trí**: Các cảnh vẫn có cấu trúc: Tiêu đề trên cùng $\to$ Đồ họa ở giữa $\to$ Card ghi chữ dài bên dưới.
- **Cách tái hiện**: Xem frame các video CRISPR/Steam: card chữ lớn chiếm 1/4 diện tích màn hình.
- **Thay đổi cần thực hiện**: Loại bỏ hoàn toàn card văn bản lớn; chuyển đổi thành diễn hoạt cơ chế trực tiếp, nhãn động gắn liền với thành phần (floating kinetic label) hoặc status ribbon nhỏ gọn.
- **Trạng thái hiện tại**: `[SỬA_CODE]`.
- **Điều kiện đóng lỗi**: Kiểm tra AST và frame thực tế chứng minh diện tích của các text box tĩnh $\le 10\%$ diện tích canvas.

---

### Vấn đề 15: Hệ thống tái tạo tốt khi đổi narration/chủ đề (F14)
- **Lỗi gốc & Vị trí**: Chưa từng thực hiện một bài test tái tạo thực tế từ đầu đến cuối khi thay đổi câu chữ kịch bản (chỉ có unit test giả lập).
- **Cách tái hiện**: Thử đổi 1 câu kịch bản trong `crispr/audio/timing.json`, nếu video render ra bị lệch khớp hình thì chứng tỏ hệ thống chưa thích ứng tự động.
- **Thay đổi cần thực hiện**: Thực hiện thử nghiệm tái tạo thực tế trên video đại diện CRISPR với kịch bản khoa học đã hiệu chỉnh.
- **Trạng thái hiện tại**: `[CHƯA_XÁC_MINH]`.
- **Điều kiện đóng lỗi**: Video MP4 mới của CRISPR khớp hoàn hảo giữa lời đọc mới, phụ đề mới và các mốc chuyển động của mô hình phân tử mà không sửa tay frame trong TSX.
