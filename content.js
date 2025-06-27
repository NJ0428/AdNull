// 컨텐트 스크립트 - 웹페이지에서 실행됨
let removedDivs = []; // 삭제된 div 저장
let selectMode = false; // 선택 모드 상태
let originalStyles = new Map(); // 원본 스타일 저장
let bannerBlockingEnabled = false; // 배너 차단 상태
let bannerCheckInterval = null; // 배너 체크 인터벌
let youtubeAdSkipEnabled = false; // 유튜브 광고 스킵 상태
let youtubeSkipInterval = null; // 유튜브 스킵 체크 인터벌

// 선택 모드용 스타일
const selectModeCSS = `
    .adnull-hover {
        outline: 2px solid #ff4757 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
        position: relative !important;
    }
    
    .adnull-hover::before {
        content: "클릭해서 삭제" !important;
        position: absolute !important;
        top: -30px !important;
        left: 0 !important;
        background: #ff4757 !important;
        color: white !important;
        padding: 4px 8px !important;
        border-radius: 4px !important;
        font-size: 12px !important;
        font-weight: bold !important;
        z-index: 10000 !important;
        white-space: nowrap !important;
    }
`;

// CSS 주입
function injectCSS() {
    if (!document.getElementById('adnull-styles')) {
        const style = document.createElement('style');
        style.id = 'adnull-styles';
        style.textContent = selectModeCSS;
        document.head.appendChild(style);
    }
}

// CSS 제거
function removeCSS() {
    const style = document.getElementById('adnull-styles');
    if (style) {
        style.remove();
    }
}

// div 개수 계산
function getDivCount() {
    return document.querySelectorAll('div').length;
}

// 특정 배너 요소의 하위 태그들 제거
function removeBanners() {
    let removedCount = 0;
    const isYouTube = window.location.hostname.includes('youtube.com');
    
    // 유튜브 사이트에서는 배너 차단 기능 완전 비활성화
    if (isYouTube) {
        console.log('AdNull: 유튜브 사이트에서는 배너 차단이 비활성화됩니다.');
        return 0;
    }
    
    // 유튜브가 아닌 경우에만 배너 제거 로직 실행
    // 지정된 선택자로 배너 요소 찾기
    const bannerElements = document.querySelectorAll('ul.banner2#bannerList, ul#bannerList.banner2');
    
    bannerElements.forEach(banner => {
        if (banner.dataset.adnullBannerRemoved) return;
        
        // 하위 모든 요소들을 제거
        const children = Array.from(banner.children);
        children.forEach(child => {
            banner.removeChild(child);
            removedCount++;
        });
        
        // 배너 컨테이너 완전히 숨김
        if (children.length > 0) {
            banner.style.display = 'none';
            banner.dataset.adnullBannerRemoved = 'true';
        }
    });
    
    // 추가적인 일반적인 광고 배너 패턴들도 제거
    const additionalBannerSelectors = [
        '.banner',
        '.advertisement',
        '.ad-banner',
        '.ads',
        '[class*="banner"]:not(.banner2)',
        '[id*="banner"]:not(#bannerList)',
        '[class*="ad-"]',
        '[id*="ad-"]'
    ];
    
    // 사용자가 요청한 특정 광고 패턴 제거 (ul > li.full 구조)
    const adListElements = document.querySelectorAll('ul');
    adListElements.forEach(ul => {
        // 이미 처리된 요소는 건너뛰기
        if (ul.dataset.adnullBannerRemoved) return;
        
        // ul 안에 li.full.pc-only 또는 li.full.mobile-only 요소들이 있는지 확인
        const adListItems = ul.querySelectorAll('li.full.pc-only, li.full.mobile-only');
        
        if (adListItems.length > 0) {
            // 광고성 링크가 포함된 li 요소들인지 확인
            let hasAdLinks = false;
            adListItems.forEach(li => {
                const links = li.querySelectorAll('a[href*="?"], a[href*="regcode"], a[href*="code="], a[href*="ref="]');
                if (links.length > 0) {
                    hasAdLinks = true;
                }
            });
            
            // 광고성 링크가 확인되면 해당 ul 전체를 숨김
            if (hasAdLinks) {
                ul.style.display = 'none';
                ul.dataset.adnullBannerRemoved = 'true';
                removedCount++;
                
                console.log('AdNull: 광고 리스트 제거됨', ul);
            }
        }
    });
    
    additionalBannerSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            // 이미 처리된 요소는 건너뛰기
            if (element.dataset.adnullBannerRemoved) return;
            
            // 요소 숨기기 (완전 제거보다는 안전한 방법)
            element.style.display = 'none';
            element.dataset.adnullBannerRemoved = 'true';
            removedCount++;
        });
    });
    
    return removedCount;
}

