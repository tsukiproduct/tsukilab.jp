import { useState, useEffect, useRef, useCallback } from 'react';

// Web Audio API を使用したシンセサイズサウンド
const useSound = () => {
  const [enabled, setEnabled] = useState(false);
  const audioContext = useRef<AudioContext | null>(null);

  useEffect(() => {
    audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return () => {
      audioContext.current?.close();
    };
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', volume: number = 0.3) => {
    if (!enabled || !audioContext.current) return;
    
    const oscillator = audioContext.current.createOscillator();
    const gainNode = audioContext.current.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.current.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(volume, audioContext.current.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.current.currentTime + duration);
    
    oscillator.start(audioContext.current.currentTime);
    oscillator.stop(audioContext.current.currentTime + duration);
  }, [enabled]);

  const play = useCallback((name: string) => {
    if (!enabled) return;
    
    switch (name) {
      case 'ambient':
        // 低いうなり音
        playTone(50, 2, 'sawtooth', 0.1);
        break;
      case 'scare':
        // 高い悲鳴のような音
        playTone(800, 0.3, 'sawtooth', 0.5);
        setTimeout(() => playTone(600, 0.3, 'sawtooth', 0.5), 100);
        setTimeout(() => playTone(400, 0.5, 'sawtooth', 0.5), 200);
        break;
      case 'creepy':
        // 不気味な上昇音
        playTone(200, 1, 'sine', 0.2);
        setTimeout(() => playTone(250, 1, 'sine', 0.2), 200);
        setTimeout(() => playTone(300, 1, 'sine', 0.2), 400);
        break;
      case 'hit':
        // 打撃音
        playTone(150, 0.2, 'square', 0.4);
        break;
    }
  }, [enabled, playTone]);

  const toggle = () => {
    setEnabled(prev => {
      const newValue = !prev;
      if (newValue && audioContext.current?.state === 'suspended') {
        audioContext.current.resume();
      }
      return newValue;
    });
  };

  return { enabled, play, toggle };
};

// 打字機効果フック
const useTypewriter = (text: string, speed: number = 100, start: boolean = true) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!start) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    let index = 0;
    setDisplayedText('');
    setIsComplete(false);

    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1));
        index++;
      } else {
        setIsComplete(true);
        clearInterval(timer);
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, speed, start]);

  return { displayedText, isComplete };
};

// ランダムなグリッチテキスト生成
const generateGlitchText = (text: string): string => {
  const glitches = ['', '◼', '▓', '░', '█', '▒', '⬛', '⬜', '■', '□'];
  return text.split('').map(char => {
    if (Math.random() < 0.1) {
      return glitches[Math.floor(Math.random() * glitches.length)];
    }
    return char;
  }).join('');
};

