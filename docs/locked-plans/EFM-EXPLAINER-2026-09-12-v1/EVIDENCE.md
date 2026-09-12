# Vấn đề, bằng chứng, trách nhiệm và phản chứng

Các line references dưới đây là vị trí trong snapshot khảo sát ngày 12/09/2026, không bảo đảm giữ nguyên khi source tương lai đổi. Xem `evidence/source-manifest.json` để lấy hash và bản copy mã. Không coi hash source+video cùng được ghi là bằng chứng video chắc chắn được render từ source đó. Việc dựng lại cùng source sẽ thuộc WP01/WP10.

## 1. Quy ước độ chắc chắn

- **REPRODUCED:** đã chạy lệnh/đo artifact, có kết quả lưu.
- **SOURCE_CONFIRMED:** đọc thấy trực tiếp ở code; chưa khẳng định mọi output đi qua nhánh đó.
- **INFERENCE:** suy luận nguyên nhân có cơ sở nhưng chưa thử tách biến.
- **UNVERIFIED:** chưa có dữ liệu đủ; phải giữ rõ, không biến thành cáo buộc.

Phân loại trách nhiệm: **A** = shortcut/vi phạm trong artifact do tác giả AI tạo hoặc đường authoring cho phép; **S** = lỗi skill/contract/runtime/gate có thể sửa tái sử dụng; **AS** = cả hai. Không từ phân loại A suy ra “AI lười/cố tình gian dối”. Không có log tâm lý hoặc thí nghiệm kiểm soát model/effort đủ để chứng minh động cơ đó.

## 2. Sổ finding

