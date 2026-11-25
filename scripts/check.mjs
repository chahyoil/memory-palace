// 모든 JS 파일 문법 검사 + sw.js 캐시 목록에 빠진 파일이 없는지 확인
// 사용: npm run check
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const jsFiles = [...walk(join(root, 'src')), join(root, 'sw.js')].filter((f) => f.endsWith('.js'));
let failed = false;

for (const f of jsFiles) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    failed = true;
    console.error(`✗ 문법 오류: ${relative(root, f)}\n${e.stderr}`);
  }
}

const sw = readFileSync(join(root, 'sw.js'), 'utf8');
for (const f of walk(join(root, 'src'))) {
  const rel = './' + relative(root, f).split(sep).join('/');
  if (!sw.includes(`'${rel}'`)) {
    failed = true;
    console.error(`✗ sw.js ASSETS에 없음: ${rel}`);
  }
}

if (failed) process.exit(1);
console.log(`✓ JS ${jsFiles.length}개 문법 OK, sw.js 캐시 목록 OK`);
