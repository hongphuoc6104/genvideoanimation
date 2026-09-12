# KẾ HOẠCH HOÀN THIỆN HỆ THỐNG VIDEO GIẢI THÍCH BẰNG CHUYỂN ĐỘNG

**Mã:** EFM-EXPLAINER-2026-09-12-v1. **Chủ sở hữu yêu cầu:** người dùng dự án. **Ngày nghiên cứu:** 12/09/2026, Asia/Ho_Chi_Minh.

Đây là hồ sơ kế hoạch và bằng chứng, không phải tuyên bố đã sửa hệ thống hoặc đã nghiệm thu video. Toàn bộ công việc triển khai bên dưới còn ở trạng thái **CHƯA TRIỂN KHAI THEO KẾ HOẠCH NÀY**. Trạng thái niêm phong chính thức ghi trong `LOCK.md`; không suy từ chữ “production” trong các báo cáo cũ.


**Mở nhanh:** [REQUIREMENTS.md](REQUIREMENTS.md) · [EVIDENCE.md](EVIDENCE.md) · [RESEARCH.md](RESEARCH.md) · [LEARNING_DESIGN.md](LEARNING_DESIGN.md) · [VOICE_AND_SYNC.md](VOICE_AND_SYNC.md) · [WORKPACKAGES.md](WORKPACKAGES.md) · [ACCEPTANCE.md](ACCEPTANCE.md) · [TROUBLESHOOTING.md](TROUBLESHOOTING.md) · [REVIEW.md](REVIEW.md)

## 1. Kết quả người dùng thực sự yêu cầu

Xây dựng một skill system có thể tạo video giải thích giáo dục bằng chuyển động có ý nghĩa. Người xem phải nhận ra vấn đề, thấy nguyên nhân và quan hệ, theo được từng bước giải quyết, hiểu ví dụ, nhận ra lỗi và biết sửa lỗi. Sau video, người xem phải có khả năng tự giải thích hoặc áp dụng; cảm giác đẹp, nhiều motion, nhiều lượt xem hay “tôi thấy dễ hiểu” không thay thế bằng chứng học được.

Video không được trở thành các slide/ô văn bản được làm sáng tuần tự. Khi che toàn bộ chữ, hình vẫn phải cho thấy các thực thể, hướng tác động, diễn biến và kết quả cốt lõi đã khai báo. Khi tắt cả tiếng, tiếp tục kiểm tra phần ý nghĩa mà hình tự mang; không giả vờ rằng người mới có thể đoán chính xác mọi thuật ngữ khoa học từ hình không nhãn. Phần nào còn cần lời để hiểu phải được ghi rõ, không được dùng điểm mù này để hợp thức hóa slide.

Giọng đọc tiếng Việt phải nhanh, rõ, có nhịp, có dấu câu và khoảng dừng có chủ đích. Tốc độ phát âm và thời gian nghỉ là hai biến độc lập. Không kéo chậm toàn bộ audio để chữa đọc liền mạch; không cắt sạch khoảng lặng chỉ để video ngắn hơn. Phụ đề, tiêu điểm thị giác và hành động phải bám vào **audio cuối cùng**, gồm cả các khoảng nghỉ.

## 2. Thứ tự đọc và nguồn có thẩm quyền trong hồ sơ

| Tài liệu | Trách nhiệm duy nhất |
|---|---|
| `PLAN.md` | Mục tiêu, phạm vi, phương án được chọn, thứ tự thực hiện, quyền quyết định |
| `EVIDENCE.md` | Lỗi đã chứng minh, suy luận, phản chứng, phân loại AI và hệ thống |
| `RESEARCH.md` | Nguồn internet đã kiểm tra; điều nguồn hỗ trợ và giới hạn |
| `LEARNING_DESIGN.md` | Thiết kế vấn đề → cơ chế → ví dụ → lỗi → sửa → áp dụng; visual contract |
| `VOICE_AND_SYNC.md` | Cấu trúc kịch bản nói, pause, xử lý WAV, alignment và đồng bộ |
| `WORKPACKAGES.md` | Gói việc, file cần xử lý, phụ thuộc, migration và bằng chứng đóng việc |
| `ACCEPTANCE.md` | Quy trình kiểm định kỹ thuật, review ngữ nghĩa, test người thật, chống PASS sai |
| `TROUBLESHOOTING.md` | Cách xác định lớp lỗi, sửa đúng nguyên nhân và kiểm lại từng loại triệu chứng |
| `LOCK.md`, `AGENTS.md`, `SHA256SUMS` | Quyền sửa, phạm vi niêm phong và phát hiện thay đổi |
| `evidence/` | Bằng chứng tái hiện và snapshot mã; chỉ đọc, không phải runtime production |

