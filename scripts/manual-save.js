// 手動保存コマンド: node manual-save.js <セッションID>
// 環境ごとに固有のパスはなし。トランスクリプトは ~/.claude/projects/ 配下を
// セッションID(ファイル名)で再帰検索し、Obsidianのフォルダはこのファイルの2階層上
// (<Obsidianのフォルダ>/.claude/scripts/manual-save.js)として自動算出する。
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const sessionId = process.argv[2];
if (!sessionId) {
  console.error('使い方: node manual-save.js <セッションID>');
  process.exit(1);
}

function findTranscriptPath(dir, fileName) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const found = findTranscriptPath(full, fileName);
      if (found) return found;
    } else if (entry.name === fileName) {
      return full;
    }
  }
  return null;
}

const projectsRoot = path.join(os.homedir(), '.claude', 'projects');
const transcriptPath = findTranscriptPath(projectsRoot, `${sessionId}.jsonl`);
if (!transcriptPath) {
  console.error(`トランスクリプトが見つかりません: ${sessionId}.jsonl (検索場所: ${projectsRoot})`);
  process.exit(1);
}

const payload = JSON.stringify({
  session_id: sessionId,
  transcript_path: transcriptPath,
});

const result = spawnSync(
  'node',
  [path.join(__dirname, 'save-transcript.js')],
  { input: payload, encoding: 'utf8' }
);
console.log('status', result.status, result.stderr);
