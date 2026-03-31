"use client";
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // <-- Dodany router z Next.js

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const getPolishDateString = (dateToConvert = new Date()) => {
  return dateToConvert.toLocaleDateString('en-CA', { timeZone: 'Europe/Warsaw' });
};

const getPrevDay = (currentStr: string) => {
  const d = new Date(currentStr);
  d.setDate(d.getDate() - 1);
  return getPolishDateString(d);
};

const getNextDay = (currentStr: string) => {
  const d = new Date(currentStr);
  d.setDate(d.getDate() + 1);
  return getPolishDateString(d);
};

const formatDisplayDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
  return dateStr;
};

export default function Home() {
  const router = useRouter(); // <-- Inicjalizacja routera
  const [isTutorialOpen, setIsTutorialOpen] = useState(false); // <-- NOWA LINIJKA

  const [item, setItem] = useState<any>(null);
  const [range, setRange] = useState({ min: 0, max: 0 });
  const [guess, setGuess] = useState<number>(0);
  const [inputValue, setInputValue] = useState<string>('');
  const [attempts, setAttempts] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [stats, setStats] = useState({ streak: 0, wins: 0, total: 0, wonDates: [] as string[] });
  const [activeHint, setActiveHint] = useState<string | null>(null);
  
  const [gameDate, setGameDate] = useState<string>('');
  const [notFound, setNotFound] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  
  // Stan do kontrolowania okienka Kontakt
  const [isContactOpen, setIsContactOpen] = useState(false);

  const step = 0.10;

  useEffect(() => { 
    const params = new URLSearchParams(window.location.search);
    const dateParam = params.get('date');
    const targetDate = (dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)) 
      ? dateParam 
      : getPolishDateString();
      
    setGameDate(targetDate);
    initGame(targetDate);
    loadStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const calculateStreak = (wonDates: string[]) => {
    if (!wonDates || wonDates.length === 0) return 0;
    const datesSet = new Set(wonDates);
    const todayStr = getPolishDateString();
    
    let currentStreak = 0;
    let checkDate = new Date(todayStr);

    if (!datesSet.has(getPolishDateString(checkDate))) {
      checkDate.setDate(checkDate.getDate() - 1);
      if (!datesSet.has(getPolishDateString(checkDate))) {
        return 0; 
      }
    }

    while (datesSet.has(getPolishDateString(checkDate))) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    return currentStreak;
  };

  const loadStats = () => {
    const savedStats = localStorage.getItem('game_stats');
    if (savedStats) {
      const parsed = JSON.parse(savedStats);
      if (!parsed.wonDates) parsed.wonDates = []; 
      const currentStreak = calculateStreak(parsed.wonDates);
      setStats({ ...parsed, streak: currentStreak });
    }
  };

  const updateStats = (won: boolean, targetDate: string) => {
    const savedStats = localStorage.getItem('game_stats');
    let currentStats = savedStats ? JSON.parse(savedStats) : { wins: 0, total: 0, wonDates: [] };
    if (!currentStats.wonDates) currentStats.wonDates = [];

    currentStats.total += 1;
    if (won && !currentStats.wonDates.includes(targetDate)) {
      currentStats.wins += 1;
      currentStats.wonDates.push(targetDate);
    }
    
    currentStats.streak = calculateStreak(currentStats.wonDates);
    localStorage.setItem('game_stats', JSON.stringify(currentStats));
    setStats(currentStats);
  };

  const initGame = async (targetDate: string) => {
    const isTestMode = sessionStorage.getItem('test_shuffle') === 'true';
    let dailyItem = null;

    if (isTestMode) {
      const { data } = await supabase.from('items').select('*').limit(100);
      if (data) dailyItem = data[Math.floor(Math.random() * data.length)];
      sessionStorage.removeItem('test_shuffle');
    } else {
      const { data: challengeData, error: challengeErr } = await supabase
        .from('daily_challenges')
        .select('item_id')
        .eq('date', targetDate)
        .single();

      if (challengeErr) {
        setDbError(`Błąd pobierania daily_challenges: ${challengeErr.message}`);
        setNotFound(true);
        return;
      }

      if (challengeData?.item_id) {
        const { data: itemData, error: itemErr } = await supabase
          .from('items')
          .select('*')
          .eq('id', challengeData.item_id)
          .single();
          
        if (itemErr) {
           setDbError(`Błąd pobierania items: ${itemErr.message}`);
           setNotFound(true);
           return;
        }
        dailyItem = itemData;
      }
    }

    if (!dailyItem) {
      setNotFound(true);
      return;
    }
      
    const roundedPrice = Math.round(dailyItem.price * 10) / 10;
    dailyItem.price = roundedPrice; 
    
    const randomPos = 0.2 + Math.random() * 0.6;
    const span = roundedPrice * 0.6;
    const minV = Math.floor(roundedPrice - (span * randomPos));
    const maxV = Math.ceil(roundedPrice + (span * (1 - randomPos)));

    setItem(dailyItem);
    setRange({ min: minV, max: maxV });
    
    const saved = localStorage.getItem(`game_${targetDate}`);
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
  };

  const formatPrice = (val: number) => val.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const hints = [
    { id: 'first_digit', icon: '🎯', label: '1. CYFRA', threshold: 2, get: () => `PIERWSZA CYFRA CENY TO: ${Math.floor(item.price).toString()[0]}` },
    { id: 'parity', icon: '⚖️', label: 'PARZYSTOŚĆ', threshold: 3, get: () => `PEŁNE ZŁOTE SĄ: ${Math.floor(item.price) % 2 === 0 ? 'PARZYSTE' : 'NIEPARZYSTE'}` },
    { id: 'cents', icon: '🪙', label: 'GROSZE', threshold: 4, get: () => `DOKŁADNE GROSZE TO: ${item.price.toFixed(2).replace('.', ',').slice(-3)}` }
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
    const isGameOver = isWin || newAttempts.length >= 6;

    if (isWin) {
      setGameState('won');
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#22c55e', '#ffffff'] });
      updateStats(true, gameDate);
    } else if (isGameOver) {
      setGameState('lost');
      updateStats(false, gameDate);
    }

    localStorage.setItem(`game_${gameDate}`, JSON.stringify({ attempts: newAttempts, state: isWin ? 'won' : 'lost' }));
  };

  // Funkcja nawigacji ułatwiająca zmianę daty
  const handleDateChange = (newDate: string) => {
    // Odświeżenie strony z nowym parametrem daty, używając wbudowanego mechanizmu Next.js
    window.location.href = `/?date=${newDate}`;
  };

  if (notFound) {
    return (
      <div className="h-screen bg-black flex flex-col items-center justify-center font-mono text-zinc-400 p-6 text-center">
        <p className="mb-4 text-4xl">🕵️</p>
        <h2 className="text-xl font-black text-white tracking-widest uppercase mb-2">Brak gry dla daty: {gameDate}</h2>
        {dbError && <p className="text-red-500 text-xs mt-4 max-w-md bg-red-950/30 p-2 rounded border border-red-900">{dbError}</p>}
        <button onClick={() => router.push('/')} className="mt-8 px-6 py-3 bg-white text-black font-black rounded-xl uppercase tracking-widest active:scale-95 transition-transform">
          Wróć do dzisiaj
        </button>
      </div>
    );
  }

  if (!item) return <div className="h-screen bg-black flex items-center justify-center font-mono text-zinc-800 text-xl font-black uppercase tracking-[1em] animate-pulse">Loading...</div>;

  const isToday = gameDate === getPolishDateString();
  const isEarliestDate = gameDate <= '2026-03-30';

  return (
    <main className="h-screen bg-black text-zinc-200 flex flex-col items-center p-4 overflow-hidden font-sans relative">
      <div className="absolute top-4 left-4 z-50 hidden sm:block">
        <a href="https://buycoffee.to/ilezato" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-3 py-2 border border-zinc-900 bg-zinc-950 rounded-xl hover:border-zinc-700 transition-all active:scale-95 shadow-2xl">
          <span className="text-lg group-hover:animate-bounce">☕</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Postaw kawę</span>
          </div>
        </a>
      </div>
            <div className="absolute top-4 right-4 z-50 hidden sm:block">
        <a onClick={() => setIsTutorialOpen(true)} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-3 py-2 border border-zinc-900 bg-zinc-950 rounded-xl hover:border-zinc-700 transition-all active:scale-95 shadow-2xl">
          <span className="text-lg group-hover:animate-bounce">❓</span>
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter">Jak grać?</span>
          </div>
        </a>
      </div>

      
      

      <nav className="w-full max-w-md flex justify-between items-center mb-2 pt-1 border-b border-zinc-900 pb-2">
        <div className="flex items-center gap-2 font-black tracking-tighter text-white">
      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-black font-black text-sm shadow-[0_0_15px_rgba(255,255,255,0.3)]">?</div>
      <span className="text-[18px] hidden md:block">ILE ZA TO DAM?</span>
        </div>
        
        <div className="flex gap-2 items-center">
          {/* NAWIGACJA DATAMI */}
          <div className="flex items-center gap-1 bg-zinc-900 px-1 py-1 rounded-full border border-zinc-800">
            <button 
              onClick={() => handleDateChange(getPrevDay(gameDate))}
              disabled={isEarliestDate}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isEarliestDate ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-700 active:scale-90 text-white'}`}
            >
              <span className="text-sm font-black">{'<'}</span>
            </button>

            <div className="flex flex-col items-center justify-center min-w-[60px] cursor-default">
              <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-0.5">
                {isToday ? 'Dzisiaj' : 'Archiwum'}
              </span>
              <span className={`text-[13px] font-black leading-none tracking-wider ${isToday ? 'text-white' : 'text-blue-400'}`}>
                {formatDisplayDate(gameDate)}
              </span>
            </div>

            <button 
              onClick={() => handleDateChange(getNextDay(gameDate))}
              disabled={isToday}
              className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${isToday ? 'opacity-30 cursor-not-allowed text-zinc-600' : 'hover:bg-zinc-700 active:scale-90 text-white'}`}
            >
              <span className="text-sm font-black">{'>'}</span>
            </button>
          </div>

          {/* STREAK */}
          <div className="flex items-center gap-3.5 bg-zinc-900 px-3 py-3 rounded-full border border-zinc-800">
            <span className="text-orange-500 text-[16px] leading-none">🔥</span>
            <span className="text-[16px] leading-none font-black text-white">{stats.streak}</span>
          </div>
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
                <button onClick={handleGuess} className="w-full bg-white text-black font-black py-4 rounded-2xl text-sm uppercase tracking-[0.2em] active:scale-95 shadow-lg transition-transform">
                  POTWIERDŹ {attempts.length + 1}/6
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 text-center animate-in zoom-in-95 duration-500">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1 font-bold">Cena Prawidłowa</p>
                <div className={`text-3xl font-black ${gameState === 'won' ? 'text-green-400 shadow-green-500/20' : 'text-white'}`}>{formatPrice(item.price)} zł</div>
                {isToday ? (
                  <p className="text-[10px] text-zinc-600 mt-2 font-black uppercase tracking-widest italic">Wróć jutro!</p>
                ) : (
                  <button onClick={() => router.push('/')} className="text-[10px] text-blue-400 mt-2 font-black uppercase tracking-widest italic border border-blue-500/30 px-3 py-1 rounded-full hover:bg-blue-900/30 transition-colors">
                    Wróć do dzisiaj
                  </button>
                )}
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
              statusText = "IDEALNIE"; emojis = "🎯"; intensity = "border-green-500 bg-green-500/10 text-green-400";
            } else if (diffPct < 2.5) { 
              statusText = "PARZY!"; emojis = "🔥🔥🔥"; intensity = "border-red-600/60 bg-red-600/15 text-red-300 shadow-[0_0_10px_rgba(220,38,38,0.3)]"; 
            } else if (diffPct < 5) { 
              statusText = "GORĄCO"; emojis = "🔥🔥"; intensity = "border-red-500/50 bg-red-500/10 text-red-400"; 
            } else if (diffPct < 15) { 
              statusText = "CIEPŁO"; emojis = "🔥"; intensity = "border-orange-500/40 bg-orange-500/10 text-orange-400"; 
            } else { 
              statusText = "ZIMNO"; emojis = "❄️"; intensity = "border-blue-900 bg-blue-950/40 text-blue-300"; 
            }

            return (
              <div key={i} className={`flex items-center justify-between border ${intensity} px-4 py-3 rounded-xl transition-all shadow-sm`}>
                <div className="w-1/3 flex items-baseline gap-1">
                   <span className="text-lg font-black tabular-nums tracking-tight text-white">{formatPrice(att)}</span>
                   <span className="text-[10px] font-bold text-zinc-500 uppercase">pln</span>
                </div>
                <div className="w-1/3 flex justify-center">
                  {!isCorrect && (
                    <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-md border border-zinc-800/60">
                      <span className={`text-[12px] font-black ${isTooHigh ? 'text-red-400' : 'text-blue-400'}`}>{isTooHigh ? '↓' : '↑'}</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest whitespace-nowrap">{isTooHigh ? 'Za dużo' : 'Za mało'}</span>
                    </div>
                  )}
                </div>
                <div className="w-1/3 flex flex-col items-end justify-center">
                   <span className="text-sm mb-0.5 drop-shadow-md">{emojis}</span>
                   <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: 'inherit' }}>{statusText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ZMNIEJSZONA STOPKA Z PRZYCISKIEM KONTAKT */}
      <footer className="w-full py-2 text-[9px] text-zinc-600 font-black font-mono flex flex-col gap-1 items-center border-t border-zinc-900 mt-auto bg-black">
        <div className="w-full flex justify-between items-center px-4">
          <span className="tracking-widest uppercase italic opacity-50">Osci5</span>
          <div className="flex gap-3">
            <button onClick={() => setIsContactOpen(true)} className="hover:text-white transition-colors uppercase">[ Kontakt ]</button>
            <Link href="/politics" className="hover:text-white transition-colors uppercase">[ Polityka ]</Link>
            <Link href="/terms" className="hover:text-white transition-colors uppercase">[ Regulamin ]</Link>
          </div>
        </div>
        <div className="text-zinc-800 tracking-[0.2em] uppercase text-center mt-1">
          Dane z <span className="text-zinc-700">Allegro.pl</span>
          <p className="text-[7px] font-black text-zinc-700 uppercase tracking-widest mt-0.5">Najbliższa data zbierania: 30.03.2026</p>
        </div>
      </footer>

      {/* POPUP KONTAKT */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 w-full max-w-xs relative shadow-2xl animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsContactOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-900 rounded-full transition-colors font-black"
            >
              ✕
            </button>
            <h2 className="text-lg font-black text-white uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>✉️</span> Kontakt
            </h2>
            <div className="space-y-4 text-xs text-zinc-400 tracking-tight leading-relaxed">
              <p>Znalazłeś błąd lub masz pomysł na nową funkcję do gry?</p>
              <div className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800">
                <p className="font-black uppercase tracking-widest text-[9px] text-zinc-500 mb-1">Napisz do nas:</p>
                <a href="mailto:kontakt@ilezato.pl" className="text-blue-400 font-bold hover:underline text-sm">
                  kontakt.ilezato@gmail.com
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #111; border-radius: 10px; }
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none; height: 28px; width: 28px; border-radius: 50%;
          background: #fff; cursor: pointer; border: 5px solid #000;
          box-shadow: 0 0 15px rgba(255,255,255,0.1); margin-top: -10px;
        }
      `}</style>
{isTutorialOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-[#050505] border border-zinc-800 rounded-2xl p-6 w-full max-w-sm relative shadow-2xl animate-in zoom-in-95 duration-200 my-8">
            <button 
              onClick={() => setIsTutorialOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-zinc-500 hover:text-white bg-zinc-900 rounded-full transition-colors font-black"
            >
              ✕
            </button>
            
            <h2 className="text-xl font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2">
              <span>🎓</span> Jak grać?
            </h2>
            
            <div className="space-y-5 text-xs text-zinc-400 tracking-tight leading-relaxed">
              <section>
                <h3 className="text-white font-bold uppercase tracking-widest text-[10px] mb-1">Cel gry</h3>
                <p>Twoim zadaniem jest odgadnięcie dokładnej ceny produktu. Masz na to 6 prób!</p>
              </section>

              <section>
                <h3 className="text-white font-bold uppercase tracking-widesttext-[10px] mb-1">Podpowiedzi</h3>
                <p>Przyciski pod tytułem odblokowują się, gdy osiągniesz wskazaną liczbę nieudanych prób (2, 3, 4). Kliknij je, aby ułatwić sobie zadanie!</p>
              </section>

              <section>
                <h3 className="text-white font-bold uppercase tracking-widest text-[10px] mb-2">Wskaźniki (Kolory i Emotki)</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 p-2.5 rounded-lg">
                    <span className="text-lg flex-shrink-0 whitespace-nowrap text-center leading-none">🎯</span>
                    <span className="text-[10px] font-black uppercase text-green-400">Idealnie (Dokładna cena)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-red-600/15 border border-red-600/40 p-2.5 rounded-lg">
                    <span className="text-lg flex-shrink-0 whitespace-nowrap text-center leading-none drop-shadow-md">🔥🔥🔥</span>
                    <span className="text-[10px] font-black uppercase text-red-300 whitespace-nowrap">Parzy! (Pomyłka &lt; 2.5%)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 p-2.5 rounded-lg">
                    <span className="text-lg flex-shrink-0 whitespace-nowrap text-center leading-none">🔥🔥</span>
                    <span className="text-[10px] font-black uppercase text-red-400">Gorąco (Pomyłka &lt; 5%)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-orange-500/10 border border-orange-500/30 p-2.5 rounded-lg">
                    <span className="text-lg flex-shrink-0 whitespace-nowrap text-center leading-none">🔥</span>
                    <span className="text-[10px] font-black uppercase text-orange-400 whitespace-nowrap">Ciepło (Pomyłka &lt; 15%)</span>
                  </div>
                  <div className="flex items-center gap-3 bg-blue-950/40 border border-blue-900/50 p-2.5 rounded-lg">
                    <span className="text-lg flex-shrink-0 whitespace-nowrap text-center leading-none">❄️</span>
                    <span className="text-[10px] font-black uppercase text-blue-300 whitespace-nowrap">Zimno (Pomyłka &gt; 15%)</span>
                  </div>
                </div>
              </section>
              
              <section>
                 <h3 className="text-white font-bold uppercase tracking-widest text-[10px] mb-1 whitespace-nowrap">Strzałki kierunkowe</h3>
                 <p>W historii prób zobaczysz strzałki: <span className="text-blue-400 font-bold bg-blue-900/30 px-1 rounded whitespace-nowrap">↑ Za mało</span> lub <span className="text-red-400 font-bold bg-red-900/30 px-1 rounded whitespace-nowrap">↓ Za dużo</span>, które pomagają naprowadzić Cię na kwotę.</p>
              </section>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
