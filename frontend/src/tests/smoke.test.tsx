import { describe, it, expect } from 'vitest';
import ReactDOMServer from 'react-dom/server';
import { App } from '../app';

describe('Cockpit App Shell Smoke Test', () => {
  it('renders the 3-column cockpit layout without throwing errors', () => {
    const html = ReactDOMServer.renderToString(<App />);
    expect(html).toContain('RAG Evaluation Cockpit');
    expect(html).toContain('AI-04');
    expect(html).toContain('Control Column');
    expect(html).toContain('Evidence Column');
    expect(html).toContain('Diagnosis Column');
  });
});
