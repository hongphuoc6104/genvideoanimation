import * as fs from 'fs';
import * as path from 'path';

interface WordDef {
  word: string;
}

interface ChunkDef {
  id: string;
  startFrame: number;
  endFrame: number;
  line1: string[];
  line2: string[];
}

const CHUNKS_DEF: ChunkDef[] = [
  {
    id: "chunk_01",
    startFrame: 1,
    endFrame: 148,
    line1: ["Năm", "máy", "chủ", "bắt", "đầu", "ở", "vai", "trò", "Follower,"],
    line2: ["với", "đồng", "hồ", "đếm", "ngược", "bầu", "cử", "ngẫu", "nhiên."]
  },
  {
    id: "chunk_02",
    startFrame: 150,
    endFrame: 298,
    line1: ["Node", "S1", "hết", "giờ", "trước,", "thành", "Candidate,"],
    line2: ["đồng", "loạt", "gửi", "RequestVote", "tới", "toàn", "bộ", "cụm."]
  },
  {
    id: "chunk_03",
    startFrame: 300,
    endFrame: 448,
    line1: ["Thu", "thập", "đủ", "bốn", "phiếu", "vượt", "quá", "bán", "Quorum,"],
    line2: ["S1", "đắc", "cử", "Leader", "và", "phát", "sóng", "Heartbeat."]
  },
  {
    id: "chunk_04",
    startFrame: 450,
    endFrame: 598,
    line1: ["Client", "gửi", "lệnh", "ghi", "dữ", "liệu", "tới", "Leader", "S1,"],
    line2: ["entry", "được", "thêm", "vào", "nhật", "ký", "chưa", "commit."]
  },
  {
    id: "chunk_05",
    startFrame: 600,
    endFrame: 748,
    line1: ["Leader", "gửi", "AppendEntries", "tới", "các", "Follower,"],
    line2: ["các", "node", "sao", "chép", "và", "gửi", "xác", "nhận", "về."]
  },
  {
    id: "chunk_06",
    startFrame: 750,
    endFrame: 898,
    line1: ["Đạt", "đủ", "ba", "xác", "nhận", "Quorum", "từ", "đa", "số", "node,"],
    line2: ["Leader", "commit", "nhật", "ký", "vào", "State", "Machine."]
  },
  {
    id: "chunk_07",
    startFrame: 900,
    endFrame: 1048,
    line1: ["Mạng", "bị", "phân", "vùng", "chia", "cắt", "cụm", "làm", "đôi,"],
    line2: ["nhóm", "thiểu", "số", "không", "thể", "commit", "lệnh", "mới."]
  },
  {
    id: "chunk_08",
    startFrame: 1050,
    endFrame: 1198,
    line1: ["Phân", "vùng", "đa", "số", "bầu", "S3", "làm", "Leader", "mới,"],
    line2: ["tiếp", "tục", "commit", "các", "entry", "ở", "Term", "ba."]
  },
  {
    id: "chunk_09",
    startFrame: 1200,
    endFrame: 1348,
    line1: ["Mạng", "phục", "hồi,", "S1", "thoái", "lui", "Follower,"],
    line2: ["nhật", "ký", "đồng", "bộ", "an", "toàn", "tuyệt", "đối."]
  }
];

const groups = CHUNKS_DEF.map((def, cIdx) => {
  const allWordsRaw = [...def.line1, ...def.line2];
  const totalWords = allWordsRaw.length;
  const chunkStartFrame = def.startFrame;
  const chunkEndFrame = def.endFrame;
  const frameSpan = chunkEndFrame - chunkStartFrame;

  let wordGlobalIdx = 0;
  function processLine(words: string[], lineStartRatio: number, lineEndRatio: number) {
    const lineStartFrame = chunkStartFrame + Math.round(frameSpan * lineStartRatio);
    const lineEndFrame = chunkStartFrame + Math.round(frameSpan * lineEndRatio);
    const lineSpan = lineEndFrame - lineStartFrame;
    const n = words.length;

    const wordObjects = words.map((w, wIdx) => {
      const wStartFrame = lineStartFrame + Math.round((wIdx / n) * lineSpan);
      const wEndFrame = Math.min(lineEndFrame, lineStartFrame + Math.round(((wIdx + 0.85) / n) * lineSpan));
      const startSec = Math.round((wStartFrame / 30) * 1000) / 1000;
      const endSec = Math.round((wEndFrame / 30) * 1000) / 1000;
      const cleanWord = w.toLowerCase().replace(/[^a-z0-9à-ỹ]/g, '');

      return {
        id: `w_${cIdx}_${wordGlobalIdx++}`,
        word: w,
        cleanWord,
        start: startSec,
        end: endSec,
        startFrame: wStartFrame,
        endFrame: wEndFrame,
      };
    });

    return {
      text: words.join(' '),
      words: wordObjects,
    };
  }

  const line1Obj = processLine(def.line1, 0.0, 0.48);
  const line2Obj = processLine(def.line2, 0.52, 1.0);
  const allWordObjs = [...line1Obj.words, ...line2Obj.words];

  return {
    id: def.id,
    text: `${line1Obj.text} ${line2Obj.text}`,
    startFrame: def.startFrame,
    endFrame: def.endFrame,
    startTime: Math.round((def.startFrame / 30) * 1000) / 1000,
    endTime: Math.round((def.endFrame / 30) * 1000) / 1000,
    box: {
      x: 80,
      y: 1470,
      width: 920,
      height: 170,
    },
    lines: [line1Obj, line2Obj],
    words: allWordObjs,
  };
});

const outputPath = path.resolve(__dirname, '../connection-film/src/projects/raft-consensus/subtitles/captions.json');
fs.writeFileSync(outputPath, JSON.stringify(groups, null, 2), 'utf-8');
console.log(`Wrote ${groups.length} caption groups to ${outputPath}`);
