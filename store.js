/**
 * Amazon Storefront Controller
 * Fully handles Cart, Sidebar, Search, Category Filters, Address Updates, and Checkout.
 */

document.addEventListener("DOMContentLoaded", () => {
    // ==========================================================================
    // State Variables
    // ==========================================================================
    let cart = [];
    let currentLocation = "Aligarh, Uttar Pradesh, India";
    let currentCity = "Aligarh";

    // Initialize local storage indicators if needed
    try {
        const savedLocation = localStorage.getItem("amz_location");
        if (savedLocation) {
            currentLocation = savedLocation;
            currentCity = savedLocation.split(",")[0].trim();
            updateLocationDOM();
        }
    } catch (e) {
        console.warn("localStorage is not accessible:", e);
    }

    // ==========================================================================
    // DOM Elements
    // ==========================================================================
    // Navbar Elements
    const allMenuBtn = document.getElementById("allMenuBtn");
    const cartBtn = document.getElementById("cartBtn");
    const cartBadge = document.getElementById("cartBadge");
    const navLocationBtn = document.getElementById("navLocationBtn");
    const navLocationText = document.getElementById("navLocationText");
    const searchCategory = document.getElementById("searchCategory");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");

    // Drawer Elements (Cart Drawer)
    const cartDrawer = document.getElementById("cartDrawer");
    const drawerOverlay = document.getElementById("drawerOverlay");
    const closeDrawer = document.getElementById("closeDrawer");
    const cartItemsContainer = document.getElementById("cartItemsContainer");
    const cartSubtotal = document.getElementById("cartSubtotal");
    const checkoutBtn = document.getElementById("checkoutBtn");
    const shopNowBtn = document.getElementById("shopNowBtn");

    // Left Navigation Sidebar Menu
    const sidebarMenu = document.getElementById("sidebarMenu");
    const sidebarOverlay = document.getElementById("sidebarOverlay");
    const closeSidebar = document.getElementById("closeSidebar");
    const sidebarLinks = document.querySelectorAll(".sidebar-link");

    // Checkout Modal
    const checkoutModal = document.getElementById("checkoutModal");
    const modalOverlay = document.getElementById("modalOverlay");
    const closeModal = document.getElementById("closeModal");
    const modalItemsContainer = document.getElementById("modalItemsContainer");
    const modalItemsTotal = document.getElementById("modalItemsTotal");
    const modalOrderTotal = document.getElementById("modalOrderTotal");
    const modalShippingAddress = document.getElementById("modalShippingAddress");
    const btnCompleteOrder = document.getElementById("btnCompleteOrder");

    // Location Selector Modal
    const addressModal = document.getElementById("addressModal");
    const closeAddressModal = document.getElementById("closeAddressModal");
    const addressInput = document.getElementById("addressInput");
    const btnSaveAddress = document.getElementById("btnSaveAddress");

    // Success Screen
    const successScreen = document.getElementById("successScreen");
    const orderIdText = document.getElementById("orderIdText");
    const btnDismissSuccess = document.getElementById("btnDismissSuccess");

    // Product Cards Listing
    const productGrid = document.querySelector(".main-content");
    const productCards = document.querySelectorAll(".main-content .content");

    // ==========================================================================
    // Sidebar Sliding Navigation (Left Side)
    // ==========================================================================
    if (allMenuBtn && sidebarMenu && sidebarOverlay && closeSidebar) {
        allMenuBtn.addEventListener("click", () => {
            sidebarMenu.classList.add("open");
            sidebarOverlay.classList.add("active");
        });

        const closeSidebarFunc = () => {
            sidebarMenu.classList.remove("open");
            sidebarOverlay.classList.remove("active");
        };

        closeSidebar.addEventListener("click", closeSidebarFunc);
        sidebarOverlay.addEventListener("click", closeSidebarFunc);

        // Sidebar category links trigger filtering
        sidebarLinks.forEach(link => {
            link.addEventListener("click", (e) => {
                e.preventDefault();
                const filterCategory = link.getAttribute("data-filter");
                if (filterCategory) {
                    if (searchCategory) searchCategory.value = filterCategory;
                    if (searchInput) searchInput.value = "";
                    filterCatalog(filterCategory, "");
                    closeSidebarFunc();
                    
                    // Smooth scroll down to main content grid
                    productGrid.scrollIntoView({ behavior: "smooth", block: "start" });
                }
            });
        });
    }

    // ==========================================================================
    // Shopping Cart Slide-Out Drawer (Right Side)
    // ==========================================================================
    if (cartBtn && cartDrawer && drawerOverlay && closeDrawer) {
        const openDrawerFunc = () => {
            cartDrawer.classList.add("open");
            drawerOverlay.classList.add("active");
            renderCart();
        };

        const closeDrawerFunc = () => {
            cartDrawer.classList.remove("open");
            drawerOverlay.classList.remove("active");
        };

        cartBtn.addEventListener("click", openDrawerFunc);
        closeDrawer.addEventListener("click", closeDrawerFunc);
        drawerOverlay.addEventListener("click", closeDrawerFunc);
        
        if (shopNowBtn) {
            shopNowBtn.addEventListener("click", closeDrawerFunc);
        }
    }

    // ==========================================================================
    // Catalog Filtering and Keyword Search
    // ==========================================================================
    const filterCatalog = (category, keyword) => {
        let visibleCount = 0;
        const normalizedKeyword = keyword.toLowerCase().trim();

        productCards.forEach(card => {
            const cardCategory = card.getAttribute("data-category");
            const cardName = card.getAttribute("data-name").toLowerCase();

            const categoryMatches = (category === "All" || cardCategory === category);
            const keywordMatches = (normalizedKeyword === "" || cardName.includes(normalizedKeyword));

            if (categoryMatches && keywordMatches) {
                card.style.display = "flex";
                visibleCount++;
            } else {
                card.style.display = "none";
            }
        });

        // Manage Empty Catalog State
        const existingEmptyMsg = document.querySelector(".empty-catalog-message");
        if (visibleCount === 0) {
            if (!existingEmptyMsg && productGrid) {
                const emptyDiv = document.createElement("div");
                emptyDiv.className = "empty-catalog-message";
                emptyDiv.innerHTML = `
                    <i class="fa-solid fa-magnifying-glass-minus"></i>
                    <h3>No Products Found</h3>
                    <p>We couldn't find matches for "${keyword}" under "${category}".</p>
                    <button class="btn-reset-filters" id="btnResetFilters">Reset Filters</button>
                `;
                productGrid.appendChild(emptyDiv);

                document.getElementById("btnResetFilters").addEventListener("click", () => {
                    if (searchCategory) searchCategory.value = "All";
                    if (searchInput) searchInput.value = "";
                    filterCatalog("All", "");
                });
            }
        } else {
            if (existingEmptyMsg) {
                existingEmptyMsg.remove();
            }
        }
    };

    // Event listeners for searching
    if (searchBtn && searchInput && searchCategory) {
        const executeSearch = () => {
            filterCatalog(searchCategory.value, searchInput.value);
        };

        searchBtn.addEventListener("click", executeSearch);
        searchInput.addEventListener("keypress", (e) => {
            if (e.key === "Enter") executeSearch();
        });
        searchCategory.addEventListener("change", executeSearch);
    }

    // ==========================================================================
    // Cart Logic & Event Delegation
    // ==========================================================================
    
    // Delegate product card clicks (Add to Cart / Buy Now)
    if (productGrid) {
        productGrid.addEventListener("click", (e) => {
            const targetBtn = e.target.closest("button");
            if (!targetBtn) return;

            const card = targetBtn.closest(".content");
            if (!card) return;

            const productId = card.getAttribute("data-id");
            const productName = card.getAttribute("data-name");
            const productPrice = parseFloat(card.getAttribute("data-price"));
            const productImage = card.getAttribute("data-image");

            if (targetBtn.classList.contains("btn-add-to-cart")) {
                addToCart(productId, productName, productPrice, productImage);
                animateBadgeBump();
                triggerToastNotification(`Added "${productName}" to cart!`);
            } else if (targetBtn.classList.contains("btn-buy-now")) {
                // Add to cart first
                addToCart(productId, productName, productPrice, productImage);
                // Directly open checkout modal
                openCheckoutModal();
            }
        });
    }

    const addToCart = (id, name, price, image) => {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({ id, name, price, image, quantity: 1 });
        }
        updateBadgeDOM();
    };

    const updateQty = (id, change) => {
        const item = cart.find(item => item.id === id);
        if (!item) return;

        item.quantity += change;
        if (item.quantity <= 0) {
            cart = cart.filter(i => i.id !== id);
        }
        updateBadgeDOM();
        renderCart();
    };

    const deleteItem = (id) => {
        cart = cart.filter(item => item.id !== id);
        updateBadgeDOM();
        renderCart();
    };

    const updateBadgeDOM = () => {
        if (!cartBadge) return;
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    };

    const animateBadgeBump = () => {
        if (!cartBadge) return;
        cartBadge.classList.add("bump");
        setTimeout(() => {
            cartBadge.classList.remove("bump");
        }, 300);
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const renderCart = () => {
        if (!cartItemsContainer || !cartSubtotal) return;

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart-message">
                    <i class="fa-solid fa-basket-shopping"></i>
                    <p>Your cart is empty</p>
                    <button class="shop-now-btn" id="shopNowBtnInside">Shop Now</button>
                </div>
            `;
            const shopInside = document.getElementById("shopNowBtnInside");
            if (shopInside) {
                shopInside.addEventListener("click", () => {
                    cartDrawer.classList.remove("open");
                    drawerOverlay.classList.remove("active");
                });
            }
            cartSubtotal.textContent = "$0.00";
            if (checkoutBtn) checkoutBtn.disabled = true;
            return;
        }

        if (checkoutBtn) checkoutBtn.disabled = false;
        cartItemsContainer.innerHTML = "";

        cart.forEach(item => {
            const itemRow = document.createElement("div");
            itemRow.className = "cart-item-row";
            itemRow.innerHTML = `
                <div class="cart-item-img" style="background-image: url('${item.image}')"></div>
                <div class="cart-item-info">
                    <div class="cart-item-title">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-controls" style="margin-top: 6px;">
                        <button class="qty-btn" data-id="${item.id}" data-change="-1">-</button>
                        <span class="item-qty">${item.quantity}</span>
                        <button class="qty-btn" data-id="${item.id}" data-change="1">+</button>
                        <button class="delete-item-btn" data-id="${item.id}" style="margin-left: auto;">
                            <i class="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemRow);
        });

        // Add event listeners for items quantity control
        cartItemsContainer.querySelectorAll(".qty-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                const change = parseInt(btn.getAttribute("data-change"));
                updateQty(id, change);
            });
        });

        cartItemsContainer.querySelectorAll(".delete-item-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.getAttribute("data-id");
                deleteItem(id);
            });
        });

        cartSubtotal.textContent = `$${calculateSubtotal().toFixed(2)}`;
    };

    // ==========================================================================
    // Location / Address Selector Modal
    // ==========================================================================
    function updateLocationDOM() {
        if (navLocationText) navLocationText.textContent = currentCity;
        if (modalShippingAddress) modalShippingAddress.textContent = currentLocation;
    }

    if (navLocationBtn && addressModal && closeAddressModal && btnSaveAddress && addressInput) {
        navLocationBtn.addEventListener("click", () => {
            addressInput.value = currentLocation;
            addressModal.classList.add("open");
            modalOverlay.classList.add("active");
        });

        const closeAddressModalFunc = () => {
            addressModal.classList.remove("open");
            if (!checkoutModal.classList.contains("open")) {
                modalOverlay.classList.remove("active");
            }
        };

        closeAddressModal.addEventListener("click", closeAddressModalFunc);

        btnSaveAddress.addEventListener("click", () => {
            const inputVal = addressInput.value.trim();
            if (inputVal !== "") {
                currentLocation = inputVal;
                currentCity = inputVal.split(",")[0].trim();
                
                try {
                    localStorage.setItem("amz_location", currentLocation);
                } catch (e) {}

                updateLocationDOM();
                triggerToastNotification(`Delivery location updated to "${currentCity}"!`);
            }
            closeAddressModalFunc();
        });
    }

    // ==========================================================================
    // Checkout Sandbox Modal & Processing Success
    // ==========================================================================
    const openCheckoutModal = () => {
        if (cartDrawer) cartDrawer.classList.remove("open");
        if (checkoutModal && modalOverlay && modalItemsContainer) {
            checkoutModal.classList.add("open");
            modalOverlay.classList.add("active");

            // Populate checkout summary lists
            modalItemsContainer.innerHTML = "";
            cart.forEach(item => {
                const summaryRow = document.createElement("div");
                summaryRow.className = "order-summary-item";
                summaryRow.innerHTML = `
                    <span>${item.name} <strong>x${item.quantity}</strong></span>
                    <span>$${(item.price * item.quantity).toFixed(2)}</span>
                `;
                modalItemsContainer.appendChild(summaryRow);
            });

            // Set Totals
            const subtotal = calculateSubtotal();
            if (modalItemsTotal) modalItemsTotal.textContent = `$${subtotal.toFixed(2)}`;
            if (modalOrderTotal) modalOrderTotal.textContent = `$${subtotal.toFixed(2)}`;
            if (modalShippingAddress) modalShippingAddress.textContent = currentLocation;
        }
    };

    if (checkoutBtn) {
        checkoutBtn.addEventListener("click", openCheckoutModal);
    }

    if (checkoutModal && closeModal && btnCompleteOrder) {
        const closeCheckoutFunc = () => {
            checkoutModal.classList.remove("open");
            modalOverlay.classList.remove("active");
        };

        closeModal.addEventListener("click", closeCheckoutFunc);

        // Simulated complete purchase
        btnCompleteOrder.addEventListener("click", () => {
            btnCompleteOrder.disabled = true;
            btnCompleteOrder.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing Secure Payment...`;

            setTimeout(() => {
                // Generate simulated order ID
                const randomId = "AMZ-" + Math.floor(100000 + Math.random() * 900000) + "-IN";
                if (orderIdText) orderIdText.textContent = randomId;

                // Close checkout screen and reset complete button
                closeCheckoutFunc();
                btnCompleteOrder.disabled = false;
                btnCompleteOrder.innerHTML = `<i class="fa-solid fa-lock"></i> Complete Simulated Purchase`;

                // Open success panel
                if (successScreen) successScreen.classList.add("active");

                // Clear Shopping cart completely
                cart = [];
                updateBadgeDOM();
            }, 1800);
        });
    }

    if (btnDismissSuccess && successScreen) {
        btnDismissSuccess.addEventListener("click", () => {
            successScreen.classList.remove("active");
        });
    }

    // ==========================================================================
    // Toast Notification helper
    // ==========================================================================
    function triggerToastNotification(message) {
        const existingToast = document.querySelector(".toast-notification");
        if (existingToast) existingToast.remove();

        const toast = document.createElement("div");
        toast.className = "toast-notification";
        toast.style.cssText = `
            position: fixed;
            bottom: 25px;
            right: 25px;
            background-color: var(--color-secondary);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            border-left: 4px solid var(--color-brand);
            font-size: 0.95rem;
            font-weight: 700;
            z-index: 300;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.25);
            display: flex;
            align-items: center;
            gap: 10px;
            animation: toastFadeIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), toastFadeOut 0.3s 2.7s forwards;
        `;
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #38A169;"></i> ${message}`;
        document.body.appendChild(toast);

        // Add toast fade keyframes dynamically if not present
        if (!document.getElementById("toast-keyframes")) {
            const keyframeStyle = document.createElement("style");
            keyframeStyle.id = "toast-keyframes";
            keyframeStyle.textContent = `
                @keyframes toastFadeIn {
                    from { opacity: 0; transform: translateY(15px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes toastFadeOut {
                    from { opacity: 1; transform: translateY(0); }
                    to { opacity: 0; transform: translateY(15px); }
                }
            `;
            document.head.appendChild(keyframeStyle);
        }

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
});
