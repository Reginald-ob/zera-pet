// ==========================================
    // 0. 全域狀態管理 (State Management) 擴充
    // ==========================================
    
    // Auth 狀態
    let currentUser = null; 
    let isLoginMode = true; 

    // 購物車與 Modal 狀態
    let cartState = []; 
    let allProducts = []; 
    let currentModalProduct = null; 
    let currentModalSelections = {}; 
    let currentModalQty = 1;

    // 首頁商品列表所需的過濾與渲染狀態
    let state = {
        category: '',      // 當前選擇的分類
        searchQuery: '',   // 搜尋關鍵字
        sortOrder: 'default' // 排序方式
    };
    let availableCategories = []; // 存放所有可用的分類
    let currentRenderedItems = []; // 當前畫面上渲染的商品陣列
    let currentPaymentOrder = null; // 紀錄當前正在付款的訂單資訊
    let currentOrdersData = []; // 存放會員當前所有歷史訂單資料

    // 顯示與隱藏 Loader 函數
    window.showLoader = () => document.getElementById('global-loader')?.classList.remove('hidden');
    window.hideLoader = () => document.getElementById('global-loader')?.classList.add('hidden');

    // ==========================================
    // 2. 購物車核心邏輯 (Cart Management)
    // ==========================================

    // 將商品加入購物車 (處理同一產品、多種規格)
    function addToCart(productItem) {
        // 檢查是否已存在相同 SKU 的商品
        const existingItemIndex = cartState.findIndex(item => item.sku === productItem.sku);

        if (existingItemIndex > -1) {
            // 已存在則增加數量
            cartState[existingItemIndex].quantity += productItem.quantity;
        } else {
            // 不存在則新增為新項目
            cartState.push(productItem);
        }
        
        updateCartUI();
        
        // 顯示加入成功提示 (可替換為更高級的 Toast UI)
        alert(`已將 ${productItem.name} (${productItem.variant}) 加入購物車`);
    }

    // 更改購物車內商品數量
    window.changeCartQuantity = function(sku, delta) {
        const itemIndex = cartState.findIndex(item => item.sku === sku);
        if (itemIndex > -1) {
            cartState[itemIndex].quantity += delta;
            
            // 數量低於 1 則移除該商品
            if (cartState[itemIndex].quantity <= 0) {
                cartState.splice(itemIndex, 1);
            }
            updateCartUI();
        }
    };

    // 移除購物車商品
    window.removeCartItem = function(sku) {
        cartState = cartState.filter(item => item.sku !== sku);
        updateCartUI();
    };

    // 重新渲染購物車畫面與計算總額
    function updateCartUI() {
        const container = document.getElementById('cart-items-container');
        const cartCountBadge = document.getElementById('cart-count');
        const subtotalEl = document.getElementById('cart-subtotal');
        const totalEl = document.getElementById('cart-total');

        // 1. 更新導覽列購物車數量標籤
        const totalItems = cartState.reduce((sum, item) => sum + item.quantity, 0);
        if (totalItems > 0) {
            cartCountBadge.textContent = totalItems;
            cartCountBadge.classList.remove('hidden');
        } else {
            cartCountBadge.classList.add('hidden');
        }

        // 2. 計算商品總額 (PRD: items_amount 必須為整數)
        const itemsAmount = parseInt(cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0));

        subtotalEl.textContent = `NT$ ${itemsAmount.toLocaleString()}`;
        totalEl.textContent = `NT$ ${itemsAmount.toLocaleString()}`; // 結帳前預設等於小計

        // 3. 渲染商品列表
        if (cartState.length === 0) {
            container.innerHTML = `<div class="text-center py-12 text-zera-black/50 text-sm italic">您的購物車目前沒有任何商品。</div>`;
            return;
        }

        container.innerHTML = cartState.map(item => `
            <div class="flex flex-col md:grid md:grid-cols-12 gap-4 items-start md:items-center py-4 border-b border-zera-tan/10 relative">
                <!-- 刪除按鈕 (手機版顯示於右上, 電腦版於左側) -->
                <button onclick="removeCartItem('${item.sku}')" class="absolute top-4 right-0 md:relative md:top-auto md:right-auto md:col-span-1 text-zera-black/40 hover:text-red-800 transition-colors">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <!-- 商品資訊 -->
                <div class="col-span-5 flex gap-4 w-full">
                    <div class="w-20 h-20 bg-white rounded-lg border border-zera-tan/10 overflow-hidden flex-shrink-0">
                        <img src="${item.img}" class="w-full h-full object-contain p-1" alt="${item.name}">
                    </div>
                    <div class="flex flex-col justify-center pr-6">
                        <h4 class="text-sm font-bold text-zera-black line-clamp-1">${item.name}</h4>
                        <p class="text-xs text-zera-black/60 mt-1">規格: ${item.variant}</p>
                        <p class="text-[10px] font-serif text-zera-black/40 mt-1 tracking-widest">SKU: ${item.sku}</p>
                    </div>
                </div>

                <!-- 單價 (手機版隱藏) -->
                <div class="col-span-2 text-center hidden md:block font-serif text-sm">
                    NT$ ${item.price.toLocaleString()}
                </div>

                <!-- 數量控制 -->
                <div class="col-span-2 flex items-center justify-start md:justify-center w-full mt-2 md:mt-0">
                    <div class="flex items-center border border-zera-tan/30 rounded-full px-2 py-1">
                        <button onclick="changeCartQuantity('${item.sku}', -1)" class="w-6 h-6 flex items-center justify-center text-zera-black hover:text-zera-tan focus:outline-none">-</button>
                        <span class="w-8 text-center text-xs font-serif">${item.quantity}</span>
                        <button onclick="changeCartQuantity('${item.sku}', 1)" class="w-6 h-6 flex items-center justify-center text-zera-black hover:text-zera-tan focus:outline-none">+</button>
                    </div>
                </div>

                <!-- 小計 (手機版顯示於右下) -->
                <div class="col-span-2 text-right font-serif text-sm font-bold text-zera-tan absolute bottom-4 right-0 md:relative md:bottom-auto md:right-auto md:mt-0">
                    NT$ ${(item.price * item.quantity).toLocaleString()}
                </div>
            </div>
        `).join('');
    }

