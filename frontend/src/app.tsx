import React, { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Microscope, FlaskConical, FileText, GitFork,
  BarChart2, BookOpen, Workflow, Sun, Moon,
  Terminal, Play, ChevronRight, ChevronLeft, Activity,
  PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen,
  GripVertical,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { CorpusUpload } from './features/corpus/CorpusStub';
import { RunConfigStub } from './features/run/RunConfigStub';
import { CaseListStub } from './features/cases/CaseListStub';
import { EvidenceStub } from './features/evidence/EvidenceStub';
import { ScoresStub } from './features/scores/ScoresStub';
import { DiagnosisStub } from './features/diagnosis/DiagnosisStub';
import { ValidationView } from './features/validation/ValidationView';
import { AdHocQueryModal } from './features/query/AdHocQueryModal';
import { ArchitectureExplainer } from './features/explainers/ArchitectureExplainer';
import { ProbesExplainer } from './features/explainers/ProbesExplainer';

import { SpecExplainer } from './features/explainers/SpecExplainer';
import { DualVerdictBadge } from './components/DualVerdictBadge';
import { useCaseDetail } from './api/useRuns';
import { cn } from './lib/utils';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, refetchOnWindowFocus: false } },
});

export type MainView =
  | 'cockpit'
  | 'diagnosis'
  | 'calibration'
  | 'mindmap'
  | 'architecture'
  | 'probes'
  | 'spec';

/* ─── Nav Item ─────────────────────────────────────────────────────── */
interface NavItemProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

