# Friction Log: Sodium-Potassium Pump Video Production (V3.4 Standard)

**Project**: `sodium-potassium-pump`  
**Agent Role**: Clean-Room Production Agent  
**Date**: 2026-09-11  

Mục đích tài liệu: Ghi nhận chi tiết, khách quan và minh bạch mọi điểm mơ hồ, giả định bất đắc dĩ, lỗi công cụ hoặc thiếu sót trong tài liệu `SKILL.md` và templates trong quá trình sản xuất video từ đầu đến cuối nhằm đóng góp cải tiến ngược lại hệ thống skill reusable.

---

## 1. Các Vấn Đề Công Cụ & Sai Lệch Tài Liệu Đã Phát Hiện & Xử Lý

### Friction 1: Tham số CLI của `generate-vieneu-narration.py` không khớp tài liệu SKILL.md
- **Hiện tượng**: `SKILL.md` (Dòng 123) hướng dẫn chạy:
  ```bash
  /home/hongphuoc6104/video3d/.genvideo/voice/vieneu/.venv/bin/python3 scripts/generate-vieneu-narration.py \
    --batch projects/<project-name>/audio/batch.json \
    --output projects/<project-name>/audio/master_audio.wav
  ```
  Tuy nhiên, trong `scripts/generate-vieneu-narration.py`, `argparse` chỉ khai báo cờ `--batch-json`, không có cờ `--batch`. Một Clean-Room Agent chạy theo đúng hướng dẫn của SKILL.md sẽ bị báo lỗi `unrecognized argument: --batch`.
- **Giải pháp xử lý**: Đã bổ sung alias `--batch` cho `--batch-json` trong `scripts/generate-vieneu-narration.py`:
  ```python
  parser.add_argument("--batch-json", "--batch", type=str, dest="batch_json", help="...")
  ```
- **Kiến nghị hệ thống**: Giữ nguyên alias `--batch` để đảm bảo tương thích ngược với tài liệu SKILL.md.

---

### Friction 2: `generate-vieneu-narration.py` ghi đường dẫn tuyệt đối vào `timing.json` gây vi phạm Portability Gate
- **Hiện tượng**: `generate-vieneu-narration.py` dùng `Path(...).resolve()` để định danh `masterVoiceover` và các file `lineXX.wav`, sau đó ghi thẳng vào `timing.json`.
  Điều này tạo ra các chuỗi `/home/hongphuoc6104/...` trong `timing.json`.
  Khi chạy `validators/validate-portability.ts`, gate bị fail lập tức vì phát hiện đường dẫn tuyệt đối.
- **Giải pháp xử lý**: Chuyển đổi mọi đường dẫn file được ghi vào `timing.json` sang đường dẫn tương đối (relative to `process.cwd()` bằng `os.path.relpath`).
- **Kiến nghị hệ thống**: Mọi script sinh metadata (`timing.json`, `cues.json`, `shot-spec.json`) phải luôn chuẩn hóa đường dẫn tương đối với thư mục gốc workspace.

---

### Friction 3: Lỗi chiều Tensor âm thanh Stereo trong `scripts/align-multilingual.py`
- **Hiện tượng**: Khi đọc file âm thanh stereo master 2 kênh (`master_audio.wav`) bằng thư viện `soundfile.read()`, dữ liệu trả về có shape `(num_samples, num_channels) = (1708641, 2)`.
  Trong code cũ của `scripts/align-multilingual.py`:
  ```python
  if waveform.shape[0] > 1 and waveform.shape[1] > 1:
      waveform = torch.mean(waveform, dim=0, keepdim=True)
  ```
  Lệnh `torch.mean(waveform, dim=0)` đã tính trung bình dọc theo trục thời gian (axis 0), khiến 35 giây âm thanh bị ép thành 2 mẫu duy nhất `(1, 2)`. Sau đó khi đưa vào mô hình Wav2Vec2 MMS, phép tích chập 1D (`conv1d`) với kernel size 10 ném ra ngoại lệ:
  `RuntimeError: Calculated padded input size per channel: (1). Kernel size: (10). Kernel size can't be greater than actual input size`.
