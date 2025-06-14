

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

    function formatTimeToTwoDigits(timeStr) {
        // Split the time string into hours and minutes
        const [hours, minutes] = timeStr.split(':').map(Number);
        
        // Format hours and minutes to always have two digits
        const formattedHours = hours < 10 ? `0${hours}` : `${hours}`;
        const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
        
        // Return the formatted time string
        return `${formattedHours}:${formattedMinutes}`;
    }

    function renderEvent(tagEventList,jsonEvent){
        jsonEvent.weekday = convertWeekdayToChinese(jsonEvent.weekday) ;
        jsonEvent.from = formatTimeToTwoDigits(jsonEvent.from) ;
        jsonEvent.to = formatTimeToTwoDigits(jsonEvent.to) ;

        let tagEvent = document.createElement('a') ;
        tagEventList.appendChild(tagEvent) ;
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
            <div class="event-list"></div>
        </div>
        ` ;
        tagRootCanvas.innerHTML=cInnerHTML ;
    }