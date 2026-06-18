#!/usr/bin/env node
// UserPromptSubmit hook: プロンプトが「save」のときだけ会話ログを保存する
// 環境依存パスはなし。settings.local.json側で本ファイルへの絶対パスを
// 各自の環境に合わせて設定すること。
const fs = require('fs');
const { saveTranscript } = require('./save-transcript');

const TRIGGER = 'save';

function readStdin() {
  try {
    return fs.readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function main() {
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
