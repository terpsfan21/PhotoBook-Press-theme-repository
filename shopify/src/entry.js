// Entry point for the Shopify draft bundle. Order matters: styles, then the
// Shopify backend, then the storefront app (which reads window.NUB_BACKEND).
/* global NUB_CSS */
const style = document.createElement('style');
style.textContent = NUB_CSS;
document.head.appendChild(style);
await import('./backend.js');
await import('../../public/app.js');
