/**
 * Amazon Secure Biometric Gateway Controller
 * Manages full-page fingerprint scanning interactions, status states, and storefront redirects.
 */

document.addEventListener("DOMContentLoaded", () => {
    const biometricContainer = document.getElementById("biometricContainer");
    const biometricStatus = document.getElementById("biometricStatus");

    if (biometricContainer) {
        biometricContainer.addEventListener("click", () => {
            // Prevent multiple clicks while scanning is active
            if (biometricContainer.classList.contains("active")) return;

            biometricContainer.classList.add("active");
            if (biometricStatus) biometricStatus.textContent = "Scanning fingerprint...";

            // Listen for the main container animation to finish
            biometricContainer.addEventListener("animationend", function scanFinished(e) {
                if (e.animationName === 'Container') {
                    // Cleanup animation states
                    biometricContainer.classList.remove("active");
                    biometricContainer.removeEventListener("animationend", scanFinished);

                    if (biometricStatus) biometricStatus.textContent = "Touch ID Verified!";
                    triggerSuccessToast("Verification Successful! Redirecting to Store...");

                    // Redirect back to main storefront
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 1200);
                }
            });
        });
    }

    // ==========================================================================
    // Success Toast Notification Helper
    // ==========================================================================
    function triggerSuccessToast(message) {
        const existingToast = document.querySelector(".gateway-toast");
        if (existingToast) existingToast.remove();

        const toast = document.createElement("div");
        toast.className = "gateway-toast";
        toast.style.cssText = `
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%) translateY(15px);
            background-color: var(--color-bg-charcoal);
            color: white;
            padding: 14px 28px;
            border-radius: 8px;
            border-left: 4px solid #38A169;
            font-size: 1.4rem;
            font-weight: 700;
            z-index: 300;
            box-shadow: 0 10px 30px rgba(26, 86, 219, 0.2);
            display: flex;
            align-items: center;
            gap: 12px;
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        `;
        toast.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #38A169; font-size: 1.8rem;"></i> ${message}`;
        document.body.appendChild(toast);

        // Force browser layout repaint then animate
        setTimeout(() => {
            toast.style.opacity = "1";
            toast.style.transform = "translateX(-50%) translateY(0)";
        }, 50);

        setTimeout(() => {
            toast.style.opacity = "0";
            toast.style.transform = "translateX(-50%) translateY(15px)";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 2700);
    }
});
