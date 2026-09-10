# MASTER CONTEXT — GENVIDEOANIMATION

> This is a structured, faithful import of the supplied project context, not a verbatim transcript.

> Imported from the user's project handoff on 2026-09-10. This document preserves the supplied roadmap, requirements, historical observations, measurements, and acceptance rules. Historical findings are not assertions about the current checkout. Read CURRENT_STATE.md before resuming; verify live GitHub source before deciding what remains. Importing this context does not certify any production milestone.

## 0. Mục tiêu cuối cùng của dự án

Xây dựng một **Agent Skill + hệ thống Remotion hoàn chỉnh** có khả năng tự động tạo số lượng lớn video giáo dục/explainer 2D chất lượng cao.

Pipeline: TOPIC / SOURCE MATERIAL → Research / Content Understanding → Detailed Script → Narration → Semantic Beats → Visual Storytelling → Assets / Characters / Diagrams → ShotSpec → Motion → Camera / Transitions → Karaoke subtitles → Narration + semantic SFX → Render → Automated QA + Human QA → FINAL 9:16 VIDEO.

Phong cách: flat-vector educational explainer; motion/storytelling polish cao; cảm giác cinematic. Lấy cảm hứng ở cấp độ nguyên tắc từ Kurzgesagt nhưng **không sao chép character, asset, composition, palette đặc trưng, narration hoặc proprietary identity**. Generalize nhiều chủ đề, không phải template cố định.

Production: **1080 × 1920, 9:16, 30 fps**, TikTok / mobile-first, Vietnamese-first, English code-switch khi cần, content-driven duration, không giới hạn độ dài, không tự tóm tắt để ép thời lượng, narration + semantic SFX, **không background music**. Video được dài nhiều phút.

> Nội dung càng dài thì video càng dài. Không giảm font, không cắt ý, không tóm tắt chỉ để ép video ngắn.

## 1. Kiến trúc tổng thể / roadmap

- V1 = Production Skill / Director Process
- V2 = Motion Kit
- V3 = Local Narration + Karaoke + Audio
- V3.1 = Vietnamese-first Bilingual Narration
- V3.2 = Genvideo Voice Parity + No Background Music
- V3.3 = Production Integrity Hardening — ưu tiên hiện tại trong handoff; kiểm tra trạng thái mới trước khi triển khai lại.
- V4 = Vertical Visual Storytelling + Asset Factory
- V5 = Autonomous Video Factory

Sau V5 coi hệ thống lõi hoàn chỉnh.

## 2. V1 — Production Skill

Path: `.agents/skills/educational-flat-motion/`.
Name: `educational-flat-motion`; không gọi “Kurzgesagt Skill”.
Front matter: name = educational-flat-motion; description = "Create reusable educational flat vector motion videos with Remotion."

Skill là **director/process brain**, không phải runtime motion implementation.
Pipeline: brief → narrative beats → visual metaphor → storyboard / shot plan → asset / rig plan → motion spec → implementation → render → actual video QA → revision.

Director Agent phụ trách story, visual metaphor, ShotSpec, art direction, final QA. Agent architecture gồm Art Agent, Rig Agent, Motion Agent, Scene/Shot Agent, Transition Agent, Integration Agent, Render Agent, QA/Vision Agent.

Subagents không được tự thay đổi ShotSpec vì code khó; phải quay lại Director nếu muốn thay.

## 3. Skill rules ban đầu

Character: không monolithic SVG; tách root/body/head/eyes/pupils/arms/legs/hair/tail/accessories. Expression và action là hai dimensions riêng. Không full-character opacity crossfade giữa pose; pose phải transform/blend.

Motion grammar: anticipation → launch → acceleration → action → deceleration → contact / peak → overshoot → settle → secondary response.

Hierarchy: gaze leads → head → torso → arm/wing → tail/accessories trail.

Camera: push khi realization, pull khi reveal scale, pan theo gaze, follow moving subject, parallax, reframe trước subject mới; cần hold. Cấm global slow zoom chỉ để “shot không tĩnh”.

Transitions ưu tiên object match, shape morph, trajectory continuation, foreground wipe, semantic zoom, iris, camera carry, match cut. Tránh fade scene A → fade scene B, trừ khi có lý do kể chuyện rõ ràng.

## 4. Anti-patterns đã xác định

**Critical:** monolithic character; full-character crossfade; locomotion chủ yếu root translate; meaningful action thiếu anticipation/settle; mọi transition đều fade; adjacent shot continuity mismatch; implementation agent tự bịa timing không có motion spec; render xong không xem video thật.

