import { useState, useEffect, useRef } from "react";

type LogLine = {
  id: string;
  time: string;
  type: string;
  payload: string;
  colorClass: string;
};

const getRandomHex = (len: number) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join("");
const getRandomDigits = (len: number) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");

const generateLog = (): LogLine => {
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;

  const r = () => Math.floor(Math.random() * 255);
  
  const types = [
    {
      type: "INTERCEPT",
      payload: `DATA_INTERCEPT :: node=${getRandomHex(4)} :: bytes=${Math.floor(Math.random() * 9899 + 100)} :: seal=0x${getRandomHex(8)}`,
      colorClass: "text-cyan-400"
    },
    {
      type: "CRYPTO",
      payload: `CRYPTO_SEAL :: algo=AES-256-GCM :: iv=${getRandomHex(8)} :: status=VERIFIED`,
      colorClass: "text-green-500"
    },
    {
      type: "ROUTE",
      payload: `ROUTING_BLOCK :: src=10.${r()}.${r()}.0 :: dst=172.${r()}.${r()}.1 :: policy=WARRANT_LOCKED`,
      colorClass: "text-cyan-700"
    },
    {
      type: "AUDIT",
      payload: `AUDIT_ENTRY :: case=LXP-${getRandomDigits(6)} :: hash=0x${getRandomHex(16)}`,
      colorClass: "text-yellow-500"
    },
    {
      type: "CHAIN",
      payload: `CHAIN_APPEND :: block=${getRandomDigits(4)} :: prev=${getRandomHex(8)} :: merkle=${getRandomHex(8)}`,
      colorClass: "text-fuchsia-500"
    }
  ];

  const choice = types[Math.floor(Math.random() * types.length)];

  return {
    id: crypto.randomUUID(),
    time,
    type: choice.type,
    payload: choice.payload,
    colorClass: choice.colorClass
  };
};

const CHAIN_BLOCKS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  hash: `0x${getRandomHex(16)}`,
  prev: `0x${getRandomHex(16)}`,
  merkle: `0x${getRandomHex(16)}`
}));

