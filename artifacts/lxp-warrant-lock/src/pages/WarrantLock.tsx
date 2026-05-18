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
      colorClass: "text-cyan-400",
    },
    {
      type: "CRYPTO",
      payload: `CRYPTO_SEAL :: algo=AES-256-GCM :: iv=${getRandomHex(8)} :: status=VERIFIED`,
      colorClass: "text-green-500",
    },
    {
      type: "ROUTE",
      payload: `ROUTING_BLOCK :: src=10.${r()}.${r()}.0 :: dst=172.${r()}.${r()}.1 :: policy=WARRANT_LOCKED`,
      colorClass: "text-cyan-700",
    },
    {
      type: "AUDIT",
      payload: `AUDIT_ENTRY :: case=LXP-${getRandomDigits(6)} :: hash=0x${getRandomHex(16)}`,
      colorClass: "text-yellow-500",
    },
    {
      type: "CHAIN",
      payload: `CHAIN_APPEND :: block=${getRandomDigits(4)} :: prev=${getRandomHex(8)} :: merkle=${getRandomHex(8)}`,
      colorClass: "text-fuchsia-500",
    },
  ];

  const choice = types[Math.floor(Math.random() * types.length)];
  return { id: crypto.randomUUID(), time, type: choice.type, payload: choice.payload, colorClass: choice.colorClass };
};

const CHAIN_BLOCKS = Array.from({ length: 5 }, (_, i) => ({
  id: i + 1,
  hash: `0x${getRandomHex(16)}`,
  prev: `0x${getRandomHex(16)}`,
  merkle: `0x${getRandomHex(16)}`,
}));

const BORDER = "border border-[#00f0ff]";
const BORDER_RED = "border border-[#ff0040]";
const BORDER_GREEN = "border border-[#00ff41]";
const PANEL = "bg-black " + BORDER;