**Major:** global slow zoom; `Math.sin()` bobbing thay acting; mọi body parts cùng chuyển động; mắt/head/body đổi hướng cùng frame; audio cue timing tách visual timing; repeated identical scene layouts; nhiều movement đồng thời giảm readability.

**Minor:** particles thiếu narrative purpose; quá nhiều màu; quá nhiều outline/detail; text thay visual metaphor khi hình giải thích tốt hơn.

## 5. V2 — Motion Kit

V2 từng hoàn thành và push GitHub: `git@github.com:hongphuoc6104/genvideoanimation.git`, branch `main`, commit nghiệm thu từng báo `0a06a41`.

V2 giải quyết canonical motion-kit, decoupled character architecture, physics/performance profiles, camera continuity, geometry morph, Bézier math, recursive AST lint, temporal render QA, ShotSpec, CueManifest, unseen benchmarks, independent rubric.

Canonical runtime: `motion-kit/`. **Không import runtime từ .agents/skills.**

## 6. V2 Character Architecture

Đã có: RigInterface.ts, CharacterController.ts, BirdRig.tsx, HumanRig.tsx, ArbitraryCustomRigAdapter.tsx. HumanRig nhiều joint, không generic bird hack.

Support pose, expression, gaze, action, facing, performance profile. Blend bằng transforms, không opacity swap.

## 7. V2 Performance Profiles

calm, energetic, playful, dramatic, solemn.
Profile điều khiển timing, squash/stretch, overshoot, follow-through, settle, responsiveness; không chỉ đổi easing.

## 8. V2 Camera

interpolateCameraHermite.ts, cameraFollowContinuous.ts.
Mục tiêu C0/C1 continuity, velocity-aware follow, damping, dead-zone, look-ahead, tránh branch switch pop. Không hard jump giữa follow và manual.

## 9. V2 Morph + Bézier

True path morph: interpolateSvgPath.ts.
Không dùng `progress < X ? <A/> : <B/>` trong transition khai báo morph.

Có quadraticBezierPoint, cubicBezierPoint, packetTravel, arc-length LUT, tangent angle. Packet phải thật sự theo Bézier nếu conduit là Bézier.

## 10. V2 Validators

validators/motion-lint.ts; validators/temporal-render-qa.ts; validators/validate-project.ts; validators/validate-shot-spec.ts.

Motion lint chuyển từ regex overfit sang AST-based recursive inspection.
Temporal QA decode MP4, đo adjacent-frame MAD, tìm spike; spike không annotated phải review.

> Temporal QA chỉ là detector, không thể tự chứng minh visual quality.

## 11. Benchmark V2 thực tế

Video từng review: benchmark-v2-human.mp4, benchmark-v2-morph.mp4, benchmark-v2-network.mp4, benchmark-v2-c.mp4.

Independent viewer-facing scores lịch sử: human ~2.9/5; morph ~3.7/5; network ~3.5/5; benchmark-c ~2.5/5 nếu coi production.
Tổng viewer-facing ~3.2–3.4/5, system-compliance có thể ~4.7–4.9/5.

**SYSTEM COMPLIANCE SCORE ≠ VIEWER-FACING QUALITY SCORE.** Không dùng test pass kết luận video đẹp.

## 12. V2.1 character continuity issue

Benchmark Human từng có spike pose transition đáng kể.
Pose và character state transition phải blend, không hard jump. Impact whitelist không cho phép pose swap tự động.
Cần joint discontinuity validator đo rotation[n]-rotation[n-1], position[n]-position[n-1], scale[n]-scale[n-1].

## 13. V3 — Narration + Karaoke + Audio

SCRIPT → Local TTS → narration.wav → forced alignment → words.json → caption segmentation → KaraokeCaptions → audio mix → Remotion.

Ban đầu Kokoro-82M / am_adam + WhisperX. Phát hiện English-first, nên V3 ban đầu chỉ phù hợp tiếng Anh.

## 14. V3 outputs / components

Narration Kit: packages/narration-kit/.
Caption Kit: packages/caption-kit/.

Outputs: script.txt, narration.wav, narration-text-map.json, words.json, captions.json, audio-manifest.json, final.mp4.

Karaoke word-level timing, current word progressive left→right fill, spoken state, upcoming state, max 1–2 lines, deterministic by frame, không TikTok bounce spam.

## 15. V3.1 — Vietnamese-first Bilingual Narration

Commit `e0d984c`: feat(v3.1): Vietnamese-First bilingual narration hardening with VieNeu-TTS.

Production TTS chính: **VieNeu-TTS v3 Turbo**.
Local, offline, no API, no credits, Vietnamese-first, English code-switch, same speaker.
Kokoro chỉ optional English fallback.

## 16. V3.1 language policy

