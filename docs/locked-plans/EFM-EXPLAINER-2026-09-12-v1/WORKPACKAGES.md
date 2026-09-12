# Gói việc triển khai và migration

Tất cả WP dưới đây là kế hoạch, chưa được thực thi bởi việc tạo hồ sơ này. Thực hiện khi người dùng ra lệnh triển khai. Không cần hỏi lại cho các thao tác đã được lệnh triển khai cho phép; yêu cầu thay đổi scope/plan vẫn theo LOCK. Mỗi WP ghi tiến độ ở workspace/log riêng ngoài bundle đóng băng.

## WP01 — Danh tính project, artifact và kết luận trung thực (P0; M0)

**Owner:** Integration + runtime; **review:** Tier2. **Liên quan:** F08,F15,F16,F20. **Đầu vào:** snapshot source, package scripts, registry/compositions, reports và WAV/MP4 hiện có.

1. Chụp HEAD/diff/hashes mà không sửa concurrent work; đánh dấu report cũ là historical trong index active, giữ bản gốc.
2. Bỏ tự ghi `certifiedBy` và score cố định khỏi `scripts/run-production-gate.ts`; report chỉ tổng hợp kết quả đo và receipt reviewer thật.
3. Tạo registry project duy nhất: ID→projectDir→composition→source entry→audio/sub assets→dimensions/fps. Unknown/multiple matches phải fail.
4. Bỏ fallback composition đầu tiên trong render-production và fallback Scene1 trong film/template. Thiếu shot component chỉ rõ ID/path rồi dừng.
5. Output theo `out/<project>/<candidate-id>/`, report riêng từng run; không ghi đè `out/qa-report.json` của project khác. Candidate ID gắn lineage manifest.
6. Source, config, fonts, engine/model/profile, narration text/WAV, alignment, captions, timeline, shot spec, master, preview và report có SHA-256. Cache hit dựa content/config, không mtime đơn lẻ.
7. Thay đổi artifact upstream làm downstream stale; gate phải nêu cần regenerate gì, không chỉ báo “file có tồn tại”.

**Đóng WP:** sai project/shot ID đều fail; đổi narration khiến render cũ không được nghiệm thu; hai project không ghi đè report; reviewer vắng mặt không được gọi certified. Unit test không đủ: chạy CLI trên fixture isolated có manifest thật.

## WP02 — Một canonical skill và trách nhiệm tài liệu (P1; M1)

**Owner:** Content/system architect; **review:** fresh reader. **Liên quan:** F01,F14,F16,F17.

1. Inventory tất cả active docs, duplicate skills, schema, template, script, project và runtime; ghi KEEP/MIGRATE/ARCHIVE/REMOVE, caller, replacement, trạng thái.
2. Canonical skill giữ tại `.agents/skills/educational-flat-motion/SKILL.md`; references được module hóa theo creative, voice, QA, migration. Clean-room có loading map bắt buộc phần liên quan, không “chỉ SKILL/templates” rồi bỏ motion grammar.
3. Runtime schemas ở `schemas/production/` (ĐỀ XUẤT), config ở `config/production/`; docs link vào schema, không duplicate definition. Không import runtime từ `.agents/`.
4. Đồng bộ thuật ngữ một ý/beat với cặp quan hệ nhiều entity; giải thích rõ card prose vs graph node/label hợp lệ; bỏ yêu cầu dùng đủ 5 primitives mọi scene.
5. Giữ quy tắc học/nguồn/nhịp/QA thay vì mở rộng vô hạn danh sách component bắt buộc. Các rule phải gắn failure mode và cách kiểm, không chỉ khẩu hiệu.
6. README root/connection-film và AGENTS phải trỏ đúng lệnh production project-aware. Phương án CLI chọn: giữ `npm run gate -- --project=<id-or-real-path>` với resolver dùng cùng registry; `v3.3:gate` nếu còn chỉ là alias tương đương có cảnh báo deprecated, không được chạy legacy thay active.
7. Bản worker/challenger là lịch sử, tách khỏi skill discovery và thêm index non-authoritative; không xóa trước khi kiểm caller/import và giữ evidence cần thiết.

