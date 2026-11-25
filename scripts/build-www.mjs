// APK용: 앱에 들어갈 웹 파일만 www/ 로 복사해요. (docs, scripts, android 등은 빼고)
// 사용: npm run build:www  (npm run apk 가 자동으로 불러요)
import { cpSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = join(root, 'www');
const FILES = ['index.html', 'styles.css', 'manifest.webmanifest', 'sw.js', 'icons', 'src'];

rmSync(out, { recursive: true, force: true });
mkdirSync(out);
for (const f of FILES) cpSync(join(root, f), join(out, f), { recursive: true });
console.log(`✓ www/ 에 ${FILES.length}개 항목 복사`);
