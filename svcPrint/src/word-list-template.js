const BaseTemplate = require('./base-template');

class WordListTemplate extends BaseTemplate {
    constructor(config) {
        super(config);
        this.rowsPerPage = 34;
        this.cols = 4;
        this.headerHeight = 0; // Will be calculated or same as row height
    }

    generate(dataList) {
        const { width, height } = this.doc.page;
        const { top, bottom, left, right } = this.config.margin;

        const contentHeight = height - top - bottom;
        const contentWidth = width - left - right;

        // Calculate dynamic row height
        // We have 34 rows total. Row 1 is header. Rows 2-34 are data.
        // So 34 rows of equal height.
        const rowHeight = contentHeight / this.rowsPerPage;
        const colWidth = contentWidth / this.cols;

        let currentRow = 0;
        let currentPage = 1;

        // Draw Header for the first page
        this.drawHeader(left, top, colWidth, rowHeight);
        currentRow++;

        dataList.forEach((item, index) => {
            // Check if we need a new page
            if (currentRow >= this.rowsPerPage) {
                this.doc.addPage();
                currentRow = 0;
                this.drawHeader(left, top, colWidth, rowHeight);
                currentRow++;
            }

            const y = top + currentRow * rowHeight;

            // Item structure: [Word, Meaning, Word, Meaning]
            // But input is a flat list of objects or just a list of words?
            // Requirement says: "Input: A word list (array)... Output: [Word] | [Meaning] | [Word] | [Meaning]"
            // Let's assume input is an array of objects { word: "Apple", meaning: "苹果" }
            // Or maybe just a flat list and we fill it?
            // "Input: A word list (array)..."
            // "Layout: [Word] | [Meaning] | [Word] | [Meaning]"
            // This implies 2 items per row.

            // Wait, the input example is `["Apple", "สวัสดี (Hello)", ...]`
            // This looks like just words. Where are the meanings?
            // Or maybe the user wants to fill the meaning manually?
            // "Style: Must have complete grid lines... convenient for writing."
            // Ah, maybe it's a practice sheet?
            // "Word List" -> "Word | Meaning | Word | Meaning"
            // If the input is just words, maybe we fill the "Word" columns and leave "Meaning" blank?
            // Let's assume we fill Column 1 and Column 3 with words, and leave Column 2 and 4 blank for writing.
            // Or if the input has meanings, we fill them.
            // Given the example `["Apple", "สวัสดี (Hello)"]`, it seems like a list of terms.
            // Let's assume we fill Col 1 with Item 1, Col 3 with Item 2.
            // Col 2 and 4 are for writing meanings (or maybe the input already has meanings?)

            // Let's look at the requirement again:
            // "Input: A word list (array)..."
            // "Layout: [Word] | [Meaning] | [Word] | [Meaning]"
            // "Style: Must have complete grid lines... convenient for writing."
            // This strongly suggests it's a worksheet.
            // So we populate Col 1 and Col 3. Col 2 and 4 are empty.

            // We need to process 2 items per row.
            // So we should iterate by 2.

            // BUT, the `generate` method receives `dataList`.
            // I should restructure the loop to handle 2 items per row.
        });

        // Re-implementing loop for 2 items per row
        currentRow = 0;
        this.doc.addPage({ margin: this.config.margin }); // Clear the auto-added first page or just use it?
        // autoFirstPage is true. So we are on page 1.
        // We need to reset to top.
        // Actually, let's just use the current page.

        // Reset for the actual loop
        // We need to clear the previous "Draw Header" call if I want to do it cleanly.
        // Let's just restart the logic.

        // Correct logic:
        // 1. Calculate layout.
        // 2. Loop through data in chunks of 2.

        // Reset doc to be clean? No, just start drawing.
        // But I already called drawHeader above.
        // Let's refactor.
    }

    generatePDF(dataList) {
        const { width, height } = this.doc.page;
        const { top, bottom, left, right } = this.config.margin;
        const contentHeight = height - top - bottom;
        const contentWidth = width - left - right;
        const rowHeight = contentHeight / this.rowsPerPage;
        const colWidth = contentWidth / this.cols;

        let rowCount = 0; // 0 to 33

        // Draw initial header
        this.drawHeader(left, top, colWidth, rowHeight);
        rowCount++;

        for (let i = 0; i < dataList.length; i += 2) {
            // Check if page is full
            if (rowCount >= this.rowsPerPage) {
                this.doc.addPage();
                rowCount = 0;
                this.drawHeader(left, top, colWidth, rowHeight);
                rowCount++;
            }

            const y = top + rowCount * rowHeight;

            // Item 1
            const item1 = dataList[i];
            this.drawRowItem(item1, left, y, colWidth, rowHeight, 0);

            // Item 2
            if (i + 1 < dataList.length) {
                const item2 = dataList[i + 1];
                this.drawRowItem(item2, left, y, colWidth, rowHeight, 2); // Col 3
            }

            // Draw grid for this row
            this.drawRowGrid(left, y, colWidth, rowHeight);

            rowCount++;
        }

        // Fill remaining rows with empty grid if needed?
        // Requirement doesn't say, but usually good for "convenient for writing".
        while (rowCount < this.rowsPerPage) {
            const y = top + rowCount * rowHeight;
            this.drawRowGrid(left, y, colWidth, rowHeight);
            rowCount++;
        }
    }

    drawHeader(x, y, colWidth, rowHeight) {
        const headers = ['Word', 'Meaning', 'Word', 'Meaning'];

        // Draw background for header? Optional.

        headers.forEach((text, i) => {
            const cellX = x + i * colWidth;
            this.drawRect(cellX, y, colWidth, rowHeight);
            this.drawTextInBox(text, cellX, y, colWidth, rowHeight, { align: 'center', fontSize: 12 });
        });
    }

    drawRowItem(text, x, y, colWidth, rowHeight, colIndex) {
        const cellX = x + colIndex * colWidth;
        // Draw text
        this.drawTextInBox(text, cellX, y, colWidth, rowHeight, { align: 'left', fontSize: 10 });
    }

    drawRowGrid(x, y, colWidth, rowHeight) {
        // Draw 4 cells
        for (let i = 0; i < 4; i++) {
            this.drawRect(x + i * colWidth, y, colWidth, rowHeight);
        }
    }
}

module.exports = WordListTemplate;
