function fitTextToWidth(element, targetWidth, options = {}) {
  const {
    minFontSize = 8, // Minimum font size in pixels
    maxFontSize = 100, // Maximum font size in pixels
    step = 0.5, // Font size adjustment step (in pixels) for precision
  } = options;

  // Get initial font size or set a reasonable starting point
  let fontSize = parseFloat(getComputedStyle(element).fontSize) || 16;

  // Temporarily set overflow to hidden to measure width accurately
  const originalOverflow = element.style.overflow;
  element.style.overflow = 'hidden';

  // Binary search or iterative approach to find the right font size
  while (fontSize >= minFontSize && fontSize <= maxFontSize) {
    element.style.fontSize = `${fontSize}px`;
    const currentWidth = element.scrollWidth; // Use scrollWidth to account for content width

    if (currentWidth <= targetWidth) {
      // Content fits, try a larger font size
      const nextFontSize = fontSize + step;
      if (currentWidth === targetWidth || nextFontSize > maxFontSize) {
        break; // Perfect fit or max font size reached
      }
      fontSize = nextFontSize;
    } else {
      // Content too wide, reduce font size
      fontSize -= step;
      if (fontSize < minFontSize) {
        fontSize = minFontSize; // Enforce minimum
        break;
      }
    }
  }

  // Apply final font size
  element.style.fontSize = `${fontSize}px`;
  element.style.overflow = originalOverflow; // Restore original overflow

  return fontSize; // Optional: return the final font size
}

/*
// Usage example
const element = document.querySelector('.my-element');
fitTextToWidth(element, 200, { minFontSize: 10, maxFontSize: 50, step: 0.5 }); // Fit text to 200px width
*/


//demo https://codepen.io/alexzhangmaker/pen/RNPBWGb