let gGridObj = new gridjs.Grid() ;
let gRendered = false ;

function appMeta(){
    return {
        name:'balance.Anywhere',
        title:'balance.Anywhere',
        appTitle:_appTitle,
        renderPanel:_renderPanel,
        renderWorkStudio:_renderWorkStudio,
        renderHeadTools:_renderHeadTools,
        renderNavTools:_renderNavTools,
        injectStyle:_injectStyle_AppBoxAnywhere
    } ;
}


const _appTitle = ()=>{
    return 'medium.Anywhere' ;
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
        <i class="bi-wallet2 outpostBTN" id="idBTNPayement"></i>
        <i class="bi-currency-exchange outpostBTN" id="idBTNIncome"></i>
    ` ;

    tippy('#idBTNPayement', {content: "Receipts!"});
    tippy('#idBTNIncome', {content: "Income!"});

    tagAppNavTool.querySelector('#idBTNPayement').addEventListener('click',async (event)=>{
        let tagWorkSpace = document.querySelector('.rightPanelMain');
        tagWorkSpace.innerHTML=`
        <div class="GridContainer">
            <div id="idDataGrid"></div>
        </div>
        ` ;
        tagWorkSpace.dataset.renderFor='Payments' ;

        var urlKbankReceipts = `https://outpost-8d74e-4ec53.asia-southeast1.firebasedatabase.app/receipts.json` ;
        let responseReceipts = await fetch(urlKbankReceipts)  ;
        let jsonReceipts = await responseReceipts.json() ;
        //console.log(jsonReceipts) ;
        let receiptKeys = Object.keys(jsonReceipts) ;
        let ReceiptsArray = [] ;
        console.log(receiptKeys) ;
        for(let i=0;i<receiptKeys.length;i++){
            let jsonReceipt = jsonReceipts[receiptKeys[i]] ;
            console.log(jsonReceipt) ;
            ReceiptsArray.push(jsonReceipt) ;
        }

        renderReceipts(tagWorkSpace.querySelector('#idDataGrid'),ReceiptsArray) ;
    }) ;
    tagAppNavTool.querySelector('#idBTNIncome').addEventListener('click',(event)=>{
        let tagWorkSpace = document.querySelector('.rightPanelMain');
        tagWorkSpace.innerHTML='idBTNIncome' ;
        tagWorkSpace.dataset.renderFor='Income' ;
    }) ;
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
    tagRightPanelMain.innerHTML=``;
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


function renderReceipts(tagReceiptGrid,dataArray) {
    tagReceiptGrid.innerHTML='' ;
    if (!Array.isArray(dataArray)) return;
    const receipts = dataArray.filter((jsonHolding) =>{
      return true ;
    });

    let gridData=[] ;
    receipts.forEach(jsonReceipt => {
        let ReceiptRow = [
          jsonReceipt.ReferenceNo,
          jsonReceipt.ToBiller,
          jsonReceipt.FromAccount,
          jsonReceipt.Amount,
          jsonReceipt.Fee,
          jsonReceipt.TransactionResult,
          jsonReceipt.DateTime,
          jsonReceipt.TypeofTransaction,
      ] ;
      gridData.push(ReceiptRow) ;
    });

    console.log(gridData) ;
    gGridObj.updateConfig({
      columns: [
        "ReferNO", 
        "ToBiller",
        "Account",{
          name:"金额",
          formatter: (cell) =>`${accounting.formatNumber(cell,2)}`
        },{
          name:"费用",
          formatter: (cell) =>`${accounting.formatNumber(cell,2)}`
        },
        "交易结果",
        "日期",
        "交易类型"
      ],

      //pagination: true,
      pagination: {
        limit: 20
      },
      search: true,
      sort: true,
      resizable: true,
      fixedHeader: true,
      data: gridData,
      /*
      style: {
        td: {
          //border: '1px solid #ccc',
          'padding-top':'5px',
          'padding-bottom':'5px',
          'text-align': 'right'
        },
        table: {
          'font-size': '14px',
          'font-family': '"Lato", sans-serif;',
          'font-weight': '400',
          'font-style': 'normal'
        }
      }
      */
    });
    if(gRendered==false){
      gRendered = true ;
      gGridObj.render(tagReceiptGrid);   
    }else{
      //gGridObj.forceRender(tagReceiptGrid);   
      gGridObj.render(tagReceiptGrid);   
   
    }
  }