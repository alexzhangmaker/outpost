function sendEmailContentToEndpoint() {
  // Define the search query (e.g., unread emails with a specific subject)
  //var query = "from:admin@krungsri.com subject:YourSubject is:unread";

  var query = 'from:admin@krungsri.com subject:"Result of bill payment"';
  var threads = GmailApp.search(query, 0, 100); // Search for up to 10 emails

  // Your HTTPS endpoint URL
  var endpointUrlBase = "https://outpost-8d74e-4ec53.asia-southeast1.firebasedatabase.app/receipts";//"https://your-endpoint.com/api/receive-email";

  var urlKbankReceipts = `https://outpost-8d74e-4ec53.asia-southeast1.firebasedatabase.app/receipts.json` ;
  let responseReceipts = UrlFetchApp.fetch(urlKbankReceipts)  ;
  let respContent = responseReceipts.getContentText() ;
  let jsonReceipts = JSON.parse(respContent) ;
  //console.log(jsonReceipts) ;
  let receiptKeys = Object.keys(jsonReceipts) ;
  console.log(receiptKeys) ;

  
  // Iterate through email threads
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      
      // Extract email details
      var jsonMailContent = parseKrunsriBankReceipt(message.getPlainBody());//parseReceipt2JSON(message.getPlainBody()) ;

      let jsonReceipt = normalizeKeys(jsonMailContent) ;
      console.log(jsonReceipt) ;
      //if(receiptKeys.includes(`receipt_${jsonReceipt.ReferenceNo}`))continue ;

      var endpointUrl = `${endpointUrlBase}/receipt_${jsonReceipt.ReferenceNo}.json` ;
      console.log(endpointUrl) ;
      
      // Send to HTTPS endpoint
      try {
        var options = {
          method: "PUT",
          contentType: "application/json",
          payload: JSON.stringify(jsonReceipt)
        };
        var response = UrlFetchApp.fetch(endpointUrl, options);
        //Logger.log("Successfully sent email data: " + response.getContentText());

        // Optionally mark the email as read
        message.markRead();
        let recipientEmail="alexszhang@outlook.com"
        message.forward(recipientEmail/*, {}*/);
      } catch (e) {
        Logger.log("Error sending email data: " + e.toString());
      }
    }
  }

  GmailApp.moveThreadsToTrash(threads) ;
  
}


function handleKrunsriReceipt() {
  // Define the search query (e.g., unread emails with a specific subject)
  //var query = "from:admin@krungsri.com subject:Result of bill payment (Success) is:unread";
  var query = 'from:admin@krungsri.com subject:"Result of bill payment"';
  var threads = GmailApp.search(query, 0, 3); // Search for up to 10 emails

  // Your HTTPS endpoint URL
  var endpointUrlBase = "https://outpost-8d74e-4ec53.asia-southeast1.firebasedatabase.app/receipts";//"https://your-endpoint.com/api/receive-email";

  // Iterate through email threads
  for (var i = 0; i < threads.length; i++) {
    var messages = threads[i].getMessages();
    for (var j = 0; j < messages.length; j++) {
      var message = messages[j];
      
      // Extract email details
      var jsonMailContent = parseKrunsriBankReceipt(message.getPlainBody());//parseReceipt2JSON(message.getPlainBody()) ;
      console.log(jsonMailContent) ;

      let jsonReceipt = normalizeKeys(jsonMailContent) ;
      console.log(jsonReceipt) ;

      var endpointUrl = `${endpointUrlBase}/receipt_${jsonReceipt.ReferenceNo}.json` ;
      console.log(endpointUrl) ;
      
      // Send to HTTPS endpoint
      try {
        var options = {
          method: "PUT",
          contentType: "application/json",
          payload: JSON.stringify(jsonReceipt)
        };
        var response = UrlFetchApp.fetch(endpointUrl, options);
        //Logger.log("Successfully sent email data: " + response.getContentText());

        // Optionally mark the email as read
        message.markRead();

        //forward to backup mailbox
        let recipientEmail="alexszhang@outlook.com"
        message.forward(recipientEmail/*, {}*/);
        
      } catch (e) {
        Logger.log("Error sending email data: " + e.toString());
      }
    }
  }
}



function normalizeKeys(data) {
  // Define the characters that need to be removed from the keys.
  const invalidChars = ['.', '/', '-', ' '];
  
  // If the data is not an object or an array, return it as is.
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  // If the data is an array, iterate through its elements and recursively normalize them.
  if (Array.isArray(data)) {
    return data.map(normalizeKeys);
  }

  // If the data is an object, create a new object to hold the normalized keys.
  const newObject = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      // Create the new, normalized key by replacing each invalid character with an empty string.
      let newKey = key;
      for (const char of invalidChars) {
        newKey = newKey.split(char).join('');
      }

      // Recursively normalize the value associated with the key.
      const value = normalizeKeys(data[key]);

      // Assign the value to the new key in the new object.
      newObject[newKey] = value;
    }
  }

  return newObject;
}


function parseKrunsriBankReceipt(mailContent) {
  const receiptData = {};
  
  try {
    // A single, more powerful regex to find all "*Key:* Value" pairs.
    // Explanation:
    // \*([^*]+):\*: Matches the pattern "*KEY:*". Captures the KEY inside parentheses.
    // ([^]+?): Captures the VALUE. The [^] matches any character, including newlines. The ? makes it non-greedy.
    // (?=\*|$): A lookahead that stops the capture right before the next asterisk or at the end of the string.
    const keyValuePairRegex = /\*([^*]+):\*([^]+?)(?=\*|$)/g;

    let match;
    
    // Iterate through all matches found by the regex.
    while ((match = keyValuePairRegex.exec(mailContent)) !== null) {
      // Clean up the key and value.
      const key = match[1].trim().replace(/\s+/g, '').replace(/\(THB\)/, '');
      let value = match[2].trim();
      
      // Convert specific keys to numbers if they are amounts or fees.
      if (key === 'Amount' || key === 'Fee') {
        value = parseFloat(value);
      }
      
      // Store the cleaned key-value pair in the object.
      receiptData[key] = value;
    }
  } catch (error) {
    console.error("Failed to parse the receipt content:", error);
    return {}; // Return an empty object on error
  }
  
  return receiptData;
}

