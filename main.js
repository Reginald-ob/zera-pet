document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 0. 全域狀態管理 (State Management)
    // ==========================================
    // 模擬使用者狀態：預設為 null (未登入)。
    // 未來串接 Supabase Auth 時，這裡會從 supabase.auth.getSession() 取得
    let currentUser = null; 
    let isLoginMode = true; // 控制當前顯示的是「登入」還是「註冊」表單

    // ==========================================
    // 1. 全域視圖路由切換 (SPA Routing) 加上權限攔截
    // ==========================================
    const viewButtons = document.querySelectorAll('[data-view-target]');
    const viewSections = document.querySelectorAll('.view-section');

    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            let targetId = button.getAttribute('data-view-target');

            // 【核心邏輯】：攔截未登入用戶
            // 如果用戶想進入會員中心 (member-view)，但尚未登入 (currentUser = null)
            // 將目標視圖強制修改為登入/註冊頁面 (auth-view)
            if (targetId === 'member-view' && !currentUser) {
                targetId = 'auth-view';
            }

            // 隱藏所有視圖
            viewSections.forEach(section => {
                section.classList.remove('block');
                section.classList.add('hidden');
            });

            // 顯示目標視圖
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                targetSection.classList.add('block');
            }

            window.scrollTo({ top: 0, behavior: 'smooth' });

            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
        });
    });

    // ==========================================
    // 1.5 登入/註冊表單 UI 切換邏輯
    // ==========================================
    const toggleAuthBtn = document.querySelector('[data-action="toggle-auth-mode"]');
    if (toggleAuthBtn) {
        toggleAuthBtn.addEventListener('click', () => {
            isLoginMode = !isLoginMode;
            
            const title = document.getElementById('auth-title');
            const subtitle = document.getElementById('auth-subtitle');
            const submitBtn = document.getElementById('auth-submit-btn');
            const toggleText = document.getElementById('auth-toggle-text');
            const forgotPasswordWrap = document.getElementById('forgot-password-wrap');

            if (isLoginMode) {
                // 切換為登入畫面
                title.textContent = 'Member Login';
                subtitle.textContent = '歡迎回到 ZERA，請登入您的專屬帳戶';
                submitBtn.textContent = 'Sign In';
                toggleText.textContent = '還沒有帳號嗎？';
                toggleAuthBtn.textContent = '立即註冊';
                forgotPasswordWrap.classList.remove('hidden'); // 顯示忘記密碼
            } else {
                // 切換為註冊畫面
                title.textContent = 'Create Account';
                subtitle.textContent = '加入 ZERA，為您的高貴夥伴開啟極致生活';
                submitBtn.textContent = 'Register';
                toggleText.textContent = '已經擁有帳號？';
                toggleAuthBtn.textContent = '立即登入';
                forgotPasswordWrap.classList.add('hidden'); // 隱藏忘記密碼
            }
        });
    }

    // 表單防連點與模擬送出
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('auth-submit-btn');
            
            // 實作 PRD 防呆規範：disabled 並顯示處理中
            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '處理中 Processing...';
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            // 模擬 API 延遲 (後續替換為 Supabase Auth 邏輯)
            setTimeout(() => {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                
                // 模擬登入成功，將使用者導向會員中心
                currentUser = { id: 1, name: 'VIP' };
                document.querySelector('[data-view-target="member-view"]').click();
            }, 1500);
        });
    }
    
    // ==========================================
    // 2. 會員中心內部標籤切換 (Member Tabs)
    // ==========================================
    const tabButtons = document.querySelectorAll('[data-action="switch-member-tab"]');
    const tabContents = document.querySelectorAll('.member-tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetId = button.getAttribute('data-target');

            // 步驟 A: 重置所有側邊欄按鈕為「未選中」樣式
            tabButtons.forEach(btn => {
                btn.classList.remove('bg-zera-cream/50', 'text-zera-tan', 'border-zera-tan', 'font-bold');
                btn.classList.add('text-zera-black/60', 'border-transparent');
            });

            // 步驟 B: 將當前點擊的按鈕設為「已選中」樣式 (左側粗框線 + 品牌色文字)
            button.classList.remove('text-zera-black/60', 'border-transparent');
            button.classList.add('bg-zera-cream/50', 'text-zera-tan', 'border-zera-tan', 'font-bold');

            // 步驟 C: 隱藏所有標籤內容區塊
            tabContents.forEach(content => {
                content.classList.remove('block');
                content.classList.add('hidden');
            });

            // 步驟 D: 顯示對應的目標內容區塊
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.remove('hidden');
                targetContent.classList.add('block');
            }
        });
    });

    // ==========================================
    // 3. 手機版選單開關控制
    // ==========================================
    const mobileMenuToggleBtn = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (mobileMenuToggleBtn) {
        mobileMenuToggleBtn.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }

});