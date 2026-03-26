const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

// remove the incorrect </div> placed before Toast
code = code.replace(
    /      <\/div>\s*\n      \{\/\* Toast Notification System \*\/\}/g,
    '      {/* Toast Notification System */}'
);

const anchor = '{/* Case Details Modals */}';
// or let's find exactly where `{editingCase && (` starts
// actually, let's split by "{editingCase && ("
const splitAnchor = '{editingCase && (';
const parts = code.split(splitAnchor);

if (parts.length === 2 && !parts[0].endsWith('</div>\n      ')) {
    code = parts[0] + '</div>\n\n      ' + splitAnchor + parts[1];
    fs.writeFileSync('app/page.tsx', code);
    console.log('Fixed: added closing div before editingCase!');
} else {
    // If not {editingCase && (, maybe it's {editingCase && \n ?
    const split2 = '{editingCase && (';
    console.log('Could not find {editingCase && (. Searching manually...');
}
