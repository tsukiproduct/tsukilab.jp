import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  Eye,
  Pause,
  Play,
  Volume2,
  VolumeX,
} from "lucide-react";

type ExperienceMode = "standard" | "quiet";

const evidence = [
  {
    id: "voice",
    number: "01",
    title: "管理人の録音",
    meta: "CASSETTE / 1998.12.18",
  },
  {
    id: "camera",
    number: "02",
    title: "階段の監視映像",
    meta: "HI-8 / 03:12-03:21",
  },
  {
    id: "phone",
    number: "03",
    title: "未送信の留守電",
    meta: "ANSWERPHONE / TAPE B",
  },
] as const;

function useHorrorAudio() {
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const start = useCallback(() => {
    if (contextRef.current) {
      void contextRef.current.resume();
      return;
    }

    const context = new AudioContext();
    const master = context.createGain();
    const filter = context.createBiquadFilter();
    const droneA = context.createOscillator();
    const droneB = context.createOscillator();
    const lfo = context.createOscillator();
    const lfoGain = context.createGain();

    master.gain.setValueAtTime(0.0001, context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.055, context.currentTime + 2.8);
    filter.type = "lowpass";
    filter.frequency.value = 310;
    filter.Q.value = 3;
    droneA.type = "sine";
    droneA.frequency.value = 43;
    droneB.type = "sawtooth";
    droneB.frequency.value = 57.4;
    lfo.frequency.value = 0.11;
    lfoGain.gain.value = 0.018;

    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    droneA.connect(filter);
    droneB.connect(filter);
    filter.connect(master);

    const noiseBuffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseData.length; index += 1) {
      noiseData[index] = (Math.random() * 2 - 1) * 0.11;
    }
    const noise = context.createBufferSource();
    const noiseFilter = context.createBiquadFilter();
    noise.buffer = noiseBuffer;
    noise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 980;
    noiseFilter.Q.value = 0.7;
    noise.connect(noiseFilter);
    noiseFilter.connect(master);
    master.connect(context.destination);

    droneA.start();
    droneB.start();
    lfo.start();
    noise.start();
    contextRef.current = context;
    masterRef.current = master;
  }, []);

  const stop = useCallback(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;

    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), context.currentTime);
    master.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
    window.setTimeout(() => void context.close(), 420);
    contextRef.current = null;
    masterRef.current = null;
  }, []);

  const knock = useCallback(() => {
    const context = contextRef.current;
    const master = masterRef.current;
    if (!context || !master) return;

    [0, 0.19, 0.51].forEach((delay, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(92 - index * 9, context.currentTime + delay);
      gain.gain.setValueAtTime(0.0001, context.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.2, context.currentTime + delay + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + delay + 0.14);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + 0.17);
    });
  }, []);

  const shock = useCallback(() => {
    const context = contextRef.current;
    if (!context) return;

    const gain = context.createGain();
    const filter = context.createBiquadFilter();
    const oscillator = context.createOscillator();
    const buffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < data.length; index += 1) {
      data[index] = Math.random() * 2 - 1;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    filter.type = "highpass";
    filter.frequency.value = 850;
    gain.gain.setValueAtTime(0.18, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.55);
    oscillator.type = "sawtooth";
    oscillator.frequency.setValueAtTime(270, context.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(51, context.currentTime + 0.46);
    noise.connect(filter);
    filter.connect(gain);
    oscillator.connect(gain);
    gain.connect(context.destination);
    noise.start();
    oscillator.start();
    noise.stop(context.currentTime + 0.58);
    oscillator.stop(context.currentTime + 0.58);
  }, []);

  useEffect(() => stop, [stop]);

  return { start, stop, knock, shock };
}

function Grain() {
  return (
    <>
      <div className="scanlines" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
    </>
  );
}

