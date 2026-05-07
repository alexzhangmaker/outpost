

function appMeta(){
    return {
        name:'balance.Anywhere',
        title:'balance.Anywhere',
        appTitle:_appTitle,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio,
        renderHeadTools:_renderHeadTools,
        //renderNavTools:_renderNavTools,
        injectStyle:_injectStyle_AppBoxAnywhere
    } ;
}


const _appTitle = ()=>{
    return 'deal.Anywhere' ;
} ;


const _style_AppMediumAnywhere=`` ;
const _injectStyle_AppBoxAnywhere = ()=>{
    const styleElement = document.createElement('style');
    styleElement.textContent = _style_AppMediumAnywhere;
    // Append the style to the document head
    document.head.appendChild(styleElement);
};


const _renderNavTools=async (tagAppNavTool)=>{
    tagAppNavTool.classList.remove('noShow') ;
    tagAppNavTool.innerHTML=`
        <!----
        <i class="bi-wallet2 outpostBTN" id="idBTNPayement"></i>
        <i class="bi-currency-exchange outpostBTN" id="idBTNIncome"></i>
        -->
    ` ;

    tippy('#idBTNPayement', {content: "Receipts!"});
    tippy('#idBTNIncome', {content: "Income!"});
    
} ;

const _renderHeadTools=async (tagAppIconTools)=>{
    tagAppIconTools.innerHTML=`
        <i class="bi-list-check outpostBTN" id="idBTNShowDrawer"></i>
    ` ; 
    tagAppIconTools.classList.add('balanceAnywhereTools') ;

    tagAppIconTools.querySelector('#idBTNShowDrawer').addEventListener('click',(event)=>{
        const drawer = document.querySelector('.drawer-overview');
        const closeButton = drawer.querySelector('sl-button[variant="primary"]');
    
        drawer.show();
        closeButton.addEventListener('click', () => drawer.hide());
    }) ;
    
} ;


const _renderPanel=async (tagPanel)=>{
    console.log('appBox _renderPanel') ;
    let tagToggle = document.querySelector('#idBTNToggleNavBar') ;
    tagToggle.classList.add('noShow') ;
    tagPanel.dataset.rendered='true' ;    
} ;

const _renderWorkStudio=async (tagRightPanelMain)=>{
    //tagRightPanelMain.innerHTML=``;
} ;


function genOutpostID(){
    let now = dayjs() ;
    let cDate = now.format("YYYYMMDD") ;
    const array = new Uint16Array(1);
    window.crypto.getRandomValues(array);
    // To get a number between 1000 and 9999 (inclusive)
    const random4Digit = 1000 + (array[0] % 9000);
    console.log(random4Digit);
    return `${cDate}${random4Digit}` ;
}

