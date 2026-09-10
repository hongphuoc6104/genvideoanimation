# Bản Đồ Hiện Trạng Hệ Thống & Sổ Dọn Dẹp (System Map & Cleanup Ledger) — V3.4 Standard

> **Nguyên tắc quản trị bất biến (NO_SELF_CERTIFICATION & SEPARATION OF CONCERNS)**:
> 1. **Tách biệt 3 chiều độc lập**:
>    - **Quyết định xử lý (Disposition Decision)**: `KEEP` (Giữ lại), `REPLACE/MIGRATE` (Thay thế / Di chuyển), `ARCHIVE` (Lưu trữ legacy), `REMOVE` (Loại bỏ).
>    - **Trạng thái thực thi (Execution Status)**: `CHƯA_THỰC_HIỆN`, `ĐANG_THỰC_HIỆN`, `ĐÃ_THỰC_HIỆN`.
>    - **Trạng thái chất lượng (Quality / Verification Status)**: `CHƯA_XÁC_MINH` (Chưa kiểm tra), `CÓ_LỖI_MỞ` (Tồn tại lỗi đã biết), `SỬA_MỘT_PHẦN` (Mới sửa code/test, chưa nghiệm thu video), `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` (Đã có frame/audio từ video MP4 thật chứng minh hết lỗi và zero regression).
> 2. **Không tự chứng nhận**: Không tuyên bố package hoạt động đúng hay video hết lỗi khi chưa có bằng chứng thực nghiệm độc lập.
> 3. **Bảo tồn baseline hồi quy**: Các video cũ được lưu trữ làm baseline đối chứng hồi quy, mang các lỗi gốc đã biết để kiểm tra không gãy nền tảng chia sẻ.
> 4. **Bảo tồn tự do sáng tạo hình ảnh**: Bố cục không bị đóng khung cứng nhắc vào bất kỳ template bốn tầng bắt buộc nào.

---

## 1. Danh Mục Chi Tiết Toàn Bộ Thành Phần Hệ Thống

### 1.1. Phân Hệ Skill & Tài Liệu Quản Trị

| # | Thành phần & Đường dẫn hiện tại | Đường dẫn đích | Quyết định xử lý | Trạng thái thực thi | Trạng thái chất lượng | Caller / Dependency | Lỗi còn mở (Open Defects / Gaps) | Điều kiện hoàn tất | Bằng chứng xác minh |
|---|---|---|:---:|:---:|:---:|---|---|---|---|
| 01 | `.agents/skills/educational-flat-motion/SKILL.md` | `.agents/skills/educational-flat-motion/SKILL.md` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Subagent, Antigravity runtime, quy trình sản xuất mới | Đã xử lý 5 điểm friction ghi nhận trong quá trình clean-room | Clean-room agent hoàn thành video mới độc lập không cần can thiệp thủ công | Đạt chuẩn V3.4: video `out/sodium-potassium-pump-1080p.mp4` pass 8/8 gates, điểm rubric 4.87/5.00 |
| 02 | `./educational-flat-motion/` (Bản sao tại root) | *Không (Xóa bỏ)* | `REMOVE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Không còn caller nào được phép trỏ tới | Bản sao trùng lặp, phân nhánh nội dung so với `.agents/skills` | Xóa hoàn toàn khỏi file system, `find` không còn tìm thấy | Lệnh `rm -rf educational-flat-motion`, git status `D` |
| 03 | `.agents/skills/educational-flat-motion/kit/` | *Không (Xóa bỏ)* | `REMOVE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Code TSX scene cũ từng import nhầm | Vi phạm ranh giới cách ly runtime (AGENTS.md rule 4) | Xóa toàn bộ code TSX trong `.agents/skills/.../kit/` | Lệnh `rm -rf .agents/.../kit`, validator `motion-lint.ts` |
| 04 | `AGENTS.md` | `AGENTS.md` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Toàn bộ các agent khi khởi tạo | Đã phân định rõ lệnh `npm run gate` (active project) và `npm run test:legacy` (regression) | Hoàn thiện tài liệu AGENTS.md phản ánh chuẩn V3.4 và Two-Tier | Nội dung `AGENTS.md`, 19/19 cổng `npm run test:legacy` pass |
| 05 | `CHECKPOINT_V3.md`, `benchmark-*.md` | `legacy/docs/` | `ARCHIVE` | `ĐÃ_THỰC_HIỆN` | `CHƯA_XÁC_MINH` | Báo cáo kiểm toán lịch sử v2, v3 | Chứa các tiêu chuẩn cũ đã bị thay thế | Chuyển vào `legacy/docs/` để không gây nhiễu ngữ cảnh | `ls legacy/docs/` |