function Reveal({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 42 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [intense, setIntense] = useState(true);
  const [activeEvidence, setActiveEvidence] = useState(0);
  const [recording, setRecording] = useState(false);
  const [scrub, setScrub] = useState(23);
  const [cameraFound, setCameraFound] = useState(false);
  const [answer, setAnswer] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [unlocked, setUnlocked] = useState(false);
  const [jumpScare, setJumpScare] = useState(false);
  const [disturbance, setDisturbance] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const { start, stop, knock, shock } = useHorrorAudio();

  const enterExperience = (mode: ExperienceMode) => {
    const isStandard = mode === "standard";
    setEntered(true);
    setIntense(isStandard);
    setSoundOn(isStandard);
    if (isStandard) start();
  };

  const toggleSound = () => {
    if (soundOn) {
      stop();
      setSoundOn(false);
    } else {
      start();
      setSoundOn(true);
    }
  };

  const playRecording = () => {
    if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
    const willPlay = !recording;
    setRecording(willPlay);
    if (willPlay) {
      if (soundOn) knock();
      recordingTimerRef.current = window.setTimeout(() => setRecording(false), 6800);
    }
  };

  const changeScrub = (value: number) => {
    setScrub(value);
    if (value >= 72 && value <= 82) setCameraFound(true);
  };

  const submitAnswer = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (answer === "0317") {
      setUnlocked(true);
      if (intense) {
        window.setTimeout(() => {
          setJumpScare(true);
          if (soundOn) shock();
          window.setTimeout(() => setJumpScare(false), 1250);
        }, 720);
      }
      window.setTimeout(() => document.querySelector("#ending")?.scrollIntoView({ behavior: "smooth" }), 1700);
      return;
    }
    setAttempts((current) => current + 1);
    setAnswer("");
    if (soundOn) knock();
  };

  useEffect(() => {
    const handlePointer = (event: PointerEvent) => {
      pageRef.current?.style.setProperty("--cursor-x", `${event.clientX}px`);
      pageRef.current?.style.setProperty("--cursor-y", `${event.clientY}px`);
    };
    window.addEventListener("pointermove", handlePointer);
    return () => window.removeEventListener("pointermove", handlePointer);
  }, []);

  useEffect(() => {
    if (!entered || !intense) return;
    const interval = window.setInterval(() => {
      setDisturbance(true);
      window.setTimeout(() => setDisturbance(false), 160);
    }, 11300);
    return () => window.clearInterval(interval);
  }, [entered, intense]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setJumpScare(false);
      setIntense(false);
      if (soundOn) {
        stop();
        setSoundOn(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [soundOn, stop]);

  useEffect(
    () => () => {
      if (recordingTimerRef.current) window.clearTimeout(recordingTimerRef.current);
    },
    [],
  );

  return (
    <div ref={pageRef} className={`site-shell ${disturbance ? "is-disturbed" : ""}`}>
      <AnimatePresence>
        {!entered && (
          <motion.div
            className="entry-gate"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, filter: "blur(18px)" }}
            transition={{ duration: 1.1 }}
          >
            <div className="entry-image" aria-hidden="true" />
            <div className="entry-vignette" aria-hidden="true" />
            <Grain />
            <motion.main
              className="entry-content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.4, delay: 0.3 }}
            >
              <p className="entry-kana">きかい</p>
              <h1 className="entry-brand" data-text="記界">
                記界
              </h1>
              <p className="entry-roman">KIKAI / THE ARCHIVE THAT REMEMBERS YOU</p>
              <p className="entry-lead">この記録は、あなたを記録する。</p>
              <p className="entry-warning">
                突然の映像・音響・点滅表現を含みます。
                <br />
                心臓の弱い方、体調の優れない方は静穏閲覧を選択してください。
              </p>
              <div className="entry-actions">
                <button type="button" className="primary-action" onClick={() => enterExperience("standard")}>
                  音を有効にして入る
                  <ArrowRight size={16} strokeWidth={1.5} />
                </button>
                <button type="button" className="quiet-action" onClick={() => enterExperience("quiet")}>
                  静穏閲覧（音・強い演出なし）
                </button>
              </div>
            </motion.main>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {jumpScare && (
          <motion.div
            className="jump-scare"
            initial={{ opacity: 0, scale: 1.35 }}
            animate={{ opacity: [0, 1, 0.86, 1], scale: [1.35, 1, 1.08, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, times: [0, 0.2, 0.55, 1] }}
            role="alert"
            aria-label="強い演出"
          >
            <div className="scare-room" />
            <div className="scare-figure" aria-hidden="true">
              <span className="scare-eye scare-eye-left" />
              <span className="scare-eye scare-eye-right" />
            </div>
            <p>みつけた</p>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="site-header">
        <a href="#top" className="header-brand" aria-label="記界 トップへ">
          <span>記界</span>
          <small>KIKAI</small>
        </a>
        <nav className="desktop-nav" aria-label="主要ナビゲーション">
          <a href="#case">事件</a>
          <a href="#evidence">記録</a>
          <a href="#decode">解読</a>
        </nav>
        <button
          type="button"
          className="sound-toggle"
          onClick={toggleSound}
          aria-label={soundOn ? "音を止める" : "音を有効にする"}
        >
          {soundOn ? <Volume2 size={17} /> : <VolumeX size={17} />}
          <span>{soundOn ? "SOUND ON" : "SOUND OFF"}</span>
        </button>
      </header>

      <main>
        <section id="top" className="hero">
          <motion.div
            className="hero-image"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "easeOut" }}
          />
          <div className="hero-shade" aria-hidden="true" />
          <Grain />
          <div className="hero-content">
            <motion.p
              className="hero-kana"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1, delay: 0.3 }}
            >
              きかい
            </motion.p>
            <motion.h1
              className="hero-brand"
              initial={{ clipPath: "inset(0 100% 0 0)" }}
              animate={{ clipPath: "inset(0 0% 0 0)" }}
              transition={{ duration: 1.4, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              記界
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <p className="hero-title">記録の外側から、あなたを見ている。</p>
              <p className="hero-copy">失踪事件「四〇七号室」。封印された三つの記録を、最後まで再生してください。</p>
              <a href="#case" className="hero-action">
                記録を再生する
                <ArrowDown size={16} strokeWidth={1.5} />
              </a>
            </motion.div>
          </div>
        </section>

        <section id="case" className="case-section">
          <div className="section-rule">
            <span>ARCHIVE 40-7</span>
            <span>閲覧区分 / 失踪・異常記録</span>
          </div>
          <Reveal className="case-heading">
            <p className="section-index">記録 〇〇一</p>
            <h2>四〇七号室には、<br />誰も住んでいなかった。</h2>
          </Reveal>

          <div className="case-layout">
            <Reveal className="case-photo-wrap">
              <div className="case-photo" role="img" aria-label="古い集合住宅の暗い階段">
                <span className="photo-time">1998 12 17&nbsp;&nbsp; 03:12:08</span>
              </div>
              <p className="photo-caption">資料写真 04 / 西棟非常階段 / 原版未補正</p>
            </Reveal>
            <Reveal className="case-copy">
              <p className="case-intro">
                一九九八年十二月十七日、東京都内の集合住宅から住民七名が消えた。争った形跡も、外へ出た映像もない。
              </p>
              <p>
                唯一残されていたのは、存在しないはずの四〇七号室から回収された三本の記録媒体。すべてに同じ時刻と、撮影者の背後に立つ「何か」が記録されていた。
              </p>
              <dl className="case-data">
                <div><dt>発生</dt><dd>1998.12.17 / 未明</dd></div>
                <div><dt>場所</dt><dd>墨代団地 西棟（架空）</dd></div>
                <div><dt>記録数</dt><dd>3 / 一部破損</dd></div>
                <div><dt>状態</dt><dd className="redacted">調査終了</dd></div>
              </dl>
            </Reveal>
          </div>
        </section>

        <section id="evidence" className="evidence-section">
          <Reveal className="evidence-heading">
            <p className="section-index">記録 〇〇二</p>
            <h2>残された三つの記録</h2>
            <p>ノイズではありません。見落としているだけです。</p>
          </Reveal>

          <div className="evidence-console">
            <div className="evidence-list" role="tablist" aria-label="証拠記録">
              {evidence.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={activeEvidence === index}
                  className={activeEvidence === index ? "active" : ""}
                  onClick={() => setActiveEvidence(index)}
                >
                  <span>{item.number}</span>
                  <strong>{item.title}</strong>
                  <small>{item.meta}</small>
                  <ArrowRight size={16} strokeWidth={1.4} />
                </button>
              ))}
            </div>

            <div className="evidence-view" role="tabpanel">
              <AnimatePresence mode="wait">
                {activeEvidence === 0 && (
                  <motion.div
                    key="voice"
                    className="recording-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="tape-label">
                      <span>SIDE A</span>
                      <strong>管理事務所 / 引継録音</strong>
                      <span>18 DEC 1998</span>
                    </div>
                    <div className={`waveform ${recording ? "playing" : ""}`} aria-hidden="true">
                      {Array.from({ length: 62 }, (_, index) => (
                        <i key={index} style={{ height: `${12 + ((index * 19) % 68)}%` }} />
                      ))}
                    </div>
                    <button type="button" className="play-button" onClick={playRecording}>
                      {recording ? <Pause size={18} /> : <Play size={18} />}
                      {recording ? "停止" : "音声記録を再生"}
                    </button>
                    <div className={`transcript ${recording ? "visible" : ""}`} aria-live="polite">
                      <p><time>00:02</time> ……四〇七？　そんな部屋、うちにはありませんよ。</p>
                      <p><time>00:11</time> ただ、夜中に内線が鳴るんです。表示は、空欄で。</p>
                      <p><time>00:19</time> 出ると、時計の音だけがする。三時十七分で、止まる。</p>
                      <p className="anomaly-line"><time>00:27</time> ［背後から三回の打音］</p>
                    </div>
                  </motion.div>
                )}

                {activeEvidence === 1 && (
                  <motion.div
                    key="camera"
                    className="camera-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="camera-frame">
                      <img src="/images/kikai-stairwell.jpg" alt="非常階段の監視映像" />
                      <div className="camera-noise" />
                      <span className="rec-dot">REC</span>
                      <span className="camera-time">03:{Math.floor(12 + scrub / 11).toString().padStart(2, "0")}:{Math.floor((scrub * 7) % 60).toString().padStart(2, "0")}</span>
                      {scrub >= 72 && scrub <= 82 && <span className="camera-presence" aria-label="映像内の人影" />}
                    </div>
                    <div className="scrubber">
                      <label htmlFor="timeline">映像を送る</label>
                      <input
                        id="timeline"
                        type="range"
                        min="0"
                        max="100"
                        value={scrub}
                        onChange={(event) => changeScrub(Number(event.target.value))}
                      />
                      <span>{cameraFound ? "03:17:?? / 動体を検出" : "時刻を特定してください"}</span>
                    </div>
                    {cameraFound && <p className="found-message">階段を降りているのに、影だけが上っています。</p>}
                  </motion.div>
                )}

                {activeEvidence === 2 && (
                  <motion.div
                    key="phone"
                    className="phone-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="phone-header">
                      <span>未送信 1件</span>
                      <span>03:17</span>
                    </div>
                    <div className="phone-message">
                      <p>もしもし。管理人さん。</p>
                      <p>部屋の外に、私がいます。</p>
                      <p>さっきから、私の声でドアを開けろって。</p>
                      <p>ここは四〇七号室です。だけど表札には、</p>
                      <p className="phone-cut">あなたの名字が書いてあ</p>
                    </div>
                    <div className="signal-line"><span /></div>
                    <p className="phone-note">記録終了 / 03:17:40 / 発信元不明</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        <section id="decode" className="decode-section">
          <Reveal className="decode-inner">
            <div className="decode-eye" aria-hidden="true"><Eye strokeWidth={0.8} /></div>
            <p className="section-index">最終記録</p>
            <h2>止まった時刻を入力してください。</h2>
            <p className="decode-hint">四桁の数字。三つの記録は、同じ瞬間を指しています。</p>
            <form onSubmit={submitAnswer} className="decode-form">
              <label htmlFor="answer">ACCESS CODE / HHMM</label>
              <div>
                <input
                  id="answer"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value.replace(/\D/g, ""))}
                  placeholder="----"
                  aria-describedby="answer-status"
                  disabled={unlocked}
                />
                <button type="submit" disabled={answer.length !== 4 || unlocked}>
                  解錠
                  <ArrowRight size={17} />
                </button>
              </div>
            </form>
            <p id="answer-status" className={`answer-status ${attempts > 0 ? "visible" : ""}`} aria-live="polite">
              {attempts === 1 && "違います。もう一度、映像を見てください。"}
              {attempts === 2 && "その時刻には、誰もいませんでした。"}
              {attempts >= 3 && "入力しているのは、本当にあなたですか。"}
            </p>
          </Reveal>
        </section>

        <section id="ending" className={`ending-section ${unlocked ? "revealed" : ""}`}>
          <Grain />
          <div className="ending-content">
            <p>{unlocked ? "ARCHIVE COMPLETE" : "ARCHIVE LOCKED"}</p>
            <h2>{unlocked ? "最後の一人が、見つかった。" : "まだ、足りない。"}</h2>
            {unlocked && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.6, duration: 1.2 }}>
                <p className="ending-copy">記録は欠けていたのではない。四〇七号室は、次の閲覧者がこちらを見るのを待っていた。</p>
                <div className="observer-count">
                  <span>現在の観測者</span>
                  <strong>1</strong>
                  <small>あなた</small>
                </div>
              </motion.div>
            )}
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand"><span>記界</span><small>KIKAI ARCHIVE</small></div>
        <p>本作はフィクションです。実在の人物・団体・事件とは関係ありません。</p>
        <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC10700233/" target="_blank" rel="noreferrer">
          恐怖設計の参考文献
        </a>
        <p className="copyright">&copy; 2026 KIKAI RESEARCH OFFICE</p>
      </footer>

      <div className="cursor-light" aria-hidden="true" />
    </div>
  );
}