**Đóng WP:** một người/agent mới chỉ theo docs hiện hành biết chính xác đầu vào, bước, lệnh, output và dấu hiệu fail; link checks sạch; không còn hai định nghĩa active mâu thuẫn không có adapter.

## WP03 — Hợp đồng giải thích và storyboard (P0; M1)

**Owner:** Director + Content; **review:** Tier2 semantics. **Liên quan:** F02,F03,F07,F18.

1. Chốt learning objective, prerequisite, misconception, source map, câu hỏi kiểm tra trước script.
2. Viết các bước theo LEARNING_DESIGN; phân biệt ví dụ/sai lầm/giới hạn, không biến mọi topic thành cùng một metaphor.
3. Tạo schema cho entity/action/before/after/trigger/narration anchors/focus/verification; ID bền vững.
4. Validate reference integrity: claim/phrase/beat/shot/entity có thật; state transition khớp; range time không mâu thuẫn.
5. Storyboard hiển thị before/action/after thật; note điều quan trọng cần thấy trong video, không chỉ screenshot “đẹp”.
6. Animatic chuyển động + scratch voice; review B1/B2, ghi lỗi và sửa trước master.
7. Receipt animatic ghi hash candidate, reviewer, timestamp, scope, open issues. Đổi script/visual contract đáng kể invalidates receipt liên quan.

**Đóng WP:** reviewer đối chiếu được từng claim→hành động→kết quả→câu hỏi học; cơ chế bị thiếu không được bù bằng đổi màu thẻ. Animatic không phải toàn bộ output của milestone generalization.

## WP04 — Schema/registry/compiler và scaffold chạy được (P1; M2–M3)

**Owner:** runtime/contracts; **review:** independent implementation agent. **Liên quan:** F14,F15,F20.

1. Generator tạo project thật, các file bắt buộc, registry mapping, static assets, template body đúng. Placeholder trong template không tự là bug; bug cần chặn là không có quy trình thay placeholder được kiểm chứng.
2. Sửa phase0/phase1, font floor, `frame%150`, unknown scene fallback; ví dụ scene phải thực hiện một quan hệ có nghĩa, không chỉ node text.
3. Một compiler time: samples→seconds→absolute frames; local=absolute-shotStart; end convention [start,end) thống nhất.
4. Beats dùng seconds/frames qua adapter chuẩn; không hai nhánh offset khác nhau. Missing/sort/overlap/gap phải có policy rõ.
5. Runtime types không `any` cho contract trọng yếu; JSON được parse/validate trước render.
6. New topic scaffold run từ clean checkout với dependency/profile rõ; không dựa file absolute ở máy tác giả.

**Đóng WP:** agent mới tạo minimal candidate từ docs; đổi phrase và pause không cần sửa timing TSX; unknown IDs fail; sai duration/end range fail; positive layout graph/cycle/flow đều có đường triển khai.

## WP05 — Giọng nhanh, dấu câu và pause (P0/P1; M2–M3)

**Owner:** Audio; **review:** Tier2 acoustic + người Việt nghe. **Liên quan:** F09,F11,F12,F13.

1. Kiểm version engine thực, profile và WAV format; không tự nâng dependency khi chưa có lý do.
2. Một canonical voice policy; Python và TS đọc cùng config hoặc adapter có test parity. Bỏ role pauses bị định nghĩa độc lập.
3. Theo VOICE_AND_SYNC: raw phrase→đo→tempo→hòa giải native/authored pause→master→alignment. Không constant250ms bỏ qua chunk metadata.
4. Cache key gồm text/punctuation/voice/model/tempo/pause/DSP; lưu raw và lineage đủ tái hiện.
5. Bộ calibration 30–45s có câu ngắn/dài, phẩy, đối lập, câu hỏi, thuật ngữ và khoảng giữ hình. So sánh giữ articulation, thay pause; người dùng chọn/duyệt nhịp hoặc review theo preference đã có.
6. Triển khai các negative/control tests trong VOICE_AND_SYNC; fixture sine chỉ chạy trong test namespace, không route production.
7. Đo output master và track mux cuối; không suy audio thật từ metadata khai báo.

