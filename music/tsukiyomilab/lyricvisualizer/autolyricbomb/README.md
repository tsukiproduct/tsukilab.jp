# 月詠ラボ Lyric Motion Studio

The first UI prototype of the lyric motion editor, based on the existing Lyric Visualizer v0.5 code in the parent directory. The editor runs locally in the browser, preserving the existing image/video background, visualizers, lyric timing, project JSON, and recording features.

## Current scope

- Six selectable visual templates, implemented with the existing lyric and audio-reactive engine.
- Responsive workspace with a large preview and separate material, text, effect, and export panels.
- Separate browser autosave key (`tsukilab.autolyricbomb`) so the prototype does not overwrite the published editor's saved project.

Templates are combinations of the current settings. Automatic lyric transcription and Jev decision-making are not yet connected. The experimental vocal-onset detector estimates timestamps for lyrics provided by the user; it does not transcribe the song.

No JIZURA source code or media is included in this prototype. The uploaded reference audio is not committed.
