// APK 빌드: android/ 의 gradlew 로 디버그 APK를 만들어요. (npm run apk 가 www 복사·sync 뒤에 불러요)
// 셸 설정에 따라 'gradlew.bat' 를 못 찾는 경우가 있어서 절대 경로로 실행해요.
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const android = fileURLToPath(new URL('../android', import.meta.url));
const win = process.platform === 'win32';
const gradlew = join(android, win ? 'gradlew.bat' : 'gradlew');

const r = spawnSync(gradlew, ['assembleDebug'], { cwd: android, stdio: 'inherit', shell: win });
if (r.status !== 0) process.exit(r.status ?? 1);
console.log('\n✓ APK: android/app/build/outputs/apk/debug/app-debug.apk');
