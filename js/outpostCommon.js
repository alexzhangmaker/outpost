function flowType(element, options = {}) {
    const settings = {
    minimum: options.minimum || 500,
    maximum: options.maximum || 1200,
    minFont: options.minFont || 16,
    maxFont: options.maxFont || 40,
    fontRatio: options.fontRatio || 35
    };

    function adjustFontSize() {
        const width = element.offsetWidth;
        let fontSize = width / settings.fontRatio;

        fontSize = Math.max(settings.minFont, Math.min(fontSize, settings.maxFont));
        element.style.fontSize = fontSize + 'px';
    }

    window.addEventListener('resize', adjustFontSize);
    window.addEventListener('orientationchange', adjustFontSize);
    adjustFontSize(); // initial run
}

/*
make a contenteditable = true element to paste plain text only
*/
function handlePlainTextPaste(element) {
    element.addEventListener('paste', (event) => {
        // Prevent default paste behavior
        event.preventDefault();
        
        // Get plain text from clipboard
        const plainText = (event.clipboardData || window.clipboardData).getData('text/plain');
        
        // Set the plain text as innerText
        element.innerText = plainText;
    });
}