# Thiết kế video để người xem hiểu và làm được

Áp dụng mục tiêu trong PLAN. Đây là đặc tả thiết kế đề xuất của dự án, không phải bằng chứng đã thử trên người. Các nguồn nền và giới hạn nằm ở RESEARCH.

## 1. Viết đầu ra học trước khi viết narration

Mỗi video có một câu hỏi cơ chế trung tâm. Người soạn phải hoàn thành câu: “Sau khi xem, người thuộc nhóm X có thể giải thích vì sao Y xảy ra khi Z, và dùng điều đó để xử lý tình huống W.” Không dùng động từ mơ hồ như “nắm được/tìm hiểu” làm tiêu chí duy nhất.

Ghi rõ: kiến thức đầu vào; thuật ngữ mới; sai lầm phổ biến; điều kiện cơ chế đúng; trường hợp ngoại lệ; câu hỏi kiểm tra. Mỗi claim có nguồn và giới hạn. Chỉ bao phủ 100% **nội dung đã chốt trong scope**, không nhồi toàn bộ tài liệu gốc vào một video. Phần hoãn phải được ghi và được người dùng cho phép nếu làm thay đổi phạm vi đã yêu cầu.

Một vấn đề không được xem là “đã giải thích” chỉ vì narration đọc định nghĩa của nó. Phải có ít nhất một quan hệ nguyên nhân hoặc điều kiện, một biến đổi quan sát được và một câu hỏi mà người xem có thể trả lời sau khi hiểu biến đổi đó.

## 2. Xương sống bài giải thích

| Bước | Câu hỏi thiết kế | Hành động hình ảnh | Bằng chứng người xem hiểu |
|---|---|---|---|
| Vấn đề | Điều gì không hoạt động/khó hiểu? Vì sao cần quan tâm? | Cho thấy tình huống và hậu quả cụ thể | Người xem gọi đúng vấn đề, không chỉ đọc tiêu đề |
| Dự đoán ban đầu | Người mới thường nghĩ gì? | Thử một phương án trực quan có vẻ hợp lý | Dự đoán trước khi công bố kết quả |
| Nguyên nhân | Điều kiện hoặc quan hệ nào quyết định kết quả? | Giữ vật thể, làm lộ đường truyền tác động | Chỉ đúng vật thể và nói quan hệ vì-sao |
| Bước giải quyết 1..N | Đầu vào, thao tác và đầu ra từng bước là gì? | Mỗi thao tác tạo ra trạng thái khác có nghĩa | Sắp xếp trạng thái và chỉ ra vì sao phải theo thứ tự |
| Ví dụ đầy đủ | Áp dụng cho trường hợp cụ thể thế nào? | Theo một đối tượng xuyên suốt qua các bước | Người xem tái làm ví dụ, không cần nhớ câu thoại |
| Lỗi và chẩn đoán | Bỏ/sai bước nào gây triệu chứng gì? | Thay một điều kiện, cho thấy điểm gây lỗi | Phát hiện đúng lỗi, phân biệt nguyên nhân và triệu chứng |
| Sửa và kiểm lại | Sửa gì, vì sao sửa như vậy? | Phục hồi điều kiện, chạy lại cùng trường hợp | Nêu thao tác sửa và dấu hiệu xác nhận đã sửa |
| Áp dụng mới | Người xem có vượt khỏi ví dụ mẫu không? | Đưa dữ kiện/diện mạo mới, giữ quan hệ cốt lõi | Làm bài chuyển giao và giải thích lựa chọn |
| Khép lại | Câu hỏi đầu video đã được trả lời thế nào? | Nhìn lại chuỗi nhân quả đã diễn ra | Giải thích lại ngắn, đúng điều kiện biên |

Không biến bảng này thành chín slide cố định. Nó là các trách nhiệm giải thích, có thể kết hợp hoặc phân bố theo nội dung. Với video mô tả hiện tượng, “xử lý lỗi” là làm rõ một quan niệm sai bằng phản ví dụ; không bịa quy trình sửa máy cho chủ đề không có thao tác. Khi bước không áp dụng phải nói lý do trong brief, không lặng lẽ bỏ.

## 3. Hợp đồng một beat phải mang ý nghĩa có thể đối chiếu

ĐỀ XUẤT: đặt schema runtime tại `schemas/production/visual-explanation.schema.json`; tài liệu authoring chỉ liên kết schema này. Không đặt schema runtime trong `.agents/`.

Mỗi beat phải có:

