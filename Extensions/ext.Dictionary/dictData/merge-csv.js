const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { stringify } = require('csv-stringify');

// 配置参数
const INPUT_DIR = './SEALang'; // 替换为你的CSV文件夹路径
const OUTPUT_FILE = './merged_SEALang.csv';
const ENCODING = 'utf8';

// 检查输入目录是否存在
if (!fs.existsSync(INPUT_DIR)) {
    console.error(`错误：目录 "${INPUT_DIR}" 不存在`);
    process.exit(1);
}

// 获取目录中的所有CSV文件
const files = fs.readdirSync(INPUT_DIR)
    .filter(file => file.toLowerCase().endsWith('.csv'))
    .map(file => path.join(INPUT_DIR, file));

if (files.length === 0) {
    console.error(`错误：目录 "${INPUT_DIR}" 中没有找到CSV文件`);
    process.exit(1);
}

console.log(`找到 ${files.length} 个CSV文件:`);
files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${path.basename(file)}`);
});

// 存储所有数据
const allData = [];

// 递归处理所有CSV文件
function processFile(fileIndex) {
    if (fileIndex >= files.length) {
        // 所有文件处理完成，开始写入合并后的CSV
        writeMergedCSV();
        return;
    }

    const filePath = files[fileIndex];
    const fileName = path.basename(filePath, '.csv'); // 获取文件名（不含后缀）
    const fileData = [];
    
    console.log(`正在处理: ${path.basename(filePath)}`);
    
    fs.createReadStream(filePath, { encoding: ENCODING })
        .pipe(csv())
        .on('data', (row) => {
            // 为每条记录添加源文件名
            row.source_file = fileName;
            fileData.push(row);
        })
        .on('end', () => {
            console.log(`  成功读取 ${fileData.length} 条记录`);
            allData.push(...fileData);
            processFile(fileIndex + 1);
        })
        .on('error', (err) => {
            console.error(`  处理文件 ${path.basename(filePath)} 时出错:`, err.message);
            processFile(fileIndex + 1);
        });
}

// 写入合并后的CSV文件
function writeMergedCSV() {
    if (allData.length === 0) {
        console.error('错误：没有找到任何数据');
        return;
    }

    // 获取所有列名（包括source_file）
    const headers = Object.keys(allData[0]);
    
    // 确保source_file列在最后（可选）
    const sourceFileIndex = headers.indexOf('source_file');
    if (sourceFileIndex > -1) {
        headers.splice(sourceFileIndex, 1);
        headers.push('source_file');
    }
    
    const stringifier = stringify({
        header: true,
        columns: headers
    });
    
    const writableStream = fs.createWriteStream(OUTPUT_FILE, { encoding: ENCODING });
    
    stringifier.pipe(writableStream);
    
    allData.forEach(row => {
        stringifier.write(row);
    });
    
    stringifier.end();
    
    writableStream.on('finish', () => {
        console.log(`\n完成！合并后的文件已保存到: ${OUTPUT_FILE}`);
        console.log(`总共合并了 ${allData.length} 条记录`);
        console.log(`列名: ${headers.join(', ')}`);
    });
    
    writableStream.on('error', (err) => {
        console.error('写入输出文件时出错:', err.message);
    });
}

// 开始处理
console.log('\n开始合并CSV文件...');
processFile(0);