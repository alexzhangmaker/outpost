const express = require('express');
const path = require('path');

const app = express();
const port = 3000;

// --- 配置要服务的目录 ---
// 这里可以混合使用相对路径和绝对路径
const staticDirectories = [
  'public',       // 相对路径 (相对于 server.js)
  'assets',       // 相对路径
  // --- 示例：一个绝对路径 ---
  // 请根据您的操作系统和实际路径进行修改
  // (Windows 示例: 'C:\\Users\\YourUser\\Documents\\my-shared-assets')
  // (macOS/Linux 示例: '/Users/yourname/projects/shared-vendor')
  "/Users/zhangqing/Documents/Github/outpost"
];

console.log('正在设置静态文件服务...');

staticDirectories.forEach(dir => {
  let absolutePath;

  // 检查路径是否已经是绝对路径
  if (path.isAbsolute(dir)) {
    // 如果是，直接使用
    absolutePath = dir;
    console.log(`- (绝对) ${absolutePath}`);
  } else {
    // 如果不是，就和 __dirname 拼接
    absolutePath = path.join(__dirname, dir);
    console.log(`- (相对) ${absolutePath}`);
  }

  app.use(express.static(absolutePath));
});

app.listen(port, () => {
  console.log(`\n服务器已成功启动！`);
  console.log(`正在监听: http://localhost:${port}`);
});