// 유튜브 광고 스킵 기능
function skipYouTubeAds() {
    // 유튜브 페이지가 아니면 실행하지 않음
    if (!window.location.hostname.includes('youtube.com')) {
        return;
    }
    
    let skippedCount = 0;
    
    // 광고 스킵 버튼 찾기 및 클릭
    const skipButtons = document.querySelectorAll([
        '.ytp-ad-skip-button',
        '.ytp-skip-ad-button', 
        '.ytp-ad-skip-button-modern',
        'button[class*="skip"]'
    ].join(','));
    
    skipButtons.forEach(button => {
        if (button && button.offsetParent !== null) { // 버튼이 보이는 상태인지 확인
            try {
                button.click();
                skippedCount++;
                console.log('AdNull: 유튜브 광고 스킵 버튼 클릭됨', button);
            } catch (error) {
                console.error('AdNull: 스킵 버튼 클릭 오류:', error);
            }
        }
    });
    
    // 광고 오버레이 제거
    const adOverlays = document.querySelectorAll([
        '.ytp-ad-player-overlay',
        '.ytp-ad-player-overlay-instream-info',
        '.video-ads',
        '.ytp-ad-overlay-container'
    ].join(','));
    
    adOverlays.forEach(overlay => {
        if (overlay && !overlay.dataset.adnullRemoved) {
            overlay.style.display = 'none';
            overlay.dataset.adnullRemoved = 'true';
            skippedCount++;
            console.log('AdNull: 유튜브 광고 오버레이 제거됨', overlay);
        }
    });
    
    // 광고 표시 중인 영상 플레이어에서 빨리감기 (5초 스킵 시도)
    const videoPlayer = document.querySelector('video');
    const adIndicator = document.querySelector('.ad-showing, .ytp-ad-text, .ytp-ad-duration-remaining');
    
    if (videoPlayer && adIndicator && videoPlayer.duration) {
        try {
            // 광고가 5초 이하 남았다면 끝까지 스킵
            if (videoPlayer.duration - videoPlayer.currentTime <= 5) {
                videoPlayer.currentTime = videoPlayer.duration - 0.1;
                skippedCount++;
                console.log('AdNull: 유튜브 광고 영상 스킵됨');
            }
        } catch (error) {
            console.error('AdNull: 영상 스킵 오류:', error);
        }
    }
    
    return skippedCount;
}

// 유튜브 광고 스킵 상태 설정
function setYouTubeAdSkip(enabled) {
    youtubeAdSkipEnabled = enabled;
    
    if (enabled && window.location.hostname.includes('youtube.com')) {
        // 즉시 광고 스킵 실행
        skipYouTubeAds();
        
        // 주기적으로 광고 스킵 체크 (빠른 반응을 위해 1초마다)
        if (youtubeSkipInterval) {
            clearInterval(youtubeSkipInterval);
        }
        youtubeSkipInterval = setInterval(() => {
            skipYouTubeAds();
        }, 1000); // 1초마다 체크
        
        console.log('AdNull: 유튜브 광고 자동 스킵이 활성화되었습니다.');
    } else {
        // 유튜브 광고 스킵 비활성화
        if (youtubeSkipInterval) {
            clearInterval(youtubeSkipInterval);
            youtubeSkipInterval = null;
        }
        console.log('AdNull: 유튜브 광고 자동 스킵이 비활성화되었습니다.');
    }
}

