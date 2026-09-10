# Production Project Brief (V3.4 Standard)

- **project_id**: "sodium-potassium-pump"
- **title**: "Cơ Chế Bơm Natri - Kali (Na⁺/K⁺-ATPase)"
- **target_audience**: "Sinh viên y sinh, học sinh THPT và kỹ sư đại chúng trên di động"
- **aspect_ratio**: "9:16 (1080x1920 portrait)"
- **fps**: 30
- **duration_policy**: "content-driven (tự động co giãn theo độ dài giọng đọc)"
- **audio_policy**: "narration-sfx (giọng đọc VieNeu Adam + âm thanh SFX, không nhạc nền)"
- **primary_language**: "vi-VN (bảo toàn thuật ngữ song ngữ Na⁺, K⁺, ATP, ADP, E1, E2)"

---

## 1. Câu Hỏi Trung Tâm (The Core Pedagogical Question)
> **"Làm thế nào bơm Na⁺/K⁺ có thể liên tục đẩy ngược gradient nồng độ của hai loại ion khác nhau mà không làm rò rỉ màng tế bào?"**

## 2. Ẩn Dụ Trực Quan Chủ Đạo (Hero Visual Metaphor)
> **Mô hình van đổi hướng luân phiên Albers-Post ($E_1 \rightleftharpoons E_2$)**:
> Cỗ máy phân tử protein xuyên màng hoạt động như một ổ khóa chuyển hướng không gian. Miệng van chỉ mở về một phía tại một thời điểm (mở vào trong ở trạng thái $E_1$ hoặc mở ra ngoài ở trạng thái $E_2$), không bao giờ mở thông cả hai đầu cùng lúc, ngăn chặn triệt để dòng ion rò rỉ thụ động. Năng lượng từ sự chuyển giao nhóm phosphate của ATP chính là đòn bẩy vật lý kích hoạt cú lật hình thể này.

## 3. Ranh Giới Phạm Vi (Curriculum Scope Boundaries)
- **IN_SCOPE_PRIMARY (Trọng tâm bài này)**:
  1. **Thách thức điện sinh học**: Tế bào duy trì điện thế nghỉ -70 mV; dòng khuếch tán thụ động đe dọa san bằng nồng độ ion.
  2. **Chu trình động học 6 bước**: $3\text{ Na}^+$ gắn ở $E_1 \to$ ATP phosphoryl hóa $\to$ Lật sang $E_2$ đẩy $3\text{ Na}^+ \to 2\text{ K}^+$ gắn ở $E_2 \to$ Khử phosphoryl hóa $\to$ Hồi phục về $E_1$ giải phóng $2\text{ K}^+$.
  3. **Cân bằng điện học ròng (Electrogenic Pump)**: Tỉ lệ trao đổi bất đối xứng 3 Na⁺ ra / 2 K⁺ vào tiêu tốn 1 ATP, tạo sự mất ròng +1 điện tích dương trong nội bào.
- **PREREQUISITE (Khái niệm nền đã biết)**:
  - Cấu trúc màng phospholipid kép và khái niệm gradient nồng độ hóa học.
- **DEFERRED_TO_SERIES (Hoãn lại video sau)**:
  - Cơ chế đồng vận chuyển tích cực thứ phát (Na⁺/Glucose symporter).
  - Ức chế dược lý học bởi Ouabain và Digoxin trong suy tim.

## 4. Bố Cục 4 Tầng Màn Hình Di Động (Safe Zone Layout)
- **Tầng 1 (Header)**: $y \in [120, 280\text{px}]$
- **Tầng 2 (Central Canvas)**: $y \in [300, 1320\text{px}]$
- **Tầng 3 (Status Ribbon)**: $y \in [1330, 1410\text{px}]$
- **Tầng 4 (Karaoke Subtitles)**: $y \in [1420, 1750\text{px}]$, tối đa 2 dòng, font 44px
- **Lề đáy an toàn**: $y > 1750\text{px}$
