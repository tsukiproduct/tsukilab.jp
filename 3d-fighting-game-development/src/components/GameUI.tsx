interface GameUIProps {
  player1Health: number;
  player2Health: number;
  onBack: () => void;
}

export default function GameUI({ player1Health, player2Health, onBack }: GameUIProps) {
  const healthBarWidth = (health: number) => {
    return Math.max(0, (health / 100) * 100);
  };

  const healthColor = (health: number) => {
    if (health > 60) return 'bg-green-500';
    if (health > 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Health bars */}
      <div className="absolute top-8 left-8 right-8 flex justify-between px-4">
        {/* Fighter 1 */}
        <div className="space-y-2">
          <div className="text-white font-bold text-lg">Fighter 1</div>
          <div className="w-80 h-8 bg-gray-800 border-2 border-red-500 rounded-lg overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${healthColor(player1Health)}`}
              style={{ width: `${healthBarWidth(player1Health)}%` }}
            />
          </div>
          <div className="text-red-400 font-semibold">{Math.ceil(player1Health)}/100</div>
        </div>

        {/* Fighter 2 */}
        <div className="space-y-2 text-right">
          <div className="text-white font-bold text-lg">Fighter 2</div>
          <div className="w-80 h-8 bg-gray-800 border-2 border-cyan-500 rounded-lg overflow-hidden">
            <div
              className={`h-full transition-all duration-100 ${healthColor(player2Health)}`}
              style={{ width: `${healthBarWidth(player2Health)}%` }}
            />
          </div>
          <div className="text-cyan-400 font-semibold">{Math.ceil(player2Health)}/100</div>
        </div>
      </div>

      {/* Controls info */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between text-xs text-gray-400 pointer-events-auto">
        <div className="space-y-1">
          <div className="font-bold text-white mb-2">Fighter 1 Controls</div>
          <div>W/A/S/D - Move</div>
          <div>Space - Punch</div>
          <div>Shift - Kick</div>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors pointer-events-auto"
        >
          Quit
        </button>
        <div className="space-y-1">
          <div className="font-bold text-white mb-2">Fighter 2 Controls</div>
          <div>↑/←/↓/→ - Move</div>
          <div>Enter - Punch</div>
          <div>Ctrl - Kick</div>
        </div>
      </div>
    </div>
  );
}
