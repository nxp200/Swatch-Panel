/**
 * Color Code Picker Web Application
 * A fully client-side color picker tool with multiple input methods,
 * live preview, and color format conversions.
 */

// ===== APPLICATION STATE =====
const state = {
    currentColor: {
        r: 52,
        g: 152,
        b: 219,
        hex: '#3498DB',
        h: 204,
        s: 70,
        l: 53
    },
    previewText: 'Sample Text Preview',
    pinnedColors: [], // Max 8 colors, FIFO queue
    isPickerDragging: false
};

// ===== PREDEFINED COLOR PALETTE =====
// 24 commonly used colors in 6-digit HEX format
const predefinedPalette = [
    '#FF0000', '#FF6B00', '#FFD700', '#00FF00',
    '#00CED1', '#0000FF', '#8B00FF', '#FF1493',
    '#8B4513', '#2F4F4F', '#708090', '#000000',
    '#FF69B4', '#FF8C00', '#FFE4B5', '#7FFF00',
    '#40E0D0', '#1E90FF', '#9370DB', '#C71585',
    '#CD853F', '#696969', '#A9A9A9', '#FFFFFF'
];

// ===== COLOR CONVERSION UTILITIES =====

/**
 * Convert HEX to RGB
 * @param {string} hex - HEX color string (e.g., "#3498DB")
 * @returns {object} RGB object {r, g, b} or null if invalid
 */
function hexToRgb(hex) {
    // Validate HEX format: # followed by exactly 6 hex characters
    const hexPattern = /^#([A-Fa-f0-9]{6})$/;
    const match = hex.match(hexPattern);
    
    if (!match) return null;
    
    const hexValue = match[1];
    return {
        r: parseInt(hexValue.substring(0, 2), 16),
        g: parseInt(hexValue.substring(2, 4), 16),
        b: parseInt(hexValue.substring(4, 6), 16)
    };
}

/**
 * Convert RGB to HEX
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {string} HEX color string (e.g., "#3498DB")
 */
