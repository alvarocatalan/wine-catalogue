/** @jsxImportSource preact */
// Keystatic pulls in @astrojs/react, so the default JSX types resolve to React.
// This island is Preact — pin its JSX types so `class`/Preact events type-check
// (astro check). The @astrojs/preact integration already compiles it as Preact.
import { useSignal, useComputed, useSignalEffect } from '@preact/signals';
import { useEffect } from 'preact/hooks';
import { compose, type WineIndexEntry, type Field } from '../lib/search';

const FIELD_LABEL: Record<Field, string> = {
  nombre: 'nombre',
  bodega: 'bodega',
  denominacionOrigen: 'D.O.',
  anada: 'añada',
  tipo: 'tipo',
};

interface Props {
  // In tests, entries are passed directly. In production the island reads the
  // build-time JSON index embedded in the page (research Decision 7).
  entries?: WineIndexEntry[];
}

export default function CatalogueSearch({ entries }: Props) {
  const data = useSignal<WineIndexEntry[]>(entries ?? []);

  // Production path: hydrate over the embedded #wine-search-index (client-only).
  useEffect(() => {
    if (entries) return;
    const el = document.getElementById('wine-search-index');
    if (el?.textContent) data.value = JSON.parse(el.textContent) as WineIndexEntry[];
  }, []);

  const query = useSignal('');
  const visible = useComputed(() => compose(data.value, query.value));
  const active = useComputed(() => query.value.trim().length > 0);

  const clear = () => {
    query.value = '';
  };

  // Wire the server-rendered "Limpiar búsqueda" control inside #no-results.
  useEffect(() => {
    const btn = document.getElementById('no-results-clear');
    if (!btn) return;
    btn.addEventListener('click', clear);
    return () => btn.removeEventListener('click', clear);
  }, []);

  // Reflect the result onto the server-rendered grid imperatively — cards are NOT
  // re-rendered, so the build-optimised <Image/> stays intact. Client-only.
  useSignalEffect(() => {
    const result = visible.value;
    const hasQuery = query.value.trim().length > 0;
    document.querySelectorAll<HTMLElement>('.card[data-slug]').forEach((cardEl) => {
      const slug = cardEl.dataset.slug ?? '';
      const match = result.get(slug);
      cardEl.hidden = match === undefined;
      const badge = cardEl.querySelector<HTMLElement>('.card__match');
      if (badge) {
        if (match && hasQuery && match.length > 0) {
          badge.textContent = 'coincide en ' + match.map((f) => FIELD_LABEL[f]).join(', ');
          badge.hidden = false;
        } else {
          badge.textContent = '';
          badge.hidden = true;
        }
      }
    });

    // Header count reflects the filtered results (FR-018).
    const count = result.size;
    const countEl = document.getElementById('wine-count');
    if (countEl) countEl.textContent = `${count} ${count === 1 ? 'vino' : 'vinos'}`;

    // No-results state + highlighted search term (FR-017).
    const noRes = document.getElementById('no-results');
    if (noRes) noRes.hidden = count !== 0;
    const term = document.querySelector<HTMLElement>('.no-results__term');
    if (term) term.textContent = query.value.trim() ? `«${query.value.trim()}»` : 'tu búsqueda';
  });

  return (
    <div class="search" role="search">
      <span class="search__icon" aria-hidden="true">
        ⌕
      </span>
      <input
        type="search"
        class="search__input"
        aria-label="Buscar vinos por nombre, bodega, D.O., añada o tipo"
        placeholder="Buscar"
        value={query.value}
        onInput={(e) => (query.value = (e.currentTarget as HTMLInputElement).value)}
      />
      {active.value && (
        <button type="button" class="clear" onClick={clear} aria-label="Limpiar búsqueda">
          Limpiar
        </button>
      )}
      <p class="search__status sr-only" role="status" aria-live="polite">
        {visible.value.size} vino{visible.value.size === 1 ? '' : 's'}
      </p>
    </div>
  );
}