primaryLanguage = vi-VN; secondaryLanguage = en.

Ví dụ “Research Gap là một phần quan trọng khi viết bài báo Scopus.”
Overall prosody tiếng Việt; chỉ Research Gap và Scopus pronunciation theo English.
Không cắt utterance thành nhiều voice khác nhau rồi ghép.

## 17. V3.1 Tokenizer / Lexicon

Token classes: VIETNAMESE, ENGLISH_WORD, ENGLISH_PHRASE, ACRONYM, INITIALISM, PROPER_NOUN, NUMBER, UNIT, FORMULA, MODEL_NAME.

Pronunciation modes: vi, en_word, en_phrase, en_spell, custom.

Lexicons: lexicons/academic-vi-en.yaml; lexicons/technology-vi-en.yaml; lexicons/custom.yaml.

AI/GPU/GPT → en_spell; BERT → en_word; Scopus → en_word/proper; Research Gap/Desk Reject/Web of Science → en_phrase; Q1/Q2/H-index → custom; DOI/ORCID → configurable.

Unknown acronym không được đoán im lặng: UnregisteredAcronymError.

## 18. V3.1 displayText vs spokenText

Bắt buộc tách displayText và spokenText.
Ví dụ displayText = "AI hỗ trợ xác định Research Gap."; spokenText là pronunciation-normalized form.
Caption luôn original/display text, không phonetic alias.

Một display token map nhiều spoken subunits: GPU → G → P → U.
Karaoke map ngược đúng token GPU.

## 19. V3.1 Vietnamese normalization

Không `2026 → twenty twenty-six`.
Phải `năm 2026 → năm hai nghìn không trăm hai mươi sáu`.
GPT-5, Q1, Q2, H-index do lexicon/context quyết định.

## 20. V3.1 Alignment

Loại English-only Wav2Vec2 cũ khỏi production path.
Local multilingual forced alignment: MMS_FA.

ORIGINAL SCRIPT = authoritative wording; ASR/alignment = timing evidence only.
Không để aligner rewrite caption. Không silent proportional fallback trong production acceptance.

## 21. V3.1 mobile caption defaults

1080x1920, 30 fps.
Conservative TikTok safe zone: left 72–96px; right 180–220px; top 120–140px; bottom 280–320px.
Karaoke fontSize ~56px, maxLines=2, maxCharsPerLine ~26.
Bắt buộc generate **360x640 mobile QA preview** và thực sự xem.

## 22. V3.2 — Genvideo Voice Parity

Reference repo: https://github.com/hongphuoc6104/Genvideo.
Genvideo cũng dùng VieNeu v3 Turbo. Khác biệt chất giọng nằm ở voice config, temperature, silenceP, role pacing, silence processing, EQ, compressor, limiter, loudness; không nằm ở model khác.
V3.2 commit: `51b14c2`.

## 23. V3.2 authoritative voice profile

Canonical: GENVIDEO_ADAM_PROFILE.

| Setting | Value |
|---|---|
| provider | VieNeu-TTS |
| mode | v3turbo |
| voice | Adam |
| backend | onnx |
| device | cpu |
| precision | fp32 |
| temperature | 0.65 |
| silenceP | 0.05 |

| Role | Speed | Pause (s) |
|---|---:|---:|
| hook | 1.08 | 0.20 |
| thesis | 1.08 | 0.18 |
| body | 1.08 | 0.16 |
| turn | 1.10 | 0.22 |
| evidence | 1.08 | 0.16 |
| payoff | 1.08 | 0.24 |
| close | 1.06 | 0.20 |

## 24. V3.2 voice-processing chain

Ported từ Genvideo/scripts/build_narration.py:
VieNeu raw → trim silence → cap internal generated silence around 0.13s → atempo / role-based pacing → highpass 75Hz → EQ → compressor → limiter 0.92 → loudnorm target -15 LUFS, ceiling -1.8 dBTP.

EQ: 130Hz +3.2dB Q0.9; 390Hz -2.5dB Q1.1; 2800Hz +1.8dB Q1.2; 6500Hz -2.0dB Q1.6.
Compressor: threshold -24dB; ratio 4:1; attack 5ms; release 80ms; makeup +3.8dB.

**Actual executed source authoritative**, không documentation nếu lệch. Raw VieNeu audio không phải delivery audio.

## 25. V3.2 Audio Policy

Global default: audioPolicy = narration-sfx.
Final: narration + semantic SFX + optional subtle ambience.
Không background music, BGM, looping song, melody bed.

SFX: whoosh, soft pop, click, connect, impact, paper, UI, warning, success, transition, subtle ambience.
Mỗi SFX gắn CueManifest event, ShotSpec event hoặc semantic visual event. Không random SFX.

