delete require.cache[require.resolve('@duckdb/node-api')];
const { DuckDBInstance, DuckDBConnection } = require('@duckdb/node-api');
const fs = require('fs');
const dayjs = require('dayjs');
const moduleYFinance = require('/home/alexszhang/signpost.Brambling/node/API_YFinance.js');
const moduleFBDB=require('./API_CloudDBs.js') ;

const urlBramblingDB = '/home/alexszhang/signpost.Brambling/node/duckDB/BramblingDB.duckdb';

const holdingTbl = {
  IB7075: 'factTbl_IB7075',
  IB6325: 'factTbl_IB6325',
  IB3979: 'factTbl_IB3979',
  IB1279: 'factTbl_IB1279',
  FTZQ:'factTbl_FTZQ',
  GJZQ:'factTbl_GJZQ',
  HTZQ:'factTbl_HTZQ',
  LHZQ:'factTbl_LHZQ',
  PAZQ:'factTbl_PAZQ',
  ZSZQ:'factTbl_ZSZQ',
  ZYXG:'factTbl_ZYXG'
};
const accountIDs=['FTZQ','GJZQ','HTZQ','IB1279','IB3979','IB6325','IB7075','LHZQ','PAZQ','ZSZQ','ZYXG'] ;



// Convert DuckDBDecimalValue, BigInt, or DuckDBDateValue to appropriate format
function convertDuckDBValue(value) {
  // Handle DECIMAL (DuckDBDecimalValue)
  if (value && typeof value === 'object' && 'value' in value && 'scale' in value) {
    return Number(value.value) / Math.pow(10, value.scale);
  }
  // Handle BigInt
  if (typeof value === 'bigint') {
    return Number(value);
  }
  // Handle DATE (DuckDBDateValue)
  if (value && typeof value === 'object' && 'days' in value) {
    const date = new Date(1970, 0, 1);
    date.setDate(date.getDate() + Number(value.days));
    return dayjs(date).format('YYYY-MM-DD');
  }
  return value;
}


// Process rows to convert DECIMAL, BigInt, and DATE fields
function processRows(rows) {
  return rows.map(row => {
    const newRow = {};
    for (const [key, value] of Object.entries(row)) {
      newRow[key] = convertDuckDBValue(value);
    }
    return newRow;
  });
}

function processRowsV2(rows, columnNames) {
  return rows.map(row => {
    const newRow = {};
    // If row is an array, map values to column names
    if (Array.isArray(row)) {
      columnNames.forEach((colName, index) => {
        newRow[colName] = convertDuckDBValue(row[index]);
      });
    } else {
      // If row is an object, process keys directly
      for (const [key, value] of Object.entries(row)) {
        newRow[key] = convertDuckDBValue(value);
      }
    }
    return newRow;
  });
}


// Convert DuckDBDecimalValue to float
function convertDuckDBDecimalToFloat(decimalValue) {
  if (decimalValue && typeof decimalValue === 'object' && 'value' in decimalValue && 'scale' in decimalValue) {
    return Number(decimalValue.value) / Math.pow(10, decimalValue.scale);
  }
  return decimalValue;
}


// Escape string values to prevent SQL injection
function escapeString(value) {
  if (typeof value !== 'string') return value;
  return `'${value.replace(/'/g, "''")}'`;
}



async function tool_ExportTableToJSONV0(tblName, jsonFilePath) {
  let instance, connection;
  try {
    if (!tblName || !jsonFilePath) throw new Error(`Invalid inputs: tblName=${tblName}, jsonFilePath=${jsonFilePath}`);
    if (!/^[a-zA-Z0-9_]+$/.test(tblName)) throw new Error('Invalid characters in table name');
    if (!jsonFilePath.endsWith('.json')) throw new Error('Output file must have .json extension');

    // Ensure output directory exists
    const outputDir = jsonFilePath.substring(0, jsonFilePath.lastIndexOf('/'));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    // Verify table exists
    const tables = await connection.run(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tblName]);
    if (tables.length === 0) throw new Error(`Table ${tblName} does not exist`);

    // Query table
    const result = await connection.run(`SELECT * FROM ${tblName}`);
    const rows = await result.getRows();
    const processedRows = processRows(rows);

    // Write to JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(processedRows, null, 2));
    console.log(`Table ${tblName} exported to ${jsonFilePath}`);

    return processedRows;
  } catch (err) {
    console.error('Error in exportTableToJson:', err);
    throw err;
  } finally {
    if (connection) connection.closeSync();//.catch(err => console.error('Failed to close connection:', err));
    if (instance) instance.closeSync();//.catch(err => console.error('Failed to close instance:', err));
  }
}

async function _logTblRecordsAll(tblName) {
  let instance, connection;
  try {
    // Validate input
    if (!tblName) {
      throw new Error(`Invalid table name: ${tblName}`);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(tblName)) {
      throw new Error('Invalid characters in table name');
    }

    // Initialize database
    instance = await DuckDBInstance.create(urlBramblingDB);
    console.log('DuckDBInstance created:', !!instance);

    connection = await instance.connect();
    console.log('Connection methods:', Object.getOwnPropertyNames(connection));

    // Verify connection is a DuckDBConnection
    if (!(connection instanceof DuckDBConnection)) {
      throw new Error('Connection is not a DuckDBConnection instance');
    }

    // Verify table exists
    const tables = await connection.run(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tblName]);
    if (tables.length === 0) {
      throw new Error(`Table ${tblName} does not exist`);
    }

    
    // Execute SELECT query
    let sqlStmt = `SELECT * FROM ${tblName}` ;
    console.log(sqlStmt) ;
    const result = await connection.run(sqlStmt);
    const rows = await result.getRows();
    
    return rows;
  } catch (err) {
    console.error('Error in _logTblRecordsAll:', err);
    throw err;
  } finally {
    if (connection) {
      try {
        connection.closeSync();
        console.log('Connection closed');
      } catch (closeErr) {
        console.error('Failed to close connection:', closeErr);
      }
    }
    if (instance) {
      try {
        instance.closeSync();
        console.log('Instance closed');
      } catch (closeErr) {
        console.error('Failed to close instance:', closeErr);
      }
    }
  }
}

