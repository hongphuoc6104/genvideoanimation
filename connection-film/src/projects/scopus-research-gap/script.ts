/**
 * Master Script & Narrative Beat Architecture for Scopus Research Gap Explainer (V3.4)
 * Format: Vertical 9:16 (1080x1920, 30 FPS)
 *
 * Storytelling Style: Kurzgesagt-inspired Scientific Explainer + Motion Infographics
 * Features:
 * - Curiosity-driven paradox (why solid papers get desk rejected)
 * - Constellation of science (literature knowledge graph & scholarly dialogue)
 * - The true void (theoretical breakdown vs regional novelty)
 * - 3-Tier Cantilever Bridge (foundation -> void -> novel lock)
 * - Smart Punctuation preserved across all 23 beats
 * - Natural physical PCM silence pauses (280ms - 380ms)
 */

export const FPS = 30;

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
  role: 'hook' | 'thesis' | 'body' | 'evidence' | 'turn' | 'payoff' | 'close';
  speed: number;
  pauseAfter: number;
  narration: string;
  spokenText: string;
  characterAction: CharacterActionTrigger;
  visualCueId: string;
  visualMetaphor: string;
  academicConcept: string;
}

export interface SceneConfig {
  id: 'scene_01' | 'scene_02' | 'scene_03' | 'scene_04' | 'scene_05';
  title: string;
  partNumber: 1 | 2 | 3 | 4 | 5;
  description: string;
}

export const SCENES_CONFIG: SceneConfig[] = [
  {
    id: 'scene_01',
    title: 'Phần 1: Đặt vấn đề & Bản chất Scopus',
    partNumber: 1,
    description: 'Nghịch lý bị từ chối bài báo, bản chất đối thoại học thuật, 3 câu hỏi cốt lõi, 4 thuộc tính và mô hình Swales CARS.',
  },
  {
    id: 'scene_02',
    title: 'Phần 2: 5 Chiều kích Khoảng trống Nghiên cứu',
    partNumber: 2,
    description: 'Khảo sát 5 góc độ: Lý thuyết, Thực nghiệm, Bối cảnh, Phương pháp và Ứng dụng chính sách.',
  },
  {
    id: 'scene_03',
    title: 'Phần 3: Quy trình 4 bước & Cầu dầm 3 tầng',
    partNumber: 3,
    description: 'Phễu thu hẹp dòng nghiên cứu, Ma trận tri thức 4 trục, Bộ lọc 3 điều kiện và Kiến tạo Cầu dầm 3 tầng với công thức biến số.',
  },
  {
    id: 'scene_04',
    title: 'Phần 4: Template 4 câu chuẩn & Case Study Ngân hàng số',
    partNumber: 4,
    description: 'Template 4 câu chuẩn quốc tế và Case study thực chiến Ngân hàng số (TAM, E-service quality, Sự hài lòng và Rủi ro cảm nhận).',
  },
  {
    id: 'scene_05',
    title: 'Phần 5: 4 Cạm bẫy & Khúc khải hoàn Scopus',
    partNumber: 5,
    description: 'Cảnh báo 4 cạm bẫy desk-reject, giữ thăng bằng 2 cực đoan học thuật và nguyên lý cốt lõi: Research Gap là nền tảng của tính mới.',
  },
];

