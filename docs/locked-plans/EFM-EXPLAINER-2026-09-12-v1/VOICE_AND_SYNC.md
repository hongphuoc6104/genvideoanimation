# Giọng nhanh có ngắt nghỉ, đồng bộ lời–sub–hình

## 1. Hợp đồng giọng nói

Người dùng yêu cầu phát âm nhanh nhưng không đọc liền mạch. Giữ dấu phẩy, dấu chấm và điểm dừng có ý nghĩa; không kéo chậm toàn bộ video. Chất giọng mặc định vẫn là VieNeu/Adam theo dự án, nhưng tên profile trong JSON không chứng minh file thật được tạo bởi đúng engine/voice. Phải lưu provenance và kiểm tra nghe.

Phân biệt ba đại lượng: **articulation rate** tính trên phần thực sự phát âm; **speech-free pause** là thời gian không có lời; **overall rate** tính trên cả đoạn gồm nghỉ. Khi thêm pause có chủ đích, overall rate giảm là bình thường dù articulation rate giữ nguyên. Không dùng một số WPM để phủ nhận yêu cầu đọc nhanh có nghỉ. Với tiếng Việt, tokenizer tách khoảng trắng không đồng nhất với từ ngôn ngữ học; luôn ghi rõ đơn vị đang đo là âm tiết/token hoặc từ đã phân đoạn.

## 2. Bằng chứng phải sửa

| Mã | Hiện trạng đã đọc/tái hiện | Hệ quả và giới hạn |
|---|---|---|
| V01 | Python `generate-vieneu-narration.py:30` là 0,25s; TS `voiceProfile.ts:117` là 0,13s | Hai cấu hình “canonical” khác nhau; không được dựa vào comment 0,13s của Python thay code thật |
| V02 | Python role gaps 0,25–0,38s; TS role gaps 0,16–0,24s | Nhịp có thể khác theo entrypoint; phải hợp nhất hoặc chỉ rõ adapter |
| V03 | Python áp GAP_CHAIN rồi atempo (`:355-368`); pauseAfter PCM được chèn sau (`:383-386`) | Native pauses trong phrase có thể bị xử lý/rút ngắn; pause PCM hậu phrase được chèn sau tempo. Không đúng nếu nói “mọi pause đều bị atempo co lại” |
| V04 | TS pipeline ghép chunks với 250ms (`generateNarrationPipeline.ts:195-198`) | `pauseAfterMs` của chunk không được dùng ở bước ghép này; câu dài/ngắn cùng nghỉ một giá trị |
| V05 | Aligner validation chỉ warn (`generateNarrationPipeline.ts:209-216`) | Word/caption có thể đi tiếp sau alignment không hợp lệ; cần fail theo lỗi thực |
| V06 | Raft generator tạo sine, caption word times chia tỷ lệ | Không phải bằng chứng giọng tự nhiên hoặc alignment; chỉ được giữ làm negative fixture |
| V07 | TS pipeline xóa temp chunks ở `generateNarrationPipeline.ts:186–192`; Python single mode xóa raw nếu thiếu `--raw-output` (`:495–496`) | Bằng chứng trước/sau xử lý không mặc nhiên còn; phải lưu raw, post-gap, post-tempo và master cùng duration/boundary samples đến hết review |
| V08 | Python aligner có proportional fallback khi không có char bounds (`align-multilingual.py:232–236`) và khi CTC exception (`:245–259`) | Timestamp trông hợp lệ chưa chứng minh căn theo âm thanh; production phải chặn hoặc gắn draft-only rõ ràng, không nhận làm alignment evidence |

### Phép thử GAP_CHAIN có đối chứng

Đã chạy FFmpeg 7.0.2 với hai tone 440Hz dài 0,4s và gap 0,1/0,3/0,6s. Dùng nguyên chuỗi filter có `stop_duration=0.25` hiện tại, chưa dùng atempo. Kết quả duration:

| Gap input | Tổng input | Tổng output | Phần bị rút |
|---|---:|---:|---:|
| 100ms | 0,900000s | 0,899979s | 0,021ms |
| 300ms | 1,100000s | 1,057438s | 42,563ms |
| 600ms | 1,400000s | 1,057438s | 342,563ms |

