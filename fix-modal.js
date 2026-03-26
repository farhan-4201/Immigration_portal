const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Modal wrapper
code = code.replace(
  /className="bg-surface-primary border border-border-primary rounded-\[32px\] md:rounded-\[48px\] shadow-\[0_32px_80px_rgba\(0,0,0,0\.8\)\] w-full max-w-3xl max-h-\[95vh\] overflow-auto p-6 md:p-12 animate-cardAppear relative scrollbar-hide"/g,
  `className="bg-card-bg backdrop-blur-2xl border border-border-primary rounded-3xl shadow-gold-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-cardAppear relative scrollbar-hide"`
);

// 2. Headings and Close Button
code = code.replaceAll(
  'w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-secondary border border-border-primary text-text-tertiary hover:bg-surface-hover hover:text-text-primary transition-all',
  'w-10 h-10 flex items-center justify-center rounded-xl bg-surface-secondary border border-border-primary text-text-tertiary hover:bg-gold-dim hover:text-primary transition-all'
);

// 3. Inputs
const inputOld = 'w-full bg-surface-secondary border border-border-primary rounded-2xl py-4.5 px-6 text-text-primary focus:border-primary/50 outline-none transition-all font-bold shadow-inner';
const inputNew = 'w-full bg-surface-primary border border-border-primary rounded-xl py-3 px-4 text-[13px] text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all font-medium shadow-sm hover:border-border-accent/50';
code = code.replaceAll(inputOld, inputNew);

const selectOld = 'w-full bg-surface-secondary border border-border-primary rounded-2xl py-4.5 pl-6 pr-12 text-text-primary focus:border-primary/50 outline-none transition-all font-bold appearance-none';
const selectNew = 'w-full bg-surface-primary border border-border-primary rounded-xl py-3 px-4 text-[13px] text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all font-medium shadow-sm hover:border-border-accent/50 appearance-none';
code = code.replaceAll(selectOld, selectNew);

// Smaller inputs
const smallInputOld = 'w-full bg-surface-secondary border border-border-primary rounded-xl py-3.5 px-5 text-xs font-bold text-text-secondary focus:bg-surface-hover transition-all';
const smallInputNew = 'w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50';
code = code.replaceAll(smallInputOld, smallInputNew);
code = code.replaceAll(
    'w-full bg-surface-secondary border border-border-primary rounded-xl py-3.5 px-5 text-xs font-bold text-text-secondary focus:bg-surface-hover transition-all resize-none',
    'w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50 resize-none'
);

const smallSelectOld = 'w-full bg-surface-secondary border border-border-primary rounded-xl py-3.5 px-5 text-xs font-bold text-text-secondary focus:bg-surface-hover transition-all appearance-none outline-none';
const smallSelectNew = 'w-full bg-surface-primary border border-border-primary rounded-lg py-2.5 px-3.5 text-xs text-text-primary focus:bg-surface-secondary focus:border-border-accent outline-none transition-all shadow-sm hover:border-border-accent/50 appearance-none';
code = code.replaceAll(smallSelectOld, smallSelectNew);

// Labels
const labelOld = 'text-[10px] font-bold uppercase tracking-widest text-text-tertiary ml-1';
const labelNew = 'block text-[9px] font-bold uppercase tracking-[0.15em] text-primary/80 mb-1.5 ml-0.5';
code = code.replaceAll(labelOld, labelNew);

const labelSmallOld = 'text-[9px] font-bold uppercase tracking-widest text-text-tertiary ml-1';
const labelSmallNew = 'block text-[8px] font-bold uppercase tracking-[0.15em] text-text-tertiary mb-1 ml-0.5';
code = code.replaceAll(labelSmallOld, labelSmallNew);

// Action buttons at the bottom
const discardOld = 'flex-1 h-16 bg-primary text-white rounded-[22px] font-semibold text-xs tracking-wide transition-all shadow-lg';
const discardNew = 'flex-1 h-12 bg-surface-secondary border border-border-primary text-text-primary hover:bg-surface-hover rounded-xl font-semibold text-xs tracking-wide transition-all';
code = code.replaceAll(discardOld, discardNew);

const saveDecisionOld = 'flex-[2] h-16 bg-primary text-white hover:opacity-90 rounded-[22px] font-semibold text-xs tracking-wide transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-95';
const saveDecisionNew = 'flex-[2] h-12 bg-primary text-white hover:opacity-90 rounded-xl font-semibold text-xs tracking-wide transition-all shadow-gold flex items-center justify-center gap-2 active:scale-95';
code = code.replaceAll(saveDecisionOld, saveDecisionNew);

fs.writeFileSync('app/page.tsx', code);
console.log('Update mostly applied');