export default function WarrantLock() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [privacyStrength, setPrivacyStrength] = useState<number>(7);
  const [simulationMode, setSimulationMode] = useState<string>("PASSIVE_MONITOR");
  
  const [isTampered, setIsTampered] = useState(false);
  const [isRepaired, setIsRepaired] = useState(false);
  const [isWarrantActive, setIsWarrantActive] = useState(false);

  // Generate logs
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        const newLogs = [...prev, generateLog()];
        if (newLogs.length > 80) return newLogs.slice(newLogs.length - 80);
        return newLogs;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  let privacyMode = "normal";
  if (privacyStrength <= 3) privacyMode = "low";
  else if (privacyStrength >= 8) privacyMode = "high";

  let simInfoText = "";
  if (simulationMode === "PASSIVE_MONITOR") {
    simInfoText = "Simulation engaged: passive monitoring only. No active intercepts. Read-only chain access.";
  } else if (simulationMode === "ACTIVE_INTERCEPT") {
    simInfoText = "WARNING: Active intercept mode engaged. All traffic routing through warrant gate. Chain writes enabled.";
  } else if (simulationMode === "FORENSIC_AUDIT") {
    simInfoText = "FORENSIC_AUDIT mode active. Case file metadata logged. All node IDs archived. Hash chain checkpointed.";
  } else if (simulationMode === "DARK_PROTOCOL") {
    simInfoText = "DARK_PROTOCOL engaged. All routing metadata stripped. Chain writes suspended. Warrant lock enforced.";
  }

  const handleForceWarrant = () => {
    setIsWarrantActive(true);
    setLogs((prev) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      const log = {
        id: crypto.randomUUID(),
        time,
        type: "WARRANT",
        payload: `WARRANT_EVENT :: case=LXP-${getRandomDigits(6)} :: authority=FEDERAL_COURT :: status=TRIGGERED`,
        colorClass: "text-red-500 font-bold"
      };
      return [...prev, log];
    });

    setTimeout(() => {
      setIsWarrantActive(false);
    }, 3000);
  };

  const handleTamper = () => {
    setIsTampered(true);
    setIsRepaired(false);
  };

  const handleRepair = () => {
    setIsRepaired(true);
    setTimeout(() => {
      setIsTampered(false);
      setIsRepaired(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-mono p-4 md:p-8 flex flex-col space-y-6 select-none" data-privacy-mode={privacyMode}>
      
      {/* Overlay for warrant event */}
      {isWarrantActive && (
        <div className="fixed inset-0 pointer-events-none z-50 tamper-flash" />
      )}

      {/* Header */}
      <header className="space-y-2 border-b border-cyan-900/50 pb-4">
        <h1 className="text-3xl md:text-5xl font-bold cyber-glow text-cyan-400">
          LXP WARRANT-LOCK PROTOCOL v1.0
        </h1>
        <div className="flex items-center space-x-2 text-sm md:text-base text-cyan-600">
          <span>SYSTEM STATUS: NOMINAL</span>
          <span className="w-3 h-3 bg-green-500 rounded-full pulse-green inline-block ml-1"></span>
          <span className="mx-2">|</span>
          <span>SEAL: INTACT</span>
          <span className="mx-2">|</span>
          <span>CHAIN: VERIFIED</span>
        </div>
      </header>

      {/* Tamper Banner */}
      <div 
        className={`w-full bg-red-600 text-white font-bold uppercase text-xl p-4 text-center tracking-widest pulse-red transition-opacity duration-300 ${isTampered && !isRepaired ? 'opacity-100' : 'opacity-0 pointer-events-none hidden'}`}
      >
        TAMPER DETECTED
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-1">
        
        {/* LEFT COLUMN */}
        <div className="md:col-span-7 flex flex-col space-y-2">
          <div className="text-cyan-500 font-bold mb-2">LIVE TELEMETRY STREAM</div>
          <div 
            ref={scrollRef}
            className="flex-1 min-h-[400px] h-[600px] overflow-y-auto bg-black/80 border border-cyan-900 p-4 font-mono text-xs md:text-sm space-y-1 shadow-[0_0_15px_rgba(0,255,255,0.1)] rounded-sm"
          >
            {logs.map((log) => (
              <div key={log.id} className="whitespace-pre-wrap break-all">
                <span className="text-cyan-700">[{log.time}]</span>{" "}
                <span className={log.colorClass}>{log.type}</span>{" "}
                <span className="text-cyan-200">:: {log.payload}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="md:col-span-5 flex flex-col space-y-6">
          
          {/* CONTROLS */}
          <div className="bg-card border border-card-border p-4 rounded-sm space-y-6 relative overflow-hidden">
            <div className="space-y-2 relative z-10">
              <label className="block text-sm font-bold text-cyan-400">PRIVACY STRENGTH: {privacyStrength}/10</label>
              <input 
                type="range" 
                min="1" max="10" 
                value={privacyStrength}
                onChange={(e) => setPrivacyStrength(Number(e.target.value))}
                className="w-full accent-cyan-500"
                data-testid="input-privacy-strength"
              />
              {privacyMode === 'low' && (
                <div className="mt-2 border border-red-500/50 bg-red-950/30 text-red-400 p-2 text-xs">
                  WARNING: LOW PRIVACY THRESHOLD ACTIVE.<br/>
                  CASE FILE: LXP-ALPHA-001.<br/>
                  SUBJECT DATA PARTIALLY EXPOSED.<br/>
                  FORENSIC MARKERS ENABLED.
                </div>
              )}
              {privacyMode === 'high' && (
                <div className="mt-2 border border-green-500/50 bg-green-950/30 text-green-400 p-2 text-xs">
                  ENHANCED PRIVACY ACTIVE.<br/>
                  CASE FILE: LXP-SECURE-007.<br/>
                  ALL INTERCEPT VECTORS SEALED.<br/>
                  ZERO FORENSIC FOOTPRINT.
                </div>
              )}
            </div>

            <div className="space-y-2 relative z-10">
              <label className="block text-sm font-bold text-cyan-400">SIMULATION MODE</label>
              <select 
                value={simulationMode}
                onChange={(e) => setSimulationMode(e.target.value)}
                className="w-full bg-black/80 border border-cyan-800 text-cyan-300 font-mono p-2 outline-none focus:border-cyan-400"
                data-testid="select-simulation-mode"
              >
                <option value="PASSIVE_MONITOR">PASSIVE_MONITOR</option>
                <option value="ACTIVE_INTERCEPT">ACTIVE_INTERCEPT</option>
                <option value="FORENSIC_AUDIT">FORENSIC_AUDIT</option>
                <option value="DARK_PROTOCOL">DARK_PROTOCOL</option>
              </select>
              <div className="text-xs text-cyan-600 mt-2 min-h-[3rem]">
                {simInfoText}
              </div>
            </div>
          </div>

          {/* CHAIN PANEL */}
          <div className="bg-card border border-card-border p-4 rounded-sm flex-1 flex flex-col">
            <div className="text-cyan-500 font-bold mb-4">CRYPTOGRAPHIC CHAIN</div>
            
            {isWarrantActive ? (
              <div className="flex-1 flex items-center justify-center border border-red-500/50 bg-red-950/30 text-red-500 p-4 text-sm animate-pulse text-center">
                WARRANT EVENT TRIGGERED<br/>
                case=LXP-{getRandomDigits(6)}<br/>
                authority=FEDERAL_COURT<br/>
                timestamp={new Date().toISOString()}<br/>
                chain_entry=APPEND_ONLY_LOCKED
              </div>
            ) : (
              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {CHAIN_BLOCKS.map((block, index) => {
                  const isLast = index === CHAIN_BLOCKS.length - 1;
                  const blockTampered = isLast && isTampered && !isRepaired;
                  
                  return (
                    <div 
                      key={block.id}
                      className={`p-3 text-xs border bg-black/50 transition-colors duration-300 ${blockTampered ? 'border-red-500 shadow-[0_0_10px_rgba(255,0,0,0.2)]' : 'border-green-900'}`}
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-bold text-cyan-400">Block #{block.id}</span>
                        <span className={`font-bold ${blockTampered ? 'text-red-500' : 'text-green-500'}`}>
                          {blockTampered ? 'INTEGRITY VIOLATION' : isLast && isRepaired ? 'CHAIN REPAIRED' : 'VERIFIED'}
                        </span>
                      </div>
                      <div className="text-cyan-700">Hash: <span className={blockTampered ? 'line-through text-red-400' : 'text-cyan-300'}>{block.hash}</span></div>
                      <div className="text-cyan-700">Prev: <span className="text-cyan-500">{block.prev}</span></div>
                      <div className="text-cyan-700">Merkle: <span className="text-cyan-500">{block.merkle}</span></div>
                    </div>
                  );
                })}
              </div>
            )}

            {isTampered && !isRepaired && !isWarrantActive && (
              <button 
                onClick={handleRepair}
                className="mt-4 w-full bg-red-900/50 hover:bg-red-800 text-red-100 border border-red-500 p-2 font-bold uppercase transition-colors"
                data-testid="button-repair-chain"
              >
                REPAIR CHAIN
              </button>
            )}
          </div>

          {/* DRILL BUTTONS */}
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={handleForceWarrant}
              disabled={isWarrantActive}
              className="bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-700 p-4 font-bold text-sm uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-force-warrant"
            >
              Force Warrant Event
            </button>
            <button 
              onClick={handleTamper}
              disabled={isTampered && !isRepaired}
              className="bg-red-950/40 hover:bg-red-900/60 text-red-400 border border-red-800 p-4 font-bold text-sm uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-tamper-drill"
            >
              Tamper Drill
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}