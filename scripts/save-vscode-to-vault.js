#!/usr/bin/env node
// Stop hook（ユーザーレベル）: VSCode拡張機能のClaude Codeから実行された場合のみ、
// どのプロジェクトを開いていてもObsidianのフォルダの99_プロンプトログ/VSCodeに会話ログを保存する。
// VSCode以外（ターミナル/CLI単体実行）の場合は何もしない。
// 環境依存パスはなし。save-transcript.jsと同じフォルダに置くことで、相対requireで
// 読み込めるため、メンバーごとの編集は不要。
// settings.json側（ユーザーレベル）で本ファイルへの絶対パスを各自の環境に合わせて設定すること。
const fs = require('fs');
const { saveTranscript } = require('./save-transcript');

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

  saveTranscript(input);
}

main();
