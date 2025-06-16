function convertWeekdayToChinese(weekday) {
    const weekdayMap = {
        'Monday': '周一',
        'Tuesday': '周二',
        'Wednesday': '周三',
        'Thursday': '周四',
        'Friday': '周五',
        'Saturday': '周六',
        'Sunday': '周日'
    };
    
    // Normalize input to match keys (case-sensitive)
    const normalizedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1).toLowerCase();
    return weekdayMap[normalizedWeekday] || 'Invalid weekday';
}

function getWeekday(){
    const date = new Date(); // Current date
    const dayOfWeek = date.getDay(); // Gets the day of the week as a number (0-6)
    console.log(dayOfWeek);
    
    // To get the name of the weekday, you can create an array:
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayOfWeek = daysOfWeek[date.getDay()];
    console.log(currentDayOfWeek);
    return currentDayOfWeek ;
}


function formatTimeToTwoDigits(timeStr) {
    // Split the time string into hours and minutes
    const [hours, minutes] = timeStr.split(':').map(Number);
    
    // Format hours and minutes to always have two digits
    const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    
    // Return the formatted time string
    return `${formattedHours}:${formattedMinutes}`;
}

function renderCourseEvent(tagEventList,jsonEvent){

    //if(weekDay!=jsonEvent.weekday)return ;
    
    const weekdayClassMap = {
        'Monday': 'scheduleMon',
        'Tuesday': 'scheduleTue',
        'Wednesday': 'scheduleWed',
        'Thursday': 'scheduleThurs',
        'Friday': 'scheduleFri',
        'Saturday': 'scheduleSat',
        'Sunday': 'scheduleSun'
    };

    let className = weekdayClassMap[jsonEvent.weekday] ;
    let tagWeekdayContainer = tagEventList.querySelector(`.${className}`) ;
    
    
    jsonEvent.weekday = convertWeekdayToChinese(jsonEvent.weekday) ;
    jsonEvent.from = formatTimeToTwoDigits(jsonEvent.from) ;
    jsonEvent.to = formatTimeToTwoDigits(jsonEvent.to) ;

    let tagEvent = document.createElement('a') ;
    //tagEventList.appendChild(tagEvent) ;
    tagWeekdayContainer.appendChild(tagEvent) ;
    tagEvent.href='#' ;
    tagEvent.classList.add('eventV2') ;
    tagEvent.innerHTML=`
        <div class="event-containerV2">
            <div class="date-containerV2">
                <p class="WeekV2">${jsonEvent.weekday}</p>
                <p class="dateV2"><span>Jun</span>-<span>11</span></p>
            </div>
            <div class="detail-containerV2">
                <p class="titleV2 truncate">${jsonEvent.course}</p>
                <p ><span class="timeV2">${jsonEvent.from}-${jsonEvent.to}</span> <span class="locationV2">${jsonEvent.location}</span></p>
                <p class="descriptionV2">${jsonEvent.memo}:${jsonEvent.courseID}</p>
            </div>
        </div>
    ` ;

    let tagSpacer = document.createElement('div') ;
    tagEventList.appendChild(tagSpacer) ;
    tagSpacer.classList.add('spacer') ;
}

/*
jsonEvent={
    event:"fdsfds",
    from:"2025-07-06T17:00:00.000Z",
    to:"2025-07-10T17:00:00.000Z",
    importance:"fdsf",
    memo:"ssss"
}
*/
function renderCMUCalendarEvent(tagEventList,jsonEvent){
    let from = new Date(jsonEvent.from) ;
    let to = new Date(jsonEvent.to) ;
    //jsonEvent.from = formatTimeToTwoDigits(jsonEvent.from) ;
    //jsonEvent.to = formatTimeToTwoDigits(jsonEvent.to) ;
    //const className = ["scheduleSun","scheduleMon","scheduleTue","scheduleWed","scheduleThurs","scheduleFri","scheduleSat"]
    const weekdayClassMap = {
        'Monday': 'scheduleMon',
        'Tuesday': 'scheduleTue',
        'Wednesday': 'scheduleWed',
        'Thursday': 'scheduleThurs',
        'Friday': 'scheduleFri',
        'Saturday': 'scheduleSat',
        'Sunday': 'scheduleSun'
    };

    let className = weekdayClassMap[jsonEvent.weekday] ;
    let tagWeekdayContainer = tagEventList.querySelector(`.${className}`) ;
    let tagEvent = document.createElement('a') ;
    //tagEventList.appendChild(tagEvent) ;
    tagWeekdayContainer.appendChild(tagEvent) ;
    tagEvent.href='#' ;
    tagEvent.classList.add('eventV2') ;
    tagEvent.innerHTML=`
        <div class="event-containerV2">
            <div class="date-containerV2">
                <p class="WeekV2">${jsonEvent.weekday}</p>
                <p class="dateV2"><span>Jun</span>-<span>11</span></p>
            </div>
            <div class="detail-containerV2">
                <p class="titleV2">Listening&Speaking Thai 3</p>
                <p ><span class="timeV2">${jsonEvent.from}-${jsonEvent.to}</span> <span class="locationV2">${jsonEvent.location}</span></p>
                <p class="descriptionV2">${jsonEvent.memo}</p>
            </div>
        </div>
    ` ;

    let tagSpacer = document.createElement('div') ;
    tagEventList.appendChild(tagSpacer) ;
    tagSpacer.classList.add('spacer') ;
}

function switchScheduleMode(tagRootCanvas,modeTitle){
    let cInnerHTML=`
    <div class="event-calendar" style="width:100%/*350px*/;">
        <div class="head"><p class="top-line">${modeTitle}</p></div>
        <div class="spacer"></div>
        <div class="event-list">
            <details class="scheduleMon weekday"><summary>Monday</summary></details>
            <details class="scheduleTue weekday"><summary>Tuesday</summary></details>
            <details class="scheduleWed weekday"><summary>Wednesday</summary></details>
            <details class="scheduleThurs weekday"><summary>Thursday</summary></details>
            <details class="scheduleFri weekday"><summary>Friday</summary></details>
            <details class="scheduleSat weekday"><summary>Saturday</summary></details>
            <details class="scheduleSun weekday"><summary>Sunday</summary></details>

        </details>
        </details>
        </div>
    </div>
    ` ;
    tagRootCanvas.innerHTML=cInnerHTML ;
}