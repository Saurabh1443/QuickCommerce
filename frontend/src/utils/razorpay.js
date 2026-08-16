const SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";

let loadingPromise = null;

/** Lazily injects the Razorpay checkout script. Resolves to `window.Razorpay`. */
export function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.onload = () => resolve(window.Razorpay);
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script."));
    document.body.appendChild(script);
  });
  return loadingPromise;
}