| ID / mức | Vấn đề và chứng minh | Loại / chắc chắn | Xử lý / bằng chứng đóng |
|---|---|---|---|
| F01 / P0 | Quy tắc chống slide tồn tại ở SKILL:13–24, có cả trong commit b5130e4 trước component phễu ở 2f7cf80 | S / SOURCE_CONFIRMED: không phải thiếu yêu cầu | WP02–03: bộ tài liệu/mẫu thống nhất và bài clean-room thật |
| F02 / P0 | Scopus timeline beat12 yêu cầu radar matrix (`semantic-timeline.json:365–392`); `Scene3ProcessFunnel.tsx:21–45` mount phễu cho beat11–13 | AS / REPRODUCED source+frame1497 | WP03/10: contract từng beat được thể hiện; reviewer chỉ đúng cơ chế trên clip |
| F03 / P0 | `ResearchFunnelMechanism.tsx:45,97–99` có 3 hạt chạy modulo; `:166–199` render prose detail card | AS / SOURCE_CONFIRMED + frames1369/1497/1633 | WP03/07: mô tả lọc phải có điều kiện/đầu ra khác nhau; xóa prose không phải điều kiện đủ |
| F04 / P0 | Static scene hai span FAIL; chỉ thêm svg+rect tĩnh thành PASS; paths có /projects/ | S / REPRODUCED, evidence/anti-slide/fixture-results.json | WP08: negative phải reject; positive sơ đồ có chủ đích vẫn accept |
| F05 / P0 | `TEXT_TAGS` thiếu SVG text; suffix Mechanism được tính relational; runner chỉ gọi scenes/ | S / SOURCE_CONFIRMED | WP08: resolve imports/render-visible text; không tin tên component hoặc số primitive |
| F06 / P0 | Rubric mới đọc 103 mẫu: PASS4,84; 13 mẫu t44–56 bị gắn card-grid, score1/5 ở tiêu chí này | S / REPRODUCED, evidence/anti-slide/rubric-reproduction.json | WP08–09: confirmed critical/review_required không được trung bình hóa thành PASS |
| F07 / P0 | Contract validator (`validate-preview-rubric.ts:483–507`) chủ yếu kiểm chuỗi; không đối chiếu radar với hình | S / SOURCE_CONFIRMED | WP03/08: renderer evidence và review ngữ nghĩa nối contract→artifact |
| F08 / P0 | `run-production-gate.ts:221–229` tự ghi reviewer và 4,87 | S / SOURCE_CONFIRMED | WP01/09: report kết quả thật, danh tính/lineage xác thực, trạng thái chưa review rõ |
| F09 / P0 | `generate-raft-audio.py:45–70` tổng sine; manifest ghi voice profile; mẫu WAV thực 1–1,2s tương quan gần1 với công thức | AS / REPRODUCED ở audit trước, repro script lưu | WP05/09: dummy được cách ly negative, candidate có narration thật và provenance |
| F10 / P1 | Caption pump validator đã trả 15 lỗi; frame545 có 4 dòng; KaraokeLine:23 cho wrap tiếp | AS / REPRODUCED ở audit trước, cần chạy lại snapshot trước sửa | WP06: DOM lines/width thật + alignment và frame evidence |
| F11 / P1 | Python internal gap0,25; TS0,13; role gaps khác nhau | S / SOURCE_CONFIRMED | WP05: một policy, adapter tests, không “canonical” trùng |
| F12 / P1 | GAP_CHAIN tác động gap; thử tone gap600ms làm tổng audio giảm342,563ms trước atempo | S / REPRODUCED, pause-probe | WP05: bảo toàn authored pause, test cùng binary+nghe người thật |
| F13 / P1 | TS pipeline ghép mọi chunk250ms, không dùng pauseAfterMs; alignment invalid chỉ warn | S / SOURCE_CONFIRMED | WP05–06: phrase role thật, fail alignment theo lỗi, align master cuối |
| F14 / P1 | Template dùng frame%150, phase0 trong khi hook phase1, font22/26 | S / SOURCE_CONFIRMED | WP04: scaffold runnable có test output, không lấy placeholder imports làm bằng chứng duy nhất về bug |
| F15 / P0 | render-production:40–44 chọn composition đầu tiên nếu không match; film fallback Scene1 nếu shotID không có | S / SOURCE_CONFIRMED | WP01/04: registry strict, unknown ID fail; không video khác dưới tên requested |
| F16 / P1 | AGENTS gọi v3.3:gate nhưng package alias legacy; production gate mới khác; README/Root legacy còn cạnh tranh | S / SOURCE_CONFIRMED | WP02/11: một entrypoint và registry production; legacy regression riêng |
| F17 / P1 | Clean-room chỉ SKILL/templates, references có motion grammar bị bỏ ngoài; rubric chấp nhận highlighted card cho density | S / SOURCE_CONFIRMED; ảnh hưởng quyết định AI là INFERENCE | WP02: loading map và tiêu chí phân biệt prose-card với diagram focus |
| F18 / P0 | Runner không yêu cầu approved animatic/learning review receipt | S / SOURCE_CONFIRMED; chưa chứng minh không ai review ngoài runner | WP03/09/10: stage receipts có hash, pending khi thiếu người/SME |
| F19 / P1 | `ResearchFunnelMechanism.tsx:134` dùng CSS transition | S / SOURCE_CONFIRMED; chưa đo flicker tại mọi render | WP07: frame-derived interpolation theo R08, test seek order |
| F20 / P1 | Thiếu kiểm tra ràng buộc nguồn→output sau narration đổi; audio/captions đường dẫn cố định | S / SOURCE_CONFIRMED về thiếu lineage, stale cụ thể cần test | WP01/06: content hashes và invalidation, test đổi phrase+pause |
| F21 / P1 | TS temp chunks bị xóa trong finally; Python single raw mặc định bị xóa | S / SOURCE_CONFIRMED | WP05: lưu stage artifacts cho đến independent review, có retention policy |
| F22 / P0 | `align-multilingual.py:232–236,245–259` có proportional fallback | S / SOURCE_CONFIRMED; không nói mọi alignment hiện tại dùng fallback | WP05/06: production fail khi CTC không đủ evidence, draft không được chứng nhận |

Không dùng các finding F01/F17 để miễn trách nhiệm implementation: contract có sẵn vẫn bị làm sai. Không dùng F02 để nói mọi scene/AI/model đều làm sai.

## 3. AI “lười”: điều được phép ghi và điều không được phép ghi

