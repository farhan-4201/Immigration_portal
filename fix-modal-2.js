const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// Replace blue theme in the "Post Update to Thread"
code = code.replaceAll('text-blue-500', 'text-primary');
code = code.replaceAll('bg-blue-500/[0.03]', 'bg-gold-dim');
code = code.replaceAll('border-blue-500/10', 'border-border-accent');
code = code.replaceAll('focus:border-blue-500/50', 'focus:border-primary');
code = code.replaceAll('bg-blue-500', 'bg-primary');
code = code.replaceAll('shadow-blue-500/20', 'shadow-primary/20');
code = code.replaceAll('border-blue-500/20', 'border-border-accent');
code = code.replaceAll('bg-blue-500/10', 'bg-gold-dim');
code = code.replaceAll('text-emerald-500', 'text-success');
code = code.replaceAll('bg-emerald-500', 'bg-success');
code = code.replaceAll('border-emerald-500', 'border-success');
code = code.replaceAll('bg-red-500/10', 'bg-error/10');
code = code.replaceAll('border-red-500/20', 'border-error/20');
code = code.replaceAll('text-red-500', 'text-error');

// Remove the oversized blur highlight at the top right of the modal
code = code.replace(/<div className="absolute top-0 right-0 w-64 h-64 bg-primary\/5 blur-\[80px\] rounded-full -translate-y-1\/2 translate-x-1\/2 pointer-events-none" \/>/g, '');

fs.writeFileSync('app/page.tsx', code);
console.log('Follow-up theme sync complete');
