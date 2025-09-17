// js/ui.js

const UIManager = {
    docListContainer: null, // Initialize as null
    activeListItem: null,

    // New init function to run after the page loads
    init: function() {
        this.docListContainer = document.getElementById('doc-list-accordion');
    },
    // 2.2 Accordion风格的分类文档清单
    renderDocList: (docList) => {
        let docListContainer = document.getElementById('doc-list-accordion');
        docListContainer.innerHTML = ''; // 清空现有列表
        for (const category in docList) {
            const details = document.createElement('details');
            details.open = true; // 默认展开

            const summary = document.createElement('summary');
            summary.textContent = category;
            details.appendChild(summary);

            const ul = document.createElement('ul');
            for (const docId in docList[category]) {
                const doc = docList[category][docId];
                const li = document.createElement('li');
                li.textContent = doc.title;
                li.dataset.docId = docId;
                li.dataset.category = category;
                ul.appendChild(li);
            }
            details.appendChild(ul);
            docListContainer.appendChild(details);
        }
    },
    
    setActiveItem: (category, docId) => {
        if (this.activeListItem) {
            this.activeListItem.classList.remove('active');
        }
        const newItem = this.docListContainer.querySelector(`li[data-category='${category}'][data-doc-id='${docId}']`);
        if (newItem) {
            newItem.classList.add('active');
            this.activeListItem = newItem;
        }
    }
};