- `beatId`, `shotId`, `claimIds`, `learningObjectiveIds`, `phraseIds`: ID bền vững; không dùng số thứ tự mảng làm định danh nội dung.
- `question`: câu hỏi nhỏ đang trả lời, không chỉ tên danh mục.
- `entities`: ID, vai trò, dấu hiệu nhận dạng, quan hệ trước và sau. Một entity đổi trạng thái giữ được identity.
- `stateBefore`, `trigger`, `action`, `stateAfter`: trạng thái cụ thể, lực/quy tắc/tác động, hành động thấy được và kết quả.
- `causalLinks`: quan hệ nào gây thay đổi nào; phân biệt cùng xuất hiện với quan hệ nhân quả.
- `narrationAnchors`: word/phrase ID cho thời điểm nhắc tác nhân, hành động, kết quả; không ghi frame trước khi có voice master.
- `choreography`: orient → cue/anticipate → action → consequence → hold/compare. Pha nào không cần thì ghi lý do, không ép spring vào mọi chuyển động.
- `focusTargets`: entity nào đang được nói tới; kiểu nhấn và phần bối cảnh cần giữ.
- `textPolicy`: anchor label, code/equation, captions; prose diễn giải đi vào narration. Mọi text có role, không đổi tag để né kiểm tra.
- `muteBlankExpectation`: với nền kiến thức nào, người xem phải suy ra quan hệ gì khi không có chữ/tiếng; điều gì chưa thể suy ra.
- `failureExample`: điều kiện bị thay đổi, kết quả dự kiến, cách sửa, hoặc lý do không áp dụng tại beat này.
- `verification`: trạng thái/quan hệ cần kiểm tra bằng toán, frame/clip hoặc người; test không được chỉ kiểm lại chuỗi contract.

Contract không tự sinh toàn bộ hình ảnh từ enum. Nó là hợp đồng để tác giả, runtime và reviewer cùng đối chiếu. Có field đầy đủ chưa chứng minh thiết kế đúng; reviewer phải xem artifact.

## 4. Ví dụ tái thiết kế đoạn Scopus mà audit đã tìm thấy

Ví dụ dưới đây là **đề xuất thiết kế**, chưa phải nội dung chuyên môn đã được SME xác nhận. Không gắn nhãn một khoảng trống là đáng xuất bản chỉ vì bộ lọc minh họa giữ lại nó.

### Beat A — Thu hẹp phạm vi

Một tập biểu tượng bài báo biểu diễn dữ liệu đã tổng hợp. Người xem nhìn thấy nhóm rộng → nhóm cùng chủ đề → nhóm hỏi cùng một quan hệ. Camera theo một đối tượng từ tập lớn vào cụm nhỏ; các đối tượng không phù hợp đi sang vùng loại có lý do trực quan. Lời dẫn nêu tiêu chí. Không dùng ba khung chữ để thay thế ba thao tác.

### Beat B — Lập bản đồ và phát hiện mâu thuẫn

Giữ nhóm bài báo đã chọn. Chuyển cùng các đối tượng lên các trục được định nghĩa từ nội dung nguồn, không đổi sang một tập hạt vô danh. Hai kết quả liên quan nhưng khác nhau được nối về điều kiện nghiên cứu khác nhau. Trục/nhãn chỉ làm định danh; lời nói gánh phần giải thích. Khi nói “mâu thuẫn”, focus đúng cặp kết quả; khi nói “điều kiện”, focus đúng khác biệt, không chỉ làm sáng card “Dòng nghiên cứu”.

### Beat C — Đánh giá ứng viên khoảng trống

Một ứng viên có ID đi qua từng câu hỏi đánh giá. Chỉ ra ứng viên không liên hệ câu hỏi cốt lõi; ứng viên khác chưa có bằng chứng lặp lại; ứng viên còn lại cần xem tính khả thi. Mỗi quyết định có trạng thái trước/sau, lý do và giới hạn. Hạt không được đi xuyên mọi tầng vô điều kiện rồi gọi là “lọc”.

### Beat D — Lỗi, sửa, ví dụ mới

Cho một ứng viên bị nhầm là gap chỉ vì “ít bài”. Thử đánh giá: thiếu mắt xích nào? Quay lại đúng bước để bổ sung bằng chứng hoặc loại ứng viên. Chạy lại và giải thích vì sao kết quả đổi. Cuối đoạn đưa một ứng viên mới để người xem tự chọn bước tiếp theo. Không chấm đúng bằng màu xanh do tác giả gắn sẵn mà không có quy tắc nội dung.

## 5. Ngữ pháp motion và quyền tự do sáng tạo

Hình ảnh phải thể hiện ít nhất phần quan hệ cốt lõi được khai báo; không đòi mọi frame đều đổi pixel. Một cú hold đúng lúc giúp thấy kết quả. Chuyển động nền, nháy sáng và camera drift không được tính là bằng chứng cho cơ chế.

Chọn hình theo nghĩa: đường đi cho vận chuyển, hình dạng/cửa cho điều kiện truy cập, nối/đứt cho quan hệ, gom/tách cho phân loại, trace theo đường cho chu trình, dịch chuyển cân bằng cho chênh lệch. Ví dụ này không phải whitelist đóng; cơ chế mới được phép nếu hợp đồng và bằng chứng rõ.

Không bắt mọi cảnh dùng đủ AutoPill/OpaqueCard/RadialLabelGroup. Chỉ dùng khi có nhãn/hộp/bố cục tương ứng. Không cấm node hình chữ nhật trong DAG hoặc bảng đối chiếu có mục đích. Cấm văn bản giải thích trở thành nội dung chính trong các ô rồi dùng animation để trang trí. Khi cần so sánh, đồng thời giữ các đối tượng so sánh trong bố cục dễ theo, không solo-focus đến mức mất quan hệ.