async function tool_logHoldingTbl(accountID) {
  try {
    const tblName = holdingTbl[accountID] || `factTbl_${accountID}`;
    let rows = await _logTblRecordsAll(tblName);
    console.log(rows) ;
  } catch (err) {
    console.error('Error in tool_logHoldingTbl:', err);
    throw err;
  }
}


async function tool_createHoldingTables(accountIDs) {
  let instance = await DuckDBInstance.create(urlBramblingDB);
  let connection = await instance.connect();

  for(let i=0;i<accountIDs.length;i++){
    let createTableQuery = `
      CREATE TABLE factTbl_${accountIDs[i]} (
        ticker VARCHAR NOT NULL,
        company VARCHAR,
        holding INTEGER,
        costPerShare DECIMAL(10,2),
        currency VARCHAR,
        exchange VARCHAR,
        accountID VARCHAR,
        quoteType VARCHAR,
        CostCNY DECIMAL(10,2),
        exchangeRate DECIMAL(10,2),
        PRIMARY KEY (ticker)
      );
    `;
    await connection.run(createTableQuery) ;
  }
  connection.closeSync();
  instance.closeSync() ;

}

async function tool_DropHoldingTable(accountID) {
  // Initialize database
  const instance = await DuckDBInstance.create(urlBramblingDB);
  console.log('DuckDBInstance created:', !!instance);

  const connection = await instance.connect();
  console.log('Connection methods:', Object.getOwnPropertyNames(connection));

  const dropQuery = `DROP TABLE IF EXISTS factTbl_${accountID}`;
  await connection.run(dropQuery);
  connection.closeSync();
}

async function tool_DropAnyTable(tblName) {
  // Initialize database
  const instance = await DuckDBInstance.create(urlBramblingDB);
  console.log('DuckDBInstance created:', !!instance);

  const connection = await instance.connect();
  console.log('Connection methods:', Object.getOwnPropertyNames(connection));

  const dropQuery = `DROP TABLE IF EXISTS ${tblName}`;
  await connection.run(dropQuery);
  connection.closeSync();
}


async function tool_logAnyTbl(tblName) {
  try {
    let rows = await _logTblRecordsAll(tblName);
    console.log(rows) ;
  } catch (err) {
    console.error('Error in tool_logHoldingTbl:', err);
    throw err;
  }
}


