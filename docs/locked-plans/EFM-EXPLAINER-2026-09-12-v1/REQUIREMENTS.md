# Yêu cầu gốc và bảng truy vết

## Lệnh người dùng làm căn cứ cho hồ sơ này

> lên một kế hoạch thật chi tiết rõ ràng, ghi ra file và ghi rõ vấn đề, chứng minh, và tài liệu xử lý, docs, phương án đúng tốt nhất tìm được trên internet, lỗi do AI lười, lỗi do hệ thống skill dư thừa hoặc xảy ra xung đột. ghi rõ nhất có thể, càng chi tiết càng mô tả rõ các vân đề càng tốt và không cho bất kì ai thay đổi sau khi nó hoàn thành tối đa, không có lệnh không được phép thay đổi. tôi muốn video tạo ra không phải dạng slide, tôi muốn nó là chuyển động, che hết chũ lại thì 1 con người có thể hiểu được gì, nội dung sau 1 video người dùng xem có thực sự hiểu, nó có thực sự giải thích và xoáy sâu vao vấn đề, có đưa ra vấn đề và hướng dẫn từng bước, từng bước chi tiết, từng bước xử lý lỗi, từng bước đưa ra ví dụ, từng bước trinh bày có dễ hiểu, từng bước làm nổi bậc phần đang nói có khớp với sub và giọng đọc không, từng lời nói có ngắt câu có phẩy có dừng lại không. tôi cần ngắt nghỉ như một con người thay vì cứ đọc luôn tuồng đến cuối, nhưng không có nghĩa là giọng đọc phải chậm lại, đọc nhanh nhưng ngắt nghỉ, ngắt câu, dừng sau dấu, dừng có chủ đích.

## Truy vết yêu cầu → thiết kế → kiểm chứng

| ID | Yêu cầu | Tài liệu xử lý | Bằng chứng cần sau triển khai |
|---|---|---|---|
| U01 | Kế hoạch chi tiết, ghi file | PLAN, WORKPACKAGES, TROUBLESHOOTING | Gói hồ sơ này và các WP có input/output/owner/exit criteria |
| U02 | Ghi rõ vấn đề và chứng minh | EVIDENCE, evidence/ | Source hashes, reproduction, actual frames/WAV probes |
| U03 | Phương án có tài liệu internet | RESEARCH R01–R13 | Links chính thống, giới hạn, quyết định lựa chọn có lý do |
| U04 | Phân biệt AI và skill dư/xung đột | EVIDENCE mục3–4, WP02 | Shortcut quan sát được, conflict inventory; không bịa động cơ lười |
| U05 | Không ai tự sửa sau hoàn tất | LOCK, AGENTS, SHA256SUMS, verify.py | Kiểm hash, permission audit, lệnh người dùng khi tạo revision |
| U06 | Không slide, phải là motion giải thích | LEARNING_DESIGN mục3–5, WP03/07/08 | Hành động thực thay trạng thái; negative prose/card test |
| U07 | Che chữ người thật hiểu gì | LEARNING_DESIGN mục7, ACCEPTANCE mục6–8 | B1/B2 clip, câu trả lời thật, không prompt trước đáp án |
| U08 | Xem xong có hiểu/áp dụng | ACCEPTANCE mục7 | Recall, causal explanation, error repair, transfer và limits |
| U09 | Xoáy sâu vấn đề | LEARNING_DESIGN mục1,2,9 | Vì sao, counterfactual, boundary conditions, kiểm tra kết quả |
| U10 | Hướng dẫn từng bước, ví dụ, lỗi, sửa | LEARNING_DESIGN mục2,4; TROUBLESHOOTING | Worked example + failure + correction + new case |
| U11 | Dễ theo, nổi đúng phần đang nói | LEARNING_DESIGN mục6; WP06 | Word/phrase→entity/action mapping, review focus anchors |
| U12 | Sub khớp giọng/hình | VOICE_AND_SYNC mục5,7; WP06 | Final master alignment, real DOM lines, pause-change test |
| U13 | Có phẩy, chấm, dừng chủ đích | VOICE_AND_SYNC mục3–6,8 | Pause plan đối chiếu PCM và người Việt nghe |
| U14 | Nhanh nhưng có nghỉ, không kéo chậm | VOICE_AND_SYNC mục1,4,5; TROUBLESHOOTING D/E | Tách articulation/overall rate, A/B cùng tốc độ lời khác pause |

Không được coi hoàn thành tài liệu U01–U05 là hoàn thành video U06–U14. Các bước triển khai và thử người xem còn cần lệnh thực hiện và bằng chứng thật.
