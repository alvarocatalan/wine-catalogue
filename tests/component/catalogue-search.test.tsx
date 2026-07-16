// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { render, fireEvent, cleanup } from '@testing-library/preact';
import CatalogueSearch from '../../src/components/CatalogueSearch';
import type { WineIndexEntry } from '../../src/lib/search';

const entries: WineIndexEntry[] = [
  { slug: 'unico', nombre: 'Único', bodega: 'Vega Sicilia', denominacionOrigen: 'Ribera del Duero DO', anada: '2018' },
  { slug: 'reserva', nombre: 'Reserva', bodega: 'Marqués de Riscal', denominacionOrigen: 'Rioja DOCa', anada: '2019' },
];

function setupDom() {
  document.body.innerHTML = `
    <div id="root"></div>
    <ul class="grid">
      <li class="card" data-slug="unico"><span class="card__match" hidden></span></li>
      <li class="card" data-slug="reserva"><span class="card__match" hidden></span></li>
    </ul>
    <div id="no-results" hidden>Sin resultados</div>`;
  return document.getElementById('root') as HTMLElement;
}

const card = (slug: string) => document.querySelector(`.card[data-slug="${slug}"]`) as HTMLElement;

beforeEach(() => cleanup());

describe('CatalogueSearch island (FR-006 / FR-009 / a11y)', () => {
  it('typing filters visible cards and shows which field matched', () => {
    const root = setupDom();
    render(<CatalogueSearch entries={entries} />, { container: root });
    const input = document.querySelector('input[type="search"]') as HTMLInputElement;
    fireEvent.input(input, { target: { value: 'riscal' } });
    expect(card('reserva').hidden).toBe(false);
    expect(card('unico').hidden).toBe(true);
    const badge = card('reserva').querySelector('.card__match') as HTMLElement;
    expect(badge.hidden).toBe(false);
    expect(badge.textContent?.toLowerCase()).toContain('bodega');
  });

  it('shows the no-results element when nothing matches', () => {
    const root = setupDom();
    render(<CatalogueSearch entries={entries} />, { container: root });
    fireEvent.input(document.querySelector('input[type="search"]') as HTMLInputElement, {
      target: { value: 'zzzz' },
    });
    expect((document.getElementById('no-results') as HTMLElement).hidden).toBe(false);
  });

  it('Clear resets the query and restores all cards', () => {
    const root = setupDom();
    render(<CatalogueSearch entries={entries} />, { container: root });
    fireEvent.input(document.querySelector('input[type="search"]') as HTMLInputElement, {
      target: { value: 'riscal' },
    });
    fireEvent.click(document.querySelector('button.clear') as HTMLButtonElement);
    expect(card('unico').hidden).toBe(false);
    expect(card('reserva').hidden).toBe(false);
  });

  it('exposes an aria-live status region', () => {
    const root = setupDom();
    render(<CatalogueSearch entries={entries} />, { container: root });
    expect(document.querySelector('[aria-live="polite"]')).not.toBeNull();
  });
});
