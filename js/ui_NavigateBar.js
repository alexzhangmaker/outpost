

function injectOutpostStyle_Navbar(){
    let linkBootstrap = document.createElement('link');
    linkBootstrap.rel = 'stylesheet';
    linkBootstrap.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css';
    document.head.appendChild(linkBootstrap);

    let linkTippy = document.createElement('link');
    linkTippy.rel = 'stylesheet';
    linkTippy.href = 'https://unpkg.com/tippy.js@6/dist/tippy.css';
    document.head.appendChild(linkTippy);


    const styleElement = document.createElement('style');
    styleElement.textContent = `
        .vertical-toolbar {
            position: fixed;
            top: 0;
            height: 100vh;
            width: 40px;
            background-color: #343a40;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 1rem 0;
            z-index: 1000;
            transition: all 0.3s;
        }

        /* Default to left side */
        .left {
            left: 0;
        }

        /* Right side positioning */
        .right {
            right: 0;
        }

        .toolbar-item {
            color: white;
            font-size: 24px;
            padding: 1rem 0;
            cursor: pointer;
            transition: color 0.2s;
        }

        .toolbar-item:hover {
            color: #0d6efd;
        }
    `;
    // Append the style to the document head
    document.head.appendChild(styleElement);

}


function injectOutpost_Script(){
    let scriptCore = document.createElement('script');
    scriptCore.src = 'https://unpkg.com/@popperjs/core@2';
    scriptCore.async = true; // optional: loads script asynchronously
    document.head.appendChild(scriptCore);
    scriptCore.onload = () => {
        console.log('Popper.js core loaded');
        // Initialize or call code that depends on Popper here
    };
    let scriptTippy = document.createElement('script');
    scriptTippy.src = 'https://unpkg.com/tippy.js@6';
    scriptTippy.async = true; // optional: loads script asynchronously
    document.head.appendChild(scriptTippy);
    scriptTippy.onload = () => {
        console.log('Popper.js tippy loaded');
        // Initialize or call code that depends on Popper here
    };

}

function injectOutpost_Navbar(){

    injectOutpostStyle_Navbar() ;
    let tagNavBarContainer = document.createElement('div') ;
    document.body.appendChild(tagNavBarContainer) ;

    tagNavBarContainer.classList.add('vertical-toolbar');
    tagNavBarContainer.classList.add('left');
    tagNavBarContainer.id="toolbar" ;
    tagNavBarContainer.innerHTML=`
        <i class="bi bi-house toolbar-item" data-tippy-content="Home"></i>
        <i class="bi bi-person toolbar-item" data-tippy-content="Profile"></i>
        <i class="bi bi-gear toolbar-item" data-tippy-content="Settings"></i>
        <i class="bi bi-box-arrow-right toolbar-item" data-tippy-content="Logout"></i>
        <!-- Toggle position button -->
        <i class="bi bi-arrow-left-right toolbar-item" id="togglePosition" data-tippy-content="Toggle Position"></i>
    ` ;

    // Initialize Tippy.js tooltips
    tippy('.toolbar-item', {
        placement: 'right', // Default placement for left toolbar
        animation: 'shift-away',
        theme: 'dark'
    });

    // Toggle toolbar position
    //const toolbar = document.getElementById('toolbar');
    const toggleButton = tagNavBarContainer.querySelector('#togglePosition');

    toggleButton.addEventListener('click', () => {
        if (tagNavBarContainer.classList.contains('left')) {
            tagNavBarContainer.classList.remove('left');
            tagNavBarContainer.classList.add('right');
            // Update tooltip placement
            document.querySelectorAll('.toolbar-item').forEach(item => {
                const tippyInstance = item._tippy;
                tippyInstance.setProps({ placement: 'left' });
            });
        } else {
            tagNavBarContainer.classList.remove('right');
            tagNavBarContainer.classList.add('left');
            // Update tooltip placement
            document.querySelectorAll('.toolbar-item').forEach(item => {
                const tippyInstance = item._tippy;
                tippyInstance.setProps({ placement: 'right' });
            });
        }
    });

    // Add click handlers for toolbar items (example functionality)
    document.querySelectorAll('.toolbar-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (e.target.id !== 'togglePosition') {
                alert(`${e.target.getAttribute('data-tippy-content')} clicked!`);
            }
        });
    });

}




//injectOutpost_Navbar() ;
