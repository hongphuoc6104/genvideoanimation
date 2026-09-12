# Runbook sửa lỗi theo bằng chứng

Đây là các bước áp dụng khi triển khai kế hoạch, không phải lời xác nhận code mới đã tồn tại. Các công cụ đề xuất ở WP phải được xây trước khi gọi. Không chạy render lớn để thử ngẫu nhiên khi chưa xác định lỗi thuộc lớp nào.

## Quy trình chung cho mọi lỗi

1. Ghi candidate ID, source hash, command, lỗi, timestamp/frame, audio/visual/sub liên quan.
2. Phân biệt lỗi nội dung, thiết kế, source implementation, timing, media stale, decoder hoặc gate. Không mặc định sửa TSX đầu tiên.
3. Tái hiện nhỏ nhất nhưng vẫn giữ điều kiện gây lỗi. Giữ bản trước sửa để so sánh.
4. Truy root cause về instruction/template/contract/runtime/gate; sửa layer tái sử dụng nếu lỗi có thể lặp ở topic khác.
5. Kiểm bằng đối chứng âm/dương; tạo artifact nhỏ và reviewer xem/nghe phần bị ảnh hưởng.
6. Invalidate và regenerate descendants đúng; không dùng report trước sửa.
7. Review regression liên quan và canonical check candidate cuối. Ghi implemented khác output_verified; chưa có bằng chứng không đóng.

## A. Video có nhiều ô chữ, dù đã dùng Smart Primitives

1. Xem bản che chữ B1/B2; ghi chính xác quan hệ nào mất. Không chỉ nói “xấu”.
2. Đọc beat contract và narration tại thời điểm đó; xác định động từ/điều kiện/kết quả cần được nhìn thấy.
3. Mở scene và component được import; tìm prose arrays, mapping index→active card, particle loops không có điều kiện.
4. Hỏi: nếu bỏ thẻ, có entity nào thực hiện đúng hành động không? Nếu không, lỗi là thiết kế/implementation, không phải padding.
5. Thiết kế lại before→trigger→action→after trên cùng entity, chọn representation phù hợp. Dời phần giải thích sang narration; giữ anchor khi cần.
6. Animatic đoạn sửa, test B1/B2 với người không biết đáp án. Không “chữa” bằng đổi rect thành circle hoặc đổi tên component.
7. Bổ sung negative fixture loại lỗi này; thử positive diagram tương ứng để tránh cấm mọi hộp.

## B. JSON nói radar nhưng video lại phễu

1. Xác nhận đúng source/media hashes, tránh chẩn đoán source mới trên MP4 cũ.
2. So `beatId`, `shotId`, entity IDs, action contract với component registry và props nhận vào.
3. Nếu nhiều beat chỉ map vào một `activeIndex`, kiểm nội dung có thực sự là nhiều bước cùng cơ chế không. Nếu là cơ chế khác, mapping hiện tại sai.
4. Triển khai representation/event tương ứng hoặc quay Director sửa contract có lý do; không sửa JSON sau render để hợp thức hóa video.
5. So frame/clip trước–trong–sau event, reviewer gọi đúng biến đổi. Chạy schema chỉ là preflight.

## C. Người xem nói “đẹp nhưng không biết vì sao”

1. Thu câu trả lời thật, không chỉ điểm satisfaction.
2. Xem prerequisite có thiếu không; nếu thiếu, thêm định danh nền có chủ đích.
3. Tách action thấy được và causal rule đang bị giấu. Xem lời chỉ mô tả “A rồi B” hay giải thích vì sao A làm B.
4. Thêm một phản ví dụ: bỏ A/đổi điều kiện; cho thấy B đổi ra sao. Không thêm đoạn văn tổng kết thay cho thử nghiệm.
5. Cho worked example cùng object xuyên suốt; sau đó tình huống mới. Kiểm người xem có giải thích được khác biệt, không chỉ nhớ màu.
6. Nếu vẫn không hiểu, giảm số quan hệ mới đồng thời hoặc chia đoạn; giữ scope đã hứa, cho thời lượng tăng khi cần.

## D. Giọng nhanh nhưng đọc tuột hết câu

1. Nghe raw và master cùng đoạn; xác định lỗi từ viết câu/TTS hay từ DSP.
2. Kiểm punctuation có bị tokenizer làm mất không; kiểm phrase boundaries và pause metadata.
3. Đo native gap trước/sau GAP_CHAIN và tempo; so actual speech-free gaps với pause plan.
4. Nếu filter rút pause: bỏ broad cap trên authored pause, chỉnh adapter và giữ phép đo; không chỉ giảm speed toàn video.
5. Nếu TTS không ngắt tự nhiên: sửa cấu trúc câu hoặc synth phrase ở boundary ngữ nghĩa; giữ pronunciation context.
6. Hòa giải pause tự nhiên/PCM tránh double; ghép lại rồi align master cuối và rebuild downstream.
7. Người Việt nghe lại 1×: lời còn nhanh, câu có kết, chuyển hướng có nhịp, không bị cắt phoneme. Header/LUFS không đóng lỗi này.

## E. Có pause nhưng nghe đứt đoạn, chậm và máy móc

