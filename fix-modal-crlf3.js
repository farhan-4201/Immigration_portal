const fs = require('fs');
let code = fs.readFileSync('app/page.tsx', 'utf8');

const anchor = '{/* Toast Notification System */}';
const parts = code.split(anchor);
if (parts.length === 2 && !parts[0].endsWith('</div>\n\n      ')) {
    code = parts[0] + '</div>\n\n      ' + anchor + parts[1];
    fs.writeFileSync('app/page.tsx', code);
    console.log('Fixed missing closing div via split!');
} else {
    console.log('Split failed or already applied');
}
