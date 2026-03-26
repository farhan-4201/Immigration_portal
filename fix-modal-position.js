const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// 1. Start fragment
code = code.replace(
    'return (\n    <div className="space-y-10 animate-cardAppear relative bg-background transition-colors duration-300">',
    'return (\n    <>\n      <div className="space-y-10 animate-cardAppear relative bg-background transition-colors duration-300">'
);

// 2. Wrap main container right before the Modals/Toasts start
code = code.replace(
    /        \)\}\n      \{\/\* Toast Notification System \*\/\}/g,
    '        )}\n      </div>\n\n      {/* Toast Notification System */}'
);

// 3. Remove the trailing </div> that we just moved up, and replace with closing scope
// Wait, the original end of component is:
//       )}
//     </div>
//   );
// }
//
// export default function DashboardPage() {
code = code.replace(
    '      )}\n    </div>\n  );\n}\n\nexport default function DashboardPage() {',
    '      )}\n    </>\n  );\n}\n\nexport default function DashboardPage() {'
);

fs.writeFileSync('app/page.tsx', code);
console.log('Fixed container mapping!');
