export interface FontChoice {
  label: string
  /** Full font-family CSS value, including fallback stack. */
  value: string
}

/**
 * A deliberately short, curated list rather than free text (idea.md §15: "do not
 * turn typography configuration into a design system"). Lora, Source Serif 4,
 * Inter, and Public Sans are bundled locally (see styles/fonts.css) so they
 * render identically everywhere and work fully offline; the other two entries
 * are system fonts that need no bundling at all.
 */
export const FONT_CHOICES: FontChoice[] = [
  { label: 'System Default', value: '-apple-system, "Segoe UI", system-ui, sans-serif' },
  { label: 'Georgia (serif)', value: 'Georgia, "Iowan Old Style", serif' },
  { label: 'Lora (serif)', value: '"Lora", Georgia, serif' },
  { label: 'Source Serif 4 (serif)', value: '"Source Serif 4", Georgia, serif' },
  { label: 'Inter (sans)', value: '"Inter", -apple-system, "Segoe UI", sans-serif' },
  { label: 'Public Sans (sans)', value: '"Public Sans", -apple-system, "Segoe UI", sans-serif' }
]