---

### 1.2. Phân Hệ Templates & Schemas

| # | Thành phần & Đường dẫn hiện tại | Đường dẫn đích | Quyết định xử lý | Trạng thái thực thi | Trạng thái chất lượng | Caller / Dependency | Lỗi còn mở (Open Defects / Gaps) | Điều kiện hoàn tất | Bằng chứng xác minh |
|---|---|---|:---:|:---:|:---:|---|---|---|---|
| 06 | `templates/project-brief.md` | `.agents/skills/.../templates/project-brief.md` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Tác nhân khởi tạo dự án mới | Bản cũ có trường `duration_seconds` cố định, thiếu Core Question | Bản mới bắt buộc Core Question, Hero Metaphor, Scope Boundaries | File `templates/project-brief.md` mới; dùng thành công tại `sodium-potassium-pump` |
| 07 | `templates/shot-schema.json` | `.agents/skills/.../templates/shot-schema.json` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | `validate-shot-spec.ts`, `temporal-render-qa.ts` | Schema cũ dùng snake_case (`start_frame`) lệch hoàn toàn production | Chuẩn hóa camelCase, bắt buộc `impact_frames`, `transitions` | File `templates/shot-schema.json` mới; pass Gate G06 |
| 08 | `templates/semantic-timeline-schema.json` | `.agents/skills/.../templates/semantic-timeline-schema.json` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | `validate-preview-rubric.ts`, `extract-contact-sheet.ts` | Trước đây không có file schema độc lập, nằm rải rác | Bắt buộc trường `visualExplanationContract` cho từng beat | File `templates/semantic-timeline-schema.json` mới; pass Gate G08 |
| 09 | `templates/captions-chunk-schema.json` | `.agents/skills/.../templates/captions-chunk-schema.json` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | `packages/caption-kit`, `KaraokeCaptions.tsx` | Trước đây không có schema quy định bounding box an toàn | Bắt buộc box $y \in [1420, 1550]$, tối đa 2 dòng | File `templates/captions-chunk-schema.json` mới; pass caption collision rubric 5.0/5.0 |
| 10 | `templates/SceneTemplate.tsx` | `.agents/skills/.../templates/SceneTemplate.tsx` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Tác nhân dựng scene mới | Bản ban đầu ép 4 tầng bắt buộc, làm hạn chế sáng tạo | Cập nhật thành mẫu gợi ý; làm rõ tự do bố cục và giữ vùng safe subtitles | File `templates/SceneTemplate.tsx` mới; đã đồng bộ alias `intraBeatProgress` |
| 11 | `templates/FilmTemplate.tsx` | `.agents/skills/.../templates/FilmTemplate.tsx` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Root composition dự án mới | Cần đảm bảo 1 thẻ `<Audio>` duy nhất tại root và mount dynamic sequences | Template gắn 1 `<Audio>` chuẩn và Sequence map | File `templates/FilmTemplate.tsx` mới; pass Gate G03 |

---

### 1.3. Phân Hệ Runtime Packages (`packages/` & `motion-kit/`)

| # | Thành phần & Đường dẫn hiện tại | Đường dẫn đích | Quyết định xử lý | Trạng thái thực thi | Trạng thái chất lượng | Caller / Dependency | Lỗi còn mở (Open Defects / Gaps) | Điều kiện hoàn tất | Bằng chứng xác minh |
|---|---|---|:---:|:---:|:---:|---|---|---|---|
| 12 | `packages/narration-kit` | `packages/narration-kit` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | `scripts/align-multilingual.py`, tokenizer pipeline | Đã fix lỗi isolatedModules export type và @types/node | Kiểm thử với bộ test đa dạng tiếng Việt có chứa số, đơn vị đo, và từ kỹ thuật | `npm run build && npm run typecheck` PASS 100% |
| 13 | `packages/caption-kit` | `packages/caption-kit` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Mọi composition hiển thị phụ đề karaoke | Đã khôi phục font 52px chuẩn với semantic chunking an toàn | Kiểm chứng phụ đề font 52px chia chunk ngắn không tràn màn hình và không đè hình | `theme.ts` (fontSize: 52), build `tsc` sạch, rubric collision score: 5.00/5.00 |
| 14 | `motion-kit` (tại root) | `motion-kit` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Toàn bộ các scene Remotion TSX | Đã bổ sung alias `intraBeatProgress` trong `BeatChoreographyState` | Kiểm tra hook `useBeatChoreography` co giãn nhịp nhàng theo timeline | `tests/invariants/timeline-narration-adaptation.test.ts` (PASS 192/192) & gate |

