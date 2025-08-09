/**
 * Parses the content of a receipt email and extracts key information into a JSON object.
 * This function uses a single, more robust regular expression to find all key-value pairs
 * formatted as "*Key:* Value". It is designed to be resilient to variations in spacing.
 *
 * @param {string} mailContent The raw string content of the receipt email.
 * @returns {object} A JSON object containing the parsed receipt details, or an empty object on failure.
 */
function parseKBankReceipt(mailContent) {
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
  
  // Example Usage:
  const mailContent = `*Dear ZHANG QING,* Please be notified of your bill payment transaction via krungsri app as follows:   *Transaction Result:* Success *Type of Transaction:* Bill Payment *From Account:* QING ZHANG *To Biller:* โบ๊ต เชียงใหม่ *Amount (THB):* 370.00 *Fee (THB):* 0.00 *Merchant ID:* KB000001923021 *Transaction ID:* KPS004KB000001923021 *Reference No.:* BAYM4474588395 *Date/Time:* 09/08/2025 19:01:48 *Memo:* In case you are totally unaware of the transaction or the activity mentioned above please immediately contact Krungsri Call Center 1572 (Overseas call 66-2296-2000 # 1) to take necessary security actions.   This e-mail is automatically sent to you by system. Please do not reply.For further enquiry, please immediately contact Krungsri Call Center 1572 (Overseas call 66-2296-2000 # 1)   Thank you for using our services.   Yours sincerely,Online ServiceBank of Ayudhya Public Company Limited `;
  
  const parsedReceipt = parseKBankReceipt(mailContent);
  console.log(parsedReceipt);
  
  /*
  Expected Output:
  {
    "TransactionResult": "Success",
    "TypeofTransaction": "Bill Payment",
    "FromAccount": "QING ZHANG",
    "ToBiller": "โบ๊ต เชียงใหม่",
    "Amount": 370,
    "Fee": 0,
    "MerchantID": "KB000001923021",
    "TransactionID": "KPS004KB000001923021",
    "ReferenceNo.": "BAYM4474588395",
    "Date/Time": "09/08/2025 19:01:48",
    "Memo": ""
  }
  */

/*
Assumptions and How the Function Works

The function's resilience comes from its use of a single, flexible regular expression (keyValuePairRegex). This regex makes a primary assumption about the structure of your email content:

Assumption: Every piece of data you want to extract is formatted as a bolded key followed by a colon and then its value. For example: *Key:* Value.

The regex, /\*([^*]+):\*([^]+?)(?=\*|$)/g, is specifically crafted to match this pattern. Let's break down how it works:

\*([^*]+):\* : This part looks for an asterisk (\*), then captures one or more characters that are not asterisks ([^*]+), followed by a colon and another asterisk. This is how it finds and captures the key (like "Transaction Result" or "Amount (THB)").

([^]+?): This part then captures the value. [^] is a special character class that matches any character, including newlines. The ? makes it "non-greedy," meaning it captures as few characters as possible.

(?=\*|$): This is a "lookahead" assertion. It tells the regex to stop capturing the value right before it encounters the next asterisk (\*) or the very end of the string ($). This is a key part of why it works so well—it knows exactly where one value ends and the next one begins.

======
Strengths (What Makes It Resilient)

Based on this design, the function is resilient to a number of common variations:

Whitespace and Newlines: It can handle extra spaces, tabs, or newlines between the key-value pairs. For example, *Key:* Value and *Key:*\nValue will both work.

Order of Fields: The function doesn't care about the order of the key-value pairs in the email. It will find and parse them no matter where they are located.

Missing Fields: If a particular key (e.g., *Memo:*) is missing from the email, the regex simply won't find a match, and that key won't be added to the final JSON object. It won't cause the function to fail.

Extra Text: It is also resilient to extra, unformatted text around the key-value pairs, as long as that text doesn't contain the *Key:* pattern. The regex will skip over the text at the beginning of your email, for instance.

====
Limitations (What Could Break It)

While it's resilient for this specific format, the function is not a general-purpose parser. It would likely fail if:

The format changes: If the bank changes its email template and removes the asterisks or the colon (e.g., Key - Value), the regex would no longer find any matches.

The key name changes: If "Transaction Result" was changed to "Transaction Outcome," the replace logic might need to be updated.

Multi-line values: While the [^] character class can handle newlines, the non-greedy lookahead (?=\*|$) assumes the value is a single block of text ending before the next *. If a value itself contained an asterisk or spanned multiple paragraphs that didn't end with a subsequent *Key:*, the regex could behave unexpectedly.

Nested data: This function is designed to handle a flat list of keys and values. It wouldn't be able to parse a more complex, nested structure if the email contained one.

Essentially, this function is a specialized tool built for a specific, predictable job. It's highly effective for parsing that exact receipt format, but it's not robust enough to handle radically different email layouts.

*/