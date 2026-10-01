#!/usr/bin/env python3
"""【お手元のPCで実行】投稿一式を YouTube にアップロードする。

準備(最初の1回だけ):
  1) Python 3.9 以上を入れる
  2) pip install google-api-python-client google-auth-oauthlib
  3) Google Cloud でダウンロードした OAuth クライアントの JSON を、このファイルと同じフォルダに
     client_secret.json という名前で置く

使い方:
  python yt_upload.py ep001_world_map_publish --video ep001_world_map.mp4
  python yt_upload.py ep001_world_map_publish --video ep001_world_map.mp4 --variant B   # タイトル/サムネのB案

初回だけブラウザが開き、Google アカウントでの許可を求められます(「確認されていないアプリ」と出たら
「詳細」→「(安全ではないページ)に移動」で続行。ご自身で作ったアプリなので問題ありません)。
許可すると token.json ができ、2回目以降はそのまま動きます。
※ client_secret.json と token.json は秘密の鍵です。人に渡したり、公開の場所に置いたりしないでください。

注意: Google の審査(監査)を受けていないアプリからのアップロードは、YouTube の決まりで「非公開」に固定されます。
アップロード後、YouTube Studio で公開設定(予約公開)を選んでください。
"""
import argparse, re, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube"]
TAGS = ["この世界のバグ図鑑", "ずんだもん", "春日部つむぎ", "雑学", "解説", "ニュース解説", "科学", "世界の不思議", "VOICEVOX"]


def credentials():
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request
    tok = HERE / "token.json"
    creds = Credentials.from_authorized_user_file(str(tok), SCOPES) if tok.exists() else None
    if creds and creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
        except Exception:
            creds = None  # 失効していたら認証し直す
    if not creds or not creds.valid:
        sec = HERE / "client_secret.json"
        if not sec.exists():
            sys.exit("client_secret.json がありません。Google Cloud でダウンロードした JSON をこの名前で置いてください。")
        creds = InstalledAppFlow.from_client_secrets_file(str(sec), SCOPES).run_local_server(port=0)
        tok.write_text(creds.to_json(), encoding="utf-8")
    return creds


def pick_title(pub, variant):
    lines = (pub / "titles.txt").read_text(encoding="utf-8").splitlines()
    for ln in lines:
        m = re.match(rf"案{variant}：(.+?)\s+\(\d+文字\)$", ln)
        if m:
            return m.group(1)
    sys.exit(f"titles.txt に 案{variant} が見つかりません")


def main():
    ap = argparse.ArgumentParser(description="投稿一式を YouTube にアップロード(非公開)")
    ap.add_argument("publish_dir", help="titles.txt / description.txt / thumbnail_*.jpg が入ったフォルダ")
    ap.add_argument("--video", required=True, help="動画ファイル(mp4)")
    ap.add_argument("--variant", default="A", choices=["A", "B", "C"], help="使うタイトルとサムネの案")
    a = ap.parse_args()
    pub, video = Path(a.publish_dir), Path(a.video)
    title = pick_title(pub, a.variant)
    desc = (pub / "description.txt").read_text(encoding="utf-8")
    thumb = pub / f"thumbnail_{a.variant}.jpg"
    if len(title) > 100 or len(desc) > 5000:
        sys.exit("タイトル(100文字)か概要欄(5000文字)が長すぎます")
    print(f"タイトル: {title}\n動画: {video.name}\nサムネ: {thumb.name}")

    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload
    yt = build("youtube", "v3", credentials=credentials())
    body = {
        "snippet": {"title": title, "description": desc, "tags": TAGS, "categoryId": "27",  # 27 = 教育
                    "defaultLanguage": "ja", "defaultAudioLanguage": "ja"},
        "status": {"privacyStatus": "private", "selfDeclaredMadeForKids": False},
    }
    req = yt.videos().insert(part="snippet,status", body=body,
                             media_body=MediaFileUpload(str(video), chunksize=8 * 1024 * 1024, resumable=True))
    resp = None
    while resp is None:
        status, resp = req.next_chunk()
        if status:
            print(f"  アップロード中… {int(status.progress() * 100)}%")
    vid = resp["id"]
    print(f"アップロード完了: https://studio.youtube.com/video/{vid}/edit")
    try:
        yt.thumbnails().set(videoId=vid, media_body=MediaFileUpload(str(thumb))).execute()
        print("サムネイルを設定しました")
    except Exception as e:
        print(f"サムネイルの設定に失敗しました(チャンネルの電話番号確認が必要な場合があります): {e}")
    print("\n次に YouTube Studio で: 公開設定を「スケジュール」にして日時を選ぶ → 必要なら「テストと比較」に残りの案を追加")


if __name__ == "__main__":
    main()
