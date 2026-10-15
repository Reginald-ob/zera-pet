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
    // 0. 初始化 Supabase 客戶端
    // ==========================================
    const SUPABASE_URL = 'https://gmoumuxmbbagjgwnevss.supabase.co';
    const SUPABASE_ANON_KEY = 'sb_publishable_4_-jBNZHWDD7Imp6GKkXXg_6FxxtOyP';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    let currentUser = null;
    let isLoginMode = true;

    async function checkSession() {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) {
                console.error('讀取登入狀態失敗：', error);
                return;
            }

            if (data.session) {
                currentUser = data.session.user;
                await fetchMemberData(currentUser.id);
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
                    alert('登入成功！');
                    document.querySelector('[data-view-target="member-view"]').click();
                } else {
                    const phone = document.getElementById('auth-phone').value;
                    const petPref = document.getElementById('auth-pet-preference').value;
                    const { data: authData, error: authError } = await supabase.auth.signUp({
                        email,
                        password
                    });
                    if (authError) throw authError;

                    if (authData.user) {
                        const { error: insertError } = await supabase
                            .from('members')
                            .insert([{
                                id: authData.user.id,
                                phone_number: phone,
                                pet_preference: petPref
                            }]);
                        if (insertError) throw insertError;
                    }

                    alert('註冊成功！');
                    currentUser = authData.user;
                    document.querySelector('[data-view-target="member-view"]').click();
                }
            } catch (error) {
                alert(`發生錯誤：${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
                submitBtn.classList.remove('opacity-70', 'cursor-not-allowed');
            }
        });
    }

    async function fetchMemberData(userId) {
        const { data, error } = await supabase
            .from('members')
            .select('phone_number, tier, pet_preference, total_spent, reward_points')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('載入會員資料失敗：', error);
            return;
        }

        if (data) {
            console.log('載入會員資料：', data);
        }
    }

    // ==========================================
    // 3. 商品資料獲取 (模擬 Google Sheets API)
    // ==========================================
    const productGrid = document.getElementById('product-grid');
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');

    function renderProducts() {
            const grid = document.getElementById('product-grid');
            // 注意：這裡的 allProducts 是我們前一步驟從 fetchProductsData 載入的變數
            // 實務上您可能需要結合 state.category 進行過濾
            let items = [...allProducts]; // 這裡先假設顯示所有商品

            if (state.searchQuery) {
                items = items.filter(p => 
                    p.name.toLowerCase().includes(state.searchQuery) || 
                    p.desc.toLowerCase().includes(state.searchQuery)
                );
            }

            if (state.sortOrder === 'price-desc') {
                items.sort((a, b) => b.price - a.price);
            } else if (state.sortOrder === 'price-asc') {
                items.sort((a, b) => a.price - b.price);
            }

            currentRenderedItems = items;

            if (items.length === 0) {
                grid.innerHTML = `<div class="col-span-1 sm:col-span-2 md:col-span-4 text-center py-12 text-zera-black/50 text-sm">沒有找到符合當前條件的精品。</div>`;
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
                        <div class="text-zera-tan font-semibold text-sm tracking-wide">NT$ ${p.price.toLocaleString()}</div>
                        <!-- ★ 這裡修改為 button 並呼叫 openProductModal -->
                        <button onclick="openProductModal('${p.id}')" class="bg-[#C6A87C] hover:bg-[#B59567] text-white text-[11px] px-4 py-1.5 rounded-full transition-colors font-medium tracking-wider shadow-sm focus:outline-none">立即購買</button>
                    </div>
                </div>
            `}).join('');
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

                // 處理價格 (若表格中如 E001 有包含逗號，需先移除逗號再轉數字)
                const parsedPrice = parseInt(String(row.price).replace(/,/g, ''), 10);

                return {
                    id: row.product_ID,
                    category_code: 'PET', // 如果有需要，可以將 category_code 加入表格欄位
                    sub_code: row.sub_code,
                    name: row.name,
                    desc: row.desc,
                    price: isNaN(parsedPrice) ? 0 : parsedPrice,
                    images: [row.images], // 將單張圖片網址轉為陣列，配合先前的 Lightbox 邏輯
                    raw_skus: skuOptions, // 保留原始的變體 SKU 代碼陣列
                    variants: variants
                };
            });
            
            // 資料轉換完畢後，執行首次渲染
            renderProducts();
            renderCategoryButtons(); // 若您的分類選單是根據資料動態生成，需再次呼叫

        } catch (error) {
            console.error('商品資料載入失敗:', error);
            // 失敗時的防呆顯示
            document.getElementById('product-grid').innerHTML = `<div class="col-span-full text-center py-12 text-red-800 text-sm">無法載入商品資料，請稍後再試。</div>`;
        }
    }
    if (searchInput) searchInput.addEventListener('input', renderProducts);
    if (sortSelect) sortSelect.addEventListener('change', renderProducts);
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
        if (modalPrice) modalPrice.textContent = `NT$ ${currentModalProduct.price.toLocaleString()}`;
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
            const skuParts = [currentModalProduct.category_code, currentModalProduct.sub_code, variantSuffix].filter(Boolean);
            const cartItem = {
                sku: skuParts.join('-'),
                name: currentModalProduct.name,
                variant: variantValues.join(' / ') || '無規格',
                price: currentModalProduct.price,
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
    // 3. 手機版選單開關控制
    // ==========================================
    const mobileMenuToggleBtn = document.querySelector('[data-action="toggle-mobile-menu"]');
    if (mobileMenuToggleBtn) {
        mobileMenuToggleBtn.addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });
    }

});