## 26. V3.2 Scopus output

scopus-v3_2-no-music.mp4; old upload: /mnt/data/scopus-v3_2-no-music.mp4.
QA images lịch sử: /mnt/data/v32_review/contact.jpg; /mnt/data/v32_review/mobile_sheet.jpg.
1080x1920; 30fps; 3096 frames; ~103.2s.
Mục đích: Vietnamese bilingual narration, no background music, semantic SFX, karaoke, content-driven duration.
Các đường dẫn trên là lịch sử, không runtime dependency.

## 27. Đánh giá nghiêm video V3.2

Kết luận lịch sử: **FAIL production-grade**.

| Category | Approx independent score /5 |
|---|---:|
| Story structure | 3.4 |
| Composition | 2.2 |
| Mobile readability | 1.0 |
| Visual hierarchy | 1.8 |
| Character acting | 2.7 |
| Motion timing | 2.4 |
| Camera | 2.0 |
| Transitions | 1.2 |
| Narration infrastructure | 4.1 |
| Audio mix correctness | 1.8 |
| Caption readability | 3.7 |
| Audio/visual sync architecture | 1.6 |
| Portability | 2.1 |
| Validator reliability | 1.4 |
| Production generalization | 2.3 |

Không dùng implementation agent report làm final authority.

## 28. CRITICAL ISSUE — Mobile readability

V3.2 mang tư duy PowerPoint slide scaled down into vertical frame.
Meaningful production text còn fontSize 10,11,12,13,14,15,16,17,18,20,22; ví dụ GapDoorsTaxonomy.tsx, BankingCaseStudy.tsx.
Nhiều nội dung không đọc được ở 360x640.
Safe zone pass ≠ readability pass.

## 29. Rule tối quan trọng: NEVER_SHRINK_TO_FIT

Production 1080x1920 proposed minimums:

| Role | Minimum px |
|---|---:|
| HERO_TEXT_MIN | 64 |
| SECTION_TITLE_MIN | 48 |
| CARD_TITLE_MIN | 38 |
| BODY_TEXT_MIN | 34 |
| SECONDARY_INFO_MIN | 30 |
| KARAOKE_MIN | 52 |

Nếu meaningful content không vừa: **DO NOT shrink; DO NOT omit; DO NOT summarize for duration; SPLIT INTO MORE VISUAL BEATS.** Video dài ra.

## 30. One Primary Idea Per Beat

Không đồng thời 5 detailed cards + 5 descriptions + 5 examples + subtitle + mascot.
Taxonomy: overview → Gap1 → Gap2 → Gap3 → Gap4 → Gap5 → comparison recap.
Multi-step procedure: one meaningful step per beat, trừ mục tiêu comparison.

## 31. Progressive Disclosure

Không render toàn bộ nội dung ngay đầu.
Step1 appears → narrator explains → mark complete; Step2 appears → explains; ... → final recap.
Một focal idea chính tại mỗi thời điểm.

## 32. CRITICAL ISSUE — Fake content-driven timing

V3.2 ShotSpec tăng duration lên 103.2s nhưng nhiều scene giữ internal timing cũ.
Scene2: 0–90,90–180,180–270,270–360,360–450, trong khi shot ~691 frames.
Visual choreography kết thúc sớm còn narration tiếp tục. Scene3/Scene5 tương tự.

Tăng Sequence.durationInFrames không được tính là content-driven timing.
Phải retime internal action windows theo semantic narration.

## 33. Single Authoritative Semantic Timeline

Canonical: semantic-timeline.json.
Mỗi beat có id, narrationTokenRange, startSec, endSec, startFrame, endFrame, visualIntent, primaryObject, cameraIntent, transitionIntent, sfxIntent, captionIntent.

Tất cả derive từ đây: ShotSpec, Sequence boundaries, scene-local animation phases, CueManifest, SFX timing, caption grouping, transition timing.
Không ba timing source riêng: visual constants / audio constants / narration constants.

## 34. CRITICAL ISSUE — Cue / visual mismatch

Retime 80s → 103.2s nhưng CueManifest và scene internal animation giữ frame cũ; ShotSpec dùng frame mới.
Ví dụ SFX “door2” khi visual đã sang “door3”.
Cần semantic-timeline single source.

## 35. CRITICAL ISSUE — Double SFX playback

Confirmed V3.2 bug: scopus_master_audio.wav đã mix narration+SFX; ScopusExplainerFilm.tsx mount masterAudio rồi mount từng cue SFX lần nữa.
FINAL = (narration + SFX) + SFX again.

