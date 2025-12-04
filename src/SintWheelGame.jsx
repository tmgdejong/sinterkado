import React, { useState, useEffect } from 'react';
import { Gift, Users, Clock, Shuffle, Play, ArrowRight, RotateCcw, PartyPopper } from 'lucide-react';

// Kaartjes/Opdrachten configuratie
const ROUND_1_CARDS = [
  { text: "Pak een cadeautje van de stapel en pak het uit.", type: "action" },
  { text: "Pak een cadeautje van de stapel, maar laat het ingepakt.", type: "action" },
  { text: "Pak een cadeautje van de stapel. Als je er al een hebt, geef deze dan aan je linkerbuurman/vrouw.", type: "swap" },
  { text: "Iedereen schuift alle cadeaus één plek naar links.", type: "global" },
  { text: "Pak een cadeautje en pak het uit. Laat daarna aan iedereen zien.", type: "action" },
  { text: "De jongste speler mag een cadeautje van de stapel pakken.", type: "special" },
  { text: "Pak een cadeautje van de stapel. Is het zacht? Pak het uit. Is het hard? Laat het ingepakt.", type: "action" },
];

const ROUND_2_CARDS = [
  { text: "Geef een cadeau (naar keuze) aan de persoon rechts van je.", type: "swap" },
  { text: "Ruil van plaats (en dus van cadeaus) met de persoon tegenover je.", type: "global" },
  { text: "Pak een cadeau af van de persoon met de meeste cadeaus.", type: "steal" },
  { text: "Iedereen geeft één cadeau door naar links.", type: "global" },
  { text: "Jij mag ruilen met een persoon naar keuze.", type: "swap" },
  { text: "De persoon met de minste cadeaus mag er eentje stelen van iemand anders.", type: "special" },
  { text: "Alle ingepakte cadeaus moeten nu worden uitgepakt!", type: "action" },
  { text: "Ruil jouw kleinste cadeau voor het grootste cadeau van iemand anders.", type: "swap" },
  { text: "De timer wordt 2 minuten onzichtbaar... spannend!", type: "meta" },
  { text: "Niets aan de hand. Geniet even van je cadeaus.", type: "rest" },
  { text: "Leg al je cadeaus terug in het midden (grapje, sla maar een beurt over).", type: "rest" },
  { text: "Kies twee mensen die met elkaar van stapel moeten ruilen.", type: "swap" },
];

