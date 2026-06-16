const PDFDocument = require('pdfkit');
const fontkit = require('fontkit');
const fs = require('fs');
const path = require('path');

class BaseTemplate {
    constructor(config = {}) {
        this.config = {
            size: 'A4',
            margin: {
                top: 50,
                bottom: 50,
                left: 40,
                right: 40
            },
            ...config
        };

        this.doc = new PDFDocument({
            size: this.config.size,
            margins: this.config.margin,
            autoFirstPage: true
        });

        this.registerFonts();
    }

    registerFonts() {
        // Register fontkit - PDFKit uses it automatically if installed
        // this.doc.registerFontkit(fontkit);

        this.availableFonts = {
            'Thai': false,
            'SC': false
        };

        // Register fonts
        // Note: Using absolute paths or relative to the execution context
        const fontDir = path.join(process.cwd(), 'fonts');

        const thaiFontPath = path.join(fontDir, 'NotoSansThai-Regular.ttf');
        const scFontPath = path.join(fontDir, 'NotoSansSC-Regular.otf');

        if (fs.existsSync(thaiFontPath)) {
            try {
                this.doc.registerFont('Thai', thaiFontPath);
                this.availableFonts['Thai'] = true;
            } catch (e) {
                console.warn(`Error registering Thai font: ${e.message}`);
            }
        } else {
            console.warn(`Warning: Thai font not found at ${thaiFontPath}`);
        }

        if (fs.existsSync(scFontPath)) {
            try {
                this.doc.registerFont('SC', scFontPath);
                this.availableFonts['SC'] = true;
            } catch (e) {
                console.warn(`Error registering SC font: ${e.message}`);
            }
        } else {
            console.warn(`Warning: SC font not found at ${scFontPath}`);
            // Fallback to Arial Unicode if available (macOS)
            const arialUnicodePath = '/Library/Fonts/Arial Unicode.ttf';
            if (fs.existsSync(arialUnicodePath)) {
                try {
                    this.doc.registerFont('SC', arialUnicodePath);
                    this.availableFonts['SC'] = true;
                    console.log(`Using fallback font for SC: ${arialUnicodePath}`);
                } catch (e) {
                    console.warn(`Error registering fallback SC font: ${e.message}`);
                }
            }
        }
    }

    // Helper to detect Thai characters
    isThai(text) {
        return /[\u0E00-\u0E7F]/.test(text);
    }

    // Draw text in a box with font fallback
    drawTextInBox(text, x, y, width, height, options = {}) {
        const {
            align = 'left',
            fontSize = 10,
            padding = 2
        } = options;

        // Determine font based on content
        // If text contains Thai, use Thai font for the whole cell (simplification)
        // Ideally we would split, but for word lists usually it's one language per cell or mixed.
        // If mixed, NotoSansThai might not support Chinese, and NotoSansSC might not support Thai.
        // However, usually NotoSansSC covers Latin. NotoSansThai covers Latin.
        // So if it has Thai, use Thai font. If it has Chinese, use SC.
        // Priority: Thai > SC (default)
        let fontName = 'Helvetica'; // Default fallback

        if (this.isThai(text)) {
            if (this.availableFonts['Thai']) {
                fontName = 'Thai';
            }
        } else {
            if (this.availableFonts['SC']) {
                fontName = 'SC';
            }
        }

        this.doc.font(fontName).fontSize(fontSize);

        // Calculate text height to center vertically if needed
        const textHeight = this.doc.heightOfString(text, { width: width - padding * 2 });
        const textY = y + (height - textHeight) / 2;

        // Draw text
        // We use a slightly adjusted y for vertical centering
        // But for strict grid, maybe top alignment with padding is better?
        // Let's try vertical centering.

        this.doc.text(text, x + padding, textY, {
            width: width - padding * 2,
            align: align,
            lineBreak: false,
            ellipsis: true
        });
    }

    drawLine(x1, y1, x2, y2) {
        this.doc.moveTo(x1, y1)
            .lineTo(x2, y2)
            .stroke();
    }

    drawRect(x, y, w, h) {
        this.doc.rect(x, y, w, h).stroke();
    }

    save(filepath) {
        const dir = path.dirname(filepath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        this.doc.pipe(fs.createWriteStream(filepath));
        this.doc.end();
        console.log(`PDF saved to ${filepath}`);
    }
}

module.exports = BaseTemplate;