Chọn đúng một strategy:
- **PREMIXED (production default/recommended):** master.wav = narration + all SFX; Remotion mounts ONLY master.wav.
- RUNTIME_SFX: master.wav = narration only; Remotion mounts individual SFX.

Không cả hai. Cần validators/validate-audio-ownership.ts.

## 36. Audio dependency graph

audio-dependency-graph.json.
Mỗi audible asset đúng một owner/path tới final output.
Detect duplicated SFX, multiple narration masters, SFX premixed + runtime, unreferenced production music, accidental duplicate copy.

## 37. CRITICAL ISSUE — ShotSpec itself inconsistent

V3.2 impact_frames nằm ngoài range own shot nhưng acceptance report PASS: false-positive nghiêm trọng.
**REAL production ShotSpec phải chạy REAL validate-shot-spec.ts.**
Fail → build terminates. Không report complete pass.

## 38. Impact whitelist ≠ transition whitelist

Không dùng impact_frames hợp thức hóa toàn-frame hard cut.
Tách impact_frames, transition_frames, transition_type, expected_visual_discontinuity.
Chỉ explicit transition frame có thể whitelist scene-wide discontinuity.

## 39. CRITICAL ISSUE — Temporal discontinuities

Historical actual V3.2 adjacent-frame MAD:
frame618 ~5.22; frame1309 ~10.38; frame1976 ~8.80; frame2531 ~16.77.
Median ~0.074. Frame2531 >200× median → hard visual replacement.
Main scenes Sequential Sequence thiếu transition bridge.

**NO FINAL MP4 WITHOUT TEMPORAL QA.**
Shot boundary spike lớn không explicit transition intent → FAIL.

## 40. Motivated transitions requirement

Mỗi major boundary có transitionIntent.
Allowed: object match, camera carry, shape morph, foreground wipe, continuing trajectory, semantic zoom, motivated iris, match cut.
Default naked hard scene replacement bị cấm.

## 41. CRITICAL ISSUE — Wrong default voice fallback

Bad historical code: `const voice = request.voice || 'am_adam';` routes Kokoro.
Caller quên voice trong Vietnamese-first production có thể chạy English Kokoro.
Fix: `request.voice ?? GENVIDEO_ADAM_PROFILE.synthesis.voice`.
Default Adam / VieNeu. Kokoro chỉ explicit fallback.

## 42. Audio metadata mismatch

Manifest từng hard-code 24000 trong khi V3.2 delivery 48000.
Không hard-code metadata. Đọc WAV header/ffprobe lấy sampleRate, channels, bitDepth, duration rồi mới ghi manifest.

## 43. Portability issue

Historical committed audio-manifest.json/scopus_batch.json chứa machine-specific absolute path thuộc home/Desktop của tác giả.
Committed artifacts chỉ workspace-relative path, asset URI hoặc asset ID.
Không user-home paths trên Linux, macOS hoặc Windows.
Cần validate-portability.ts. Những ví dụ lỗi lịch sử trong tài liệu không phải đường dẫn runtime.

## 44. Background music residue

Historical active production namespace còn connection-film/public/audio/background_soundtrack.wav.
Dù không audible vẫn dễ dùng lại.
Move legacy music sang fixtures/, legacy-assets/, test-assets/, không active production audio namespace.

## 45. Audio QA V3.2

Actual video: Integrated Loudness ~-14.98 LUFS; True Peak ~-3.53 dBTP; LRA ~1.30 LU.
LUFS đạt, peak an toàn, LRA thấp → voice có thể compressed/phẳng.
Silence scan gần như không có nghỉ >~250ms xuyên phần lớn narration.
Nguy cơ breathless, too dense, too continuous, fatiguing.

## 46. Natural Pause Policy

Không global interSentenceMax <=0.30s ép narration không thở.

| Semantic role | Suggested pause (s) |
|---|---|
| within clause | 0.08–0.20 |
| normal sentence | 0.18–0.40 |
| semantic turn | 0.25–0.55 |
| major section transition | 0.40–0.80 |
| payoff / realization | 0.30–0.65 |

Dead-air validator phải biết semantic role. Intentional pause không là lỗi.

## 47. Narration dynamics QA

Measure LUFS, true peak, LRA, RMS distribution, pause distribution, speech-rate distribution.
Không ép LRA=7, nhưng cực thấp phải flag human review.
Human listening authoritative cho timbre, body, harshness, clarity, pacing, pause rhythm, English code-switch naturalness.

## 48. Skill hiện tại bị outdated (historical finding)

SKILL.md từng yêu cầu target duration và default1920x1080.
Production policy phải 1080x1920,9:16,mobile-first,Vietnamese-first,content-driven,no background music.
Update Skill; kiểm tra actual current version trước khi sửa.