function rgbToHex(r, g, b) {
    // Ensure values are in valid range and are integers
    r = Math.max(0, Math.min(255, Math.round(r)));
    g = Math.max(0, Math.min(255, Math.round(g)));
    b = Math.max(0, Math.min(255, Math.round(b)));
    
    const toHex = (n) => {
        const hex = n.toString(16).toUpperCase();
        return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Convert RGB to HSL
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {object} HSL object {h, s, l} where h is 0-360, s and l are 0-100
 */
function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;
    
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    
    if (diff !== 0) {
        s = l > 0.5 ? diff / (2 - max - min) : diff / (max + min);
        
        switch (max) {
            case r:
                h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                h = ((b - r) / diff + 2) / 6;
                break;
            case b:
                h = ((r - g) / diff + 4) / 6;
                break;
        }
    }
    
    return {
        h: Math.round(h * 360),
        s: Math.round(s * 100),
        l: Math.round(l * 100)
    };
}

/**
 * Convert HSL to RGB
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {object} RGB object {r, g, b}
 */
function hslToRgb(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    
    let r, g, b;
    
    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        };
        
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Convert RGB to CMYK
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 * @returns {object} CMYK object {c, m, y, k} as percentages (0-100)
 */
function rgbToCmyk(r, g, b) {
    // Normalize RGB values to 0-1 range
    let c = 1 - (r / 255);
    let m = 1 - (g / 255);
    let y = 1 - (b / 255);
    
    // Calculate K (black) - the minimum of C, M, Y
    let k = Math.min(c, m, y);
    
    // Handle pure black edge case to avoid division by zero
    if (k === 1) {
        return { c: 0, m: 0, y: 0, k: 100 };
    }
    
    // Convert CMY to CMYK using the black component
    c = Math.round(((c - k) / (1 - k)) * 100);
    m = Math.round(((m - k) / (1 - k)) * 100);
    y = Math.round(((y - k) / (1 - k)) * 100);
    k = Math.round(k * 100);
    
    return { c, m, y, k };
}

// ===== STATE UPDATE & RENDERING =====

/**
 * Update the current color state from RGB values
 * @param {number} r - Red value (0-255)
 * @param {number} g - Green value (0-255)
 * @param {number} b - Blue value (0-255)
 */
function setColorFromRgb(r, g, b) {
    const hex = rgbToHex(r, g, b);
    const hsl = rgbToHsl(r, g, b);
    
    state.currentColor = {
        r: Math.round(r),
        g: Math.round(g),
        b: Math.round(b),
        hex: hex,
        h: hsl.h,
        s: hsl.s,
        l: hsl.l
    };
    
    renderAllColorOutputs();
}

/**
 * Update the current color state from HEX value
 * @param {string} hex - HEX color string
 */
function setColorFromHex(hex) {
    const rgb = hexToRgb(hex);
    if (rgb) {
        setColorFromRgb(rgb.r, rgb.g, rgb.b);
    }
}

/**
 * Update the current color state from HSL values
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 */
function setColorFromHsl(h, s, l) {
    const rgb = hslToRgb(h, s, l);
    setColorFromRgb(rgb.r, rgb.g, rgb.b);
}

/**
 * Render all color-dependent UI elements
 */
function renderAllColorOutputs() {
    const { r, g, b, hex } = state.currentColor;
    const cmyk = rgbToCmyk(r, g, b);
    
    // Update current color swatch
    const swatch = document.getElementById('currentColorSwatch');
    swatch.style.backgroundColor = hex;
    
    // Update color code outputs
    document.getElementById('outputHex').textContent = hex;
    document.getElementById('outputRgb').textContent = `${r}, ${g}, ${b}`;
    document.getElementById('outputCmyk').textContent = `${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`;
    
    // Update text preview color
    updateTextPreview();
    
    // Update picker UI
    updatePickerUI();
    
    // Update manual input fields without triggering validation
    updateManualInputFields();
    
    // Update palette selection
    updatePaletteSelection();
}

/**
 * Update text preview with current color
 */
function updateTextPreview() {
    const previewArea = document.getElementById('previewArea');
    previewArea.style.color = state.currentColor.hex;
    previewArea.textContent = state.previewText;
}

// ===== PREDEFINED PALETTE =====

/**
 * Render predefined color palette swatches
 */
function renderPalette() {
    const paletteContainer = document.getElementById('predefinedPalette');
    paletteContainer.innerHTML = '';
    
    predefinedPalette.forEach((color, index) => {
        const swatch = document.createElement('button');
        swatch.className = 'palette-swatch';
        swatch.style.backgroundColor = color;
        swatch.setAttribute('aria-label', `Select color ${color}`);
        swatch.setAttribute('role', 'button');
        swatch.dataset.color = color;
        
        swatch.addEventListener('click', () => {
            setColorFromHex(color);
        });
        
        paletteContainer.appendChild(swatch);
    });
}

/**
 * Update palette selection highlight
 */
function updatePaletteSelection() {
    const swatches = document.querySelectorAll('.palette-swatch');
    swatches.forEach(swatch => {
        if (swatch.dataset.color.toUpperCase() === state.currentColor.hex.toUpperCase()) {
            swatch.classList.add('selected');
        } else {
            swatch.classList.remove('selected');
        }
    });
}

// ===== INTERACTIVE COLOR PICKER =====

/**
 * Initialize the saturation/lightness canvas
 */
function initializeSLCanvas() {
    const canvas = document.getElementById('slCanvas');
    const ctx = canvas.getContext('2d');
    
    // Render the saturation/lightness gradient based on current hue
    renderSLGradient(ctx, state.currentColor.h);
}

/**
 * Render saturation/lightness gradient on canvas
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {number} hue - Current hue value (0-360)
 */
function renderSLGradient(ctx, hue) {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    
    // Get the base color for this hue at full saturation and 50% lightness
    const baseColor = hslToRgb(hue, 100, 50);
    
    // Create horizontal gradient for saturation (white to color)
    for (let x = 0; x < width; x++) {
        const saturation = (x / width) * 100;
        
        // Create vertical gradient for lightness (white to color to black)
        for (let y = 0; y < height; y++) {
            const lightness = 100 - (y / height) * 100;
            
            const rgb = hslToRgb(hue, saturation, lightness);
            ctx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }
}

/**
 * Update picker UI elements (hue slider and SL indicator)
 */
function updatePickerUI() {
    const hueSlider = document.getElementById('hueSlider');
    const indicator = document.getElementById('slIndicator');
    const canvas = document.getElementById('slCanvas');
    
    // Update hue slider value
    hueSlider.value = state.currentColor.h;
    
    // Calculate indicator position based on saturation and lightness
    const x = (state.currentColor.s / 100) * canvas.width;
    const y = ((100 - state.currentColor.l) / 100) * canvas.height;
    
    const canvasRect = canvas.getBoundingClientRect();
    indicator.style.left = `${canvasRect.left + x}px`;
    indicator.style.top = `${canvasRect.top + y}px`;
    
    // Re-render the SL gradient with current hue
    const ctx = canvas.getContext('2d');
    renderSLGradient(ctx, state.currentColor.h);
}

/**
 * Handle hue slider change
 */
function setupHueSlider() {
    const hueSlider = document.getElementById('hueSlider');
    
    hueSlider.addEventListener('input', (e) => {
        const hue = parseInt(e.target.value);
        setColorFromHsl(hue, state.currentColor.s, state.currentColor.l);
    });
}

/**
 * Handle saturation/lightness canvas interaction
 */
function setupSLCanvas() {
    const canvas = document.getElementById('slCanvas');
    const indicator = document.getElementById('slIndicator');
    
    const updateColorFromCanvas = (e) => {
        const rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        // Clamp values to canvas boundaries
        x = Math.max(0, Math.min(canvas.width, x));
        y = Math.max(0, Math.min(canvas.height, y));
        
        // Calculate saturation and lightness from position
        const saturation = (x / canvas.width) * 100;
        const lightness = 100 - (y / canvas.height) * 100;
        
        setColorFromHsl(state.currentColor.h, saturation, lightness);
    };
    
    // Mouse events
    canvas.addEventListener('mousedown', (e) => {
        state.isPickerDragging = true;
        updateColorFromCanvas(e);
    });
    
    document.addEventListener('mousemove', (e) => {
        if (state.isPickerDragging) {
            updateColorFromCanvas(e);
        }
    });
    
    document.addEventListener('mouseup', () => {
        state.isPickerDragging = false;
    });
    
    // Touch events for mobile support
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        state.isPickerDragging = true;
        const touch = e.touches[0];
        updateColorFromCanvas(touch);
    });
    
    document.addEventListener('touchmove', (e) => {
        if (state.isPickerDragging && e.touches.length > 0) {
            e.preventDefault();
            const touch = e.touches[0];
            updateColorFromCanvas(touch);
        }
    });
    
    document.addEventListener('touchend', () => {
        state.isPickerDragging = false;
    });
    
    // Keyboard accessibility
    canvas.setAttribute('tabindex', '0');
    canvas.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 10 : 1;
        let newS = state.currentColor.s;
        let newL = state.currentColor.l;
        
        switch(e.key) {
            case 'ArrowLeft':
                newS = Math.max(0, newS - step);
                break;
            case 'ArrowRight':
                newS = Math.min(100, newS + step);
                break;
            case 'ArrowUp':
                newL = Math.min(100, newL + step);
                break;
            case 'ArrowDown':
                newL = Math.max(0, newL - step);
                break;
            default:
                return;
        }
        
        e.preventDefault();
        setColorFromHsl(state.currentColor.h, newS, newL);
    });
}

