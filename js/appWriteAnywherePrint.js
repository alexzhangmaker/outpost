
function _formatPrint() {
  const markdownContent = editor.getMarkdown();
  const htmlContent = editor.getHTML();

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Printable Markdown Content with A4 Preview</title>

      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@350&family=Noto+Serif+Thai:wght@100..900&family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');
        
        .ch-noto-sans-sc-350 {
          font-family: "Noto Sans SC", sans-serif;
          font-optical-sizing: auto;
          font-weight: 350;
          font-style: normal;
        }


        .en-noto-sans-sc-350 {
          font-family: "Noto Sans SC", sans-serif;
          font-optical-sizing: auto;
          font-weight: 350;
          font-style: normal;
        }


      .th-noto-sans-sc-350 {
        font-family: "Noto Sans SC", sans-serif;
        font-optical-sizing: auto;
        font-weight: 350;
        font-style: normal;
      }
      
      </style>
      <style>
        body {
          /*font-family: Arial, sans-serif;*/
          line-height: 1.6;
          margin: 0;
          padding: 0;
          display: flex;
          font-size:14px ;
        }
        .main-container {
          display: flex;
          width: 100%;
          max-width: 1600px;
          margin: 0 auto;
        }
        .content {
          flex: 1;
          max-width: 800px;
          padding: 20px;
          overflow-y: auto;
          height: 100vh;
          box-sizing: border-box;
        }
        .preview-container {
          flex: 0 0 300px;
          padding: 20px;
          background: #f5f5f5;
          border-left: 1px solid #ccc;
          position: fixed;
          right: 0;
          top: 0;
          height: 100vh;
          box-sizing: border-box;
        }
        .preview-page {
          width: 148mm;
          height: 210mm;
          background: white;
          margin: 0 auto;
          padding: 14mm;
          box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
          box-sizing: border-box;
          font-size: 8.4pt;
          overflow: hidden;
          display: none;
        }
        .preview-page.active {
          display: block;
        }
        .preview-page h1, .preview-page h2, .preview-page h3, .preview-page h4, .preview-page h5, .preview-page h6 {
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        .preview-page p, .preview-page ul, .preview-page ol, .preview-page blockquote, .preview-page pre {
          page-break-inside: avoid;
        }
        .preview-page img {
          max-width: 100%;
          height: auto;
          page-break-inside: avoid;
        }
        .preview-page table {
          page-break-inside: avoid;
        }
        .preview-page tr, .preview-page td, .preview-page th {
          page-break-inside: avoid;
        }
        .preview-nav {
          text-align: center;
          margin: 10px 0;
        }
        .preview-nav button {
          padding: 5px 10px;
          margin: 0 5px;
          cursor: pointer;
        }
        .preview-nav button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }
        .page-break {
          position: relative;
        }
        .page-break::before {
          content: "Page Break";
          display: block;
          background: #ffeb3b;
          color: #000;
          padding: 5px;
          margin: 10px 0;
          border: 1px dashed #f00;
          text-align: center;
          font-weight: bold;
        }
        .content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre {
          cursor: pointer;
        }
        .content p:hover, .content h1:hover, .content h2:hover, .content h3:hover, .content h4:hover, .content h5:hover, .content h6:hover, .content ul:hover, .content ol:hover, .content blockquote:hover, .content pre:hover {
          background: #f0f0f0;
        }
        @media print {
          body {
            margin: 0;
            padding: 0;
            display: block;
          }
          .main-container {
            display: block;
          }
          .content {
            max-width: 100%;
            padding: 1cm;
            overflow: visible;
          }
          .preview-container {
            display: none;
          }
          @page {
            size: A4;
            margin: 2cm;
          }
          h1, h2, h3, h4, h5, h6 {
            page-break-before: auto;
            page-break-after: avoid;
            page-break-inside: avoid;
          }
          p, ul, ol, blockquote, pre {
            page-break-inside: avoid;
          }
          img {
            max-width: 100%;
            height: auto;
            page-break-inside: avoid;
          }
          table {
            page-break-inside: avoid;
          }
          tr, td, th {
            page-break-inside: avoid;
          }
          .page-break {
            page-break-before: always;
          }
          .page-break::before {
            display: none;
          }
          .no-print {
            display: none;
          }
        }
      </style>
      <style>
        ol{
            padding-inline-start: 20px !important;
        }

        ul{
            padding-inline-start: 20px !important;
        }

        li p{
            margin-top: 5px;
            margin-bottom: 5px;
        }
      </style>
    </head>
    <body>
      <div class="main-container">
        <div class="content">${htmlContent}</div>
        <div class="preview-container">
          <div class="preview-nav">
            <button id="idBTNChinese">中文</button>
            <button id="idBTNEnglish">英文</button>
            <button id="idBTNThai">泰文</button>

            <button id="prev-page" disabled>Previous</button>
            <button id="next-page">Next</button>
            <button id="print-page" class="no-print">Print</button>
          </div>
          <div class="preview-pages"></div>
        </div>
      </div>
      <script>
        document.addEventListener('DOMContentLoaded', () => {
          const elements = document.querySelectorAll('.content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre');
          const previewPagesContainer = document.querySelector('.preview-pages');
          const prevButton = document.querySelector('#prev-page');
          const nextButton = document.querySelector('#next-page');
          const printButton = document.querySelector('#print-page');
          let currentPageIndex = 0;
          let pages = [];

          function updatePreview() {
            previewPagesContainer.innerHTML = '';
            pages = [];

            let currentPage = document.createElement('div');
            currentPage.classList.add('preview-page');
            if (currentPageIndex === 0) currentPage.classList.add('active');
            previewPagesContainer.appendChild(currentPage);
            pages.push(currentPage);

            const pageHeight = (210 - 28) * (96 / 25.4); // Approx 682px
            let currentHeight = 0;

            const contentElements = document.querySelectorAll('.content > *');
            contentElements.forEach(element => {
              if (!element.classList.contains('no-print')) {
                const clone = element.cloneNode(true);
                if (clone.classList.contains('page-break')) {
                  clone.classList.remove('page-break');
                }

                if (element.classList.contains('page-break') && currentPage.childElementCount > 0) {
                  currentPage = document.createElement('div');
                  currentPage.classList.add('preview-page');
                  if (currentPageIndex === pages.length) currentPage.classList.add('active');
                  previewPagesContainer.appendChild(currentPage);
                  pages.push(currentPage);
                  currentHeight = 0;
                }

                currentPage.appendChild(clone);
                const elementHeight = clone.offsetHeight;

                if (currentHeight + elementHeight > pageHeight && currentPage.childElementCount > 0 && !element.classList.contains('page-break')) {
                  clone.remove();
                  currentPage = document.createElement('div');
                  currentPage.classList.add('preview-page');
                  if (currentPageIndex === pages.length) currentPage.classList.add('active');
                  previewPagesContainer.appendChild(currentPage);
                  pages.push(currentPage);
                  currentHeight = 0;
                  currentPage.appendChild(clone.cloneNode(true));
                  currentHeight += elementHeight;
                } else {
                  currentHeight += elementHeight;
                }
              }
            });

            prevButton.disabled = currentPageIndex === 0;
            nextButton.disabled = currentPageIndex === pages.length - 1;
          }

          prevButton.addEventListener('click', () => {
            if (currentPageIndex > 0) {
              pages[currentPageIndex].classList.remove('active');
              currentPageIndex--;
              pages[currentPageIndex].classList.add('active');
              prevButton.disabled = currentPageIndex === 0;
              nextButton.disabled = false;
            }
          });

          nextButton.addEventListener('click', () => {
            if (currentPageIndex < pages.length - 1) {
              pages[currentPageIndex].classList.remove('active');
              currentPageIndex++;
              pages[currentPageIndex].classList.add('active');
              nextButton.disabled = currentPageIndex === pages.length - 1;
              prevButton.disabled = false;
            }
          });

          printButton.addEventListener('click', () => {
            window.print();
          });

          //document.body.classList.add("th-noto-sans-sc-350");
          document.querySelector("#idBTNChinese").addEventListener('click', (event) => {

            let tagContent = document.querySelector(".content");
            if(tagContent.classList.contains("en-noto-sans-sc-350"))tagContent.classList.remove("en-noto-sans-sc-350");
            if(tagContent.classList.contains("th-noto-sans-sc-350"))tagContent.classList.remove("th-noto-sans-sc-350");
            tagContent.classList.add("ch-noto-sans-sc-350");
            //ch-noto-sans-sc-350 en-noto-sans-sc-350 th-noto-sans-sc-350
          }) ;

          document.querySelector("#idBTNEnglish").addEventListener('click', (event) => {
            let tagContent = document.querySelector(".content");

            if(tagContent.classList.contains("ch-noto-sans-sc-350"))tagContent.classList.remove("ch-noto-sans-sc-350");
            if(tagContent.classList.contains("th-noto-sans-sc-350"))tagContent.classList.remove("th-noto-sans-sc-350");
            tagContent.classList.add("en-noto-sans-sc-350");//ch-noto-sans-sc-350
            //ch-noto-sans-sc-350 en-noto-sans-sc-350 th-noto-sans-sc-350
          }) ;

          document.querySelector("#idBTNThai").addEventListener('click', (event) => {
            let tagContent = document.querySelector(".content");

            if(tagContent.classList.contains("en-noto-sans-sc-350"))tagContent.classList.remove("en-noto-sans-sc-350");
            if(tagContent.classList.contains("ch-noto-sans-sc-350"))tagContent.classList.remove("ch-noto-sans-sc-350");
            tagContent.classList.add("th-noto-sans-sc-350");//ch-noto-sans-sc-350
            //ch-noto-sans-sc-350 en-noto-sans-sc-350 th-noto-sans-sc-350
          }) ;

          updatePreview();

          elements.forEach(element => {
            element.addEventListener('click', () => {
              if (element.classList.contains('page-break')) {
                element.classList.remove('page-break');
              } else {
                element.classList.add('page-break');
              }
              pages[currentPageIndex].classList.remove('active');
              currentPageIndex = 0;
              updatePreview();
            });
          });
        });
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function _formatPrinterr() {
  const markdownContent = editor.getMarkdown();
  const htmlContent = editor.getHTML();

  // Create a new window
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Printable Markdown Content with A4 Preview</title>
    <style>
      /* General layout for screen */
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        margin: 0;
        padding: 0;
        display: flex;
      }
      .main-container {
        display: flex;
        width: 100%;
        max-width: 1600px;
        margin: 0 auto;
      }
      .content {
        flex: 1;
        max-width: 800px;
        padding: 20px;
        overflow-y: auto;
        height: 100vh;
        box-sizing: border-box;
      }
      .preview-container {
        flex: 0 0 300px;
        padding: 20px;
        background: #f5f5f5;
        border-left: 1px solid #ccc;
        position: fixed;
        right: 0;
        top: 0;
        height: 100vh;
        box-sizing: border-box;
      }
      .preview-page {
        width: 148mm;
        height: 210mm;
        background: white;
        margin: 0 auto;
        padding: 14mm;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
        font-size: 8.4pt;
        overflow: hidden;
        display: none;
      }
      .preview-page.active {
        display: block;
      }
      .preview-page h1, .preview-page h2, .preview-page h3, .preview-page h4, .preview-page h5, .preview-page h6 {
        page-break-before: auto;
        page-break-after: avoid;
        page-break-inside: avoid;
      }
      .preview-page p, .preview-page ul, .preview-page ol, .preview-page blockquote, .preview-page pre {
        page-break-inside: avoid;
      }
      .preview-page img {
        max-width: 100%;
        height: auto;
        page-break-inside: avoid;
      }
      .preview-page table {
        page-break-inside: avoid;
      }
      .preview-page tr, .preview-page td, .preview-page th {
        page-break-inside: avoid;
      }
      .preview-nav {
        text-align: center;
        margin: 10px 0;
      }
      .preview-nav button {
        padding: 5px 10px;
        margin: 0 5px;
        cursor: pointer;
      }
      .preview-nav button:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }
      .page-break {
        position: relative;
      }
      .page-break::before {
        content: "Page Break";
        display: block;
        background: #ffeb3b;
        color: #000;
        padding: 5px;
        margin: 10px 0;
        border: 1px dashed #f00;
        text-align: center;
        font-weight: bold;
      }
      .content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre {
        cursor: pointer;
      }
      .content p:hover, .content h1:hover, .content h2:hover, .content h3:hover, .content h4:hover, .content h5:hover, .content h6:hover, .content ul:hover, .content ol:hover, .content blockquote:hover, .content pre:hover {
        background: #f0f0f0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
          display: block;
        }
        .main-container {
          display: block;
        }
        .content {
          max-width: 100%;
          padding: 1cm;
          overflow: visible;
        }
        .preview-container {
          display: none;
        }
        @page {
          size: A4;
          margin: 2cm;
        }
        h1, h2, h3, h4, h5, h6 {
          page-break-before: auto;
          page-break-after: avoid;
          page-break-inside: avoid;
        }
        p, ul, ol, blockquote, pre {
          page-break-inside: avoid;
        }
        img {
          max-width: 100%;
          height: auto;
          page-break-inside: avoid;
        }
        table {
          page-break-inside: avoid;
        }
        tr, td, th {
          page-break-inside: avoid;
        }
        .page-break {
          page-break-before: always;
        }
        .page-break::before {
          display: none;
        }
        .no-print {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="main-container">
      <div class="content">
        ${htmlContent}
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        const elements = document.querySelectorAll('.content p, .content h1, .content h2, .content h3, .content h4, .content h5, .content h6, .content ul, .content ol, .content blockquote, .content pre');
        const previewPagesContainer = document.querySelector('.preview-pages');
        const prevButton = document.querySelector('#prev-page');
        const nextButton = document.querySelector('#next-page');
        let currentPageIndex = 0;
        let pages = [];
  
        function updatePreview() {
          previewPagesContainer.innerHTML = '';
          pages = [];
  
          let currentPage = document.createElement('div');
          currentPage.classList.add('preview-page');
          if (currentPageIndex === 0) currentPage.classList.add('active');
          previewPagesContainer.appendChild(currentPage);
          pages.push(currentPage);
  
          const pageHeight = (210 - 28) * (96 / 25.4); // Approx 682px
          let currentHeight = 0;
  
          const contentElements = document.querySelectorAll('.content > *');
          contentElements.forEach(element => {
            if (!element.classList.contains('no-print')) {
              const clone = element.cloneNode(true);
              if (clone.classList.contains('page-break')) {
                clone.classList.remove('page-break');
              }
  
              if (element.classList.contains('page-break') && currentPage.childElementCount > 0) {
                currentPage = document.createElement('div');
                currentPage.classList.add('preview-page');
                if (currentPageIndex === pages.length) currentPage.classList.add('active');
                previewPagesContainer.appendChild(currentPage);
                pages.push(currentPage);
                currentHeight = 0;
              }
  
              currentPage.appendChild(clone);
              const elementHeight = clone.offsetHeight;
  
              if (currentHeight + elementHeight > pageHeight && currentPage.childElementCount > 0 && !element.classList.contains('page-break')) {
                clone.remove(); // Remove from current page
                currentPage = document.createElement('div');
                currentPage.classList.add('preview-page');
                if (currentPageIndex === pages.length) currentPage.classList.add('active');
                previewPagesContainer.appendChild(currentPage);
                pages.push(currentPage);
                currentHeight = 0;
                currentPage.appendChild(clone.cloneNode(true));
                currentHeight += elementHeight;
              } else {
                currentHeight += elementHeight;
              }
            }
          });
  
          prevButton.disabled = currentPageIndex === 0;
          nextButton.disabled = currentPageIndex === pages.length - 1;
        }
  
        prevButton.addEventListener('click', () => {
          if (currentPageIndex > 0) {
            pages[currentPageIndex].classList.remove('active');
            currentPageIndex--;
            pages[currentPageIndex].classList.add('active');
            prevButton.disabled = currentPageIndex === 0;
            nextButton.disabled = false;
          }
        });
  
        nextButton.addEventListener('click', () => {
          if (currentPageIndex < pages.length - 1) {
            pages[currentPageIndex].classList.remove('active');
            currentPageIndex++;
            pages[currentPageIndex].classList.add('active');
            nextButton.disabled = currentPageIndex === pages.length - 1;
            prevButton.disabled = false;
          }
        });
  
        updatePreview();
  
        elements.forEach(element => {
          element.addEventListener('click', () => {
            if (element.classList.contains('page-break')) {
              element.classList.remove('page-break');
            } else {
              element.classList.add('page-break');
            }
            pages[currentPageIndex].classList.remove('active');
            currentPageIndex = 0;
            updatePreview();
          });
        });
      });
    </script>
  </body>
  </html>
  `);
  printWindow.document.close(); // Close the document to ensure rendering
}