**Đóng WP:** nghe không liền tuột, không chậm kéo; native gap không bị double/cắt mất chủ đích; authored gap khớp policy; word transcript thật; owner/reviewer khác nhau. Một WAV header đúng không đủ.

## WP06 — Alignment, captions, focus và cues (P1; M3)

**Owner:** Caption/timeline; **review:** Tier2 AV. **Liên quan:** F10,F13,F20.

1. Align master cuối, map display/spoken tokens rõ và cấm proportional fallback trong production.
2. Fail khi token thiếu/đúp, timing invalid hoặc confidence ngoài policy; giữ diagnostics để sửa phrase, không tự rewrite claim.
3. Captions segment theo nghĩa + measurement font; không để 2 dòng logic wrap thành4 dòng thực.
4. Thống nhất zone/font trong config; test transformed parent scale, SVG/HTML, tiếng Việt dài và code terms.
5. Word/phrase event→focus/action/entity ID; kiểm anchor “nguyên nhân”, “kết quả”, “nhưng” đúng cảnh, không phải chỉ caption highlight đúng chữ.
6. Pause có visual hold owner và caption transition hợp lý; không treo chữ sang câu mới, không chuyển ý trong lúc nghỉ.
7. Audio PREMIXED single owner; SFX theo cue, không che narration hoặc khoảng chờ.

**Đóng WP:** test narration-change và pause-change end-to-end qua WAV, alignment, timeline, MP4; reviewer xem/ nghe những điểm chuyển câu và hành động. Lưu drift thực và tolerance của phương pháp đo.

## WP07 — Motion runtime và geometry có ý nghĩa (P1; M2–M3)

**Owner:** Motion/art; **review:** Tier2 frame + semantics.

1. Animate theo frame/event [R08,R09]; không CSS transition wall-clock cho production.
2. Geometry functions và render path dùng cùng state; không helper giữ thanh rigid nhưng TSX dùng công thức khác.
3. AutoPill đo text và padding; connector clip tới đúng shape hiện thời, route tránh label thứ ba khi cần; không tuyên bố clip2 endpoints giải quyết mọi giao cắt.
4. SafeStageZone rõ HTML/SVG, đo overflow; không chỉ clip che mất nội dung rồi báo zero collision. Bị cắt vẫn là defect.
5. OpaqueCard không thể vô hiệu parent opacity; reject/migrate usage sai, không tuyên bố component con tự bảo vệ trước mọi ancestor.
6. Radial layout đo sau clamp và text metrics; stagger radius không bảo đảm mọi nhãn hết va chạm.
7. State lifecycle giữ continuity; active/dim không được làm biến mất quan hệ cần hiểu.

**Đóng WP:** small rendered cases với nhãn dài, shape chuyển động, parent transform, connector crossings; geometry và explanatory invariants kiểm trên actual candidate. Không bắt every-scene dùng cùng layout.

## WP08 — Validator không đánh tráo ý nghĩa (P0; M3)

**Owner:** Tier2 tooling độc lập với candidate authors; **review:** adversarial reviewer.

