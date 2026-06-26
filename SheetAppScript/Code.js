/**
 * OnOpen trigger to create the custom menus and automatically launch the sidebar console.
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  // Create top-level menu 'sheetStudio', and a sub-menu 'word studio' with control items
  ui.createMenu('sheetStudio')
    .addSubMenu(
      ui.createMenu('word studio')
        .addItem('打开控制台', 'openSidebar')
        .addItem('导出JSON', 'exportJson')
        .addItem('导入单词清单', 'importWordList')
        .addItem('checkAnswer', 'checkAnswer')
    )
    .addToUi();
    
  // Automatically open the sidebar when the spreadsheet is opened
  try {
    openSidebar();
  } catch (e) {
    // Catch simple trigger permission restrictions silently.
    // The menu will still load, and users can click '打开控制台' to launch it.
    console.warn("Could not auto-open sidebar on startup: " + e.toString());
  }
}

/**
 * Renders and opens the custom sidebar console for the user.
 */
function openSidebar() {
  try {
    var html = HtmlService.createTemplateFromFile('sidebar')
        .evaluate()
        .setTitle('sheetStudio 控制台');
    SpreadsheetApp.getUi().showSidebar(html);
  } catch (e) {
    SpreadsheetApp.getUi().alert('发生错误', e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Validates if the given sheet is named 'wordSheet' and contains all required headers.
 * Shows appropriate alert dialogs if invalid.
 * 
 * @param {GoogleAppsScript.Spreadsheet.Sheet} sheet The sheet to validate.
 * @return {boolean} True if valid, false otherwise.
 */
function validateWordSheet(sheet) {
  if (!sheet) return false;
  
  if (sheet.getName() !== 'wordSheet') {
    SpreadsheetApp.getUi().alert('提示', '该操作只能在名为 "wordSheet" 的工作表上执行！\n当前工作表为：' + sheet.getName(), SpreadsheetApp.getUi().ButtonSet.OK);
    return false;
  }
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 1) {
    SpreadsheetApp.getUi().alert('错误', '工作表 "wordSheet" 没有数据。', SpreadsheetApp.getUi().ButtonSet.OK);
    return false;
  }
  
  var headers = data[0].map(function(h) {
    return String(h).trim().toLowerCase();
  });
  
  var required = ['word', 'meaning', 'audiourl', 'encodeword', 'chinese'];
  var missing = [];
  
  for (var i = 0; i < required.length; i++) {
    if (headers.indexOf(required[i]) === -1) {
      var origName = required[i];
      if (origName === 'audiourl') origName = 'audioURL';
      else if (origName === 'encodeword') origName = 'encodeWord';
      else if (origName === 'chinese') origName = 'Chinese';
      missing.push(origName);
    }
  }
  
  if (missing.length > 0) {
    SpreadsheetApp.getUi().alert(
      '错误', 
      '工作表 "wordSheet" 的第一行（标题）必须包含以下几个字段：\n' + missing.join(', ') + '\n\n当前表头字段为：\n' + data[0].join(', '), 
      SpreadsheetApp.getUi().ButtonSet.OK
    );
    return false;
  }
  
  return true;
}

/**
 * Main function called when clicking '导出JSON' (either from menu or sidebar).
 * It restricts execution to 'wordSheet', validates headers,
 * and opens the export dialog.
 */
function exportJson() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    if (!validateWordSheet(sheet)) {
      return;
    }
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function(h) { 
      return String(h).trim().toLowerCase(); 
    });
    var origHeaders = data[0].map(function(h) {
      return String(h).trim();
    });
    var rows = data.slice(1);
    
    var wordColIndex = headers.indexOf('word');
    var meaningColIndex = headers.indexOf('meaning');
    var audioColIndex = headers.indexOf('audiourl');
    var encodeWordColIndex = headers.indexOf('encodeword');
    var chineseColIndex = headers.indexOf('chinese');
    
    var exportList = [];
    
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      
      var word = String(row[wordColIndex]).trim();
      if (!word) continue; // Skip rows where the word column is empty
      
      var meaning = String(row[meaningColIndex]).trim();
      var audioURL = String(row[audioColIndex]).trim();
      var encodeWord = String(row[encodeWordColIndex]).trim();
      var chinese = String(row[chineseColIndex]).trim();
      
      // Auto-generate fallback audioURL if none is provided
      if (!audioURL) {
        audioURL = 'https://googleapi-w56agazoha-uc.a.run.app/?text=' + encodeURIComponent(word);
      }
      
      var item = {
        word: word,
        meaning: meaning,
        audioURI: audioURL, // kept as audioURI in JSON to maintain backward compatibility
        encodeWord: encodeWord,
        Chinese: chinese
      };
      
      // Add other columns dynamically to prevent data loss
      for (var c = 0; c < headers.length; c++) {
        if (c !== wordColIndex && c !== meaningColIndex && c !== audioColIndex && c !== encodeWordColIndex && c !== chineseColIndex) {
          var headerName = origHeaders[c] || ('column_' + (c + 1));
          item[headerName] = row[c];
        }
      }
      
      exportList.push(item);
    }
    
    if (exportList.length === 0) {
      SpreadsheetApp.getUi().alert('提示', '未找到有效的词汇数据。请确保 "word" 列不为空。', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var jsonString = JSON.stringify(exportList, null, 2);
    
    // Evaluate HTML template and pass variables
    var template = HtmlService.createTemplateFromFile('dialog');
    template.jsonString = jsonString;
    template.fileName = sheet.getName() + '_' + new Date().toISOString().split('T')[0] + '.json';
    
    var htmlOutput = template.evaluate()
        .setWidth(600)
        .setHeight(500)
        .setTitle('导出 JSON - word studio');
        
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '导出 JSON');
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('发生错误', e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Serves the HTML modal dialog for importing a word list.
 * Restricts execution to 'wordSheet' with valid headers.
 */
function importWordList() {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    if (!validateWordSheet(sheet)) {
      return;
    }
    
    var template = HtmlService.createTemplateFromFile('import_dialog');
    var htmlOutput = template.evaluate()
        .setWidth(500)
        .setHeight(400)
        .setTitle('导入单词清单 - word studio');
    SpreadsheetApp.getUi().showModalDialog(htmlOutput, '导入单词清单');
  } catch (e) {
    SpreadsheetApp.getUi().alert('发生错误', e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}

/**
 * Writes an array of words to Column A of 'wordSheet' starting at A2, after clearing the existing content in Column A.
 * Restricts execution to 'wordSheet' with valid headers.
 * 
 * @param {string[]} wordList Array of words to import.
 * @return {object} Result object containing success state and details.
 */
function writeWordsToSheet(wordList) {
  try {
    var sheet = SpreadsheetApp.getActiveSheet();
    if (!validateWordSheet(sheet)) {
      return { success: false, error: '当前工作表不合法，必须是名为 "wordSheet" 且包含指定列的工作表。' };
    }
    
    if (!wordList || !Array.isArray(wordList) || wordList.length === 0) {
      return { success: false, error: '导入的单词列表为空' };
    }
    
    // Process words into a 2D array: [[word1], [word2], ...]
    var values = wordList.map(function(word) {
      return [String(word).trim()];
    }).filter(function(row) {
      return row[0].length > 0;
    });
    
    if (values.length === 0) {
      return { success: false, error: '未检测到任何有效的非空单词' };
    }
    
    // Clear column A starting from row 2 to avoid leaving trailing old words
    var lastRow = sheet.getLastRow();
    if (lastRow >= 2) {
      sheet.getRange(2, 1, lastRow - 1, 1).clearContent();
    }
    
    // Write new words starting from cell A2 (row 2, column 1)
    sheet.getRange(2, 1, values.length, 1).setValues(values);
    
    return { success: true, count: values.length };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Checks answers in 'checkSheet' by sending the answer phrase and definitions
 * to the semantic matching API. Writes 'right', 'wrong', or an error to the check column.
 */
function checkAnswer() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("checkSheet");
    if (!sheet) {
      SpreadsheetApp.getUi().alert('错误', '找不到名为 "checkSheet" 的工作表！', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var data = sheet.getDataRange().getValues();
    if (data.length < 2) {
      SpreadsheetApp.getUi().alert('提示', '工作表 "checkSheet" 中没有足够的数据（需要表头和至少一行数据）。', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var headers = data[0].map(function(h) { 
      return String(h).trim().toLowerCase(); 
    });
    
    // Find column indexes
    var wordCol = headers.indexOf('word');
    var meaningCol = headers.indexOf('meaning');
    var chineseCol = headers.indexOf('chinese');
    var answerCol = headers.indexOf('answer');
    var checkCol = headers.indexOf('check');
    
    if (wordCol === -1 || meaningCol === -1 || chineseCol === -1 || answerCol === -1 || checkCol === -1) {
      SpreadsheetApp.getUi().alert('错误', '工作表 "checkSheet" 必须包含以下列：word, meaning, Chinese, answer, check', SpreadsheetApp.getUi().ButtonSet.OK);
      return;
    }
    
    var rows = data.slice(1);
    var url = "https://thai-semantic-match-worker.alexszhang.workers.dev";
    var checkedCount = 0;
    
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      var answer = String(row[answerCol]).trim();
      
      // Skip empty answers
      if (!answer) continue;
      
      var word = String(row[wordCol]).trim();
      var meaning = String(row[meaningCol]).trim();
      var chinese = String(row[chineseCol]).trim();
      
      // Parse meaning and Chinese into definitions list
      var meaningParts = meaning.split(/;|；|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
      var chineseParts = chinese.split(/;|；|\n/).map(function(s) { return s.trim(); }).filter(Boolean);
      
      var definitions = [];
      var maxLen = Math.max(meaningParts.length, chineseParts.length);
      for (var i = 0; i < maxLen; i++) {
        definitions.push({
          English: meaningParts[i] || "",
          Chinese: chineseParts[i] || ""
        });
      }
      
      // Fallback if split results are empty but strings are not
      if (definitions.length === 0 && (meaning || chinese)) {
        definitions.push({
          English: meaning,
          Chinese: chinese
        });
      }
      
      var payload = {
        phrase: answer,
        definitions: definitions
      };
      
      var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
        muteHttpExceptions: true
      };
      
      var checkValue = "wrong";
      try {
        var response = UrlFetchApp.fetch(url, options);
        var responseText = response.getContentText();
        var json = JSON.parse(responseText);
        
        if (json && json.error) {
          checkValue = "error: " + json.error;
        } else {
          var isCorrect = false;
          if (json.isCorrect !== undefined) isCorrect = (json.isCorrect === true || json.isCorrect === 'true');
          else if (json.correct !== undefined) isCorrect = (json.correct === true || json.correct === 'true');
          else if (json.match !== undefined) isCorrect = (json.match === true || json.match === 'true');
          else if (json.is_semantically_close !== undefined) isCorrect = (json.is_semantically_close === true || json.is_semantically_close === 'true');
          
          checkValue = isCorrect ? "right" : "wrong";
        }
      } catch (err) {
        checkValue = "error: " + err.toString();
      }
      
      // Write result back to cell
      // Row index in sheet: r + 2 (since r is 0-based and header is row 1)
      // Column index in sheet: checkCol + 1
      sheet.getRange(r + 2, checkCol + 1).setValue(checkValue);
      SpreadsheetApp.flush(); // Update sheet visually in real-time
      checkedCount++;
    }
    
    SpreadsheetApp.getUi().alert('完成', '已成功检查了 ' + checkedCount + ' 个回答！', SpreadsheetApp.getUi().ButtonSet.OK);
    
  } catch (e) {
    SpreadsheetApp.getUi().alert('发生错误', e.toString(), SpreadsheetApp.getUi().ButtonSet.OK);
  }
}