## 49. Global Production Invariants cần thêm vào Skill

NEVER_SHRINK_TO_FIT; ONE_PRIMARY_IDEA_PER_BEAT; PROGRESSIVE_DISCLOSURE; MOBILE_FIRST_READABILITY; ONE_AUTHORITATIVE_TIMELINE; ONE_AUDIO_OWNER_PER_ASSET; FINAL_RENDER_IS_AUTHORITATIVE; NO_SELF_CERTIFICATION; CONTENT_DRIVEN_DURATION; SOURCE_CONTENT_COVERAGE_100_PERCENT.

## 50. Source content completeness

Không agent tự tóm tắt/cắt bớt.
source-content-map.json: mỗi source knowledge unit có sourceUnit, coveredBy (beat/scene IDs), status="covered".
**SOURCE COVERAGE=100%; <100% → FAIL.** Video được dài thêm.

## 51. V3.3 — Production Integrity Hardening

Không thêm creative feature. Mục tiêu loại false-positive acceptance trước V4.

| Requirement | Scope |
|---|---|
| R1 | NEVER_SHRINK_TO_FIT validator |
| R2 | 360x640 mobile legibility gate |
| R3 | one primary idea per visual beat |
| R4 | semantic-timeline single source |
| R5 | real content-driven choreography |
| R6 | retime Scopus visual actions |
| R7 | real ShotSpec validation |
| R8 | separate impact vs transition whitelist |
| R9 | temporal QA final MP4 |
| R10 | motivated transitions |
| R11 | fix double SFX |
| R12 | audio asset ownership graph |
| R13 | safe VieNeu Adam default |
| R14 | actual audio metadata |
| R15 | portability validator |
| R16 | remove production music ambiguity |
| R17 | natural semantic pause policy |
| R18 | audio dynamics QA |
| R19 | update Skill |
| R20 | update quality rubric |
| R21 | 100% source coverage |
| R22 | deliberately bad fixtures |
| R23 | real Scopus acceptance rerender |

## 52. Deliberately bad fixtures required

Negative tests: 14px meaningful body text; impact outside shot; hard scene cut; double SFX owner; absolute home path; am_adam default; audio metadata mismatch; old scene timing after retime; cue/visual mismatch; five detailed cards simultaneously; fake content-driven duration; unannotated temporal spike.

**Nếu bất kỳ bad fixture PASS → validation system FAIL.**

## 53. Quality Rubric phải nâng cấp

Old categories: Story clarity, Composition, Character acting, Motion timing, Camera, Transitions, Secondary motion, Visual consistency, Information readability, Originality.

Thêm Mobile Readability, Information Density, Audio/Visual Synchronization, Narration Naturalness, Timing Integrity, Production Portability, Source-to-Video Content Coverage, Validator Reliability.

Premium: average>=4.5/5; no category<4.0.
Critical mobile readability, timing integrity, audio/visual sync, content coverage, transition continuity phải >=4.3. Không category khác bù điểm.

## 54. V3.3 Stop Condition

Không sang V4 chỉ vì npm test/typecheck/render PASS.
V3.3 complete khi có:
final-v3_3.mp4; preview-360x640.mp4; semantic-timeline.json; source-content-map.json; shot-spec.json; audio-manifest.json; qa-report.json.

Independent reviewer phải xem full video1x, all shot boundaries, all transitions, major SFX cues, đọc được mobile preview, xác nhận narration timing và source coverage.

## 55. V4 — Vertical Visual Storytelling + Asset Factory

Chỉ sau V3.3 sạch.
Không đơn thuần asset generator.
V4: WHAT TO DRAW / HOW TO COMPOSE / HOW TO EXPLAIN VISUALLY / HOW TO KEEP STYLE CONSISTENT.
V2 chủ yếu HOW TO MOVE.

## 56. V4 responsibilities

Visual metaphor generator, Art direction system, Style tokens, Asset registry, Character bible, Visual vocabulary, Scene composition engine, Progressive disclosure, Long-form content decomposition, Mobile layout intelligence, Visual hierarchy, Asset consistency.

Assets: Human, Animals, Objects, Buildings, Planets, Cells, DNA, Charts, Maps, Icons, Particles, Environment, Scientific diagrams, Academic diagrams, UI-like visual props.

## 57. V4 visual goal

Scopus text/card-heavy. Shift từ ~70% cards/text +30% visual sang ~30–45% text +55–70% meaningful visual.
Không rigid ratio; default visual-first.
Text để label, anchor, summarize current visual point; không nhét nguyên slide.

## 58. Character usage in V4