// 배너 차단 상태 설정
function setBannerBlocking(enabled) {
    const isYouTube = window.location.hostname.includes('youtube.com');
    
    // 유튜브 사이트에서는 배너 차단 기능 완전 비활성화
    if (isYouTube) {
        console.log('AdNull: 유튜브 사이트에서는 배너 차단 기능이 비활성화됩니다.');
        return;
    }
    
    bannerBlockingEnabled = enabled;
    
    if (enabled) {
        // 즉시 배너 제거 실행
        removeBanners();
        
        // 주기적으로 새로운 배너 체크 (동적으로 추가되는 광고 대응)
        if (bannerCheckInterval) {
            clearInterval(bannerCheckInterval);
        }
        bannerCheckInterval = setInterval(() => {
            removeBanners();
        }, 2000); // 2초마다 체크
        
        console.log('AdNull: 배너 차단이 활성화되었습니다.');
    } else {
        // 배너 차단 비활성화
        if (bannerCheckInterval) {
            clearInterval(bannerCheckInterval);
            bannerCheckInterval = null;
        }
        console.log('AdNull: 배너 차단이 비활성화되었습니다.');
    }
}

// 페이지 로드 시 배너 차단 상태 확인 및 적용
async function initializeBannerBlocking() {
    try {
        const result = await chrome.storage.local.get(['bannerBlockingEnabled', 'youtubeAdSkipEnabled']);
        const bannerEnabled = result.bannerBlockingEnabled || false;
        const youtubeEnabled = result.youtubeAdSkipEnabled || false;
        
        if (bannerEnabled) {
            setBannerBlocking(true);
        }
        
        if (youtubeEnabled) {
            setYouTubeAdSkip(true);
        }
    } catch (error) {
        console.error('AdNull: 초기화 오류:', error);
    }
}

// 모든 div 삭제
function removeAllDivs() {
    const divs = document.querySelectorAll('div');
    const removedElements = [];
    
    divs.forEach(div => {
        // 이미 삭제된 div는 제외
        if (div.style.display !== 'none' || !div.dataset.adnullRemoved) {
            const elementInfo = {
                element: div,
                originalDisplay: div.style.display,
                originalVisibility: div.style.visibility,
                parent: div.parentNode,
                nextSibling: div.nextSibling
            };
            
            // div 숨기기
            div.style.display = 'none';
            div.dataset.adnullRemoved = 'true';
            
            removedElements.push(elementInfo);
        }
    });
    
    removedDivs.push(...removedElements);
    return removedElements.length;
}

// 선택된 div 삭제
function removeSelectedDiv(element) {
    if (element.tagName.toLowerCase() === 'div' && 
        element.style.display !== 'none' && 
        !element.dataset.adnullRemoved) {
        
        const elementInfo = {
            element: element,
            originalDisplay: element.style.display,
            originalVisibility: element.style.visibility,
            parent: element.parentNode,
            nextSibling: element.nextSibling
        };
        
        // div 숨기기
        element.style.display = 'none';
        element.dataset.adnullRemoved = 'true';
        
        removedDivs.push(elementInfo);
        
        // 팝업에 업데이트 알림
        chrome.runtime.sendMessage({
            action: 'updateRemovedCount',
            count: removedDivs.length
        });
        
        return true;
    }
    return false;
}

// div 복원
function restoreDivs() {
    removedDivs.forEach(info => {
        const { element, originalDisplay, originalVisibility } = info;
        
        // 원래 스타일 복원
        element.style.display = originalDisplay;
        element.style.visibility = originalVisibility;
        delete element.dataset.adnullRemoved;
    });
    
    removedDivs = [];
    return true;
}