1. AST structural lint đọc visible SVG text/tspan và HTML, theo imports; không tin suffix/name/useCurrentFrame marker.
2. Bắt nguồn props/array text để tránh đổi literal sang variable né lint; chỗ không suy tĩnh được chuyển runtime measurement, không mặc định PASS.
3. DOM/frame measurements theo manifest thật: line count, bounds, focus, text/container relationship; dùng tags semantic như evidence hỗ trợ, không tin tags tác giả khai báo một mình.
4. Frame schedule gồm before/at/after events, beat endpoints, action apex, chuyển shot, caption boundaries, và sweep toàn frame cho invariant nhạy thời gian. 3frame/beat chỉ preflight, không chứng minh mọi frame sạch.
5. Decoder EOF/error/count mismatch phải fail; parity kiểm dimensions/fps/duration/content lineage, không chỉ mtime hoặc PSNR trung bình1fps.
6. Tách detector flag và adjudication: confirmed critical→FAIL; nghi vấn chưa review→REVIEW_REQUIRED, không có token release. Không hạ ngưỡng để tránh false positives.
7. Contract-to-render review kiểm action thực, spatial topology, meaning; không tuyên bố AST/pixel metric hiểu giáo dục thay người.
8. Fixtures âm: static spans+rect; SVG paragraph grid; fake Mechanism; motion chỉ ở caption; mismatched radar/funnel; silent/sine narration; stale video; wrong composition; missing timeline; truncated decode; timing phase mismatch. Fixtures dương: graph nhiều node, hold quan sát, comparison cặp entity, captions cần thiết.

**Đóng WP:** các lỗi âm có exit/status phù hợp, dương không bị ép thành một style; bộ gate chạy trên candidate đúng lineage, không chỉ unit mock. Ghi mọi false negative/false positive còn mở.

## WP09 — Nghiệm thu và báo cáo độc lập (P0; M3–M5)

**Owner:** Forensic reviewer; **review:** người dùng/SME cho phần tương ứng.

1. Implement statuses và 18-category mapping trong ACCEPTANCE, giữ thresholds hiện hành.
2. Report có measurements, evidence URI/hash, reviewer identity, candidate lineage, limits; missing dimension = chưa xác minh, không default5.
3. Report producer tách khỏi candidate writer; role/process identity và input hash được ghi, không giả mật mã chữ ký chỉ bằng tên trường JSON.
4. Check approved animatic và test học; full approval không được chỉ gồm technical gates.
5. Run canonical command exit0 chỉ khi tất cả required gates/reviews đủ. Legacy alias không được xuất token mới.

**Đóng WP:** cố tạo report giả/missing receipts đều bị từ chối; một frame confirmed critical không bị average cứu; chưa có người thật/SME không bị chứng nhận learning/science.

## WP10 — Calibration và chứng minh generalization (P0; M2/M4/M5)

**Owner:** Director/integration; **author candidate:** fresh agent; **review:** Tier2 và learners độc lập.

1. Calibration ít nhất hai loại quan hệ: flow/filter và trạng thái/cơ cấu; không coi Scopus sửa lại là topic mới.
2. Chọn topic mới từ nguồn đáng tin, brief gồm phạm vi/đầu vào/đầu ra học; giữ agent không nhận patch instructions riêng.
3. Lưu raw script, source map, visual plan, scratch animatic, master voice, alignment, final candidate, friction log.
4. Chạy B1/B2/B3 và protocol người xem trong ACCEPTANCE; người xem không được training đáp án trước.
5. Lỗi lặp lại ở authoring method phải quay lại WP02/03/04; lỗi engine quay WP05–08. Không vá clip rồi ghi “generalized” nếu skill chưa cập nhật.
6. Sửa/retime một phrase+pause rồi dựng lại cùng topic để chứng minh adaptation. Repeat topic khác nếu thay reusable method đáng kể.

**Đóng WP:** candidate mới có lineage thật và learner evidence trong phạm vi thử; mọi trợ giúp ngoài tài liệu được ghi; không thiếu đầu ra mà vẫn dùng benchmark cũ để thay thế.

## WP11 — Migration, cleanup, regressions (P1; M6)

**Owner:** Integration; **review:** independent regression.