Các tên đường dẫn và CLI ghi là **ĐỀ XUẤT** chưa phải capability tồn tại. Các lệnh tái hiện trong EVIDENCE là lệnh đã chạy. Mọi số mới về pause, thời gian giữ hình hay thử nghiệm người xem là cấu hình ban đầu cần hiệu chỉnh, không phải định luật khoa học.

## 3. Phạm vi và điều không được đánh tráo

Phạm vi là hệ thống tái sử dụng: skill, references, templates, schemas, runtime motion/narration/caption, entrypoints, validators, fixtures và quy trình reviewer. Scopus/pump/Raft là bằng chứng và integration fixtures. Chỉnh đẹp riêng Scopus không hoàn thành mục tiêu này.

Giữ 1080×1920, 30 fps, preview 360×640, tiếng Việt, narration+SFX không nhạc nền, GPU NVENC theo quy tắc dự án. Giữ chuẩn nghiệm thu hiện hành Overall ≥4,50; Floor ≥4,00; Critical ≥4,30. Không hạ ngưỡng hoặc tự cấp ngoại lệ để thuận tiện render. Các giới hạn pause cũ xung đột yêu cầu mới phải được thay thế có truy vết theo VOICE_AND_SYNC; đó là thay đổi chính sách được người dùng yêu cầu, không phải lén nới gate.

Không dùng “giống Kurzgesagt” như một điểm chấm không có định nghĩa. Áp dụng quy trình nghiên cứu, sửa kịch bản, chọn ẩn dụ và animation theo voiceover được studio công bố [R01]. Không sao chép nhận diện/asset; không nhập nhạc nền chỉ vì studio dùng nhạc. Không tuyên bố đạt chất lượng tương đương studio nếu chưa có phép so sánh được định nghĩa.

## 4. Phương án được chọn và lý do

**Chọn:** thiết kế từ kết quả học → hợp đồng giải thích từng beat → animatic → calibration giọng/nhịp → master voice → alignment → motion/caption/cues → review độc lập trên artifact thật. Giữ Remotion và các thư viện hiện có có ích; sửa các điểm nối và loại đường đi sai.

| Phương án | Quyết định | Căn cứ |
|---|---|---|
| Chỉ thêm câu “không làm slide” vào skill | Bác bỏ | Quy tắc đã tồn tại trước component lỗi; F01–F05 |
| Chỉ cấm mọi hình chữ nhật, mọi đoạn đứng yên | Bác bỏ | Nhầm hình học với ý nghĩa; đồ thị hợp lệ cần node, người học cần thời gian quan sát |
| Chỉ thêm nhiều particle, camera drift, morph | Bác bỏ | Không chứng minh causal learning; F02, R03 |
| Chỉ nâng model hoặc quy lỗi AI lười | Bác bỏ như giải pháp chính | Không sửa fallback, schema, gate hay fake certification; chưa có thử nghiệm tách ảnh hưởng model |
| Viết lại toàn bộ runtime ngay | Bác bỏ ở giai đoạn đầu | Rủi ro phá phần đã dùng được, chưa cần để chứng minh phương pháp |
| Contract ý nghĩa + runtime tất định + review người thật | Chọn | Nối đúng vấn đề đã tái hiện với các lớp sửa; kết hợp nguồn R01–R13 và kiểm chứng tại dự án |

“Tốt nhất” ở đây là phương án phù hợp nhất trong các phương án đã xem xét cho repo này, không phải tuyên bố đã tìm hết internet hoặc có giải pháp tối ưu phổ quát.

## 5. Trách nhiệm và độc lập

- **Integration owner:** chủ trì tích hợp, mapping F→WP→artifact, giữ phạm vi hệ thống, bảo vệ thay đổi đồng thời.
- **Director/Content owner:** core question, luận điểm, ranh giới, ví dụ, lỗi và cách sửa, storyboard, script–visual contract.
- **Motion owner:** triển khai đúng contract; không đổi radar thành phễu vì dễ code. Nếu không thể triển khai, báo blocker cụ thể; thay đổi thiết kế phải được ghi nhận trước triển khai.
- **Audio owner:** giọng, dấu câu, pause plan, PCM, alignment cuối, provenance thật.
- **Schema/runtime owner:** canonical contracts, generator, mapping, geometry, registry, failures có thông tin.
- **Tier 2 reviewer:** không tác giả candidate; tự chạy kiểm tra, xem/nghe media và đánh giá đúng phạm vi. Không mượn tên một agent để ghi `certifiedBy`.
- **Human learner reviewer:** người thuộc nhóm khán giả mục tiêu, chưa biết đáp án; kết quả thật không được AI mô phỏng thành người thật.
- **SME:** duyệt tính đúng của giải thích chuyên ngành. Chưa có SME thì ghi “chưa xác minh”, không tự đóng khoa học bằng điểm thẩm mỹ.