// ===== MANUAL INPUT =====

/**
 * Update manual input fields without triggering validation
 */
function updateManualInputFields() {
    const hexInput = document.getElementById('hexInput');
    const rgbRInput = document.getElementById('rgbRInput');
    const rgbGInput = document.getElementById('rgbGInput');
    const rgbBInput = document.getElementById('rgbBInput');
    
    hexInput.value = state.currentColor.hex;
    rgbRInput.value = state.currentColor.r;
    rgbGInput.value = state.currentColor.g;
    rgbBInput.value = state.currentColor.b;
    
    // Clear any validation errors
    clearValidationError('hex');
    clearValidationError('rgb');
}

/**
 * Setup manual HEX input with validation
 */
function setupHexInput() {
    const hexInput = document.getElementById('hexInput');
    
    const validateAndApply = () => {
        let value = hexInput.value.trim().toUpperCase();
        
        // Auto-add # if missing
        if (value && !value.startsWith('#')) {
            value = '#' + value;
        }
        
        const rgb = hexToRgb(value);
        
        if (rgb) {
            setColorFromRgb(rgb.r, rgb.g, rgb.b);
            clearValidationError('hex');
        } else if (value) {
            showValidationError('hex', 'Enter a 6-digit HEX value like #3498DB');
        } else {
            clearValidationError('hex');
        }
    };
    
    hexInput.addEventListener('blur', validateAndApply);
    hexInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            validateAndApply();
        }
    });
}

