import type { Directive } from 'vue';

/**
 * Directive to normalize decimal separator input
 * Allows both . and , to be used as decimal separators
 * 
 * Usage: v-normalize-decimal
 */
export const normalizeDecimal: Directive = {
  mounted(el: HTMLElement) {
    const input = el.querySelector('input');
    if (!input) return;

    // Handle paste events
    input.addEventListener('paste', (e: ClipboardEvent) => {
      e.preventDefault();
      const pastedText = e.clipboardData?.getData('text') || '';
      
      // Normalize: replace comma with period, remove spaces
      const normalized = pastedText
        .replace(/\s/g, '')
        .replace(',', '.');
      
      // Insert the normalized text
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentValue = input.value;
      const newValue = currentValue.substring(0, start) + normalized + currentValue.substring(end);
      
      input.value = newValue;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });

    // Handle keypress for comma -> period conversion
    input.addEventListener('keypress', (e: KeyboardEvent) => {
      // If user types comma, convert to period
      if (e.key === ',') {
        e.preventDefault();
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const currentValue = input.value;
        const newValue = currentValue.substring(0, start) + '.' + currentValue.substring(end);
        
        input.value = newValue;
        input.setSelectionRange(start + 1, start + 1);
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }
};