const introText = `このサイトは、ある事件の記録です。

20XX 年、ある研究施設で不可解な出来事が起こりました。
研究者たちは次々と失踪し、残されたのは歪んだ記録だけ...

あなたは真実を知りたいですか？
それとも、知らずにいたいですか？

選択はあなたにあります。
しかし...一度知ってしまった真実から逃れることはできません。`;
// メイン App コンポーネント
export default function App() {
  const [scene, setScene] = useState<'warning' | 'intro' | 'main' | 'puzzle' | 'ending'>('warning');
  const [showJumpscare, setShowJumpscare] = useState(false);
  const [jumpscareCount, setJumpscareCount] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollProgress, setScrollProgress] = useState(0);
  const [revealedSecrets, setRevealedSecrets] = useState(0);
  const [puzzleAnswer, setPuzzleAnswer] = useState('');
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [whispers, setWhispers] = useState<string[]>([]);
  const [showHiddenMessage, setShowHiddenMessage] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  const [showEyes, setShowEyes] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { enabled: soundEnabled, play: playSound, toggle: toggleSound } = useSound();
  const { displayedText } = useTypewriter(introText, 80, scene === 'intro');

  // マウス位置追跡
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // スクロール進捗
  useEffect(() => {
    const handleScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress((window.scrollY / total) * 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // グリッチ効果
  useEffect(() => {
    const interval = setInterval(() => {
      setGlitchIntensity(Math.random() > 0.95 ? Math.random() * 10 : 0);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // ランダムな囁き
  useEffect(() => {
    const creepyMessages = [
      '見られている',
      '後ろを向くな',
      '逃れられない',
      '真実はここにある',
      'あなたも仲間になる',
      '目を閉じるな',
      '息を殺せ',
      '聞こえるか...',
      'すぐそばに',
      '逃げるな',
    ];

    const interval = setInterval(() => {
      if (scene === 'main' || scene === 'puzzle') {
        const newWhisper = creepyMessages[Math.floor(Math.random() * creepyMessages.length)];
        setWhispers(prev => [...prev.slice(-4), newWhisper]);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [scene]);

  // ジャンプスケアタイマー
  useEffect(() => {
    if (scene === 'main' || scene === 'puzzle') {
      const scheduleJumpscare = () => {
        const delay = 15000 + Math.random() * 30000;
        setTimeout(() => {
          if (Math.random() > 0.6) {
            setShowJumpscare(true);
            playSound('scare');
            setJumpscareCount(prev => prev + 1);
            setTimeout(() => setShowJumpscare(false), 500);
          }
          scheduleJumpscare();
        }, delay);
      };
      scheduleJumpscare();
    }
  }, [scene, playSound]);

  // ページ離脱警告
  useEffect(() => {
    if (scene === 'main' || scene === 'puzzle') {
      const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        e.preventDefault();
        e.returnValue = '本当に逃げますか？彼らはあなたを見逃しません...';
        return '本当に逃げますか？彼らはあなたを見逃しません...';
      };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [scene]);

  // 隠しメッセージ表示
  useEffect(() => {
    if (clickCount >= 13) {
      setShowHiddenMessage(true);
    }
  }, [clickCount]);

  // 目の表示
  useEffect(() => {
    const interval = setInterval(() => {
      if (scene === 'main' && Math.random() > 0.7) {
        setShowEyes(true);
        setTimeout(() => setShowEyes(false), 2000);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [scene]);

  const handleWarningAccept = () => {
    playSound('hit');
    setScene('intro');
  };

  const handleWarningReject = () => {
    // 拒否しても強制的に進む（恐怖演出）
    playSound('creepy');
    setTimeout(() => setScene('intro'), 2000);
  };

  const handleIntroComplete = () => {
    playSound('hit');
    setScene('main');
  };

  const handlePuzzleSubmit = () => {
    const correctAnswers = ['死', 'death', 'shi', 'し', '死者', '亡霊'];
    if (correctAnswers.includes(puzzleAnswer.toLowerCase().trim())) {
      setPuzzleSolved(true);
      playSound('hit');
      setTimeout(() => setScene('ending'), 2000);
    } else {
      playSound('creepy');
      setGlitchIntensity(20);
      setTimeout(() => setGlitchIntensity(0), 1000);
    }
  };

  const handleSecretReveal = (id: number) => {
    setRevealedSecrets(prev => {
      const newCount = prev | (1 << id);
      if ((newCount & 0b111) === 0b111) {
        setScene('puzzle');
      }
      return newCount;
    });
    playSound('hit');
  };

  // CSS グリッチエフェクト
  const glitchStyle = {
    transform: glitchIntensity > 0 
      ? `translate(${(Math.random() - 0.5) * glitchIntensity}px, ${(Math.random() - 0.5) * glitchIntensity}px)`
      : 'none',
    filter: glitchIntensity > 5 
      ? `hue-rotate(${Math.random() * 360}deg) contrast(1.5)`
      : 'none',
  };

  // 警告画面
  if (scene === 'warning') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="crt-overlay" />
        <div className="vignette" />
        <div className="max-w-2xl text-center relative z-10">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-red-700 mb-4 animate-pulse">
              ⚠️ 警告 ⚠️
            </h1>
            <p className="text-red-500 text-lg md:text-xl mb-6">
              このサイトは精神に強い影響を与える内容を含んでいます
            </p>
          </div>
          
          <div className="bg-gray-900 border-2 border-red-800 p-6 mb-8 rounded">
            <p className="text-gray-300 mb-4">
              以下の症状がある方は閲覧を控えてください：
            </p>
            <ul className="text-red-400 text-left space-y-2">
              <li>• 心臓疾患、高血圧</li>
              <li>• てんかん、光過敏性発作</li>
              <li>• 精神疾患、トラウマ歴</li>
              <li>• 妊娠中の方</li>
              <li>• 18 歳未満の方</li>
            </ul>
          </div>

          <p className="text-gray-500 mb-8 text-sm">
            閲覧を続けることで、あなたは全ての責任を負うことに同意したものとみなされます
          </p>

          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button
              onClick={handleWarningAccept}
              className="px-8 py-4 bg-red-900 hover:bg-red-700 text-white font-bold rounded transition-all duration-300 hover:scale-105"
            >
              理解した上で進む
            </button>
            <button
              onClick={handleWarningReject}
              className="px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded transition-all duration-300"
            >
              戻る
            </button>
          </div>

          <p className="text-gray-600 mt-8 text-xs">
            {soundEnabled ? '🔊 サウンド ON' : '🔇 サウンド OFF'}
            <button 
              onClick={toggleSound}
              className="ml-4 text-red-500 underline"
            >
              トグル
            </button>
          </p>
        </div>
      </div>
    );
  }

  // イントロ画面
  if (scene === 'intro') {

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="crt-overlay" />
        <div className="vignette" />
        <div className="max-w-3xl relative z-10">
          <div 
            className="text-green-500 font-mono text-lg md:text-xl whitespace-pre-line leading-relaxed"
            style={glitchStyle}
          >
            {displayedText}
          </div>
          
          <button
            onClick={handleIntroComplete}
            className="mt-12 px-8 py-4 bg-red-900 hover:bg-red-700 text-white font-bold rounded transition-all duration-300 animate-pulse"
          >
            真実へ進む
          </button>

          <p className="text-gray-600 mt-8 text-xs">
            {soundEnabled ? '🔊 サウンド ON' : '🔇 サウンド OFF'}
            <button 
              onClick={toggleSound}
              className="ml-4 text-red-500 underline"
            >
              トグル
            </button>
          </p>
        </div>
      </div>
    );
  }

  // エンディング画面
  if (scene === 'ending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <div className="crt-overlay" />
        <div className="vignette" />
        <div className="max-w-2xl text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-bold text-red-700 mb-8 animate-pulse">
            あなたは選ばれた
          </h1>
          
          <div className="bg-gray-900 border-2 border-red-800 p-8 mb-8 rounded">
            <p className="text-gray-300 text-lg mb-6">
              真実を知った者には、二つの道しか残されていません。
            </p>
            <p className="text-red-500 text-xl mb-6">
              真実を共にするか、
            </p>
            <p className="text-red-500 text-xl">
              真実の一部となるか...
            </p>
          </div>

          <div className="text-gray-500 mb-8">
            <p>閲覧した恐怖の数：{jumpscareCount}</p>
            <p>発見した秘密：{revealedSecrets.toString(2).split('1').length - 1}</p>
          </div>

          <p className="text-red-700 text-sm animate-pulse">
            このページを閉じても...私たちはあなたを見守っています
          </p>

          <p className="text-gray-600 mt-8 text-xs">
            {soundEnabled ? '🔊 サウンド ON' : '🔇 サウンド OFF'}
          </p>
        </div>
      </div>
    );
  }

  // メイン画面とパズル画面
  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-black text-gray-300 relative overflow-x-hidden"
      style={glitchStyle}
      onClick={() => setClickCount(prev => prev + 1)}
    >
      {/* CRT 効果オーバーレイ */}
      {(scene === 'main' || scene === 'puzzle') && (
        <>
          <div className="crt-overlay" />
          <div className="vignette" />
          <div className="scanline" />
        </>
      )}

      {/* サウンドトグル */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleSound(); }}
        className="fixed top-4 right-4 z-50 px-4 py-2 bg-gray-900 border border-red-800 rounded text-sm hover:bg-red-900 transition-colors"
      >
        {soundEnabled ? '🔊' : '🔇'}
      </button>

      {/* スクロールプログレス */}
      <div className="fixed top-0 left-0 h-1 bg-red-900 z-50 transition-all duration-300" style={{ width: `${scrollProgress}%` }} />

      {/* ジャンプスケア */}
      {showJumpscare && (
        <div className="fixed inset-0 z-[100] bg-red-900 flex items-center justify-center">
          <div className="text-9xl animate-ping">👁️</div>
        </div>
      )}

      {/* 囁き */}
      <div className="fixed bottom-4 left-4 z-40 space-y-2">
        {whispers.map((whisper, i) => (
          <p 
            key={i} 
            className="text-red-700 text-sm opacity-60 animate-pulse"
            style={{ animationDelay: `${i * 0.5}s` }}
          >
            {generateGlitchText(whisper)}
          </p>
        ))}
      </div>

      {/* 隠しメッセージ */}
      {showHiddenMessage && (
        <div className="fixed inset-0 z-30 pointer-events-none flex items-center justify-center">
          <p className="text-red-900 text-6xl font-bold opacity-20 animate-pulse">
            逃れられない
          </p>
        </div>
      )}

      {/* 目 */}
      {showEyes && (
        <div className="fixed inset-0 z-20 pointer-events-none">
          <div 
            className="absolute text-6xl transition-all duration-300"
            style={{ 
              left: `${mousePosition.x - 50}px`, 
              top: `${mousePosition.y - 50}px` 
            }}
          >
            👁️
          </div>
        </div>
      )}

      {/* マウストレーサー */}
      <div 
        className="fixed w-8 h-8 border-2 border-red-800 rounded-full pointer-events-none z-10 transition-all duration-100"
        style={{ 
          left: `${mousePosition.x - 16}px`, 
          top: `${mousePosition.y - 16}px`,
          opacity: 0.3
        }}
      />

      {/* メインコンテンツ */}
      {scene === 'main' && (
        <div className="container mx-auto px-4 py-16">
          {/* ヘッダー */}
          <header className="text-center mb-16">
            <h1 className="text-4xl md:text-6xl font-bold text-red-700 mb-4 animate-pulse">
              忌まわしき記録
            </h1>
            <p className="text-gray-500">
              失われた真実の断片
            </p>
          </header>

          {/* セクション 1: 事件の概要 */}
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-6 border-l-4 border-red-800 pl-4">
              事件の概要
            </h2>
            <div className="bg-gray-900 border border-red-900 p-6 rounded">
              <p className="mb-4">
                20XX 年 7 月、山奥の研究施設で不可解な事件が発生しました。
                施設に所属していた 12 名の研究者のうち、8 名が失踪。
                残された 4 名も、事件から 1 ヶ月以内に相次いで死亡しました。
              </p>
              <p className="text-red-500">
                彼らは何を発見したのか...
              </p>
              <p className="text-red-500">
                そして、なぜ消えなければならなかったのか...
              </p>
            </div>
          </section>

          {/* セクション 2: 証言記録 */}
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-6 border-l-4 border-red-800 pl-4">
              証言記録
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { name: '研究者 A', text: '夜中になると、壁から声が聞こえる。私の名前を呼んでいる...' },
                { name: '研究者 B', text: '鏡に映る自分が、少しずつ変わっていく。別人のようだ。' },
                { name: '研究者 C', text: '実験室の奥に、見てはいけない部屋がある。開けてはいけないと言われた。' },
                { name: '研究者 D', text: '彼らはまだ生きている。少なくとも、何かは残っている...' },
              ].map((testimony, i) => (
                <div 
                  key={i}
                  className="bg-gray-900 border border-gray-800 p-4 rounded hover:border-red-800 transition-colors cursor-pointer"
                  onClick={() => handleSecretReveal(i)}
                >
                  <p className="text-red-500 font-bold mb-2">{testimony.name}</p>
                  <p className="text-gray-400">{testimony.text}</p>
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-sm mt-4">
              ※ 全ての証言をクリックすると、次の記録へ進めます
            </p>
          </section>

          {/* セクション 3: 発見された記録 */}
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-6 border-l-4 border-red-800 pl-4">
              発見された記録
            </h2>
            <div className="bg-gray-900 border border-red-900 p-6 rounded">
              <p className="font-mono text-green-500 mb-4">
                [記録日不明]
              </p>
              <p className="mb-4">
                実験は成功した。しかし、代償は大きすぎた。
                彼らは「向こう側」と接触してしまった。
              </p>
              <p className="mb-4">
                接触した瞬間、何かを持って帰ってきた。
                それは目に見えないが、確かに存在する。
              </p>
              <p className="text-red-500">
                私たちはもう、元の人間ではない。
              </p>
              <div 
                className="mt-6 p-4 bg-black border border-red-900 cursor-pointer hover:bg-red-950 transition-colors"
                onClick={() => {
                  playSound('creepy');
                  setGlitchIntensity(15);
                  setTimeout(() => setGlitchIntensity(0), 2000);
                }}
              >
                <p className="text-gray-600 text-sm">
                  [この部分の記録は破損しています - クリックして復元を試みる]
                </p>
              </div>
            </div>
          </section>

          {/* セクション 4: 写真記録 */}
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-6 border-l-4 border-red-800 pl-4">
              写真記録
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {['👤', '👁️', '🚪', '📁', '🔬', '🌑', '🕯️', '📞'].map((emoji, i) => (
                <div 
                  key={i}
                  className="aspect-square bg-gray-900 border border-gray-800 flex items-center justify-center text-4xl hover:border-red-800 hover:scale-105 transition-all cursor-pointer"
                  onClick={() => {
                    playSound('hit');
                    if (Math.random() > 0.7) {
                      setShowJumpscare(true);
                      setTimeout(() => setShowJumpscare(false), 300);
                    }
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
            <p className="text-gray-600 text-sm mt-4">
              ※ 写真をクリックすると拡大されます（注意：一部に衝撃的な内容が含まれる可能性があります）
            </p>
          </section>

          {/* セクション 5: 最後のメッセージ */}
          <section className="mb-20">
            <h2 className="text-2xl md:text-3xl font-bold text-red-600 mb-6 border-l-4 border-red-800 pl-4">
              最後のメッセージ
            </h2>
            <div className="bg-gray-900 border-2 border-red-800 p-8 rounded text-center">
              <p className="text-xl mb-6">
                この記録を見ているあなたへ
              </p>
              <p className="text-gray-400 mb-6">
                真実を知ってしまった以上、あなたも私たちの仲間です。
                逃れようとしても、無駄です。
              </p>
              <p className="text-red-500 text-lg mb-6">
                次は、あなたの番です。
              </p>
              <button
                onClick={() => {
                  playSound('creepy');
                  setScene('puzzle');
                }}
                className="px-8 py-4 bg-red-900 hover:bg-red-700 text-white font-bold rounded transition-all duration-300 animate-pulse"
              >
                真実の扉を開く
              </button>
            </div>
          </section>

          {/* フッター */}
          <footer className="text-center text-gray-600 text-sm">
            <p>このサイトはフィクションです</p>
            <p className="text-red-900 mt-2">
              ...本当にそう思いますか？
            </p>
          </footer>
        </div>
      )}

      {/* パズル画面 */}
      {scene === 'puzzle' && (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <div className="crt-overlay" />
          <div className="vignette" />
          <div className="max-w-2xl w-full relative z-10">
            <h2 className="text-3xl md:text-4xl font-bold text-red-600 mb-8 text-center">
              最後の試練
            </h2>
            
            <div className="bg-gray-900 border-2 border-red-800 p-8 rounded mb-8">
              <p className="text-gray-300 mb-6">
                真実の扉を開くには、答えを知らねばならない。
              </p>
              <p className="text-gray-400 mb-6">
                研究者たちが最後に口にした言葉...
              </p>
              <p className="text-red-500 text-xl mb-6 font-mono">
                「全ては◯に還る」
              </p>
              <p className="text-gray-500 text-sm mb-6">
                ◯に入る一字を答えよ
              </p>
              
              <div className="flex gap-4">
                <input
                  type="text"
                  value={puzzleAnswer}
                  onChange={(e) => setPuzzleAnswer(e.target.value)}
                  placeholder="答えを入力..."
                  className="flex-1 px-4 py-3 bg-black border border-red-800 text-white rounded focus:outline-none focus:border-red-500"
                  maxLength={10}
                />
                <button
                  onClick={handlePuzzleSubmit}
                  className="px-8 py-3 bg-red-900 hover:bg-red-700 text-white font-bold rounded transition-colors"
                >
                  submit
                </button>
              </div>
              
              {puzzleAnswer && !puzzleSolved && (
                <p className="text-red-700 mt-4 animate-pulse">
                  違う...それは真実ではない...
                </p>
              )}
            </div>

            <p className="text-gray-600 text-center text-sm">
              ヒント：彼らが失ったもの、彼らがなったもの...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
