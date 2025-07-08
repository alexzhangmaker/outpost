async function _renderScheduleMode(tagWndContent){
    const modeTitle = "Schedule 2025" ;
    let cInnerHTML=`
        <div class="CourseSchedule">
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
        </div>
        <div class="AnnualSchedule"></div>
        <div class="PersonalSchedule"></div>
        <div class="CourseArrangements"></div>

        ` ;
    tagWndContent.innerHTML=cInnerHTML ;

    await _renderCourseSchedule(tagWndContent.querySelector('.CourseSchedule')) ;
    await _renderAnnualSchedule(tagWndContent.querySelector('.AnnualSchedule')) ;
    await _renderPersonalSchedule(tagWndContent.querySelector('.PersonalSchedule')) ;
    await _renderCourseArrangements(tagWndContent.querySelector('.CourseArrangements')) ;

}

async function _renderCourseSchedule(tagCourseSchedule){
    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/CourseSchedule2025.json";
    let jsonCourseSchedule = [];
    const res = await fetch(firebaseUrl);
    jsonCourseSchedule = await res.json();
    console.log(jsonCourseSchedule) ;

    for(let i=0;i<jsonCourseSchedule.length;i++){
        renderCourseEvent(tagCourseSchedule.querySelector(".event-list"), jsonCourseSchedule[i]) ;
    }

    let weekday = getWeekday() ;
    const weekdayClassMap = {
        'Monday': 'scheduleMon',
        'Tuesday': 'scheduleTue',
        'Wednesday': 'scheduleWed',
        'Thursday': 'scheduleThurs',
        'Friday': 'scheduleFri',
        'Saturday': 'scheduleSat',
        'Sunday': 'scheduleSun'
    };
    let className = weekdayClassMap[weekday] ;
    let tagEventList = tagCourseSchedule.querySelector(".event-list") ;
    let tagWeekdayContainer = tagEventList.querySelector(`.${className}`) ;
    tagWeekdayContainer.open = true; 
    let tagWeekdays = tagEventList.querySelectorAll('.weekday');
    tagWeekdays.forEach(tagWeekday=>{
        if(tagWeekday.querySelectorAll('.eventV2').length==0){
            tagWeekday.classList.add('noShow') ;
        }
    }) ;
}

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

function _getWeekStatus(inputDate) {
    // Convert input to Date object if it's not already
    const date = new Date(inputDate);
    const today = new Date();
    
    // Set start of week to Monday (adjust to Sunday if preferred by changing to 0)
    const getStartOfWeek = (d) => {
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day); // Adjust for Monday start
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        return start;
    };
    
    // Get start of current, previous, and next weeks
    const currentWeekStart = getStartOfWeek(today);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    // Get start of input date's week
    const inputWeekStart = getStartOfWeek(date);
    
    // Compare week starts
    if (inputWeekStart.getTime() === currentWeekStart.getTime()) {
        return 'currentWeek';
    } else if (inputWeekStart.getTime() === previousWeekStart.getTime()) {
        return 'previousWeek';
    } else if (inputWeekStart.getTime() === nextWeekStart.getTime()) {
        return 'nextWeek';
    } else {
        return 'none';
    }
}

function _checkWeekRangeOverlap(from, to) {
    // Convert inputs to Date objects
    const fromDate = new Date(from);
    const toDate = new Date(to);
    const today = new Date();
    
    // Validate input dates
    if (isNaN(fromDate) || isNaN(toDate) || fromDate > toDate) {
        return false;
    }
    
    // Set start of week to Monday
    const getStartOfWeek = (d) => {
        const day = d.getDay();
        const diff = (day === 0 ? -6 : 1 - day); // Adjust for Monday start
        const start = new Date(d);
        start.setDate(d.getDate() + diff);
        start.setHours(0, 0, 0, 0);
        return start;
    };
    
    // Get start of previous week and end of next week
    const currentWeekStart = getStartOfWeek(today);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    const nextWeekEnd = new Date(currentWeekStart);
    nextWeekEnd.setDate(currentWeekStart.getDate() + 13); // End of next week (Sunday)
    nextWeekEnd.setHours(23, 59, 59, 999);
    
    // Check for overlap
    // Overlap occurs if: fromDate <= nextWeekEnd AND toDate >= previousWeekStart
    return fromDate <= nextWeekEnd && toDate >= previousWeekStart;
}


