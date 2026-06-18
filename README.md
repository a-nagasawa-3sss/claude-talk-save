Claude Codeのhook機能を使い、会話内容をMarkdownに変換してObsidian（Vault）内の `99_プロンプトログ/` フォルダに自動・手動で保存する仕組みのセットアップ手順。

**Obsidian（ターミナル/CLIでClaude Codeを使う場合）と、VSCode拡張機能でClaude Codeを使う場合の両方に対応している。それぞれ別セクションに手順を記載しているので、自分が使う方だけ実施すればよい（両方使う場合は両方実施する）。**

---

### 対象環境
Windows
（node.jsで動かしているのでjsファイルは問題ないと思いますが、Macの方はjsonファイルを適宜コードの修正を行ってください。）
- .mdエディターとしてObsidianを利用
	- 動作確認済みClaudeプラグイン：Blackglass
- コードエディターとしてVSCodeを利用
	- 動作確認済みClaudeプラグイン：Claude Code for VS Code

```
導入時は各環境に合わせ適切に行ってください。
※動作保証はないので導入時は自己責任でお願いします。
```

---

## できること

- セッション終了時（`/clear`・compactなども含む）に自動で会話ログを保存
- 会話中に `save` と入力するといつでも手動保存
- 保存先フォルダ `99_プロンプトログ/` が存在しない場合は自動生成
- ターミナル/CLIから実行した場合は `99_プロンプトログ/Obsidian/`、VSCode拡張機能のClaude Codeから実行した場合は `99_プロンプトログ/VSCode/` に自動で振り分けて保存（実行環境をスクリプトが自動判定するため、設定は不要）
- Obsidian上でVSCodeの会話履歴を管理できる

---

## 導入メリット

- **Claudeとのやり取りが消えずに残る**: ターミナルやVSCodeを閉じると見えなくなる会話内容が、Obsidianのフォルダ内にMarkdownとして自動的に残るため、後から見返せる
- **チーム内でのナレッジ共有**: 誰かがClaudeに質問して得た回答や進め方を、他のメンバーもObsidianのフォルダ内で検索して再利用できる（同じ質問を何度も調べ直す手間が減る）
- **作業の振り返り・引き継ぎがしやすい**: 「どういう指示をして、どう進めたか」がそのまま記録に残るため、別の人が途中から引き継ぐ場合や、後で経緯を確認したい場合に役立つ
- **手間がかからない**: 一度設定すれば、その後は意識せずに自動保存される（手動で保存したい時だけ `save` と入力すればよい）

> 注意点
> - この手順は **Windows環境** を前提に記載している（パスの区切りが `\`、コマンド例もWindows向け）。Mac/Linuxの場合はパスの書き方やコマンドが異なるため、別途読み替えが必要
> - VSCode/CLIの判定は環境変数による簡易的な判定であり、Claude Code公式に保証された方法ではない（将来の仕様変更で判定がずれる可能性がある）
> - 保存されるのはユーザーの発言とClaudeの返答テキストのみ。Claudeが実行したファイル編集・コマンド実行などの操作ログ（tool_use/tool_result）や、内部の思考過程（thinking）は保存されない
> - 会話の機密性に注意。Obsidianのフォルダ内にMarkdownとして残るため、社外秘情報や個人情報を含む会話を保存する場合はObsidianのフォルダの共有範囲・アクセス権を確認すること
> - VSCode用の設定（パソコン単位のユーザー設定）は、複数のパソコンを使う場合はそれぞれの端末で個別に設定が必要

---

## 前提: Node.jsのインストール（共通・最初に1回だけ）

スクリプトはNode.jsで動作する。未インストールの場合は以下を実施する。

1. ターミナルで確認

   ```bash
   node --version
   ```

   バージョンが表示されればインストール済み（v18以降推奨）。

2. 表示されない場合は [Node.js公式サイト](https://nodejs.org/) からLTS版をインストールする。

---

## 共通の準備: Obsidianフォルダ側スクリプトの設置

**Obsidian・VSCodeのどちらを使う場合でも、必ず最初にこの準備が必要。Obsidian用・VSCode用のスクリプトもすべて同じ場所（Obsidianのフォルダ内）に設置する。**

Obsidianのフォルダ直下に `.claude/scripts/` フォルダを作成し、以下の5ファイルを設置する。

```text
保存処理の本体
<Obsidianのフォルダ>/.claude/scripts/save-transcript.js
`save`入力での手動保存トリガー、Obsidian用
<Obsidianのフォルダ>/.claude/scripts/save-on-keyword.js
コマンドラインから明示的に保存する用、任意
<Obsidianのフォルダ>/.claude/scripts/manual-save.js
会話終了時の自動保存、VSCode用
<Obsidianのフォルダ>/.claude/scripts/save-vscode-to-vault.js
`save`入力での手動保存、VSCode用
<Obsidianのフォルダ>/.claude/scripts/save-vscode-on-keyword.js
```
ここまでがObsidian・VSCode共通の準備。ここから先は、自分が使う方のセクションだけ進める。

---

## セクションA: Obsidian

### A-1. settings.local.jsonにhookを設定する

`<Obsidianのフォルダ>/.claude/settings.local.json` を開き（なければ新規作成）、`hooks` を追記する。

**`<自分のObsidianフォルダの絶対パス>` の部分は、自分の環境のパスに置き換えること。**（Windowsの場合は `\` を `\\` でエスケープする）

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<自分のObsidianフォルダの絶対パス>\\.claude\\scripts\\save-transcript.js\""
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<自分のObsidianフォルダの絶対パス>\\.claude\\scripts\\save-on-keyword.js\""
          }
        ]
      }
    ]
  }
}
```

