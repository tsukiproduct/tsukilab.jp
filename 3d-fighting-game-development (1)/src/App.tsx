import { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import GameUI from './components/GameUI';
import MainMenu from './components/MainMenu';

export default function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [player1Health, setPlayer1Health] = useState(100);
  const [player2Health, setPlayer2Health] = useState(100);
  const [winner, setWinner] = useState<string | null>(null);

  const handleStartGame = () => {
    setGameStarted(true);
    setPlayer1Health(100);
    setPlayer2Health(100);
    setWinner(null);
  };

  const handleGameOver = (winnerName: string) => {
    setWinner(winnerName);
  };

  if (!gameStarted) {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  if (winner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-8">
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
              {winner} Wins!
            </h1>
            <p className="text-2xl text-gray-300">Victory!</p>
          </div>
          <button
            onClick={() => setGameStarted(false)}
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold text-lg rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <GameCanvas onHealthChange={(p1, p2) => {
        setPlayer1Health(p1);
        setPlayer2Health(p2);
        if (p1 <= 0) handleGameOver('Fighter 2');
        if (p2 <= 0) handleGameOver('Fighter 1');
      }} />
      <GameUI 
        player1Health={player1Health} 
        player2Health={player2Health}
        onBack={() => setGameStarted(false)}
      />
    </div>
  );
}
