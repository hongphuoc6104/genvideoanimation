/**
 * Master Script & Narrative Beat Architecture for Scopus Research Gap Explainer
 * Format: Vertical 9:16 (1080x1920, 30 FPS, Total 2400 Frames / 80.0 Seconds)
 *
 * Source: 3 Authoritative Academic Guide Documents in content/ & content_spec.md
 * Covers all 5 Core Parts:
 * 1. Đặt vấn đề & Bản chất Scopus (Rejection paradox, 3 core questions, 4 attributes, Swales CARS 1990)
 * 2. Phân loại 5 loại Research Gap (Theoretical, Empirical, Contextual, Methodological, Practical)
 * 3. Quy trình 4 bước xác định Research Gap (Funnel, Matrix, 3 Conditions, 3-Tier Architecture & Formulas)
 * 4. Template 4 câu chuẩn quốc tế & Case Study Ngân hàng số (TAM, e-service quality, trust, perceived risk)
 * 5. 4 Lỗi chết người cần tránh & Thông điệp chốt (Axiom: Research Gap là nền tảng của tính mới)
 */

export const FPS = 30;
export const TOTAL_FRAMES = 2400; // 80.0 seconds @ 30fps

export interface CharacterActionTrigger {
  pose: 'idle' | 'presenting' | 'analyzing' | 'discovering' | 'warning' | 'celebrating';
  expression: 'neutral' | 'confused' | 'focused' | 'alert' | 'delighted';
  action: string;
}

export interface ScriptBeat {
  id: string;
  sceneId: 'scene_01' | 'scene_02' | 'scene_03' | 'scene_04' | 'scene_05';
  partNumber: 1 | 2 | 3 | 4 | 5;
  partTitle: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  startTime: number;
  endTime: number;
  narration: string;
  characterAction: CharacterActionTrigger;
  visualCueId: string;
  visualMetaphor: string;
  academicConcept: string;
}

export interface SceneConfig {
  id: 'scene_01' | 'scene_02' | 'scene_03' | 'scene_04' | 'scene_05';
  title: string;
  partNumber: 1 | 2 | 3 | 4 | 5;
  startFrame: number;
  endFrame: number;
  durationInFrames: number;
  startTime: number;
  endTime: number;
  description: string;
}

export const SCENES_CONFIG: SceneConfig[] = [
  {
    id: 'scene_01',
    title: 'Phần 1: Đặt vấn đề & Bản chất Scopus',
    partNumber: 1,
    startFrame: 0,
    endFrame: 450,
    durationInFrames: 450,
    startTime: 0,
    endTime: 15.0,
    description: 'Nghịch lý bị từ chối bài báo, bản chất đối thoại học thuật, 3 câu hỏi cốt lõi, 4 thuộc tính và mô hình Swales CARS (1990).',
  },
  {
    id: 'scene_02',
    title: 'Phần 2: Phân loại 5 loại Research Gap',
    partNumber: 2,
    startFrame: 450,
    endFrame: 900,
    durationInFrames: 450,
    startTime: 15.0,
    endTime: 30.0,
    description: 'Khám phá 5 cánh cửa: Gap Lý thuyết, Thực nghiệm, Bối cảnh, Phương pháp và Ứng dụng quản trị.',
  },
  {
    id: 'scene_03',
    title: 'Phần 3: Quy trình 4 bước xác định Research Gap',
    partNumber: 3,
    startFrame: 900,
    endFrame: 1440,
    durationInFrames: 540,
    startTime: 30.0,
    endTime: 48.0,
    description: 'Quy trình 4 bước: Thu hẹp phễu dòng nghiên cứu, Ma trận tri thức 4 trục, Bộ lọc 3 điều kiện và Kiến tạo Gap Statement 3 tầng.',
  },
  {
    id: 'scene_04',
    title: 'Phần 4: Template 4 câu chuẩn & Case Study Ngân hàng số',
    partNumber: 4,
    startFrame: 1440,
    endFrame: 1950,
    durationInFrames: 510,
    startTime: 48.0,
    endTime: 65.0,
    description: 'Template 4 câu chuẩn quốc tế và Case study thực chiến Ngân hàng số (TAM mở rộng, E-service quality, Sự hài lòng và Rủi ro cảm nhận).',
  },
  {
    id: 'scene_05',
    title: 'Phần 5: 4 Lỗi chết người & Thông điệp chốt',
    partNumber: 5,
    startFrame: 1950,
    endFrame: 2400,
    durationInFrames: 450,
    startTime: 65.0,
    endTime: 80.0,
    description: 'Nhận diện 4 cạm bẫy desk-reject, tránh 2 cực đoan học thuật và nguyên lý cốt lõi: Research Gap là nền tảng của tính mới.',
  },
];

