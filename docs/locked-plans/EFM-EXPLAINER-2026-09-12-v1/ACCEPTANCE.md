# Kiểm định thật: kỹ thuật, ý nghĩa, người học

## 1. Không nhập nhằng trạng thái

ĐỀ XUẤT các trạng thái chính: `DRAFT`, `IMPLEMENTED`, `TECHNICALLY_VERIFIED`, `SEMANTIC_REVIEW_REQUIRED`, `HUMAN_LEARNING_UNVERIFIED`, `REJECTED`, `ACCEPTED_FOR_DECLARED_SCOPE`. Không dùng một boolean `passed` để gộp mọi khái niệm.

Code compile được không chứng minh video đúng. Gate nhận SVG không chứng minh hình giải thích. Tên reviewer không chứng minh độc lập. Reviewer AI không được ghi người thật. Người học tự nói dễ hiểu không chứng minh áp dụng. SME chưa review thì phần khoa học ghi “chưa xác minh”. Khi còn required review thiếu, final release không được exit0/certified.

## 2. Ba tầng bằng chứng

**Tầng kỹ thuật:** cấu trúc, asset, time mapping, geometry, âm thanh, codec, lineage, decoder completeness, determinism. Được tự động hóa nhưng kiểm cả fixture âm và dương.

**Tầng ý nghĩa:** cơ chế thực hiện đúng claim/contract; không tráo radar thành phễu, không hạt chạy vô điều kiện gọi là lọc; visual không cần prose-card để mang quan hệ cốt lõi. Reviewer độc lập xem clip, không chỉ JSON/AST.

**Tầng học:** người thuộc audience thực sự giải thích lại, dự đoán, tìm/sửa lỗi và áp dụng. Không có người thì ghi pending. Có dữ liệu nhỏ thì chỉ kết luận trong nhóm thử, không tuyên bố hiệu quả với toàn bộ khán giả.

## 3. Quy trình trước khi chạy gate

1. Chọn candidate ID cụ thể, khóa source/config/asset hashes và provenance. Report cũ không được tự kế thừa.
2. Verify prerequisite docs/source maps, review animatic receipt và final narration alignment.
3. Xác nhận output master/preview đủ frame, đúng kích thước/fps, audio track có thật; không stale mtime-only.
4. Kiểm shader/font/assets/version determinism. Source đang thay đổi đồng thời thì tạo isolated checkout khi được triển khai; không lấy kết quả giữa hai source revision để trộn.
5. Viết sampling schedule có lý do: every relevant event boundary ±frames, action apex, starts/mids/ends, toàn bộ sweep cho continuity/geometry yêu cầu mọi frame. Log số frame thật đã đọc, không nói “all frames” nếu chỉ1fps.

## 4. Xử lý detector flags đúng

Confirmed structural/semantic critical lỗi → FAIL. Detector nghi vấn, không đủ dữ liệu → REVIEW_REQUIRED. Chỉ sau review có chứng cứ mới được phân loại false positive; reviewer phải ghi frame và lý do, không hạ threshold hoặc đổi error thành warning hàng loạt.

Không dùng danh sách beat boundaries làm whitelist mọi cú nhảy. Muốn impact phải khai báo event cụ thể, ý nghĩa, phạm vi dự kiến; so độ gián đoạn với điều đã khai báo. Không loại mọi frame khó khỏi sampling.

Không cấm máy móc mọi card/hold. Một DAG nhiều node có thể hợp lệ; một prose-card đơn cũng có thể vi phạm yêu cầu sản phẩm. Số contour/motion energy là dấu hiệu cần kiểm, không là thước đo duy nhất của meaning. Chuyển động nền không bù việc cơ chế chính thiếu.

## 5. Khung 18 nhóm đánh giá cần thống nhất khi triển khai

Đây là **mapping đề xuất để hợp nhất** yêu cầu18 nhóm trong AGENTS với các rubric khác số nhóm hiện có; không tuyên bố đây đã là schema hiện hành. WP09 phải nối từng nhóm vào bằng chứng cụ thể, giữ thresholds hiện hành Overall≥4,50; Floor≥4,00; Critical≥4,30; không tự thay một tiêu chí cũ bằng tiêu chí dễ hơn.

