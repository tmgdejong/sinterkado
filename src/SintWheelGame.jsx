import React, { useState, useEffect, useRef } from 'react';
import { Gift, Users, Clock, Shuffle, Play, RotateCcw, PartyPopper, RefreshCw, Star } from 'lucide-react';

// --- CONFIGURATIE ---

const ROUND_1_CARDS = [
  { text: "Pak een cadeautje van de stapel en pak het uit.", type: "action" },
  { text: "Pak een cadeautje van de stapel, maar laat het ingepakt.", type: "action" },
  { text: "Pak een cadeautje. Heb je er al een? Geef deze dan aan je linkerbuur.", type: "swap" },
  { text: "Iedereen schuift alle cadeaus één plek naar links.", type: "global" },
  { text: "Pak een cadeautje en pak het uit. Laat trots aan iedereen zien.", type: "action" },
  { text: "De jongste speler mag een cadeautje van de stapel pakken.", type: "special" },
  { text: "Pak een cadeautje. Is het zacht? Pak uit. Is het hard? Laat ingepakt.", type: "action" },
  { text: "Kies iemand die een liedje moet zingen voor een cadeau.", type: "special" },
];

const ROUND_2_CARDS = [
  { text: "Geef een cadeau (naar keuze) aan de persoon rechts van je.", type: "swap" },
  { text: "Ruil van plaats (en dus van cadeaus) met de persoon tegenover je.", type: "global" },
  { text: "Pak een cadeau af van de persoon met de meeste cadeaus.", type: "steal" },
  { text: "Iedereen geeft één cadeau door naar links.", type: "global" },
  { text: "Jij mag ruilen met een persoon naar keuze.", type: "swap" },
  { text: "De persoon met de minste cadeaus mag er eentje stelen.", type: "special" },
  { text: "Alle ingepakte cadeaus moeten nu worden uitgepakt!", type: "action" },
  { text: "Ruil jouw kleinste cadeau voor het grootste cadeau van iemand anders.", type: "swap" },
  { text: "Iedereen legt zijn cadeaus op tafel. De jongste mag als eerste één ding kiezen.", type: "chaos" },
  { text: "Niets aan de hand. Geniet even van je pepernoten.", type: "rest" },
];

// Opties op het Rad
const WHEEL_OPTIONS = [
  { label: "Alles naar Links!", color: "#ef4444", text: "Iedereen schuift AL zijn cadeaus één plek naar links." }, // Red
  { label: "Joker!", color: "#eab308", text: "Jij mag bepalen wat er gebeurt (ruilen, stelen of houden)!" }, // Yellow
  { label: "Deurwaarder", color: "#3b82f6", text: "De persoon met de meeste cadeaus moet er 1 inleveren op de pot." }, // Blue
  { label: "Wissel!", color: "#22c55e", text: "Wissel van stoel (en cadeaus) met iemand naar keuze." }, // Green
  { label: "Pakjesdief", color: "#a855f7", text: "Steel een uitgepakt cadeau van iemand anders." }, // Purple
  { label: "Pechvogel", color: "#f97316", text: "Sla een beurt over (of pak een pepernoot)." }, // Orange
];

