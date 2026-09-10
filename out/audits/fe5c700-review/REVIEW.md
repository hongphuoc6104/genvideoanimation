**Đánh giá thay đổi fe5c700 — hệ thống skill video giáo dục**

Phạm vi: so sánh `5a9b9a7867ef401237b80d1e9bc4cac5e4aa6170` → `fe5c700f43ebb6c12393c31436a71ea9cd1ef8b8` (107 file thay đổi). Review độc lập bởi điều phối chính và các subagent Luna high; không sửa production, không cấp chứng nhận hoặc thay đổi `qa-report.json`.

**Kết luận điều hành**

Ba video mới có cơ cấu và đồ thị thực, audio thực, khác rõ baseline card Scopus. Tuy nhiên, hệ thống đang cho điểm sự hiện diện của hình/chuyển động thay vì kiểm chứng cơ chế, ý nghĩa và sự khớp giữa lời–hình. Các lỗi topology, phase timing và phụ đề xuất hiện trong MP4 thực nhưng canonical gate vẫn PASS. Cần ưu tiên một quá trình sản xuất có bằng chứng xuyên suốt: nội dung có nguồn → mô hình giải thích đúng → animatic được review → timing chung → render và QA đúng candidate. Không nên tiếp tục lấy số video, số primitive hoặc số test PASS làm chỉ số chính của chất lượng skill.

**Đã kiểm tra gì**

- Diff code/skill/governance/gates; lần theo wrapper, scene, component, timeline, captions và WAV của ba dự án.
- FFprobe ba MP4; giải mã lấy contact sheet xuyên suốt mỗi video và các frame cụ thể 360×640.
- Render lại CRISPR frame 2160 từ HEAD hiện tại, đối chiếu frame 72s trong MP4: cùng lỗi topology và chồng chữ.
- FFmpeg EBU R128 trên toàn bộ ba WAV; metadata, duration và phân bố caption timing.
- Chạy lại canonical gate: exit 0, 14/14, 54,30 giây. [Log](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/canonical-gate.log).
- Kiểm tra SHA-256: cả 12 deliverable được liệt kê trong report hiện tại khớp hash. Không có cơ sở gọi chúng là hash giả/stale. Tuy nhiên report không liệt kê hash MP4/preview của ba video mới.
- Fixture độc lập cho semantic validator: target không tồn tại vẫn `filesAnalyzed:0, passed:true`; slide có một SVG rect nhỏ không bị phản đối; ảnh tĩnh central rectangle có thể nhận motion ratio 100% và điểm 5.
- Có đối chiếu nguồn chính thức cho một số phát biểu nội dung. Không phải fact-check toàn bộ từng câu.
- Giới hạn: chưa nghe liên tục 1× toàn bộ ba phim; không tuyên bố đã xem liên tục mọi frame hoặc hoàn tất human viewing test. Contact sheet là mẫu, còn lỗi hình học được đối chiếu thêm trực tiếp với code.

**Kết quả media**

| Film | Video duration / frames | WAV thực | LUFS | True peak FFmpeg |
|---|---:|---:|---:|---:|
| CRISPR | 99,0667s / 2.972 | 99,038083s | −15,1 | −4,8 dBFS |
| Steam | 91,6667s / 2.750 | 91,308604s | −15,0 | −4,8 dBFS |
| Git DAG | 102,8000s / 3.084 | 102,784396s | −15,0 | −4,1 dBFS |

Tất cả video 1080×1920, 30fps; WAV 48kHz, stereo, 16-bit. Cột peak là kết quả `ebur128=peak=true` (FFmpeg in nhãn dBFS trong mục True peak). Steam dài hơn WAV khoảng 0,358s, hơn 10 frame; không nhầm với phần padding AAC của container. [Hash/ffprobe media](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/reviewed-media.json).

**Các lỗi cần sửa và ý nghĩa đối với hệ thống**

**F01 — P1: cắt DNA nhưng backbone không đứt.**

[DnaDoubleHelix.tsx:79](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/crispr/components/DnaDoubleHelix.tsx:79) dịch chuyển các điểm sau vị trí cắt. Tuy nhiên hai path tại dòng 222–245 vẫn là một chuỗi liên tục: `M` chỉ tại index 0, sau đó nối toàn bộ bằng `Q`, kể cả qua điểm cắt. Thành phần bị ẩn tại dòng 144–151 là rung liên kết giữa hai base. Đây là sai biểu diễn của double-strand break, không chỉ là thiếu hiệu ứng.

[Frame MP4 72s](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/crispr-cas9-72s.png), [frame render lại từ HEAD](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/crispr-current-2160.png).

Hướng sửa hệ thống: từng cơ chế phải có tiêu chí trước–sau quan sát được; ví dụ sự kiện cắt tạo các đầu tự do và thay đổi kết nối thực. Không đòi mô phỏng phân tử chính xác, nhưng không được làm sai quan hệ đang dạy.

