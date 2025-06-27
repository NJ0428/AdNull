// 백그라운드 서비스 워커
// Manifest V3에서는 Service Worker 방식 사용

// 확장 프로그램 설치 시 이벤트
chrome.runtime.onInstalled.addListener((details) => {
    if (details.reason === 'install') {
        console.log('AdNull 확장 프로그램이 설치되었습니다.');
        
        // 설치 완료 알림 (선택사항)
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'AdNull 설치 완료',
            message: 'div 삭제 도구가 성공적으로 설치되었습니다!'
        }, () => {
            // 알림 권한이 없어도 오류 무시
            if (chrome.runtime.lastError) {
                console.log('알림 권한이 없습니다:', chrome.runtime.lastError.message);
            }
        });
    } else if (details.reason === 'update') {
        console.log('AdNull 확장 프로그램이 업데이트되었습니다.');
    }
});

// 확장 프로그램 시작 시 이벤트
chrome.runtime.onStartup.addListener(() => {
    console.log('AdNull 확장 프로그램이 시작되었습니다.');
});

// 메시지 리스너 (팝업과 컨텐트 스크립트 간 통신 중계)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background script에서 메시지 수신:', request);
    
    // 메시지를 다른 스크립트로 전달하거나 처리
    if (request.action === 'updateRemovedCount') {
        // 팝업이 열려있다면 업데이트 전송
        chrome.runtime.sendMessage(request).catch(() => {
            // 팝업이 닫혀있으면 오류 무시
        });
    }
    
    sendResponse({ received: true });
    return true;
});

// 탭 업데이트 이벤트 (페이지 새로고침 등)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && tab.url) {
        // 페이지가 완전히 로드되었을 때
        console.log('페이지 로드 완료:', tab.url);
    }
});

// 확장 프로그램 아이콘 클릭 시 (action 버튼 클릭)
chrome.action.onClicked.addListener((tab) => {
    // manifest.json에서 popup을 설정했으므로 이 이벤트는 발생하지 않음
    // 만약 팝업 대신 직접 기능을 실행하고 싶다면 manifest.json에서 popup을 제거하고 여기서 처리
    console.log('확장 프로그램 아이콘이 클릭되었습니다.');
});

// 키보드 단축키 명령어 처리 (선택사항)
chrome.commands.onCommand.addListener((command) => {
    console.log('키보드 단축키 실행:', command);
    
    switch (command) {
        case 'remove-all-divs':
            // 현재 탭에 메시지 전송
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'removeAllDivs' });
                }
            });
            break;
        case 'toggle-select-mode':
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0]) {
                    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSelectMode' });
                }
            });
            break;
    }
});

console.log('AdNull 백그라운드 스크립트가 로드되었습니다.'); 