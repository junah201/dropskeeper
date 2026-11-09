import type { SourceId, SourceReward } from '../types';
import { LocalError, type LocalText } from '../i18n';

/**
 * 드롭스 플랫폼 하나를 나타내는 인터페이스.
 *
 * 구현은 그 플랫폼 페이지에 주입된 content script 안에서 실행된다.
 * 같은 출처에서 요청하므로 로그인 쿠키가 자동으로 붙는다.
 * 새 플랫폼을 추가하는 순서는 README의 "새 드롭스 플랫폼 추가하기"에 있다.
 */
export interface DropSource {
  id: SourceId;
  /** 로그인되어 있지 않은 등 오류를 사용자에게 보여 줄 때 쓰는 이름 */
  name: string;
  /** 보상 목록 전체를 가져와 등록 가능한 보상만 정규화해 돌려준다 */
  listRewards(): Promise<SourceReward[]>;
  /** 보상 하나의 코드 문자열을 가져온다 */
  extractCode(reward: SourceReward): Promise<{ code: string; campaign?: string }>;
}

/** 플랫폼별 고정 정보. content script 없이 popup·background에서도 쓴다. */
export interface SourceMeta {
  id: SourceId;
  name: string;
  /** 드롭스 인벤토리 페이지 주소 */
  inventoryUrl: string;
  /** content script와 host_permissions에 쓰는 match pattern */
  matches: string[];
  /** 플랫폼이 '획득 완료'(코드를 이미 받아 감) 여부를 알려 주는지. false면 관련 필터를 숨긴다. */
  tracksClaimed: boolean;
}

/** 플랫폼 오류. 문구는 msg()로 만든 키이거나 플랫폼 API가 보낸 원문이다. */
export class SourceError extends LocalError {
  constructor(
    text: LocalText,
    readonly kind: 'login_required' | 'api' | 'network' = 'api',
  ) {
    super(text);
  }
}
