import { useState, useEffect, useCallback, useRef } from "react";
import {
  getTalentTree,
  allocateTalentPoint,
} from "../utils/talents-api";
import { useAuth } from "../context/auth-context";
import { useLevel } from "../context/level-context";
import type {
  TalentTreeResponse,
  TalentInfo,
  TalentId,
  TalentTreeType,
} from "../types/talents";
import { TALENT_TREES } from "../types/talents";
import "./talents.css";

// Particle system for ambient effects
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      opacity: number;
      life: number;
      maxLife: number;
      color: string;
    }

    const particles: Particle[] = [];
    const maxParticles = 25;
    const colors = ["#00d4aa", "#f5a623"];

    const createParticle = (): Particle => ({
      x: Math.random() * canvas.offsetWidth,
      y: canvas.offsetHeight + 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.2 - Math.random() * 0.3,
      size: 1 + Math.random() * 1.5,
      opacity: 0.15 + Math.random() * 0.2,
      life: 0,
      maxLife: 250 + Math.random() * 150,
      color: colors[Math.floor(Math.random() * colors.length)],
    });

    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      frameCount++;

      if (frameCount % 12 === 0 && particles.length < maxParticles) {
        particles.push(createParticle());
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const lifeProgress = p.life / p.maxLife;
        const currentOpacity = p.opacity * (1 - lifeProgress);

        if (p.life >= p.maxLife || currentOpacity <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.beginPath();
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 2);
        gradient.addColorStop(0, p.color.replace(")", `, ${currentOpacity})`).replace("#", "rgba(").replace(/(.{2})(.{2})(.{2})/, (_, r, g, b) => 
          `${parseInt(r, 16)}, ${parseInt(g, 16)}, ${parseInt(b, 16)}`));
        gradient.addColorStop(1, "transparent");
        ctx.fillStyle = p.color;
        ctx.globalAlpha = currentOpacity;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="talent-particles" />;
}

// Tree icon components
function FaucetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
    </svg>
  );
}

function LeverageIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  );
}

// Talent node icons based on talent ID
function TalentIcon({ talentId, size = 18 }: { talentId: TalentId; size?: number }) {
  switch (talentId) {
    case "faucetAmountBoost":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v12" />
          <path d="M6 12h12" />
        </svg>
      );
    case "faucetCooldownReduction":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case "faucetDoubleClaim":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="8" y="14" width="8" height="7" rx="1" />
        </svg>
      );
    case "leverageBoostSmall":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case "leverageBoostLarge":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case "liquidationSave":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    default:
      return null;
  }
}

// Single talent node component
interface TalentNodeProps {
  talent: TalentInfo;
  treeType: TalentTreeType;
  canAllocate: boolean;
  isAllocating: boolean;
  onAllocate: () => void;
  onSelect: () => void;
}

