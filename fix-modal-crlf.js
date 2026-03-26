const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

code = code.replace(
    /return \(\s*<div className=\"space-y-10 animate-cardAppear relative bg-background transition-colors duration-300\">/,
    'return (\n    <>\n      <div className=\"space-y-10 animate-cardAppear relative bg-background transition-colors duration-300\">'
);

code = code.replace(
    /        \)\}\s*\{\/\* Toast Notification System \*\/\}/,
    '        )}\n      </div>\n\n      {/* Toast Notification System */}'
);

code = code.replace(
    /      \)\}\s*<\/div>\s*\);\s*\}\s*export default function DashboardPage\(\) \{/,
    '      )}\n    </>\n  );\n}\n\nexport default function DashboardPage() {'
);

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed container mapping for Windows!');
