# Color Code Picker - User Guide

## Overview
Color Code Picker is a fully client-side web application for selecting, previewing, and converting colors between different formats. The application runs entirely in your browser with no backend dependencies, no database, and no external API calls.

## Getting Started

### Opening the Application
1. Locate the `index.html` file in the application folder
2. Double-click the file to open it in your default browser, OR
3. Right-click the file and select "Open with" to choose a specific browser
4. Supported browsers: Latest versions of Chrome, Edge, and Firefox

The application will load immediately and is ready to use without any setup or installation.

## Features

### 1. Predefined Color Palette
**Location:** Input Panel (left column on desktop)

- Choose from 24 commonly used colors displayed as clickable swatches
- Click any swatch to select that color
- The selected swatch will be highlighted with a blue border
- All outputs and previews update instantly

### 2. Interactive Color Picker
**Location:** Input Panel (left column on desktop)

The picker consists of two controls:

**Hue Slider:**
- Drag the slider to select the base hue (color family)
- Range: 0° to 360° across the full color spectrum

**Saturation & Lightness Canvas:**
- Click or drag anywhere in the colored area to adjust saturation and lightness
- Horizontal movement: Changes saturation (left = less saturated, right = more saturated)
- Vertical movement: Changes lightness (top = lighter, bottom = darker)
- A circular indicator shows your current selection
- **Keyboard support:** Use arrow keys to fine-tune (Shift + arrows for larger steps)

### 3. Manual Color Input
**Location:** Input Panel (left column on desktop)

**HEX Input:**
- Enter a 6-digit hexadecimal color code
- Format: `#RRGGBB` (e.g., `#3498DB`)
- The `#` symbol is optional - it will be added automatically
- Press Enter or click outside the field to apply
- Invalid entries will show an error message without changing the current color

**RGB Input:**
- Enter Red, Green, and Blue values separately
- Each value must be an integer between 0 and 255
- Press Enter or click outside any field to apply
- Invalid entries will show an error message without changing the current color

### 4. Text Preview
**Location:** Comparison Panel (middle column on desktop)

- Type any text in the input field
- The preview area below displays your text in the currently selected color
- Default text: "Sample Text Preview"
- Useful for checking color readability and appearance

### 5. Color Code Outputs
**Location:** Results Panel (right column on desktop)

The current color is displayed in three formats:

**HEX:** 6-digit hexadecimal format (e.g., `#3498DB`)
**RGB:** Red, Green, Blue values from 0-255 (e.g., `52, 152, 219`)
**CMYK:** Cyan, Magenta, Yellow, Black percentages (e.g., `76, 31, 0, 14`)

Each format has a copy button (📋 icon):
- Click the copy button to copy that format to your clipboard
- A "Copied!" message appears briefly to confirm
- The copied value can be pasted into any application

### 6. Current Color Swatch
**Location:** Results Panel, top section

- Large visual display of the currently selected color
- Updates instantly when you select a new color
- Uses a checkered background to show transparency for very light colors

### 7. Pinned Colors
**Location:** Results Panel, bottom section

**Pinning Colors:**
- Click the "Pin This Color" button to save the current color
- Pinned colors appear as clickable swatches below
- Maximum: 8 colors
- When you pin a 9th color, the oldest pinned color is automatically removed (FIFO queue)

**Using Pinned Colors:**
- Click any pinned swatch to restore that color as your current selection
- All outputs and controls update to match the restored color
- The counter shows how many colors you have pinned (e.g., "3/8")

**Note:** Pinned colors are session-based and will be cleared when you refresh the page

## Responsive Layout

**Desktop (≥1024px width):**
- Three panels displayed side-by-side
- Input Panel | Comparison Panel | Results Panel

**Tablet/Mobile (<1024px width):**
- Panels stack vertically
- All features remain fully functional
- Scrolling may be required

## Tips & Best Practices

1. **Quick Color Selection:** Use the predefined palette for common colors, then fine-tune with the interactive picker
2. **Precise Values:** Use manual input when you know the exact color code you need
3. **Color Comparisons:** Pin multiple colors to compare them visually
4. **Readability Testing:** Use the text preview to check if text will be readable in your chosen color
5. **Workflow Integration:** Copy color codes directly to your clipboard for use in design tools, code editors, or documentation

## Keyboard Accessibility

- **Tab:** Navigate between interactive elements
- **Enter:** Apply manual input values
- **Space/Enter:** Activate buttons and swatches
- **Arrow Keys:** Adjust saturation/lightness when canvas is focused
- **Shift + Arrow Keys:** Larger adjustments in the picker canvas

All interactive elements have visible focus indicators for keyboard navigation.

## Edge Cases & Limitations

- **Pure White:** Displayed with a checkered background for visibility
- **Pure Black:** CMYK output will be `0, 0, 0, 100` (100% black only)
- **Invalid Input:** Rejected gracefully with error messages; previous valid color is preserved
- **Clipboard Access:** If clipboard permissions are denied, copy operations may fail silently
- **Session Storage:** Pinned colors are not saved between sessions (no localStorage used)

## Technical Details

- **Technology Stack:** HTML5, CSS3, vanilla JavaScript ES6+
- **No Dependencies:** No frameworks, libraries, or external resources required
- **File Size:** Lightweight (~30KB total for all files)
- **Performance:** Updates targeted at <16ms for smooth interaction
- **Browser Requirements:** Modern browsers with Canvas API support

## Troubleshooting

**Problem:** Application doesn't load
- **Solution:** Ensure you're using a modern browser (Chrome, Edge, Firefox)
- **Solution:** Check that JavaScript is enabled in your browser

**Problem:** Copy button doesn't work
- **Solution:** Grant clipboard permissions when prompted by your browser
- **Solution:** Try manually selecting and copying the displayed value

**Problem:** Colors look different on mobile
- **Solution:** This may be due to display calibration differences, not the application

**Problem:** Pinned colors disappeared
- **Solution:** Pinned colors are cleared on page refresh - this is by design

## About

**Version:** 1.0  
**Release Date:** March 2026  
**License:** Fully client-side, no backend required  
**Compatibility:** Chrome, Edge, Firefox (latest versions)

---

For any issues or questions, refer to the source code comments in `app.js` for detailed technical documentation.
