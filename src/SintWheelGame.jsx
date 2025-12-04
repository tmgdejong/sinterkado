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

  const ActionButton = ({ onClick, children, style = {}, disabled = false }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.75rem 1.5rem',
        backgroundColor: disabled ? '#999' : '#ffd700',
        color: '#991b1b',
        border: '3px solid #991b1b',
        borderBottom: '4px solid #7f1d1d',
        fontWeight: 'bold',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transform: 'scale(1)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        fontSize: '1rem',
        ...style
      }}
      onMouseEnter={(e) => !disabled && (e.target.style.backgroundColor = '#fffacd')}
      onMouseLeave={(e) => !disabled && (e.target.style.backgroundColor = '#ffd700')}
      onMouseDown={(e) => !disabled && (e.target.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => !disabled && (e.target.style.transform = 'scale(1)')}
    >
      {children}
    </button>
  );

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#7f1d1d',
      color: '#fffacd',
      fontFamily: 'Arial, sans-serif',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      overflowX: 'hidden'
    }}>
      
      {/* Header */}
      <header style={{ marginBottom: '1.5rem', textAlign: 'center', zIndex: 10 }}>
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontFamily: 'Georgia, serif',
          fontWeight: 'bold',
          color: '#ffd700',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
          display: 'flex',
          flexDirection: window.innerWidth < 768 ? 'column' : 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.75rem'
        }}>
          <Gift style={{ width: '2.5rem', height: '2.5rem' }} />
          <span>Sinterklaas Spel</span>
        </h1>
        <p style={{ color: '#fecaca', marginTop: '0.25rem', fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>Nu met het Rad van Sinterklaas!</p>
      </header>

      {/* Main Board */}
      <main style={{
        width: '100%',
        maxWidth: '42rem',
        backgroundColor: '#991b1b',
        borderRadius: '1.5rem',
        boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
        border: '4px solid rgba(255, 215, 0, 0.3)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '500px'
      }}>
        
        {/* Decor: Corner Miters */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '6rem',
          height: '6rem',
          backgroundColor: 'rgba(255, 215, 0, 0.05)',
          borderRadius: '0 0 100% 0',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: '6rem',
          height: '6rem',
          backgroundColor: 'rgba(255, 215, 0, 0.05)',
          borderRadius: '100% 0 0 0',
          pointerEvents: 'none'
        }}></div>

        {/* PHASE: SETUP */}
        {phase === 'setup' && (
          <div style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            gap: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#fef08a',
              fontFamily: 'Georgia, serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Users /> Wie vieren er mee?
            </h2>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {players.map((player, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder={`Naam speler ${idx + 1}`}
                    value={player}
                    onChange={(e) => handlePlayerNameChange(idx, e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: '#7f1d1d',
                      border: '2px solid #991b1b',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 1rem',
                      color: 'white',
                      fontSize: '1rem'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#ffd700';
                      e.target.style.backgroundColor = '#991b1b'
                    }}
                    onBlur={(e) => e.target.style.borderColor = '#991b1b'}
                  />
                  {players.length > 2 && (
                    <button 
                      onClick={() => removePlayer(idx)}
                      style={{
                        color: '#f87171',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none'
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '0.75rem',
              paddingTop: '1rem'
            }}>
              <button 
                onClick={addPlayer}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.3)',
                  color: '#fef08a',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  backgroundColor: 'transparent'
                }}
              >
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
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            position: 'relative'
          }}>
            
            {/* Top Bar */}
            <div style={{
              backgroundColor: 'rgba(127, 29, 29, 0.3)',
              padding: '1rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(157, 27, 27, 0.5)'
            }}>
               <div style={{
                 fontFamily: 'Georgia, serif',
                 color: 'rgba(255, 215, 0, 0.8)',
                 textTransform: 'uppercase',
                 letterSpacing: '0.1em',
                 fontSize: '0.875rem'
               }}>
                 {phase === 'round1' ? "Ronde 1: Verdelen" : "Ronde 2: Het Spel"}
               </div>
               {phase === 'round2' && (
                 <div style={{
                   fontFamily: 'monospace',
                   fontSize: '1.25rem',
                   display: 'flex',
                   alignItems: 'center',
                   gap: '0.5rem',
                   color: timer < 60 ? '#f87171' : '#ffd700',
                   animation: timer < 60 ? 'pulse 2s infinite' : 'none'
                 }}>
                   <Clock style={{ width: '1.25rem', height: '1.25rem' }} /> {formatTime(timer)}
                 </div>
               )}
            </div>

            {/* Card Display Area */}
            <div style={{
              flex: 1,
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              gap: '1.5rem'
            }}>
              
              <div style={{
                backgroundColor: 'rgba(127, 29, 29, 0.5)',
                padding: '0.5rem 1.5rem',
                borderRadius: '9999px',
                border: '1px solid rgba(255, 215, 0, 0.3)'
              }}>
                Aan de beurt: <span style={{ fontWeight: 'bold', color: '#fef08a', fontSize: '1.25rem', marginLeft: '0.5rem' }}>{players[currentPlayerIndex]}</span>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '2rem',
                borderRadius: '0.75rem',
                border: '2px dashed rgba(255, 215, 0, 0.2)',
                width: '100%',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                minHeight: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <p style={{
                  fontSize: 'clamp(1.5rem, 4vw, 1.875rem)',
                  fontWeight: 500,
                  lineHeight: 1.5,
                  fontFamily: 'Georgia, serif'
                }}>
                  {currentCard?.text}
                </p>
              </div>

            </div>

            {/* Controls */}
            <div style={{
              padding: '1.5rem',
              backgroundColor: 'rgba(127, 29, 29, 0.2)',
              borderTop: '1px solid rgba(157, 27, 27, 0.5)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <ActionButton onClick={nextTurn} style={{ width: '100%', fontSize: '1.25rem' }}>
                {turnCounter > 0 && turnCounter % 4 === 0 ? "Spannend..." : "Volgende Kaart"} <Shuffle style={{ width: '1.25rem', height: '1.25rem' }} />
              </ActionButton>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingLeft: '0.5rem',
                paddingRight: '0.5rem'
              }}>
                 <button 
                   onClick={() => setShowWheel(true)}
                   style={{
                     fontSize: '0.75rem',
                     color: 'rgba(255, 215, 0, 0.7)',
                     display: 'flex',
                     alignItems: 'center',
                     gap: '0.25rem',
                     cursor: 'pointer',
                     background: 'none',
                     border: 'none'
                   }}
                 >
                    <RefreshCw style={{ width: '0.75rem', height: '0.75rem' }} /> Forceer het Rad
                 </button>
                 
                 {phase === 'round1' && (
                   <button 
                     onClick={() => setPhase('intermission')}
                     style={{
                       fontSize: '0.75rem',
                       color: '#fed7aa',
                       cursor: 'pointer',
                       background: 'none',
                       border: 'none',
                       textDecoration: 'underline'
                     }}
                   >
                     Naar Ronde 2
                   </button>
                 )}
                 {phase === 'round2' && (
                   <button 
                     onClick={() => setIsTimerRunning(!isTimerRunning)}
                     style={{
                       fontSize: '0.75rem',
                       color: '#fed7aa',
                       cursor: 'pointer',
                       background: 'none',
                       border: 'none'
                     }}
                   >
                     {isTimerRunning ? "Pauzeer" : "Hervat"}
                   </button>
                 )}
              </div>
            </div>

          </div>
        )}

        {/* INTERMISSION */}
        {phase === 'intermission' && (
          <div style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            gap: '1.5rem'
          }}>
            <h2 style={{
              fontSize: '1.875rem',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              color: '#ffd700'
            }}>Tijd voor Pepernoten!</h2>
            <p style={{
              color: '#fecaca',
              maxWidth: '28rem'
            }}>
              Zijn alle cadeaus verdeeld en uitgepakt? Zet de timer, pak wat te drinken, want nu gaat het echte spel beginnen.
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              backgroundColor: 'rgba(127, 29, 29, 0.5)',
              padding: '1rem',
              borderRadius: '0.5rem'
            }}>
                <button 
                  onClick={() => setTimer(Math.max(60, timer - 300))}
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(155, 27, 27, 0.5)',
                    border: 'none',
                    color: '#ffd700'
                  }}
                >
                  - 5 min
                </button>
                <div style={{
                  fontSize: '1.5rem',
                  fontFamily: 'monospace',
                  color: '#ffd700',
                  width: '6rem'
                }}>
                  {formatTime(timer)}
                </div>
                <button 
                  onClick={() => setTimer(timer + 300)}
                  style={{
                    padding: '0.5rem',
                    cursor: 'pointer',
                    backgroundColor: 'rgba(155, 27, 27, 0.5)',
                    border: 'none',
                    color: '#ffd700'
                  }}
                >
                  + 5 min
                </button>
            </div>
            <ActionButton onClick={startRound2}>
              Start de Finale <Play style={{ width: '1.25rem', height: '1.25rem', marginLeft: '0.5rem' }} />
            </ActionButton>
          </div>
        )}

        {/* FINISHED */}
        {phase === 'finished' && (
          <div style={{
            padding: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            gap: '2rem'
          }}>
            <PartyPopper style={{
              width: '6rem',
              height: '6rem',
              color: '#ffd700',
              animation: 'bounce 2s infinite'
            }} />
            <h2 style={{
              fontSize: '3rem',
              fontFamily: 'Georgia, serif',
              fontWeight: 'bold',
              color: 'white'
            }}>Afgelopen!</h2>
            <p style={{
              fontSize: '1.25rem',
              color: '#fef08a'
            }}>
              Handen af van de cadeaus! Dit is je buit.
            </p>
            <button 
                onClick={() => window.location.reload()}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid rgba(255, 215, 0, 0.5)',
                  backgroundColor: 'transparent',
                  borderRadius: '9999px',
                  color: '#fef08a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer'
                }}
            >
                <RotateCcw style={{ width: '1rem', height: '1rem' }} /> Opnieuw
            </button>
          </div>
        )}

        {/* --- WHEEL OVERLAY MODAL --- */}
        {showWheel && (
          <div style={{
            position: 'absolute',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            animation: 'fadeIn 0.3s ease-in'
          }}>
            <div style={{ position: 'relative', marginBottom: '2rem' }}>
              {/* Pointer */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%) translateY(-1rem)',
                zIndex: 20,
                width: 0,
                height: 0,
                borderLeft: '15px solid transparent',
                borderRight: '15px solid transparent',
                borderTop: '25px solid white',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'
              }}></div>
              
              {/* The Wheel */}
              <svg 
                width={window.innerWidth < 768 ? 280 : 350}
                height={window.innerWidth < 768 ? 280 : 350}
                viewBox="0 0 350 350"
                style={{
                  borderRadius: '50%',
                  border: '8px solid #ffd700',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  animation: `spin 3s ${isSpinning ? 'cubic-bezier(0.25,0.1,0.25,1)' : 'ease-out'} forwards`,
                  transformOrigin: 'center',
                  transform: `rotate(${wheelRotation}deg)`
                }}
              >
                {WHEEL_OPTIONS.map((opt, i) => {
                  const segmentAngle = 360 / WHEEL_OPTIONS.length;
                  const startAngle = (i * segmentAngle - 90) * (Math.PI / 180);
                  const endAngle = ((i + 1) * segmentAngle - 90) * (Math.PI / 180);
                  
                  const x1 = 175 + 150 * Math.cos(startAngle);
                  const y1 = 175 + 150 * Math.sin(startAngle);
                  const x2 = 175 + 150 * Math.cos(endAngle);
                  const y2 = 175 + 150 * Math.sin(endAngle);
                  
                  const largeArc = segmentAngle > 180 ? 1 : 0;
                  
                  const pathData = `
                    M 175 175
                    L ${x1} ${y1}
                    A 150 150 0 ${largeArc} 1 ${x2} ${y2}
                    Z
                  `;
                  
                  return (
                    <path
                      key={i}
                      d={pathData}
                      fill={opt.color}
                      stroke="white"
                      strokeWidth="2"
                    />
                  );
                })}
                
                {/* Center Cap */}
                <circle
                  cx="175"
                  cy="175"
                  r="30"
                  fill="#ffd700"
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x="175"
                  y="182"
                  textAnchor="middle"
                  fontSize="24"
                  fontWeight="bold"
                  fill="#991b1b"
                >
                  ★
                </text>
              </svg>
            </div>

            {/* Result Display */}
            <div style={{
              textAlign: 'center',
              gap: '1rem',
              maxWidth: '28rem'
            }}>
              {!wheelResult ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontFamily: 'Georgia, serif',
                    color: '#ffd700',
                    fontWeight: 'bold',
                    animation: 'pulse 2s infinite'
                  }}>Rad van Sinterklaas!</h3>
                  <ActionButton 
                    onClick={spinTheWheel}
                    style={{ width: '100%' }}
                    disabled={isSpinning}
                  >
                     {isSpinning ? "Aan het draaien..." : "GEEF EEN SLINGER!"}
                  </ActionButton>
                </div>
              ) : (
                <div style={{
                  backgroundColor: 'white',
                  color: '#991b1b',
                  padding: '1.5rem',
                  borderRadius: '0.75rem',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  border: '4px solid #ffd700',
                  animation: 'popIn 0.3s ease-out'
                }}>
                  <div style={{
                    textTransform: 'uppercase',
                    fontWeight: 'bold',
                    letterSpacing: '0.1em',
                    fontSize: '0.875rem',
                    marginBottom: '0.5rem',
                    color: '#888'
                  }}>Het lot bepaalt:</div>
                  <h3 style={{
                    fontSize: '1.875rem',
                    fontWeight: 900,
                    marginBottom: '0.5rem',
                    color: wheelResult.color
                  }}>{wheelResult.label}</h3>
                  <p style={{
                    fontSize: '1.125rem',
                    lineHeight: 1.5,
                    fontFamily: 'Georgia, serif',
                    marginBottom: '1rem'
                  }}>{wheelResult.text}</p>
                  <button 
                    onClick={closeWheel}
                    style={{
                      marginTop: '1rem',
                      padding: '0.5rem 1.5rem',
                      backgroundColor: '#991b1b',
                      color: 'white',
                      borderRadius: '0.5rem',
                      border: 'none',
                      cursor: 'pointer',
                      width: '100%',
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    Doorgaan
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </main>
      
      <footer style={{
        marginTop: '2rem',
        color: 'rgba(248, 113, 113, 0.6)',
        fontSize: '0.875rem',
        fontFamily: 'Georgia, serif'
      }}>
        Fijne Sinterklaas!
      </footer>
    </div>
  );
}