Researcher mascot không decorative sticker.
Storytelling actions: point, look, react, hold, compare, push, pull, reveal, walk, demonstrate, celebrate, hesitate, discover.
Character tương tác visual metaphor.

## 59. V4 Mobile-first layout

Canvas1080x1920; phone viewing target; QA360x640.
One dominant focal hierarchy, large meaningful text, clear subject, safe subtitles, limited simultaneous information.

## 60. V5 — Autonomous Video Factory

TOPIC → research → script → narration → semantic beats → storyboard → ShotSpecs → assets → motion → karaoke → SFX → parallel scene rendering → QA → failed scene recovery → final assembly → FINAL VIDEO.

Responsibilities: render queue, parallel shot execution, cache, resume, retry, failed-scene re-render, dependency graph, asset reuse, versioning, final assembly, long-video management.
Shot37 fail → rerender shot37 only, không toàn video.

## 61. GitHub source of truth

Primary https://github.com/hongphuoc6104/genvideoanimation.
Reference voice https://github.com/hongphuoc6104/Genvideo.
Historical known commits: 0a06a41 V2; e0d984c V3.1; 51b14c2 V3.2.
**Luôn kiểm tra GitHub mới nhất trước kết luận trạng thái.**

## 62. Important GitHub files previously inspected

Production:
- .agents/skills/educational-flat-motion/SKILL.md
- .agents/skills/educational-flat-motion/references/quality-rubric.md
- .agents/skills/educational-flat-motion/checklists/anti-patterns.md

Motion:
- motion-kit/
- validators/motion-lint.ts
- validators/temporal-render-qa.ts
- validators/validate-shot-spec.ts

Narration:
- packages/narration-kit/src/normalization/textNormalizer.ts
- packages/narration-kit/src/normalization/languageAwareTokenizer.ts
- packages/narration-kit/src/audio/voiceProfile.ts
- scripts/generate-vieneu-narration.py

Scopus:
- connection-film/src/scopus-explainer/ScopusExplainerFilm.tsx
- connection-film/src/scopus-explainer/shot-spec.json
- connection-film/src/scopus-explainer/cues.json
- connection-film/src/scopus-explainer/components/GapDoorsTaxonomy.tsx
- connection-film/src/scopus-explainer/components/BankingCaseStudy.tsx
- connection-film/src/scopus-explainer/components/ResearcherRig.tsx
- connection-film/src/scopus-explainer/palette.ts
- connection-film/public/audio/audio-manifest.json
- connection-film/public/audio/scopus_batch.json

Validators:
- validators/validate-audio-policy.ts
- validators/validate-audio-mix.ts
- validators/validate-alignment.ts
- validators/validate-bilingual-alignment.ts
- validators/validate-caption-layout.ts
- validators/temporal-karaoke-qa.ts
- validators/offline-network-guard.ts

## 63. Historical files / uploads that may appear in old context

Original sample: connection-15s.mp4, connection-source.zip.
Skill archive: Educational-Flat-Motion-Skill-CLEAN.zip.
Old benchmarks: benchmark-abstract.mp4, benchmark-character.mp4, benchmark-science.mp4.

Authoritative full archive at one time: motion-kit-full-project.zip, once extracted at /mnt/data/actual_project.
Current source of truth ưu tiên GitHub.

genVideo-COMPLETE-PORTABLE.zip và genVideo-MISSING-FILES-ADDON.zip là reconstructed compatibility artifacts, **NOT authoritative original source**. Không nhầm với actual project/GitHub sau này.

## 64. Important video files from old chat

V2: benchmark-v2-human.mp4, benchmark-v2-morph.mp4, benchmark-v2-network.mp4, benchmark-v2-c.mp4.
V3/V3.1: scopus-research-gap-tiktok-9x16.mp4.
V3.2: scopus-v3_2-no-music.mp4.
Old paths: /mnt/data/scopus-v3_2-no-music.mp4; /mnt/data/v32_review/contact.jpg; /mnt/data/v32_review/mobile_sheet.jpg.

Không giả định old session paths còn tồn tại. Nếu cần visual re-review mà không truy cập được video thì yêu cầu upload lại.

## 65. Important evaluation philosophy

230/230 tests pass không chứng minh output đẹp.
Ba layers riêng: CODE CORRECTNESS; SYSTEM COMPLIANCE; VIEWER-FACING QUALITY.
Cả ba required. Final MP4 authoritative cho viewer-facing quality.

## 66. Implementation agent cannot self-certify

**IMPLEMENTER ≠ FINAL REVIEWER.**
Implementer được report objective tests; subjective acceptance cần independent reviewer.
Không nhận “4.88/5” self-score thiếu independent video review.

## 67. Final Render Is Authoritative

