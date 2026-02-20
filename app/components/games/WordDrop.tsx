'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import styles from './WordDrop.module.css';

const WORDS = [
  'raster','vector','datum','lidar','geojson','shapefile','projection',
  'topology','spatial','buffer','overlay','interpolate','reclassify',
  'georeferencing','digitize','attribute','metadata','coordinate','elevation',
  'contour','watershed','slope','aspect','viewshed','hillshade','mosaic',
  'clip','dissolve','merge','union','intersect','erase','append','relate',
  'domain','subtype','feature','basemap','tile','portal','geocode','centroid',
  'extent','symbology','legend','graticule','parallels','meridian','equator',
  'latitude','longitude','azimuth','bearing','cadastral','parcel','cadastre',
  'geostatistics','kriging','thiessen','voronoi','tin','dem','dsm','dtm',
  'orthorectify','photogrammetry','parallax','stereo','aerial','drone','uav',
  'multispectral','hyperspectral','infrared','pointcloud','voxel',
  'tropomi','sentinel','landsat','modis','ndvi','ndwi','savi','evi',
  'classification','spectral','temporal','composite','calibration',
  'radiance','reflectance','emissivity','albedo','backscatter','coherence',
  'interferometry','sar','insar','phenology','biomass','canopy','impervious',
  'python','csharp','sql','arcpy','pandas','numpy','geopandas','shapely',
  'fiona','rasterio','gdal','ogr','pyproj','folium','leaflet','mapbox',
  'geotiff','netcdf','hdf','csv','json','xml','api','rest','graphql',
  'boolean','integer','string','query','schema','index','function','class',
  'loop','array','dictionary','module','variable','parameter','algorithm',
  'azure','gemini','neural','model','token','prompt','agent','classify',
  'embedding','inference','training','pipeline','llm','ocr','grounding',
  'fiber','network','rfp','bore','telecom','cable','conduit','splice',
  'splitter','manhole','handhole','strand','attachment','pole','duct',
  'route','span','riser','trench','directional','pullbox','closure',
  'olsson','omaha','lincoln','nebraska','arcgis','qgis','autocad','envi',
  'tableau','github','smartsheet','postgresql','sqlserver',
];

const COLS = 6;
const TICK_MS = 700;
const SPEED_UP = 0.93;

type FallingWord = { id: number; word: string; col: number; row: number };

let idCounter = 0;

interface Props {
  playerName: string;
  leaders: { name: string; score: number }[];
  onFinish: (score: number) => void;
}

export default function WordDrop({ playerName, leaders, onFinish }: Props) {
  const [words, setWords] = useState<FallingWord[]>([]);
  const [input, setInput] = useState('');
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(1);
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speedRef = useRef(TICK_MS);
  const inputRef = useRef<HTMLInputElement>(null);
  const roundRef = useRef(0);
  const scoreRef = useRef(0);
  const doneRef = useRef(false);

  const clearIntervals = () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (spawnRef.current) clearInterval(spawnRef.current);
  };

  const showFlash = (msg: string) => {
    setFlash(null);
    setTimeout(() => setFlash(msg), 10);
    setTimeout(() => setFlash(null), 750);
  };

  const endGame = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    clearIntervals();
    onFinish(scoreRef.current);
  }, [onFinish]);

  const spawnWord = useCallback(() => {
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWords(prev => {
      const usedCols = prev.filter(w => w.row < 2).map(w => w.col);
      let col = Math.floor(Math.random() * COLS);
      let tries = 0;
      while (usedCols.includes(col) && tries < COLS) { col = (col + 1) % COLS; tries++; }
      return [...prev, { id: idCounter++, word, col, row: 0 }];
    });
  }, []);

  const tick = useCallback(() => {
    setWords(prev => {
      const next: FallingWord[] = [];
      let lost = 0;
      for (const w of prev) {
        if (w.row >= 9) lost++;
        else next.push({ ...w, row: w.row + 1 });
      }
      if (lost > 0) {
        setTimeout(() => endGame(), 50);
        showFlash('💥 Missed!');
      }
      return next;
    });
    roundRef.current++;
    if (roundRef.current % 8 === 0) {
      speedRef.current = Math.max(320, speedRef.current * SPEED_UP);
    }
  }, [endGame]);

  useEffect(() => {
    if (!started) return;
    doneRef.current = false;
    idCounter = 0;
    spawnWord();
    tickRef.current = setInterval(tick, speedRef.current);
    spawnRef.current = setInterval(spawnWord, 2400);
    return clearIntervals;
  }, [started, tick, spawnWord]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.trim().toLowerCase();
    setInput(val);
    const match = words.find(w => w.word === val);
    if (match) {
      setWords(prev => prev.filter(w => w.id !== match.id));
      setInput('');
      setCombo(c => c + 1);
      const pts = 10 + (combo >= 2 ? combo * 5 : 0);
      setScore(s => { scoreRef.current = s + pts; return s + pts; });
      showFlash(combo >= 2 ? `🔥 x${combo + 1} COMBO! +${pts}` : `✓ +${pts}`);
    }
  };

  const ROWS = 10;
  const grid: (FallingWord | null)[][] = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  words.forEach(w => { if (w.row < ROWS && w.col < COLS) grid[w.row][w.col] = w; });

  const medals = ['🥇', '🥈', '🥉'];

  if (!started) {
    return (
      <div className={styles.startPane}>
        <p className={styles.desc}>
          GIS &amp; tech words fall from the sky.<br />
          Type them before they hit the ground.<br />
          <strong>Miss ONE word → game over!</strong> Build combos for bonus points.
        </p>
        <button className={styles.startBtn} onClick={() => setStarted(true)}>
          [ Start Game ]
        </button>
      </div>
    );
  }

  return (
    <div className={styles.playingLayout}>
      <div className={styles.gridWrap}>
        <div className={styles.hud}>
          <span>{lives > 0 ? '♥ ALIVE' : '♡ DEAD'}</span>
          <span>Score: <strong>{score}</strong></span>
          {combo >= 2 && <span className={styles.comboTag}>🔥 x{combo}</span>}
        </div>
        {flash && <div className={styles.flash} key={flash}>{flash}</div>}
        <div className={styles.grid}>
          {grid.map((row, ri) => (
            <div key={ri} className={styles.row}>
              {row.map((cell, ci) => (
                <div key={ci} className={styles.cell}>
                  {cell && (
                    <span className={`${styles.word} ${cell.row >= 7 ? styles.danger : cell.row >= 4 ? styles.warn : ''}`}>
                      {cell.word}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ))}
          <div className={styles.ground} />
        </div>
        <input
          ref={inputRef}
          className={styles.input}
          value={input}
          onChange={handleInput}
          placeholder="type a word..."
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          autoFocus
        />
      </div>

      <div className={styles.sideLeader}>
        <p className={styles.sideLeaderTitle}>🏆 Top Scores</p>
        {leaders.length === 0 && <p className={styles.sideLeaderEmpty}>No scores yet</p>}
        {leaders.map((l, i) => (
          <div key={i} className={styles.sideLeaderRow}>
            <span>{medals[i]} {l.name}</span>
            <span className={styles.sideLeaderScore}>{l.score}</span>
          </div>
        ))}
        <p className={styles.sideLeaderHint}>Miss one → game over!</p>
      </div>
    </div>
  );
}
