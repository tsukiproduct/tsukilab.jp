// ライブ演出ツールの共通設定（スクリーン側・スマホ側の両方が読み込む）
// スタンプやメッセージを差し替えるときは、このファイルだけ編集すれば OK。
window.LIVE_CONFIG = {
  // PeerJS 上でスクリーンを見つけるための ID の頭につける文字列
  peerPrefix: 'tsukilab-live-',
  // PeerJS の接続先。空なら PeerJS の無料公開サーバーを使う。
  // 自前のサーバーに切り替えるときの例: { host: 'peer.example.com', port: 443, path: '/', secure: true }
  peerOptions: {},

  // スマホから送れるスタンプ（id はそのまま通信に使うので英数字で）
  stamps: [
    { id: 'fire',  emoji: '🔥', label: 'アツい' },
    { id: 'clap',  emoji: '👏', label: '拍手' },
    { id: 'heart', emoji: '💖', label: '好き' },
    { id: 'cry',   emoji: '😭', label: '泣ける' },
    { id: 'laugh', emoji: '🤣', label: 'ウケる' },
    { id: 'party', emoji: '🎉', label: 'おめでとう' },
    { id: 'hands', emoji: '🙌', label: '最高' },
    { id: 'spark', emoji: '✨', label: 'キラキラ' },
  ],

  // スマホから送れる定型メッセージ（自由入力は荒らし対策のため試作版では無し）
  messages: [
    '最高！', 'アンコール！', 'かっこいい！', 'かわいい！',
    'エモい…', 'もう一回！', 'ありがとう！', 'wwww',
  ],

  // スマホ側：連打しすぎ防止の間隔（ミリ秒）
  sendCooldownMs: 250,
  // スクリーン側：1人あたり1秒に受け付ける最大数（超えた分は捨てる）
  hostMaxPerSec: 6,
  // スタンプ1回でゲージが増える量（100 で FEVER）
  gaugePerStamp: 1.2,
  gaugePerMessage: 2,
};