function _isSameDay(date1, date2) {
    // Convert inputs to Date objects
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    // Validate inputs
    if (isNaN(d1) || isNaN(d2)) {
        return false;
    }
    
    // Compare year, month, and day
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

async function _renderAnnualSchedule(tagAnnualSchedule){
    tagAnnualSchedule.innerHTML=`` ;

    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/CMUSchedule2025.json";
    let jsonCMUSchedule = [];
    const res = await fetch(firebaseUrl);
    jsonCMUSchedule = await res.json();
    console.log(jsonCMUSchedule) ;

    let today = new Date() ;
    const formatter = new Intl.DateTimeFormat('en-US', {month: '2-digit',day: '2-digit',year: 'numeric'});
    for(let i=0;i<jsonCMUSchedule.length;i++){
        let tagEvent = document.createElement('details') ;
        tagAnnualSchedule.appendChild(tagEvent) ;
        let fromDate = new Date(jsonCMUSchedule[i].from) ;
        let toDate = new Date(jsonCMUSchedule[i].to) ;
        if(_isSameDay(fromDate,toDate)){
            let inWeeksRange = _getWeekStatus(fromDate) ;
            if('none' == inWeeksRange){
                tagEvent.classList.add('noShow') ;
                continue ;
            }
        }else{
            if(_checkWeekRangeOverlap(fromDate,toDate)!=true){
                tagEvent.classList.add('noShow') ;
                continue ;
            }
        }
        tagEvent.innerHTML=`
            <summary>
                <div>
                    <span style="font-size:12px;">${formatter.format(fromDate)}/${formatter.format(toDate)}}</span>
                    <span class="truncate" style="font-size:16px;">${jsonCMUSchedule[i].event}</span>
                </div>
            </summary>
            <div class="eventDetail">
                ${jsonCMUSchedule[i].memo}
            </div>
        ` ;
    }
}


async function _renderPersonalSchedule(tagPersonalSchedule){
    tagPersonalSchedule.innerHTML=`` ;
    //https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Personal
    const firebaseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Personal.json";
    let jsonPersonalchedule = [];
    const res = await fetch(firebaseUrl);
    jsonPersonalchedule = await res.json();
    console.log(jsonPersonalchedule) ;

    let today = new Date() ;
    const formatter = new Intl.DateTimeFormat('en-US', {month: '2-digit',day: '2-digit',year: 'numeric'});
    for(let i=0;i<jsonPersonalchedule.length;i++){
        let tagEvent = document.createElement('details') ;
        tagPersonalSchedule.appendChild(tagEvent) ;
        let fromDate = new Date(jsonPersonalchedule[i].from) ;
        let toDate = new Date(jsonPersonalchedule[i].to) ;
        if(_isSameDay(fromDate,toDate)){
            let inWeeksRange = _getWeekStatus(fromDate) ;
            if('none' == inWeeksRange){
                tagEvent.classList.add('noShow') ;
                continue ;
            }
        }else{
            if(_checkWeekRangeOverlap(fromDate,toDate)!=true){
                tagEvent.classList.add('noShow') ;
                continue ;
            }
        }
        tagEvent.innerHTML=`
            <summary>
                <div>
                    <span style="font-size:12px;">${formatter.format(fromDate)}/${formatter.format(toDate)}}</span>
                    <span class="truncate" style="font-size:16px;">${jsonPersonalchedule[i].event}</span>
                </div>
            </summary>
            <div class="eventDetail">
                ${jsonPersonalchedule[i].memo}
            </div>
        ` ;
    }
}

//https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai3_LS
//_renderCourseArrangements
/*
{
    Date:'',
    Milestone:'' or "Important",
    Course:""
}
*/

async function _renderCourseAlerting(course,courseURL,tagSchedule){
    let jsonCourseSchedule = [];
    const res = await fetch(courseURL);
    jsonCourseSchedule = await res.json();
    console.log(jsonCourseSchedule) ;

    const formatter = new Intl.DateTimeFormat('en-US', {month: '2-digit',day: '2-digit',year: 'numeric'});

    for(let i=0;i<jsonCourseSchedule.length;i++){
        if(jsonCourseSchedule[i].Milestone!="Important")continue ;

        let cDate = new Date(jsonCourseSchedule[i].Date) ;
        if(isDateInWorkdayRange(cDate)!=true)continue ;

        let tagEvent = document.createElement('details') ;
        tagSchedule.appendChild(tagEvent) ;
        tagEvent.innerHTML=`
            <summary>
                <div>
                    <span style="font-size:12px;">${formatter.format(cDate)}}</span>
                    <span class="truncate" style="font-size:16px;">${course}</span>
                </div>
            </summary>
            <div class="eventDetail">
                ${jsonCourseSchedule[i].Course}
            </div>
        ` ;
    }
}
async function _renderCourseArrangements(tagSchedule){
    tagSchedule.innerHTML=`` ;


    let courseName="Thai3 Listen&Speak" ;
    let courseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai3_LS.json";
    await _renderCourseAlerting(courseName,courseUrl,tagSchedule) ;

    courseName="Thai3" ;//https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai_3
    courseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai_3.json";
    await _renderCourseAlerting(courseName,courseUrl,tagSchedule) ;

    courseName="English" ;//https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai_3
    courseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/English.json";
    await _renderCourseAlerting(courseName,courseUrl,tagSchedule) ;

    courseName="Oral" ;//https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai_3
    courseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Oral.json";
    await _renderCourseAlerting(courseName,courseUrl,tagSchedule) ;

    courseName="Document" ;//https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Thai_3
    courseUrl = "https://outpost-8d74e.asia-southeast1.firebasedatabase.app/Document.json";
    await _renderCourseAlerting(courseName,courseUrl,tagSchedule) ;
    
}


function isDateInWorkdayRange(inputDate) {
  // Convert input to Date object
  const input = new Date(inputDate);
  if (isNaN(input)) {
    throw new Error('Invalid input date');
  }

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Normalize to midnight for comparison
  input.setHours(0, 0, 0, 0); // Normalize input date

  // Helper function to check if a date is a workday (Monday to Friday)
  function isWorkday(date) {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Monday (1) to Friday (5)
  }

  // Helper function to get the date of the previous Wednesday
  function getLastWednesday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const daysToSubtract = (day === 0 ? 4 : day === 6 ? 3 : day - 3); // Adjust to last Wednesday
    d.setDate(d.getDate() - daysToSubtract);
    return d;
  }

  // Helper function to get the date of the next Wednesday
  function getNextWednesday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const daysToAdd = (day === 0 ? 3 : day === 6 ? 4 : 10 - day); // Adjust to next Wednesday
    d.setDate(d.getDate() + daysToAdd);
    return d;
  }

  // Helper function to get the date N workdays before/after
  function getWorkdayOffset(date, workdays) {
    const result = new Date(date);
    let count = Math.abs(workdays);
    const direction = workdays >= 0 ? 1 : -1;

    while (count > 0) {
      result.setDate(result.getDate() + direction);
      if (isWorkday(result)) {
        count--;
      }
    }
    return result;
  }

  // Determine if today is a weekend (Saturday or Sunday)
  const isWeekend = today.getDay() === 0 || today.getDay() === 6;

  let startDate, endDate;

  if (isWeekend) {
    // Weekend: Range is last Wednesday to next Wednesday
    startDate = getLastWednesday(today);
    endDate = getNextWednesday(today);
  } else {
    // Weekday: Range is 3 workdays before and after today
    startDate = getWorkdayOffset(today, -3);
    endDate = getWorkdayOffset(today, 3);
  }

  // Check if input date is within the range (inclusive)
  return input >= startDate && input <= endDate;
}