document.addEventListener('DOMContentLoaded', () => {
// ==========================================
    // 0. 多國語言字典 (i18n Dictionary) 與 切換邏輯
    // ==========================================
    const i18nDictionary = {
        'zh-TW': {
            'nav_member': '會員中心',
            'nav_brand': '品牌美學',
            'nav_news': '最新消息',
            'nav_products': '探索系列',
            'nav_delivery': '大型商品預約配送',
            'nav_contact': '聯絡我們',
            'hero_title': '為您的高貴夥伴<br><span class="text-zera-tan">打造極致生活</span>',
            'hero_desc': 'ZERA 融匯杜賓之堅毅與邊牧之靈動，以極致美學，為您的摯愛寫下溫潤生活的篇章。',
            'btn_checkout': '前往結帳 Checkout',
            'section_news_title': 'LATEST NEWS / 最新消息',
            'news_1_title': '四季通用機能外出系列全新上市',
            'news_1_desc': '專為四季設計的防風防暴雨寵物雨衣，使用科技防水複合布料及塗層，現已開放預訂。',
            'news_2_title': 'ZERA會籍權益全面升級公告',
            'news_2_desc': '即日起，所有會員將享有超商取貨『無條件免運』優惠。待會員系統全面上線，過去累積的消費紀錄，對應的會員福利回饋均會無損延續。',
            'news_3_title': 'ZERA 品牌寵物用品預訂網站上線',
            'news_3_desc': '結合各大品管優良工廠，產品經過多次質量實測。僅接受預訂訂單，需等待10~15日。',
            'section_products_title': '探索精品系列',
            'search_placeholder': '搜尋當前分類產品名稱或描述...',
            'sort_default': '預設順序',
            'sort_price_desc': '價格：由高至低',
            'sort_price_asc': '價格：由低至高',
            'no_products_found': '沒有找到符合當前條件的精品。',
            'btn_buy_now': '立即購買',
            'btn_add_to_cart': '加入購物車 Add to Cart',
            'modal_quantity': 'Quantity',
            'section_bespoke_title': '大型商品配送 / 預約服務',
            'bespoke_desc': '【大型特殊商品包裹】<br>ZERA 提供之部分商品，因體積重量超出一般快遞限制，或商品性質須經由冷鏈運輸、裝釘木架加強包裝等特殊服務，請聯繫客服為您安排專屬物流，為您爭取最划算運費。',
            'btn_bespoke_reserve': '前往諮詢預約',
            'footer_about_title': '關於 ZERA',
            'footer_about_desc': 'ZERA 之名，源於杜賓 Zeus 與邊牧 Vira 的靈魂共鳴。我們創立之初衷，乃是渴望將精緻細膩的照護哲學，化作平實優雅的可能，讓摯愛伴侶在每一刻陪伴中，皆能享有頂級生活之品質與尊榮。',
            'footer_contact_title': '聯絡我們',
            'footer_service_hours': '服務時間：週一至週五 8:00 - 18:00',
            'footer_service_note': '平日若遇國定假日或公休則彈性回覆',
            'footer_line': '官方 LINE: @117erntk'
        },
        'en-US': {
            'nav_member': 'Member Center',
            'nav_brand': 'Brand Story',
            'nav_news': 'Latest News',
            'nav_products': 'Collections',
            'nav_delivery': 'Bespoke Delivery',
            'nav_contact': 'Contact Us',
            'hero_title': 'For Your Noble Companion<br><span class="text-zera-tan">The Ultimate Lifestyle</span>',
            'hero_desc': 'ZERA blends the resilience of a Doberman with the agility of a Border Collie, writing a chapter of elegant living for your beloved with ultimate aesthetics.',
            'btn_checkout': 'Proceed to Checkout',
            'section_news_title': 'LATEST NEWS',
            'news_1_title': 'All-Season Functional Outdoor Collection Now Available',
            'news_1_desc': 'Windproof and stormproof pet raincoats designed for all seasons, featuring high-tech waterproof composite fabrics and coatings. Now open for pre-order.',
            'news_2_title': 'ZERA Membership Benefits Upgrade Announcement',
            'news_2_desc': 'Effective immediately, all members enjoy unconditional free shipping for convenience store pickup. Once the membership system is fully launched, all past spending records and corresponding benefits will carry over seamlessly.',
            'news_3_title': 'ZERA Premium Pet Supplies Pre-Order Website is Live',
            'news_3_desc': 'Partnering with top-tier quality-controlled factories, our products undergo rigorous testing. Pre-orders only; estimated wait time is 10-15 days.',
            'section_products_title': 'EXPLORE PREMIUM COLLECTIONS',
            'search_placeholder': 'Search product names or descriptions...',
            'sort_default': 'Default Sorting',
            'sort_price_desc': 'Price: High to Low',
            'sort_price_asc': 'Price: Low to High',
            'no_products_found': 'No premium products found matching the current criteria.',
            'btn_buy_now': 'Buy Now',
            'btn_add_to_cart': 'Add to Cart',
            'modal_quantity': 'Quantity',
            'section_bespoke_title': 'Bespoke Delivery / Reservation Service',
            'bespoke_desc': '[Large/Special Parcels]<br>Due to size, weight, or special requirements (e.g., cold chain transit, wooden crating), certain ZERA products exceed standard shipping limits. Please contact customer service to arrange specialized logistics and secure the best shipping rates.',
            'btn_bespoke_reserve': 'Contact to Reserve',
            'footer_about_title': 'About ZERA',
            'footer_about_desc': 'The name ZERA originates from the soul resonance between Zeus the Doberman and Vira the Border Collie. Our founding mission is to transform the philosophy of exquisite and meticulous care into an elegant reality, ensuring your beloved companions enjoy top-tier quality and prestige in every moment shared.',
            'footer_contact_title': 'Contact Us',
            'footer_service_hours': 'Service Hours: Mon - Fri 8:00 AM - 6:00 PM',
            'footer_service_note': 'Flexible responses during national holidays or non-working days.',
            'footer_line': 'Official LINE: @117erntk'
        }
    };

    let currentLang = localStorage.getItem('zera_lang') || 'zh-TW';

    window.switchLanguage = function(lang, isInitialLoad = false) {
        currentLang = lang;
        localStorage.setItem('zera_lang', lang);
        
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (i18nDictionary[lang] && i18nDictionary[lang][key]) {
                el.innerHTML = i18nDictionary[lang][key]; 
            }
        });

        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (i18nDictionary[lang] && i18nDictionary[lang][key]) {
                el.placeholder = i18nDictionary[lang][key];
            }
        });

        // 防呆機制：如果是初次載入，不強制重繪產品列表 (交給 Google Sheets API 自己接手)
        if (!isInitialLoad && typeof renderProducts === 'function') {
            renderProducts();
        }
    };

    const langSelect = document.getElementById('lang-switch');
    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener('change', (e) => {
            switchLanguage(e.target.value, false);
        });
    }

    // 初次載入只翻譯靜態結構，不觸發 renderProducts 避免報錯
    switchLanguage(currentLang, true);

    // ==========================================
    // 0. 初始化 Supabase 客戶端
    // ==========================================
    const SUPABASE_URL = 'https://gmoumuxmbbagjgwnevss.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_4_-jBNZHWDD7Imp6GKkXXg_6FxxtOyP';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    async function checkSession() {
        try {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('讀取登入狀態失敗：', error);
                return;
            }

            if (session) {
                currentUser = session.user;
                await fetchAndRenderMemberData(currentUser.id, currentUser.email);
            }
        } catch (error) {
            console.error('檢查登入狀態時發生錯誤：', error);
        }
    }

    checkSession();

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
            } else if (targetId === 'member-view' && currentUser) {
                showLoader();
                setTimeout(() => hideLoader(), 600);
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
            const registerFields = document.getElementById('register-fields');
            const phoneInput = document.getElementById('auth-phone');
            const petInput = document.getElementById('auth-pet-preference');

            if (isLoginMode) {
                title.textContent = 'Member Login';
                subtitle.textContent = '歡迎回到 ZERA，請登入您的專屬帳戶';
                submitBtn.textContent = 'Sign In';
                toggleText.textContent = '還沒有帳號嗎？';
                toggleAuthBtn.textContent = '立即註冊';
                forgotPasswordWrap.classList.remove('hidden');
                registerFields.classList.add('hidden');
                phoneInput.required = false;
                petInput.required = false;
            } else {
                title.textContent = 'Create Account';
                subtitle.textContent = '加入 ZERA，為您的高貴夥伴開啟極致生活';
                submitBtn.textContent = 'Register';
                toggleText.textContent = '已經擁有帳號？';
                toggleAuthBtn.textContent = '立即登入';
                forgotPasswordWrap.classList.add('hidden');
                registerFields.classList.remove('hidden');
                phoneInput.required = true;
                petInput.required = true;
            }
        });
    }

    // ==========================================
    // 密碼揭露按鈕邏輯
    // ==========================================
    const togglePwdBtn = document.getElementById('toggle-password-btn');
    const pwdInput = document.getElementById('auth-password');
    const eyeClosed = document.getElementById('eye-closed-icon');
    const eyeOpen = document.getElementById('eye-open-icon');

    if (togglePwdBtn && pwdInput) {
        togglePwdBtn.addEventListener('click', () => {
            if (pwdInput.type === 'password') {
                pwdInput.type = 'text';
                eyeClosed.classList.add('hidden');
                eyeClosed.classList.remove('block');
                eyeOpen.classList.remove('hidden');
                eyeOpen.classList.add('block');
            } else {
                pwdInput.type = 'password';
                eyeOpen.classList.add('hidden');
                eyeOpen.classList.remove('block');
                eyeClosed.classList.remove('hidden');
                eyeClosed.classList.add('block');
            }
        });
    }

    // ==========================================
    // 未登入攔截 Modal 邏輯
    // ==========================================
    const closePromptBtn = document.querySelector('[data-action="close-auth-prompt"]');
    const goToAuthBtn = document.getElementById('go-to-auth-btn');
    const authPromptModal = document.getElementById('auth-prompt-modal');
    const authPromptContent = document.getElementById('auth-prompt-content');

    function closeAuthPrompt() {
        authPromptModal.classList.add('opacity-0');
        authPromptContent.classList.remove('scale-100', 'opacity-100');
        authPromptContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => {
            authPromptModal.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    }

    if (closePromptBtn) closePromptBtn.addEventListener('click', closeAuthPrompt);
    if (authPromptModal) {
        authPromptModal.addEventListener('click', (e) => {
            if (e.target === authPromptModal) closeAuthPrompt();
        });
    }

    if (goToAuthBtn) {
        goToAuthBtn.addEventListener('click', () => {
            closeAuthPrompt();
            
            // 隱藏所有視圖
            document.querySelectorAll('.view-section').forEach(section => {
                section.classList.remove('block');
                section.classList.add('hidden');
            });

            // 強制顯示登入視圖
            const authView = document.getElementById('auth-view');
            if (authView) {
                authView.classList.remove('hidden');
                authView.classList.add('block');
            }

            // 確保收合手機選單並滾動至頂部
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ==========================================
    // 1.6 串接 Supabase Auth API
    // ==========================================
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('auth-submit-btn');
            const email = document.getElementById('auth-email').value;
            const password = document.getElementById('auth-password').value;

            submitBtn.disabled = true;
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '處理中 Processing...';
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            try {
                if (isLoginMode) {
                    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                    if (error) throw error;

                    currentUser = data.user;
                    await fetchAndRenderMemberData(currentUser.id, currentUser.email);
                    alert('登入成功！歡迎回到 ZERA。');
                } else {
                    const phone = document.getElementById('auth-phone').value;
                    const petPref = document.getElementById('auth-pet-preference').value;
                    if (!phone || !petPref) {
                        throw new Error('請填寫手機號碼與寵物夥伴類型');
                    }

                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email,
                        password,
                        options: {
                            data: {
                                phone_number: phone,
                                pet_preference: petPref
                            }
                        }
                    });
                    if (authError) throw authError;

                    currentUser = authData.user;
                    if (currentUser) {
                        await fetchAndRenderMemberData(currentUser.id, currentUser.email);
                    }
                    alert('註冊成功！已為您開啟專屬會員權益。');
                }

                authForm.reset();
                document.querySelector('[data-view-target="member-view"]').click();
            } catch (error) {
                let errorMsg = error.message;
                if (errorMsg.includes('Invalid login credentials')) errorMsg = '帳號或密碼錯誤。';
                if (errorMsg.includes('User already registered')) errorMsg = '此 Email 已經註冊過了。';
                if (errorMsg.includes('duplicate key value violates unique constraint "members_phone_number_key"')) {
                    errorMsg = '此手機號碼已被使用。';
                }
                alert(`發生錯誤：${errorMsg}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }

    // ==========================================
    // 輔助函數：計算 4 階段非線性進度條百分比
    // ==========================================
    function calculateProgressWidth(spent) {
        if (spent <= 0) return 0;
        if (spent >= 10000) return 100;

        if (spent <= 500) {
            return (spent / 500) * 25;
        } else if (spent <= 1000) {
            return 25 + ((spent - 500) / 500) * 25;
        } else if (spent <= 3000) {
            return 50 + ((spent - 1000) / 2000) * 25;
        }
        return 75 + ((spent - 3000) / 7000) * 25;
    }

    // ==========================================
    // 輔助函數：切換進度條的高亮與灰底白字狀態
    // ==========================================
    function applyProgressStyle(type, isActive) {
        const wrap = document.getElementById(`${type}-progress-wrap`);
        if (!wrap) return;

        const bar = document.getElementById(`${type}-progress-bar`);
        const title = wrap.querySelector(`.${type}-text-title`);
        const value = wrap.querySelector(`.${type}-text-value`);
        const nodes = wrap.querySelector(`.${type}-text-nodes`);
        const badge = document.getElementById(`${type}-tier-badge`);
        const track = wrap.querySelector('.progress-track');
        if (bar) bar.style.width = '0%';

        if (isActive) {
            wrap.className = 'transition-all duration-300 p-4 bg-zera-charcoal rounded-xl shadow-md border border-zera-tan/20 mt-2';
            if (title) title.className = `text-[10px] tracking-widest font-bold ${type}-text-title text-[#C6A87C] uppercase`;
            if (value) value.className = `text-[10px] font-serif ${type}-text-value text-zera-cream`;
            if (nodes) nodes.className = `flex justify-between text-[8.5px] mt-1.5 font-serif tracking-wider ${type}-text-nodes text-zera-cream/60`;
            if (bar) bar.className = 'absolute top-0 left-0 h-full rounded-full transition-all duration-1000 bg-[#C6A87C] shadow-[0_0_8px_rgba(198,168,124,0.4)] w-0';
            if (track) track.className = 'progress-track relative w-full h-1.5 bg-white/10 rounded-full overflow-hidden';
            if (badge) badge.className = 'bg-black text-[#C6A87C] border border-[#C6A87C]/30 text-[9px] px-2 py-0.5 rounded-full tracking-widest font-serif transition-colors whitespace-nowrap';
        } else {
            wrap.className = 'transition-all duration-300 p-4 bg-neutral-400 rounded-xl opacity-80 mt-2';
            if (title) title.className = `text-[10px] tracking-widest font-bold ${type}-text-title text-white uppercase`;
            if (value) value.className = `text-[10px] font-serif ${type}-text-value text-white`;
            if (nodes) nodes.className = `flex justify-between text-[8.5px] mt-1.5 font-serif tracking-wider ${type}-text-nodes text-white/80`;
            if (bar) bar.className = 'absolute top-0 left-0 h-full rounded-full transition-all duration-1000 bg-white/90 shadow-sm w-0';
            if (track) track.className = 'progress-track relative w-full h-1.5 bg-black/10 rounded-full overflow-hidden';
            if (badge) badge.className = 'bg-black/20 text-white text-[9px] px-2 py-0.5 rounded-full tracking-widest font-serif transition-colors whitespace-nowrap';
        }
    }

    function getTierTitle(type, spent) {
        const titles = type === 'dog'
            ? ['狗奴才', '吉娃娃', '哈士奇', '狼王']
            : ['貓奴才', '咪咪', '虎', '獅王'];
        const tierIndex = spent >= 3000 ? 3 : spent >= 1000 ? 2 : spent >= 500 ? 1 : 0;
        return titles[tierIndex];
    }

    // ==========================================
    // 獲取並渲染會員中心資料
    // ==========================================
    async function fetchAndRenderMemberData(userId, email) {
        try {
            const { data: memberData, error: memberError } = await supabase
                .from('members')
                .select('phone_number, tier, pet_preference, total_spent, reward_points')
                .eq('id', userId)
                .single();

            if (memberError) throw memberError;

            if (memberData) {
                const namePrefix = email ? email.split('@')[0] : '會員';
                const memberNameDisplay = document.getElementById('member-name-display');
                if (memberNameDisplay) memberNameDisplay.textContent = namePrefix;

                const totalSpentDisplay = document.getElementById('member-total-spent');
                const rewardPointsDisplay = document.getElementById('member-reward-points');
                const totalSpent = Number(memberData.total_spent) || 0;
                const rewardPoints = Number(memberData.reward_points) || 0;
                if (totalSpentDisplay) totalSpentDisplay.textContent = `NT$ ${totalSpent.toLocaleString()}`;
                if (rewardPointsDisplay) {
                    rewardPointsDisplay.innerHTML = `${rewardPoints.toLocaleString()} <span class="text-[10px] sm:text-xs">pts</span>`;
                }

                // 2. 嘗試獲取訂單來計算 D/C/E 並動態渲染歷史訂單
                // ★ 注意：這裡改成 select('*') 以獲取完整訂單欄位，並照建立時間倒序
                const { data: ordersData, error: ordersError } = await supabase
                    .from('orders')
                    .select('*')
                    .eq('member_id', userId)
                    .order('created_at', { ascending: false });

                if (ordersError) console.warn('讀取訂單發生權限錯誤:', ordersError.message);

                currentOrdersData = ordersData || [];

                let dogSpent = 0;
                let catSpent = 0;

                const ordersContainer = document.getElementById('member-orders-container');
                if (ordersContainer) {
                    if (!ordersData || ordersData.length === 0) {
                        ordersContainer.innerHTML = '<p class="text-center py-8 text-zera-black/50 text-sm italic">目前尚無歷史訂單。</p>';
                    } else {
                        let html = '';
                        ordersData.forEach(order => {
                            // 計算進度條額度
                            const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
                            items.forEach(item => {
                                const prefix = (item.product_id || item.sku || '').charAt(0).toUpperCase();
                                const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
                                if (prefix === 'D') dogSpent += lineTotal;
                                else if (prefix === 'C') catSpent += lineTotal;
                                else if (prefix === 'E') { dogSpent += (lineTotal / 2); catSpent += (lineTotal / 2); }
                            });

                            // 渲染歷史訂單列表
                            const itemNames = items.map(i => i.name).join('、');
                            const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

                            const isUnpaid = order.status === '未結帳';
                            const statusClass = isUnpaid ? 'bg-red-800 text-white' : (order.status === '已完成' ? 'bg-zera-cream text-zera-black/50' : 'bg-zera-tan text-zera-cream');

                            const dateObj = new Date(order.created_at);
                            const dateStr = isNaN(dateObj) ? '' : `${dateObj.getFullYear()}.${String(dateObj.getMonth()+1).padStart(2,'0')}.${String(dateObj.getDate()).padStart(2,'0')} ${String(dateObj.getHours()).padStart(2,'0')}:${String(dateObj.getMinutes()).padStart(2,'0')}`;

                            html += `
                                <div class="bg-white rounded-2xl border ${isUnpaid ? 'border-red-800/40 shadow-md' : 'border-zera-tan/10'} p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-all duration-300">
                                    <div class="flex-1 min-w-0 w-full">
                                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                                            <span class="font-serif text-sm font-bold tracking-wider ${isUnpaid ? 'text-red-800' : 'text-zera-black'}">#${order.order_id}</span>
                                            <span class="text-[10px] px-2 py-0.5 rounded-sm tracking-widest ${statusClass}">${order.status}</span>
                                            ${isUnpaid ? '<span class="text-xs text-red-800 font-bold animate-pulse inline-block">請盡速完成結帳</span>' : ''}
                                        </div>
                                        <p class="text-xs text-zera-black/50 mb-1">${dateStr} 成立</p>
                                        <p class="text-sm text-zera-black mt-2 truncate">${itemNames} 等 ${itemCount} 件商品</p>
                                    </div>
                                    <div class="w-full md:w-auto flex flex-row md:flex-col items-center justify-between md:items-end gap-3 border-t md:border-t-0 border-zera-cream pt-4 md:pt-0 shrink-0">
                                        <span class="font-serif text-lg ${isUnpaid ? 'text-red-800' : 'text-zera-black/80'}">NT$ ${order.items_amount.toLocaleString()}</span>
                                        ${isUnpaid
                                            ? `<button onclick="window.resumePayment('${order.order_id}', ${order.items_amount})" class="text-xs border border-red-800 bg-red-800 text-white hover:bg-white hover:text-red-800 px-6 py-2 rounded-full transition-colors font-bold tracking-widest shadow-sm">前往結帳</button>
                                               <button onclick="window.openOrderDetails('${order.order_id}')" class="text-[10px] text-zera-black/50 hover:text-zera-black underline tracking-widest mt-1">查看詳情</button>`
                                            : `<button onclick="window.openOrderDetails('${order.order_id}')" class="text-xs border border-zera-tan/40 text-zera-black/60 hover:bg-zera-tan hover:text-zera-cream px-5 py-1.5 rounded-full transition-colors tracking-widest">查看詳情</button>`
                                        }
                                    </div>
                                </div>
                            `;
                        });
                        ordersContainer.innerHTML = html;
                    }
                }

                console.log(`[會員狀態] 總額: ${totalSpent}, 狗派貢獻: ${dogSpent}, 貓派貢獻: ${catSpent}`);

                const dogProgressValue = document.getElementById('dog-progress-value');
                const catProgressValue = document.getElementById('cat-progress-value');
                const dogTierBadge = document.getElementById('dog-tier-badge');
                const catTierBadge = document.getElementById('cat-tier-badge');
                const dogProgressBar = document.getElementById('dog-progress-bar');
                const catProgressBar = document.getElementById('cat-progress-bar');

                if (dogTierBadge) dogTierBadge.textContent = getTierTitle('dog', dogSpent);
                if (catTierBadge) catTierBadge.textContent = getTierTitle('cat', catSpent);

                if (dogProgressValue) dogProgressValue.textContent = `${Math.floor(dogSpent).toLocaleString()} / 10,000`;
                if (catProgressValue) catProgressValue.textContent = `${Math.floor(catSpent).toLocaleString()} / 10,000`;

                const dogProgressPercent = calculateProgressWidth(dogSpent);
                const catProgressPercent = calculateProgressWidth(catSpent);

                if (memberData.pet_preference === '狗派') {
                    applyProgressStyle('dog', true);
                    applyProgressStyle('cat', false);
                } else if (memberData.pet_preference === '貓派') {
                    applyProgressStyle('dog', false);
                    applyProgressStyle('cat', true);
                } else {
                    applyProgressStyle('dog', true);
                    applyProgressStyle('cat', true);
                }

                window.setTimeout(() => {
                    if (dogProgressBar) dogProgressBar.style.width = `${dogProgressPercent}%`;
                    if (catProgressBar) catProgressBar.style.width = `${catProgressPercent}%`;
                }, 100);
            }
        } catch (error) {
            console.error('無法獲取會員詳細資料:', error.message);
        }
    }

    // ==========================================
    // 2. 登出邏輯 (Logout)
    // ==========================================
    const logoutBtn = document.querySelector('[data-action="logout"]');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!confirm('確定要登出您的帳號嗎？')) return;

            const { error } = await supabase.auth.signOut();
            if (error) {
                alert(`登出失敗：${error.message}`);
                return;
            }

            currentUser = null;
            cartState = [];
            updateCartUI();
            alert('您已成功登出。');
            document.querySelector('[data-view-target="home-view"]').click();
        });
    }

    // ==========================================
    // 3. 商品資料獲取 (模擬 Google Sheets API)
    // ==========================================
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    function renderProducts() {
        const grid = document.getElementById('product-grid');
        if (!grid) return;

        // 1. 類別過濾
        let items = allProducts.filter(product => product.sub_code === state.category);

        // 2. 搜尋過濾
        if (state.searchQuery) {
            items = items.filter(p =>
                p.name.toLowerCase().includes(state.searchQuery) ||
                (p.desc && p.desc.toLowerCase().includes(state.searchQuery))
            );
        }

        // 3. 價格排序
        if (state.sortOrder === 'price-desc') {
            items.sort((a, b) => b.price - a.price);
        } else if (state.sortOrder === 'price-asc') {
            items.sort((a, b) => a.price - b.price);
        }

        currentRenderedItems = items;

        if (items.length === 0) {
            grid.innerHTML = `<div class="col-span-1 sm:col-span-2 md:col-span-4 text-center py-12 text-zera-black/50 text-sm">${i18nDictionary[currentLang]['no_products_found']}</div>`;
            return;
        }

        grid.innerHTML = items.map((p, itemIndex) => {
            const imageSlides = p.images.map((imgUrl, imgIndex) => `
                <img src="${imgUrl}" alt="${p.name}" loading="lazy" onclick="openLightbox(${itemIndex}, ${imgIndex})" class="flex-none w-full h-full object-cover snap-center bg-zera-cream/50 cursor-zoom-in hover:opacity-90 transition-opacity" />
            `).join('');

            return `
            <div class="bg-white p-5 rounded-3xl border border-zera-tan/10 shadow-sm text-zera-black hover:shadow-md transition-shadow flex flex-col items-center">
                
                <div class="h-48 sm:h-56 w-full rounded-2xl mb-5 overflow-hidden relative group">
                    <div class="flex overflow-x-auto snap-x snap-mandatory h-full w-full hide-scrollbar">
                        ${imageSlides}
                    </div>
                    <div class="absolute bottom-2 left-0 w-full flex justify-center gap-1.5 pointer-events-none opacity-60">
                        ${p.images.map(() => `<div class="w-1.5 h-1.5 rounded-full bg-zera-cream shadow-sm border border-zera-black/10"></div>`).join('')}
                    </div>
                </div>

                <div class="w-full text-left">
                    <h3 class="text-sm font-bold mb-1 line-clamp-1">${p.name}</h3>
                    <p class="text-zera-black/60 text-[11px] mb-5 line-clamp-2 leading-relaxed">${p.desc}</p>
                </div>
                
                <div class="mt-auto w-full flex items-center justify-between border-t border-zera-cream pt-4">
                    <div class="text-zera-tan font-semibold text-sm tracking-wide">NT$ ${p.displayPrice}</div>
                    <button onclick="openProductModal('${p.id}')" class="bg-[#C6A87C] hover:bg-[#B59567] text-white text-[11px] px-4 py-1.5 rounded-full transition-colors font-medium tracking-wider shadow-sm focus:outline-none">${i18nDictionary[currentLang]['btn_buy_now']}</button>
                </div>
            </div>
        `}).join('');
    }

    // ==========================================
    // 分類選單邏輯
    // ==========================================
    window.handleCategoryClick = function(category) {
        state.category = category;
        state.searchQuery = '';
        state.sortOrder = 'default';
        
        const searchInput = document.getElementById('searchInput');
        const sortSelect = document.getElementById('sortSelect');
        if (searchInput) searchInput.value = '';
        if (sortSelect) sortSelect.value = 'default';
        
        renderCategoryButtons();
        renderProducts();
    };

    function renderCategoryButtons() {
        const container = document.getElementById('category-buttons-container');
        if (!container) return;
        
        container.innerHTML = availableCategories.map(cat => {
            const isActive = state.category === cat;
            const activeStyle = "bg-zera-tan text-zera-cream border-zera-tan shadow-md";
            const inactiveStyle = "bg-white text-zera-black border-zera-tan/30 hover:bg-zera-cream hover:border-zera-tan/60";
            
            return `
                <button onclick="handleCategoryClick('${cat}')" class="px-5 py-2 text-xs sm:text-sm font-medium rounded-full border transition-all duration-300 ${isActive ? activeStyle : inactiveStyle}">
                    ${cat}
                </button>
            `;
        }).join('');
    }

    // ==========================================
    // 3. 商品資料獲取 (連接 Google Sheets API)
    // ==========================================
    async function fetchProductsData() {
        try {
            // ★ 請將下方引號內的網址替換為您在 Apps Script 複製的 Web app URL
            const GOOGLE_SHEET_API_URL = 'https://script.google.com/macros/s/AKfycbzVSFUDfgg2bLukXF-rSHlnhg_jX3UkmejTnoFM3WsV_ETot6wuEFsWcpy9oFX9ggI3RQ/exec';
            
            const response = await fetch(GOOGLE_SHEET_API_URL);
            const rawData = await response.json();
            
            // 將 Google Sheets 的扁平資料結構，轉換為前端所需的結構 (包含拆分 variants)
            allProducts = rawData.map(row => {
                
                // 將逗號分隔的 SKU_ID 與 size_color 拆解為陣列
                const skuOptions = row.SKU_ID ? String(row.SKU_ID).split(',') : [];
                const colorOptions = row.size_color ? String(row.size_color).split(',') : [];
                
                // 重組 variants 物件，供 Modal 規格選擇器使用
                const variants = {};
                if (colorOptions.length > 0) {
                    variants['規格'] = colorOptions; // 您可依需求將此標籤改為「顏色」或「尺寸」
                }

                // 處理價格 (若表格中有包含逗號，需先移除逗號再轉數字)
                const priceOptions = String(row.price).split(',').map(p => parseInt(p.replace(/[^0-9]/g, ''), 10) || 0);
                
                // 計算列表顯示用的價格字串 (單一價格或區間)
                let displayPriceStr = '';
                if (priceOptions.length > 1) {
                    const minPrice = Math.min(...priceOptions);
                    const maxPrice = Math.max(...priceOptions);
                    displayPriceStr = minPrice === maxPrice ? minPrice.toLocaleString() : `${minPrice.toLocaleString()} ~ ${maxPrice.toLocaleString()}`;
                } else {
                    displayPriceStr = priceOptions[0].toLocaleString();
                }

                return {
                    id: row.product_ID,
                    category_code: 'PET',
                    sub_code: row.sub_code,
                    name: row.name,
                    desc: row.desc,
                    prices: priceOptions,       // 儲存價格陣列
                    displayPrice: displayPriceStr, // 儲存顯示字串
                    price: priceOptions[0],     // 預設價格
                    images: [row.images],
                    raw_skus: skuOptions,
                    variants: variants
                };
            });
            
            // 萃取所有不重複的子類別作為分類按鈕，並過濾掉空值
            availableCategories = [...new Set(allProducts.map(product => product.sub_code).filter(Boolean))];

            // 預設選中第一個分類 (例如 OUT)
            if (availableCategories.length > 0 && !state.category) {
                state.category = availableCategories[0];
            }

            renderCategoryButtons();
            renderProducts();

        } catch (error) {
            console.error('商品資料載入失敗:', error);
            // 失敗時的防呆顯示
            document.getElementById('product-grid').innerHTML = `<div class="col-span-full text-center py-12 text-red-800 text-sm">無法載入商品資料，請稍後再試。</div>`;
        } finally {
            hideLoader(); // 初始化資料抓取完畢，隱藏 Loader
        }
    }
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.toLowerCase().trim();
            renderProducts();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.sortOrder = e.target.value;
            renderProducts();
        });
    }
    fetchProductsData();

    // ==========================================
    // 4. Product Modal (規格選擇器) 邏輯
    // ==========================================
    const modalEl = document.getElementById('product-modal');
    const modalContent = document.getElementById('product-modal-content');
    const closeProductModalButton = document.querySelector('[data-action="close-product-modal"]');
    const modalVariantsContainer = document.getElementById('modal-variants-container');
    const modalQtyValue = document.getElementById('modal-qty-value');
    const modalAddToCartButton = document.getElementById('modal-add-to-cart-btn');

    window.openProductModal = function(productId) {
        // 攔截：未登入時跳出提示 Modal，終止後續開啟商品規格的動作
        if (!currentUser) {
            const promptModal = document.getElementById('auth-prompt-modal');
            const promptContent = document.getElementById('auth-prompt-content');
            promptModal.classList.remove('hidden');
            void promptModal.offsetWidth;
            promptModal.classList.remove('opacity-0');
            promptContent.classList.remove('scale-95', 'opacity-0');
            promptContent.classList.add('scale-100', 'opacity-100');
            document.body.style.overflow = 'hidden';
            return;
        }

        currentModalProduct = allProducts.find(product => product.id === productId);
        if (!currentModalProduct || !modalEl || !modalContent) return;

        currentModalSelections = {};
        currentModalQty = 1;
        if (modalQtyValue) modalQtyValue.textContent = currentModalQty;

        if (currentModalProduct.variants) {
            Object.entries(currentModalProduct.variants).forEach(([variantName, options]) => {
                if (options.length > 0) currentModalSelections[variantName] = options[0];
            });
        }

        renderModalUI();
        modalEl.classList.remove('hidden');
        void modalEl.offsetWidth;
        modalEl.classList.remove('opacity-0');
        modalContent.classList.remove('translate-y-full', 'md:translate-y-8', 'opacity-0');
        modalContent.classList.add('translate-y-0', 'opacity-100');
        document.body.style.overflow = 'hidden';
    };

    window.closeProductModal = function() {
        if (!modalEl || !modalContent) return;

        modalEl.classList.add('opacity-0');
        modalContent.classList.remove('translate-y-0', 'opacity-100');
        modalContent.classList.add('translate-y-full', 'md:translate-y-8', 'opacity-0');
        window.setTimeout(() => {
            modalEl.classList.add('hidden');
            document.body.style.overflow = '';
        }, 300);
    };

    if (closeProductModalButton) {
        closeProductModalButton.addEventListener('click', window.closeProductModal);
    }
    if (modalEl) {
        modalEl.addEventListener('click', event => {
            if (event.target === modalEl) window.closeProductModal();
        });
    }

    function renderModalUI() {
        if (!currentModalProduct) return;

        const modalImage = document.getElementById('modal-img');
        const modalTitle = document.getElementById('modal-title');
        const modalPrice = document.getElementById('modal-price');
        if (modalImage) modalImage.src = currentModalProduct.images[0] || '';
        if (modalTitle) modalTitle.textContent = currentModalProduct.name;

        const prices = currentModalProduct.prices || [currentModalProduct.price];
        let currentPrice = prices[0] ?? currentModalProduct.price;
        if (currentModalProduct.variants) {
            const variantKey = Object.keys(currentModalProduct.variants)[0];
            const selectedOption = currentModalSelections[variantKey];
            const optionIndex = currentModalProduct.variants[variantKey].indexOf(selectedOption);

            if (optionIndex > -1 && prices[optionIndex] !== undefined) {
                currentPrice = prices[optionIndex];
            }
        }

        currentModalProduct.activePrice = currentPrice;
        if (modalPrice) modalPrice.textContent = `NT$ ${currentPrice.toLocaleString()}`;
        if (!modalVariantsContainer) return;

        modalVariantsContainer.replaceChildren();
        if (!currentModalProduct.variants) return;

        Object.entries(currentModalProduct.variants).forEach(([variantName, options]) => {
            const group = document.createElement('div');
            const label = document.createElement('span');
            label.className = 'text-xs font-bold tracking-widest text-zera-black/70 mb-3 block';
            label.textContent = variantName;

            const optionsContainer = document.createElement('div');
            optionsContainer.className = 'flex flex-wrap gap-2';

            options.forEach(option => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = 'px-4 py-2 text-xs border rounded-md transition-colors';
                button.textContent = option;
                const selected = currentModalSelections[variantName] === option;
                button.classList.add(...(selected
                    ? ['border-zera-tan', 'bg-zera-tan', 'text-white']
                    : ['border-zera-tan/20', 'text-zera-black/70', 'hover:border-zera-tan']));
                button.addEventListener('click', () => {
                    currentModalSelections[variantName] = option;
                    renderModalUI();
                });
                optionsContainer.append(button);
            });

            group.append(label, optionsContainer);
            modalVariantsContainer.append(group);
        });
    }

    const modalQtyMinus = document.getElementById('modal-qty-minus');
    const modalQtyPlus = document.getElementById('modal-qty-plus');
    if (modalQtyMinus) {
        modalQtyMinus.addEventListener('click', () => {
            if (currentModalQty > 1) {
                currentModalQty--;
                if (modalQtyValue) modalQtyValue.textContent = currentModalQty;
            }
        });
    }
    if (modalQtyPlus) {
        modalQtyPlus.addEventListener('click', () => {
            currentModalQty++;
            if (modalQtyValue) modalQtyValue.textContent = currentModalQty;
        });
    }

    if (modalAddToCartButton) {
        modalAddToCartButton.addEventListener('click', () => {
            if (!currentModalProduct) return;

            const button = modalAddToCartButton;
            button.disabled = true;
            button.textContent = '處理中...';

            const variantValues = Object.values(currentModalSelections);
            const variantSuffix = variantValues.join('-').replace(/\s+/g, '');
            
            // ★ 將 SKU 的第一段改為真實的 product_id (例如 D001, C001)
            const skuParts = [currentModalProduct.id, currentModalProduct.sub_code, variantSuffix].filter(Boolean);
            
            const cartItem = {
                sku: skuParts.join('-'),
                product_id: currentModalProduct.id, // ★ 獨立紀錄 product_id，供結帳寫入與 D/C/E 計算使用
                name: currentModalProduct.name,
                variant: variantValues.join(' / ') || '無規格',
                price: currentModalProduct.activePrice,
                quantity: currentModalQty,
                img: currentModalProduct.images[0] || ''
            };

            addToCart(cartItem);
            window.setTimeout(() => {
                button.disabled = false;
                button.textContent = '加入購物車 Add to Cart';
                window.closeProductModal();
            }, 500);
        });
    }
    
    // ==========================================
    // 5. 會員中心內部標籤切換 (Member Tabs)
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
    // 6. 結帳視圖切換與物流設定 (Checkout & Logistics)
    // ==========================================
    const checkoutBtn = document.getElementById('checkout-btn');
    const logisticsSelect = document.getElementById('logistics-select');
    const cvsSearchArea = document.getElementById('cvs-search-area');
    const homeDeliveryArea = document.getElementById('home-delivery-area');
    const shipAddressInput = document.getElementById('ship-address');
    
    // 儲存用戶最終選定的物流與門市資料
    let selectedShippingMeta = null;

    // A. 購物車點擊「前往結帳」：進行防呆並切換視圖
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (!currentUser) {
                document.getElementById('auth-prompt-modal').classList.remove('hidden');
                document.getElementById('auth-prompt-content').classList.remove('scale-95', 'opacity-0');
                document.getElementById('auth-prompt-content').classList.add('scale-100', 'opacity-100');
                return;
            }
            if (cartState.length === 0) {
                alert('您的購物車目前沒有商品，請先去逛逛吧！');
                return;
            }

            showLoader();
            setTimeout(() => {
                // 跳轉至物流填寫視圖 (checkout-view)
                document.querySelectorAll('.view-section').forEach(sec => {
                    sec.classList.remove('block');
                    sec.classList.add('hidden');
                });
                document.getElementById('checkout-view').classList.remove('hidden');
                document.getElementById('checkout-view').classList.add('block');
                window.scrollTo({ top: 0, behavior: 'smooth' });
                hideLoader();
            }, 600);
        });
    }

    // B. 物流下拉選單切換邏輯
    if (logisticsSelect) {
        logisticsSelect.addEventListener('change', (e) => {
            const method = e.target.value;
            selectedShippingMeta = null; // 重置已選資料
            document.getElementById('cvs-selected-display').classList.add('hidden');
            
            if (method === '7-11' || method === 'FamilyMart') {
                cvsSearchArea.classList.remove('hidden');
                homeDeliveryArea.classList.add('hidden');
                shipAddressInput.required = false;
            } else if (method === 'BlackCat' || method === 'HCT') {
                cvsSearchArea.classList.add('hidden');
                homeDeliveryArea.classList.remove('hidden');
                shipAddressInput.required = true;
            }
        });
    }

    // C. 超商門市 JSON 搜尋邏輯
    const cvsSearchBtn = document.getElementById('cvs-search-btn');
    if (cvsSearchBtn) {
        cvsSearchBtn.addEventListener('click', async () => {
            const keyword = document.getElementById('cvs-keyword').value.trim();
            const method = logisticsSelect.value;
            if (!keyword) {
                alert('請輸入地址、路名或店名關鍵字');
                return;
            }

            cvsSearchBtn.disabled = true;
            cvsSearchBtn.textContent = '搜尋中...';
            
            try {
                // 依據選擇的超商載入對應的新版 JSON 檔案
                const jsonFile = method === '7-11' ? 's_data.json' : 'f_data.json';
                const response = await fetch(jsonFile);
                
                if (!response.ok) throw new Error(`無法讀取門市資料，請確認 ${jsonFile} 檔案是否放置於正確路徑。`);
                const storeList = await response.json();

                // 依據地址、路名或店名過濾
                const results = storeList.filter(store => 
                    (store.address && store.address.includes(keyword)) || 
                    (store.road && store.road.includes(keyword)) ||
                    (store.name && store.name.includes(keyword))
                );

                const container = document.getElementById('cvs-results-container');
                if (results.length === 0) {
                    container.innerHTML = '<p class="text-xs text-red-800 p-2">找不到符合的門市，請嘗試其他關鍵字。</p>';
                } else {
                    container.innerHTML = results.map(store => `
                        <div class="bg-white p-3 rounded-lg border border-zera-tan/20 hover:border-zera-tan cursor-pointer flex justify-between items-center transition-colors cvs-store-item" 
                             data-id="${store.id}" data-name="${store.name}" data-address="${store.address}">
                            <div>
                                <p class="text-sm font-bold text-zera-black">${store.name} <span class="text-[10px] text-zera-black/50 ml-2">ID: ${store.id}</span></p>
                                <p class="text-xs text-zera-black/60 mt-1">${store.address}</p>
                            </div>
                            <button type="button" class="text-xs bg-zera-cream text-zera-tan px-3 py-1 rounded-md shrink-0">選擇</button>
                        </div>
                    `).join('');

                    // 綁定選擇門市事件
                    document.querySelectorAll('.cvs-store-item').forEach(item => {
                        item.addEventListener('click', function() {
                            selectedShippingMeta = {
                                type: method,
                                store_id: this.dataset.id,
                                store_name: this.dataset.name,
                                store_address: this.dataset.address
                            };
                            
                            // 顯示選中的門市並清空列表
                            document.getElementById('cvs-store-name').textContent = `${this.dataset.name} (${this.dataset.id})`;
                            document.getElementById('cvs-store-address').textContent = this.dataset.address;
                            document.getElementById('cvs-selected-display').classList.remove('hidden');
                            container.innerHTML = '';
                        });
                    });
                }
            } catch (error) {
                alert(error.message);
                console.error(error);
            } finally {
                cvsSearchBtn.disabled = false;
                cvsSearchBtn.textContent = '搜尋門市';
            }
        });
    }

    // ==========================================
    // 7. 最終寫入 Supabase 訂單 (Final Submit)
    // ==========================================
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const method = logisticsSelect.value;
            const shipName = document.getElementById('ship-name').value;
            const shipPhone = document.getElementById('ship-phone').value;

            // 驗證是否已確實選擇門市或填寫地址
            if ((method === '7-11' || method === 'FamilyMart') && !selectedShippingMeta) {
                alert('請先搜尋並選擇您要取貨的超商門市。');
                return;
            }

            const submitBtn = document.getElementById('final-submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = '訂單處理中 Processing...';
            submitBtn.classList.add('opacity-70', 'cursor-not-allowed');

            showLoader();
            try {
                const itemsAmount = parseInt(cartState.reduce((sum, item) => sum + (item.price * item.quantity), 0));
                
                const today = new Date();
                const dateStr = today.getFullYear().toString() + 
                               (today.getMonth() + 1).toString().padStart(2, '0') + 
                               today.getDate().toString().padStart(2, '0');
                const randomCode = Math.floor(1000 + Math.random() * 9000); 
                const orderId = `ZR-${dateStr}-${randomCode}`;

                const orderData = {
                    order_id: orderId,
                    member_id: currentUser.id,
                    items_amount: itemsAmount,
                    shipping_fee: 0, 
                    status: '未結帳',
                    items: cartState,
                    recipient_name: shipName,
                    recipient_phone: shipPhone,
                    shipping_method: method,
                    shipping_address: (method === 'BlackCat' || method === 'HCT') ? shipAddressInput.value : selectedShippingMeta.store_address,
                    store_id: selectedShippingMeta ? selectedShippingMeta.store_id : null,
                    store_name: selectedShippingMeta ? selectedShippingMeta.store_name : null,
                    tax_info: { type: "二聯式", status: "pending" }
                };

                const { error: orderError } = await supabase
                    .from('orders')
                    .insert([orderData]);

                if (orderError) throw orderError;

                await fetchAndRenderMemberData(currentUser.id, currentUser.email);
                currentPaymentOrder = { id: orderId, amount: itemsAmount };
                document.getElementById('payment-order-id').textContent = orderId;
                document.getElementById('payment-amount').textContent = `NT$ ${itemsAmount.toLocaleString()}`;

                cartState = [];
                updateCartUI();
                checkoutForm.reset();
                selectedShippingMeta = null;
                const cvsSelectedDisplay = document.getElementById('cvs-selected-display');
                if (cvsSelectedDisplay) cvsSelectedDisplay.classList.add('hidden');

                document.querySelectorAll('.view-section').forEach(sec => {
                    sec.classList.remove('block');
                    sec.classList.add('hidden');
                });
                
                const paymentView = document.getElementById('payment-view');
                if (paymentView) {
                    paymentView.classList.remove('hidden');
                    paymentView.classList.add('block');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });

            } catch (error) {
                console.error('訂單建立失敗:', error);
                alert(`結帳時發生錯誤：${error.message}`);
            } finally {
                hideLoader();
                submitBtn.disabled = false;
                submitBtn.textContent = '確認送出訂單 Submit Order';
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }

// ==========================================
    // 8. 訂單付款邏輯 (Payment Gateway)
    // ==========================================
    const processPaymentBtn = document.getElementById('process-payment-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const paymentMethodSelect = document.getElementById('payment-method-select');
    const bankTransferArea = document.getElementById('bank-transfer-area');
    const copyBankAccBtn = document.getElementById('copy-bank-acc-btn');

    // A. 付款方式切換邏輯
    if (paymentMethodSelect && bankTransferArea) {
        paymentMethodSelect.addEventListener('change', (e) => {
            if (e.target.value === '網銀轉帳') {
                bankTransferArea.classList.remove('hidden');
            } else {
                bankTransferArea.classList.add('hidden');
                document.getElementById('bank-last-5').value = ''; // 切換時清空輸入框
            }
        });
    }

    // B. 一鍵複製帳號邏輯
    if (copyBankAccBtn) {
        copyBankAccBtn.addEventListener('click', () => {
            const accText = document.getElementById('bank-account-text').innerText.replace(/-/g, '');
            navigator.clipboard.writeText(accText).then(() => {
                const originalText = copyBankAccBtn.innerText;
                copyBankAccBtn.innerText = '已複製';
                copyBankAccBtn.classList.add('bg-zera-tan', 'text-white');
                setTimeout(() => {
                    copyBankAccBtn.innerText = originalText;
                    copyBankAccBtn.classList.remove('bg-zera-tan', 'text-white');
                }, 2000);
            }).catch(err => {
                alert('複製失敗，請手動選取複製');
            });
        });
    }

    // C. 確認付款與狀態寫入
    if (processPaymentBtn) {
        processPaymentBtn.addEventListener('click', async () => {
            if (!currentPaymentOrder) return;
            
            const method = paymentMethodSelect.value;
            let last5 = null;

            // 網銀轉帳防呆驗證
            if (method === '網銀轉帳') {
                last5 = document.getElementById('bank-last-5').value.trim();
                if (!last5 || last5.length !== 5 || isNaN(last5)) {
                    alert('請輸入正確的匯款帳號末 5 碼（需為 5 位數字）');
                    return;
                }
            }

            const btn = processPaymentBtn;
            btn.disabled = true;
            btn.textContent = '金流處理中 Processing...';
            btn.classList.add('opacity-70', 'cursor-not-allowed');

            showLoader();
            try {
                // 模擬與金流閘道連線時間
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // 準備要更新的資料 (將狀態改為處理中，並寫入末5碼)
                const updatePayload = { status: '處理中' };
                if (method === '網銀轉帳') {
                    updatePayload.payment_last5 = last5;
                }
                
                const { error } = await supabase
                    .from('orders')
                    .update(updatePayload)
                    .eq('order_id', currentPaymentOrder.id);
                
                if (error) throw error;

                alert(`付款成功！使用方式：${method}\n我們將盡速為您安排出貨。`);
                
                // 刷新會員中心歷史訂單並跳轉
                await fetchAndRenderMemberData(currentUser.id, currentUser.email);
                
                document.querySelectorAll('.view-section').forEach(sec => {
                    sec.classList.remove('block');
                    sec.classList.add('hidden');
                });
                document.getElementById('member-view').classList.remove('hidden');
                document.getElementById('member-view').classList.add('block');
                const ordersTabBtn = document.querySelector('[data-target="tab-orders"]');
                if (ordersTabBtn) ordersTabBtn.click();
                
            } catch (err) {
                alert(`付款失敗: ${err.message}`);
            } finally {
                hideLoader();
                btn.disabled = false;
                btn.textContent = '確認付款 Pay Now';
                btn.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }

    // D. 放棄當下結帳，保留為未結帳狀態
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', async () => {
            alert('訂單已為您保留，您可隨時至會員中心「歷史訂單」中完成結帳手續。');
            await fetchAndRenderMemberData(currentUser.id, currentUser.email);
            
            document.querySelectorAll('.view-section').forEach(sec => {
                sec.classList.remove('block');
                sec.classList.add('hidden');
            });
            document.getElementById('member-view').classList.remove('hidden');
            document.getElementById('member-view').classList.add('block');
            const ordersTabBtn = document.querySelector('[data-target="tab-orders"]');
            if (ordersTabBtn) ordersTabBtn.click();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 提供給歷史訂單清單按鈕呼叫的函數 (由未結帳按鈕觸發)
    window.resumePayment = function(orderId, amount) {
        currentPaymentOrder = { id: orderId, amount: amount };
        document.getElementById('payment-order-id').textContent = orderId;
        document.getElementById('payment-amount').textContent = `NT$ ${amount.toLocaleString()}`;
        document.getElementById('bank-last-5').value = ''; // 重置輸入框
        
        document.querySelectorAll('.view-section').forEach(sec => {
            sec.classList.remove('block');
            sec.classList.add('hidden');
        });
        const paymentView = document.getElementById('payment-view');
        if (paymentView) {
            paymentView.classList.remove('hidden');
            paymentView.classList.add('block');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const orderDetailsModal = document.getElementById('order-details-modal');
    const orderDetailsContent = document.getElementById('order-details-content');
    const closeOrderDetailsButton = document.querySelector('[data-action="close-order-details"]');

    window.openOrderDetails = function(orderId) {
        const order = currentOrdersData.find(item => item.order_id === orderId);
        if (!order) {
            console.warn('找不到訂單明細:', orderId);
            return;
        }

        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const itemsContainer = document.getElementById('modal-detail-items');
        const date = new Date(order.created_at);
        const dateText = isNaN(date)
            ? ''
            : `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
        const itemsAmount = Number(order.items_amount) || 0;
        const shippingFee = Number(order.shipping_fee) || 0;

        document.getElementById('modal-detail-id').textContent = `Order ID: ${order.order_id}`;
        document.getElementById('modal-detail-date').textContent = `Date: ${dateText}`;
        document.getElementById('modal-detail-status').textContent = `Status: ${order.status}`;
        document.getElementById('modal-detail-subtotal').textContent = `NT$ ${itemsAmount.toLocaleString()}`;
        document.getElementById('modal-detail-total').textContent = `NT$ ${(itemsAmount + shippingFee).toLocaleString()}`;
        itemsContainer.replaceChildren(...items.map(item => {
            const row = document.createElement('div');
            row.className = 'flex justify-between gap-3 text-[11px] text-black';

            const description = document.createElement('span');
            description.textContent = `${item.name} × ${item.quantity}`;

            const amount = document.createElement('span');
            amount.className = 'shrink-0';
            amount.textContent = `NT$ ${((Number(item.price) || 0) * (Number(item.quantity) || 0)).toLocaleString()}`;

            row.append(description, amount);
            return row;
        }));

        orderDetailsModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            orderDetailsModal.classList.remove('opacity-0');
            orderDetailsContent.classList.remove('scale-95');
            orderDetailsContent.classList.add('scale-100');
        });
    };

    const closeOrderDetails = () => {
        orderDetailsModal.classList.add('opacity-0');
        orderDetailsContent.classList.remove('scale-100');
        orderDetailsContent.classList.add('scale-95');
        window.setTimeout(() => orderDetailsModal.classList.add('hidden'), 300);
    };

    if (closeOrderDetailsButton) {
        closeOrderDetailsButton.addEventListener('click', closeOrderDetails);
    }
    if (orderDetailsModal) {
        orderDetailsModal.addEventListener('click', event => {
            if (event.target === orderDetailsModal) closeOrderDetails();
        });
    }
    
    // ==========================================
    // 3. 手機版選單開關控制
    // ==========================================
    const mobileMenuToggleBtn = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (mobileMenuToggleBtn) {
        mobileMenuToggleBtn.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }


    // ==========================================
    // 8. 導覽列錨點點擊自動返回首頁邏輯
    // ==========================================
    const navAnchorLinks = document.querySelectorAll('nav a[href^="#"], #mobile-menu a[href^="#"]');
    
    navAnchorLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault(); // 阻擋預設跳轉，由 JS 接管
            
            // 1. 強制顯示首頁視圖 (home-view)，隱藏其他視圖
            document.querySelectorAll('.view-section').forEach(sec => {
                sec.classList.remove('block');
                sec.classList.add('hidden');
            });
            const homeView = document.getElementById('home-view');
            if (homeView) {
                homeView.classList.remove('hidden');
                homeView.classList.add('block');
            }

            // 2. 如果是手機版，點擊後自動收合選單
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                mobileMenu.classList.add('hidden');
            }

            // 3. 抓取目標區塊並平滑滾動 (給予 50ms 延遲讓視圖先渲染完成)
            const targetId = link.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                setTimeout(() => {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }, 50);
            }
        });
    });

    // ==========================================
    // 9. 產品圖片放大鏡 (Lightbox) 邏輯
    // ==========================================
    let lightboxState = {
        images: [],
        currentIndex: 0
    };

    // 暴露給 HTML onClick 呼叫的函數
    window.openLightbox = function(itemIndex, imgIndex) {
        // currentRenderedItems 存放了當前畫面上的商品列表
        const product = currentRenderedItems[itemIndex];
        if (!product || !product.images) return;

        lightboxState.images = product.images;
        lightboxState.currentIndex = imgIndex;
        updateLightboxView();

        const lb = document.getElementById('lightbox');
        lb.classList.remove('hidden');
        lb.classList.add('flex');
        void lb.offsetWidth; // 觸發瀏覽器重繪
        lb.classList.remove('opacity-0');
        document.body.style.overflow = 'hidden'; // 鎖定背景滾動
    };

    window.closeLightbox = function() {
        const lb = document.getElementById('lightbox');
        lb.classList.add('opacity-0');
        setTimeout(() => {
            lb.classList.add('hidden');
            lb.classList.remove('flex');
            document.body.style.overflow = ''; 
        }, 300);
    };

    window.changeLightboxImage = function(direction) {
        lightboxState.currentIndex += direction;
        // 循環播放邏輯
        if (lightboxState.currentIndex < 0) {
            lightboxState.currentIndex = lightboxState.images.length - 1;
        } else if (lightboxState.currentIndex >= lightboxState.images.length) {
            lightboxState.currentIndex = 0;
        }
        updateLightboxView();
    };

    function updateLightboxView() {
        const imgEl = document.getElementById('lightbox-img');
        if (imgEl) {
            imgEl.src = lightboxState.images[lightboxState.currentIndex];
        }
        
        const indicatorsContainer = document.getElementById('lightbox-indicators');
        if (indicatorsContainer) {
            indicatorsContainer.innerHTML = lightboxState.images.map((_, idx) => `
                <div class="w-2 h-2 rounded-full transition-colors duration-300 ${idx === lightboxState.currentIndex ? 'bg-zera-cream' : 'bg-zera-cream/30'}"></div>
            `).join('');
        }
    }

    // 綁定 Lightbox UI 按鈕事件
    const lbCloseBtn = document.querySelector('[data-action="close-lightbox"]');
    const lbPrevBtn = document.querySelector('[data-action="prev-lightbox-image"]');
    const lbNextBtn = document.querySelector('[data-action="next-lightbox-image"]');
    const lightboxEl = document.getElementById('lightbox');

    if (lbCloseBtn) lbCloseBtn.addEventListener('click', closeLightbox);
    if (lbPrevBtn) lbPrevBtn.addEventListener('click', () => changeLightboxImage(-1));
    if (lbNextBtn) lbNextBtn.addEventListener('click', () => changeLightboxImage(1));
    
    // 點擊圖片外部灰色遮罩時關閉
    if (lightboxEl) {
        lightboxEl.addEventListener('click', (e) => {
            if (e.target.id === 'lightbox' || e.target.id === 'lightbox-touch-area') {
                closeLightbox();
            }
        });
    }
});

    // ==========================================
    // 9. 訂單詳情卡片 (Order Details Modal) 邏輯
    // ==========================================
    let activeDetailOrderId = null;

    window.openOrderDetails = function(orderId) {
        const order = currentOrdersData.find(o => o.order_id === orderId);
        if (!order) return;

        activeDetailOrderId = orderId;
        
        // 填入基本資訊
        const dateObj = new Date(order.created_at);
        document.getElementById('modal-detail-id').textContent = `Order ID: ${order.order_id}`;
        document.getElementById('modal-detail-date').textContent = `Date: ${dateObj.getFullYear()}/${dateObj.getMonth()+1}/${dateObj.getDate()} ${dateObj.getHours()}:${String(dateObj.getMinutes()).padStart(2,'0')}`;
        
        // 判斷付款與訂單狀態
        let statusText = order.status;
        if (order.status === '未結帳') statusText += ' (Pending Payment)';
        if (order.status === '處理中') statusText += ' (Paid & Processing)';
        if (order.status === '已取消') statusText += ' (Cancelled)';
        document.getElementById('modal-detail-status').innerHTML = `Status: <span class="${order.status==='未結帳'?'text-red-600':''}">${statusText}</span>`;

        // 渲染商品細項
        const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        const itemsContainer = document.getElementById('modal-detail-items');
        itemsContainer.innerHTML = items.map(item => `
            <div class="flex justify-between items-center text-[11px] font-bold text-black border-b border-[rgba(16,86,82,0.1)] pb-1">
                <span class="truncate pr-2">${item.name} <span class="text-black/50 font-normal">x${item.quantity}</span></span>
                <span class="shrink-0">NT$${(item.price * item.quantity).toLocaleString()}</span>
            </div>
        `).join('');

        // 金額總計
        const amountStr = `NT$${Number(order.items_amount).toLocaleString()}`;
        document.getElementById('modal-detail-subtotal').textContent = amountStr;
        document.getElementById('modal-detail-total').textContent = amountStr;

        // 隱藏/顯示取消訂單按鈕 (已取消或已出貨不可取消)
        const cancelBtn = document.getElementById('modal-cancel-btn');
        if (order.status === '已取消' || order.status === '已完成') {
            cancelBtn.classList.add('hidden');
        } else {
            cancelBtn.classList.remove('hidden');
        }

        // 開啟 Modal 動畫
        const modal = document.getElementById('order-details-modal');
        const content = document.getElementById('order-details-content');
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        void modal.offsetWidth;
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
        content.classList.add('scale-100');
        document.body.style.overflow = 'hidden';
    };

    window.closeOrderDetails = function() {
        const modal = document.getElementById('order-details-modal');
        const content = document.getElementById('order-details-content');
        modal.classList.add('opacity-0');
        content.classList.remove('scale-100');
        content.classList.add('scale-95');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
            document.body.style.overflow = '';
        }, 300);
    };

    // 綁定關閉按鈕
    const closeDetailBtn = document.querySelector('[data-action="close-order-details"]');
    if (closeDetailBtn) closeDetailBtn.addEventListener('click', closeOrderDetails);
    
    // 綁定背景點擊關閉
    const orderModalEl = document.getElementById('order-details-modal');
    if (orderModalEl) {
        orderModalEl.addEventListener('click', (e) => {
            if (e.target === orderModalEl) closeOrderDetails();
        });
    }

    // 綁定取消訂單按鈕
    const cancelOrderBtn = document.getElementById('modal-cancel-btn');
    if (cancelOrderBtn) {
        cancelOrderBtn.addEventListener('click', async () => {
            if (!activeDetailOrderId) return;
            if (!confirm(`確定要取消訂單 #${activeDetailOrderId} 嗎？此操作無法還原。`)) return;

            cancelOrderBtn.textContent = '處理中...';
            try {
                const { error } = await supabase
                    .from('orders')
                    .update({ status: '已取消' })
                    .eq('order_id', activeDetailOrderId);
                
                if (error) throw error;
                alert('訂單已成功取消。');
                
                closeOrderDetails();
                // 刷新會員中心資料
                if (currentUser) {
                    await fetchAndRenderMemberData(currentUser.id, currentUser.email);
                }
            } catch (err) {
                alert(`取消失敗: ${err.message}`);
            } finally {
                cancelOrderBtn.textContent = '取消訂單 Cancel';
            }
        });
    }