document.getElementById('idBTNShowDealLogs').addEventListener('click',async (event)=>{
    let urlFBDealLogs=`https://aesop-portfolio.asia-southeast1.firebasedatabase.app/dealLogs.json` ;
    let result = await fetch(urlFBDealLogs) ;
    let jsonDealLogs = await result.json() ;
    console.log(jsonDealLogs) ;

    async function removeDealLog(dealID){
        let urlDeal=`https://aesop-portfolio.asia-southeast1.firebasedatabase.app/dealLogs/${dealID}.json` ;
        let result = await fetch(urlDeal, {method: "DELETE"}) ;
    }

    function renderDealLog(tagContainer,jsonDeal){
        console.log(jsonDeal) ;
        let tagDeal = document.createElement('div') ;
        tagDeal.classList.add('dealLogItem') ;
        tagContainer.prepend(tagDeal) ;
        tagDeal.dataset.dealID = jsonDeal.dealID ;
        tagDeal.innerHTML=`
            <div class="dealLogContent">
                  <div style="flex-grow: 1;">
                    <span>${jsonDeal.date}</span>
                    <span contenteditable="true">${jsonDeal.account}</span>
                    <span>${jsonDeal.action}</span>
                    <span>${jsonDeal.ticker}</span>
                    <span>${jsonDeal.quantity}</span>
                    <span>${jsonDeal.price}</span>
                    <span id="idClearState">${jsonDeal.cleared}</span>
                </div>
                <div>
                    <i class="bi-check2-square outpostBTN" id="idBTNCheckInDeal"></i>
                    <i class="bi-x-square outpostBTN" id="idBTNCancelDeal"></i>
                </div>
            </div>
        ` ;
        
        tagDeal.querySelector('#idBTNCancelDeal').addEventListener('click',async (event)=>{
            event.stopPropagation() ;
            //alert('cancel') ;
            await removeDealLog(tagDeal.dataset.dealID) ;
            tagDeal.remove() ;
        }) ;
        tagDeal.querySelector('#idBTNCheckInDeal').addEventListener('click',async (event)=>{
            event.stopPropagation() ;
        }) ;
    }

    dealKeys = Object.keys(jsonDealLogs) ;
    console.log(dealKeys) ;
    let tagLogContainer = document.querySelector(".dealHistoryWnd");
    tagLogContainer.innerHTML=`` ;
    for(let i=0;i<dealKeys.length;i++){
        renderDealLog(tagLogContainer,jsonDealLogs[dealKeys[i]]) ;
    }
}) ;


const tradeForm = document.getElementById('tradeForm');
const actionInput = document.getElementById('action');
const accountSelect = document.getElementById('account');
const marketSelect = document.getElementById('market');
const tickerInput = document.getElementById('ticker');
const quantityInput = document.getElementById('quantity');
const priceInput = document.getElementById('price');
const dateInput = document.getElementById('date');
//const errorDiv = document.getElementById('error');
//const parsedOutput = document.getElementById('parsedOutput');
//const submitMessage = document.getElementById('submitMessage');
const autocompleteList = document.getElementById('autocompleteList');

// Set default date to today (2025-08-04)
const today = '2025-08-04';
dateInput.value = today;

// Initialize Cleave.js for quantity and date
new Cleave('#quantity', {
    numeral: true,
    numeralThousandsGroupStyle: 'none',
    numeralDecimalScale: 0,
    numeralPositiveOnly: true
});

new Cleave('#date', {
    date: true,
    datePattern: ['Y', 'm', 'd'],
    delimiter: '-'
});

// Clear text inputs on focus
[tickerInput, quantityInput, priceInput, dateInput].forEach(input => {
    input.addEventListener('focus', () => {
        input.value = '';
    });
});

// Autocomplete for ticker
tickerInput.addEventListener('input', () => {
    const market = marketSelect.value;
    const query = tickerInput.value.toUpperCase();
    autocompleteList.innerHTML = '';
    autocompleteList.style.display = 'none';

    if (query) {
        const filteredTickers = tickers[market].filter(t => t.startsWith(query));
        if (filteredTickers.length) {
            filteredTickers.forEach(ticker => {
                const li = document.createElement('li');
                li.textContent = ticker;
                li.addEventListener('click', () => {
                    tickerInput.value = ticker;
                    autocompleteList.style.display = 'none';
                    quantityInput.focus();
                });
                autocompleteList.appendChild(li);
            });
            autocompleteList.style.display = 'block';
        }
    }
});

// Hide autocomplete on click outside
document.addEventListener('click', (e) => {
    if (!tickerInput.contains(e.target) && !autocompleteList.contains(e.target)) {
        autocompleteList.style.display = 'none';
    }
});

// Handle TAB and ENTER for navigation
const inputs = [actionInput, accountSelect, marketSelect, tickerInput, quantityInput, priceInput, dateInput, tradeForm.querySelector('button')];
inputs.forEach((input, index) => {
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            const nextIndex = (index + 1) % inputs.length;
            inputs[nextIndex].focus();
            if (input === tickerInput && autocompleteList.style.display === 'block' && autocompleteList.children.length > 0) {
                tickerInput.value = autocompleteList.children[0].textContent;
                autocompleteList.style.display = 'none';
                inputs[nextIndex].focus();
            }
        }
    });
});