1. Cập nhật callers/imports trước move/remove; kiểm asset consumers/staticFile, CLI help và docs links.
2. Root production chỉ đăng ký active registry; legacy entry riêng, không default composition fallback.
3. Archive stale entrypoints/reference copies; giữ lỗi cũ làm negative/baseline có nhãn, không gold-standard.
4. Build/typecheck + relevant unit/integration + full canonical candidate check. Không dùng PASS205 mock tests làm bằng chứng video.
5. Ledger ghi disposition decision, execution status và output verification status riêng.

**Đóng WP:** inventory không còn hai workflow active đối nghịch không giải thích; regression dùng đúng artifacts, người khác chạy docs không chọn nhầm legacy.

## WP12 — Bàn giao vận hành và bảo vệ hồ sơ (M6)

Giao canonical commands, dependency/model/font prerequisites, file outputs, recovery steps, known limits, candidate hashes và reviewer receipts. Tiến độ ghi ngoài frozen plan. Khi phát hiện lỗ hổng trong kế hoạch này: mở issue ngoài bundle, nêu tác động và đề xuất; không tự cập nhật plan. Chỉ người dùng được ra lệnh sửa kế hoạch.

## Ma trận migration theo responsibility

| Thành phần hiện tại | Disposition | Đích/trách nhiệm sau sửa | Điều kiện |
|---|---|---|---|
| Canonical SKILL/references/checklists | KEEP + MIGRATE nội dung | Giữ `.agents/skills/educational-flat-motion/` | Loading map, rule–example–gate thống nhất |
| Skill copies trong worker/challenger/teamwork | ARCHIVE | Historical metadata ngoài discovery | Có danh sách path/hash/callers; không xóa mù |
| Templates TSX/brief | REPLACE/MIGRATE | Generator + examples được chạy | Positive/negative fixtures và docs |
| Schemas trong skill | MIGRATE | `schemas/production/` đề xuất | Runtime không import `.agents/`; docs chỉ link |
| Motion-kit root/src và public exports | KEEP/CONSOLIDATE | Một public API hợp lệ | Không move runtime vào skill; kiểm consumer trước |
| Narration-kit | KEEP + REPAIR | Phrase/voice/pause pipeline | Policy shared, waveform thật |
| Caption-kit | KEEP + REPAIR | Measurement + final alignment | Không shrink/wrap bất ngờ |
| run-production-gate.ts | REPLACE logic, KEEP responsibility | Một canonical active gate | Report không giả, project-aware |
| run-v3_3-gate.ts duplicate | ARCHIVE sau caller migration | Legacy reference | Không còn default |
| run-legacy-regression.ts | KEEP as regression | `test:legacy` rõ ràng | Không cấp acceptance active |
| render-production/create-preview | REPAIR | Registry và candidate output | Missing/unknown ID fail |
| generate-raft-audio/captions dummy | ARCHIVE/REPLACE production usage | Negative fixtures có nhãn | Không được nhập narration path production |
| setup-narration-models với engine cũ | AUDIT→MIGRATE/ARCHIVE | Setup phù hợp engine thực | Không mặc định tải model khác nhu cầu |
| Legacy films và MP4 | KEEP historical | Regression/reference | Không tuyên bố đạt chuẩn hiện hành |
| Active pump/scopus/raft | MIGRATE theo WP | Integration evidence | Không phải sole deliverable |
| Reports/ledgers cũ | KEEP + historical index | Bằng chứng quá trình | Không sửa điểm cũ để làm đẹp lịch sử |
| README/AGENTS/caller docs | MIGRATE | Trỏ đúng canonical responsibility | Giữ governance rõ không hai lệnh khác nghĩa |

Danh sách file/duplicate thực tại lúc lập kế hoạch nằm trong `evidence/migration-inventory.json`. Đây là **quyết định dự kiến**, không phải trạng thái đã di chuyển/xóa.