Lưu `evidence/pause-probe/results.json` và WAV. Đây là fixture DSP, không phải giọng người và không được đưa vào production narration. Chứng minh filter không bảo toàn một gap 600ms; không chứng minh mọi pause trong audio người đều bị xóa sạch. Tác động thực phụ thuộc version/filter/window/tín hiệu; chạy lại chính binary production. Theo R10, tham số phát hiện và tham số giữ silence khác nhau; không suy thời lượng đầu ra chỉ từ tên biến “CAP”.

## 3. Dữ liệu authoring đề xuất: phrase và pause có ID

ĐỀ XUẤT `narration-script.json` và `pause-plan.json`, schema trong `schemas/production/`. Từng phrase có: ID, displayText, spokenText, claimIds, narrativeRole, pronunciation overrides, câu trước/sau, focusEntityIds, provider/voice, tempo preference. Từng boundary có: preceding/following phrase ID, loại dấu/semantic role, lý do nghỉ, target/min/max milliseconds, natural-gap handling, expected visual hold và priority.

Không nhét các chuỗi như `[pause 400]` vào text nếu engine chưa có API hỗ trợ. Không đưa thẻ SSML cho VieNeu rồi giả định nó hiểu. W3C SSML chỉ cung cấp mô hình phân biệt break và prosody [R11]; adapter phải kiểm chứng capability local thật trước khi dùng. Phiên bản upstream mới không tự chứng minh capability của môi trường cũ đang cài.

## 4. Cấu hình nghỉ ban đầu để calibration, không phải chuẩn phổ quát

Các khoảng dưới đây là **đề xuất thiết kế ban đầu của dự án**. Chọn theo độ khó và nghe thử, chốt profile trước khi dựng candidate. Không phải nguồn internet yêu cầu mọi dấu phẩy phải nghỉ cùng thời gian.

| Loại boundary | Vùng thử ban đầu | Công dụng |
|---|---|---|
| Phẩy ngắn/ranh giới mệnh đề nhẹ | 100–220ms | Tách cụm ý, giữ nhịp nhanh |
| Phẩy có chuyển hướng/đối lập | 180–320ms | Chuẩn bị “nhưng”, “tuy nhiên”, thay điều kiện |
| Kết câu đơn | 260–420ms | Cho người xem nhận ra ý vừa kết thúc |
| Kết bước/quan hệ quan trọng | 380–650ms | Cho kết quả hình ảnh hiện rõ trước bước tiếp |
| Câu hỏi dự đoán/nhấn phát hiện | 500–900ms | Tạo khoảng chờ nhận thức; nếu cần tự làm bài, mời pause video |
| Ví dụ phức tạp cần quan sát | Theo semantic hold được duyệt | Không ép vào cap 300ms; không mặc định nghỉ 1–2s mọi nơi |

Các mức cũ 200–400ms cho pause chung vẫn là điểm tham chiếu cho nhiều câu, nhưng không được chặn mọi semantic hold dài hơn theo yêu cầu mới. Policy mới phải phân loại authored pauses và accidental gaps; không áp một `maxSilence` lên mọi tình huống. Người triển khai không được lén sửa numeric rubric; pause policy đổi phải ghi migration diff và lý do từ yêu cầu người dùng này.

Tempo calibration bắt đầu so sánh native với mức tăng nhỏ (ví dụ 1,04–1,10× nếu cần). Không chọn mức chỉ vì đang có default 1,08. Chọn articulation nghe rõ thuật ngữ và giữ ngữ điệu; giữ cùng tốc độ articulation giữa các bản thử để đánh giá pause độc lập. Không điều chỉnh tốc độ theo từng từ làm méo prosody.

## 5. Chuỗi sản xuất được chọn