async function tool_LoadJSONToHoldingTbl(jsonFilePath, accountID) {
  let instance, connection;
  try {
    if (!jsonFilePath || !accountID) {
      throw new Error(`Invalid inputs: jsonFilePath=${jsonFilePath}, accountID=${accountID}`);
    }
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`JSON file not found: ${jsonFilePath}`);
    }
    if (!/^[a-zA-Z0-9]+$/.test(accountID)) {
      throw new Error('Invalid characters in accountID');
    }

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    await connection.run(`
      CREATE TABLE IF NOT EXISTS factTbl_${accountID} (
        ticker VARCHAR NOT NULL,
        company VARCHAR,
        holding INTEGER,
        costPerShare DECIMAL(10,2),
        currency VARCHAR,
        exchange VARCHAR,
        accountID VARCHAR,
        quoteType VARCHAR,
        CostCNY DECIMAL(10,2),
        exchangeRate DECIMAL(10,2),
        PRIMARY KEY (ticker)
      );
    `);

    await connection.run(
      `INSERT INTO factTbl_${accountID} SELECT * FROM read_json_auto(?)`,
      [jsonFilePath]
    );
    console.log(`JSON data loaded into factTbl_${accountID}`);

    const rows = await connection.run(`SELECT * FROM factTbl_${accountID}`);
    console.log('Table contents:', rows);

    return rows;
  } catch (err) {
    console.error('Error in tool_LoadJSONToHoldingTbl:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


async function tool_LoadJSONToHoldingTbls() {

  let instance, connection;
  try {
    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    for(let i=0;i<accountIDs.length;i++){
      let jsonFilePath = `/home/alexszhang/signpost.Brambling/node/duckDB/holdings_${accountIDs[i]}.json` ;
      if (!fs.existsSync(jsonFilePath)) {
        throw new Error(`JSON file not found: ${jsonFilePath}`);
      }
      let tblName = `factTbl_${accountIDs[i]}` ;
      let stmtCreateTbl = `
        DROP TABLE IF EXISTS ${tblName} ;
        
        CREATE TABLE IF NOT EXISTS ${tblName}(
          ticker VARCHAR NOT NULL,
          company VARCHAR,
          holding INTEGER,
          costPerShare DECIMAL(10,2),
          currency VARCHAR,
          exchange VARCHAR,
          accountID VARCHAR,
          quoteType VARCHAR,
          CostCNY DECIMAL(10,2),
          exchangeRate DECIMAL(10,2),
          PRIMARY KEY (ticker)
        );
      ` ;
      await connection.run(stmtCreateTbl);
      await connection.run(
        `INSERT INTO ${tblName} SELECT * FROM read_json_auto(?)`,
        [jsonFilePath]
      );
      console.log(`JSON data loaded into ${tblName}`);
    }
  } catch (err) {
    console.error('Error in tool_LoadJSONToHoldingTbls:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}



async function apiHoldingTbl_PlusHolding(jsonHolding, accountID) {
  console.log(jsonHolding);

  let instance, connection;
  try {
    if (!jsonHolding || !accountID) throw new Error(`Invalid inputs: jsonHolding=${jsonHolding}, accountID=${accountID}`);
    if (!/^[a-zA-Z0-9]+$/.test(accountID)) throw new Error('Invalid characters in accountID');
    if (!jsonHolding.ticker || typeof jsonHolding.holding !== 'number' || typeof jsonHolding.costPerShare !== 'number' ||
        typeof jsonHolding.CostCNY !== 'number' || typeof jsonHolding.exchangeRate !== 'number') {
      throw new Error('Invalid jsonHolding fields');
    }

    const holdingTblName = holdingTbl[accountID];// || `factTbl_${accountID}`;
    console.log('JSON holding:', JSON.stringify(jsonHolding, null, 2));

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    await connection.run(`
      CREATE TABLE IF NOT EXISTS ${holdingTblName} (
        ticker VARCHAR NOT NULL,
        company VARCHAR,
        holding INTEGER,
        costPerShare DECIMAL(10,2),
        currency VARCHAR,
        exchange VARCHAR,
        accountID VARCHAR,
        quoteType VARCHAR,
        CostCNY DECIMAL(10,2),
        exchangeRate DECIMAL(10,2),
        PRIMARY KEY (ticker)
      );
    `);

    // Non-prepared statement with escaped values
    const sqlUpsertStmt = `
      INSERT INTO ${holdingTblName} (ticker, company, holding, costPerShare, currency, exchange, accountID, quoteType, CostCNY, exchangeRate)
      VALUES (
        ${escapeString(jsonHolding.ticker)},
        ${escapeString(jsonHolding.company || '')},
        ${Number(jsonHolding.holding)},
        ${Number(jsonHolding.costPerShare).toFixed(2)},
        ${escapeString(jsonHolding.currency)},
        ${escapeString(jsonHolding.exchange)},
        ${escapeString(jsonHolding.accountID)},
        ${escapeString(jsonHolding.quoteType)},
        ${Number(jsonHolding.CostCNY).toFixed(2)},
        ${Number(jsonHolding.exchangeRate).toFixed(2)}
      )
      ON CONFLICT (ticker) DO UPDATE SET
        holding = EXCLUDED.holding,
        costPerShare = EXCLUDED.costPerShare,
        CostCNY = EXCLUDED.CostCNY,
        exchangeRate = EXCLUDED.exchangeRate
    `;
    console.log('Upsert SQL:', sqlUpsertStmt);
    await connection.run(sqlUpsertStmt);
    console.log(`Upserted holding for ticker ${jsonHolding.ticker} into ${holdingTblName}`);
  } catch (err) {
    console.error('Error in apiHoldingTbl_PlusHolding:', err);
    throw err;
  } finally {
    if (connection) connection.closeSync();
    if (instance) instance.closeSync();
  }
}


async function apiQuote_PlusTicker(jsonTicker){
  console.log(jsonTicker) ;
  let instance = await DuckDBInstance.create(urlBramblingDB);
  let connection = await instance.connect();


  //ticker, company, currency,exchange,quoteType,quote,timeStamp
  await connection.run(`
    CREATE TABLE IF NOT EXISTS globalQuote (
      ticker VARCHAR NOT NULL,
      company VARCHAR,
      currency VARCHAR,
      exchange VARCHAR,
      quoteType VARCHAR,
      quote DECIMAL(10,2),
      timeStamp DATE,
      PRIMARY KEY (ticker)
    );
  `);


  //const sqlStmt = `INSERT INTO globalQuote (ticker, company, currency,exchange,quoteType,quote,timeStamp) VALUES (?, ?, ?,?, ?, ?,?)` ;
  //connection.run(sqlStmt,jsonTicker.ticker,jsonTicker.company,jsonTicker.currency,jsonTicker.exchange,jsonTicker.quoteType,jsonTicker.quote,jsonTicker.timeStamp,_callback);
  const sqlUpsertStmt = `
      INSERT INTO globalQuote (ticker, company, currency,exchange,quoteType,quote,timeStamp)
      VALUES (
        ${escapeString(jsonTicker.ticker)},
        ${escapeString(jsonTicker.company || '')},
        ${escapeString(jsonTicker.currency)},
        ${escapeString(jsonTicker.exchange)},
        ${escapeString(jsonTicker.quoteType)},
        ${Number(jsonTicker.quote).toFixed(2)},
        ${escapeString(jsonTicker.timeStamp)}
      )
      ON CONFLICT (ticker) DO UPDATE SET
        quote = EXCLUDED.quote
    `;
    console.log('Upsert SQL:', sqlUpsertStmt);
    await connection.run(sqlUpsertStmt);

    if (connection) connection.closeSync();
    if (instance) instance.closeSync();
} 

async function apiQuote_UpdateAll(){
  let instance = await DuckDBInstance.create(urlBramblingDB);
  let connection = await instance.connect();

  // Execute SELECT query
  let sqlStmt = `SELECT * FROM globalQuote` ;
  const result = await connection.run(sqlStmt);
  const tickers = await result.getRows();

  for(let i=0;i<tickers.length;i++){
    //console.log(tickers[i]) ;
    let ticker = tickers[i][0] ;
    let quoteTTM = 0.0 ;

    if(tickers[i][4]=='priority' || tickers[i][4]=='debt'){
      console.log(`${ticker} as ${tickers[i][4]} quote tobe 1.0`);
      quoteTTM = 1.0 ;
    }else{
      quoteTTM = await moduleYFinance.API_FetchQuote(ticker) ;
      if(tickers[i][3]=='LSE')quoteTTM = quoteTTM/100 ;
      console.log(`taskQueryYFinance: ${ticker} quoteTTM as:${quoteTTM}`) ;
    }
    const sqlUpdateStmt = `UPDATE globalQuote SET quote = ${Number(quoteTTM).toFixed(2)} WHERE ticker = ${escapeString(ticker)}`;
    console.log('Update SQL:', sqlUpdateStmt);
    await connection.run(sqlUpdateStmt);
  }

  if (connection) connection.closeSync();
  if (instance) instance.closeSync();
  
}



async function apiCalcAccountValue(){
  let instance = await DuckDBInstance.create(urlBramblingDB);
  let connection = await instance.connect();

  //fetch exchangeRates
  // Execute SELECT query
  let sqlStmt = `SELECT * FROM exchangeRate` ;
  let result = await connection.run(sqlStmt);
  const rows_exchangeRates = await result.getRows();
  console.log(rows_exchangeRates) ;
  let exRateTbl={} ;
  for(let i=0;i<rows_exchangeRates.length;i++){
    exRateTbl[rows_exchangeRates[i][0]] = rows_exchangeRates[i][1] ;
  }
  console.log(exRateTbl) ;

  //
  let now = dayjs();
  let timeStamp = now.format("YYYY-MM-DD") ;
  for(i=0;i<accountIDs.length;i++){
    let holdingWQuoteTbl = `mv_joinHolding2Quote${accountIDs[i]}` ;
    let stmtQuote = `SELECT * FROM ${holdingWQuoteTbl}` ;
    //console.log(stmtQuote) ;
    let resultAccount = await connection.run(stmtQuote);
    const rows_AccountValue = await resultAccount.getRows();

    let accountValueCNY = 0.0 ;
    for(let j=0;j<rows_AccountValue.length;j++){
      let exRate = 1 ;
      let currency = rows_AccountValue[j][4] ;
      if(currency!='CNY'){
        let exRateKey = `${currency}CNY=X` ;
        exRate = exRateTbl[exRateKey] ;
      }
      let quoteType = rows_AccountValue[j][8] ;
      let quote = rows_AccountValue[j][7] ;
      let valueTTM = rows_AccountValue[j][9] ;
      let totalCost = rows_AccountValue[j][10] ;

      let delta = valueTTM*exRate ;
      if(quoteType == 'priority')delta = totalCost*exRate ;

      if(accountIDs[i]=='IB1279')console.log(`rows_AccountValue[j][8]:${rows_AccountValue[j][8]} times exRate:${exRate}`) ;
      accountValueCNY = accountValueCNY + delta;//rows_AccountValue[j][8]*exRate ;
    }
    
    let stmtUpdateLedger = `UPDATE ledgerTbl SET marketValueCNY=${accountValueCNY} WHERE assetID=${escapeString(accountIDs[i])}` ;
    console.log(stmtUpdateLedger) ;
    await connection.run(stmtUpdateLedger);
  }
  console.log('done with calc stock account market TTM value');

  //update ledger table for total valueTTMCNY, include all asset class, not just stock accounts
  let stmtQueryLedger = `SELECT * FROM ledgerTbl` ;
  let resultLedger = await connection.run(stmtQueryLedger);
  const rows_Ledger = await resultLedger.getRows();
  for(i=0;i<rows_Ledger.length;i++){
    let currency = rows_Ledger[i][4] ;
    let exRate = 1 ;
    if(currency!='CNY'){
      let exRateKey = `${currency}CNY=X` ;
      exRate = exRateTbl[exRateKey] ;
    }
    let marketValueCNY = convertDuckDBValue(rows_Ledger[i][1]) ;
    let Cash = convertDuckDBValue(rows_Ledger[i][2]) ;
    let Debt = convertDuckDBValue(rows_Ledger[i][3])
    let ValueTTMCNY = marketValueCNY+(Cash-Debt)*convertDuckDBValue(exRate);
    let stmtUpdateLedger2 = `
      UPDATE ledgerTbl SET ValueTTMCNY=${ValueTTMCNY} , timeStamp=${escapeString(timeStamp)}
      WHERE assetID=${escapeString(rows_Ledger[i][0])}` ;
    console.log(stmtUpdateLedger2) ;
    await connection.run(stmtUpdateLedger2);
  }

  if (connection) connection.closeSync();
  if (instance) instance.closeSync();
  
}

async function apiCalcTotalValueCNY(){

  let instance = await DuckDBInstance.create(urlBramblingDB);
  let connection = await instance.connect();

  let sqlStmt = `SELECT * FROM exchangeRate` ;
  let result = await connection.run(sqlStmt);
  const rows_exchangeRates = await result.getRows();
  console.log(rows_exchangeRates) ;
  let exRateTbl={} ;
  for(let i=0;i<rows_exchangeRates.length;i++){
    exRateTbl[rows_exchangeRates[i][0]] = rows_exchangeRates[i][1] ;
  }
  console.log(exRateTbl) ;

  //
  let sqlQueryLedger = `SELECT * FROM ledgerTbl` ;
  result = await connection.run(sqlQueryLedger);
  const rows_Ledger = await result.getRows();
  let valueTTMCNYAssets={
    "IB7075":0,
    "IB6325":0,
    "IB3979":0,
    "IB1279":0,
    "HTZQ":0,
    "GJZQ":0,
    "PAZQ":0,
    "ZSZQ":0,
    "ZYXG":0,
    "FTZQ":0,
    "LHZQ":0,
    "BC_POLICY_3":0,
    "ZSYH":0,
    "RS_POLICY_2":0,    
    "ZSXN_POLICY":0,    
    "ARISE":0
  }

  for(i=0;i<rows_Ledger.length;i++){
    let assetType = rows_Ledger[i][5] ;
    let currency =  rows_Ledger[i][4] ;
    let assetID = rows_Ledger[i][0] ;
    valueTTMCNYAssets[assetID] = rows_Ledger[i][6] ;
    if(assetType=='equity')continue ;

    let exRate = 1 ;
    if(currency!='CNY'){
      exRate = exRateTbl[`${currency}CNY=X`] ;
    }
    console.log(rows_Ledger[i]) ;
    let marketValueCNY = convertDuckDBValue(rows_Ledger[i][1])*exRate ;
    let cash = convertDuckDBValue(rows_Ledger[i][2]) ;
    let debt = convertDuckDBValue(rows_Ledger[i][3]) ;
    let ValueTTMCNY = marketValueCNY + cash - debt ;
    valueTTMCNYAssets[assetID] = ValueTTMCNY ;

    let stmtUpdateLedge = `UPDATE ledgerTbl SET ValueTTMCNY=${ValueTTMCNY} WHERE assetID=${escapeString(rows_Ledger[i][0])}` ;
    console.log(stmtUpdateLedge) ;
    await connection.run(stmtUpdateLedge);
  }

  // Execute SELECT query
  let stmtTotalValue = `SELECT SUM(ValueTTMCNY) AS total_ValueCNY FROM ledgerTbl` ;

  result = await connection.run(stmtTotalValue);
  const totalValue = await result.getRows();
  console.log(totalValue) ;


  let retValue = convertDuckDBValue(totalValue) ;
  console.log(`retValue===========>>>>:${retValue}`) ;

  //append a record to valueLogTbl
  let now = dayjs();
  let timeStamp = now.format("YYYY-MM-DD") ;  
  console.log(timeStamp) ;
  //DROP TABLE IF EXISTS valueLogTbl ;
  await connection.run(`
    
    CREATE TABLE IF NOT EXISTS valueLogTbl (
      timeStamp DATE NOT NULL,
      ValueTTMCNY DECIMAL(10,2),
      IB7075 DECIMAL(10,2),
      IB6325 DECIMAL(10,2),
      IB3979 DECIMAL(10,2),
      IB1279 DECIMAL(10,2),
      HTZQ DECIMAL(10,2),
      GJZQ DECIMAL(10,2),
      PAZQ DECIMAL(10,2),
      ZSZQ DECIMAL(10,2),
      ZYXG DECIMAL(10,2),
      FTZQ DECIMAL(10,2),
      LHZQ DECIMAL(10,2),
      BCBX DECIMAL(10,2),
      ZGYH DECIMAL(10,2),
      RSBX DECIMAL(10,2),
      XNBX DECIMAL(10,2),
      ARISE DECIMAL(10,2),
      PRIMARY KEY (timeStamp)
    );
  `);
  let stmtAppendValueLogTbl=`
    INSERT INTO valueLogTbl ("timeStamp", "ValueTTMCNY","IB7075","IB6325","IB3979",
      "IB1279","HTZQ","GJZQ","PAZQ","ZSZQ",
      "ZYXG","FTZQ","LHZQ","BCBX",
      "ZGYH","RSBX","XNBX","ARISE")
      VALUES ('${timeStamp}', ${retValue},${valueTTMCNYAssets.IB7075},${valueTTMCNYAssets.IB6325},${valueTTMCNYAssets.IB3979},
      ${valueTTMCNYAssets.IB1279},${valueTTMCNYAssets.HTZQ},${valueTTMCNYAssets.GJZQ},${valueTTMCNYAssets.PAZQ},${valueTTMCNYAssets.ZSZQ},
      ${valueTTMCNYAssets.ZYXG},${valueTTMCNYAssets.FTZQ},${valueTTMCNYAssets.LHZQ},${valueTTMCNYAssets.BC_POLICY_3},
      ${valueTTMCNYAssets.ZSYH},${valueTTMCNYAssets.RS_POLICY_2},${valueTTMCNYAssets.ZSXN_POLICY},${valueTTMCNYAssets.ARISE}) 
      ON CONFLICT ("timeStamp") DO UPDATE 
      SET "ValueTTMCNY" = EXCLUDED."ValueTTMCNY";
  ` ;

  console.log(stmtAppendValueLogTbl) ;
  await connection.run(stmtAppendValueLogTbl) ;

  if (connection) connection.closeSync();
  if (instance) instance.closeSync();

  return retValue ;
}

async function apiExRate_UpdateAll(){
  let instance = await DuckDBInstance.create(urlBramblingDB);
  let connection = await instance.connect();

  await connection.run(`
    CREATE TABLE IF NOT EXISTS exchangeRate (
      ticker VARCHAR NOT NULL,
      quote DECIMAL(10,2),
      timeStamp DATE,
      PRIMARY KEY (ticker)
    );
  `);

  // Execute SELECT query
  let sqlStmt = `SELECT * FROM exchangeRate` ;
  const result = await connection.run(sqlStmt);
  const tickers = await result.getRows();

  // Format it to YYYY-MM-DD
  const now = dayjs();
  const timeStamp = now.format('YYYY-MM-DD');
  console.log(timeStamp) ;

  for(let i=0;i<tickers.length;i++){
    console.log(tickers[i]) ;
    let ticker = tickers[i][0] ;
    let quoteTTM = await moduleYFinance.API_FetchExRate(ticker) ;
    console.log(`taskQueryYFinance: ${ticker} quoteTTM as:${quoteTTM}`) ;

    const sqlUpdateStmt = `UPDATE exchangeRate SET quote = ${Number(quoteTTM).toFixed(2)},timeStamp=${escapeString(timeStamp)} 
                            WHERE ticker = ${escapeString(ticker)}`;
    console.log('Update SQL:', sqlUpdateStmt);
    await connection.run(sqlUpdateStmt);
  }

  if (connection) connection.closeSync();
  if (instance) instance.closeSync();
}

async function tool_BuildQuoteTblUsingHoldingTbls(){
  let stmtBuildQuoteTbl=`
    DROP TABLE IF EXISTS globalQuote ;

    CREATE TABLE globalQuote AS
    WITH unique_tickers AS (
      SELECT DISTINCT 
        ticker, 
        FIRST(company) AS company,
        FIRST(currency) AS currency,
        FIRST(exchange) AS exchange,
        FIRST(quoteType) AS quoteType
      FROM (
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_IB1279
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_IB3979
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_IB6325
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_IB7075
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_FTZQ
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_GJZQ
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_HTZQ
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_LHZQ
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_PAZQ
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_ZSZQ
        UNION ALL
        SELECT ticker, company, currency, exchange, quoteType FROM factTbl_ZYXG
        -- Add more source tables as needed
      ) AS all_tickers
      GROUP BY ticker
    )
    SELECT 
      ticker,
      company,
      currency,
      exchange,
      quoteType,
      CAST(0.00 AS DECIMAL(10,2)) AS quote,       -- Initialized as 0.00
      CAST('2025-08-01' AS DATE) AS timeStamp     -- Initialized as specific date
    FROM unique_tickers;

    ALTER TABLE globalQuote ADD PRIMARY KEY (ticker);
  ` ;
  let instance, connection;
  try {
    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();
    console.log(stmtBuildQuoteTbl) ;
    await connection.run(stmtBuildQuoteTbl);

  } catch (err) {
    console.error('Error in tool_BuildQuoteTblUsingHoldingTbls:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


async function tool_LoadJSONToQuoteTbl(jsonFilePath) {
  let instance, connection;
  try {
    if (!jsonFilePath) {
      throw new Error(`Invalid inputs: jsonFilePath=${jsonFilePath}`);
    }
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`JSON file not found: ${jsonFilePath}`);
    }

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    await connection.run(`
      CREATE TABLE IF NOT EXISTS globalQuote (
        ticker VARCHAR NOT NULL,
        company VARCHAR,
        currency VARCHAR,
        exchange VARCHAR,
        quoteType VARCHAR,
        quote DECIMAL(10,2),
        timeStamp DATE,
        PRIMARY KEY (ticker)
      );
    `);

    // Upsert JSON data into globalQuote
    await connection.run(`
      INSERT INTO globalQuote (ticker, company, currency, exchange, quoteType, quote, timeStamp)
      SELECT ticker, company, currency, exchange, quoteType, quote, timeStamp
      FROM read_json_auto(?)
      ON CONFLICT (ticker) DO UPDATE SET
        company = EXCLUDED.company,
        currency = EXCLUDED.currency,
        exchange = EXCLUDED.exchange,
        quoteType = EXCLUDED.quoteType,
        quote = EXCLUDED.quote,
        timeStamp = EXCLUDED.timeStamp
    `, [jsonFilePath]);
    console.log(`JSON data upserted into globalQuote`);

    const rows = await connection.run(`SELECT * FROM globalQuote`);
    console.log('Table contents:', rows);
    return rows;
  } catch (err) {
    console.error('Error in tool_LoadJSONToQuoteTbl:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}

//  /home/alexszhang/signpost.Brambling/node/duckDB/exchangeRate.json
async function tool_LoadJSONToExRateTbl(jsonFilePath) {
  let instance, connection;
  try {
    if (!jsonFilePath) {
      throw new Error(`Invalid inputs: jsonFilePath=${jsonFilePath}`);
    }
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`JSON file not found: ${jsonFilePath}`);
    }

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    await connection.run(`
      DROP TABLE IF EXISTS exchangeRate;
      CREATE TABLE IF NOT EXISTS exchangeRate (
        ticker VARCHAR NOT NULL,
        quote DECIMAL(10,2),
        timeStamp DATE,
        PRIMARY KEY (ticker)
      );
    `);

    // Upsert JSON data into globalQuote
    await connection.run(`
      INSERT INTO exchangeRate (ticker, quote, timeStamp)
        SELECT ticker, quote, timeStamp
        FROM read_json_auto(?)
        ON CONFLICT (ticker) DO UPDATE SET
          quote = EXCLUDED.quote,
          timeStamp = EXCLUDED.timeStamp
    `, [jsonFilePath]);
    console.log(`JSON data upserted into globalQuote`);

    const rows = await connection.run(`SELECT * FROM exchangeRate`);
    console.log('Table contents:', rows);
    return rows;
  } catch (err) {
    console.error('Error in tool_LoadJSONToExRateTbl:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


//  
async function tool_LoadJSONToLedgerTbl(jsonFilePath) {
  let instance, connection;
  try {
    if (!jsonFilePath) {
      throw new Error(`Invalid inputs: jsonFilePath=${jsonFilePath}`);
    }
    if (!fs.existsSync(jsonFilePath)) {
      throw new Error(`JSON file not found: ${jsonFilePath}`);
    }

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    								
    await connection.run(`
      DROP TABLE IF EXISTS ledgerTbl;

      CREATE TABLE IF NOT EXISTS ledgerTbl (
        assetID VARCHAR NOT NULL,
        marketValueCNY DECIMAL(10,2),
        Cash DECIMAL(10,2),
        Debt DECIMAL(10,2),
        Currency VARCHAR,
        AssetType VARCHAR,
        ValueTTMCNY DECIMAL(10,2),
        timeStamp DATE,
        PRIMARY KEY (assetID)
      );
    `);

    // Upsert JSON data into ledgerTbl
    await connection.run(`
      INSERT INTO ledgerTbl (assetID, marketValueCNY, Cash,Debt, Currency,AssetType,ValueTTMCNY,timeStamp)
        SELECT assetID, marketValueCNY, Cash,Debt, Currency,AssetType,ValueTTMCNY,timeStamp
        FROM read_json_auto(?)
        ON CONFLICT (assetID) DO UPDATE SET
          timeStamp = EXCLUDED.timeStamp
    `, [jsonFilePath]);
    console.log(`JSON data upserted into ledgerTbl`);
  } catch (err) {
    console.error('Error in tool_LoadJSONToLedgerTbl:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


async function apiJoinHolding2Quote(accountID){
  let instance, connection;
  try {
    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    const holdingTblName = holdingTbl[accountID];// || `factTbl_${accountID}`;

    // 1. Create the materialized join table
    let mvTblName = `mv_joinHolding2Quote${accountID}` ;
    let stmtMVBuild = `
      DROP TABLE IF EXISTS ${mvTblName};
      CREATE TABLE ${mvTblName} AS
      SELECT 
        t1.ticker,
        t1.company,
        t1.holding,
        t1.costPerShare,
        t1.currency,
        t1.accountID,
        t1.exchangeRate,
        t2.quote,
        t2.quoteType,
        (t2.quote * t1.holding) AS valueTTM,
        (t1.costPerShare * t1.holding) AS totalCost,
        (t2.quote/t1.costPerShare-1) AS PEPert
      FROM ${holdingTblName} t1
      JOIN globalQuote t2 ON t1.ticker = t2.ticker
    ` ;
    console.log(stmtMVBuild) ;
    await connection.run(stmtMVBuild);

    // 2. Create indexes for OLAP dimensions
    let stmtIndex = `CREATE INDEX idx_mj_ticker_${accountID} ON ${mvTblName}(ticker);` ;
    console.log(stmtIndex) ;
    await connection.run(stmtIndex);

  } catch (err) {
    console.error('Error in apiJoinHolding2Quote:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


async function apiRenewMVHolding2Quote(accountID){
  let instance, connection;
  try {
    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    const holdingTblName = holdingTbl[accountID];
    console.log(holdingTblName) ;
    let mvTblName = `mv_joinHolding2Quote${accountID}` ;

    let stmtMVRenew = `
      DELETE FROM ${mvTblName};
      INSERT INTO ${mvTblName}
        SELECT t1.ticker,
        t1.company,
        t1.holding,
        t1.costPerShare,
        t1.currency,
        t1.accountID,
        t1.exchangeRate,
        t2.quote,
        (t2.quote * t1.holding) AS valueTTM,
        (t1.costPerShare * t1.holding) AS totalCost,
        (t2.quote/t1.costPerShare-1) AS PEPert
      FROM ${holdingTblName} t1
      JOIN globalQuote t2 ON t1.ticker = t2.ticker;
    `;
    console.log(stmtMVRenew) ;
    await connection.run(stmtMVRenew);

  } catch (err) {
    console.error('Error in apiRenewMVHolding2Quote:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


async function apiConsolidateHoldingAll(){
  let instance, connection;
  let stmtConsolidate=`

    DROP TABLE IF EXISTS consolidated_holdings;

    CREATE TABLE consolidated_holdings AS
      WITH all_holdings AS (
        -- Combine data from all holding tables
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteFTZQ
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteGJZQ
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteHTZQ
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteIB1279
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteIB3979
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteIB6325
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteIB7075
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteLHZQ
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuotePAZQ
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteZSZQ
        UNION ALL
        SELECT ticker, company, holding, currency, costPerShare, quote,quoteType FROM mv_joinHolding2QuoteZYXG
        -- Add more tables as needed
      ),
      holding_totals AS (
        -- Calculate total holdings and weighted values
        SELECT
          ticker,
          FIRST(company) AS company,  -- Assuming company name is consistent per ticker
          FIRST(currency) AS currency,  -- Assuming company name is consistent per ticker
          SUM(holding) AS total_holding,
          SUM(holding * costPerShare) AS total_cost_basis,
          SUM(holding * costPerShare) / NULLIF(SUM(holding), 0) AS weighted_avg_cost,
          -- Include current quote if needed
          FIRST(quote) AS current_quote,  -- Or use another aggregation method
          FIRST(quoteType) AS quoteType
        FROM all_holdings
        GROUP BY ticker
      )
      SELECT
        ticker,
        company,
        quoteType,
        total_holding AS holding,
        weighted_avg_cost AS costPerShare,
        current_quote AS quote,
        -- Additional calculated metrics
        total_holding * weighted_avg_cost AS total_cost,
        total_holding * current_quote AS current_value,
        (current_quote / weighted_avg_cost - 1) * 100 AS pct_gain_loss
      FROM holding_totals
      WHERE total_holding > 0;  -- Exclude tickers with zero holdings
  ` ;
  try {
    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();
    console.log(stmtConsolidate) ;
    await connection.run(stmtConsolidate);
  } catch (err) {
    console.error('Error in apiRenewMVHolding2Quote:', err);
    throw err;
  } finally {
    if (connection) {
      connection.closeSync();
    }
    if (instance) {
      instance.closeSync();
    }
  }
}


async function tool_ExportTableToJSON(tblName, jsonFilePath) {
  let instance, connection;
  try {
    if (!tblName || !jsonFilePath) throw new Error(`Invalid inputs: tblName=${tblName}, jsonFilePath=${jsonFilePath}`);
    if (!/^[a-zA-Z0-9_]+$/.test(tblName)) throw new Error('Invalid characters in table name');
    if (!jsonFilePath.endsWith('.json')) throw new Error('Output file must have .json extension');

    // Ensure output directory exists
    const outputDir = jsonFilePath.substring(0, jsonFilePath.lastIndexOf('/'));
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    instance = await DuckDBInstance.create(urlBramblingDB);
    connection = await instance.connect();

    // Verify table exists
    let sqlResult = await connection.run(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tblName]);
    const tables = await sqlResult.getRows() ;
    if (tables.length === 0) throw new Error(`Table ${tblName} does not exist`);

    // Get column names to ensure JSON attributes match
    const schemaResult = await connection.run(`PRAGMA table_info(${tblName})`);
    const schemaRows = await schemaResult.getRows();
    console.log(schemaRows) ;
    const columnNames = schemaRows.map(row => row[1]/*.name*/);
    console.log(`Exporting table ${tblName} with columns:`, columnNames);

    // Query table
    const result = await connection.run(`SELECT * FROM ${tblName}`);
    const rows = await result.getRows();
    const processedRows = processRowsV2(rows,columnNames);
    console.log(processedRows) ;

    // Verify JSON attributes match column names
    if (processedRows.length > 0) {
      const rowKeys = Object.keys(processedRows[0]);
      if (!columnNames.every(col => rowKeys.includes(col)) || !rowKeys.every(key => columnNames.includes(key))) {
        console.warn('Warning: JSON attribute names may not match table column names exactly');
      }
    }


    // Write to JSON file
    fs.writeFileSync(jsonFilePath, JSON.stringify(processedRows, null, 2));
    console.log(`Table ${tblName} exported to ${jsonFilePath} with attributes matching column names`);

    return processedRows;
  } catch (err) {
    console.error('Error in exportTableToJson:', err);
    throw err;
  } finally {
    if (connection) connection.closeSync();//.catch(err => console.error('Failed to close connection:', err));
    if (instance) instance.closeSync();//.catch(err => console.error('Failed to close instance:', err));
  }
}

async function apiPubConsolidateHolding(jsonFilePath){
  //_API_Put2FB
  let urlFBConsolidatedHolding=`https://aesop-portfolio.asia-southeast1.firebasedatabase.app/AggregatedHoldings.json` ;
  //moduleFBDB
  let jsonHoldingsData = fs.readFileSync(jsonFilePath) ;
  let jsonHoldings = JSON.parse(jsonHoldingsData) ;
  await moduleFBDB.API_Put2FB(urlFBConsolidatedHolding,jsonHoldings) ;
}

async function apiPubAccounts(jsonPath){
  for(let i=0;i<accountIDs.length;i++){
    let jsonFilePath = `${jsonPath}/mv_joinHolding2Quote${accountIDs[i]}.json` ;
    let jsonAccontData = fs.readFileSync(jsonFilePath) ;
    let jsonHoldings = JSON.parse(jsonAccontData) ;
    let urlFBAccount = `https://aesop-portfolio.asia-southeast1.firebasedatabase.app/holdingsWithPEPer_${accountIDs[i]}.json` ;
    await moduleFBDB.API_Put2FB(urlFBAccount,jsonHoldings) ;
  }
}

async function apiPubLedger(jsonFilePath){
  let urlFBLedger=`https://aesop-portfolio.asia-southeast1.firebasedatabase.app/ledger.json` ;
  //moduleFBDB
  let jsonHoldingsData = fs.readFileSync(jsonFilePath) ;
  let jsonLedger = JSON.parse(jsonHoldingsData) ;
  await moduleFBDB.API_Put2FB(urlFBLedger,jsonLedger) ;
}

async function apiPubValueLog(jsonFilePath){
  let urlFBLedger=`https://aesop-portfolio.asia-southeast1.firebasedatabase.app/assetTracker.json` ;
  //moduleFBDB
  let jsonHoldingsData = fs.readFileSync(jsonFilePath) ;
  let jsonLedger = JSON.parse(jsonHoldingsData) ;
  await moduleFBDB.API_Put2FB(urlFBLedger,jsonLedger) ;
}



exports.apiQuote_UpdateAll              =    apiQuote_UpdateAll ;
exports.apiQuote_PlusTicker             =    apiQuote_PlusTicker ;
exports.apiHoldingTbl_PlusHolding       =    apiHoldingTbl_PlusHolding ;
exports.apiExRate_UpdateAll             =    apiExRate_UpdateAll ;
exports.apiJoinHolding2Quote            =    apiJoinHolding2Quote ;
exports.apiRenewMVHolding2Quote         =    apiRenewMVHolding2Quote ;
exports.apiConsolidateHoldingAll        =    apiConsolidateHoldingAll ;
exports.apiCalcAccountValue             =    apiCalcAccountValue ;
exports.apiCalcTotalValueCNY            =    apiCalcTotalValueCNY ;

exports.apiPubConsolidateHolding        =    apiPubConsolidateHolding ;
exports.apiPubAccounts                  =    apiPubAccounts ;
exports.apiPubLedger                    =    apiPubLedger ;
exports.apiPubValueLog                  =    apiPubValueLog ;





exports.tool_LoadJSONToQuoteTbl         =    tool_LoadJSONToQuoteTbl ;
exports.tool_LoadJSONToHoldingTbl       =    tool_LoadJSONToHoldingTbl ;
exports.tool_LoadJSONToHoldingTbls      =    tool_LoadJSONToHoldingTbls ;
exports.tool_LoadJSONToExRateTbl        =    tool_LoadJSONToExRateTbl ;
exports.tool_LoadJSONToLedgerTbl        =    tool_LoadJSONToLedgerTbl ;

exports.tool_ExportTableToJSON          =    tool_ExportTableToJSON ;
exports.tool_BuildQuoteTblUsingHoldingTbls          =    tool_BuildQuoteTblUsingHoldingTbls ;



exports.tool_logAnyTbl                  =    tool_logAnyTbl ;
exports.tool_DropAnyTable               =    tool_DropAnyTable ;
exports.tool_DropHoldingTable           =    tool_DropHoldingTable ;
exports.tool_createHoldingTables        =    tool_createHoldingTables ;
exports.tool_logHoldingTbl              =    tool_logHoldingTbl ;