- **Giải pháp xử lý**: Sửa điều kiện xử lý kênh trong `scripts/align-multilingual.py` để kiểm tra đúng trục kênh (`dim=1` khi `shape[1] < shape[0]`):
  ```python
  elif waveform.ndim == 2:
      if waveform.shape[1] < waveform.shape[0]:
          waveform = torch.mean(waveform, dim=1, keepdim=True).t()
      else:
          waveform = torch.mean(waveform, dim=0, keepdim=True)
  ```
  Sau khi sửa, script trích xuất chính xác 137 từ tiếng Việt với độ tin cậy cao mà không tạo ký tự giả.
- **Kiến nghị hệ thống**: Cập nhật vĩnh viễn sửa đổi này vào `scripts/align-multilingual.py`.

---

### Friction 4: `validate-audio-ownership.ts` hardcode project `scopus-explainer` và thiếu tham số `--project`
- **Hiện tượng**: Trong `scripts/run-production-gate.ts`, Gate G03 gọi:
  `['tsx', 'validators/validate-audio-ownership.ts']` mà không truyền tham số đường dẫn dự án.
  Bên trong `validate-audio-ownership.ts`, giá trị mặc định là `connection-film/src/scopus-explainer/ScopusExplainerFilm.tsx`. Vì thư mục này đã chuyển vào `connection-film/src/legacy/scopus-explainer/`, gate lập tức bị crash với lỗi `File not found`.
- **Giải pháp xử lý**:
  1. Mở rộng `OwnershipOptions` và parser CLI trong `validators/validate-audio-ownership.ts` để nhận cờ `--project=<path>`.
  2. Tự động quét file `*Film.tsx`, `audio/audio-manifest.json`, `scenes/`, và file `master_audio.wav` trong thư mục dự án đó.
  3. Cập nhật `scripts/run-production-gate.ts` để truyền `--project=${projectDir}` vào Gate G03.
- **Kiến nghị hệ thống**: Mọi validator trong `validators/` phải luôn tuân thủ nguyên tắc nhận tham số `--project` đồng nhất.

---

### Friction 5: Bất đồng bộ giữa Hook `useBeatChoreography` và Template `SceneTemplate.tsx`
- **Hiện tượng**: `templates/SceneTemplate.tsx` ghi mẫu:
  ```tsx
  const { currentBeatIndex, intraBeatProgress, phase } = useBeatChoreography(shotBeats);
  ```
  Tuy nhiên, kiểu dữ liệu `BeatChoreographyState` được định nghĩa trong `motion-kit/src/cues/beatChoreography.ts` đặt tên thuộc tính là `beatProgress` (hoặc `phaseProgress`), không hề có `intraBeatProgress`. Điều này dẫn đến lỗi biên dịch TypeScript `TS2339: Property 'intraBeatProgress' does not exist on type 'BeatChoreographyState'`.
- **Giải pháp xử lý**: Trong các file scene, dùng cú pháp destructuring đổi tên:
  ```tsx
  const { currentBeatIndex, beatProgress: intraBeatProgress } = useBeatChoreography(shotBeats);
  ```
- **Kiến nghị hệ thống**: Cập nhật `templates/SceneTemplate.tsx` hoặc bổ sung alias `intraBeatProgress` trong `motion-kit/src/cues/beatChoreography.ts` để khớp với nhau.

---

## 2. Nhật Ký Tiến Độ & Quyết Định Thiết Kế

1. **Lựa chọn Hero Metaphor**: Quyết định sử dụng mô hình van lật luân phiên hai trạng thái Albers-Post ($E_1 \rightleftharpoons E_2$) với chuyển động hinge hình học của tiểu phần Alpha. Thể hiện rõ trạng thái trung gian "khóa kín hai đầu" (occluded state) để chứng minh bơm không bao giờ để rò rỉ ion qua màng.
2. **Kỹ thuật Audio DSP**: Giọng đọc Adam VieNeu-TTS được thiết lập tốc độ 1.04x với thời gian nghỉ `pauseAfter` từ 0.32s đến 0.40s. Master audio được chuyển đổi sang 48kHz, stereo 2 kênh, EBU R128 loudness đạt -15.6 LUFS (đạt chuẩn yêu cầu $-15.0 \pm 1.0$ LUFS).
3. **Typography Mobile Floor**: Tất cả các phần tử chữ trong toàn bộ dự án đều có cỡ chữ $\ge 30\text{px}$, tiêu đề phần $\ge 48\text{px}$, tiêu đề hero $\ge 64\text{px}$, vượt qua hoàn toàn bộ kiểm định Mobile Typography AST.