Giữ identity qua các bước: màu/shape/ID có quy ước ổn định; object không biến thành object khác chỉ vì scene remount. Trước chuyển cảnh phải xác định cái gì được giữ, cái gì thay đổi và vì sao; crossfade có lý do vẫn phải chứng minh người xem không mất dấu. Không thay một lỗi ghosting bằng hard jump mất nghĩa.

Camera phải có mục đích: thấy toàn cảnh, theo hành động, phóng tới quan hệ đang nói hoặc trở lại bối cảnh. Chỉ đổi góc nếu người xem vẫn nhận ra vị trí/identity. Nhịp motion lấy từ event của lời đọc, không từ vòng lặp `frame % N` dùng cho mọi beat.

## 6. Nhấn phần đang nói

1. Lấy phrase/word event từ audio cuối.
2. Ánh xạ event sang entity ID; không suy focus từ index tùy tiện.
3. Orient trước khi gọi tên: bố trí/đường dẫn thị giác để người xem biết nhìn đâu.
4. Khi gọi tên, dùng một cue đủ rõ: viền, màu, vị trí, chuyển động hoặc đường nối. Không bắt buộc scale/glow.
5. Khi giải thích quan hệ giữa hai entity, cho phép cặp entity cùng là focus; “một ý chính” không đồng nghĩa “một vật thể”.
6. Hành động chính diễn ra khi lời đang mô tả nó, kết quả có hold để xử lý thông tin.
7. Trong pause, giữ trạng thái hoặc chờ người xem dự đoán; không lén thực hiện toàn bộ bước tiếp theo.
8. Cue trở về bối cảnh khi lời chuyển ý; không để badge cũ sáng dưới lời mới.

Thử bản không màu nhấn và bản có nhấn; nếu cue chỉ tăng nhiễu hoặc người xem chú ý sai thì bỏ cue. Không dùng salience ratio đơn lẻ để khẳng định focus ngữ nghĩa đúng.

## 7. Hai chế độ che chữ và một chế độ đầy đủ

**B1 — Che chữ, giữ tiếng:** ẩn captions và mọi chữ trên hình, giữ geometry/đối tượng. Kiểm tra lời giải thích có đi cùng đối tượng và hành động hay không. Người xem nói được điều gì xảy ra mà không đọc hộp.

**B2 — Che chữ, tắt tiếng:** cùng frame timing, không tái bố cục để làm bản test dễ hơn. Người xem phải chỉ ra thực thể nào tác động lên thực thể nào, thứ tự và kết quả cốt lõi. Không cho trước đáp án/động từ cần nói. Nếu thuật ngữ không thể suy từ hình, ghi thiếu thuật ngữ riêng với thiếu quan hệ; không tính nhầm cả hai thành một lỗi.

**B3 — Full AV:** hình + narration + captions như sản phẩm. Kiểm tra người xem giải thích vì sao, điều kiện nào, sửa lỗi ra sao, áp dụng thế nào. Không lấy B2 thay thế B3. B2 là yêu cầu chất lượng hình ảnh của người dùng; B3 mới kiểm tra thông điệp giáo dục đầy đủ.

Cách tạo bản che chữ dự kiến: render cùng composition với `textVisibility=hidden` chỉ ảnh hưởng node text; layout engine vẫn giữ kích thước gốc để tránh đổi bố cục. Reviewer kiểm tra hash scene/manifest và sample geometry giữa hai bản. Không dùng ô đen che cả cơ chế; không xóa label rồi xóa luôn entity.

## 8. Review animatic trước production

Animatic phải có chuyển động và scratch voice/cues, không chỉ contact sheet. Contact sheet dùng bổ sung để xem layout. Director/Reviewer đọc mục tiêu trước, xem clip 1×, ghi timestamp nơi không hiểu/không khớp, so với contract và thử B1/B2. Mỗi lỗi ghi điều người xem lẽ ra phải nhận ra và điều clip thực sự thể hiện.

Không tạo voice master đắt tiền trước khi hướng giải thích của animatic được review. Sau đó dùng master thật để retime; không ép audio vừa lại frame cũ. Đổi cách giải thích quan trọng sau animatic buộc review lại clip liên quan.

## 9. Thước đo “xoáy sâu”

Một video đạt chiều sâu trong scope khi trả lời được: vì sao bước này cần; điều gì xảy ra nếu bỏ nó; lỗi nào dễ nhầm; dữ kiện nào phân biệt hai khả năng; bước sửa thay điều kiện gì; kiểm tra kết quả bằng dấu hiệu nào; giới hạn ở đâu. Số phút, số thuật ngữ hoặc số paper trích dẫn không phải phép đo chiều sâu.

Không thêm đủ mọi nhánh kiến thức để trông học thuật. Giải thích từng mắt xích của cơ chế trung tâm, rồi ghi rõ điều chưa bàn tới. Tất cả ví dụ/biến thể phải quay về cùng câu hỏi, không kéo video sang danh sách kiến thức tổng quan.
