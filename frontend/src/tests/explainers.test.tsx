import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { ArchitectureExplainer } from '../features/explainers/ArchitectureExplainer';
import { ProbesExplainer } from '../features/explainers/ProbesExplainer';
import { CalibrationExplainer } from '../features/explainers/CalibrationExplainer';
import { SpecExplainer } from '../features/explainers/SpecExplainer';

describe('Explanation Pages Smoke Tests', () => {
  it('renders ArchitectureExplainer with dual verdicts matrix and math formulas', () => {
    const html = ReactDOMServer.renderToString(
      <ArchitectureExplainer onNavigateToCockpit={() => {}} />
    );
    expect(html).toContain('Decoupled Retriever vs. Generator Evaluation');
    expect(html).toContain('The 4 Dual Verdicts Matrix');
    expect(html).toContain('PASS');
    expect(html).toContain('RETRIEVAL_MISS');
    expect(html).toContain('HALLUCINATION');
    expect(html).toContain('BOTH_FAILED');
    expect(html).toContain('Context Relevance Score');
    expect(html).toContain('Generator Faithfulness');
  });

  it('renders ProbesExplainer with all 4 stress probes', () => {
    const html = ReactDOMServer.renderToString(
      <ProbesExplainer onNavigateToCockpit={() => {}} />
    );
    expect(html).toContain('The 4 Counterfactual Stress Probes');
    expect(html).toContain('PROBE1');
    expect(html).toContain('PROBE2');
    expect(html).toContain('PROBE3');
    expect(html).toContain('PROBE4');
    expect(html).toContain('Triangulate Failure Modes');
  });

  it('renders CalibrationExplainer with mutations and Cohen Kappa thresholds', () => {
    const html = ReactDOMServer.renderToString(
      <CalibrationExplainer onNavigateToCockpit={() => {}} />
    );
    expect(html).toContain('Judge Calibration &amp; Synthetic Fault Injections');
    expect(html).toContain('Synthetic Fault Injection Matrix');
    expect(html).toContain('Entity Swap Mutation');
    expect(html).toContain('Cohen&#x27;s Kappa');
    expect(html).toContain('Production Certified');
  });

  it('renders SpecExplainer with technical deliverables checklist', () => {
    const html = ReactDOMServer.renderToString(
      <SpecExplainer onNavigateToCockpit={() => {}} onLoadProblemStatement={() => {}} />
    );
    expect(html).toContain('AI-04: Autonomous RAG Evaluation &amp; Diagnostic Cockpit');
    expect(html).toContain('Track AI-04 Technical Contract Checklist');
    expect(html).toContain('problem_statement.pdf');
    expect(html).toContain('3-Tier LLM Resilience');
  });
});
