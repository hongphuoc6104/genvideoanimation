# Review hồ sơ trước niêm phong

Phạm vi: tính rõ ràng, đầy đủ và trung thực của **kế hoạch tài liệu**, không nghiệm thu video hay xác nhận người xem đã học. Review thực hiện trong task này bởi các subagent riêng; không có chữ ký mật mã, không gán điểm production giả.

## Vai trò đã tham gia

- Agent `skill_audit`: inventory, conflicts, phương pháp visual có sẵn và hạn chế khi truyền xuống.
- Agent `runtime_audit`: kiểm code voice/pause/alignment và phản biện tài liệu VOICE_AND_SYNC.
- Agent `qa_audit`: nguồn học thuật, kiểm logic learning protocol, bằng chứng và trạng thái chưa seal.
- Agent chính: tổng hợp, tự chạy lại probes, kiểm source/metadata của nguồn ngoài, sửa draft trước seal.

## Những điểm đã được sửa/giới hạn sau review

1. Không gọi phương pháp visual là “không tồn tại”; mô tả đứt liên kết từ contract tới implementation/gate.
2. Không gọi mọi pause bị xóa sạch. Tone probe chứng minh gap600ms bị rút khoảng342,563ms trên binary thực; không suy toàn bộ prosody người từ tone.
3. Bổ sung V07/V08, F21/F22 về raw cleanup và Python proportional fallback; không nói mọi alignment đã dùng fallback.
4. Sửa tác giả nghiên cứu worked examples thành van Gog/Kester/Paas. Phân biệt bản in2005 và online2012 của chapter Mayer.
5. Giữ B1/B2/B3 riêng; không dùng người đã xem full AV để chứng minh hình mute tự đủ; không lấy pilot6–8 người làm hiệu quả dân số.
6. Không tự động chấp nhận/loại mọi contour flag: confirmed critical fail, nghi vấn pending review; bảo vệ positive graph/hold/comparison.
7. Reviewer đầu kiểm khi copy evidence chưa hoàn tất; review sau xác nhận source manifest51 entries, anti-slide và pause probes đã hiện diện. Đã sửa path rút gọn tới evidence/anti-slide.
8. LOCK/SHA chưa có ở thời điểm draft review là bước seal còn chờ, không được gọi bundle frozen sớm. Seal được thực hiện sau khi nội dung và evidence hoàn tất.

## Giới hạn review

Không có human SME, learner study hoặc full rerender mới trong công việc lập kế hoạch. Không kiểm nghiệm mọi nguồn khoa học bằng replication. Không chứng minh điều kiện OS chống chủ máy/admin sửa file. Những hạn chế đó được giữ rõ ở các tài liệu chính và LOCK.

## Checklist trước seal

- Có yêu cầu người dùng và bảng U01–U14.
- Có findings F01–F22, classification và phản chứng.
- Có nguồn internet chính thống, mức đã đọc và giới hạn.
- Có12 WP, migration dispositions, exit criteria, future canonical paths.
- Có thiết kế từng bước/ví dụ/lỗi/sửa, mute/full AV và learner protocol.
- Có giọng nhanh có pause, native-gap handling, alignment cuối và AV sync.
- Có verifier chỉ đọc, evidence snapshot và quy định không sửa khi chưa có lệnh.
- Việc seal, hash consistency và quyền chỉ đọc được kiểm bằng máy ở bước cuối; kết quả được báo cho người dùng.