export default function WarrantLock() {
  const [logs, setLogs] = useState<LogLine[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [privacyStrength, setPrivacyStrength] = useState<number>(7);
  const [simulationMode, setSimulationMode] = useState<string>("PASSIVE_MONITOR");

  const [isTampered, setIsTampered] = useState(false);
  const [isRepaired, setIsRepaired] = useState(false);
  const [isWarrantActive, setIsWarrantActive] = useState(false);
  const [warrantCase, setWarrantCase] = useState("");
  const [warrantTime, setWarrantTime] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setLogs((prev) => {
        const next = [...prev, generateLog()];
        return next.length > 80 ? next.slice(next.length - 80) : next;
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  let privacyMode = "normal";
  if (privacyStrength <= 3) privacyMode = "low";
  else if (privacyStrength >= 8) privacyMode = "high";

  const simInfoText: Record<string, string> = {
    PASSIVE_MONITOR: "Simulation engaged: passive monitoring only. No active intercepts. Read-only chain access.",
    ACTIVE_INTERCEPT: "WARNING: Active intercept mode engaged. All traffic routing through warrant gate. Chain writes enabled.",
    FORENSIC_AUDIT: "FORENSIC_AUDIT mode active. Case file metadata logged. All node IDs archived. Hash chain checkpointed.",
    DARK_PROTOCOL: "DARK_PROTOCOL engaged. All routing metadata stripped. Chain writes suspended. Warrant lock enforced.",
  };

  const handleForceWarrant = () => {
    const caseNum = getRandomDigits(6);
    const ts = new Date().toISOString();
    setWarrantCase(caseNum);
    setWarrantTime(ts);
    setIsWarrantActive(true);
    setLogs((prev) => {
      const now = new Date();
      const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}.${String(now.getMilliseconds()).padStart(3, "0")}`;
      return [...prev, {
        id: crypto.randomUUID(), time, type: "WARRANT",
        payload: `WARRANT_EVENT :: case=LXP-${caseNum} :: authority=FEDERAL_COURT :: status=TRIGGERED`,
        colorClass: "text-red-500 font-bold",
      }];
    });
    setTimeout(() => setIsWarrantActive(false), 3000);
  };

  const handleTamper = () => { setIsTampered(true); setIsRepaired(false); };

  const handleRepair = () => {
    setIsRepaired(true);
    setTimeout(() => { setIsTampered(false); setIsRepaired(false); }, 1000);
  };

  return (
    <div
      className="h-screen w-screen overflow-hidden bg-black text-[#00f0ff] select-none flex flex-col"
      style={{ fontFamily: "'Courier New', Courier, 'Lucida Console', monospace", lineHeight: "1.2" }}
      data-privacy-mode={privacyMode}
    >
      {/* Warrant flash overlay */}
      {isWarrantActive && (
        <div className="fixed inset-0 pointer-events-none z-50 tamper-flash" />
      )}

      {/* ── HEADER BAR ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-b border-[#00f0ff] px-3 py-1.5 flex items-center justify-between bg-black">
        <span className="text-[#00f0ff] font-bold text-sm tracking-[0.2em] uppercase">
          LXP WARRANT-LOCK PROTOCOL v1.0
        </span>
        <div className="flex items-center gap-3 text-[10px] text-[#00f0ff]/70 uppercase tracking-widest">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 pulse-green inline-block" />
            NOMINAL
          </span>
          <span>SEAL: INTACT</span>
          <span>CHAIN: VERIFIED</span>
        </div>
      </div>

      {/* ── TAMPER BANNER ──────────────────────────────────────────────── */}
      {isTampered && !isRepaired && (
        <div className="shrink-0 bg-[#ff0040] text-white text-xs font-bold text-center py-1 tracking-[0.3em] uppercase pulse-red">
          [TAMPER DETECTED] :: CHAIN INTEGRITY COMPROMISED :: IMMEDIATE ACTION REQUIRED
        </div>
      )}

      {/* ── WARRANT EVENT BANNER ───────────────────────────────────────── */}
      {isWarrantActive && (
        <div className="shrink-0 bg-[#ff0040]/10 border-b border-[#ff0040] text-[#ff0040] text-[10px] font-bold px-3 py-1 tracking-widest uppercase">
          WARRANT EVENT :: case=LXP-{warrantCase} :: authority=FEDERAL_COURT :: ts={warrantTime} :: chain_entry=APPEND_ONLY_LOCKED
        </div>
      )}

      {/* ── MAIN BODY ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* LEFT PANEL */}
        <div className="flex flex-col flex-1 min-w-0 border-r border-[#00f0ff]">

          {/* Command toolbar above telemetry */}
          <div className="shrink-0 flex items-center gap-0 border-b border-[#00f0ff] bg-black">
            <span className="text-[10px] font-bold text-[#00f0ff]/60 uppercase tracking-widest px-3 border-r border-[#00f0ff]/30">
              LIVE TELEMETRY STREAM
            </span>
            <button
              onClick={handleForceWarrant}
              disabled={isWarrantActive}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-r border-[#00f0ff]/30 text-[#00f0ff] hover:bg-[#00f0ff]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="button-force-warrant"
            >
              Force Warrant Event
            </button>
            <button
              onClick={handleTamper}
              disabled={isTampered && !isRepaired}
              className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest border-r border-[#00f0ff]/30 text-[#ff0040] hover:bg-[#ff0040]/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              data-testid="button-tamper-drill"
            >
              Tamper Drill
            </button>
            {isTampered && !isRepaired && (
              <button
                onClick={handleRepair}
                className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#00ff41] hover:bg-[#00ff41]/10 border-r border-[#00f0ff]/30 transition-colors animate-pulse"
                data-testid="button-repair-chain"
              >
                Repair Chain
              </button>
            )}
          </div>

          {/* Telemetry stream — fixed height, never grows page */}
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto bg-black px-2 py-1"
            style={{ maxHeight: "450px" }}
          >
            {logs.map((log) => (
              <div key={log.id} className="text-[10px] leading-[1.15] whitespace-pre-wrap break-all">
                <span className="text-[#00f0ff]/40">[{log.time}]</span>{" "}
                <span className={log.colorClass}>{log.type}</span>{" "}
                <span className="text-[#00f0ff]/80">:: {log.payload}</span>
              </div>
            ))}
          </div>

          {/* Status bar at bottom of left panel */}
          <div className="shrink-0 border-t border-[#00f0ff]/30 px-3 py-0.5 text-[9px] text-[#00f0ff]/40 uppercase tracking-widest flex gap-4">
            <span>INTERCEPT_GATE: ACTIVE</span>
            <span>PKI: BOUND</span>
            <span>AUDIT_LOG: APPEND-ONLY</span>
            <span>ENCRYPT: AES-256-GCM</span>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-72 shrink-0 flex flex-col overflow-hidden bg-black">

          {/* Privacy Strength */}
          <div className="shrink-0 border-b border-[#00f0ff] p-2">
            <div className="text-[9px] font-bold text-[#00f0ff]/60 uppercase tracking-widest mb-1">
              Privacy Strength: {privacyStrength}/10
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={privacyStrength}
              onChange={(e) => setPrivacyStrength(Number(e.target.value))}
              className="w-full accent-[#00f0ff] h-1"
              data-testid="input-privacy-strength"
            />
            {privacyMode === "low" && (
              <div className={`mt-1.5 ${BORDER_RED} bg-[#ff0040]/5 text-[#ff0040] p-1.5 text-[9px] leading-relaxed`}>
                WARNING: LOW PRIVACY THRESHOLD ACTIVE.{"\n"}
                CASE FILE: LXP-ALPHA-001.{"\n"}
                SUBJECT DATA PARTIALLY EXPOSED.{"\n"}
                FORENSIC MARKERS ENABLED.
              </div>
            )}
            {privacyMode === "high" && (
              <div className={`mt-1.5 ${BORDER_GREEN} bg-[#00ff41]/5 text-[#00ff41] p-1.5 text-[9px] leading-relaxed`}>
                ENHANCED PRIVACY ACTIVE.{"\n"}
                CASE FILE: LXP-SECURE-007.{"\n"}
                ALL INTERCEPT VECTORS SEALED.{"\n"}
                ZERO FORENSIC FOOTPRINT.
              </div>
            )}
          </div>

          {/* Simulation Mode */}
          <div className="shrink-0 border-b border-[#00f0ff] p-2">
            <div className="text-[9px] font-bold text-[#00f0ff]/60 uppercase tracking-widest mb-1">
              Simulation Mode
            </div>
            <select
              value={simulationMode}
              onChange={(e) => setSimulationMode(e.target.value)}
              className="w-full bg-black border border-[#00f0ff] text-[#00f0ff] text-[10px] p-1 outline-none"
              style={{ fontFamily: "inherit" }}
              data-testid="select-simulation-mode"
            >
              <option value="PASSIVE_MONITOR">PASSIVE_MONITOR</option>
              <option value="ACTIVE_INTERCEPT">ACTIVE_INTERCEPT</option>
              <option value="FORENSIC_AUDIT">FORENSIC_AUDIT</option>
              <option value="DARK_PROTOCOL">DARK_PROTOCOL</option>
            </select>
            <div className="mt-1.5 text-[9px] text-[#00f0ff]/55 leading-relaxed">
              {simInfoText[simulationMode]}
            </div>
          </div>

          {/* Cryptographic Chain */}
          <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
            <div className="shrink-0 border-b border-[#00f0ff]/40 px-2 py-1 text-[9px] font-bold text-[#00f0ff]/60 uppercase tracking-widest">
              Cryptographic Chain
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {CHAIN_BLOCKS.map((block, index) => {
                const isLast = index === CHAIN_BLOCKS.length - 1;
                const blockTampered = isLast && isTampered && !isRepaired;
                const blockRepaired = isLast && isRepaired;

                return (
                  <div
                    key={block.id}
                    className={`p-1.5 text-[9px] bg-black transition-colors duration-300 ${
                      blockTampered ? BORDER_RED : blockRepaired ? BORDER_GREEN : "border border-[#00f0ff]/25"
                    }`}
                  >
                    <div className="flex justify-between mb-0.5">
                      <span className="font-bold text-[#00f0ff]">Block #{block.id}</span>
                      <span className={`font-bold ${blockTampered ? "text-[#ff0040]" : blockRepaired ? "text-[#00ff41]" : "text-[#00ff41]"}`}>
                        {blockTampered ? "VIOLATION" : blockRepaired ? "REPAIRED" : "VERIFIED"}
                      </span>
                    </div>
                    <div className="text-[#00f0ff]/40">
                      Hash:{" "}
                      <span className={blockTampered ? "line-through text-[#ff0040]" : "text-[#00f0ff]/70"}>
                        {block.hash}
                      </span>
                    </div>
                    <div className="text-[#00f0ff]/40">
                      Prev: <span className="text-[#00f0ff]/60">{block.prev}</span>
                    </div>
                    <div className="text-[#00f0ff]/40">
                      Merkle: <span className="text-[#00f0ff]/60">{block.merkle}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