**F02 — P1: phần sửa chữa DNA lại quay về nhãn, và trạng thái cuối không thực hiện phép nối.**

[RepairMechanism.tsx:29](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/crispr/components/RepairMechanism.tsx:29) đặt `gapWidth=0` ở progress=1, nhưng hai đầu bên trong vẫn ở −120 và +120. Scar chỉ phủ −45..+45, còn hai khoảng hở 75px. HDR thể hiện donor bằng hộp chữ và tên cơ chế; không có quá trình sao chép đoạn vào DNA nhận. Một tên biến `progress` và chuyển động của box chưa đủ chứng minh “repair”.

**F03 — P1: chỉ báo P–V không đi theo chu trình được vẽ.**

[PVDiagram.tsx:42](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/steam-engine/components/PVDiagram.tsx:42) tính tracer bằng công thức riêng, trong khi outline tại dòng 153 dùng path khác. Ở progress=0,9, tracer=(275,220), đoạn hồi lưu của outline nằm ở y=320: chấm lệch 100px vào trong diện tích. Đây là quan hệ tọa độ sai có thể kiểm tra tự động mà không cần AI chấm thẩm mỹ.

Hướng sửa: cùng một state/path điều khiển đường cong, tracer và chú giải. Khi có piston đi cùng sơ đồ, áp suất–thể tích–van phải thống nhất với state ấy.

**F04 — P2: cơ cấu thanh nối thay đổi chiều dài để ép quỹ đạo mong muốn.**

[ParallelMotionLinkage.tsx:35](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/steam-engine/components/ParallelMotionLinkage.tsx:35) cố định `pRodX=90`, lấy tọa độ các khớp bằng công thức độc lập. Thanh C–D dài 90px khi góc=0°, nhưng khoảng 95,20px ở 14°. Mô hình cơ khí có thanh co giãn, đồng thời nhãn tuyên bố “thẳng đứng tuyệt đối”. Cần xác định rõ mô hình giản lược nào được phép và giữ đúng những bất biến cơ bản của chính mô hình đó.

**F05 — P1: timeline được khai báo nhưng choreography vẫn tự hardcode.**

[CRISPR Scene3:19](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/crispr/scenes/Scene3DualCleavage.tsx:19) dùng phase 270/540, trong khi beat 7–9 có độ dài khác. Cảnh bắt đầu tại 50,5667s đã hiện tiêu đề kích hoạt miền xúc tác; lời ở beat 7 còn giải thích R-loop và đến 58,422s mới chuyển sang hai miền cắt.

[Steam Scene3:11](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/steam-engine/scenes/Scene3ThermodynamicCycle.tsx:11) dùng 250/500 và ba nội dung P–V → linkage → flywheel. Timeline lại là nạp/giãn nở → xả/ngưng tụ → linkage+bánh đà. Ở 56s lời đang nói hóa lỏng/chân không nhưng hình đã là thanh nối. [Frame 56s](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/steam-engine-56s.png).

Hướng sửa: scene nhận beat state và phase progress từ timeline đã compile. Cần test đổi một câu narration rồi tái tạo; không sửa thủ công mốc trong TSX để khớp lại.

**F06 — P1: phụ đề tái tạo bức tường chữ và che nội dung.**

CRISPR có 12 caption groups, group dài nhất 158 ký tự; custom banner wrap cả câu lên nhiều dòng rồi đè summary bên trên. [CrisprFilm.tsx:41](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/crispr/CrisprFilm.tsx:41). [Frame 48s](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/crispr-cas9-48s.png).

Steam có 12 groups, tất cả một line, tối đa 170 ký tự. [KaraokeLine.tsx:20](/home/hongphuoc6104/Desktop/videorenderhoathinh/packages/caption-kit/src/KaraokeLine.tsx:20) dùng `flexWrap: nowrap`, gây tràn hai bên. [Frame 48s](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/steam-engine-48s.png).

Git có 24 groups ngắn hơn, nhưng nhãn SVG/code sample vẫn vượt box: [frame 32s](/home/hongphuoc6104/Desktop/videorenderhoathinh/out/audits/fe5c700-review/git-dag-32s.png). Nên dùng một caption contract chung, bố cục dựa trên kích thước render thực và một vùng nội dung có chủ sở hữu rõ; không tạo banner mới cho từng film.

**F07 — P1: Steam word timing mang cấu trúc chia đều, không có bằng chứng forced alignment.**

