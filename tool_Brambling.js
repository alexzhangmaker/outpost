
const moduleAPIBramblingDB = require("./API_BramblingDB.js") ;
const moduleYFinance = require('/home/alexszhang/signpost.Brambling/node/API_YFinance.js');
const modulePushTel=require("/home/alexszhang/signpost.Brambling/node/libPushTelegram.js") ;
const moduleFBDB=require('./API_CloudDBs.js') ;

async function _task_Step_1(){
  //step 1: load json as holding tables
  console.log(`========>_task_Step_1`) ;
  await moduleAPIBramblingDB.tool_LoadJSONToHoldingTbls() ;
  await moduleAPIBramblingDB.tool_LoadJSONToExRateTbl('/home/alexszhang/signpost.Brambling/node/duckDB/exchangeRate.json') ;
  await moduleAPIBramblingDB.tool_LoadJSONToLedgerTbl('/home/alexszhang/signpost.Brambling/node/duckDB/ledger.json') ;
}


async function _task_Step_2(){
  //step 3:Build a globalQuote table for all tickers in holdings
  console.log(`========>_task_Step_2`) ;
  moduleAPIBramblingDB.tool_BuildQuoteTblUsingHoldingTbls() ;
}

async function _task_Step_3(){
  //step 2:update ExRate
  console.log(`========>_task_Step_3`) ;
  moduleAPIBramblingDB.apiExRate_UpdateAll() ;
}

async function _task_Step_4(){
  //step 4:update globalQuote Quotation data
  console.log(`========>_task_Step_4`) ;
  await moduleAPIBramblingDB.apiQuote_UpdateAll() ;
}

async function _task_Step_5(){
  //step 5:For each holdingTbl, join quoteTbl to view each holding account
  console.log(`========>_task_Step_5`) ;
  const accountIDs=[`IB1279`,`IB3979`,`IB6325`,`IB7075`,`FTZQ`,`GJZQ`,`HTZQ`,`LHZQ`,`PAZQ`,`ZSZQ`,`ZYXG`] ;
  for(let i=0;i<accountIDs.length;i++){
    await moduleAPIBramblingDB.apiJoinHolding2Quote(accountIDs[i]) ;
  }
}

async function _task_Step_6(){    
  //step 6:apiConsolidateHoldingAll
  console.log(`========>_task_Step_6`) ;
  await moduleAPIBramblingDB.apiConsolidateHoldingAll() ;
}

async function _task_Step_7(){
  //step 7: aggregate valueTTN for each account in ledgerTbl
  console.log(`========>_task_Step_7`) ;
  await moduleAPIBramblingDB.apiCalcAccountValue() ;
}

async function _task_Step_8(){
  //step 8: calc totalValue in CNY
  console.log(`========>_task_Step_8`) ;
  let nTotalValue = await moduleAPIBramblingDB.apiCalcTotalValueCNY() ;
  return nTotalValue ;
}

async function _task_Step_9(){
  
  //step 9: publish calculation result to Firebase DB
  console.log(`========>_task_Step_9`) ;
  await moduleAPIBramblingDB.tool_ExportTableToJSON('ledgerTbl',"./ledgerTbl_111.json");
  await moduleAPIBramblingDB.tool_ExportTableToJSON('consolidated_holdings',"./consolidated_holdings.json");
  await moduleAPIBramblingDB.tool_ExportTableToJSON('valueLogTbl',"./valueLogTbl.json");

  const accounts=['FTZQ','GJZQ','HTZQ','IB1279','IB3979','IB6325','IB7075','LHZQ','PAZQ','ZSZQ','ZYXG'] ;
  for(let i=0;i<accounts.length;i++){
    let tblName = `mv_joinHolding2Quote${accounts[i]}` ;
    let jsonFile = `./mv_joinHolding2Quote${accounts[i]}.json` ;
    await moduleAPIBramblingDB.tool_ExportTableToJSON(tblName,jsonFile);
  }
  
  await moduleAPIBramblingDB.apiPubConsolidateHolding("./consolidated_holdings.json") ;
  await moduleAPIBramblingDB.apiPubAccounts(".") ;
  await moduleAPIBramblingDB.apiPubLedger("./ledgerTbl_111.json") ;
  await moduleAPIBramblingDB.apiPubValueLog("./valueLogTbl.json");
}

async function _task_Step_10(nTotalValue){
  //step 10: push notify job done
  console.log(`========>_task_Step_10`) ;
  let cDate = new Date() ;
  let pushTitle = `${cDate.getFullYear()}-${cDate.getMonth()+1}-${cDate.getDate()} net asset`;
  let htmlContent = `
    <b>${pushTitle}</b>
    <b>totla net asset value: ¥${nTotalValue}</b>
    <a href="https://alexzhangmaker.github.io/outpost/portfolioAnywhere.html">Portfolio.Anywhere</a>
  ` ;
  //modulePushTel.notifyTelegram(pushTitle,pushBody) ;
  modulePushTel.notifyTelegramHTML(htmlContent) ;
}

// Example usage
(async () => {

  //step 1: load json as holding tables
  //await _task_Step_1() ;

  //step 2:Build a globalQuote table for all tickers in holdings
  //await _task_Step_2() ;

  //step 3:update ExRate
  //await _task_Step_3() ;
  //await moduleAPIBramblingDB.tool_logAnyTbl('exchangeRate');

  //step 4:update globalQuote Quotation data
  //await _task_Step_4() ;

  //step 5:For each holdingTbl, join quoteTbl to view each holding account
  //await _task_Step_5() ;
  //await moduleAPIBramblingDB.tool_logAnyTbl('mv_joinHolding2QuoteZYXG');
  

  //step 6:apiConsolidateHoldingAll
  //await  _task_Step_6() ;
  //await moduleAPIBramblingDB.tool_logAnyTbl('consolidated_holdings');

  //step 7: aggregate valueTTN for each account in ledgerTbl
  //await _task_Step_7(); 

  //step 8: calc totalValue in CNY
  //let nValue = await _task_Step_8() ;
  //await moduleAPIBramblingDB.tool_logAnyTbl('valueLogTbl');

  //step 9: publish calculation result to Firebase DB
  await _task_Step_9() ;

  //step 10: push notify job done
  //await _task_Step_10(nValue) ;
  

  //log content
  //await moduleAPIBramblingDB.tool_logAnyTbl('consolidated_holdings');
  //await moduleAPIBramblingDB.tool_logAnyTbl('ledgerTbl');
  //await _task_Step_9() ;
})();
