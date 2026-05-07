const fs = require('fs') ;


function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() is 0-indexed
    const day = date.getDate().toString().padStart(2, '0');
  
    return `${year}${month}${day}`;
}

const isSameDay = (dateA, dateB) => {
    return (
      dateA.getFullYear() === dateB.getFullYear() &&
      dateA.getMonth() === dateB.getMonth() &&
      dateA.getDate() === dateB.getDate()
    );
};

async function _dailyBuildAnki(){
    const urlSM2Records = `https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/thaiAnki/SM2Records.json` ;
    const urlReviewSets = `https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/thaiAnki/reviewSets.json` ;
    
    let response = await fetch(urlSM2Records) ;
    let jsonSM2Records = await response.json() ;
    console.log(jsonSM2Records) ;

    response = await fetch(urlReviewSets) ;
    let jsonReviewSets = await response.json() ;
    console.log(jsonReviewSets) ;

    //https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/thaiAnki/reviewSets/20250911.json
    let cDate = new Date() ;
    let cDateString = formatDateToYYYYMMDD(cDate) ;
    let urlDailyReview = `https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/thaiAnki/DailyReview/${cDateString}.json` ;
    let jsonDalyReview={
        title:`Daily Anki.${cDateString}`,
        words:[]
    } ;

    //
    if(jsonSM2Records!=null){
        const sm2Entries = Object.entries(jsonSM2Records) ;
        for(let i=0;i<sm2Entries.length;i++){
            let word = sm2Entries[i][0] ; 
            let jsonSM2 = sm2Entries[i][1] ; 
            console.log(word) ;
            console.log(jsonSM2) ;
    
            let cNextDate = new Date(jsonSM2.next_review) ;
            if(isSameDay(cDate,cNextDate)==true){
                jsonDalyReview.words.push(word) ;
            }
        }
    }
    
    
    console.log(jsonDalyReview) ;

    if(jsonReviewSets!=null){
        console.log("============>>>>")
        const reviewEntries = Object.entries(jsonReviewSets) ;
        for(let i=0;i<reviewEntries.length;i++){
            let wordSetID = reviewEntries[i][0] ; 
            let jsonReview = reviewEntries[i][1] ; 
            console.log(wordSetID);
            console.log(jsonReview) ;
            let cNextDate = new Date(jsonReview.nextReview) ;
            if(isSameDay(cDate,cNextDate)==true){
                let wordSetURL = jsonReview.wordSetURL ;
                let resp = await fetch(wordSetURL) ;
                let jsonWordSet = await resp.json() ;
                let combinedSet = new Set([...jsonWordSet.words, ...jsonDalyReview.words]);
                jsonDalyReview.words = [...combinedSet];
                console.log(jsonDalyReview.words) ;
            }
        }
    }
    
    console.log(jsonDalyReview) ;


    await fetch(urlDailyReview, {
        method: "PUT", // Use PATCH to update specific fields
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonDalyReview),
    }) ;
}


async function _toolMain(){
    await _dailyBuildAnki() ;
}

_toolMain() ;

/*
const cron = require('node-cron');

cron.schedule("0 7 * * *", async () => {
    let cDate = new Date() ;
    console.log('running a task at 7AM:'+ cDate.toLocaleTimeString());
    await _dailyBuildAnki() ;
});
*/