[captions.json:20](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/steam-engine/subtitles/captions.json:20): các từ trong group 1 dài khoảng 0,193–0,194s, group 2 0,247–0,248s, confidence đều 0,98. Chưa có nguồn alignment log để chứng minh thời điểm đó được đo từ giọng. Cần đánh dấu rõ measured/estimated; không đưa confidence cố định vào báo cáo như confidence đo được. Không dùng khác biệt schema của CRISPR/Git làm bằng chứng rằng chúng cũng chắc chắn fake alignment.

**F08 — P1: sửa dấu câu ở TTS nhưng chưa sửa hợp đồng đầu vào aligner.**

Chạy normalizer với “Đúng, nhưng vì sao?” cho spokenText đúng và các token riêng `,`, `?`, có `spokenWords` chứa dấu đó. [languageAwareTokenizer.ts:149](/home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/src/normalization/languageAwareTokenizer.ts:149). [align-multilingual.py:91](/home/hongphuoc6104/Desktop/videorenderhoathinh/scripts/align-multilingual.py:91) nhận mọi token; dòng 148–155 bỏ ký tự không phải chữ rồi thay chuỗi rỗng bằng `a`. Vì vậy punctuation đi qua đường này thành target phát âm giả. Đây là lỗi logic có thể tái hiện ở bước chuẩn bị token; chưa chạy toàn mô hình alignment để định lượng drift.

Giữ dấu trong TTS/prosody text, nhưng alignment acoustic targets chỉ chứa đơn vị thực sự được phát âm; ánh xạ punctuation trở lại display sau.

**F09 — P2: các cấu hình âm thanh tiếp tục phân kỳ.**

Python đã tăng pause cap lên 0,25 và role pauses lên 0,25–0,38. [voiceProfile.ts:27](/home/hongphuoc6104/Desktop/videorenderhoathinh/packages/narration-kit/src/audio/voiceProfile.ts:27) vẫn giữ role defaults cũ 0,16–0,24, được script Scopus truyền vào Python. Ba batch mới lại tự đặt các giá trị khác. Hành vi mặc định của pipeline và sản phẩm mới không phải một cấu hình chung. Không nên kết luận chỉ tăng pauseAfter đã giải quyết prosody nội câu.

**F10 — P1: G14 chưa kiểm tra ba sản phẩm video.**

[validate-generalization.ts:84](/home/hongphuoc6104/Desktop/videorenderhoathinh/validators/validate-generalization.ts:84) kiểm scene AST, WAV header/duration và manifest; không đọc MP4, preview, captions, parity hay temporal quality của ba film. G11–G13 vẫn chỉ vào Scopus: [run-v3_3-gate.ts:90](/home/hongphuoc6104/Desktop/videorenderhoathinh/scripts/run-v3_3-gate.ts:90). Các MP4 mới tồn tại thật, nhưng tồn tại không đồng nghĩa đã được gate xác minh. Không tìm thấy preview 360×640 riêng của ba film trong inventory hiện tại.

**F11 — P1: các bộ kiểm tra mới vẫn có false acceptance rất dễ.**

[validate-visual-semantics.ts:322](/home/hongphuoc6104/Desktop/videorenderhoathinh/validators/validate-visual-semantics.ts:322) bỏ qua path không tồn tại rồi PASS với 0 file. Một rect SVG nhỏ đủ để slide không bị coi là không có primitive. [validate-preview-rubric.ts:609](/home/hongphuoc6104/Desktop/videorenderhoathinh/validators/validate-preview-rubric.ts:609) mặc định graphic ratio=1, ảnh không chuyển động có thể thành 100%. Vùng giữa khung hình không phân biệt được text/card với đồ họa có ý nghĩa. `visualExplanationContract` chỉ được kiểm tra khi tồn tại và chỉ kiểm chuỗi không rỗng; không xác minh nội dung lời hứa.

Ngoài ra [validate-generalization.ts:119](/home/hongphuoc6104/Desktop/videorenderhoathinh/validators/validate-generalization.ts:119) bỏ qua phần loudness nếu manifest mất. Default motion-lint mới loại các scene generalization khỏi target: [motion-lint.ts:637](/home/hongphuoc6104/Desktop/videorenderhoathinh/validators/motion-lint.ts:637).

Sửa fail-open trước, nhưng đừng biến AST thành công cụ tuyên bố hiểu ngữ nghĩa. AST phù hợp phát hiện một số cấu trúc sai; reviewer và kiểm tra state phải chịu trách nhiệm phần giải thích.

**F12 — P1: skill mới còn chứa chỉ dẫn cũ xung đột với mục tiêu.**

Rule 3 vẫn yêu cầu hero visual kèm detailed body text: [SKILL.md:85](/home/hongphuoc6104/Desktop/videorenderhoathinh/.agents/skills/educational-flat-motion/SKILL.md:85). Pipeline vẫn xếp TTS trước thiết kế hình/animatic, Phase 1 vẫn yêu cầu mọi concept vào beat. Tài liệu rubric tham chiếu không được cập nhật trong commit này. Contact sheet extractor lấy frame từ video đã có; đó là công cụ review đầu ra, chưa tự tạo một vòng duyệt animatic trước master TTS.

