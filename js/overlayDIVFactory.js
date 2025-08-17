function _injectOverlayStyle() {
    // Inject CSS styles for the overlay
    const style = document.createElement('style');
    style.textContent = `
        .overlay-view {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 60vw;
            height: 60vh;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            border-radius: 5px;
            padding: 10px;
            box-sizing: border-box;
        }
        .overlay-view-close {
            margin-left: 10px;
            cursor: pointer;
            background: #ff4d4d;
            border: none;
            color: white;
            padding: 5px 10px;
            border-radius: 3px;
        }
    `;
    document.head.appendChild(style);

    // Factory object
    
}

_injectOverlayStyle() ;

window.overlayView = {
    createOverlay: function (htmlContent) {
        // Remove existing overlay
        const existingOverlay = document.querySelector('.overlay-view');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // Create new overlay
        const overlayDiv = document.createElement('div');
        overlayDiv.className = 'overlay-view';
        overlayDiv.innerHTML = `
            ${htmlContent || 'Centered Overlay'}
            <button class="overlay-view-close" onclick="this.parentElement.remove()">Close</button>
        `;

        // Append to body
        document.body.appendChild(overlayDiv);

        // Return reference to the overlay for further manipulation if needed
        return overlayDiv;
    }
};