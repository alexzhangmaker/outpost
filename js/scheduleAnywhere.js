
function renderSchedule(tagWndContent,jsonCMUSchedule){
    tagWndContent.innerHTML=`` ;
    for(let i=0;i<jsonCMUSchedule.length;i++){
        let tagEvent = document.createElement('details') ;
        tagWndContent.appendChild(tagEvent) ;
        tagEvent.innerHTML=`
            <summary>${jsonCMUSchedule[i].workday}/${jsonCMUSchedule[i].Time}=>${jsonCMUSchedule[i].scheduled}</summary>
            <div class="eventDetail">
                <span>${jsonCMUSchedule[i].Location}</span>
            </div>
        ` ;
    }
}




async function _onClick_CMUCalendar(event){
    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/CMUSchedule2025.json";
    let jsonCMUSchedule = [];
    const res = await fetch(firebaseUrl);
    jsonCMUCalendar = await res.json();
    console.log(jsonCMUCalendar) ;
    let tagWndContent = document.querySelector('#idWndContent') ;

    //renderSchedule(tagWndContent,jsonCMUSchedule);
    switchScheduleMode(tagWndContent,"CMU 2025") ;
    for(let i=0;i<jsonCMUCalendar.length;i++){
        renderCMUCalendarEvent(document.querySelector(".event-list"), jsonCMUCalendar[i]) ;
    }
    //renderEvent(document.querySelector(".event-list"), jsonEvent1) ;
    //renderEvent(document.querySelector(".event-list"), jsonEvent2) ;
    
}
