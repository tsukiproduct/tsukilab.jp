/**
 * バージョン情報（タイトル画面に表示する）
 *
 * GitHub Pages はキャッシュが効くので、開いている画面が新しいビルドかどうかを
 * ここで判別できるようにしてある。素材や演出を足したら BUILD も更新すること。
 *
 * 【重要】package.json の "version" と同じ値にすること。
 *         表示に使うのはこのファイル（package.json は実行時に読み込まない）。
 */
export const VERSION = '0.3.0';
export const BUILD   = '2026-08-13';

/** 例: "v0.3.0 (2026-08-13)" */
export const VERSION_LABEL = `v${VERSION} (${BUILD})`;