export default function SintGame() {
  const [phase, setPhase] = useState('setup'); // setup, round1, intermission, round2, finished
  const [players, setPlayers] = useState(['', '', '', '', '']);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentCard, setCurrentCard] = useState(null);
  const [timer, setTimer] = useState(45 * 60); // seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerHidden, setTimerHidden] = useState(false);

  // Audio effect mock (visual feedback mainly)
  const playSound = () => {
    // In a real app we'd play a sound here
  };

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

  const nextCardRound1 = () => {
    const randomCard = ROUND_1_CARDS[Math.floor(Math.random() * ROUND_1_CARDS.length)];
    setCurrentCard(randomCard);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    playSound();
  };

  const startRound2 = () => {
    setPhase('round2');
    setTimer(45 * 60); // Reset to 45 mins default
    setIsTimerRunning(true);
    setCurrentCard({ text: "De timer loopt! Druk op 'Volgende' voor actie.", type: "info" });
  };

  const nextCardRound2 = () => {
    const randomCard = ROUND_2_CARDS[Math.floor(Math.random() * ROUND_2_CARDS.length)];
    
    // Handle special meta cards
    if (randomCard.text.includes("timer wordt 2 minuten onzichtbaar")) {
      setTimerHidden(true);
      setTimeout(() => setTimerHidden(false), 120000);
    }

    setCurrentCard(randomCard);
    setCurrentPlayerIndex((prev) => (prev + 1) % players.length);
    playSound();
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-red-900 text-yellow-100 font-sans selection:bg-yellow-500 selection:text-red-900 p-4 md:p-8 flex flex-col items-center">
      
      {/* Header */}
      <header className="mb-8 text-center animate-fade-in-down">
        <h1 className="text-4xl md:text-6xl font-serif font-bold text-yellow-400 drop-shadow-md flex items-center justify-center gap-3">
          <Gift className="w-10 h-10 md:w-16 md:h-16" />
          Sinterklaas Spel
        </h1>
        <p className="text-red-200 mt-2 text-lg italic">Het Grote Avondje Dobbel-Zonder-Dobbelsteen App</p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-2xl bg-red-800 rounded-3xl shadow-2xl border-4 border-yellow-500/30 overflow-hidden relative">
        
        {/* Decorative Miters */}
        <div className="absolute top-0 left-0 w-20 h-20 bg-yellow-500/10 rounded-br-full pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-tl-full pointer-events-none"></div>

        <div className="p-6 md:p-10 min-h-[400px] flex flex-col items-center justify-center text-center">
          
          {/* PHASE: SETUP */}
          {phase === 'setup' && (
            <div className="w-full space-y-6 animate-fade-in">
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-300">
                <Users /> Wie spelen er mee?
              </div>
              <div className="space-y-3">
                {players.map((player, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      placeholder={`Naam speler ${idx + 1}`}
                      value={player}
                      onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                      className="flex-1 bg-red-900/50 border-2 border-red-700 rounded-lg px-4 py-2 focus:border-yellow-400 focus:outline-none placeholder-red-400/50 text-white"
                    />
                    {players.length > 2 && (
                      <button onClick={() => removePlayer(idx)} className="text-red-400 hover:text-red-200 px-2">✕</button>
                    )}
                  </div>
                ))}
              </div>
              <div className="flex gap-3 justify-center pt-4">
                <button onClick={addPlayer} className="px-4 py-2 rounded-full border border-yellow-500/50 text-yellow-200 hover:bg-yellow-500/10 transition">
                  + Speler toevoegen
                </button>
                <button 
                  onClick={startGame} 
                  disabled={players.filter(p => p.trim()).length < 2}
                  className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold rounded-full shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:scale-100"
                >
                  Start het Spel
                </button>
              </div>
            </div>
          )}

          {/* PHASE: ROUND 1 */}
          {phase === 'round1' && (
            <div className="w-full h-full flex flex-col justify-between animate-fade-in">
              <div className="text-yellow-500/60 font-serif text-sm uppercase tracking-widest mb-4">Ronde 1: Verdelen & Uitpakken</div>
              
              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="bg-red-950/40 px-6 py-2 rounded-full text-xl text-yellow-200">
                  Beurt van: <span className="font-bold text-yellow-400">{players[currentPlayerIndex]}</span>
                </div>
                
                <div className="bg-white/10 p-6 md:p-8 rounded-2xl border border-yellow-500/20 shadow-inner w-full">
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                    {currentCard?.text}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={nextCardRound1}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-red-900 text-xl font-bold rounded-xl shadow-lg transform hover:translate-y-[-2px] active:translate-y-[0px] transition flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-5 h-5" /> Volgende Kaart
                </button>
                <button 
                  onClick={() => setPhase('intermission')}
                  className="text-sm text-red-300 underline hover:text-yellow-200"
                >
                  Alle cadeaus zijn verdeeld? Ga naar Ronde 2
                </button>
              </div>
            </div>
          )}

          {/* PHASE: INTERMISSION */}
          {phase === 'intermission' && (
            <div className="space-y-6 animate-fade-in">
              <h2 className="text-3xl font-bold text-yellow-400">Pauze & Voorbereiding</h2>
              <p className="text-lg">
                Zijn alle cadeaus verdeeld en uitgepakt? <br/>
                Zet wat lekkers klaar, schenk wat te drinken in.
              </p>
              <div className="bg-red-950/30 p-4 rounded-lg text-left text-sm space-y-2">
                <p><strong>Regels Ronde 2:</strong></p>
                <ul className="list-disc list-inside opacity-80">
                  <li>We zetten de timer op 45 minuten.</li>
                  <li>Om de beurt krijg je een opdracht.</li>
                  <li>Als de wekker gaat, is het spel direct afgelopen.</li>
                  <li>Wat je dan hebt, is van jou!</li>
                </ul>
              </div>
              
              <div className="flex flex-col items-center gap-4 mt-6">
                 <div className="flex items-center gap-4">
                    <button onClick={() => setTimer(Math.max(60, timer - 300))} className="p-2 bg-red-900 rounded">- 5 min</button>
                    <div className="text-2xl font-mono bg-black/20 px-4 py-2 rounded">{formatTime(timer)}</div>
                    <button onClick={() => setTimer(timer + 300)} className="p-2 bg-red-900 rounded">+ 5 min</button>
                 </div>
                 
                 <button 
                  onClick={startRound2}
                  className="px-8 py-3 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold rounded-full shadow-lg transform hover:scale-105 transition flex items-center gap-2"
                >
                  <Play className="w-5 h-5" /> Start Finale
                </button>
              </div>
            </div>
          )}

          {/* PHASE: ROUND 2 */}
          {phase === 'round2' && (
            <div className="w-full h-full flex flex-col justify-between animate-fade-in">
               <div className="flex justify-between items-center mb-4">
                  <div className="text-yellow-500/60 font-serif text-sm uppercase tracking-widest">Ronde 2: Het Grote Spel</div>
                  <div className={`flex items-center gap-2 font-mono text-xl ${timer < 60 ? 'text-red-400 animate-pulse' : 'text-yellow-400'}`}>
                    <Clock className="w-5 h-5" />
                    {timerHidden ? "??:??" : formatTime(timer)}
                  </div>
               </div>

              <div className="flex-1 flex flex-col items-center justify-center gap-6">
                <div className="bg-red-950/40 px-6 py-2 rounded-full text-xl text-yellow-200">
                  Beurt van: <span className="font-bold text-yellow-400">{players[currentPlayerIndex]}</span>
                </div>
                
                <div className={`bg-white/10 p-6 md:p-8 rounded-2xl border border-yellow-500/20 shadow-inner w-full transition-all duration-500 ${currentCard?.type === 'special' ? 'bg-yellow-500/20' : ''}`}>
                  <p className="text-2xl md:text-3xl font-medium leading-relaxed">
                    {currentCard?.text}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <button 
                  onClick={nextCardRound2}
                  className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-red-900 text-xl font-bold rounded-xl shadow-lg transform hover:translate-y-[-2px] active:translate-y-[0px] transition flex items-center justify-center gap-2"
                >
                  <Shuffle className="w-5 h-5" /> Volgende Kaart
                </button>
                <div className="flex justify-center gap-4">
                   <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="text-xs text-red-300 hover:text-white">
                      {isTimerRunning ? "Pauzeer tijd" : "Hervat tijd"}
                   </button>
                </div>
              </div>
            </div>
          )}

          {/* PHASE: FINISHED */}
          {phase === 'finished' && (
            <div className="space-y-6 animate-zoom-in text-center">
              <PartyPopper className="w-24 h-24 text-yellow-400 mx-auto animate-bounce" />
              <h2 className="text-4xl md:text-5xl font-bold text-white">AFGELOPEN!</h2>
              <p className="text-xl text-yellow-200">
                Handen af van de cadeaus! <br/>
                Kijk wat je hebt gewonnen.
              </p>
              <div className="bg-white/10 p-6 rounded-xl mt-6">
                <p className="italic text-red-100">
                  "De Sint hoopt dat iedereen tevreden is,<br/>
                  al zat er misschien een luchtje aan de ruil-beslissing."
                </p>
              </div>
              <button 
                  onClick={() => window.location.reload()}
                  className="mt-8 px-6 py-3 border border-yellow-500/50 hover:bg-yellow-500/10 rounded-full text-yellow-200 flex items-center gap-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" /> Opnieuw beginnen
              </button>
            </div>
          )}

        </div>
      </main>
      
      <footer className="mt-8 text-red-400/60 text-sm">
        Fijne Sinterklaas!
      </footer>
    </div>
  );
}