1. **Chuẩn hóa text:** giữ dấu câu cho acoustic text; phân biệt display và pronunciation text; không mất dấu tiếng Việt. Review viết câu trước TTS, tránh câu một hơi chứa nhiều nhánh.
2. **Chia phrase:** theo cụm nghĩa và chỗ lấy hơi, không cắt giữa tên riêng, cụm thuật ngữ, số thập phân hoặc quan hệ điều kiện. Không bắt buộc synth riêng mọi dấu phẩy nếu làm giọng rời rạc.
3. **Synthesize raw:** lưu engine version/model/voice hash/config/text hash; không xóa raw trước khi nghiệm thu. Lỗi engine dừng; không tạo sine/silence giả để lấp artifact.
4. **Đo raw:** sample format, thời lượng, speech intervals, pause đầu/cuối và nội bộ, lỗi phát âm. Phát hiện silence bằng năng lượng/VAD chỉ là hỗ trợ; âm vô thanh/phụ âm nhỏ không tự động bị xem là khoảng nghỉ.
5. **Sửa phát âm/prosody tại nguồn:** ưu tiên viết lại câu/lexicon hoặc synth lại phrase lỗi; không “sửa” phụ đề để khớp lời đọc sai. Voice cloning/reference chỉ khi người dùng đã có quyền dùng.
6. **Tempo phần lời:** giữ prosody trong phrase; không atempo toàn master sau khi đã chèn các pause chốt. Nếu native pause trong phrase bị đổi khi tempo, đo lại và đối chiếu plan. Không cắt waveform giữa phụ âm để ép pause bằng mọi giá.
7. **Hòa giải native và authored gaps:** đo tổng speech-free boundary sau tempo. Nếu gap tự nhiên đã đủ, không chèn thêm nguyên target. Nếu thiếu, chèn phần thiếu tại boundary sạch. Nếu quá dài, chỉ rút phần được xác nhận là ngoài chủ đích; không xóa ngắt nghĩa vì threshold đơn giản.
8. **Chèn PCM nghỉ:** số sample từ target milliseconds tại 48kHz; giữ ID/cursor cho từng khoảng. Crossfade/microfade chỉ để tránh click tại biên sạch, không chồng lời hoặc nuốt phụ âm.
9. **Ghép master voice:** cộng duration đo từ sample, không tích lũy số float đã làm tròn. Sắp xếp phrase ID đúng nguồn; thiếu/đúp phrase dừng. Mono synthesis có thể hợp lệ, nhưng delivery final phải chuyển về chuẩn stereo/PCM16 và kiểm lại file thật.
10. **DSP/loudness:** xử lý theo chuẩn delivery hiện hành, đo file kết quả. Đo lại speech boundaries vì filter có thể ảnh hưởng tail hoặc độ trễ. Không dùng sample clipping thay true-peak verification.
11. **Alignment trên master voice cuối:** dùng text đúng lời dự định; map display/spoken tokens; kiểm confidence, coverage, monotonicity, overlap, missing tokens. Aligner không được sửa factual wording. Không silent proportional fallback.
12. **Compile timeline:** frame tuyệt đối từ sample time và FPS; local frame = global minus shot start. Gap có owner (hold, transition, reflection), không vô tình kéo beat trước hoặc bật beat mới sớm.
13. **Caption và visual cues:** event của từ/cụm → entity/action/focus; subtitles theo alignment cuối; không lấy thời gian chia đều từ số từ.
14. **Mix SFX:** cues theo sự kiện, không che lời, không biến pause nhận thức thành chuỗi tiếng động dày. Không thay duration/tempo narration; nếu mix có delay phải bù có ghi nhận.
15. **Final media QA:** nghe full 1×, đo PCM/loudness, xem lời–sub–hình, kiểm audio trong MP4 và master không lệch nội dung/timing. Chỉ một owner audio root khi PREMIXED.

## 6. Ví dụ narration có chủ đích

Kịch bản minh họa kỹ thuật (chưa phải TTS output):

“Ta gửi cùng một yêu cầu hai lần, [nghỉ mệnh đề] nhưng hệ thống chỉ được xử lý một lần. [kết câu] Vì sao? [nghỉ dự đoán] Trước khi thực hiện, [nghỉ ngắn] nó kiểm tra mã yêu cầu. [giữ hình kết quả] Nếu mã đã có, hệ thống trả lại kết quả cũ.”