Không complete chỉ vì code compiles, tests pass, render completes.
Complete khi actual MP4 viewed, mobile preview viewed, continuity checked, audio listened, caption read, source coverage checked, validators confirmed.

## 68. No fixed duration

Bỏ target duration mandatory.
Production config:
- durationPolicy = 'content-driven'
- maxDuration = null
- allowSemanticOmission = false
- allowContentCompression = false
- detailLevel = 'exhaustive'

Không tăng narration speed chỉ vì scene ngắn.
Narration needs more time → scene expands → shot expands → video expands.

## 69. Content style requested by user

Không giới hạn thời lượng; không cần video ngắn; không tự tóm tắt; chi tiết chuẩn từng bước; giải thích rõ; hướng dẫn càng rõ càng tốt; chữ lớn dễ đọc điện thoại.
TikTok không đồng nghĩa <60s; chỉ aspect ratio / consumption context. Long-form-capable.

## 70. Current highest-priority task in new chat

**CHECK GITHUB LATEST STATE** trước V4.
Nếu chưa triển khai V3.3: continue V3.3 Production Integrity Hardening.
Nếu đã có implementation: audit thực tế theo gate, không lặp lại hoặc tự certify.

Ưu tiên:
1. double SFX ownership
2. real ShotSpec validation
3. semantic-timeline single source
4. retime visual choreography to narration
5. motivated transitions at shot boundaries
6. final MP4 temporal QA
7. mobile typography minimums
8. NEVER_SHRINK_TO_FIT
9. remove absolute user paths
10. safe VieNeu Adam default
11. actual audio metadata
12. role-aware natural pauses
13. update Skill defaults
14. negative fixtures / false-positive tests
15. 100% source-content-map

Không V4 trước khi giải quyết production integrity.

## 71. Suggested final architecture after V5

USER/SOURCE → DIRECTOR SKILL.
Content system → Semantic Timeline → Visual Storytelling → Asset Factory.
Narration system → VI-first bilingual TTS → Words/Karaoke timing → Audio.
Hai nhánh hội tụ MOTION KIT → SCENE/SHOT RENDER → PREMIXED NARRATION+SFX → FINAL ASSEMBLY → Automated+Human QA → FINAL MP4.

## 72. Core philosophy to preserve

Không chỉ one perfect Scopus video.
Build reusable production system tạo hàng trăm unrelated educational videos không sửa core kit mỗi topic.

Fixed: quality rules, motion grammar, mobile readability rules, timeline architecture, audio ownership, QA gates.
Variable: topic, visual metaphor, characters, assets, composition, shot structure, transitions, examples, color accents, storytelling devices.
Không rigid template.

## 73. Gold-standard rule set

- FINAL_RENDER_IS_AUTHORITATIVE
- NO_SELF_CERTIFICATION
- NEVER_SHRINK_TO_FIT
- CONTENT_DRIVEN_DURATION
- ALLOW_SEMANTIC_OMISSION = FALSE
- SOURCE_CONTENT_COVERAGE = 100%
- ONE_PRIMARY_IDEA_PER_BEAT
- PROGRESSIVE_DISCLOSURE
- MOBILE_FIRST_READABILITY
- ONE_AUTHORITATIVE_SEMANTIC_TIMELINE
- SHOT_TIMING_DERIVES_FROM_NARRATION
- CUES_DERIVE_FROM_SEMANTIC_TIMELINE
- ONE_AUDIO_OWNER_PER_ASSET
- NO_BACKGROUND_MUSIC
- VIETNAMESE_FIRST
- ENGLISH_CODE_SWITCH_BY_LEXICON
- DISPLAY_TEXT != SPOKEN_TEXT
- NO_SILENT_ALIGNMENT_FALLBACK
- MOTIVATED_TRANSITIONS
- NO_UNANNOTATED_HARD_CUT
- NO_MACHINE_SPECIFIC_PATHS
- ACTUAL_MEDIA_METADATA_ONLY
- NEGATIVE_FIXTURES_MUST_FAIL

Copy vào Skill/reference docs và enforce validators nơi technically possible.

## 74. How the new assistant should work

1. Check latest GitHub commit.
2. Read actual source, không chỉ agent reports.
3. Inspect actual rendered MP4 nếu provided.
4. Skeptical of PASS reports.
5. Penalize false-positive validators heavily.
6. Root-cause architectural fixes hơn one-video patches.
7. Keep Skill reusable.
8. Không optimize only current benchmark.
9. Require unseen/generalization tests.
10. Không next version trước current production gate genuinely passes.

> Fewer features, stronger invariants, stronger QA, better actual video.

END MASTER CONTEXT.

