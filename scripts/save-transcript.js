#!/usr/bin/env node
// Stop hook: 会話の全文ログをMarkdownに変換してObsidianのフォルダ内の99_プロンプトログに保存する
// 環境依存パスはなし。transcript_pathはhookの標準入力(JSON)から受け取るため、
// メンバーごとの編集は不要。settings.local.json側で本ファイルへの絶対パスを
// 各自の環境に合わせて設定すること。
// 保存先(VAULT_ROOT)はhook入力のcwdに依存せず、本ファイルの設置場所
// (<Obsidianのフォルダ>/.claude/scripts/save-transcript.js)から固定的に算出する。
// cwdはBashツールでのcd操作等により変動するため、保存先の基準には使わない。
const fs = require('fs');
const path = require('path');

const VAULT_ROOT = path.resolve(__dirname, '..', '..');

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function extractText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content
    .filter((b) => b && b.type === 'text' && typeof b.text === 'string')
    .map((b) => b.text)
    .join('\n');
}

function formatDate(d) {
  const p = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}_` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}

// VSCode拡張機能のClaude Codeから起動された場合に設定される環境変数で判定する。
// 公式に保証された判定方法ではないため、判定がずれる場合はここを調整する。
function detectClientFolder() {
  const isVSCode =
    !!process.env.VSCODE_PID ||
    !!process.env.VSCODE_GIT_IPC_HANDLE ||
    process.env.TERM_PROGRAM === 'vscode';
  return isVSCode ? 'VSCode' : 'Obsidian';
}

function saveTranscript(input) {
  const transcriptPath = input.transcript_path;
  const sessionId = input.session_id || 'unknown-session';

  if (!transcriptPath || !fs.existsSync(transcriptPath)) {
    return null;
  }

  const lines = fs.readFileSync(transcriptPath, 'utf8').split('\n').filter(Boolean);

  const turns = [];
  let firstTimestamp = null;

  for (const line of lines) {
    let obj;
    try {
      obj = JSON.parse(line);
    } catch {
      continue;
    }

    if (obj.timestamp && !firstTimestamp) firstTimestamp = obj.timestamp;

    if (obj.isMeta) continue;
    if (obj.type !== 'user' && obj.type !== 'assistant') continue;

    const msg = obj.message;
    if (!msg) continue;

    const text = extractText(msg.content).trim();
    if (!text) continue;

    turns.push({
      role: msg.role === 'user' ? 'User' : 'Assistant',
      timestamp: obj.timestamp,
      text,
    });
  }

  if (turns.length === 0) return null;

  const startDate = firstTimestamp ? new Date(firstTimestamp) : new Date();
  const dateStr = formatDate(startDate);
  const sessionShort = sessionId.slice(0, 8);
  const fileBase = `${dateStr}_${sessionShort}`;
  const title = `プロンプトログ_${fileBase}`;

  const outDir = path.join(VAULT_ROOT, '99_プロンプトログ', detectClientFolder());
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${fileBase}.md`);

  const body = turns
    .map((t) => `## ${t.role} (${t.timestamp})\n\n${t.text}\n`)
    .join('\n');

  const content = `# ${title}\n\n- セッションID: ${sessionId}\n- 開始: ${startDate.toISOString()}\n\n---\n\n${body}`;

  fs.writeFileSync(outPath, content, 'utf8');
  return outPath;
}

function main() {
  let input = {};
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    input = {};
  }
  saveTranscript(input);
}

module.exports = { saveTranscript };

if (require.main === module) {
  main();
}