---

### 1.4. Phân Hệ Production Scripts & Tooling

| # | Thành phần & Đường dẫn hiện tại | Đường dẫn đích | Quyết định xử lý | Trạng thái thực thi | Trạng thái chất lượng | Caller / Dependency | Lỗi còn mở (Open Defects / Gaps) | Điều kiện hoàn tất | Bằng chứng xác minh |
|---|---|---|:---:|:---:|:---:|---|---|---|---|
| 15 | `scripts/generate-vieneu-narration.py` | `scripts/generate-vieneu-narration.py` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Giai đoạn 5 (Audio synthesis) | Đã bổ sung alias `--batch` cho argparse, dùng `os.path.relpath` tránh lộ machine path | File WAV xuất xưởng đạt đúng 48kHz, stereo, EBU R128 $-15.0 \pm 1.0\text{ LUFS}$ | Header WAV đo được: 48000Hz, 2ch, 16bit, LUFS = -15.6 |
| 16 | `scripts/align-multilingual.py` | `scripts/align-multilingual.py` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Giai đoạn 5 (MMS CTC alignment) | Đã sửa tính trung bình theo chiều kênh `dim=1` khi audio stereo 2 kênh | Script tự động chuyển đổi sang mono trước khi đưa vào mô hình CTC MMS | Subagent friction log & 137 từ tiếng Việt căn chỉnh chính xác |
| 17 | `scripts/run-production-gate.ts` | `scripts/run-production-gate.ts` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Entrypoint chuẩn: `npm run gate` | Đã hoàn thiện, hỗ trợ `--project=<path>`, ghi nhận đầy đủ chứng nhận chất lượng | Chạy qua 8 gate độc lập và xuất `out/qa-report.json` với exit code 0 | Chạy thực nghiệm trên `projects/sodium-potassium-pump`: PASS 8/8 (13.18s) |
| 18 | `scripts/run-legacy-regression.ts` | `scripts/run-legacy-regression.ts` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Entrypoint hồi quy: `npm run test:legacy` | Tách khỏi pipeline mặc định, phục vụ kiểm tra đối chứng các video cũ | Chạy và kiểm tra 4 video legacy mà không làm gãy build | Toàn bộ 19/19 gate kỹ thuật PASS trong 63.39s |
| 19 | `scripts/render-scopus-v3_*.ts`, `run-v3*-benchmarks.ts` | `legacy/scripts/` | `ARCHIVE` | `ĐÃ_THỰC_HIỆN` | `CHƯA_XÁC_MINH` | Các quy trình render cũ v3.1, v3.2 | Hardcode đường dẫn cũ, không hỗ trợ GPU NVENC chuẩn | Đưa vào `legacy/scripts/` ngắt khỏi package.json mặc định | Thư mục `legacy/scripts/` |

---

### 1.5. Phân Hệ Quality Gates & Validators (`validators/`)

| # | Thành phần & Đường dẫn hiện tại | Đường dẫn đích | Quyết định xử lý | Trạng thái thực thi | Trạng thái chất lượng | Caller / Dependency | Lỗi còn mở (Open Defects / Gaps) | Điều kiện hoàn tất | Bằng chứng xác minh |
|---|---|---|:---:|:---:|:---:|---|---|---|---|
| 20 | `validators/temporal-render-qa.ts` | `validators/temporal-render-qa.ts` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Gate G06 trong pipeline | Trước đây chỉ đọc shot-spec tĩnh, bắt nhầm 15 cú giật tại beat boundaries | Tự động đọc co-located `semantic-timeline.json` và whitelist beat boundaries | Đã PASS sạch trên CRISPR 1080p MP4 (0 unannotated spikes) |
| 21 | `validators/validate-preview-parity.ts` | `validators/validate-preview-parity.ts` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Gate G07 trong pipeline | Lỗi phân tích cú pháp tham số dòng lệnh (bỏ qua positional arguments) | Hỗ trợ cả positional và `--master`/`--preview` cờ tường minh | Đã PASS trên CRISPR (Delta = 0.0000s, PSNR = 35.99 dB) |
| 22 | `validators/validate-preview-rubric.ts` | `validators/validate-preview-rubric.ts` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Gate G08 trong pipeline | Cần đảm bảo giải mã RGB24 thật từ FFmpeg pipe, zero synthetic buffer | Đạt điểm overall $\ge 4.50$, caption collision clearance $\ge 4.30$ | Đã PASS trên CRISPR preview MP4 (5.00 / 5.00) |
| 23 | `validators/validate-mobile-typography.ts` | `validators/validate-mobile-typography.ts` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Gate G01 trong pipeline | Cần tham số hóa nhận thư mục bất kỳ thay vì hardcode 4 project cũ | Quét đệ quy AST tính toán font * scale $\ge 30\text{px}$ mobile floor | Đã chạy thành công với tham số `projects/...` |
| 24 | `validators/validate-visual-semantics.ts` | `validators/validate-visual-semantics.ts` | `KEEP` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Gate G04 trong pipeline | Từ chối card monoculture, bắt buộc đồ họa quan hệ động học | Bắt lỗi fail-closed nếu thư mục rỗng hoặc chỉ có card tĩnh | 17 bài test trong adversarial suite đều pass |