Cần sửa nhất quán skill chính, reference rubric, templates, schema, orchestration và acceptance evidence; việc đổi đoạn triết lý mở đầu không đủ định hướng agent.

**F13 — P1: lời dẫn biến kết quả có điều kiện thành bảo đảm tuyệt đối.**

CRISPR nói NHEJ bất hoạt hoàn toàn gene gây bệnh, HDR chèn gene không tì vết. [timing.json:125](/home/hongphuoc6104/Desktop/videorenderhoathinh/connection-film/src/generalization/crispr/audio/timing.json:125). NHEJ không bắt buộc sinh indel; HDR phụ thuộc bối cảnh/hiệu suất và cần xác minh edit. [Addgene NHEJ](https://blog.addgene.org/crispr-101-non-homologous-end-joining), [Addgene guide](https://www.addgene.org/guides/crispr/).

Git nói không lưu delta và không bao giờ mất dữ liệu. Cần phân biệt logical snapshot với delta compression trong packfile; object không còn được tham chiếu có thể bị prune. [Git Packfiles](https://git-scm.com/book/en/v2/Git-Internals-Packfiles.html), [git-gc](https://git-scm.com/docs/git-gc). Đây là các câu cần sửa trước khi xuất bản, không phải lỗi phong cách.

Các source maps ghi đường dẫn curriculum PDF chưa tìm thấy trong workspace. Metadata sourceExcerpt chưa thể thay việc đối chiếu tài liệu thực. Cần claim ledger có nguồn kiểm được, điều kiện đúng và giới hạn của phép giản lược.

**F14 — P2: ba custom films chưa chứng minh hệ thống tái tạo chung.**

Ba timeline/caption schema khác nhau; Steam thiếu startSec/endSec mà preview rubric dùng để tìm beat; CRISPR/Git dùng banner riêng, Steam dùng caption-kit. Wrappers chỉ đọc ShotSpec; artwork/scenes không sử dụng chung timeline runtime. Một skill tốt vẫn có thể sinh artwork độc lập theo chủ đề; phần cần thống nhất là dữ liệu, timing, caption layout, build và kiểm tra. Không cần ép mọi chủ đề vào một DSL hình ảnh hay một template bố cục.

**Hướng thay đổi có tác động lớn nhất**

1. Đặt bản mô hình giải thích ở trước animation: mỗi câu hỏi có đối tượng, quan hệ, trạng thái trước, tác động, trạng thái sau, và giới hạn khoa học. Reviewer xem điều gì thay đổi và vì sao người xem có thể hiểu từ thay đổi ấy.
2. Rút một quá trình sản xuất chung từ ba film: một schema/timing/caption contract, custom artwork đọc state; cùng một lệnh build/audit theo project ID. Test tái tạo sau khi đổi narration, không sửa timeline bằng tay.
3. Duyệt animatic 360p có lời tạm trước master TTS. Bỏ các paragraph lặp lại narration; giữ nhãn cần thiết. Không cấm diagram tĩnh có giá trị hoặc bắt mọi beat có nhân vật.
4. Tách technical acceptance và explanatory acceptance. Technical gate đo đúng candidate; explanatory review ghi frame/time, hiểu đúng điều gì, dễ hiểu sai điều gì. Một tỉ lệ pixel không thay thế được phần này.
5. Benchmark tiếp theo đo người xem dự đoán được kết quả, không chỉ nhận ra thuật ngữ. Ví dụ xem cơ cấu Watt rồi dự đoán vì sao đặt bình ngưng riêng giảm hao nhiệt; xem Git rồi dự đoán ref nào đổi sau fast-forward.

Ưu tiên sửa F01/F03/F05/F06/F08/F10/F11/F13 trước. Cải thiện palette, thêm asset hay làm spring mượt hơn có tác động thấp hơn các mục này.

**Bổ sung bằng chứng gate từ reviewer độc lập**

- Scopus hiện có 23 beats nhưng 0 visualExplanationContract; G13 vẫn PASS, report `visualContractsValidated:0`.
- Package scripts có visual-semantics/contact-sheet, nhưng canonical entrypoint không có bước gọi chúng cho candidate Scopus. G14 có gọi semantic AST riêng cho ba thư mục scene.
- `tests/challenger_m1_m2_stress.test.ts` mới chưa được nối vào canonical adversarial runner hoặc package script. PASS bộ 12 fixture cũ không chứng minh stress suite mới đã chạy.
- Reviewer đã sao chép project vào /tmp và chỉ bỏ audio-manifest.json: validator vẫn exit 0. Đây là tái hiện thực, không chỉ suy luận từ if/else.