export const SCOPUS_SCRIPT: ScriptBeat[] = [
  // =========================================================================
  // PHẦN 1: ĐẶT VẤN ĐỀ & BẢN CHẤT SCOPUS (Frames 0 - 450)
  // =========================================================================
  {
    id: 'beat_01',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    startFrame: 0,
    endFrame: 90,
    durationFrames: 90,
    startTime: 0.0,
    endTime: 3.0,
    narration: 'Tại sao bài báo có số liệu tốt, phương pháp mạnh vẫn bị Desk Reject ngay từ vòng đầu?',
    characterAction: {
      pose: 'presenting',
      expression: 'confused',
      action: 'Holding manuscript, stunned as red REJECTED stamp slams down',
    },
    visualCueId: 'cue_01_rejection_stamp',
    visualMetaphor: 'Manuscript rejected at the journal gateway with big red stamp',
    academicConcept: 'Rejection Paradox (Phương pháp mạnh vẫn bị từ chối nếu thiếu Gap)',
  },
  {
    id: 'beat_02',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    startFrame: 90,
    endFrame: 180,
    durationFrames: 90,
    startTime: 3.0,
    endTime: 6.0,
    narration: 'Nguyên nhân cốt lõi: Phần mở đầu không chứng minh được khoảng trống nghiên cứu một cách thuyết phục!',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Examining manuscript with a high-tech magnifying glass looking for missing link',
    },
    visualCueId: 'cue_02_gap_reveal',
    visualMetaphor: 'Magnifying glass reveals broken void between existing papers and current study',
    academicConcept: 'Defensible Research Gap (Lập luận có căn cứ vững chắc)',
  },
  {
    id: 'beat_03',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    startFrame: 180,
    endFrame: 270,
    durationFrames: 90,
    startTime: 6.0,
    endTime: 9.0,
    narration: 'Chuẩn Scopus là chuẩn đối thoại học thuật: Vấn đề rõ, tổng quan chọn lọc, lập luận có căn cứ.',
    characterAction: {
      pose: 'presenting',
      expression: 'neutral',
      action: 'Gesturing to international academic discourse network expanding around',
    },
    visualCueId: 'cue_03_dialogue_pulse',
    visualMetaphor: 'Scholarly discourse forum where nodes communicate via verified citations',
    academicConcept: 'Academic Discourse Standard (Chuẩn đối thoại tri thức quốc tế)',
  },
  {
    id: 'beat_04',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    startFrame: 270,
    endFrame: 360,
    durationFrames: 90,
    startTime: 9.0,
    endTime: 12.0,
    narration: 'Một Gap chuẩn phải trả lời 3 câu hỏi: Đã biết gì? Chưa thỏa đáng điểm nào? Đóng góp gì mới?',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Tracing three vertices of a golden query triangle with glowing pointer',
    },
    visualCueId: 'cue_04_triangle_cards',
    visualMetaphor: 'Equilateral Golden Triangle cards locking together in 3D perspective',
    academicConcept: '3 Core Questions of Research Gap (Tam giác 3 câu hỏi cốt lõi)',
  },
  {
    id: 'beat_05',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    startFrame: 360,
    endFrame: 450,
    durationFrames: 90,
    startTime: 12.0,
    endTime: 15.0,
    narration: 'Và sở hữu 4 thuộc tính: Định vị, Chứng cứ, Giải thích và Khả nghiên cứu theo mô hình Swales CARS.',
    characterAction: {
      pose: 'discovering',
      expression: 'delighted',
      action: 'Activating Swales CARS Move 1-2-3 architectural steps',
    },
    visualCueId: 'cue_05_cars_moves',
    visualMetaphor: '4 glowing foundational pillars rising under Swales CARS steps',
    academicConcept: '4 Minimum Gap Attributes & Swales CARS Model (1990)',
  },

  // =========================================================================
  // PHẦN 2: PHÂN LOẠI 5 LOẠI RESEARCH GAP (Frames 450 - 900)
  // =========================================================================
  {
    id: 'beat_06',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: 'Phân loại 5 loại Research Gap',
    startFrame: 450,
    endFrame: 540,
    durationFrames: 90,
    startTime: 15.0,
    endTime: 18.0,
    narration: 'Cánh cửa thứ nhất: Gap Lý thuyết, khi lý thuyết hiện hành chưa giải thích đủ cơ chế trung gian hay điều tiết.',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Unlocking Door 1 revealing mediator and moderator variable pathways',
    },
    visualCueId: 'cue_06_door_theoretical',
    visualMetaphor: 'First portal opening into theoretical framework with mediator conduits',
    academicConcept: 'Theoretical Gap (Thiếu biến trung gian M hoặc điều tiết W)',
  },
  {
    id: 'beat_07',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: 'Phân loại 5 loại Research Gap',
    startFrame: 540,
    endFrame: 630,
    durationFrames: 90,
    startTime: 18.0,
    endTime: 21.0,
    narration: 'Cánh cửa thứ hai: Gap Thực nghiệm, khi các nghiên cứu trước cho kết quả mâu thuẫn, chưa nhất quán.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Examining conflicting study findings colliding with amber spark accents',
    },
    visualCueId: 'cue_07_door_empirical',
    visualMetaphor: 'Two contradictory empirical data plots (+) and (-) confronting each other',
    academicConcept: 'Empirical Gap (Kết quả mâu thuẫn cần đối chiếu thực nghiệm)',
  },
  {
    id: 'beat_08',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: 'Phân loại 5 loại Research Gap',
    startFrame: 630,
    endFrame: 720,
    durationFrames: 90,
    startTime: 21.0,
    endTime: 24.0,
    narration: 'Cánh cửa thứ ba: Gap Bối cảnh, đặc thù văn hóa, thể chế làm thay đổi cơ chế, không chỉ đơn thuần đổi địa bàn!',
    characterAction: {
      pose: 'warning',
      expression: 'alert',
      action: 'Pointing emphatically at institutional context boundary condition map',
    },
    visualCueId: 'cue_08_door_contextual',
    visualMetaphor: 'Institutional terrain with boundary conditions shifting relationship slopes',
    academicConcept: 'Contextual Gap (Đặc thù thể chế làm thay đổi cơ chế lý thuyết)',
  },
  {
    id: 'beat_09',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: 'Phân loại 5 loại Research Gap',
    startFrame: 720,
    endFrame: 810,
    durationFrames: 90,
    startTime: 24.0,
    endTime: 27.0,
    narration: 'Cánh cửa thứ tư: Gap Phương pháp, hạn chế về đo lường, thiết kế mẫu, dữ liệu dọc hoặc sai lệch CMV.',
    characterAction: {
      pose: 'presenting',
      expression: 'neutral',
      action: 'Displaying multi-wave longitudinal timeline and Harman single-factor filter',
    },
    visualCueId: 'cue_09_door_methodological',
    visualMetaphor: 'Longitudinal time-series waves filtering out cross-sectional common method bias',
    academicConcept: 'Methodological Gap (Longitudinal design, CMV control, Robustness)',
  },
  {
    id: 'beat_10',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: 'Phân loại 5 loại Research Gap',
    startFrame: 810,
    endFrame: 900,
    durationFrames: 90,
    startTime: 27.0,
    endTime: 30.0,
    narration: 'Cánh cửa thứ năm: Gap Ứng dụng, khi hàm ý chính sách và quản trị gắn liền với đóng góp học thuật.',
    characterAction: {
      pose: 'discovering',
      expression: 'delighted',
      action: 'Bridging academic theory block directly to executive decision dashboard',
    },
    visualCueId: 'cue_10_door_practical',
    visualMetaphor: 'Double-arch bridge connecting scholarly theory to real-world policy execution',
    academicConcept: 'Practical / Managerial Gap (Gắn hàm ý quản trị với lý thuyết)',
  },

  // =========================================================================
  // PHẦN 3: QUY TRÌNH 4 BƯỚC XÁC ĐỊNH RESEARCH GAP (Frames 900 - 1440)
  // =========================================================================
  {
    id: 'beat_11',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước xác định Research Gap',
    startFrame: 900,
    endFrame: 1010,
    durationFrames: 110,
    startTime: 30.0,
    endTime: 33.67,
    narration: 'Bước một: Dùng phễu lọc thu hẹp từ chủ đề rộng sang dòng nghiên cứu chuyên sâu có trọng tâm.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Pouring broad topic spheres into glowing funnel, narrowing to focused laser stream',
    },
    visualCueId: 'cue_11_funnel_filter',
    visualMetaphor: 'Multi-tiered Narrowing Funnel condensing broad concepts into precise research stream',
    academicConcept: 'Narrowing Funnel (Thu hẹp chủ đề thành dòng nghiên cứu cụ thể)',
  },
  {
    id: 'beat_12',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước xác định Research Gap',
    startFrame: 1010,
    endFrame: 1120,
    durationFrames: 110,
    startTime: 33.67,
    endTime: 37.33,
    narration: 'Bước hai: Lập bản đồ tri thức 4 trục để nhận diện điểm mâu thuẫn và hạn chế lặp lại có hệ thống.',
    characterAction: {
      pose: 'presenting',
      expression: 'neutral',
      action: 'Expanding 4-axis matrix grid: Concepts, Contexts, Methods, Inconsistencies',
    },
    visualCueId: 'cue_12_knowledge_matrix',
    visualMetaphor: '4-Quadrant Knowledge Grid with pulsing Amber gap node at missing intersection',
    academicConcept: 'Knowledge Matrix (Bản đồ tri thức & phát hiện hạn chế lặp lại)',
  },
  {
    id: 'beat_13',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước xác định Research Gap',
    startFrame: 1120,
    endFrame: 1230,
    durationFrames: 110,
    startTime: 37.33,
    endTime: 41.0,
    narration: 'Bước ba: Lọc hạn chế qua 3 điều kiện: liên hệ học thuật cốt lõi, lặp lại nhiều lần, và khả thi kiểm định.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Passing candidate limitations through 3-ring optical verification lens',
    },
    visualCueId: 'cue_13_filter_lens',
    visualMetaphor: 'Tri-layer Optical Filter rejecting superficial noise, passing genuine gap gem',
    academicConcept: '3-Condition Filter (Bộ lọc 3 điều kiện chuyển hạn chế thành gap)',
  },
  {
    id: 'beat_14',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước xác định Research Gap',
    startFrame: 1230,
    endFrame: 1340,
    durationFrames: 110,
    startTime: 41.0,
    endTime: 44.67,
    narration: 'Bước bốn: Kiến tạo Gap Statement 3 tầng: Tầng Nền móng, Tầng Vấn đề, và Tầng Định vị giải pháp.',
    characterAction: {
      pose: 'presenting',
      expression: 'delighted',
      action: 'Assembling 3-tier architectural blocks with precision mechanical snapping',
    },
    visualCueId: 'cue_14_tier_assembly',
    visualMetaphor: 'Foundation block (Navy) -> Problem void (Amber) -> Novel solution block (Emerald)',
    academicConcept: '3-Tier Gap Architecture (Cấu trúc 3 tầng: Nền -> Vấn đề -> Định vị)',
  },
  {
    id: 'beat_15',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước xác định Research Gap',
    startFrame: 1340,
    endFrame: 1440,
    durationFrames: 100,
    startTime: 44.67,
    endTime: 48.0,
    narration: 'Áp dụng công thức biến số chuẩn A-B-C-D-E-M-F để thể hiện sự kế thừa học thuật có chọn lọc.',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Underlining mathematical variable equation brackets with glowing blue stylus',
    },
    visualCueId: 'cue_15_formula_glow',
    visualMetaphor: 'Rigorous algebraic formula of variables and boundary conditions',
    academicConcept: 'Algebraic Gap Formula A-B-C-D-E-M-F (Công thức đại số hóa quan hệ biến)',
  },

  // =========================================================================
  // PHẦN 4: TEMPLATE 4 CÂU CHUẨN & CASE STUDY NGÂN HÀNG SỐ (Frames 1440 - 1950)
  // =========================================================================
  {
    id: 'beat_16',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    startFrame: 1440,
    endFrame: 1560,
    durationFrames: 120,
    startTime: 48.0,
    endTime: 52.0,
    narration: 'Nắm chắc Template 4 câu chuẩn quốc tế: Câu nền tảng, Câu điểm chưa rõ, Câu ý nghĩa, và Câu định vị!',
    characterAction: {
      pose: 'presenting',
      expression: 'neutral',
      action: 'Displaying 4 cascading international publication template cards in clean cards layout',
    },
    visualCueId: 'cue_16_template_cards',
    visualMetaphor: '4 elegant manuscript cards sequentially illuminating with scholar cyan badges',
    academicConcept: 'International 4-Sentence Template (Template 4 câu chuẩn công bố quốc tế)',
  },
  {
    id: 'beat_17',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    startFrame: 1560,
    endFrame: 1680,
    durationFrames: 120,
    startTime: 52.0,
    endTime: 56.0,
    narration: 'Case study Ngân hàng số: Mô hình TAM đã xác nhận vai trò của tính hữu ích và dễ sử dụng.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Holding digital banking smartphone interface showing TAM theoretical foundation',
    },
    visualCueId: 'cue_17_tam_nodes',
    visualMetaphor: 'Smartphone banking app vector interface surrounded by PU and PEOU nodes',
    academicConcept: 'Technology Acceptance Model (TAM) in Digital Banking Context',
  },
  {
    id: 'beat_18',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    startFrame: 1680,
    endFrame: 1810,
    durationFrames: 130,
    startTime: 56.0,
    endTime: 60.33,
    narration: 'Dẫu vậy, cơ chế từ chất lượng dịch vụ điện tử sang ý định tiếp tục dùng vẫn chưa nhất quán tại thị trường mới nổi.',
    characterAction: {
      pose: 'analyzing',
      expression: 'alert',
      action: 'Tracing missing psychological link between E-Service Quality and Continuance Intention',
    },
    visualCueId: 'cue_18_inconsistency_pulse',
    visualMetaphor: 'Pulsing amber question mark between E-Service Quality and Continuance Intention',
    academicConcept: 'Empirical & Theoretical Gap in Developing Market Consumer Behavior',
  },
  {
    id: 'beat_19',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    startFrame: 1810,
    endFrame: 1950,
    durationFrames: 140,
    startTime: 60.33,
    endTime: 65.0,
    narration: 'Nghiên cứu mới kiểm định trung gian Hài lòng và điều tiết Rủi ro cảm nhận, lấp đầy trọn vẹn khoảng trống!',
    characterAction: {
      pose: 'discovering',
      expression: 'delighted',
      action: 'Locking emerald mediator (Satisfaction) and amber moderator (Perceived Risk) into model',
    },
    visualCueId: 'cue_19_model_complete',
    visualMetaphor: 'Complete SEM structural path model glowing green with verified fit indices',
    academicConcept: 'Full Mediation (Satisfaction) & Moderation (Perceived Risk) Model',
  },

  // =========================================================================
  // PHẦN 5: 4 LỖI CHẾT NGƯỜI & THÔNG ĐIỆP CHỐT (Frames 1950 - 2400)
  // =========================================================================
  {
    id: 'beat_20',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Lỗi chết người & Thông điệp chốt',
    startFrame: 1950,
    endFrame: 2060,
    durationFrames: 110,
    startTime: 65.0,
    endTime: 68.67,
    narration: 'Tuyệt đối tránh Lỗi 1: Tuyên bố thiếu bằng chứng, và Lỗi 2: Đồng nhất bối cảnh mới với tính mới.',
    characterAction: {
      pose: 'warning',
      expression: 'alert',
      action: 'Holding up red stop warning signs for unsubstantiated claims and mere geographic replication',
    },
    visualCueId: 'cue_20_pitfalls_1_2',
    visualMetaphor: 'Popping bubble (unsubstantiated claim) & cloned road sign (mere replication)',
    academicConcept: 'Pitfall 1 (Unsubstantiated Claim) & Pitfall 2 (Context-Novelty Equivalence Fallacy)',
  },
  {
    id: 'beat_21',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Lỗi chết người & Thông điệp chốt',
    startFrame: 2060,
    endFrame: 2170,
    durationFrames: 110,
    startTime: 68.67,
    endTime: 72.33,
    narration: 'Tránh Lỗi 3: Liệt kê nguồn thay vì tổng hợp, và Lỗi 4: Tách rời khoảng trống khỏi thiết kế phương pháp!',
    characterAction: {
      pose: 'warning',
      expression: 'alert',
      action: 'Cross-marking disconnected book stacks and broken bridge between gap and methods',
    },
    visualCueId: 'cue_21_pitfalls_3_4',
    visualMetaphor: 'Mechanical unlinked book pile & broken suspension bridge between Gap and Method',
    academicConcept: 'Pitfall 3 (Descriptive Listing) & Pitfall 4 (Decoupling Gap from Methodology)',
  },
  {
    id: 'beat_22',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Lỗi chết người & Thông điệp chốt',
    startFrame: 2170,
    endFrame: 2280,
    durationFrames: 110,
    startTime: 72.33,
    endTime: 76.0,
    narration: 'Tránh hai cực đoan: không tuyên bố vĩ mô rỗng tuếch, cũng đừng vi mô hóa địa bàn mà thiếu giá trị lý thuyết.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Centering precision balance scale between macro void and micro trivialization',
    },
    visualCueId: 'cue_22_balance_scale',
    visualMetaphor: 'Golden balance scale finding perfect equilibrium in scholarly discourse stream',
    academicConcept: 'Equilibrium: Avoiding the Two Extremes (Cân bằng giữa vĩ mô và vi mô)',
  },
  {
    id: 'beat_23',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Lỗi chết người & Thông điệp chốt',
    startFrame: 2280,
    endFrame: 2400,
    durationFrames: 120,
    startTime: 76.0,
    endTime: 80.0,
    narration: 'Research Gap là nền tảng của tính mới! Chúc bạn xây dựng lập luận vững chắc và công bố thành công trên Scopus!',
    characterAction: {
      pose: 'celebrating',
      expression: 'delighted',
      action: 'Smiling victoriously as Scopus ACCEPTED gold seal locks with celebratory particle burst',
    },
    visualCueId: 'cue_23_scopus_accepted',
    visualMetaphor: 'Glorious gold Scopus ACCEPTED stamp sealing the manuscript with emerald radiance',
    academicConcept: 'Strategic Core Axiom (Research Gap là nền tảng cốt lõi của tính mới)',
  },
];

/**
 * Resolves the active script beat for a given frame index.
 */
export function getBeatAtFrame(frame: number): ScriptBeat | undefined {
  return SCOPUS_SCRIPT.find((b) => frame >= b.startFrame && frame < b.endFrame);
}

/**
 * Returns all beats belonging to a specific scene.
 */
export function getBeatsForScene(sceneId: string): ScriptBeat[] {
  return SCOPUS_SCRIPT.filter((b) => b.sceneId === sceneId);
}

/**
 * Resolves the active scene configuration for a given frame index.
 */
export function getSceneAtFrame(frame: number): SceneConfig | undefined {
  return SCENES_CONFIG.find((s) => frame >= s.startFrame && frame < s.endFrame);
}

/**
 * Total duration in frames across all scenes.
 */
export function getTotalDurationFrames(): number {
  return TOTAL_FRAMES;
}
