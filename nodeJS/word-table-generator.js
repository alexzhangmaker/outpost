// word-table-generator.js
const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

class WordTableGenerator {
    constructor() {
        this.workbook = new ExcelJS.Workbook();
        this.workbook.creator = '单词记忆表格生成器';
        this.workbook.created = new Date();
    }

    // 计算精确的列宽（单位为Excel的字符宽度）
    calculateColumnWidth() {
        // A4纸宽度：210mm
        // 左右边距各0.7英寸 = 1.4英寸 = 35.56mm
        // 可打印区域宽度 = 210mm - 35.56mm = 174.44mm
        
        // Excel中列宽的单位：1个单位 ≈ 1个字符的宽度
        // 实际换算：1mm ≈ 0.44个Excel列宽单位
        const printableWidthMM = 210 - (0.7 * 2 * 25.4); // 转换为毫米计算
        const printableWidthInExcelUnits = printableWidthMM * 0.44;
        
        // 四等分，每列宽度
        const columnWidth = printableWidthInExcelUnits / 4;
        
        console.log(`📏 列宽计算:`);
        console.log(`   - A4纸宽度: 210mm`);
        console.log(`   - 左右边距: ${0.7 * 2}英寸 = ${(0.7 * 2 * 25.4).toFixed(2)}mm`);
        console.log(`   - 可打印区域: ${printableWidthMM.toFixed(2)}mm`);
        console.log(`   - Excel单位宽度: ${printableWidthInExcelUnits.toFixed(2)}`);
        console.log(`   - 每列宽度: ${columnWidth.toFixed(2)}`);
        
        return Math.round(columnWidth * 10) / 10; // 保留一位小数
    }

    // 生成单词记忆表格
    async generateWordTable(words, options = {}) {
        const {
            rowsPerPage = 34,
            fontFamily = 'Arial',
            fontSize = 18,
            outputPath = './单词记忆表.xlsx'
        } = options;

        console.log(`\n开始生成表格...`);
        console.log(`单词数量: ${words.length}`);
        console.log(`字体: ${fontFamily}, 字号: ${fontSize}`);
        console.log(`每页行数: ${rowsPerPage}`);

        // 计算精确列宽
        const columnWidth = this.calculateColumnWidth();

        // 每页实际单词行数 = 总行数 - 表头行
        const wordRowsPerPage = rowsPerPage - 1;
        // 每页可以容纳的单词数 = 单词行数 * 2
        const wordsPerPage = wordRowsPerPage * 2;
        const totalPages = Math.ceil(words.length / wordsPerPage);

        console.log(`总页数: ${totalPages}`);

        for (let page = 0; page < totalPages; page++) {
            const worksheet = this.workbook.addWorksheet(`第${page + 1}页`);
            console.log(`生成第 ${page + 1} 页...`);

            // 设置页面布局和打印设置
            this.setupPageLayout(worksheet);
            
            // 设置列宽 - 四列等宽
            worksheet.columns = [
                { width: columnWidth },
                { width: columnWidth },
                { width: columnWidth },
                { width: columnWidth }
            ];

            // 添加表头
            this.addTableHeader(worksheet, fontFamily, fontSize);

            const startIndex = page * wordsPerPage;
            const endIndex = Math.min(startIndex + wordsPerPage, words.length);

            // 添加单词行
            for (let i = 0; i < wordRowsPerPage; i++) {
                const wordIndex1 = startIndex + i * 2;
                const wordIndex2 = startIndex + i * 2 + 1;

                const row = worksheet.addRow([
                    wordIndex1 < endIndex ? words[wordIndex1] : '',
                    '', // 中文意思留空
                    wordIndex2 < endIndex ? words[wordIndex2] : '',
                    ''  // 中文意思留空
                ]);

                // 设置行样式
                this.setRowStyle(row, fontFamily, fontSize, i);
            }
        }

        // 确保输出目录存在
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // 保存Excel文件
        console.log('正在保存Excel文件...');
        await this.workbook.xlsx.writeFile(outputPath);
        console.log(`✅ Excel文件已生成: ${path.resolve(outputPath)}`);
        return outputPath;
    }

    // 设置页面布局和打印设置
    setupPageLayout(worksheet) {
        worksheet.pageSetup = {
            paperSize: 9, // A4
            orientation: 'portrait', // 纵向
            fitToPage: true,
            fitToHeight: 1,
            fitToWidth: 1,
            margins: {
                left: 0.7,   // 0.7英寸
                right: 0.7,  // 0.7英寸
                top: 0.75,   // 0.75英寸
                bottom: 0.75, // 0.75英寸
                header: 0.3, // 0.3英寸
                footer: 0.3  // 0.3英寸
            }
        };
    }