function TalentNode({
  talent,
  treeType,
  canAllocate,
  isAllocating,
  onAllocate,
  onSelect,
}: TalentNodeProps) {
  const meta = TALENT_TREES[treeType];
  const isMaxed = talent.currentPoints >= talent.maxPoints;
  const hasPoints = talent.currentPoints > 0;

  const nodeClass = [
    "talent-node",
    talent.isUnlocked ? "unlocked" : "locked",
    isMaxed ? "maxed" : "",
    hasPoints ? "has-points" : "",
    canAllocate ? "can-allocate" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleClick = () => {
    // Always select to show details (sheet on mobile, tooltip on desktop)
    onSelect();
    
    // On desktop, also allocate if possible (mobile will use the sheet button)
    const isDesktop = window.matchMedia("(min-width: 581px)").matches;
    if (isDesktop && canAllocate) {
      onAllocate();
    }
  };

  return (
    <div className={nodeClass} data-tree={treeType}>
      <button
        className="talent-node-btn"
        onClick={handleClick}
        disabled={isAllocating}
        style={{ "--node-color": meta.color, "--node-glow": meta.glowColor } as React.CSSProperties}
      >
        <div className="node-glow" />
        <div className="node-ring">
          <TalentIcon talentId={talent.id} size={20} />
        </div>
        <div className="node-points">
          {talent.currentPoints}/{talent.maxPoints}
        </div>
        
        {/* Tooltip - desktop only */}
        <div className="talent-tooltip">
          <div className="tooltip-header">
            <span className="tooltip-name">{talent.name}</span>
            <span className="tooltip-points">{talent.currentPoints}/{talent.maxPoints}</span>
          </div>
          <p className="tooltip-desc">{talent.description}</p>
          {canAllocate && (
            <div className="tooltip-action">Click to allocate</div>
          )}
          {!talent.isUnlocked && (
            <div className="tooltip-locked">Locked</div>
          )}
        </div>
      </button>
    </div>
  );
}

// Mobile bottom sheet for talent details
interface TalentSheetProps {
  talent: TalentInfo | null;
  treeType: TalentTreeType | null;
  canAllocate: boolean;
  isAllocating: boolean;
  onAllocate: () => void;
  onClose: () => void;
}

function TalentSheet({
  talent,
  treeType,
  canAllocate,
  isAllocating,
  onAllocate,
  onClose,
}: TalentSheetProps) {
  if (!talent || !treeType) return null;

  const meta = TALENT_TREES[treeType];
  const isMaxed = talent.currentPoints >= talent.maxPoints;

  return (
    <>
      <div 
        className="talent-sheet-overlay" 
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          zIndex: 99998,
        }}
      />
      <div 
        className="talent-sheet" 
        data-tree={treeType}
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: '50vh',
          left: '50vw',
          transform: 'translate(-50%, -50%)',
          width: '90vw',
          maxWidth: '320px',
          background: '#1a1a2e',
          border: `2px solid ${meta.color}`,
          borderRadius: '16px',
          padding: '1.25rem',
          zIndex: 999999,
          boxShadow: `0 0 30px ${meta.color}33`,
        }}
      >
        <div className="sheet-handle" />
        
        <div className="sheet-header">
          <div 
            className="sheet-icon"
            style={{ "--sheet-color": meta.color } as React.CSSProperties}
          >
            <TalentIcon talentId={talent.id} size={28} />
          </div>
          <div className="sheet-title">
            <h3>{talent.name}</h3>
            <span className="sheet-points">{talent.currentPoints} / {talent.maxPoints}</span>
          </div>
          <button className="sheet-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="sheet-description">{talent.description}</p>

        {!talent.isUnlocked && (
          <div className="sheet-locked">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Requires previous talent
          </div>
        )}

        {isMaxed && (
          <div className="sheet-maxed">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Fully Unlocked
          </div>
        )}

        {canAllocate && (
          <button 
            className="sheet-allocate-btn"
            onClick={onAllocate}
            disabled={isAllocating}
            style={{ "--btn-color": meta.color } as React.CSSProperties}
          >
            {isAllocating ? "Allocating..." : "Allocate Point"}
          </button>
        )}
      </div>
    </>
  );
}

// Tree column with connecting lines
interface TreeColumnProps {
  treeType: TalentTreeType;
  talents: TalentInfo[];
  availablePoints: number;
  isAllocating: boolean;
  onAllocate: (talentId: TalentId) => void;
  onSelectTalent: (talent: TalentInfo, treeType: TalentTreeType) => void;
}