/**
 * Setup manual RGB input with validation
 */
function setupRgbInput() {
    const rgbRInput = document.getElementById('rgbRInput');
    const rgbGInput = document.getElementById('rgbGInput');
    const rgbBInput = document.getElementById('rgbBInput');
    
    const validateAndApply = () => {
        const r = parseInt(rgbRInput.value);
        const g = parseInt(rgbGInput.value);
        const b = parseInt(rgbBInput.value);
        
        // Validate all three values
        const isValid = 
            !isNaN(r) && r >= 0 && r <= 255 &&
            !isNaN(g) && g >= 0 && g <= 255 &&
            !isNaN(b) && b >= 0 && b <= 255;
        
        if (isValid) {
            setColorFromRgb(r, g, b);
            clearValidationError('rgb');
        } else if (rgbRInput.value || rgbGInput.value || rgbBInput.value) {
            showValidationError('rgb', 'RGB values must be integers from 0 to 255');
        } else {
            clearValidationError('rgb');
        }
    };
    
    [rgbRInput, rgbGInput, rgbBInput].forEach(input => {
        input.addEventListener('blur', validateAndApply);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                validateAndApply();
            }
        });
    });
}

/**
 * Show validation error message
 * @param {string} type - 'hex' or 'rgb'
 * @param {string} message - Error message
 */
function showValidationError(type, message) {
    const errorElement = document.getElementById(`${type}Error`);
    const inputElement = document.getElementById(`${type}Input`) || document.getElementById(`${type}RInput`);
    
    errorElement.textContent = message;
    if (inputElement) {
        inputElement.classList.add('invalid');
    }
}

/**
 * Clear validation error message
 * @param {string} type - 'hex' or 'rgb'
 */
function clearValidationError(type) {
    const errorElement = document.getElementById(`${type}Error`);
    const inputElement = document.getElementById(`${type}Input`) || document.getElementById(`${type}RInput`);
    
    errorElement.textContent = '';
    if (inputElement) {
        inputElement.classList.remove('invalid');
    }
    
    // Clear invalid class from all RGB inputs
    if (type === 'rgb') {
        document.getElementById('rgbGInput').classList.remove('invalid');
        document.getElementById('rgbBInput').classList.remove('invalid');
    }
}

// ===== TEXT PREVIEW =====

/**
 * Setup text preview input
 */
function setupTextPreview() {
    const previewInput = document.getElementById('previewText');
    
    previewInput.addEventListener('input', (e) => {
        state.previewText = e.target.value || 'Sample Text Preview';
        updateTextPreview();
    });
}

// ===== COPY TO CLIPBOARD =====

/**
 * Copy text to clipboard with feedback
 * @param {string} text - Text to copy
 * @param {string} feedbackId - ID of feedback element
 */
async function copyToClipboard(text, feedbackId) {
    try {
        // Try modern clipboard API first
        if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(text);
            showCopyFeedback(feedbackId);
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            const successful = document.execCommand('copy');
            document.body.removeChild(textarea);
            
            if (successful) {
                showCopyFeedback(feedbackId);
            } else {
                console.error('Clipboard copy failed');
            }
        }
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
    }
}

