import { route, startRouter } from './router.js';
import { homeView } from './views/home.js';
import { learnView } from './views/learn.js';
import { palaceView } from './views/palace.js';
import { dictionaryView } from './views/dictionary.js';
import { statsView } from './views/stats.js';
import { planView } from './views/plan.js';
import { wordsMode } from './modes/words.js';
import { numbersMode } from './modes/numbers.js';
import { cardsMode } from './modes/cards.js';
import { numDrillMode } from './modes/numdrill.js';
import { imagesMode } from './modes/images.js';
import { nbackMode } from './modes/nback.js';
import { stagesView } from './views/map.js';
import { profileView } from './views/profile.js';
import { updateLevelChip } from './game.js';

route('/', homeView);
route('/learn', learnView);
route('/palace', palaceView);
route('/dictionary', dictionaryView);
route('/stats', statsView);
route('/plan', planView);
route('/words', wordsMode);
route('/numbers', numbersMode);
route('/cards', cardsMode);
route('/numdrill', numDrillMode);
route('/images', imagesMode);
route('/nback', nbackMode);
route('/stages', stagesView);
route('/profile', profileView);

updateLevelChip();
startRouter();

// 오프라인 사용을 위한 서비스 워커 (https 또는 localhost에서만 동작)
// APK(Capacitor) 안에서는 파일이 이미 앱 안에 있으니 쓰지 않아요. (쓰면 앱을 업데이트해도 옛 캐시가 보일 수 있음)
const inApk = !!window.Capacitor?.isNativePlatform?.();
if (!inApk && 'serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}