Agent có thể tự kiểm lỗi khi làm việc, nhưng kiểm thử phát triển không phải token nghiệm thu độc lập. Reviewer phát hiện lỗi trả về owner phù hợp; không sửa threshold để tránh phải trả việc.

## 6. Trình tự và điều kiện chuyển giai đoạn

1. **M0 — Baseline trung thực:** snapshot, kiểm tra source/media, reproduction F01–F18; vô hiệu hóa đường cấp chứng nhận không có bằng chứng trước khi gọi candidate mới là accepted.
2. **M1 — Thiết kế và contracts:** chốt nghĩa “hiểu”, storyboard theo bước, contract mẫu, taxonomy lỗi, registry và schema. Chưa viết lại hàng loạt scene.
3. **M2 — Calibration nhỏ:** hai clip 20–45 giây ở hai kiểu cơ chế khác nhau; 30–45 giây audio thử giọng nhanh có nghỉ. Thời lượng là ngân sách thử ban đầu, không ép nội dung sản xuất.
4. **M3 — Pipeline tích hợp:** phrase→master→alignment→timeline→motion/sub/cues; templates chạy được; các negative fixtures bị chặn, positive fixtures hợp lệ vẫn qua.
5. **M4 — Candidate mới:** agent mới chỉ nhận canonical skill, brief và nguồn; topic mới, không nhận hướng dẫn vá Scopus. Ghi mọi trợ giúp ngoài tài liệu.
6. **M5 — Kiểm định học thật:** kiểm tra che chữ, full AV, giải thích lại, tìm/sửa lỗi, áp dụng; reviewer và SME theo ACCEPTANCE. Không có người tham gia thì trạng thái chờ bằng chứng, không giả PASS.
7. **M6 — Migration và release:** chạy regression, cô lập legacy, cập nhật references/callers, evidence ledger; source→render→report cùng lineage; chỉ phát hành khi đủ các bằng chứng yêu cầu.

Mỗi milestone có việc ở WORKPACKAGES. Khi thất bại: sửa nguyên nhân tại lớp tái sử dụng; chạy lại phần bị ảnh hưởng và regression liên quan. Không render đầy đủ lặp đi lặp lại trước khi animatic và audio calibration hợp lý.

## 7. Thời gian, chi phí và điều kiện phụ thuộc

Không ấn định số giờ để tạo ảo giác chắc chắn. M0–M1 ưu tiên thao tác rẻ; M2 dùng clip ngắn; chỉ M4 trở đi mới tốn master render và người review. Trước mỗi render lớn ghi số frame, cấu hình GPU, output path, source hash và lý do cần render.

Phụ thuộc thật: VieNeu/model/voice hiện cài, FFmpeg/GPU, font tiếng Việt, người xem và SME phù hợp. Thiếu phụ thuộc phải báo chính xác; không thay giọng bằng sine, không thay human bằng agent, không thay full render bằng mock pixel. Triển khai riêng bước thiết kế và kiểm thử có thể tiếp tục khi chưa có người xem; chỉ phần nghiệm thu học bị giữ lại.

## 8. Những việc bị cấm trong quá trình thực hiện

Không tạo fake narration, fake alignment, fake reviewer hoặc fake score. Không dùng rename component thành `Mechanism` làm bằng chứng. Không đánh dấu lỗi hết chỉ vì tsc hoặc helper test PASS. Không ghi đè report/candidate của project khác. Không chuyển code runtime vào `.agents/`. Không xóa source/reference có ích hoặc thay đổi concurrent edits. Không biến một fixture hiện tại thành ngoại lệ của validator. Không sửa hồ sơ đã niêm phong để phản ánh “tiến độ mới”; tiến độ nằm ngoài bundle này.

## 9. Định nghĩa hoàn tất

Hoàn tất kế hoạch tài liệu khác hoàn tất hệ thống. Hồ sơ này hoàn tất khi bằng chứng, nguồn, task, protocol và cơ chế khóa được kiểm tra và niêm phong. Hệ thống chỉ hoàn tất khi M0–M6 có output evidence độc lập; candidate mới cho thấy chuyển động giải thích thật, lời–sub–focus khớp, giọng nhanh có nghỉ đúng chủ đích, và bài làm người xem cho thấy hiểu trong phạm vi được thử.

Mọi lỗi mới phát hiện sau khi niêm phong được ghi trong một issue/log bên ngoài. Không ai được tự sửa hồ sơ với lý do “sửa nhỏ”, “cập nhật docs”, “hoàn thiện hơn”, hoặc “tiếp tục công việc”; phải có lệnh rõ ràng của người dùng cho việc sửa kế hoạch.