| # | Nhóm | Bằng chứng chính |
|---|---|---|
| 1 | Vấn đề và mục tiêu học rõ | Brief, core question, bài kiểm tra tương ứng |
| 2 | Nguồn và tính đúng chuyên môn | Claim ledger, nguồn, SME, điều kiện biên |
| 3 | Chiều sâu nguyên nhân | Chuỗi tác động trước/sau, lời giải thích vì-sao |
| 4 | Ví dụ từng bước | Worked example giữ entity và trạng thái |
| 5 | Lỗi, chẩn đoán, sửa và kiểm lại | Negative example, feedback, rerun cùng case |
| 6 | Áp dụng/chuyển giao | Bài làm mới của người xem |
| 7 | Visual mang ý nghĩa khi che chữ | B1/B2, câu trả lời người xem, clip hash |
| 8 | Motion và cơ chế trung thực | Invariants + frames/clip + SME khi cần |
| 9 | Continuity và chuyển cảnh | Object identity, event boundaries, full viewing |
| 10 | Focus đúng lời | Word/phrase→entity cues, pause holds, replay anchors |
| 11 | Đọc/nhìn được ở mobile | Actual DOM/glyph/frame geometry, floor |
| 12 | Captions chính xác/dễ theo | Word alignment, line count, timestamps, mobile review |
| 13 | Phát âm và wording narration | Nghe thật, transcript, lexical mapping |
| 14 | Nhịp/ngắt nghỉ tự nhiên | Pause plan đối chiếu waveform và người Việt nghe |
| 15 | Đồng bộ lời–hình–sub–SFX | Anchors measured, event audit, final mux |
| 16 | Audio/video delivery | WAV headers, LUFS/true peak, dimensions/codec/decode |
| 17 | Lineage/tái tạo/determinism | Hashes, config, registry, repeat render tests |
| 18 | Độ tin cậy gate và báo cáo | Negative controls, missing review fail, reviewer identity |

Không gán điểm cho nhóm chưa review; dùng null + trạng thái. Không tính trung bình bỏ qua nhóm thiếu để ra PASS. Điểm không thay absolute blocker: sai cơ chế, narration giả, sai candidate, nguồn chuyên môn critical chưa xác minh, hoặc lỗi critical đã xác nhận đều chặn release dù average cao.

## 6. Protocol người thật: chuẩn bị

Chốt audience, prerequisite và 2–3 câu trả lời đích trước khi người xem bắt đầu. Chốt đáp án/rubric trước dữ liệu; không sửa đáp án vì kết quả thấp. Tách người làm video và người chấm; hai người chấm độc lập câu mở khi có điều kiện.

Đề xuất pilot đầu **6–8 người mới thuộc audience**, đủ để tìm lỗi lặp chứ không đủ suy rộng hiệu quả dân số. Đây là lựa chọn vận hành ban đầu, không là ngưỡng thống kê từ nguồn. Không có người tham gia thì không được mô phỏng persona thành learner evidence. Tuyển/mời/liên lạc người ngoài chỉ khi được người dùng cho phép; kế hoạch này không tự gửi lời mời.

Không cho cùng một người xem full AV rồi mới dùng kết quả mute để nói hình tự đủ: người đó đã học nội dung. Dùng người khác cho diagnostic mute hoặc các cơ chế khác tương đương với thứ tự đối trọng; ghi carryover/limitations. Nếu mục tiêu là khám phá lỗi chứ không so sánh điều kiện, ghi rõ qualitative pilot, không trình bày như randomized study.

## 7. Phiên kiểm tra cụ thể

### Trước xem

Hỏi kiến thức đầu vào và một bài ngắn chưa lộ đáp án mục tiêu. Ghi người xem đã biết topic, thiết bị, kích thước, tai nghe/loa, trạng thái caption. Không dạy cơ chế trước rồi tính điểm sau như hiệu quả video.

### Trong diagnostic B1/B2

Cho xem clip cùng timing như candidate. Hỏi mở: “Bạn thấy điều gì thay đổi?”, “Cái gì tác động lên cái gì?”, “Bạn đoán bước tiếp theo là gì?”, “Dấu hiệu nào khiến bạn nghĩ vậy?”. Không gợi từ radar/lọc/khóa trước khi họ trả lời. Ghi timestamp chỗ họ nhầm. Không lấy eye gaze tự suy từ câu hỏi; nếu không có eye-tracker chỉ ghi hành vi/response quan sát được.

### Sau full AV

1. **Tái giải thích:** kể bằng lời của mình, không mở lại script.
2. **Tái dựng:** sắp xếp các trạng thái hoặc phác quan hệ chính.
3. **Nhân quả:** bỏ/thay một điều kiện thì kết quả đổi thế nào, vì sao?
4. **Ví dụ gần:** cùng cấu trúc, dữ liệu khác.
5. **Tìm lỗi:** một quy trình có một bước sai, chỉ ra nguyên nhân, không chỉ triệu chứng.
6. **Sửa:** thay đúng bước và nêu kiểm tra xác nhận sửa thành công.
7. **Transfer:** diện mạo/tình huống khác nhưng cơ chế liên quan; phân biệt giới hạn áp dụng.
8. **Tự nhận xét:** khó ở đâu, phải pause ở đâu, giọng có dồn không. Đây là dữ liệu hỗ trợ, không thay bài làm.

Không buộc mọi câu trả lời phải giống nguyên văn narration. Đúng thuật ngữ nhưng sai quan hệ vẫn sai. Dùng từ đời thường nhưng đúng quan hệ có thể đúng; SME quyết định nơi thuật ngữ là thành phần thiết yếu.

### Sau trì hoãn