Các marker trong ngoặc vuông chỉ nằm trong tài liệu pause plan, không đọc thành tiếng. Khi nói “hai lần”, hình cho hai lần gửi của cùng một ID. Khi nói “kiểm tra”, focus đúng chỗ đối chiếu ID; khi nói “đã có”, hình thấy match; khoảng dừng giữ trạng thái match; khi nói “kết quả cũ”, kết quả cũ quay về. Không làm sáng cả pipeline cùng lúc. Nội dung này cần source/SME phù hợp nếu dùng làm video thực, không được giả định mọi hệ thống xử lý trùng đều bảo đảm exactly-once.

## 7. Caption không được chữa bằng giảm font

Lấy tokens từ alignment cuối; chunk theo cụm nghĩa và chiều rộng font thật. Mỗi dòng không được wrap thêm ngoài số dòng đã phân đoạn. Nếu quá rộng: chia chunk tại boundary ngữ nghĩa, tăng thời gian hiển thị theo lời nếu có thể, hoặc soạn câu gọn rõ hơn nhưng không mất ý. Không giảm font dưới floor hiện hành, không rút lời ngoài scope để ép duration.

Thống nhất subtitle zone một nguồn cấu hình. Giữ floor 52px theo skill hiện hành trừ khi người dùng ra lệnh đổi; default 44px phải được migration rõ. Kiểm real DOM/glyph bbox và decoded frame, không dùng `captionIntent.fontSize` làm số đo. Giữ đoạn nghỉ sạch: không để hai từ cuối treo khi phrase mới bắt đầu. Quy tắc zero-hang ≤2 frame hiện hành vẫn giữ; không đồng nghĩa captions phải biến mất ở mọi pause trong cùng cụm.

Phụ đề là kênh tiếp cận nội dung, không được xóa khỏi sản phẩm để “qua mute test” [R12]. Bản ẩn chữ chỉ là chế độ chẩn đoán. Nếu xuất phụ đề sidecar thì giữ cùng lineage; không đánh đồng caption cháy vào hình với toàn bộ khả năng accessibility.

## 8. Test bắt buộc và cách sửa lỗi

| Test | Negative/control | Cách sửa đúng nếu fail |
|---|---|---|
| Giữ punctuation | Câu có phẩy/chấm, số 3,14, viết tắt, mã code | Sửa tokenizer/phrase boundaries; không chèn dấu giả vào phoneme |
| Authored gaps độc lập tempo | Cùng phrase ở 1,00/1,08×, cùng gap 300/600ms | Chèn/hòa giải gaps sau tempo; không atempo master đã chốt |
| Không double pause | Raw đã có 300ms, plan 300ms | Đo native gap, chỉ chèn phần thiếu |
| Không nuốt âm nhỏ | Câu có phụ âm vô thanh/âm cuối | Không cắt tự động theo RMS đơn lẻ; review boundary và synth lại |
| Vai trò khác nhau | hook/body/turn/payoff với target khác | Dùng `pauseAfterMs` thật thay constant 250ms |
| Real narration | Silence/sine/nhầm transcript/nhầm voice | Chặn provenance thiếu; nghe và so khớp transcript; không kết luận chỉ bằng phổ tần |
| Sync sau sửa pause | Tăng một gap, giữ các phrase sau | Recompile alignment/timeline/captions/cues; kiểm không cần sửa timing TSX |
| Sync sau sửa lời | Thêm mệnh đề ở giữa | Tái synth phạm vi ảnh hưởng, invalidate descendants, render đúng asset mới |
| Audio ownership | Một SFX đã premix lại được mount | Chỉ một owner, manifest ghi premixed provenance |
| Delivery | WAV sai format/mất audio MP4/duration lệch | Fail; chuẩn hóa/encode lại và đo sau cùng |

Độ chính xác sample khi ghép PCM là kiểm tra toán. Độ tự nhiên và đúng ngắt câu là review nghe của người Việt, không được thay bằng phép đếm số pause. Chuẩn mới phải ghi tolerance của detector và version binary; không gọi khớp tuyệt đối khi phương pháp đo chỉ ước lượng.
