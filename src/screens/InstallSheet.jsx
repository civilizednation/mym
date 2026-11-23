import { useEffect, useState } from 'react';
import { canPrompt, inApp, isIOS, isKakao, isStandalone, isWeChat, onInstallChange, promptInstall } from '../install.js';

export function InstallButton() {
  const [open, setOpen] = useState(false);
  const [, force] = useState(0);
  useEffect(() => onInstallChange(() => force((n) => n + 1)), []);
  if (isStandalone()) return null;

  const click = async () => {
    if (canPrompt()) await promptInstall();
    else setOpen(true);
  };

  return (
    <>
      <button className="install-btn" onClick={click}>
        <img src="/icon-192.png" alt="" /> 홈 화면에 앱 추가하기
      </button>
      {open && <InstallSheet onClose={() => setOpen(false)} />}
    </>
  );
}

function InstallSheet({ onClose }) {
  let title, steps;
  if (inApp) {
    title = '먼저 기본 브라우저로 열어 주세요';
    steps = isKakao
      ? [isIOS ? '오른쪽 아래 공유(⋯) 버튼' : '오른쪽 위 ⋮ 메뉴', isIOS ? '"Safari로 열기" 선택' : '"다른 브라우저로 열기" 선택', '열린 화면에서 다시 이 버튼 누르기']
      : isWeChat
        ? ['오른쪽 위 ⋯ 메뉴', isIOS ? '"Safari에서 열기" 선택' : '"브라우저에서 열기" 선택', '열린 화면에서 다시 이 버튼 누르기']
        : ['메뉴에서 "다른 브라우저로 열기" 선택', isIOS ? 'Safari에서 다시 이 버튼 누르기' : 'Chrome에서 다시 이 버튼 누르기'];
  } else if (isIOS) {
    title = '아이폰 홈 화면에 추가';
    steps = ['Safari 아래쪽(또는 주소창 옆) 공유 버튼 ⬆️ 누르기', '목록을 내려서 "홈 화면에 추가" 누르기', '오른쪽 위 "추가" 누르기'];
  } else {
    title = '홈 화면에 추가';
    steps = ['Chrome 오른쪽 위 ⋮ 메뉴 누르기', '"홈 화면에 추가" 또는 "앱 설치" 누르기', '"설치" / "추가" 누르기'];
  }
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="install-head">
          <img src="/icon-192.png" alt="" />
          <div><b>무석연합민턴</b><span className="muted">홈 화면에서 앱처럼 바로 열려요</span></div>
        </div>
        <h2>{title}</h2>
        <ol className="install-steps">
          {steps.map((s, i) => <li key={i}><span>{i + 1}</span>{s}</li>)}
        </ol>
        <div className="sheet-actions">
          <button className="btn primary block" onClick={onClose}>알겠어요</button>
        </div>
      </div>
    </div>
  );
}