function TreeColumn({
  treeType,
  talents,
  availablePoints,
  isAllocating,
  onAllocate,
  onSelectTalent,
}: TreeColumnProps) {
  const meta = TALENT_TREES[treeType];
  const sortedTalents = [...talents].sort((a, b) => a.tier - b.tier);
  const totalSpent = talents.reduce((sum, t) => sum + t.currentPoints, 0);
  const maxPoints = talents.reduce((sum, t) => sum + t.maxPoints, 0);

  return (
    <div className="tree-column" data-tree={treeType}>
      {/* Tree Header */}
      <div className="tree-column-header">
        <div className="tree-icon" style={{ "--tree-color": meta.color } as React.CSSProperties}>
          {treeType === "faucet" ? <FaucetIcon /> : <LeverageIcon />}
        </div>
        <span className="tree-name">{meta.name}</span>
        <span className="tree-points">{totalSpent}/{maxPoints}</span>
      </div>

      {/* Nodes with lines */}
      <div className="tree-nodes-wrapper">
        {/* Connection lines SVG */}
        <svg className="tree-lines" viewBox="0 0 60 280" preserveAspectRatio="xMidYMid meet">
          {sortedTalents.map((talent, index) => {
            if (index === 0) return null;
            const prevTalent = sortedTalents[index - 1];
            const isActive = prevTalent.currentPoints > 0;
            const isComplete = prevTalent.currentPoints >= prevTalent.maxPoints;
            
            const y1 = index * 90 - 45 + 30;
            const y2 = index * 90 + 30;
            
            return (
              <line
                key={talent.id}
                x1="30"
                y1={y1}
                x2="30"
                y2={y2}
                className={`connector-line ${isComplete ? "complete" : isActive ? "active" : "inactive"}`}
                style={{ "--line-color": meta.color } as React.CSSProperties}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        <div className="tree-nodes">
          {sortedTalents.map((talent) => {
            const canAllocate =
              availablePoints > 0 &&
              talent.isUnlocked &&
              talent.currentPoints < talent.maxPoints;

            return (
              <TalentNode
                key={talent.id}
                talent={talent}
                treeType={treeType}
                canAllocate={canAllocate}
                isAllocating={isAllocating}
                onAllocate={() => onAllocate(talent.id)}
                onSelect={() => onSelectTalent(talent, treeType)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Main talents page
export function TalentsPage() {
  const { isConnected, isAuthenticated, isAuthLoading, login } = useAuth();
  const { levelInfo } = useLevel();

  const [talentTree, setTalentTree] = useState<TalentTreeResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAllocating, setIsAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile sheet state
  const [selectedTalent, setSelectedTalent] = useState<TalentInfo | null>(null);
  const [selectedTreeType, setSelectedTreeType] = useState<TalentTreeType | null>(null);

  const handleSelectTalent = (talent: TalentInfo, treeType: TalentTreeType) => {
    setSelectedTalent(talent);
    setSelectedTreeType(treeType);
  };

  const handleCloseSheet = () => {
    setSelectedTalent(null);
    setSelectedTreeType(null);
  };

  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const treeData = await getTalentTree();
      setTalentTree(treeData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load talents");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAllocate = async (talentId: TalentId) => {
    if (!isAuthenticated) {
      login();
      return;
    }

    setIsAllocating(true);
    setError(null);

    try {
      const result = await allocateTalentPoint(talentId);
      setTalentTree(result.talentTree);
      
      // Notify level display to update points indicator
      window.dispatchEvent(new CustomEvent("talentPointAllocated"));
      
      // Update selected talent if sheet is open
      if (selectedTalent && selectedTreeType) {
        const updatedTalents = selectedTreeType === "faucet" 
          ? result.talentTree.faucetTree 
          : result.talentTree.leverageTree;
        const updatedTalent = updatedTalents.find(t => t.id === selectedTalent.id);
        if (updatedTalent) {
          setSelectedTalent(updatedTalent);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to allocate point");
    } finally {
      setIsAllocating(false);
    }
  };

  if (isAuthenticated && isLoading) {
    return (
      <div className="talents-loading">
        <div className="loading-orb">
          <div className="orb-ring" />
          <div className="orb-core" />
        </div>
        <p>Loading talents...</p>
      </div>
    );
  }

  return (
    <div className="talents-page">
      {/* Header */}
      <div className="talents-header">
        <div className="header-left">
          <h1>Talent Tree</h1>
          <div className="header-stats">
            <div className="stat">
              <span className="stat-label">Lvl</span>
              <span className="stat-value">{levelInfo?.level ?? talentTree?.userLevel ?? 1}</span>
            </div>
            <div className="stat available">
              <span className="stat-label">Available</span>
              <span className="stat-value">{talentTree?.availablePoints ?? 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="talents-error">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Not Connected State */}
      {!isConnected && (
        <div className="talents-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <p>Connect wallet to view talents</p>
        </div>
      )}

      {/* Connected but Not Authenticated */}
      {isConnected && !isAuthenticated && !isAuthLoading && (
        <div className="talents-empty">
          <p>Sign in to access talents</p>
          <button onClick={login} className="sign-btn">Sign In</button>
        </div>
      )}

      {/* Loading Auth */}
      {isConnected && isAuthLoading && (
        <div className="talents-empty">
          <div className="loading-orb small">
            <div className="orb-ring" />
            <div className="orb-core" />
          </div>
        </div>
      )}

      {/* Main Content */}
      {isAuthenticated && talentTree && (
        <div className="talents-content">
          {/* Combined Tree Container */}
          <div className="talent-trees-container">
            <ParticleCanvas />
            
            <div className="talent-trees">
              <TreeColumn
                treeType="faucet"
                talents={talentTree.faucetTree}
                availablePoints={talentTree.availablePoints}
                isAllocating={isAllocating}
                onAllocate={handleAllocate}
                onSelectTalent={handleSelectTalent}
              />
              
              <div className="trees-divider" />
              
              <TreeColumn
                treeType="leverage"
                talents={talentTree.leverageTree}
                availablePoints={talentTree.availablePoints}
                isAllocating={isAllocating}
                onAllocate={handleAllocate}
                onSelectTalent={handleSelectTalent}
              />
            </div>
          </div>

          {/* Mobile Talent Sheet */}
          <TalentSheet
            talent={selectedTalent}
            treeType={selectedTreeType}
            canAllocate={
              selectedTalent !== null &&
              talentTree.availablePoints > 0 &&
              selectedTalent.isUnlocked &&
              selectedTalent.currentPoints < selectedTalent.maxPoints
            }
            isAllocating={isAllocating}
            onAllocate={() => selectedTalent && handleAllocate(selectedTalent.id)}
            onClose={handleCloseSheet}
          />
        </div>
      )}
    </div>
  );
}