1. So articulation rate với overall rate, xem đã hạ tempo và thêm gap cùng lúc chưa.
2. Kiểm có chèn target nguyên vào native gap đã đủ không.
3. Xem phrase bị cắt giữa cụm từ/tên thuật ngữ hoặc mọi dấu phẩy đều cùng một gap dài.
4. Gom lại cụm cần prosody liền, chọn pause theo vai trò. Trả tempo phần lời về calibration phù hợp.
5. Kiểm điểm nối nghe click, mất hơi hoặc đổi màu giọng; synth lại phrase khi cần thay vì giấu bằng SFX.
6. So A/B cùng nội dung, không đổi nhiều biến một lúc. Ghi lý do chọn bản cuối.

## F. Sub khớp từng từ nhưng hình nói chuyện khác

1. Chọn một từ chỉ tác nhân, một động từ và một từ kết quả.
2. Trace wordID→phraseID→eventID→entityID trong timeline; không chỉ xem caption renderer.
3. Kiểm global/local frame; Sequence đã dịch frame thì hook không được trừ lần nữa.
4. Kiểm action có lấy progress thật hoặc vẫn `frame/N`, `frame%N`, index của scene khác.
5. Neo lại action apex theo event và giữ kết quả qua pause; kiểm cả before/after để tránh action bắt đầu quá muộn.
6. Đổi một pause hoặc mệnh đề rồi regenerate, xác nhận mapping vẫn đúng mà không sửa tay frame TSX.

## G. Caption tràn, bốn dòng, đè hình

1. Đọc group lines và real DOM lines; hai dòng JSON có thể wrap thành bốn.
2. Đo font/glyph/bounds với font đã load và transforms thật; kiểm safe zone lấy cùng config.
3. Chia cụm theo nghĩa/word alignment, không giảm font; sửa wrap policy để không tạo dòng ngoài dự kiến.
4. Kiểm overlap group timestamps và caption cuối treo sang câu mới; không dùng tốc độ đọc999CPS như số đo nghĩa nếu group duration invalid.
5. Render lại các boundary samples và đoạn dài nhất; check ở360×640 thật cùng full AV.

## H. Cảnh nhảy/ghosting hoặc đối tượng đổi danh tính

1. Xem event boundary từng frame; tách hardcut có chủ đích với nhảy ngoài ý muốn.
2. Kiểm mount/unmount, React keys, local frame reset, state persistent và opacity ancestors.
3. Nếu entity cần liên tục, giữ ID/pose có mapping; nếu phải thay, có transition truyền quan hệ rõ.
4. Thay CSS transition wall-clock bằng frame math; test seek trực tiếp và render frame theo thứ tự khác.
5. Không thêm mọi beat start vào whitelist. Review nghĩa của chuyển cảnh trước khi chấp nhận spike.

## I. Gate PASS nhưng người xem/ảnh cho thấy sai

1. Không tranh luận bằng điểm PASS. Xác nhận candidate report đang chấm đúng artifact.
2. Lấy frame và contract cụ thể; tái hiện ở CLI gate đó.
3. Tạo negative fixture nhỏ nhất và positive control. Ví dụ hai span ± một SVG rect.
4. Xác định detector thiếu gì: SVG text, imports, dataflow, runtime properties, temporal samples, hoặc semantic review.
5. Sửa detection và trạng thái REVIEW_REQUIRED; không hardcode ngoại lệ scene đang lỗi.
6. Nếu detector đã flag nhưng report vẫn PASS, sửa aggregation/status để confirmed critical không bị trung bình hóa.
7. Chạy lại trên source/media thật; report score lấy kết quả thực, không hằng số.

## J. Render đúng lệnh nhưng ra nhầm video/asset cũ

1. Đối chiếu requested project/composition với registry và output manifest.
2. Nếu thiếu match mà code chọn first composition/Scene1: fail, sửa mapping, không đổi tên file đầu ra để che lỗi.
3. So text/WAV/alignment/caption/timeline hashes với composition assets thật, gồm publicDir/staticFile path.
4. Invalidate cache theo config/content. Không `touch` file để qua freshness.
5. Render candidate mới ở path mới; parity chỉ có ý nghĩa khi master/preview đúng lineage.

## K. Audio không có lời, sai giọng hoặc lệch sau mix

1. Nghe WAV nguồn và audio track MP4, đo track tồn tại và duration.
2. So engine/voice/text hash với manifest. Nếu sine/silence được gắn profile narration, reject; giữ làm negative evidence.
3. Kiểm missing-file fallback trong mixer; không cho output silence mặc định5s.
4. Kiểm master voice và premix có dịch/tempo/pad không; nếu có thay đổi timing, regenerate mapping hoặc bù offset có bằng chứng.
5. SFX không được phát hai lần; track source và owner chỉ một. Review loudness/true peak cuối, không chỉ metadata.

## L. Kiểm định cần người nhưng chưa có người

Không dừng toàn bộ development; tiếp tục unit/integration, artifact prep và reviewer AI trong phạm vi cho phép. Giữ `HUMAN_LEARNING_UNVERIFIED`/SME chưa xác minh. Lập danh sách câu hỏi và files cần review; xin người dùng tổ chức người tham gia khi cần. Không tạo tên, câu trả lời hoặc điểm người giả. Không sửa kế hoạch frozen để xóa điều kiện review.
