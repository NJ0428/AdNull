// 팝업 스크립트
let removedCount = 0;
let bannerBlockingEnabled = false;
let youtubeAdSkipEnabled = false;

// DOM 요소들
const bannerStatusElement = document.getElementById('bannerStatus');
const youtubeStatusElement = document.getElementById('youtubeStatus');
const removedCountElement = document.getElementById('removedCount');
const toggleBannersButton = document.getElementById('toggleBanners');
const toggleYouTubeButton = document.getElementById('toggleYouTube');
const selectModeButton = document.getElementById('selectMode');
const restoreDivsButton = document.getElementById('restoreDivs');
const refreshCountButton = document.getElementById('refreshCount');
const modeIndicator = document.getElementById('modeIndicator');
const exitSelectModeButton = document.getElementById('exitSelectMode');

// 현재 탭 가져오기
async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
}

// 컨텐트 스크립트에 메시지 전송
async function sendMessageToContentScript(message) {
    const tab = await getCurrentTab();
    return chrome.tabs.sendMessage(tab.id, message);
}

// 배너 차단 상태 업데이트
async function updateBannerStatus() {
    try {
        const result = await chrome.storage.local.get(['bannerBlockingEnabled', 'youtubeAdSkipEnabled']);
        bannerBlockingEnabled = result.bannerBlockingEnabled || false;
        youtubeAdSkipEnabled = result.youtubeAdSkipEnabled || false;
        
        // 배너 차단 상태 업데이트
        bannerStatusElement.textContent = bannerBlockingEnabled ? 'ON' : 'OFF';
        bannerStatusElement.style.color = bannerBlockingEnabled ? '#27ae60' : '#e74c3c';
        
        toggleBannersButton.textContent = bannerBlockingEnabled ? 
            '🔴 배너 차단 ON' : '🚫 배너 차단 OFF';
        toggleBannersButton.className = bannerBlockingEnabled ? 
            'btn btn-warning active' : 'btn btn-warning';
        
        // 유튜브 광고 스킵 상태 업데이트
        youtubeStatusElement.textContent = youtubeAdSkipEnabled ? 'ON' : 'OFF';
        youtubeStatusElement.style.color = youtubeAdSkipEnabled ? '#27ae60' : '#e74c3c';
        
        toggleYouTubeButton.textContent = youtubeAdSkipEnabled ? 
            '⏭️ 유튜브 스킵 ON' : '▶️ 유튜브 스킵 OFF';
        toggleYouTubeButton.className = youtubeAdSkipEnabled ? 
            'btn btn-danger active' : 'btn btn-danger';
            
    } catch (error) {
        console.error('상태를 가져올 수 없습니다:', error);
    }
}

// 삭제된 개수 업데이트
function updateRemovedCount(count) {
    removedCount = count;
    removedCountElement.textContent = removedCount;
    restoreDivsButton.disabled = removedCount === 0;
}

// 이벤트 리스너 설정
toggleBannersButton.addEventListener('click', async () => {
    try {
        // 상태 토글
        bannerBlockingEnabled = !bannerBlockingEnabled;
        
        // 저장소에 상태 저장
        await chrome.storage.local.set({ bannerBlockingEnabled });
        
        // UI 업데이트
        await updateBannerStatus();
        
        // 현재 탭에 상태 변경 알림
        await sendMessageToContentScript({ 
            action: 'setBannerBlocking', 
            enabled: bannerBlockingEnabled 
        });
        
        // 사용자 알림
        const statusText = bannerBlockingEnabled ? '활성화' : '비활성화';
        const notification = document.createElement('div');
        notification.textContent = `배너 차단이 ${statusText}되었습니다!`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${bannerBlockingEnabled ? '#27ae60' : '#e74c3c'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
    } catch (error) {
        console.error('배너 차단 설정 중 오류 발생:', error);
    }
});

// 유튜브 광고 스킵 토글 버튼
toggleYouTubeButton.addEventListener('click', async () => {
    try {
        // 상태 토글
        youtubeAdSkipEnabled = !youtubeAdSkipEnabled;
        
        // 저장소에 상태 저장
        await chrome.storage.local.set({ youtubeAdSkipEnabled });
        
        // UI 업데이트
        await updateBannerStatus();
        
        // 현재 탭에 상태 변경 알림
        await sendMessageToContentScript({ 
            action: 'setYouTubeAdSkip', 
            enabled: youtubeAdSkipEnabled 
        });
        
        // 사용자 알림
        const statusText = youtubeAdSkipEnabled ? '활성화' : '비활성화';
        const notification = document.createElement('div');
        notification.textContent = `유튜브 광고 자동 스킵이 ${statusText}되었습니다!`;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${youtubeAdSkipEnabled ? '#e74c3c' : '#95a5a6'};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            z-index: 10001;
            font-size: 12px;
            font-weight: bold;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
        
    } catch (error) {
        console.error('유튜브 광고 스킵 설정 중 오류 발생:', error);
    }
});

selectModeButton.addEventListener('click', async () => {
    try {
        await sendMessageToContentScript({ action: 'enableSelectMode' });
        modeIndicator.style.display = 'block';
        selectModeButton.disabled = true;
    } catch (error) {
        console.error('선택 모드 활성화 중 오류 발생:', error);
    }
});

exitSelectModeButton.addEventListener('click', async () => {
    try {
        await sendMessageToContentScript({ action: 'disableSelectMode' });
        modeIndicator.style.display = 'none';
        selectModeButton.disabled = false;
    } catch (error) {
        console.error('선택 모드 비활성화 중 오류 발생:', error);
    }
});

restoreDivsButton.addEventListener('click', async () => {
    try {
        const response = await sendMessageToContentScript({ action: 'restoreDivs' });
        if (response) {
            updateRemovedCount(0);
            await updateDivCount();
        }
    } catch (error) {
        console.error('div 복원 중 오류 발생:', error);
    }
});

refreshCountButton.addEventListener('click', async () => {
    await updateBannerStatus();
    
    try {
        const response = await sendMessageToContentScript({ action: 'getRemovedCount' });
        if (response && response.count !== undefined) {
            updateRemovedCount(response.count);
        }
    } catch (error) {
        console.error('삭제된 개수를 가져올 수 없습니다:', error);
    }
});

// 컨텐트 스크립트로부터 메시지 수신
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'updateRemovedCount') {
        updateRemovedCount(request.count);
    } else if (request.action === 'selectModeDisabled') {
        modeIndicator.style.display = 'none';
        selectModeButton.disabled = false;
    }
    sendResponse({ received: true });
});

// 팝업이 열릴 때 초기화
document.addEventListener('DOMContentLoaded', async () => {
    await updateBannerStatus();
    
    // 현재 삭제된 개수 가져오기
    try {
        const response = await sendMessageToContentScript({ action: 'getRemovedCount' });
        if (response && response.count !== undefined) {
            updateRemovedCount(response.count);
        }
    } catch (error) {
        console.error('삭제된 개수를 가져올 수 없습니다:', error);
    }
}); 