---

### 1.6. Phân Hệ Compositions & Video Cũ (Baseline Hồi Quy)

| # | Thành phần & Đường dẫn hiện tại | Đường dẫn đích | Quyết định xử lý | Trạng thái thực thi | Trạng thái chất lượng | Caller / Dependency | Lỗi còn mở (Open Defects / Gaps) | Điều kiện hoàn tất | Bằng chứng xác minh |
|---|---|---|:---:|:---:|:---:|---|---|---|---|
| 25 | `scopus-explainer` | `connection-film/src/legacy/scopus-explainer/` | `ARCHIVE` | `ĐÃ_THỰC_HIỆN` | `CÓ_LỖI_MỞ` (Baseline lỗi) | `npm run test:legacy`, `RootLegacy.tsx` | Card monoculture, text-heavy trong scenes 2, 4, 5; phụ đề dài che mô hình | Giữ nguyên làm baseline đối chứng hồi quy cho phong cách học thuật cũ | File MP4 `out/final-v3_3.mp4`, `REVIEW.md` |
| 26 | `crispr` | `connection-film/src/legacy/crispr/` | `ARCHIVE` | `ĐÃ_THỰC_HIỆN` | `SỬA_MỘT_PHẦN` | `npm run test:legacy`, `RootLegacy.tsx` | Đã sửa đứt backbone, NHEJ gap 0, beat choreo, audio mới, nhưng lời dẫn chưa có SME độc lập duyệt | Giữ làm benchmark sinh học phân tử; MP4 mới pass toàn bộ media gates | `out/crispr-cas9-1080p.mp4`, 6 frame kiểm toán trong `representative-crispr/` |
| 27 | `steam-engine` | `connection-film/src/legacy/steam-engine/` | `ARCHIVE` | `ĐÃ_THỰC_HIỆN` | `CÓ_LỖI_MỞ` (Baseline lỗi) | `npm run test:legacy`, `RootLegacy.tsx` | Scene 3 cắt sớm tại 56s sang thanh nối; nhãn trạng thái đè đồ họa | Giữ làm benchmark nhiệt động lực học & cơ cấu đòn bẩy | `out/steam-engine-1080p.mp4`, `REVIEW.md` |
| 28 | `git-dag` | `connection-film/src/legacy/git-dag/` | `ARCHIVE` | `ĐÃ_THỰC_HIỆN` | `CÓ_LỖI_MỞ` (Baseline lỗi) | `npm run test:legacy`, `RootLegacy.tsx` | Audio cũ chứa khẳng định tuyệt đối (chưa tái tạo master audio); layout node nhảy frame | Giữ làm benchmark cấu trúc dữ liệu máy tính | `out/git-dag-1080p.mp4`, `REVIEW.md` |
| 29 | `connection-film/src/Root.tsx` | `connection-film/src/Root.tsx` | `REPLACE/MIGRATE` | `ĐÃ_THỰC_HIỆN` | `ĐÃ_KIỂM_CHỨNG_ĐẦU_RA` | Remotion compositor runtime | Đã tách rời: `Root.tsx` chỉ mount active projects, legacy chuyển sang `RootLegacy.tsx` | Đảm bảo `remotion render` mặc định không bị lẫn lộn giữa các phiên bản | File `Root.tsx` và `RootLegacy.tsx` |

---

## 2. Kết Luận & Hành Động Tiếp Theo
1. Bản đồ này phân tách rành mạch giữa quyết định cấu trúc và kết quả đo đạc thực nghiệm.
2. Không có bất kỳ video hay package nào được tự ý gán nhãn "hoạt động đúng" hoặc "hết lỗi" khi chưa có bằng chứng kiểm định đầu ra thực tế.
3. Toàn bộ các video cũ được bảo tồn nguyên vẹn làm baseline hồi quy, cách ly hoàn toàn khỏi quy trình sản xuất mới.
