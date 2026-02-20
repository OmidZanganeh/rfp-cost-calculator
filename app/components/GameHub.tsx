'use client';
import { useState, useEffect } from 'react';
import styles from './GameHub.module.css';
import WordDrop from './games/WordDrop';
import CoordSnap from './games/CoordSnap';
import TypeRacer from './games/TypeRacer';

type Game = 'worddrop' | 'coordsnap' | 'typeracer';
type LeaderEntry = { name: string; score: number };
type Screen = 'lobby' | 'playing' | 'result';

const GAMES = [
  {
    id: 'worddrop' as Game,
    emoji: '🌧️',
    title: 'Word Drop',
    desc: 'Type falling GIS terms before they hit the ground. One miss = game over.',
  },
  {
    id: 'coordsnap' as Game,
    emoji: '🗺️',
    title: 'Coord Snap',
    desc: 'Click where cities are on the world map. Closer = more points. 10 cities.',
  },
  {
    id: 'typeracer' as Game,
    emoji: '⌨️',
    title: 'Type Racer',
    desc: 'Type GIS sentences as fast as possible. Score = average WPM over 3 rounds.',
  },
];

const SCORE_LABELS: Record<Game, string> = {
  worddrop: 'pts',
  coordsnap: 'pts',
  typeracer: 'wpm',
};

async function fetchLeaders(game: Game): Promise<LeaderEntry[]> {
  try {
    const res = await fetch(`/api/leaderboard?game=${game}`);
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

async function postScore(name: string, score: number, game: Game): Promise<LeaderEntry[]> {
  try {
    const res = await fetch('/api/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, score, game }),
    });
    if (!res.ok) return [];
    return res.json();
  } catch { return []; }
}

export default function GameHub({ onClose }: { onClose: () => void }) {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [playerName, setPlayerName] = useState('');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState<Game>('worddrop');
  const [allLeaders, setAllLeaders] = useState<Record<Game, LeaderEntry[]>>({
    worddrop: [], coordsnap: [], typeracer: [],
  });
  const [lastScore, setLastScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  useEffect(() => {
    Promise.all([
      fetchLeaders('worddrop'),
      fetchLeaders('coordsnap'),
      fetchLeaders('typeracer'),
    ]).then(([wd, cs, tr]) => {
      setAllLeaders({ worddrop: wd, coordsnap: cs, typeracer: tr });
    });
  }, []);

  const startGame = (game: Game) => {
    if (!playerName.trim()) return;
    setSelectedGame(game);
    setLastScore(0);
    setIsNewRecord(false);
    setScreen('playing');
  };

  const handleFinish = async (score: number) => {
    setLastScore(score);
    setScreen('result');
    if (playerName.trim() && score > 0 && selectedGame) {
      setSaving(true);
      const updated = await postScore(playerName.trim(), score, selectedGame);
      setSaving(false);
      if (updated.length > 0) {
        setAllLeaders(prev => ({ ...prev, [selectedGame]: updated }));
        setIsNewRecord(updated.some(l => l.name === playerName.trim() && l.score === score));
      }
    }
  };

  const medals = ['🥇', '🥈', '🥉'];
  const currentLeaders = allLeaders[activeTab];
  const gameMeta = GAMES.find(g => g.id === selectedGame);

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <div className={styles.modalHeader}>
          <span className={styles.modalTitle}>// GIS Arcade</span>
        </div>

        {/* ── LOBBY ── */}
        {screen === 'lobby' && (
          <div className={styles.lobby}>
            <input
              className={styles.nameInput}
              placeholder="Enter your name to play…"
              value={playerName}
              onChange={e => setPlayerName(e.target.value)}
              maxLength={20}
              autoFocus
            />

            <div className={styles.gameCards}>
              {GAMES.map(g => (
                <button
                  key={g.id}
                  className={styles.gameCard}
                  onClick={() => startGame(g.id)}
                  disabled={!playerName.trim()}
                >
                  <span className={styles.gameEmoji}>{g.emoji}</span>
                  <span className={styles.gameCardTitle}>{g.title}</span>
                  <span className={styles.gameCardDesc}>{g.desc}</span>
                </button>
              ))}
            </div>

            {/* Leaderboard tabs */}
            <div className={styles.leaderSection}>
              <div className={styles.leaderTabs}>
                {GAMES.map(g => (
                  <button
                    key={g.id}
                    className={`${styles.leaderTab} ${activeTab === g.id ? styles.leaderTabActive : ''}`}
                    onClick={() => setActiveTab(g.id)}
                  >
                    {g.emoji} {g.title}
                  </button>
                ))}
              </div>
              <div className={styles.leaderBoard}>
                {currentLeaders.length === 0 && (
                  <p className={styles.noScores}>No scores yet — be the first!</p>
                )}
                {currentLeaders.map((l, i) => (
                  <div key={i} className={styles.leaderRow}>
                    <span>{medals[i]} <strong>{l.name}</strong></span>
                    <span className={styles.leaderScore}>{l.score} {SCORE_LABELS[activeTab]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PLAYING ── */}
        {screen === 'playing' && selectedGame && (
          <div className={styles.playing}>
            <div className={styles.playingHeader}>
              <button className={styles.backBtn} onClick={() => setScreen('lobby')}>
                ← Back
              </button>
              <span className={styles.playingTitle}>
                {gameMeta?.emoji} {gameMeta?.title}
              </span>
              <span className={styles.playingPlayer}>👤 {playerName}</span>
            </div>

            {selectedGame === 'worddrop' && (
              <WordDrop
                playerName={playerName}
                leaders={allLeaders.worddrop}
                onFinish={handleFinish}
              />
            )}
            {selectedGame === 'coordsnap' && (
              <CoordSnap
                playerName={playerName}
                leaders={allLeaders.coordsnap}
                onFinish={handleFinish}
              />
            )}
            {selectedGame === 'typeracer' && (
              <TypeRacer
                playerName={playerName}
                leaders={allLeaders.typeracer}
                onFinish={handleFinish}
              />
            )}
          </div>
        )}

        {/* ── RESULT ── */}
        {screen === 'result' && selectedGame && (
          <div className={styles.result}>
            {isNewRecord && <p className={styles.newRecord}>🎉 New High Score!</p>}
            <p className={styles.resultTitle}>GAME OVER</p>
            <p className={styles.resultScore}>
              {playerName} · <strong>{lastScore}</strong> {SCORE_LABELS[selectedGame]}
            </p>

            {saving && <p className={styles.savingText}>Saving score…</p>}

            {!saving && allLeaders[selectedGame].length > 0 && (
              <div className={styles.resultBoard}>
                <p className={styles.resultBoardTitle}>🏆 {gameMeta?.title} Leaderboard</p>
                {allLeaders[selectedGame].map((l, i) => (
                  <div
                    key={i}
                    className={`${styles.leaderRow} ${l.name === playerName && l.score === lastScore ? styles.leaderHighlight : ''}`}
                  >
                    <span>{medals[i]} <strong>{l.name}</strong></span>
                    <span className={styles.leaderScore}>{l.score} {SCORE_LABELS[selectedGame]}</span>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.resultActions}>
              <button className={styles.actionBtn} onClick={() => startGame(selectedGame)}>
                [ Play Again ]
              </button>
              <button className={styles.actionBtnGhost} onClick={() => setScreen('lobby')}>
                [ Change Game ]
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