const NavItem: React.FC<NavItemProps> = ({ id, icon, label, active, onClick, badge }) => (
  <button
    id={`nav-${id}`}
    onClick={onClick}
    title={label}
    style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 4,
      width: '100%',
      padding: '10px 4px',
      borderRadius: 10,
      border: 'none',
      cursor: 'pointer',
      background: active ? 'var(--accent-soft)' : 'transparent',
      color: active ? 'var(--accent)' : 'var(--text-3)',
      transition: 'all 0.15s',
    }}
    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--bg-muted)'; }}
    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
  >
    {active && (
      <span style={{
        position: 'absolute',
        left: 0,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 3,
        height: 20,
        background: 'var(--accent)',
        borderRadius: '0 3px 3px 0',
      }} />
    )}
    <span style={{ width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {icon}
    </span>
    <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', lineHeight: 1 }}>
      {label}
    </span>
    {badge && (
      <span style={{
        position: 'absolute',
        top: 6,
        right: 6,
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: badge,
      }} />
    )}
  </button>
);

/* ─── App Content ──────────────────────────────────────────────────── */
export const AppContent: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [mainView, setMainView] = useState<MainView>('cockpit');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('ps-01');
  const [runId, setRunId] = useState<string>('run-problem-statement-001');
  const [corpusId, setCorpusId] = useState<string>('corp_problem_statements');
  const [isQueryModalOpen, setIsQueryModalOpen] = useState(false);

  // Panel sizing & collapse state (Resizable & Expandable on/off)
  const [leftWidth, setLeftWidth] = useState<number>(310);
  const [rightWidth, setRightWidth] = useState<number>(290);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isResizingLeft, setIsResizingLeft] = useState<boolean>(false);
  const [isResizingRight, setIsResizingRight] = useState<boolean>(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isResizingLeft) {
        // Rail is 68px
        const newWidth = Math.max(220, Math.min(550, e.clientX - 68));
        setLeftWidth(newWidth);
      }
      if (isResizingRight) {
        const newWidth = Math.max(220, Math.min(500, window.innerWidth - e.clientX));
        setRightWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizingLeft, isResizingRight]);

  const handleRunCompleted = (newRunId: string) => {
    queryClient.invalidateQueries();
    setRunId(newRunId);
    setMainView('cockpit');
  };

  const handleNavigateToCockpit = (caseId?: string) => {
    if (caseId) setSelectedCaseId(caseId);
    setMainView('cockpit');
  };

  const handleLoadDemo = () => {
    setRunId('run-demo-eval-001');
    setCorpusId('corpus-demo-001');
    setSelectedCaseId('case-01');
    setMainView('cockpit');
  };

  const handleLoadProblemStatement = () => {
    setRunId('run-problem-statement-001');
    setCorpusId('corp_problem_statements');
    setSelectedCaseId('ps-01');
  };

  // Nav groups
  const primaryNav: { id: MainView; icon: React.ReactNode; label: string }[] = [
    { id: 'cockpit',   icon: <Microscope style={{ width: 16, height: 16 }} />,  label: 'Cockpit'   },
    { id: 'diagnosis', icon: <Activity style={{ width: 16, height: 16 }} />,    label: 'Diagnose'  },
    { id: 'calibration', icon: <FlaskConical style={{ width: 16, height: 16 }} />, label: 'Calib'  },
    { id: 'mindmap',   icon: <Workflow style={{ width: 16, height: 16 }} />,    label: 'Map'       },
  ];

  const secondaryNav: { id: MainView; icon: React.ReactNode; label: string }[] = [
    { id: 'architecture', icon: <GitFork style={{ width: 16, height: 16 }} />,   label: 'Arch'  },
    { id: 'probes',       icon: <BarChart2 style={{ width: 16, height: 16 }} />, label: 'Probes'},
    { id: 'spec',         icon: <BookOpen style={{ width: 16, height: 16 }} />,  label: 'Spec'  },
  ];

  const viewLabel = [...primaryNav, ...secondaryNav].find(n => n.id === mainView)?.label ?? '';

  return (
    <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', display: 'flex', background: 'var(--bg)', color: 'var(--text)' }}>

      {/* ── Left Icon Rail ─────────────────────────────────────────── */}
      <aside style={{
        width: 68,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 6px',
        gap: 2,
        zIndex: 20,
      }}>
        {/* Logo mark */}
        <div style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-ring)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
          flexShrink: 0,
        }}>
          <Microscope style={{ width: 18, height: 18, color: 'var(--accent)' }} />
        </div>

        {/* Primary nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
          {primaryNav.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              active={mainView === item.id}
              onClick={() => setMainView(item.id)}
            />
          ))}
        </nav>

        {/* Divider */}
        <div style={{ width: 32, height: 1, background: 'var(--border)', margin: '10px auto' }} />

        {/* Secondary nav */}
        <nav style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 2 }}>
          {secondaryNav.map((item) => (
            <NavItem
              key={item.id}
              {...item}
              active={mainView === item.id}
              onClick={() => setMainView(item.id)}
            />
          ))}
        </nav>

        {/* Bottom controls */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          {/* Live dot */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }} title="Gemini 2.0 Live">
            <span style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
              animation: 'pulse 2s infinite',
              display: 'block',
            }} />
            <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-3)' }}>live</span>
          </div>

          {/* Theme toggle */}
          <button
            id="btn-toggle-theme"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              border: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {theme === 'dark'
              ? <Sun style={{ width: 15, height: 15, color: '#fbbf24' }} />
              : <Moon style={{ width: 15, height: 15, color: '#6366f1' }} />
            }
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Top bar */}
        <header style={{
          height: 52,
          flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-subtle)',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              RAG Cockpit
            </span>
            <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-3)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
              {viewLabel}
            </span>
          </div>

          {/* Actions & Panel Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Left panel quick toggle */}
            <button
              id="btn-toggle-left-panel"
              onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
              title={isLeftCollapsed ? 'Expand Left Sidebar (Corpus & Queries)' : 'Collapse Left Sidebar'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 9px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                border: `1px solid ${!isLeftCollapsed ? 'var(--accent-ring)' : 'var(--border)'}`,
                background: !isLeftCollapsed ? 'var(--accent-soft)' : 'var(--bg-surface)',
                color: !isLeftCollapsed ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {isLeftCollapsed ? <PanelLeftOpen style={{ width: 13, height: 13 }} /> : <PanelLeftClose style={{ width: 13, height: 13 }} />}
              <span style={{ fontSize: 11, display: 'none', lg: 'inline' }}>Sidebar</span>
            </button>

            {[
              {
                id: 'btn-load-problem-statement',
                icon: <FileText style={{ width: 13, height: 13 }} />,
                label: 'Problem Statement',
                active: runId === 'run-problem-statement-001',
                onClick: () => { handleLoadProblemStatement(); setMainView('cockpit'); },
              },
              {
                id: 'btn-open-sandbox',
                icon: <Terminal style={{ width: 13, height: 13 }} />,
                label: 'Sandbox',
                active: false,
                onClick: () => setIsQueryModalOpen(true),
              },
              {
                id: 'btn-load-demo',
                icon: <Play style={{ width: 13, height: 13 }} />,
                label: 'Demo',
                active: runId === 'run-demo-eval-001',
                onClick: handleLoadDemo,
              },
            ].map((btn) => (
              <button
                key={btn.id}
                id={btn.id}
                onClick={btn.onClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 500,
                  border: `1px solid ${btn.active ? 'var(--accent-ring)' : 'var(--border)'}`,
                  background: btn.active ? 'var(--accent-soft)' : 'var(--bg-surface)',
                  color: btn.active ? 'var(--accent)' : 'var(--text-2)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {btn.icon}
                {btn.label}
              </button>
            ))}

            {/* Right panel quick toggle */}
            <button
              id="btn-toggle-right-panel"
              onClick={() => setIsRightCollapsed(!isRightCollapsed)}
              title={isRightCollapsed ? 'Expand Right Sidebar (Scorecards & Diagnostics)' : 'Collapse Right Sidebar'}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 9px', borderRadius: 7, fontSize: 11, fontWeight: 500,
                border: `1px solid ${!isRightCollapsed ? 'var(--accent-ring)' : 'var(--border)'}`,
                background: !isRightCollapsed ? 'var(--accent-soft)' : 'var(--bg-surface)',
                color: !isRightCollapsed ? 'var(--accent)' : 'var(--text-3)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {isRightCollapsed ? <PanelRightOpen style={{ width: 13, height: 13 }} /> : <PanelRightClose style={{ width: 13, height: 13 }} />}
              <span style={{ fontSize: 11, display: 'none', lg: 'inline' }}>Scores</span>
            </button>
          </div>
        </header>

        {/* ── COCKPIT VIEW ─────────────────────────────────────────── */}
        {mainView === 'cockpit' && (
          <main style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

            {/* Left panel — Corpus + Config + Cases (Collapsible & Resizable) */}
            {!isLeftCollapsed ? (
              <section style={{
                width: leftWidth,
                flexShrink: 0,
                borderRight: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'var(--bg-subtle)',
                transition: isResizingLeft ? 'none' : 'width 0.15s',
              }}>
                <CorpusUpload
                  onCorpusLoaded={(id) => setCorpusId(id)}
                  corpusId={corpusId}
                />
                <RunConfigStub
                  corpusId={corpusId}
                  onRunStarted={(id) => setRunId(id)}
                  onRunCompleted={handleRunCompleted}
                />
                <CaseListStub
                  runId={runId}
                  selectedCaseId={selectedCaseId}
                  onSelectCase={(id) => {
                    setSelectedCaseId(id);
                  }}
                />
              </section>
            ) : (
              /* Left collapsed thin strip */
              <div
                onClick={() => setIsLeftCollapsed(false)}
                title="Expand Corpus & Queries Sidebar"
                style={{
                  width: 28,
                  flexShrink: 0,
                  borderRight: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 12,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <ChevronRight style={{ width: 14, height: 14, color: 'var(--accent)', marginBottom: 8 }} />
                <span style={{
                  writingMode: 'vertical-rl',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}>
                  Corpus &amp; Queries
                </span>
              </div>
            )}

            {/* Left Resizer Drag Handle */}
            {!isLeftCollapsed && (
              <div
                onMouseDown={() => setIsResizingLeft(true)}
                title="Drag to resize sidebar"
                style={{
                  width: 5,
                  cursor: 'col-resize',
                  position: 'relative',
                  flexShrink: 0,
                  zIndex: 10,
                  background: isResizingLeft ? 'var(--accent)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-ring)'; }}
                onMouseLeave={(e) => { if (!isResizingLeft) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Floating collapse chevron pill */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsLeftCollapsed(true); }}
                  title="Collapse Sidebar"
                  style={{
                    position: 'absolute',
                    top: 14,
                    left: -9,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    zIndex: 20,
                  }}
                >
                  <ChevronLeft style={{ width: 10, height: 10 }} />
                </button>
              </div>
            )}

            {/* Center — Evidence (Spacious, fluid remaining width) */}
            <section style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              background: 'var(--bg)',
              minWidth: 0,
            }}>
              <EvidenceStub caseId={selectedCaseId} />
            </section>

            {/* Right Resizer Drag Handle */}
            {!isRightCollapsed && (
              <div
                onMouseDown={() => setIsResizingRight(true)}
                title="Drag to resize scores panel"
                style={{
                  width: 5,
                  cursor: 'col-resize',
                  position: 'relative',
                  flexShrink: 0,
                  zIndex: 10,
                  background: isResizingRight ? 'var(--accent)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--accent-ring)'; }}
                onMouseLeave={(e) => { if (!isResizingRight) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Floating collapse chevron pill */}
                <button
                  onClick={(e) => { e.stopPropagation(); setIsRightCollapsed(true); }}
                  title="Collapse Scores Panel"
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: -9,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: 'var(--text-3)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    zIndex: 20,
                  }}
                >
                  <ChevronRight style={{ width: 10, height: 10 }} />
                </button>
              </div>
            )}

            {/* Right — Scores & Diagnostics (Collapsible & Resizable) */}
            {!isRightCollapsed ? (
              <section style={{
                width: rightWidth,
                flexShrink: 0,
                borderLeft: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                background: 'var(--bg-subtle)',
                transition: isResizingRight ? 'none' : 'width 0.15s',
              }}>
                <ScoresStub runId={runId} />

                {/* Quick-jump cards to detail pages */}
                <div style={{ padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 2 }}>
                    Deep Dive
                  </div>

                  {/* Diagnosis card */}
                  <button
                    onClick={() => setMainView('diagnosis')}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--accent-ring)';
                      e.currentTarget.style.background = 'var(--accent-soft)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: 'rgba(16,185,129,0.1)',
                      border: '1px solid rgba(16,185,129,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <Activity style={{ width: 17, height: 17, color: 'var(--accent)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Diagnosis</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Root cause &amp; fix for case</div>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-3)', marginLeft: 'auto' }} />
                  </button>

                  {/* Calibration card */}
                  <button
                    onClick={() => setMainView('calibration')}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 10,
                      border: '1px solid var(--border)',
                      background: 'var(--bg-surface)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(245,158,11,0.4)';
                      e.currentTarget.style.background = 'rgba(245,158,11,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.background = 'var(--bg-surface)';
                    }}
                  >
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <FlaskConical style={{ width: 17, height: 17, color: '#f59e0b' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Calibration</div>
                      <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Judge accuracy &amp; kappa</div>
                    </div>
                    <ChevronRight style={{ width: 14, height: 14, color: 'var(--text-3)', marginLeft: 'auto' }} />
                  </button>

                  {/* Current case quick info */}
                  <CaseQuickInfo caseId={selectedCaseId} onOpenDiagnosis={() => setMainView('diagnosis')} />
                </div>
              </section>
            ) : (
              /* Right collapsed thin strip */
              <div
                onClick={() => setIsRightCollapsed(false)}
                title="Expand Scores & Diagnostics Sidebar"
                style={{
                  width: 28,
                  flexShrink: 0,
                  borderLeft: '1px solid var(--border)',
                  background: 'var(--bg-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  paddingTop: 12,
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                <ChevronLeft style={{ width: 14, height: 14, color: 'var(--accent)', marginBottom: 8 }} />
                <span style={{
                  writingMode: 'vertical-rl',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--text-3)',
                }}>
                  Scores &amp; Detail
                </span>
              </div>
            )}
          </main>
        )}

        {/* ── DIAGNOSIS PAGE ───────────────────────────────────────── */}
        {mainView === 'diagnosis' && (
          <DiagnosisPage
            caseId={selectedCaseId}
            runId={runId}
            onBack={() => setMainView('cockpit')}
          />
        )}

        {/* ── CALIBRATION PAGE ─────────────────────────────────────── */}
        {mainView === 'calibration' && (
          <CalibrationPage runId={runId} onBack={() => setMainView('cockpit')} />
        )}

        {/* ── MIND MAP ─────────────────────────────────────────────── */}
        {mainView === 'mindmap' && (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <iframe
              src={`/mindmap.html?theme=${theme}`}
              title="RAG Doctor Mind Map"
              style={{ width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}

        {/* ── OTHER EXPLAINER PAGES ────────────────────────────────── */}
        {mainView === 'architecture' && (
          <ArchitectureExplainer onNavigateToCockpit={handleNavigateToCockpit} />
        )}
        {mainView === 'probes' && (
          <ProbesExplainer onNavigateToCockpit={handleNavigateToCockpit} />
        )}
        {mainView === 'spec' && (
          <SpecExplainer
            onNavigateToCockpit={handleNavigateToCockpit}
            onLoadProblemStatement={handleLoadProblemStatement}
          />
        )}
      </div>

      {/* ── Query Sandbox Modal ───────────────────────────────────── */}
      {isQueryModalOpen && (
        <AdHocQueryModal
          corpusId={corpusId}
          onClose={() => setIsQueryModalOpen(false)}
        />
      )}
    </div>
  );
};

/* ─── Case Quick Info Widget ───────────────────────────────────────── */
const CaseQuickInfo: React.FC<{ caseId: string | null; onOpenDiagnosis: () => void }> = ({ caseId, onOpenDiagnosis }) => {
  const { data: currentCase } = useCaseDetail(caseId);
  if (!currentCase) return null;

  return (
    <div
      style={{
        marginTop: 4,
        padding: '12px 14px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-surface)',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--text-3)', marginBottom: 8 }}>
        Active Case
      </div>
      <div style={{ marginBottom: 6 }}>
        <DualVerdictBadge verdict={currentCase.verdict} size="sm" compact />
      </div>
      <p style={{ fontSize: 11, color: 'var(--text)', margin: '0 0 10px', lineHeight: 1.5, display: '-webkit-box', overflow: 'hidden', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
        {currentCase.question}
      </p>
      <button
        onClick={onOpenDiagnosis}
        style={{
          width: '100%',
          padding: '6px',
          borderRadius: 6,
          border: '1px solid var(--accent-ring)',
          background: 'var(--accent-soft)',
          color: 'var(--accent)',
          fontSize: 11,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        View Diagnosis →
      </button>
    </div>
  );
};

/* ─── Diagnosis Full Page ──────────────────────────────────────────── */
const DiagnosisPage: React.FC<{ caseId: string | null; runId: string; onBack: () => void }> = ({
  caseId, runId, onBack,
}) => (
  <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0 }}>

    {/* Left: evidence reference (scrollable) */}
    <div style={{
      flex: 1,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      borderRight: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <EvidenceStub caseId={caseId} />
    </div>

    {/* Right: full diagnosis panel */}
    <div style={{
      width: 420,
      flexShrink: 0,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-subtle)',
    }}>
      {/* Panel header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>Diagnosis</div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>Root cause &amp; prescriptive fix</div>
        </div>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 6,
            border: '1px solid var(--border)', background: 'var(--bg-surface)',
            fontSize: 11, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
          }}
        >
          ← Back
        </button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 4 }}>
        <DiagnosisStub caseId={caseId} runId={runId} />
      </div>
    </div>
  </div>
);

/* ─── Calibration Full Page ────────────────────────────────────────── */
const CalibrationPage: React.FC<{ runId: string; onBack: () => void }> = ({ runId, onBack }) => (
  <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
    {/* Page header */}
    <div style={{
      padding: '24px 32px 20px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.025em', marginBottom: 4 }}>
          Judge Calibration
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
          Cohen's κ · Confusion matrix · Synthetic fault injection library
        </div>
      </div>
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 14px', borderRadius: 8,
          border: '1px solid var(--border)', background: 'var(--bg-surface)',
          fontSize: 12, fontWeight: 500, color: 'var(--text-2)', cursor: 'pointer',
        }}
      >
        ← Back to Cockpit
      </button>
    </div>

    {/* Content — centered, spacious */}
    <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 32px' }}>
        <ValidationView runId={runId} />
      </div>
    </div>
  </div>
);



export const App: React.FC = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  </ThemeProvider>
);