    // 添加表头
    addTableHeader(worksheet, fontFamily, fontSize) {
        const headerRow = worksheet.addRow(['英语单词', '中文意思', '英语单词', '中文意思']);
        
        // 设置表头样式
        headerRow.eachCell((cell, colNumber) => {
            cell.font = {
                name: fontFamily,
                size: fontSize,
                bold: true,
                color: { argb: '000000' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'F2F2F2' }
            };
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = {
                vertical: 'middle',
                horizontal: 'left'
            };
        });

        // 设置表头行高
        headerRow.height = 35;
    }

    // 设置行样式
    setRowStyle(row, fontFamily, fontSize, rowIndex) {
        row.eachCell((cell, colNumber) => {
            // 设置字体
            cell.font = {
                name: fontFamily,
                size: fontSize,
                color: { argb: '000000' }
            };

            // 设置边框
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                right: { style: 'thin' },
                bottom: { style: 'thin' }
            };

            // 为中文意思列（第2和第4列）设置底部实线
            if (colNumber === 2 || colNumber === 4) {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' },
                    bottom: { style: 'medium' } // 底部实线
                };
            }

            // 设置英语单词列为粗体
            if (colNumber === 1 || colNumber === 3) {
                cell.font = {
                    name: fontFamily,
                    size: fontSize,
                    bold: true,
                    color: { argb: '000000' }
                };
            }

            cell.alignment = {
                vertical: 'middle',
                horizontal: 'left'
            };
        });

        // 设置行高
        row.height = 30;
    }

    // 生成测试数据
    generateTestWords() {
        const testWords = [];
        
        // 英文单词 (20个)
        const englishWords = [
            'apple', 'banana', 'computer', 'education', 'language', 
            'student', 'teacher', 'book', 'pencil', 'school',
            'knowledge', 'science', 'mathematics', 'history', 'music',
            'art', 'sports', 'friend', 'family', 'house'
        ];
        testWords.push(...englishWords);

        // 中文单词 (20个)
        const chineseWords = [
            '苹果', '香蕉', '电脑', '教育', '语言', 
            '学生', '老师', '书本', '铅笔', '学校',
            '知识', '科学', '数学', '历史', '音乐',
            '艺术', '运动', '朋友', '家庭', '房子'
        ];
        testWords.push(...chineseWords);

        // 泰语单词 (20个)
        const thaiWords = [
            'สวัสดี', 'ขอบคุณ', 'ยินดีต้อนรับ', 'ลาก่อน', 'อาหาร',
            'น้ำ', 'บ้าน', 'โรงเรียน', 'หนังสือ', 'คอมพิวเตอร์',
            'การศึกษา', 'ความรู้', 'ภาษา', 'คณิตศาสตร์', 'สมุดบันทึก',
            'ส้ม', 'ดินสอ', 'คำถาม', 'วิทยาศาสตร์', 'ครู'
        ];
        testWords.push(...thaiWords);

        return testWords;
    }
}

// 测试函数
async function runTest() {
    console.log('🚀 开始测试单词记忆表格生成器...\n');
    
    // 生成测试数据
    console.log('📝 生成测试单词...');
    const generator = new WordTableGenerator();
    const testWords = generator.generateTestWords();
    console.log(`生成的测试单词数量: ${testWords.length}`);
    console.log('');

    try {
        // 测试1: 使用Arial字体 - 创建新的生成器实例
        console.log('🧪 测试1: 使用Arial字体（精确列宽）');
        const generator1 = new WordTableGenerator();
        await generator1.generateWordTable(testWords, {
            rowsPerPage: 34,
            fontFamily: 'Arial',
            fontSize: 18,
            outputPath: './test-output/单词记忆表-精确列宽.xlsx'
        });

        console.log('\n🎉 测试完成！');
        console.log('📁 生成的Excel文件保存在 test-output 目录中');
        console.log('\n✅ 请打开Excel文件检查：');
        console.log('   - 四列是否完全等宽');
        console.log('   - 是否充分利用了页面宽度');
        console.log('   - 打印预览效果是否符合预期');

    } catch (error) {
        console.error('\n❌ 测试失败:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    // 检查是否安装了exceljs
    try {
        require.resolve('exceljs');
    } catch (e) {
        console.log('❌ 未找到exceljs模块，请先安装依赖：');
        console.log('   npm install exceljs');
        process.exit(1);
    }

    runTest().catch(console.error);
}

module.exports = WordTableGenerator;