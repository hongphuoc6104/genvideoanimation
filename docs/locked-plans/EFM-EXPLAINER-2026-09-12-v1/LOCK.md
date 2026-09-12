# Niêm phong hồ sơ EFM-EXPLAINER-2026-09-12-v1

**STATUS: FROZEN**

**Thời điểm chốt nội dung (UTC):** 2026-09-11T21:44:03.883228+00:00
**Chủ sở hữu quyền quyết định:** người dùng đã yêu cầu lập và khóa kế hoạch trong task này.
**Phạm vi:** toàn bộ file và thư mục con trong bundle này, bao gồm tài liệu, code verifier, evidence, snapshots và SHA256SUMS.

## Quy tắc bắt buộc

Không sửa, xóa, di chuyển, rename, format, regenerate, thay thế, thêm file hay sửa checksum của bundle sau khi niêm phong hoàn tất nếu không có lệnh rõ ràng của người dùng cho việc thay đổi kế hoạch. Cấm AI tạo kế hoạch tự “hoàn thiện thêm”, agent triển khai tự “cập nhật tiến độ”, reviewer tự “sửa lỗi nhỏ” hoặc công cụ tự sửa hash để hợp thức hóa thay đổi.

Lệnh “tiếp tục”, “triển khai kế hoạch”, “sửa video”, “chạy test” không tự động là lệnh sửa hồ sơ frozen. Nếu phát hiện sai sót mới, ghi issue bên ngoài bundle, chỉ ra bằng chứng, tác động và đề xuất. Giữ bản này nguyên trạng. Lệnh người dùng rõ ràng có thể cho phép revision; mặc định tạo bản v2 giữ v1, với change log ghi phạm vi và lý do. Chỉ sửa tại chỗ khi người dùng yêu cầu rõ việc đó.

## Cơ chế bảo vệ thực tế

- Mọi file trong bundle được đặt quyền chỉ đọc POSIX 0444; thư mục 0555.
- SHA256SUMS liệt kê hash từng file, trừ chính SHA256SUMS để tránh vòng tự tham chiếu. Hash SHA256SUMS được giao trong phản hồi cuối của task để đối chiếu độc lập.
- verify.py chỉ đọc, phát hiện file đổi, thiếu, symlink hoặc file thêm ngoài manifest; không có chế độ repair/update.
- AGENTS.md tại bundle và thư mục cha ghi quyền thay đổi theo lệnh người dùng.
- Kiểm khả năng đặt cờ immutable trên một file tạm do cùng user sở hữu đã trả `Operation not permitted`; bundle **không có** bảo vệ chattr +i. Không tự nhận đã đặt immutable.

Đây không phải bảo đảm chống mọi chủ máy/admin. Cùng owner có thể đổi chmod; admin có thể thay dữ liệu/quyền và checksum. Không có cryptographic signature cá nhân hay kho WORM trong lần bàn giao này. Người dùng giữ root hash ở nơi độc lập sẽ phát hiện việc thay cả file và manifest. Không ai được phép thực hiện hành vi vượt khóa đó nếu chưa có lệnh, dù về kỹ thuật họ có quyền hệ điều hành.

## Kiểm tra chỉ đọc

```bash
python3 /home/hongphuoc6104/Desktop/videorenderhoathinh/docs/locked-plans/EFM-EXPLAINER-2026-09-12-v1/verify.py
```

Lệnh này không sửa file. So `Manifest SHA-256` nó in với hash đã giao trong task. Nếu khác, dừng dùng bundle làm chuẩn, báo người dùng; không tự tái tạo checksum.

## Trạng thái công việc

Hoàn tất **hồ sơ kế hoạch**, không phải hoàn tất WP01–WP12 hoặc nghiệm thu video. REVIEW.md ghi phạm vi reviewer thực sự đã xem; evidence/document-checks.json là kiểm tra tài liệu trước seal. Các đề xuất schema, CLI, pause profile và learning protocol chưa được triển khai bằng việc viết hồ sơ.

Giao dịch niêm phong lần đầu của task này gồm: ghi LOCK.md cuối cùng, tạo SHA256SUMS, áp quyền chỉ đọc, chạy verify và bàn giao root hash. Sau giao dịch đó không có auto-update. Mọi tiến độ triển khai tương lai ở ngoài bundle.
