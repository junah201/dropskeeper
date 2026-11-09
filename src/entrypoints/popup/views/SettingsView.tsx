import { useId } from 'react';
import { sendToBackground } from '@/lib/messages';
import type { Settings } from '@/lib/types';
import { usePopup } from '../context';
import { CodeChip, Shell, Switch } from '../ui';

/** 미리보기에 쓰는 예시 코드. 실제 코드가 아니고, Battle.net 코드와 같은 4-4-5-4-4 형식만 맞췄다. */
const SAMPLE_CODE = 'K7QX-M2PL-9RT4W-WN4D-H8ZC';

/** 확장 안에 들어 있는 개인정보처리방침·이용약관 페이지를 새 탭으로 연다 */
const openPage = (path: '/privacy.html' | '/terms.html') => browser.tabs.create({ url: browser.runtime.getURL(path) });

export function SettingsView() {
  const { settings } = usePopup();
  // 저장은 background가 맡고, 바뀐 값은 저장소 감시로 다시 들어온다
  const set = (patch: Partial<Settings>) => void sendToBackground({ type: 'settings/set', patch });

  return (
    <Shell step={null} title="설정">
      <div className="flex h-full flex-col px-4 py-4">
        <section className="overflow-hidden rounded-[10px] border border-line bg-panel">
          <SettingRow
            title="코드 가리기"
            description="목록에 보이는 코드의 가운데를 가려요. 복사 버튼은 설정과 상관없이 전체 코드를 복사해요."
            on={settings.maskCodes}
            onChange={(maskCodes) => set({ maskCodes })}
          >
            <CodeChip code={SAMPLE_CODE} />
          </SettingRow>
        </section>

        <div className="mt-auto flex justify-center gap-3 pt-6 text-[12px] text-faint">
          <button className="hover:text-sub hover:underline" onClick={() => openPage('/privacy.html')}>
            개인정보처리방침
          </button>
          <span aria-hidden>·</span>
          <button className="hover:text-sub hover:underline" onClick={() => openPage('/terms.html')}>
            서비스 이용약관
          </button>
        </div>
      </div>
    </Shell>
  );
}

function SettingRow({
  title,
  description,
  on,
  onChange,
  children,
}: {
  title: string;
  description: string;
  on: boolean;
  onChange: (next: boolean) => void;
  /** 설정이 화면에 어떻게 보이는지 바로 보여 주는 미리보기 */
  children?: React.ReactNode;
}) {
  const descId = useId();
  return (
    <div className="flex items-start gap-4 p-4">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium">{title}</div>
        <p id={descId} className="mt-1 text-[13px] leading-relaxed text-sub">
          {description}
        </p>
        {children && <div className="mt-3">{children}</div>}
      </div>
      <div className="pt-0.5">
        <Switch on={on} onChange={onChange} label={title} describedBy={descId} />
      </div>
    </div>
  );
}