例（Windows・ユーザー名が `taro` の場合）:

```json
"command": "node \"C:\\Users\\taro\\Obsidian\\knowledge-base\\.claude\\scripts\\save-transcript.js\""
```

すでに `settings.local.json` に他の設定（`permissions` など）がある場合は、既存の内容を残したまま `hooks` キーを追加すること（置き換えない）。

`settings.local.json` は個人設定用でGit管理対象外（`.gitignore`相当）のため、各メンバーが自分の環境のパスで個別に設定する。

### A-2. 反映確認

設定後、Claude Codeで一度 `/hooks` を開く（または新しいセッションを開始する）と設定が反映される。

会話中に以下のように入力すると、保存されたことを示すメッセージが表示される。

```text
save
```

`99_プロンプトログ/Obsidian/` フォルダにMarkdownファイルが生成されていれば成功。

---

## セクションB: VSCode拡張機能でClaude Codeを使う場合

VSCodeの「Claude Code」拡張機能を使う人向け。VSCodeでは案件ごとに別々のフォルダ（プロジェクト）を開くことが多いため、セクションAの「プロジェクト単位」の設定だけでは、Obsidianのフォルダ以外のフォルダを開いたときに保存されない。

そのため、VSCodeでは**「どのフォルダを開いていても必ずObsidianのフォルダに保存される」共通設定（ユーザーレベル設定）**を1回だけ行う。これを設定すれば、以後VSCodeでどのプロジェクトを開いてClaude Codeを使っても、自動的にこのObsidianのフォルダの `99_プロンプトログ/VSCode/` に保存される。

スクリプト自体は「共通の準備」でObsidianのフォルダ内にすでに設置済みのため、ここで新たに作成するファイルはない。行うのは、**自分の端末のユーザーレベル設定**（`settings.json`）にhookを追記することだけ。

### B-1. ユーザーレベルのsettings.jsonにhookを設定する

`<ユーザーフォルダ>\.claude\settings.json`（Windowsの場合 `C:\Users\<ユーザー名>\.claude\settings.json`）を開き（なければ新規作成）、`hooks` を追記する。

**これはObsidianのフォルダの中ではなく、自分の端末のユーザー設定なので、Obsidianのフォルダの外（ユーザーフォルダ配下）にあるファイルであることに注意。一方、hookが指す先（`command`）は「共通の準備」で設置したObsidianのフォルダ内のスクリプトを指す。**

**`<自分のObsidianフォルダの絶対パス>` の部分は、自分の環境のパスに置き換えること。**

```json
{
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<自分のObsidianフォルダの絶対パス>\\.claude\\scripts\\save-vscode-to-vault.js\""
          }
        ]
      }
    ],
    "UserPromptSubmit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node \"<自分のObsidianフォルダの絶対パス>\\.claude\\scripts\\save-vscode-on-keyword.js\""
          }
        ]
      }
    ]
  }
}
```

例（Windows・ユーザー名が `taro` の場合）:

```json
"command": "node \"C:\\Users\\taro\\Obsidian\\knowledge-base\\.claude\\scripts\\save-vscode-to-vault.js\""
```

すでに `settings.json` に他の設定（`theme` や `model` など）がある場合は、既存の内容を残したまま `hooks` キーを追加すること（置き換えない）。

### B-2. 反映確認

設定後、VSCodeでClaude Code拡張機能を再起動する（VSCodeを再起動するか、拡張機能のチャットを開き直す）と設定が反映される。

どのプロジェクトを開いていてもよいので、Claude Codeのチャットで以下のように入力する。

```text
save
```

このObsidianのフォルダの `99_プロンプトログ/VSCode/` フォルダにMarkdownファイルが生成されていれば成功。

---

## 補足（共通）

- ファイル名は `日時_セッションID先頭8文字.md` の形式（同じセッション内で `save` や `Stop` が複数回発火しても同じファイルが上書き更新される）
- 保存対象はユーザー発言とアシスタントの返答テキストのみ（thinkingやtool_use/tool_resultは含まない）
- 実行環境（CLI/VSCode）の判定は環境変数（`VSCODE_PID` など）に基づく非公式な簡易判定のため、環境によって振り分けがずれる場合は `save-transcript.js` の `detectClientFolder()` を調整すること
- 保存先フォルダの基準（Obsidianのフォルダ）は `save-transcript.js` 自身の設置場所から算出するため、Claude Codeの作業ディレクトリ（`cd`操作などで変動しうる）には依存しない
- VSCode用の設定（セクションB）は端末1台ごとに1回、ユーザーレベルの`settings.json`にhookを設定すればよい。スクリプト自体はObsidianのフォルダ内にあるものを共有して使うため、端末ごとに別ファイルを作る必要はない（Obsidianのフォルダを複数台のパソコンで使う場合は、各端末の`settings.json`にそれぞれhookを設定する）
- 不要な会話履歴は各自で削除してください。
  誤って削除してもセッションが残っていればsaveコマンドや会話を再開することで再度保存できます。
- もし正常に動作しない場合は、とりあえず指定のフォルダに設置し、AIに読み込ませれば何とかなるはず。