export const SCOPUS_SCRIPT: ScriptBeat[] = [
  // =========================================================================
  // PHẦN 1: ĐẶT VẤN ĐỀ & BẢN CHẤT SCOPUS (Beats 01 - 05)
  // =========================================================================
  {
    id: 'beat_01',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    role: 'hook',
    speed: 1.08,
    pauseAfter: 0.35,
    narration: 'Tại sao một bài báo có số liệu chuẩn xác, phương pháp vững vàng, vẫn có thể bị Desk Reject ngay từ vòng gửi xe?',
    spokenText: 'Tại sao một bài báo có số liệu chuẩn xác, phương pháp vững vàng, vẫn có thể bị Desk Reject ngay từ vòng gửi xe?',
    characterAction: {
      pose: 'presenting',
      expression: 'confused',
      action: 'Holding manuscript, stunned as red REJECTED stamp slams down',
    },
    visualCueId: 'cue_01_rejection_stamp',
    visualMetaphor: 'Bản thảo nghiên cứu bị từ chối với con dấu REJECT đỏ sẫm',
    academicConcept: 'Rejection Paradox (Nghịch lý từ chối bài báo)',
  },
  {
    id: 'beat_02',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    role: 'thesis',
    speed: 1.08,
    pauseAfter: 0.32,
    narration: 'Bí mật nằm ở phần mở đầu: Bạn chưa chứng minh được một khoảng trống nghiên cứu thực sự thuyết phục để bài báo có lý do tồn tại.',
    spokenText: 'Bí mật nằm ở phần mở đầu: Bạn chưa chứng minh được một khoảng trống nghiên cứu thực sự thuyết phục để bài báo có lý do tồn tại.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Examining manuscript with a high-tech magnifying glass looking for missing link',
    },
    visualCueId: 'cue_02_gap_reveal',
    visualMetaphor: 'Kính lúp công nghệ cao quét tìm mắt xích bị thiếu trong phần mở đầu',
    academicConcept: 'Defensible Research Gap (Khoảng trống có căn cứ vững chắc)',
  },
  {
    id: 'beat_03',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Khoa học là một mạng lưới tri thức kết nối. Chuẩn Scopus đòi hỏi bài báo phải tham gia vào một cuộc đối thoại học thuật có căn cứ, chứ không phải độc thoại một mình.',
    spokenText: 'Khoa học là một mạng lưới tri thức kết nối. Chuẩn Scopus đòi hỏi bài báo phải tham gia vào một cuộc đối thoại học thuật có căn cứ, chứ không phải độc thoại một mình.',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Pointing towards global constellation network connecting scholarly papers',
    },
    visualCueId: 'cue_03_dialogue_nodes',
    visualMetaphor: 'Mạng lưới các node tri thức phát sáng liên kết chặt chẽ',
    academicConcept: 'Scholarly Dialogue (Chuẩn đối thoại học thuật Scopus)',
  },
  {
    id: 'beat_04',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Một Research Gap đạt chuẩn phải trả lời tam giác ba câu hỏi cốt lõi: Nhân loại đã biết gì, điểm nào chưa thỏa đáng, và phát hiện mới của bạn đóng góp điều gì?',
    spokenText: 'Một Research Gap đạt chuẩn phải trả lời tam giác ba câu hỏi cốt lõi: Nhân loại đã biết gì, điểm nào chưa thỏa đáng, và phát hiện mới của bạn đóng góp điều gì?',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Gesturing along vertices of a glowing golden questions triangle',
    },
    visualCueId: 'cue_04_three_questions',
    visualMetaphor: 'Tam giác vàng ba đỉnh kết nối các câu hỏi bản chất',
    academicConcept: 'Three Core Questions (Tam giác 3 câu hỏi cốt lõi)',
  },
  {
    id: 'beat_05',
    sceneId: 'scene_01',
    partNumber: 1,
    partTitle: 'Đặt vấn đề & Bản chất Scopus',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.35,
    narration: 'Khung lập luận đó cần bốn trụ cột vững chắc: Tính định vị, tính chứng cứ, tính giải thích và khả năng nghiên cứu, đúng theo mô hình Swales CARS.',
    spokenText: 'Khung lập luận đó cần bốn trụ cột vững chắc: Tính định vị, tính chứng cứ, tính giải thích và khả năng nghiên cứu, đúng theo mô hình Swales CARS.',
    characterAction: {
      pose: 'presenting',
      expression: 'alert',
      action: 'Anchoring four rising architectural foundation pillars into the floor',
    },
    visualCueId: 'cue_05_cars_pillars',
    visualMetaphor: 'Bốn trụ cột kiến trúc vươn cao nâng đỡ nền tảng học thuật',
    academicConcept: 'Swales CARS Four Attributes (4 Thuộc tính cốt lõi & Swales CARS)',
  },

  // =========================================================================
  // PHẦN 2: 5 CHIỀU KÍCH KHOẢNG TRỐNG NGHIÊN CỨU (Beats 06 - 10)
  // =========================================================================
  {
    id: 'beat_06',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: '5 Chiều kích Khoảng trống Nghiên cứu',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Trước hết là khoảng trống lý thuyết: Khi các học thuyết hiện tại bất lực trong việc giải thích cơ chế trung gian hoặc biến điều tiết mới.',
    spokenText: 'Trước hết là khoảng trống lý thuyết: Khi các học thuyết hiện tại bất lực trong việc giải thích cơ chế trung gian hoặc biến điều tiết mới.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Inspecting optical prism laser refraction revealing broken mediator',
    },
    visualCueId: 'cue_06_prism_theoretical',
    visualMetaphor: 'Tia laser xuyên qua lăng kính quang học làm lộ ra cơ chế trung gian bị đứt gãy',
    academicConcept: 'Theoretical Gap (Khoảng trống Lý thuyết)',
  },
  {
    id: 'beat_07',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: '5 Chiều kích Khoảng trống Nghiên cứu',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Tiếp đến là khoảng trống thực nghiệm: Nảy sinh khi các công trình đi trước đưa ra những kết luận mâu thuẫn và chưa hề có sự nhất quán.',
    spokenText: 'Tiếp đến là khoảng trống thực nghiệm: Nảy sinh khi các công trình đi trước đưa ra những kết luận mâu thuẫn và chưa hề có sự nhất quán.',
    characterAction: {
      pose: 'analyzing',
      expression: 'confused',
      action: 'Observing conflicting positive vs negative data streams clashing',
    },
    visualCueId: 'cue_07_prism_empirical',
    visualMetaphor: 'Hai luồng dữ liệu xung đột va chạm tạo nên vùng nhiễu loạn',
    academicConcept: 'Empirical Gap (Khoảng trống Thực nghiệm)',
  },
  {
    id: 'beat_08',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: '5 Chiều kích Khoảng trống Nghiên cứu',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Đặc biệt là khoảng trống bối cảnh: Nơi đặc thù văn hóa và thể chế làm thay đổi hoàn toàn bản chất cơ chế, chứ không đơn thuần là thay đổi địa bàn nghiên cứu.',
    spokenText: 'Đặc biệt là khoảng trống bối cảnh: Nơi đặc thù văn hóa và thể chế làm thay đổi hoàn toàn bản chất cơ chế, chứ không đơn thuần là thay đổi địa bàn nghiên cứu.',
    characterAction: {
      pose: 'warning',
      expression: 'alert',
      action: 'Tracing contextual boundary lines warping the causal forcefield',
    },
    visualCueId: 'cue_08_prism_contextual',
    visualMetaphor: 'Trường lực thể chế uốn cong quỹ đạo tác động của các biến số',
    academicConcept: 'Contextual Gap (Khoảng trống Bối cảnh)',
  },
  {
    id: 'beat_09',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: '5 Chiều kích Khoảng trống Nghiên cứu',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Bạn cũng có thể khai phá khoảng trống phương pháp: Khắc phục những hạn chế về thang đo, thiết kế mẫu dọc, hay kiểm soát sai lệch phương pháp chung CMV.',
    spokenText: 'Bạn cũng có thể khai phá khoảng trống phương pháp: Khắc phục những hạn chế về thang đo, thiết kế mẫu dọc, hay kiểm soát sai lệch phương pháp chung CMV.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Adjusting statistical precision grid eliminating common method variance',
    },
    visualCueId: 'cue_09_prism_methodological',
    visualMetaphor: 'Lưới lọc ma trận đo lường phát hiện sai lệch dữ liệu',
    academicConcept: 'Methodological Gap (Khoảng trống Phương pháp)',
  },
  {
    id: 'beat_10',
    sceneId: 'scene_02',
    partNumber: 2,
    partTitle: '5 Chiều kích Khoảng trống Nghiên cứu',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.35,
    narration: 'Cuối cùng là khoảng trống ứng dụng: Nơi các phát hiện thực tiễn giải quyết điểm nghẽn chính sách, gắn chặt với giá trị học thuật.',
    spokenText: 'Cuối cùng là khoảng trống ứng dụng: Nơi các phát hiện thực tiễn giải quyết điểm nghẽn chính sách, gắn chặt với giá trị học thuật.',
    characterAction: {
      pose: 'presenting',
      expression: 'delighted',
      action: 'Connecting managerial cogwheel securely onto the academic motor axis',
    },
    visualCueId: 'cue_10_prism_practical',
    visualMetaphor: 'Bánh răng quản trị khớp nối hoàn hảo với trục xoay lý thuyết',
    academicConcept: 'Practical Gap (Khoảng trống Ứng dụng)',
  },

  // =========================================================================
  // PHẦN 3: QUY TRÌNH 4 BƯỚC & CẦU DẦM 3 TẦNG (Beats 11 - 15)
  // =========================================================================
  {
    id: 'beat_11',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước & Cầu dầm 3 tầng',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Quy trình bắt đầu bằng chiếc phễu tư duy: Thu hẹp từ một đại dương chủ đề rộng lớn về một dòng nghiên cứu chuyên sâu duy nhất.',
    spokenText: 'Quy trình bắt đầu bằng chiếc phễu tư duy: Thu hẹp từ một đại dương chủ đề rộng lớn về một dòng nghiên cứu chuyên sâu duy nhất.',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Guiding wide swarm of topic particles into focused optical funnel',
    },
    visualCueId: 'cue_11_process_funnel',
    visualMetaphor: 'Phễu hình học thu gom các luồng hạt tri thức về một tia sáng hội tụ',
    academicConcept: 'Funnel Narrowing (Phễu thu hẹp dòng nghiên cứu)',
  },
  {
    id: 'beat_12',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước & Cầu dầm 3 tầng',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Kế tiếp, lập ma trận tri thức bốn trục: Khái niệm, bối cảnh, phương pháp và mâu thuẫn, để phát hiện những điểm đứt gãy mang tính hệ thống.',
    spokenText: 'Kế tiếp, lập ma trận tri thức bốn trục: Khái niệm, bối cảnh, phương pháp và mâu thuẫn, để phát hiện những điểm đứt gãy mang tính hệ thống.',
    characterAction: {
      pose: 'discovering',
      expression: 'alert',
      action: 'Radar sweep sweeps across 4 axes locking onto vacant chasm gap node',
    },
    visualCueId: 'cue_12_knowledge_radar',
    visualMetaphor: 'Ma trận radar 2 chiều 4 trục quét sáng phát hiện vùng khoảng trống chưa ai chạm tới',
    academicConcept: 'Knowledge Matrix 4 Axes (Bản đồ ma trận tri thức 4 trục)',
  },
  {
    id: 'beat_13',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước & Cầu dầm 3 tầng',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Sàng lọc các hạn chế này qua ba điều kiện khắt khe: Phải chạm tới cốt lõi học thuật, lặp lại ở nhiều bài báo uy tín, và hoàn toàn khả thi để kiểm định.',
    spokenText: 'Sàng lọc các hạn chế này qua ba điều kiện khắt khe: Phải chạm tới cốt lõi học thuật, lặp lại ở nhiều bài báo uy tín, và hoàn toàn khả thi để kiểm định.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Passing candidates through 3 cascading optical filter membranes',
    },
    visualCueId: 'cue_13_three_conditions_filter',
    visualMetaphor: 'Ba màng lọc quang học thanh lọc chỉ giữ lại hạn chế khả thi nhất',
    academicConcept: 'Filter 3 Conditions (Bộ lọc 3 điều kiện hạn chế)',
  },
  {
    id: 'beat_14',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước & Cầu dầm 3 tầng',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Từ đó, hãy bắc một cây cầu ba tầng vững chãi: Tầng nền móng tri thức đã biết, tầng xác lập vết nứt khoảng trống, và tầng định vị giải pháp nghiên cứu của bạn.',
    spokenText: 'Từ đó, hãy bắc một cây cầu ba tầng vững chãi: Tầng nền móng tri thức đã biết, tầng xác lập vết nứt khoảng trống, và tầng định vị giải pháp nghiên cứu của bạn.',
    characterAction: {
      pose: 'presenting',
      expression: 'delighted',
      action: 'Constructing 3-tier cantilever bridge spanning the chasm void',
    },
    visualCueId: 'cue_14_cantilever_bridge',
    visualMetaphor: 'Ba khối dầm cầu lần lượt vươn ra bắc qua vực sâu tri thức',
    academicConcept: 'Three-Tier Cantilever Bridge (Cấu trúc cầu dầm 3 tầng)',
  },
  {
    id: 'beat_15',
    sceneId: 'scene_03',
    partNumber: 3,
    partTitle: 'Quy trình 4 bước & Cầu dầm 3 tầng',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.35,
    narration: 'Khóa chốt cây cầu bằng công thức biến số chuẩn mực: Thừa kế các biến kinh điển, đồng thời bổ sung mắt xích mới để tạo nên bước nhảy tri thức.',
    spokenText: 'Khóa chốt cây cầu bằng công thức biến số chuẩn mực: Thừa kế các biến kinh điển, đồng thời bổ sung mắt xích mới để tạo nên bước nhảy tri thức.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Locking mathematical variable blocks A-B-C-D-E-M-F into bridge anchor pins',
    },
    visualCueId: 'cue_15_variable_formula',
    visualMetaphor: 'Các khối biến số khóa chặt vào khung cầu tạo liên kết vững như bàn thạch',
    academicConcept: 'Variable Formula A-B-C-D-E-M-F (Công thức biến số chuẩn hóa)',
  },

  // =========================================================================
  // PHẦN 4: TEMPLATE 4 CÂU & CASE STUDY NGÂN HÀNG SỐ (Beats 16 - 19)
  // =========================================================================
  {
    id: 'beat_16',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Hãy diễn đạt qua template bốn câu chuẩn mực quốc tế: Câu nêu nền tảng, câu vạch ra điểm chưa rõ, câu khẳng định ý nghĩa, và câu định vị giải pháp của bài báo.',
    spokenText: 'Hãy diễn đạt qua template bốn câu chuẩn mực quốc tế: Câu nêu nền tảng, câu vạch ra điểm chưa rõ, câu khẳng định ý nghĩa, và câu định vị giải pháp của bài báo.',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Stacking four modular template syntax blocks into a coherent paragraph',
    },
    visualCueId: 'cue_16_four_sentence_template',
    visualMetaphor: 'Bốn viên gạch câu lệnh ghép thành khối văn bản mở đầu chuẩn xác',
    academicConcept: 'Four-Sentence Template (Template 4 câu chuẩn quốc tế)',
  },
  {
    id: 'beat_17',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    role: 'evidence',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Hãy nhìn vào ví dụ ngân hàng số: Mô hình chấp nhận công nghệ TAM đã khẳng định tính hữu ích và sự dễ dùng là nền tảng cốt lõi.',
    spokenText: 'Hãy nhìn vào ví dụ ngân hàng số: Mô hình chấp nhận công nghệ TAM đã khẳng định tính hữu ích và sự dễ dùng là nền tảng cốt lõi.',
    characterAction: {
      pose: 'presenting',
      expression: 'delighted',
      action: 'Lighting up baseline TAM construct nodes: Perceived Usefulness & Ease of Use',
    },
    visualCueId: 'cue_17_tam_baseline',
    visualMetaphor: 'Mạch vi điện tử ngân hàng số kích hoạt các node PU và PEU',
    academicConcept: 'Digital Banking TAM Baseline (Mô hình TAM nền tảng)',
  },
  {
    id: 'beat_18',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    role: 'turn',
    speed: 1.10,
    pauseAfter: 0.35,
    narration: 'Dẫu vậy, cơ chế từ chất lượng dịch vụ điện tử đến ý định sử dụng lâu dài vẫn còn đầy mâu thuẫn tại các thị trường mới nổi.',
    spokenText: 'Dẫu vậy, cơ chế từ chất lượng dịch vụ điện tử đến ý định sử dụng lâu dài vẫn còn đầy mâu thuẫn tại các thị trường mới nổi.',
    characterAction: {
      pose: 'warning',
      expression: 'alert',
      action: 'Pointing out broken, flickering pulse between e-service quality and continuance intention',
    },
    visualCueId: 'cue_18_tam_conflict',
    visualMetaphor: 'Đường truyền tín hiệu dịch vụ điện tử bị gián đoạn và chập chờn',
    academicConcept: 'E-service Quality Contextual Conflict (Mâu thuẫn bối cảnh thị trường mới nổi)',
  },
  {
    id: 'beat_19',
    sceneId: 'scene_04',
    partNumber: 4,
    partTitle: 'Template 4 câu chuẩn & Case Study Ngân hàng số',
    role: 'payoff',
    speed: 1.08,
    pauseAfter: 0.38,
    narration: 'Bài báo mới sẽ lấp đầy vết nứt này bằng cách đưa vào biến trung gian sự hài lòng, cùng biến điều tiết rủi ro cảm nhận để hoàn thiện mô hình.',
    spokenText: 'Bài báo mới sẽ lấp đầy vết nứt này bằng cách đưa vào biến trung gian sự hài lòng, cùng biến điều tiết rủi ro cảm nhận để hoàn thiện mô hình.',
    characterAction: {
      pose: 'celebrating',
      expression: 'delighted',
      action: 'Snapping Mediator (Satisfaction) and Moderator (Risk) into place, completing circuit',
    },
    visualCueId: 'cue_19_tam_mediator_moderator',
    visualMetaphor: 'Hai node trung gian và điều tiết bổ sung khép kín toàn bộ mạch tín hiệu',
    academicConcept: 'Mediator Satisfaction & Moderator Risk (Giải pháp trung gian Hài lòng & điều tiết Rủi ro)',
  },

  // =========================================================================
  // PHẦN 5: 4 CẠM BẪY & KHÚC KHẢI HOÀN SCOPUS (Beats 20 - 23)
  // =========================================================================
  {
    id: 'beat_20',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Cạm bẫy & Khúc khải hoàn Scopus',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Hãy cảnh giác với hai cạm bẫy chết người: Tuyên bố khoảng trống mà thiếu bằng chứng trích dẫn, và ngộ nhận rằng bối cảnh mới đồng nghĩa với tính mới khoa học.',
    spokenText: 'Hãy cảnh giác với hai cạm bẫy chết người: Tuyên bố khoảng trống mà thiếu bằng chứng trích dẫn, và ngộ nhận rằng bối cảnh mới đồng nghĩa với tính mới khoa học.',
    characterAction: {
      pose: 'warning',
      expression: 'alert',
      action: 'Deflecting two incoming red warning hazard signs with defensive shield',
    },
    visualCueId: 'cue_20_pitfalls_1_2',
    visualMetaphor: 'Radar cảnh báo quét trúng hai dấu chéo đỏ nguy hiểm',
    academicConcept: 'Pitfalls 1 & 2 (Thiếu bằng chứng & Ngộ nhận bối cảnh)',
  },
  {
    id: 'beat_21',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Cạm bẫy & Khúc khải hoàn Scopus',
    role: 'body',
    speed: 1.08,
    pauseAfter: 0.30,
    narration: 'Đừng biến tổng quan thành bản liệt kê rời rạc, và tuyệt đối không bao giờ tách rời khoảng trống nghiên cứu khỏi thiết kế phương pháp kiểm định.',
    spokenText: 'Đừng biến tổng quan thành bản liệt kê rời rạc, và tuyệt đối không bao giờ tách rời khoảng trống nghiên cứu khỏi thiết kế phương pháp kiểm định.',
    characterAction: {
      pose: 'analyzing',
      expression: 'focused',
      action: 'Reorganizing disconnected citations into integrated methodological roadmap',
    },
    visualCueId: 'cue_21_pitfalls_3_4',
    visualMetaphor: 'Các trang tài liệu rời rạc được sắp xếp và kết nối đồng bộ vào phương pháp',
    academicConcept: 'Pitfalls 3 & 4 (Liệt kê nguồn & Tách rời phương pháp)',
  },
  {
    id: 'beat_22',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Cạm bẫy & Khúc khải hoàn Scopus',
    role: 'turn',
    speed: 1.10,
    pauseAfter: 0.35,
    narration: 'Giữ thăng bằng giữa hai cực đoan: Đừng vẽ ra những khoảng trống vĩ mô rỗng tuếch, nhưng cũng đừng trói mình vào một địa phương hẹp mà thiếu đi giá trị khái quát hóa.',
    spokenText: 'Giữ thăng bằng giữa hai cực đoan: Đừng vẽ ra những khoảng trống vĩ mô rỗng tuếch, nhưng cũng đừng trói mình vào một địa phương hẹp mà thiếu đi giá trị khái quát hóa.',
    characterAction: {
      pose: 'presenting',
      expression: 'focused',
      action: 'Balancing a scientific scale between macro-void and micro-parochialism',
    },
    visualCueId: 'cue_22_two_extremes',
    visualMetaphor: 'Chiếc cân học thuật tìm lại trạng thái cân bằng hoàn hảo',
    academicConcept: 'Two Extremes Balance (Tránh 2 cực đoan học thuật)',
  },
  {
    id: 'beat_23',
    sceneId: 'scene_05',
    partNumber: 5,
    partTitle: '4 Cạm bẫy & Khúc khải hoàn Scopus',
    role: 'close',
    speed: 1.06,
    pauseAfter: 0.36,
    narration: 'Một Research Gap thuyết phục chính là tấm hộ chiếu đưa bài báo của bạn bước vào cuộc đối thoại khoa học toàn cầu trên Scopus!',
    spokenText: 'Một Research Gap thuyết phục chính là tấm hộ chiếu đưa bài báo của bạn bước vào cuộc đối thoại khoa học toàn cầu trên Scopus!',
    characterAction: {
      pose: 'celebrating',
      expression: 'delighted',
      action: 'Holding up golden Scopus Accepted manuscript triumphantly with radiant glow',
    },
    visualCueId: 'cue_23_scopus_victory',
    visualMetaphor: 'Con dấu Scopus vàng kim tỏa sáng rực rỡ chứng nhận công bố thành công',
    academicConcept: 'Scopus Publication Victory (Nguyên lý cốt lõi & Khải hoàn Scopus)',
  },
];
