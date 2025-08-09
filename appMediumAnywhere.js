
function appMeta(){
    return {
        name:'boxAnywhere',
        title:'box.Anywhere',
        appTitle:_appTitle,
        renderPanel:_renderPanel/*,
        renderWorkStudio:_renderWorkStudio,
        injectStyle:_injectStyle_AppBoxAnywhere*/
    }
}


const _appTitle = ()=>{
    return 'medium.Anywhere' ;
} ;


const _style_AppMediumAnywhere=`

` ;
const _injectStyle_AppBoxAnywhere = ()=>{
    /*
    let linkBootstrap = document.createElement('link');
    linkBootstrap.rel = 'stylesheet';
    linkBootstrap.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css';
    document.head.appendChild(linkBootstrap);

    let linkTippy = document.createElement('link');
    linkTippy.rel = 'stylesheet';
    linkTippy.href = 'https://unpkg.com/tippy.js@6/dist/tippy.css';
    document.head.appendChild(linkTippy);

    //<script src="//cdn.jsdelivr.net/npm/medium-editor@latest/dist/js/medium-editor.min.js"></script>
    //<link rel="stylesheet" href="//cdn.jsdelivr.net/npm/medium-editor@latest/dist/css/medium-editor.min.css" type="text/css" media="screen" charset="utf-8">
    */

    const styleElement = document.createElement('style');
    styleElement.textContent = _style_AppMediumAnywhere;
    // Append the style to the document head
    document.head.appendChild(styleElement);

};



const _renderPanel=async (tagPanel)=>{
    console.log('appBox _renderPanel') ;
    //alert('will render panel')

    if(tagPanel.dataset.rendered =='true')return ;

    tagPanel.innerHTML=`
        
    ` ;

    

    tagPanel.dataset.rendered='true' ;    
} ;

const _renderWorkStudio=async (tagRightPanelMain)=>{
    tagRightPanelMain.innerHTML=`
        
    `;
} ;


function genBoxID(){
    let now = dayjs() ;
    let cDate = now.format("YYYYMMDD") ;

    const array = new Uint16Array(1);
    window.crypto.getRandomValues(array);

    // To get a number between 1000 and 9999 (inclusive)
    const random4Digit = 1000 + (array[0] % 9000);
    console.log(random4Digit);

    return `${cDate}${random4Digit}` ;
}

