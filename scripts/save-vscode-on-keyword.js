#!/usr/bin/env node
// UserPromptSubmit hook（ユーザーレベル）: VSCode拡張機能のClaude Codeで、
// プロンプトが「save」のときだけ、どのプロジェクトを開いていてもObsidianのフォルダの
// 99_プロンプトログ/VSCodeに会話ログを保存する。
// VSCode以外（ターミナル/CLI単体実行）の場合は何もしない。
// 環境依存パスはなし。save-transcript.jsと同じフォルダに置くことで、相対requireで
// 読み込めるため、メンバーごとの編集は不要。
// settings.json側（ユーザーレベル）で本ファイルへの絶対パスを各自の環境に合わせて設定すること。
const fs = require('fs');
const { saveTranscript } = require('./save-transcript');

const TRIGGER = 'save';

function isVSCode() {
  return (
    !!process.env.VSCODE_PID ||
    !!process.env.VSCODE_GIT_IPC_HANDLE ||
    process.env.TERM_PROGRAM === 'vscode'
  );
}

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  if (!isVSCode()) return;

  let input = {};
  try {
    input = JSON.parse(readStdin() || '{}');
  } catch {
    input = {};
  }

  const prompt = (input.prompt || '').trim();
  if (prompt !== TRIGGER) return;

  const outPath = saveTranscript(input);
  if (outPath) {
    console.log(JSON.stringify({ systemMessage: `会話ログを保存しました: ${outPath}` }));
  }
}

main();