export default function SintWheelGame() {
  const [phase, setPhase] = useState('setup'); // setup, round1, intermission, round2, finished
  const [players, setPlayers] = useState(['', '', '', '', '']);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  
  // Timer state
  const [timer, setTimer] = useState(45 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Wheel state
  const [showWheel, setShowWheel] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelResult, setWheelResult] = useState(null);
  const [turnCounter, setTurnCounter] = useState(0);

  // --- LOGIC ---

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer > 0 && phase === 'round2') {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0 && phase === 'round2') {
      setPhase('finished');
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, phase]);

  const handlePlayerNameChange = (index, value) => {
    const newPlayers = [...players];
    newPlayers[index] = value;
    setPlayers(newPlayers);
  };

  const addPlayer = () => setPlayers([...players, '']);
  const removePlayer = (index) => {
    const newPlayers = players.filter((_, i) => i !== index);
    setPlayers(newPlayers);
  };

  const startGame = () => {
    const validPlayers = players.filter(p => p.trim() !== '');
    if (validPlayers.length < 2) return;
    setPlayers(validPlayers);
    setPhase('round1');
    setCurrentCard({ text: "Welkom! De jongste speler mag beginnen. Druk op 'Volgende' voor de eerste kaart.", type: "info" });
  };

  const nextTurn = () => {
    // Check if we should trigger the wheel (every 5 turns)
    const newTurnCount = turnCounter + 1;
    setTurnCounter(newTurnCount);

    // Trigger wheel every 5th turn OR random chance (1 in 15)
    const randomWheelTrigger = Math.random() < 0.05; 
    
    if (newTurnCount % 5 === 0 || randomWheelTrigger) {
      setWheelResult(null);
      setShowWheel(true);
      return;
    }

    drawCard();
  };

  const drawCard = () => {
    const deck = phase === 'round1' ? ROUND_1_CARDS : ROUND_2_CARDS;
    const randomCard = deck[Math.floor(Math.random() * deck.length)];
    setCurrentCard(randomCard);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
  };

  const startRound2 = () => {
    setPhase('round2');
    setTimer(45 * 60); 
    setIsTimerRunning(true);
    setCurrentCard({ text: "De timer loopt! Druk op 'Volgende' voor actie.", type: "info" });
    setTurnCounter(0); // Reset counter for round 2
  };

  // --- WHEEL LOGIC ---

  const spinTheWheel = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setWheelResult(null);

    // Calculate random rotation
    // We want at least 3 full spins (1080 deg) + random segment
    const segmentAngle = 360 / WHEEL_OPTIONS.length;
    const randomSegmentIndex = Math.floor(Math.random() * WHEEL_OPTIONS.length);
    const extraDegrees = (360 - (randomSegmentIndex * segmentAngle)) - (segmentAngle / 2); // Center on segment
    
    // Add some randomness to where it lands within the segment to look realistic
    const fuzzy = (Math.random() - 0.5) * (segmentAngle * 0.8);
    
    const totalRotation = wheelRotation + 1440 + extraDegrees + fuzzy;
    
    setWheelRotation(totalRotation);

    // Wait for animation to finish (3s)
    setTimeout(() => {
      setIsSpinning(false);
      setWheelResult(WHEEL_OPTIONS[randomSegmentIndex]);
    }, 3000);
  };

  const closeWheel = () => {
    setShowWheel(false);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    // Set the result as the current card so it stays on screen
    if (wheelResult) {
      setCurrentCard({ text: `UITKOMST RAD: ${wheelResult.text}`, type: 'special' });
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // --- COMPONENTS ---

  const ActionButton = ({ onClick, children, className = "" }) => (
    <button 
      onClick={onClick} 
      className={`px-6 py-4 bg-yellow-400 hover:bg-yellow-300 text-red-900 border-b-4 border-yellow-600 font-bold rounded-xl shadow-lg transform active:scale-95 transition flex items-center justify-center gap-2 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-red-900 text-yellow-50 font-sans selection:bg-yellow-500 selection:text-red-900 p-4 flex flex-col items-center overflow-x-hidden">
      
      {/* Header */}
      <header className="mb-6 text-center z-10">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-yellow-400 drop-shadow-md flex flex-col md:flex-row items-center justify-center gap-3">
          <Gift className="w-12 h-12" />
          <span>Sinterklaas Spel</span>
        </h1>
        <p className="text-red-200 mt-1 italic font-serif">Nu met het Rad van Sinterklaas!</p>
      </header>

      {/* Main Board */}
      <main className="w-full max-w-2xl bg-red-800 rounded-3xl shadow-2xl border-4 border-yellow-500/30 relative overflow-hidden flex flex-col min-h-[500px]">
        
        {/* Decor: Corner Miters */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-yellow-500/5 rounded-br-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-tl-full pointer-events-none"></div>

        {/* PHASE: SETUP */}
        {phase === 'setup' && (
          <div className="p-8 flex flex-col items-center justify-center flex-1 space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-yellow-200 font-serif flex items-center gap-2">
              <Users /> Wie vieren er mee?
            </h2>
            <div className="w-full space-y-2">
              {players.map((player, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Naam speler ${idx + 1}`}
                    value={player}
                    onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                    className="flex-1 bg-red-900 border-2 border-red-700 rounded-lg px-4 py-2 focus:border-yellow-400 focus:outline-none placeholder-red-400/50 text-white"
                  />
                  {players.length > 2 && (
                    <button onClick={() => removePlayer(idx)} className="text-red-400 hover:text-red-200 px-2">✕</button>
                  )}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <button onClick={addPlayer} className="px-4 py-2 rounded-lg border border-yellow-500/30 text-yellow-200 hover:bg-yellow-500/10 text-sm">
                + Speler toevoegen
              </button>
              <ActionButton onClick={startGame}>
                Start het Heerlijk Avondje
              </ActionButton>
            </div>
          </div>
        )}

        {/* GAME PLAY PHASES */}
        {(phase === 'round1' || phase === 'round2') && (
          <div className="flex flex-col h-full relative">
            
            {/* Top Bar */}
            <div className="bg-red-950/30 p-4 flex justify-between items-center border-b border-red-700/50">
               <div className="font-serif text-yellow-400/80 uppercase tracking-widest text-sm">
                 {phase === 'round1' ? "Ronde 1: Verdelen" : "Ronde 2: Het Spel"}
               </div>
               {phase === 'round2' && (
                 <div className={`font-mono text-xl flex items-center gap-2 ${timer < 60 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                   <Clock className="w-5 h-5" /> {formatTime(timer)}
                 </div>
               )}
            </div>

            {/* Card Display Area */}
            <div className="flex-1 p-6 flex flex-col items-center justify-center text-center gap-6">
              
              <div className="bg-red-900/50 px-6 py-2 rounded-full border border-yellow-500/30">
                Aan de beurt: <span className="font-bold text-yellow-300 text-xl ml-2">{players[currentPlayerIndex]}</span>
              </div>

              <div className="bg-white/10 p-8 rounded-xl border-2 border-dashed border-yellow-500/20 w-full shadow-inner min-h-[160px] flex items-center justify-center">
                <p className="text-2xl md:text-3xl font-medium leading-relaxed font-serif">
                  {currentCard?.text}
                </p>
              </div>

            </div>

            {/* Controls */}
            <div className="p-6 bg-red-950/20 border-t border-red-700/50 flex flex-col gap-3">
              <ActionButton onClick={nextTurn} className="w-full text-xl">
                {turnCounter > 0 && turnCounter % 4 === 0 ? "Spannend..." : "Volgende Kaart"} <Shuffle className="w-5 h-5" />
              </ActionButton>
              
              <div className="flex justify-between items-center px-2">
                 <button onClick={() => setShowWheel(true)} className="text-xs text-yellow-500/70 hover:text-yellow-400 flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Forceer het Rad
                 </button>
                 
                 {phase === 'round1' && (
                   <button onClick={() => setPhase('intermission')} className="text-xs text-red-300 hover:text-white underline">
                     Naar Ronde 2
                   </button>
                 )}
                 {phase === 'round2' && (
                   <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-xs text-red-300 hover:text-white">
                     {isTimerRunning ? "Pauzeer" : "Hervat"}
                   </button>
                 )}
              </div>
            </div>

          </div>
        )}

        {/* INTERMISSION */}
        {phase === 'intermission' && (
          <div className="p-10 flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
            <h2 className="text-3xl font-serif font-bold text-yellow-400">Tijd voor Pepernoten!</h2>
            <p className="text-red-100 max-w-md">
              Zijn alle cadeaus verdeeld en uitgepakt? Zet de timer, pak wat te drinken, want nu gaat het echte spel beginnen.
            </p>
            <div className="flex items-center gap-4 bg-red-950/50 p-4 rounded-lg">
                <button onClick={() => setTimer(Math.max(60, timer - 300))} className="p-2 hover:bg-red-800 rounded">- 5 min</button>
                <div className="text-2xl font-mono text-yellow-400 w-24">{formatTime(timer)}</div>
                <button onClick={() => setTimer(timer + 300)} className="p-2 hover:bg-red-800 rounded">+ 5 min</button>
            </div>
            <ActionButton onClick={startRound2}>
              Start de Finale <Play className="w-5 h-5 ml-2" />
            </ActionButton>
          </div>
        )}

        {/* FINISHED */}
        {phase === 'finished' && (
          <div className="p-10 flex flex-col items-center justify-center h-full text-center space-y-8 animate-zoom-in">
            <PartyPopper className="w-24 h-24 text-yellow-400 animate-bounce" />
            <h2 className="text-5xl font-serif font-bold text-white">Afgelopen!</h2>
            <p className="text-xl text-yellow-200">
              Handen af van de cadeaus! Dit is je buit.
            </p>
            <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 border border-yellow-500/50 hover:bg-yellow-500/10 rounded-full text-yellow-200 flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" /> Opnieuw
            </button>
          </div>
        )}

        {/* --- WHEEL OVERLAY MODAL --- */}
        {showWheel && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in">
            <div className="relative mb-8">
              {/* Pointer */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-white drop-shadow-lg"></div>
              
              {/* The Wheel */}
              <div 
                className="w-64 h-64 md:w-80 md:h-80 rounded-full border-8 border-yellow-500 shadow-2xl relative overflow-hidden transition-transform duration-[3000ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{ 
                  transform: `rotate(${wheelRotation}deg)`,
                  background: `conic-gradient(
                    ${WHEEL_OPTIONS.map((opt, i) => `${opt.color} ${i * (100/WHEEL_OPTIONS.length)}% ${(i+1) * (100/WHEEL_OPTIONS.length)}%`).join(', ')}
                  )`
                }}
              >
                {/* Lines separating segments */}
                {WHEEL_OPTIONS.map((_, i) => (
                  <div 
                    key={i} 
                    className="absolute top-0 left-1/2 w-0.5 h-1/2 bg-white/20 origin-bottom"
                    style={{ transform: `translateX(-50%) rotate(${i * (360/WHEEL_OPTIONS.length)}deg)` }}
                  ></div>
                ))}
                
                {/* Center Cap */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-yellow-500 rounded-full shadow-inner flex items-center justify-center text-red-900">
                  <Star className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Result Display */}
            <div className="text-center space-y-4 max-w-sm">
              {!wheelResult ? (
                <>
                  <h3 className="text-2xl font-serif text-yellow-400 font-bold animate-pulse">Rad van Sinterklaas!</h3>
                  <ActionButton onClick={spinTheWheel} className="w-full" disabled={isSpinning}>
                     {isSpinning ? "Aan het draaien..." : "GEEF EEN SLINGER!"}
                  </ActionButton>
                </>
              ) : (
                <div className="bg-white text-red-900 p-6 rounded-xl shadow-2xl animate-pop-in border-4 border-yellow-500">
                  <div className="uppercase font-bold tracking-widest text-sm mb-2 text-gray-500">Het lot bepaalt:</div>
                  <h3 className="text-3xl font-extrabold mb-2" style={{color: wheelResult.color}}>{wheelResult.label}</h3>
                  <p className="text-lg leading-snug font-serif">{wheelResult.text}</p>
                  <button onClick={closeWheel} className="mt-4 px-6 py-2 bg-red-900 text-white rounded-lg hover:bg-red-800 w-full">
                    Doorgaan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
      
      <footer className="mt-8 text-red-400/60 text-sm font-serif">
        Fijne Sinterklaas!
      </footer>
    </div>
  );
}