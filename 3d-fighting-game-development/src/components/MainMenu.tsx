interface MainMenuProps {
  onStartGame: () => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
  return (
    <div className="w-full h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-8 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" style={{ animationDelay: '4s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center space-y-12 max-w-2xl">
        {/* Title */}
        <div className="space-y-6">
          <h1 className="text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-pulse">
            3D FIGHTING
          </h1>
          <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            ARENA
          </h2>
          <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full" />
        </div>

        {/* Subtitle */}
        <p className="text-xl text-gray-300 leading-relaxed">
          Face off in an intense 3D battle arena. Master your controls and defeat your opponent to claim victory!
        </p>

        {/* Instructions */}
        <div className="grid grid-cols-2 gap-8 text-left bg-gray-800 bg-opacity-50 p-8 rounded-2xl border border-gray-700">
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-purple-400">Fighter 1</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-cyan-400 font-semibold">W/A/S/D</span> Move around</li>
              <li><span className="text-cyan-400 font-semibold">Space</span> Punch</li>
              <li><span className="text-cyan-400 font-semibold">Shift</span> Kick</li>
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-cyan-400">Fighter 2</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li><span className="text-pink-400 font-semibold">↑/←/↓/→</span> Move around</li>
              <li><span className="text-pink-400 font-semibold">Enter</span> Punch</li>
              <li><span className="text-pink-400 font-semibold">Ctrl</span> Kick</li>
            </ul>
          </div>
        </div>

        {/* Game Tips */}
        <div className="space-y-3 text-gray-400 text-sm">
          <p>💡 <span className="text-yellow-400">Tips:</span> Kicks deal more damage but have longer cooldowns. Get close to land attacks!</p>
          <p>⚡ <span className="text-yellow-400">Strategy:</span> Position yourself carefully and watch your opponent's moves.</p>
        </div>

        {/* Start Button */}
        <button
          onClick={onStartGame}
          className="group relative px-12 py-5 text-2xl font-bold text-white rounded-2xl overflow-hidden transition-all duration-300 transform hover:scale-105"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 group-hover:from-purple-700 group-hover:via-pink-700 group-hover:to-red-700 transition-all duration-300" />
          <div className="absolute inset-0 bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative block">
            START GAME
          </span>
          <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>

        {/* Decorative elements */}
        <div className="pt-8 flex justify-center gap-4">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
          <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
        </div>
      </div>

      {/* Corner decorations */}
      <div className="absolute top-4 right-4 text-4xl opacity-20">🥊</div>
      <div className="absolute bottom-4 left-4 text-4xl opacity-20">🥊</div>
    </div>
  );
}
