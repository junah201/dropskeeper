import type { SourceId, SourceReward } from '../types';

/**
 * 드롭스 플랫폼 하나를 나타내는 인터페이스.
 *
 * 구현은 그 플랫폼 페이지에 주입된 content script 안에서 실행된다.
 * 같은 출처에서 요청하므로 로그인 쿠키가 자동으로 붙는다.
 *
 * 새 플랫폼을 추가하는 순서:
 *   1. types.ts의 SourceId에 id 추가
 *   2. sources/<id>.ts에 DropSource 구현
 *   3. sources/hosts.ts에 메타 정보 추가
 *   4. sources/index.ts 레지스트리에 등록
 *   5. entrypoints/<id>.content.ts 생성 (serveSource 한 줄)
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
}

export class SourceError extends Error {
  constructor(
    message: string,
    readonly kind: 'login_required' | 'api' | 'network' = 'api',
  ) {
    super(message);
  }
}
