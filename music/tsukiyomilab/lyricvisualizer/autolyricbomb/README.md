# 月詠ラボ Lyric Motion Studio

The first UI prototype of the lyric motion editor, based on the existing Lyric Visualizer v0.5 code in the parent directory. The editor runs locally in the browser, preserving the existing image/video background, visualizers, lyric timing, project JSON, and recording features.

## Current scope

- Six selectable visual templates, implemented with the existing lyric and audio-reactive engine.
- Responsive workspace with a large preview and separate material, text, effect, and export panels.
- Separate browser autosave key (`tsukilab.autolyricbomb`) so the prototype does not overwrite the published editor's saved project.

Templates are combinations of the current settings. The empty preview now runs a looping sample using the same animation renderer as real lyrics; sample lyrics are never added to a project or export.

The **experimental browser transcription** uses the public multilingual `Xenova/whisper-tiny` model through `@huggingface/transformers@3.8.1` in a Web Worker. On first use, the model files are downloaded from the model host and cached by the browser; the song itself is processed locally and is not uploaded by this module. Audio is decoded and resampled to mono 16 kHz, transcribed in 25-second windows, and rough segment timestamps are editable in the timeline. This is an initial transcription pass on the mixed song: vocal separation, precise singing alignment, and Jev decision-making are not yet connected. The model can mishear lyrics or misplace timestamps, especially over dense accompaniment. Browser support, available memory, and access to the model host are required.

The separate experimental vocal-onset detector estimates timestamps for lyrics provided by the user; it does not transcribe the song.

No JIZURA source code or media is included in this prototype. The uploaded reference audio is not committed.