// 선택 모드 활성화
function enableSelectMode() {
    selectMode = true;
    injectCSS();
    
    // 모든 div에 호버 이벤트 추가
    const divs = document.querySelectorAll('div');
    divs.forEach(div => {
        if (!div.dataset.adnullRemoved) {
            div.addEventListener('mouseenter', handleDivHover);
            div.addEventListener('mouseleave', handleDivLeave);
            div.addEventListener('click', handleDivClick);
        }
    });
    
    // ESC 키로 선택 모드 종료
    document.addEventListener('keydown', handleEscapeKey);
    
    return true;
}

// 선택 모드 비활성화
function disableSelectMode() {
    selectMode = false;
    removeCSS();
    
    // 모든 div에서 이벤트 제거
    const divs = document.querySelectorAll('div');
    divs.forEach(div => {
        div.removeEventListener('mouseenter', handleDivHover);
        div.removeEventListener('mouseleave', handleDivLeave);
        div.removeEventListener('click', handleDivClick);
        div.classList.remove('adnull-hover');
    });
    
    document.removeEventListener('keydown', handleEscapeKey);
    
    return true;
}

// 이벤트 핸들러들
function handleDivHover(event) {
    if (selectMode && !event.target.dataset.adnullRemoved) {
        event.target.classList.add('adnull-hover');
    }
}

function handleDivLeave(event) {
    if (selectMode) {
        event.target.classList.remove('adnull-hover');
    }
}

function handleDivClick(event) {
    if (selectMode) {
        event.preventDefault();
        event.stopPropagation();
        
        const removed = removeSelectedDiv(event.target);
        if (removed) {
            event.target.classList.remove('adnull-hover');
            
            // 선택 모드 계속 유지하면서 알림만 표시
            const notification = document.createElement('div');
            notification.textContent = 'div가 삭제되었습니다!';
            notification.style.cssText = `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: #2ed573 !important;
                color: white !important;
                padding: 12px 20px !important;
                border-radius: 6px !important;
                z-index: 10001 !important;
                font-size: 14px !important;
                font-weight: bold !important;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 2000);
        }
    }
}

function handleEscapeKey(event) {
    if (event.key === 'Escape' && selectMode) {
        disableSelectMode();
        chrome.runtime.sendMessage({
            action: 'selectModeDisabled'
        });
    }
}

// 메시지 리스너
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    try {
        switch (request.action) {
            case 'getDivCount':
                sendResponse({ count: getDivCount() });
                break;
                
            case 'setBannerBlocking':
                setBannerBlocking(request.enabled);
                sendResponse({ success: true });
                break;
                
            case 'setYouTubeAdSkip':
                setYouTubeAdSkip(request.enabled);
                sendResponse({ success: true });
                break;
                
            case 'enableSelectMode':
                const selectEnabled = enableSelectMode();
                sendResponse({ success: selectEnabled });
                break;
                
            case 'disableSelectMode':
                const selectDisabled = disableSelectMode();
                sendResponse({ success: selectDisabled });
                break;
                
            case 'restoreDivs':
                const restored = restoreDivs();
                sendResponse({ success: restored });
                break;
                
            case 'getRemovedCount':
                sendResponse({ count: removedDivs.length });
                break;
                
            default:
                sendResponse({ error: 'Unknown action' });
        }
    } catch (error) {
        console.error('Content script error:', error);
        sendResponse({ error: error.message });
    }
    
    return true; // 비동기 응답을 위해 true 반환
});

// 초기화
console.log('AdNull 컨텐트 스크립트가 로드되었습니다.');

// 페이지 로드 완료 시 배너 차단 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeBannerBlocking);
} else {
    // 이미 로드된 경우 즉시 실행
    initializeBannerBlocking();
}

// 페이지 변경 감지 (SPA 대응)
let currentURL = location.href;
new MutationObserver(() => {
    if (location.href !== currentURL) {
        currentURL = location.href;
        console.log('AdNull: 페이지 변경 감지, 배너 차단 재적용');
        
        // 페이지 변경 시 잠시 후 배너 차단 재적용
        setTimeout(() => {
            if (bannerBlockingEnabled) {
                removeBanners();
            }
        }, 1000);
    }
}).observe(document, { subtree: true, childList: true }); 