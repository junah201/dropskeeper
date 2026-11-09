import type { ComponentChildren } from 'preact';
import { useId } from 'preact/hooks';
import { i18n } from '#i18n';
import { sendToBackground } from '@/lib/messages';
import type { Settings } from '@/lib/types';
import { usePopup } from '../context';
import { CodeChip, Shell, Switch } from '../ui';

/** 미리보기용 가짜 코드. 형식만 Battle.net 코드(4-4-5-4-4)와 같다. */
const SAMPLE_CODE = 'K7QX-M2PL-9RT4W-WN4D-H8ZC';

const openPage = (path: '/privacy.html' | '/terms.html') => browser.tabs.create({ url: browser.runtime.getURL(path) });

export function SettingsView() {
  const { settings } = usePopup();
  // 저장은 background가 맡고, 바뀐 값은 저장소 감시로 다시 들어온다
  const set = (patch: Partial<Settings>) => void sendToBackground({ type: 'settings/set', patch });

  return (
    <Shell step={null} title={i18n.t('common.settings')}>
      <div className="flex h-full flex-col px-4 py-4">
        <section className="overflow-hidden rounded-[10px] border border-line bg-panel">
          <SettingRow
            title={i18n.t('settings.maskCodes')}
            description={i18n.t('settings.maskCodesDescription')}
            on={settings.maskCodes}
            onChange={(maskCodes) => set({ maskCodes })}
          >
            <CodeChip code={SAMPLE_CODE} />
          </SettingRow>
        </section>

        <div className="mt-auto flex justify-center gap-3 pt-6 text-[12px] text-faint">
          <button className="hover:text-sub hover:underline" onClick={() => openPage('/privacy.html')}>
            {i18n.t('settings.privacy')}
          </button>
          <span aria-hidden>·</span>
          <button className="hover:text-sub hover:underline" onClick={() => openPage('/terms.html')}>
            {i18n.t('settings.terms')}
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
  /** 바꾼 설정이 바로 반영되는 미리보기 */
  children?: ComponentChildren;
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
