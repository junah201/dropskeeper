// 동작 데모에 쓰는 예시 보상. 이름과 이미지는 실제 SOOP 드롭스 보상이고, 코드는 실제로 존재하지 않는 가짜 값이다.
import socal from '../../assets/rewards/socal-sunset-2026-spray.webp';
import lootBox from '../../assets/rewards/esports-loot-box.webp';
import anaheim from '../../assets/rewards/owwc-anaheim-2026-night-icon.webp';
import tacos from '../../assets/rewards/tacos-as-i-have-spray.webp';
import sunTea from '../../assets/rewards/sun-tea-icon.webp';
import purrfect from '../../assets/rewards/purrfect-evening-spray.webp';
import lantern from '../../assets/rewards/lantern-lit-night-name-card.webp';

export interface DemoReward {
  name: string;
  img: string;
  code: string;
  /** 만료까지 남은 날 */
  days: number;
  campaign: string;
  /** 드롭스 보관함에 받은 날짜 */
  got: string;
  expires: string;
}

export const rewards: DemoReward[] = [
  { name: 'SoCal Sunset 2026 Spray', img: socal.src, code: 'H6NM-7QKP-BVGX', days: 111, campaign: 'OWWC Anaheim', got: '2026-09-13', expires: '2027-02-28' },
  { name: 'Esports Loot Box', img: lootBox.src, code: 'JDT5-R2LW-BJX8', days: 111, campaign: 'OWWC Anaheim', got: '2026-09-13', expires: '2027-02-28' },
  { name: 'OWWC Anaheim 2026 Night Icon', img: anaheim.src, code: 'H9Q5-ZK3D-FMHG', days: 111, campaign: 'OWWC Anaheim', got: '2026-09-13', expires: '2027-02-28' },
  { name: 'Tacos, as I have Spray', img: tacos.src, code: 'F4JD-8TYN-K5VM', days: 111, campaign: 'OWWC Anaheim', got: '2026-09-09', expires: '2027-02-28' },
  { name: 'Sun Tea Icon', img: sunTea.src, code: 'CBQS-M7PA-XJW6', days: 128, campaign: 'OWCS Korea', got: '2026-10-02', expires: '2027-03-17' },
  { name: 'Purrfect Evening Spray', img: purrfect.src, code: '645L-W9EH-KSNW', days: 142, campaign: 'OWCS Korea', got: '2026-10-30', expires: '2027-03-31' },
  { name: 'Lantern-Lit Night Name Card', img: lantern.src, code: 'B3XN-6UFR-3NMN', days: 142, campaign: 'OWCS Korea', got: '2026-10-30', expires: '2027-03-31' },
];

export const N = rewards.length;

/** 등록 데모에서 "이미 사용된 코드"로 실패하는 칸 */
export const FAIL_AT = 3;