// Validate and parse inputs
function validateInputs() {
    const action = actionInput.checked ? 'BUY' : 'SELL';
    const account = accountSelect.value;
    const market = marketSelect.value;
    const ticker = tickerInput.value.toUpperCase();
    const quantity = quantityInput.value;
    const price = priceInput.value;
    const date = dateInput.value;

    /*
    // Validate ticker
    if (!ticker || !/^[A-Za-z0-9]+$/.test(ticker)) {
        errorDiv.textContent = 'Invalid ticker format';
        return null;
    }
    */
    if (!tickers[market].includes(ticker)) {
        //errorDiv.textContent = `Ticker ${ticker} not found in ${market} market`;
        return null;
    }

    // Validate quantity
    if (!/^\d+$/.test(quantity) || parseInt(quantity) <= 0) {
        //errorDiv.textContent = 'Quantity must be a positive integer';
        return null;
    }

    // Validate price
    if (!price || parseFloat(price) <= 0) {
        //errorDiv.textContent = 'Price must be a positive number';
        return null;
    }

    // Validate date
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(date)) {
        //errorDiv.textContent = 'Date must be in YYYY-MM-DD format';
        return null;
    }
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
        //errorDiv.textContent = 'Invalid date';
        return null;
    }

    return { action, account, market, ticker, quantity, price, date };
}

// Display parsed output
function displayParsedOutput(data) {
    if (data) {
        console.log(`
            <strong>Parsed Trade:</strong><br>
            Action: ${data.action}<br>
            Account: ${data.account}<br>
            Market: ${data.market}<br>
            Ticker: ${data.ticker}<br>
            Quantity: ${data.quantity}<br>
            Price: ${data.price}<br>
            Date: ${data.date}
        `);
    }
}

// Validate and parse on input change
inputs.forEach(input => {
    input.addEventListener('change', () => {
        //errorDiv.textContent = '';
        //submitMessage.textContent = '';
        const data = validateInputs();
        displayParsedOutput(data);
    });
    input.addEventListener('input', () => {
        //errorDiv.textContent = '';
        //submitMessage.textContent = '';
        const data = validateInputs();
        displayParsedOutput(data);
    });
});

// Form submission
tradeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    //errorDiv.textContent = '';
    //submitMessage.textContent = '';

    const jsonDeal = validateInputs();
    if (!jsonDeal) {
        return;
    }

    console.log(jsonDeal) ;
    jsonDeal.price = parseFloat(jsonDeal.price) ;
    jsonDeal.quantity = parseInt(jsonDeal.quantity) ;

    try {
        //let uuid = self.crypto.randomUUID();
        //console.log(uuid); // for example "36b8f84d-df4e-4d49-b662-bcde71a8764f"
        let cDate = new Date() ;
        jsonDeal.dealID=`${cDate.getTime()}` ;
        jsonDeal.cleared=false ;
        //https://aesop-portfolio.asia-southeast1.firebasedatabase.app/dealLogs.json
        const urlDict = `https://aesop-portfolio.asia-southeast1.firebasedatabase.app/dealLogs/${jsonDeal.dealID}.json`;
        let putResponse = await fetch(urlDict, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(jsonDeal)
        });
        if (!putResponse.ok) {
            console.log(`Failed to logDeal : ${putResponse.statusText}`);
        }
        console.log("logDeal successfully!");
        /*
        const response = await fetch('https://example.com/api/trade', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const result = await response.json();
        submitMessage.style.color = 'green';
        submitMessage.textContent = 'Trade submitted successfully! Response: ' + JSON.stringify(result);
        */
    } catch (error) {
        submitMessage.style.color = 'red';
        submitMessage.textContent = 'Error submitting trade: ' + error.message;
    }
});

// Trigger initial validation to display default date
let now = dayjs() ;
document.querySelector('#date').value=now.format("YYYY-MM-DD");