/**
 * Show copy feedback message
 * @param {string} feedbackId - ID of feedback element
 */
function showCopyFeedback(feedbackId) {
    const feedback = document.getElementById(feedbackId);
    feedback.textContent = 'Copied!';
    feedback.classList.add('show');
    
    setTimeout(() => {
        feedback.classList.remove('show');
    }, 2000);
}

/**
 * Setup copy buttons
 */
function setupCopyButtons() {
    document.getElementById('copyHex').addEventListener('click', () => {
        copyToClipboard(state.currentColor.hex, 'copyHexFeedback');
    });
    
    document.getElementById('copyRgb').addEventListener('click', () => {
        const { r, g, b } = state.currentColor;
        copyToClipboard(`${r}, ${g}, ${b}`, 'copyRgbFeedback');
    });
    
    document.getElementById('copyCmyk').addEventListener('click', () => {
        const cmyk = rgbToCmyk(state.currentColor.r, state.currentColor.g, state.currentColor.b);
        copyToClipboard(`${cmyk.c}, ${cmyk.m}, ${cmyk.y}, ${cmyk.k}`, 'copyCmykFeedback');
    });
}

// ===== PINNED COLORS =====

/**
 * Pin the current color to the queue (max 8, FIFO)
 */
function pinCurrentColor() {
    const colorHex = state.currentColor.hex;
    
    // Add to queue
    state.pinnedColors.push({
        hex: colorHex,
        r: state.currentColor.r,
        g: state.currentColor.g,
        b: state.currentColor.b,
        timestamp: Date.now()
    });
    
    // Enforce max 8 colors (FIFO - remove oldest if exceeding)
    if (state.pinnedColors.length > 8) {
        state.pinnedColors.shift(); // Remove first (oldest) element
    }
    
    renderPinnedColors();
}

/**
 * Render pinned color swatches
 */
function renderPinnedColors() {
    const container = document.getElementById('pinnedColors');
    const countElement = document.getElementById('pinnedCount');
    
    container.innerHTML = '';
    countElement.textContent = `(${state.pinnedColors.length}/8)`;
    
    if (state.pinnedColors.length === 0) {
        container.classList.add('empty');
        container.textContent = 'No pinned colors yet';
        return;
    }
    
    container.classList.remove('empty');
    
    state.pinnedColors.forEach((color, index) => {
        const swatch = document.createElement('button');
        swatch.className = 'pinned-swatch';
        swatch.style.backgroundColor = color.hex;
        swatch.setAttribute('aria-label', `Restore color ${color.hex}`);
        swatch.setAttribute('role', 'button');
        
        swatch.addEventListener('click', () => {
            setColorFromRgb(color.r, color.g, color.b);
        });
        
        container.appendChild(swatch);
    });
}

/**
 * Setup pin button
 */
function setupPinButton() {
    const pinBtn = document.getElementById('pinColorBtn');
    
    pinBtn.addEventListener('click', () => {
        pinCurrentColor();
    });
}

// ===== THEME TOGGLE =====

/**
 * Initialize theme from localStorage or system preference
 */
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
}

/**
 * Toggle between light and dark theme
 */
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'light');
    }
}

/**
 * Setup theme toggle button
 */
function setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    
    themeToggle.addEventListener('click', () => {
        toggleTheme();
    });
}

// ===== INITIALIZATION =====

/**
 * Initialize the application
 */
function initializeApp() {
    // Initialize theme
    initializeTheme();
    setupThemeToggle();
    
    // Render predefined palette
    renderPalette();
    
    // Initialize interactive picker
    initializeSLCanvas();
    setupHueSlider();
    setupSLCanvas();
    
    // Setup manual inputs
    setupHexInput();
    setupRgbInput();
    
    // Setup text preview
    setupTextPreview();
    
    // Setup copy buttons
    setupCopyButtons();
    
    // Setup pin button
    setupPinButton();
    
    // Render initial pinned colors
    renderPinnedColors();
    
    // Render all color outputs with default color
    renderAllColorOutputs();
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
