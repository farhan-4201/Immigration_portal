const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// The closing div needs to be added before the toast notification
code = code.replace(
    /        \)\}\s*\{\/\* Toast Notification System \*\/\}/g,
    '        )}\n      </div>\n\n      {/* Toast Notification System */}'
);

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed missing closing div!');
