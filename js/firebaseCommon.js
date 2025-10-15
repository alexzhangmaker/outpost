/**
 * 检查字符串是否包含 Firebase 路径不允许的字符
 * @param {string} str - 要检查的字符串
 * @param {boolean} includeUnrecommended - 是否也检查不推荐的字符（空格、非ASCII字符等）
 * @returns {Object} 检查结果对象
 */
function containsInvalidFirebaseChars(str) {
  if (typeof str !== 'string') {
    return {
      isValid: false,
      reason: '输入必须是一个字符串'
    };
  }

  // 绝对不允许的字符
  const forbiddenChars = ['.', '$', '[', ']', '#', '/'];
  // 在正则表达式中需要转义的字符
  const forbiddenCharsEscaped = ['\\.', '\\$', '\\[', '\\]', '\\#', '\\/'];
  
  const forbiddenRegex = new RegExp(`[${forbiddenCharsEscaped.join('')}]`);
  
  // 检查绝对不允许的字符
  const forbiddenMatch = str.match(forbiddenRegex);
  if (forbiddenMatch) {
    return {
      isValid: false,
      reason: `包含不允许的字符: ${forbiddenMatch[0]}`,
      invalidChars: forbiddenMatch,
      forbiddenChars: forbiddenChars
    };
  }
  
  return {
    isValid: true,
    reason: '字符串有效'
  };
}


/**
 * 增强版检查函数 - 包含不推荐字符检查
 * @param {string} str - 要检查的字符串
 * @param {Object} options - 配置选项
 * @param {boolean} options.checkUnrecommended - 是否检查不推荐的字符
 * @param {boolean} options.checkThreeDots - 是否特别检查三个点符号
 * @returns {Object} 检查结果对象
 */
function validateFirebasePathString(str, options = {}) {
  const {
    checkUnrecommended = true,
    checkThreeDots = true
  } = options;

  if (typeof str !== 'string') {
    return {
      isValid: false,
      reason: '输入必须是一个字符串'
    };
  }

  const result = {
    isValid: true,
    reason: '字符串有效',
    warnings: [],
    invalidChars: [],
    forbiddenChars: ['.', '$', '[', ']', '#', '/']
  };

  // 1. 检查绝对不允许的字符
  const forbiddenChars = ['.', '$', '[', ']', '#', '/'];
  const forbiddenCharsEscaped = ['\\.', '\\$', '\\[', '\\]', '\\#', '\\/'];
  const forbiddenRegex = new RegExp(`[${forbiddenCharsEscaped.join('')}]`, 'g');
  
  const forbiddenMatches = str.match(forbiddenRegex);
  if (forbiddenMatches) {
    result.isValid = false;
    result.reason = `包含不允许的字符: ${forbiddenMatches.join(', ')}`;
    result.invalidChars = forbiddenMatches;
    return result;
  }

  // 2. 检查三个点符号（特别危险）
  if (checkThreeDots && str.includes('…')) {
    result.isValid = false;
    result.reason = '包含三个点符号 (…)，这在 Firebase 安全规则中是通配符';
    result.invalidChars.push('…');
    return result;
  }

  // 3. 检查不推荐的字符（可选）
  if (checkUnrecommended) {
    // 检查空格
    if (str.includes(' ')) {
      result.warnings.push('包含空格，不推荐在 Firebase 路径中使用');
    }
    
    // 检查非 ASCII 字符
    const nonAsciiRegex = /[^\x00-\x7F]/g;
    const nonAsciiMatches = str.match(nonAsciiRegex);
    if (nonAsciiMatches) {
      result.warnings.push(`包含非 ASCII 字符: ${nonAsciiMatches.join(', ')}`);
    }
    
    // 检查控制字符
    const controlCharsRegex = /[\x00-\x1F\x7F]/g;
    const controlMatches = str.match(controlCharsRegex);
    if (controlMatches) {
      result.warnings.push('包含控制字符，不推荐使用');
    }
    
    if (result.warnings.length > 0) {
      result.reason = '字符串有效，但有警告';
    }
  }

  return result;
}


/**
 * 简单检查 - 只返回布尔值
 * @param {string} str - 要检查的字符串
 * @returns {boolean} 是否包含不允许的字符
 */
function hasInvalidFirebaseChars(str) {
  if (typeof str !== 'string') return true;
  
  // 绝对不允许的字符
  const forbiddenRegex = /[\.\$\[\]\#\/]/;
  // 三个点符号
  const threeDots = str.includes('…');
  
  return forbiddenRegex.test(str) || threeDots;
}

function toolSmith(){
  // 测试示例
const testCases = [
  'validName',
  'valid_name',
  'name with spaces',
  'name.with.dots',
  'name$dollar',
  'name[ bracket',
  'path/with/slash',
  'name…withdots',
  '名字', // 中文
  'emoji😀'
];

console.log('=== Firebase 路径字符检查 ===');
testCases.forEach(testCase => {
  const result = validateFirebasePathString(testCase, {
    checkUnrecommended: true,
    checkThreeDots: true
  });
  
  console.log(`"${testCase}" -> ${result.isValid ? '有效' : '无效'}`);
  if (!result.isValid) {
    console.log(`  原因: ${result.reason}`);
  } else if (result.warnings.length > 0) {
    console.log(`  警告: ${result.warnings.join('; ')}`);
  }
});

// 简单检查使用
console.log('\n=== 简单检查 ===');
console.log(`"user.name": ${hasInvalidFirebaseChars('user.name')}`); // true
console.log(`"username": ${hasInvalidFirebaseChars('username')}`);   // false
}