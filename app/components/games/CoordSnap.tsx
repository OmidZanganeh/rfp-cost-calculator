'use client';
import dynamic from 'next/dynamic';
import { useState } from 'react';
import styles from './CoordSnap.module.css';

const CoordSnapMap = dynamic(() => import('./CoordSnapMap'), {
  ssr: false,
  loading: () => <div className={styles.mapLoading}>Loading map…</div>,
});

const CITIES = [
  { name: 'Tokyo',        country: 'Japan',       lat: 35.68,  lng: 139.69 },
  { name: 'New York',     country: 'USA',          lat: 40.71,  lng: -74.01 },
  { name: 'London',       country: 'UK',           lat: 51.51,  lng: -0.13  },
  { name: 'Sydney',       country: 'Australia',    lat: -33.87, lng: 151.21 },
  { name: 'Cairo',        country: 'Egypt',        lat: 30.04,  lng: 31.24  },
  { name: 'Mumbai',       country: 'India',        lat: 19.08,  lng: 72.88  },
  { name: 'São Paulo',    country: 'Brazil',       lat: -23.55, lng: -46.63 },
  { name: 'Moscow',       country: 'Russia',       lat: 55.76,  lng: 37.62  },
  { name: 'Lagos',        country: 'Nigeria',      lat: 6.52,   lng: 3.38   },
  { name: 'Beijing',      country: 'China',        lat: 39.90,  lng: 116.41 },
  { name: 'Buenos Aires', country: 'Argentina',    lat: -34.60, lng: -58.38 },
  { name: 'Istanbul',     country: 'Turkey',       lat: 41.01,  lng: 28.98  },
  { name: 'Mexico City',  country: 'Mexico',       lat: 19.43,  lng: -99.13 },
  { name: 'Nairobi',      country: 'Kenya',        lat: -1.29,  lng: 36.82  },
  { name: 'Paris',        country: 'France',       lat: 48.86,  lng: 2.35   },
  { name: 'Jakarta',      country: 'Indonesia',    lat: -6.21,  lng: 106.85 },
  { name: 'Dubai',        country: 'UAE',          lat: 25.20,  lng: 55.27  },
  { name: 'Chicago',      country: 'USA',          lat: 41.88,  lng: -87.63 },
  { name: 'Seoul',        country: 'South Korea',  lat: 37.57,  lng: 126.98 },
  { name: 'Omaha',        country: 'USA 🏠',       lat: 41.26,  lng: -95.93 },
];

const ROUNDS = 10;

function getPoints(km: number): number {
  if (km < 100)  return 1000;
  if (km < 300)  return 800;
  if (km < 700)  return 600;
  if (km < 1500) return 400;
  if (km < 3000) return 200;
  if (km < 5000) return 100;
  return 50;
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface Props {
  playerName: string;
  leaders: { name: string; score: number }[];
  onFinish: (score: number) => void;
}

interface Marker { coords: [number, number]; correct: boolean; }

export default function CoordSnap({ playerName, leaders, onFinish }: Props) {
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [cityOrder] = useState(() => [...CITIES].sort(() => Math.random() - 0.5).slice(0, ROUNDS));
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [lastKm, setLastKm] = useState(0);
  const [lastPts, setLastPts] = useState(0);
  const [targetCoords, setTargetCoords] = useState<[number, number] | null>(null);

  const medals = ['🥇', '🥈', '🥉'];
  const currentCity = cityOrder[round];

  const handleMapClick = (lng: number, lat: number) => {
    if (showResult || round >= ROUNDS) return;
    const city = currentCity;
    const km = Math.round(haversine(lat, lng, city.lat, city.lng));
    const pts = getPoints(km);
    setLastKm(km);
    setLastPts(pts);
    setScore(s => s + pts);
    setMarkers(prev => [...prev, { coords: [lng, lat], correct: km < 700 }]);
    setTargetCoords([city.lng, city.lat]);
    setShowResult(true);
  };

  const nextRound = () => {
    setShowResult(false);
    setTargetCoords(null);
    if (round + 1 >= ROUNDS) {
      onFinish(score + lastPts);
    } else {
      setRound(r => r + 1);
    }
  };

  if (!started) {
    return (
      <div className={styles.startPane}>
        <p className={styles.desc}>
          A city name appears — click where you think it is on the map.<br />
          Closer guess = more points. <strong>10 cities</strong>, max 1000 pts each.
        </p>
        <button className={styles.startBtn} onClick={() => setStarted(true)}>
          [ Start Game ]
        </button>
        {leaders.length > 0 && (
          <div className={styles.miniBoard}>
            <p className={styles.miniBoardTitle}>🏆 Top Scores</p>
            {leaders.map((l, i) => (
              <div key={i} className={styles.miniBoardRow}>
                <span>{medals[i]} {l.name}</span>
                <span>{l.score}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.game}>
      <div className={styles.gameHeader}>
        <span className={styles.cityPrompt}>
          📍 Find: <strong>{currentCity.name}</strong>
          <span className={styles.cityCountry}> — {currentCity.country}</span>
        </span>
        <span className={styles.progress}>
          Round {round + 1}/{ROUNDS} · Score: <strong>{score}</strong>
        </span>
      </div>

      <div className={styles.mapWrap}>
        <CoordSnapMap
          onMapClick={handleMapClick}
          markers={markers}
          targetCoords={targetCoords}
          disabled={showResult}
        />
      </div>

      {showResult && (
        <div className={styles.resultBar}>
          <span className={styles.resultKm}>
            {lastKm < 100 ? '🎯' : lastKm < 700 ? '✅' : '😬'} {lastKm.toLocaleString()} km away
          </span>
          <span className={styles.resultPts}>+{lastPts} pts</span>
          <button className={styles.nextBtn} onClick={nextRound}>
            {round + 1 >= ROUNDS ? '[ See Results ]' : '[ Next City → ]'}
          </button>
        </div>
      )}

      {!showResult && (
        <p className={styles.hint}>Click anywhere on the map to place your guess</p>
      )}
    </div>
  );
}
