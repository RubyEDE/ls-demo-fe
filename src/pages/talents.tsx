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

// Mystical flowing lines background effect
function ElectricLinesCanvas() {
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

    interface FlowingLine {
      points: { x: number; y: number }[];
      drawProgress: number; // 0 to 1, how much of the line is drawn
      fadeProgress: number; // 0 to 1, for fading out
      color: string;
      width: number;
      speed: number;
      totalLength: number;
    }

    const lines: FlowingLine[] = [];
    const colors = ["rgba(0, 212, 170, ", "rgba(245, 166, 35, "];

    const createLine = (): FlowingLine => {
      // Start from edges
      const edge = Math.floor(Math.random() * 4);
      let startX: number, startY: number, direction: number;
      
      switch (edge) {
        case 0: // top
          startX = Math.random() * canvas.offsetWidth;
          startY = -10;
          direction = Math.PI / 2 + (Math.random() - 0.5) * 0.6;
          break;
        case 1: // right
          startX = canvas.offsetWidth + 10;
          startY = Math.random() * canvas.offsetHeight;
          direction = Math.PI + (Math.random() - 0.5) * 0.6;
          break;
        case 2: // bottom
          startX = Math.random() * canvas.offsetWidth;
          startY = canvas.offsetHeight + 10;
          direction = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
          break;
        default: // left
          startX = -10;
          startY = Math.random() * canvas.offsetHeight;
          direction = (Math.random() - 0.5) * 0.6;
          break;
      }
      
      const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
      
      // Generate smooth flowing path using curves
      const segments = 12 + Math.floor(Math.random() * 10);
      let x = startX;
      let y = startY;
      let currentDirection = direction;
      
      for (let i = 0; i < segments; i++) {
        // Gradual direction change for smoother curves
        currentDirection += (Math.random() - 0.5) * 0.4;
        const length = 25 + Math.random() * 35;
        x += Math.cos(currentDirection) * length;
        y += Math.sin(currentDirection) * length;
        points.push({ x, y });
      }

      // Calculate total path length for progress tracking
      let totalLength = 0;
      for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }

      return {
        points,
        drawProgress: 0,
        fadeProgress: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        width: 0.8 + Math.random() * 0.6,
        speed: 0.008 + Math.random() * 0.006,
        totalLength,
      };
    };

    let animationId: number;
    let frameCount = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
      frameCount++;

      // Spawn new lines
      if (frameCount % 25 === 0 && lines.length < 6) {
        lines.push(createLine());
      }

      for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        
        // Progress the drawing
        if (line.drawProgress < 1) {
          line.drawProgress += line.speed;
        } else {
          // Start fading once fully drawn
          line.fadeProgress += 0.008;
        }

        if (line.fadeProgress >= 1) {
          lines.splice(i, 1);
          continue;
        }

        // Calculate opacity based on fade progress
        const baseOpacity = 0.15;
        const opacity = baseOpacity * (1 - line.fadeProgress);

        // Draw the line progressively with smooth curves
        const targetLength = line.drawProgress * line.totalLength;
        let drawnLength = 0;
        
        ctx.beginPath();
        ctx.strokeStyle = line.color + opacity + ")";
        ctx.lineWidth = line.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(line.points[0].x, line.points[0].y);
        
        for (let j = 1; j < line.points.length; j++) {
          const prev = line.points[j - 1];
          const curr = line.points[j];
          const segmentLength = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
          );
          
          if (drawnLength + segmentLength <= targetLength) {
            // Draw full segment with quadratic curve for smoothness
            if (j < line.points.length - 1) {
              const next = line.points[j + 1];
              const midX = (curr.x + next.x) / 2;
              const midY = (curr.y + next.y) / 2;
              ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
            } else {
              ctx.lineTo(curr.x, curr.y);
            }
            drawnLength += segmentLength;
          } else {
            // Draw partial segment
            const remaining = targetLength - drawnLength;
            const ratio = remaining / segmentLength;
            const partialX = prev.x + (curr.x - prev.x) * ratio;
            const partialY = prev.y + (curr.y - prev.y) * ratio;
            ctx.lineTo(partialX, partialY);
            break;
          }
        }
        
        ctx.stroke();

        // Draw soft glow
        ctx.strokeStyle = line.color + (opacity * 0.25) + ")";
        ctx.lineWidth = line.width * 4;
        ctx.stroke();
        
        // Draw brighter head/tip
        if (line.drawProgress < 1) {
          const headProgress = Math.min(line.drawProgress * line.totalLength, line.totalLength);
          let accum = 0;
          for (let j = 1; j < line.points.length; j++) {
            const prev = line.points[j - 1];
            const curr = line.points[j];
            const segLen = Math.sqrt(Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2));
            if (accum + segLen >= headProgress) {
              const ratio = (headProgress - accum) / segLen;
              const headX = prev.x + (curr.x - prev.x) * ratio;
              const headY = prev.y + (curr.y - prev.y) * ratio;
              
              // Glowing head
              const gradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, 8);
              gradient.addColorStop(0, line.color + "0.4)");
              gradient.addColorStop(1, line.color + "0)");
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(headX, headY, 8, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            accum += segLen;
          }
        }
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  return <canvas ref={canvasRef} className="electric-lines-canvas" />;
}

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

  // Format numbers for XP display
  const formatXP = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "k";
    }
    return num.toString();
  };

  return (
    <div className="talents-page">
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
          {/* Background decorations */}
          <div className="talents-bg-decor">
            <div className="bg-orb bg-orb-1" />
            <div className="bg-orb bg-orb-2" />
            <div className="bg-grid" />
            <ElectricLinesCanvas />
          </div>

          {/* Title Section */}
          <div className="talents-title-section">
            <h1 className="talents-title">Talent Tree</h1>
            {talentTree.availablePoints > 0 && (
              <div className="available-points-badge">
                <span className="points-number">{talentTree.availablePoints}</span>
                <span className="points-label">points available</span>
              </div>
            )}
          </div>

          {/* Combined Tree Container */}
          <div className="talent-trees-container">
            <ParticleCanvas />
            
            {/* Corner decorations */}
            <div className="corner-decor corner-tl" />
            <div className="corner-decor corner-tr" />
            <div className="corner-decor corner-bl" />
            <div className="corner-decor corner-br" />
            
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

          {/* Experience Bar */}
          {levelInfo && (
            <div className="talents-xp-section">
              <div className="xp-level-badge">
                <span className="level-number">{levelInfo.level}</span>
              </div>
              <div className="xp-bar-wrapper">
                <div className="xp-bar">
                  <div 
                    className="xp-bar-fill" 
                    style={{ width: `${levelInfo.progressPercentage}%` }}
                  />
                </div>
                <div className="xp-labels">
                  <span className="xp-current">{formatXP(levelInfo.experience)} XP</span>
                  <span className="xp-next">Level {levelInfo.level + 1}: {formatXP(levelInfo.experienceForNextLevel)} XP</span>
                </div>
              </div>
            </div>
          )}

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
