"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [item, setItem] = useState<any>(null);
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [guess, setGuess] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [stats, setStats] = useState({ streak: 0, wins: 0, total: 0 });
  const [activeHint, setActiveHint] = useState<string | null>(null);

  const step = 0.10;

  useEffect(() => { 
    initGame();
    loadStats();
  }, []);

  const loadStats = () => {
    const savedStats = localStorage.getItem('game_stats');
    if (savedStats) setStats(JSON.parse(savedStats));
  };

  const updateStats = (won: boolean) => {
    const savedStats = localStorage.getItem('game_stats');
    let currentStats = savedStats ? JSON.parse(savedStats) : { streak: 0, wins: 0, total: 0, lastWin: "" };
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    currentStats.total += 1;
    if (won) {
      currentStats.wins += 1;
      if (currentStats.lastWin === yesterdayStr) currentStats.streak += 1;
      else if (currentStats.lastWin !== today) currentStats.streak = 1;
      currentStats.lastWin = today;
    } else {
      if (currentStats.lastWin !== today) currentStats.streak = 0;
    }
    localStorage.setItem('game_stats', JSON.stringify(currentStats));
    setStats(currentStats);
  };

  const initGame = async () => {
    const isTestMode = sessionStorage.getItem('test_shuffle') === 'true';
    let response;
    if (isTestMode) {
      const { data } = await supabase.from('items').select('*').limit(100);
      if (data) {
        const randomItem = data[Math.floor(Math.random() * data.length)];
        response = { data: [randomItem] };
      }
      sessionStorage.removeItem('test_shuffle');
    } else {
      response = await supabase.rpc('get_daily_item');
    }

    if (response?.data && response.data[0]) {
      const dailyItem = response.data[0];
      
      const roundedPrice = Math.round(dailyItem.price * 10) / 10;
      dailyItem.price = roundedPrice; 
      
      const randomPos = 0.2 + Math.random() * 0.6;
      const span = roundedPrice * 0.6;
      const minV = Math.floor(roundedPrice - (span * randomPos));
      const maxV = Math.ceil(roundedPrice + (span * (1 - randomPos)));

      setItem(dailyItem);
      setRange({ min: minV, max: maxV });
      
      const today = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`game_${today}`);
      if (saved && !isTestMode) {
        const p = JSON.parse(saved);
        setAttempts(p.attempts);
        setGameState(p.state);
        const lastGuess = p.attempts[0] || 0;
        setGuess(lastGuess);
        setInputValue(lastGuess.toFixed(2).replace('.', ','));
      } else {
        const startRand = Math.random();
        const initialGuess = Math.round((minV + (maxV - minV) * startRand) * 10) / 10;
        setGuess(initialGuess);
        setInputValue(initialGuess.toFixed(2).replace('.', ','));
      }
    }
  };

  const formatPrice = (val: number) => val.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hints = [
    { 
      id: 'first_digit', 
      icon: '🎯', 
      label: '1. CYFRA', 
      threshold: 2, 
      get: () => {
        const s = Math.floor(item.price).toString();
        return `PIERWSZA CYFRA CENY TO: ${s[0]}`;
      }
    },
    { 
      id: 'parity', 
      icon: '⚖️', 
      label: 'PARZYSTOŚĆ', 
      threshold: 3, 
      get: () => {
        const zloty = Math.floor(item.price);
        const isEven = zloty % 2 === 0;
        return `PEŁNE ZŁOTE SĄ: ${isEven ? 'PARZYSTE' : 'NIEPARZYSTE'}`;
      }
    },
    { 
      id: 'cents', 
      icon: '🪙', 
      label: 'GROSZE', 
      threshold: 4, 
      get: () => {
        const s = item.price.toFixed(2).replace('.', ',');
        return `DOKŁADNE GROSZE TO: ${s.slice(-3)}`;
      }
    }
  ];

  const handleSliderChange = (val: number) => {
    setGuess(val);
    setInputValue(val.toFixed(2).replace('.', ','));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!/^[0-9.,]*$/.test(val)) return;
    
    setInputValue(val);
    const parsed = parseFloat(val.replace(',', '.'));
    if (!isNaN(parsed)) {
      setGuess(Math.min(Math.max(0, parsed), range.max * 2)); 
    }
  };

  const handleGuess = () => {
    if (gameState !== 'playing' || !item) return;
    const newAttempts = [guess, ...attempts];
    setAttempts(newAttempts);
    
    const isWin = Math.abs(guess - item.price) < 0.001;
    const isGameOver = isWin || newAttempts.length >= 5;

    if (isWin) {
      setGameState('won');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#ffffff'] });
      updateStats(true);
    } else if (newAttempts.length >= 5) {
      setGameState('lost');
      updateStats(false);
    }

    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`game_${today}`, JSON.stringify({ attempts: newAttempts, state: isWin ? 'won' : isGameOver ? 'lost' : 'playing' }));
  };

  if (!item) return <div className="h-screen bg-black flex items-center justify-center font-mono text-zinc-800 text-xl font-black uppercase tracking-[1em] animate-pulse">Loading...</div>;

  return (
    <main className="h-screen bg-black text-zinc-200 flex flex-col items-center p-4 overflow-hidden font-sans relative">
      
      <div className="absolute top-4 left-4 z-50 hidden sm:block">
        <a 
          href="https://www.buymeacoffee.com/TWOJA_NAZWA" 
          target="_blank" 
          rel="noopener noreferrer"
          className="group flex items-center gap-2 px-3 py-2 border border-zinc-900 bg-zinc-950 rounded-xl hover:border-zinc-700 transition-all active:scale-95 shadow-2xl"
        >
          <span className="text-lg group-hover:animate-bounce">☕</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Postaw kawę</span>
          </div>
        </a>
      </div>

      <nav className="w-full max-w-md flex justify-between items-center mb-2 pt-1 border-b border-zinc-900 pb-2">
        <div className="flex items-center gap-3 font-black tracking-tighter text-white">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]">?</div>
          <span className="text-[18px]">ILE ZA TO?</span>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900 px-4 py-1 rounded-full border border-zinc-800">
          <span className="text-orange-500 text-[18px]">🔥</span>
          <span className="text-[18px] font-black text-white">{stats.streak}</span>
        </div>
      </nav>

      <div className="w-full max-w-md flex flex-col flex-1 overflow-hidden space-y-2">
        <div className="bg-[#050505] border border-zinc-900 rounded-[2rem] flex flex-col shadow-2xl overflow-hidden relative">
          <div className="h-44 sm:h-48 w-full bg-zinc-950 flex items-center justify-center p-4 border-b border-zinc-900/50 flex-shrink">
             <img src={item.image_url} alt="Target" className="max-h-full max-w-full object-contain pointer-events-none" />
          </div>

          <div className="p-4 space-y-3 relative z-10 text-center">
            <h1 className="text-[16px] font-black uppercase tracking-tight text-zinc-300 line-clamp-1 leading-tight">{item.title}</h1>

            <div className="grid grid-cols-3 gap-2">
              {hints.map((hint) => (
                <button key={hint.id} disabled={attempts.length < hint.threshold} onClick={() => setActiveHint(hint.id)}
                  className={`flex flex-col items-center py-1.5 rounded-xl border transition-all ${activeHint === hint.id ? 'border-blue-500 bg-blue-500/10' : attempts.length >= hint.threshold ? 'border-zinc-700 bg-zinc-900 hover:border-zinc-500' : 'border-zinc-900 bg-black opacity-20'}`}>
                  <span className="text-base">{hint.icon}</span>
                  <span className="text-[10px] font-black uppercase opacity-60">{attempts.length >= hint.threshold ? hint.label : `+${hint.threshold}`}</span>
                </button>
              ))}
            </div>

            <div className="h-6 flex items-center justify-center border-y border-zinc-900/50">
               <div className="text-[13px] font-black text-blue-400 uppercase tracking-tighter animate-in zoom-in-95 duration-200">
                  {activeHint ? hints.find(h => h.id === activeHint)?.get() : <span className="text-[9px] text-zinc-800">Analiza danych...</span>}
               </div>
            </div>

            {gameState === 'playing' ? (
              <div className="space-y-4">
                <div className="flex flex-col items-center">
                  <div className="flex justify-center items-end gap-2 px-2 w-full">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={inputValue}
                      onChange={handleInputChange}
                      className="w-1/2 text-center text-4xl font-black tabular-nums tracking-tighter text-white bg-transparent border-b-2 border-zinc-700 focus:border-white focus:outline-none transition-colors pb-1"
                      placeholder="0,00"
                    />
                    <span className="text-sm font-bold text-zinc-600 pb-1.5 uppercase">pln</span>
                  </div>
                </div>
                
                <input 
                  type="range" 
                  min={range.min} 
                  max={range.max} 
                  step={step} 
                  value={guess} 
                  onChange={(e) => handleSliderChange(Number(e.target.value))} 
                  className="w-full h-2 bg-zinc-800 appearance-none cursor-pointer accent-white rounded-full" 
                />
                <button onClick={handleGuess} className="w-full bg-white text-black font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] active:scale-95 shadow-lg">POTWIERDŹ {attempts.length + 1}/5</button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center animate-in zoom-in-95 duration-500">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Cena Prawidłowa</p>
                <div className={`text-3xl font-black ${gameState === 'won' ? 'text-green-400 shadow-green-500/20' : 'text-white'}`}>{formatPrice(item.price)} zł</div>
                <p className="text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-widest italic">Wróć jutro!</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-1 space-y-2 custom-scrollbar pb-2 mt-2">
          {attempts.map((att, i) => {
            const diffPct = (Math.abs(att - item.price) / item.price) * 100;
            const isCorrect = Math.abs(att - item.price) < 0.001; 
            const isTooHigh = att > item.price;
            
            let statusText = "";
            let emojis = "";
            let intensity = "";
            
            if (isCorrect) {
              statusText = "IDEALNIE"; 
              emojis = "🎯"; 
              intensity = "border-green-500 bg-green-500/10 text-green-400";
            } 
            else if (diffPct < 2.5) { 
              statusText = "PARZY!"; 
              emojis = "🔥🔥🔥🔥";
              intensity = "border-red-600/60 bg-red-600/15 text-red-300 shadow-[0_0_10px_rgba(220,38,38,0.3)]"; 
            } 
            else if (diffPct < 5) { 
              statusText = "GORĄCO"; 
              emojis = "🔥🔥🔥"; 
              intensity = "border-red-500/50 bg-red-500/10 text-red-400"; 
            } 
            else if (diffPct < 15) { 
              statusText = "CIEPŁO"; 
              emojis = "🔥🔥"; 
              intensity = "border-orange-500/40 bg-orange-500/10 text-orange-400"; 
            } 
            else { 
              statusText = "ZIMNO"; 
              emojis = "❄️"; 
              intensity = "border-blue-900 bg-blue-950/40 text-blue-300"; 
            }

            return (
              <div key={i} className={`flex items-center justify-between border ${intensity} px-4 py-3 rounded-xl transition-all shadow-sm`}>
                
                <div className="w-1/3 flex items-baseline gap-1">
                   <span className="text-lg font-black tabular-nums tracking-tight text-white">
                    {formatPrice(att)}
                   </span>
                   <span className="text-[10px] font-bold text-zinc-500 uppercase">pln</span>
                </div>

                <div className="w-1/3 flex justify-center">
                  {!isCorrect && (
                    <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-zinc-800/60">
                      <span className={`text-[12px] font-black ${isTooHigh ? 'text-red-400' : 'text-blue-400'}`}>
                        {isTooHigh ? '↓' : '↑'}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">
                        {isTooHigh ? 'Za dużo' : 'Za mało'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-1/3 flex flex-col items-end justify-center">
                   <span className="text-sm mb-0.5 drop-shadow-md">{emojis}</span>
                   <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: 'inherit' }}>
                     {statusText}
                   </span>
                </div>

              </div>
            );
          })}
        </div>
      </div>

      <footer className="w-full py-4 text-[9px] text-zinc-600 font-black font-mono flex flex-col gap-3 items-center border-t border-zinc-900 mt-auto bg-black">
        <div className="w-full flex justify-between items-center px-2">
          <span className="tracking-widest uppercase italic opacity-50">Created by: Osci5</span>
          <div className="flex gap-4">
            <Link href="/politics" className="hover:text-white transition-colors uppercase">[ Polityka Prywatności ]</Link>
            <Link href="/terms" className="hover:text-white transition-colors uppercase">[ Regulamin ]</Link>
          </div>
        </div>
        
        <div className="text-zinc-800 tracking-[0.2em] uppercase text-center pb-2">
          Dane o produktach pochodzą z serwisu <span className="text-zinc-700">Allegro.pl</span>
          <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest">Najbliższa data zbierania danych: 30.03.2026 </p>
        </div>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 28px; width: 28px; border-radius: 50%;
          background: #fff; cursor: pointer; border: 5px solid #000;
          box-shadow: 0 0 15px rgba(255,255,255,0.1); margin-top: -10px;
        }
      `}</style>
    </main>
  );
}