Đề xuất kiểm lại sau2–7 ngày với bài tương đương, nếu có người tham gia. Lịch là lựa chọn pilot, không khẳng định tối ưu; ghi việc người xem đã tiếp xúc nội dung khác và hiệu ứng của pre/post tests. Chưa có delayed data thì chỉ kết luận immediate comprehension, không nói retention dài hạn.

## 8. Quy tắc quyết định pilot

Chốt trước mỗi pilot các mối quan hệ critical và lỗi hiểu sai không được gây ra. Bất kỳ mẫu hiểu sai cơ chế nghiêm trọng được xác nhận do hình/lời phải trả về sửa; không lấy trung bình người làm tốt che lỗi đó. Một cá nhân trả lời sai không tự chứng minh video là nguyên nhân: kiểm prerequisite, cách hỏi và recording.

Mỗi objective ghi số người trả lời đúng/đúng một phần/sai cùng câu trả lời thật. Nếu từ2 người độc lập trở lên cùng hiểu sai một mắt xích, mở blocker thiết kế để điều tra trước release. Đây là quy tắc triage của dự án, không phải kiểm định thống kê hay bảo đảm5/6 người hiểu nghĩa là mọi người hiểu. Reviewer phải kết luận cả numerator/denominator, phạm vi audience và bất định.

Mức chấm câu mở đề xuất: 0 không đúng; 1 nhận đúng vật thể nhưng sai/thiếu quan hệ; 2 đúng quan hệ một phần; 3 đúng nhân quả và thứ tự; 4 đúng nhân quả, điều kiện và áp dụng. Không map tự động điểm này thành rubric18 nhóm; reviewer giải thích mapping và giữ ngưỡng hiện hành. Nội dung chưa đủ người/SME → chờ bằng chứng, không giảm chuẩn để phát hành.

## 9. Checklist âm thanh và AV review

Người Việt nghe 1× toàn audio; ghi các chỗ phát âm sai, câu không kết, phẩy bị nuốt, pause vô lý hoặc lời dồn vào hình. So sánh ít nhất một đoạn calibration có cùng tốc độ phát âm nhưng pause khác để tránh chữa bằng chậm toàn bộ.

Review anchors tại tác nhân, động từ và kết quả. Phân biệt karaoke highlight đúng thời điểm với action đúng ý nghĩa; cả hai phải đúng. Kiểm word end, caption end và pause hold. Kiểm loudness chuẩn hiện hành -15±1LUFS, true peak≤-1,8dBTP, 48kHz stereo PCM16 ở master; không lấy ranges lỏng hơn từ voiceProfile cũ làm chuẩn mới.

Không đo pause chỉ bằng JSON. So authored gap với PCM và speech boundary. Nếu SFX nằm trong pause, vẫn đo narration speech-free interval và nghe xem khoảng nghỉ có còn giúp xử lý thông tin hay không.

## 10. Negative tests và cách chống tự chứng nhận

Gate phải từ chối hoặc giữ REVIEW_REQUIRED phù hợp với: missing master, wrong project/shot, missing timeline, unknown voice provenance, sine masquerading as voice, caption chia đều không alignment, contract radar nhưng footage funnel, static SVG prose, fake component suffix, decode truncate, stale outputs, wrong dimensions/fps, source modified after render, reviewer receipt thiếu hoặc hash không khớp.

Có positive controls cho graph nhiều node, deliberate hold, two-entity comparison, code/equation anchors và subtitle accessibility. Nếu detector chặn những trường hợp này, sửa detector bằng tiêu chí rõ và kiểm lại cả âm/dương; không tạo ngoại lệ tên project.

Report ghi người/process tạo, người/process kiểm, input/output hashes, tool versions, lệnh, exit codes, số frame/sample, measured values, lỗi còn mở, đánh giá chưa xác minh và evidence links. Chuỗi `certifiedBy` không là chữ ký mật mã; nếu dùng signing thì phải có key/identity/trust model thực. Không được gọi SHA-256 là chữ ký người review.

## 11. Đóng finding và phục hồi khi fail

Mỗi finding F có các cột: nguyên nhân → reusable change → reproduction → candidate evidence → regression → independent verdict. Status tách IMPLEMENTED/OUTPUT_VERIFIED/UNVERIFIED. Lỗi video chỉ đóng khi artifact đúng hết lỗi và không tạo regression liên quan.

Fail nghĩa là trả về layer gây lỗi: sai nội dung→Content/SME; sai diễn đạt→Director; sai clip→Motion; sai nhịp→Audio; sai timestamp→Alignment/compiler; false-pass→Tier2 tooling. Không tự sửa text/claim để hợp thức hóa hình; không thay contract sau khi render mà không review lại. Sau sửa, regenerate descendants cần thiết, rerun gates liên quan và full release check trên candidate mới.

Hồ sơ frozen này không chứa progress cập nhật. Lưu kết quả thực hiện ở `out/<project>/<candidate-id>/` hoặc log triển khai riêng; mọi thay đổi kế hoạch phải theo LOCK.