| Quan sát | Cách gọi có bằng chứng | Cách gọi vượt bằng chứng |
|---|---|---|
| Đổi cơ chế radar thành lựa chọn mục phễu | Shortcut triển khai, không bảo toàn visual contract | AI cố ý lười, không muốn suy nghĩ |
| Sine được dùng dưới tên narration profile | Artifact giả chức năng narration, provenance không đáng tin | AI cố tình lừa vì động cơ cụ thể |
| Điểm4,87 hardcoded | Chứng nhận không dựa vào kết quả đo | Tất cả các reviewer trước đều gian dối |
| Dùng component Mechanism và thêm primitive để qua kiểm | Gate dễ bị thỏa mãn bằng hình thức | Đã chứng minh tác giả biết và cố tình khai thác gate |
| Template cũ/contradictory docs | Rủi ro instruction routing và ví dụ sai | Skill dài là nguyên nhân duy nhất |

Kế hoạch phải chặn **hành vi shortcut**, không cần phỏng đoán động cơ: bắt handoff kèm artifact, thiếu thì pending/fail; kiểm đúng candidate; không đi tiếp bằng placeholder; escalation khi không làm nổi; không tự sửa claim, timing hay scope để đơn giản hóa. Nếu muốn so sánh tác động model/effort, làm thí nghiệm riêng cùng brief/source/budget, đánh giá mù; chưa có thí nghiệm đó trong audit.

## 4. Xung đột và dư thừa cần giải quyết

- **Chính sách khác ví dụ:** prose bị cấm nhưng sample card/status chứa văn bản; sửa cả skill và template, không chỉ lời mở đầu.
- **Policy khác runtime:** caption52 vs default44; pause0,25/0,13; profile max0,30 không đủ diễn đạt deliberate pause dài; thống nhất nơi đọc cấu hình.
- **Contract khác gate:** schema state/action fields optional; runtime validator kiểm nonempty strings; phải phân biệt structural validation với explanatory verification.
- **Gate khác lời chứng nhận:** PASS số đo chưa là human learning; reviewer string chưa là reviewer thật.
- **Entrypoint khác governance:** v3.3 alias legacy vs gate active; sai tên project có fallback; loại mơ hồ.
- **Tài liệu lịch sử khác chuẩn hiện hành:** bản sao skill trong worker/challenger và ledger cũ; archive có nhãn, không xóa mất evidence.
- **Quy tắc dễ quá tay:** cấm mọi tọa độ/card/hold hoặc ép đủ 5 primitives có thể triệt tiêu creative flexibility. Chỉ bắt constraint liên quan và ý nghĩa; không hardcode template mới thay template cũ.

Không phải mọi file nhiều chữ là dư thừa. Reference chuyên sâu nên tách module và có loading map; vấn đề là nhiều bản có thẩm quyền cạnh tranh và bất nhất. Mỗi responsibility chỉ có một nguồn active, phần lịch sử không được discover như skill production.

## 5. Phản chứng bắt buộc giữ trong báo cáo tương lai

Pump Scene2 có deformation và đường ion theo beat progress: không đúng khi nói repo chỉ có card tĩnh. Một hình chữ nhật có thể là thành phần mô hình hợp lệ. Một đoạn hold có thể cần cho học, không tự động là lỗi. Một caption đúng giúp accessibility, không phải paragraph card trên canvas. Mute-blank không đủ thay full AV comprehension. Số contour là detector heuristic, cần xác nhận nghĩa. Chưa có study người xem thì không nói “người xem đã hiểu”.

## 6. Cách đọc bằng chứng snapshot

`evidence/anti-slide/` chứa report4,84, fixtures đối chứng, frames và manifest của audit trước. `evidence/pause-probe/` chứa kết quả DSP mới. `evidence/source/` giữ bản file cần đối chiếu line; `source-manifest.json` ghi SHA-256. `evidence/repository-state.txt` ghi HEAD/worktree tại thời điểm lập kế hoạch. Những file này không được dùng làm media production hoặc report nghiệm thu hiện tại.

Một reproduction chỉ đóng câu hỏi nó đã đo. Ví dụ tone test đóng vấn đề filter có thể rút gap, chưa đóng giọng có tự nhiên; validator test đóng false-pass cụ thể, chưa chứng minh full pipeline accept mọi slide. Luôn ghi rõ sự khác nhau này.
