(function () {

  /* =========================================================
     INVENTORY PRO — PROFESSIONAL INVOICE PDF
     ========================================================= */


  /* ---------------------------------------------------------
     SAFE HTML ESCAPING
  --------------------------------------------------------- */

  function escapeHtml(value) {

    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  }


  /* ---------------------------------------------------------
     CURRENCY FORMAT
  --------------------------------------------------------- */

  function formatCurrency(value) {

    return `₹${Number(value || 0).toFixed(2)}`;

  }


  /* ---------------------------------------------------------
     GET LAST INVOICE
  --------------------------------------------------------- */

  function getInvoice() {

    let invoice = null;

    try {

      invoice = JSON.parse(
        localStorage.getItem("last_invoice") || "null"
      );

    } catch (error) {

      console.error(
        "Invoice data error:",
        error
      );

      alert(
        "Unable to read invoice data."
      );

      return null;

    }


    if (
      !invoice ||
      !Array.isArray(invoice.items) ||
      !invoice.items.length
    ) {

      alert(
        "Generate an invoice first."
      );

      return null;

    }


    return invoice;

  }


  /* ---------------------------------------------------------
     CALCULATE INVOICE TOTALS
  --------------------------------------------------------- */

  function calculateTotals(invoice) {

    const subtotal =
      invoice.items.reduce(
        (sum, item) => {

          const price =
            Number(item.price || 0);

          const qty =
            Number(item.qty || 0);

          return sum + (price * qty);

        },
        0
      );


    /*
      Existing project tax rule:
      5%
    */

    const taxRate = 0.05;

    const tax =
      subtotal * taxRate;


    const total =
      subtotal + tax;


    return {
      subtotal,
      tax,
      total,
      taxRate
    };

  }


  /* ---------------------------------------------------------
     FORMAT DATE
  --------------------------------------------------------- */

  function formatDate(dateValue) {

    const date =
      new Date(dateValue);


    if (isNaN(date.getTime())) {

      return new Date()
        .toLocaleDateString(
          "en-IN",
          {
            day: "2-digit",
            month: "short",
            year: "numeric"
          }
        );

    }


    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  }


  /* ---------------------------------------------------------
     FORMAT TIME
  --------------------------------------------------------- */

  function formatTime(dateValue) {

    const date =
      new Date(dateValue);


    if (isNaN(date.getTime())) {

      return "";

    }


    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  }


  /* ---------------------------------------------------------
     CREATE PRODUCT ROWS
  --------------------------------------------------------- */

  function createInvoiceItems(invoice) {

    return invoice.items
      .map(
        (item, index) => {

          const name =
            item.name ||
            "Product";


          const qty =
            Number(item.qty || 0);


          const price =
            Number(item.price || 0);


          const lineTotal =
            qty * price;


          return `

            <tr>

              <td class="item-number">
                ${index + 1}
              </td>


              <td class="product-cell">

                <strong>
                  ${escapeHtml(name)}
                </strong>

              </td>


              <td class="qty-cell">
                ${qty}
              </td>


              <td class="price-cell">
                ${formatCurrency(price)}
              </td>


              <td class="amount-cell">
                ${formatCurrency(lineTotal)}
              </td>

            </tr>

          `;

        }
      )
      .join("");

  }


  /* ---------------------------------------------------------
     CREATE RECEIPT / INVOICE HTML
  --------------------------------------------------------- */

  function createReceiptHTML(invoice) {

    const {
      subtotal,
      tax,
      total,
      taxRate
    } = calculateTotals(invoice);


    const items =
      createInvoiceItems(invoice);


    const invoiceNumber =
      invoice.invoice ||
      "INV-" +
      Date.now();


    const createdAt =
      invoice.createdAt ||
      new Date().toISOString();


    const invoiceDate =
      formatDate(createdAt);


    const invoiceTime =
      formatTime(createdAt);


    const customer =
      invoice.customer ||
      "Walk-in Customer";


    const phone =
      invoice.phone ||
      "—";


    const payment =
      invoice.payment ||
      "Cash";


    return `

      <div class="invoice-page">


        <!-- =========================================
             HEADER
        ========================================== -->

        <header class="invoice-header">


          <div class="brand-block">

            <div class="brand-mark">
              I
            </div>


            <div>

              <div class="brand-name">
                INVENTORY PRO
              </div>

              <div class="brand-subtitle">
                Inventory & Sales Management
              </div>

            </div>

          </div>


          <div class="invoice-title-block">

            <div class="invoice-title">
              SALES INVOICE
            </div>

            <div class="invoice-number">
              ${escapeHtml(
                invoiceNumber
              )}
            </div>

          </div>


        </header>



        <!-- =========================================
             INVOICE META
        ========================================== -->

        <section class="meta-section">


          <div class="meta-card">

            <div class="meta-label">
              BILL TO
            </div>

            <div class="customer-name">
              ${escapeHtml(customer)}
            </div>

            <div class="customer-phone">
              Phone: ${escapeHtml(phone)}
            </div>

          </div>



          <div class="meta-card right">

            <div class="meta-row">

              <span>
                Invoice Date
              </span>

              <strong>
                ${escapeHtml(invoiceDate)}
              </strong>

            </div>


            <div class="meta-row">

              <span>
                Time
              </span>

              <strong>
                ${escapeHtml(invoiceTime || "—")}
              </strong>

            </div>


            <div class="meta-row">

              <span>
                Payment Method
              </span>

              <strong class="payment-value">
                ${escapeHtml(payment)}
              </strong>

            </div>

          </div>


        </section>



        <!-- =========================================
             ITEMS TABLE
        ========================================== -->

        <section class="items-section">

          <table class="invoice-table">

            <thead>

              <tr>

                <th class="number-header">
                  #
                </th>

                <th>
                  PRODUCT
                </th>

                <th class="qty-header">
                  QTY
                </th>

                <th class="price-header">
                  UNIT PRICE
                </th>

                <th class="amount-header">
                  AMOUNT
                </th>

              </tr>

            </thead>


            <tbody>

              ${items}

            </tbody>

          </table>

        </section>



        <!-- =========================================
             TOTALS
        ========================================== -->

        <section class="summary-section">


          <div class="summary-box">


            <div class="summary-row">

              <span>
                Subtotal
              </span>

              <strong>
                ${formatCurrency(subtotal)}
              </strong>

            </div>


            <div class="summary-row">

              <span>
                Tax (${taxRate * 100}%)
              </span>

              <strong>
                ${formatCurrency(tax)}
              </strong>

            </div>


            <div class="summary-divider">
            </div>


            <div class="grand-total">

              <span>
                TOTAL
              </span>

              <strong>
                ${formatCurrency(total)}
              </strong>

            </div>


            <div class="paid-row">

              <span>
                Payment
              </span>

              <strong>
                ${escapeHtml(payment)}
              </strong>

            </div>


          </div>

        </section>



        <!-- =========================================
             THANK YOU
        ========================================== -->

        <section class="thank-you">

          <div class="thank-line">
          </div>


          <div class="thank-title">
            Thank you for your business.
          </div>


          <div class="thank-subtitle">
            We appreciate your purchase.
          </div>

        </section>



        <!-- =========================================
             FOOTER
        ========================================== -->

        <footer class="invoice-footer">

          <span>
            INVENTORY PRO
          </span>

          <span>
            Computer-generated invoice
          </span>

          <span>
            ${escapeHtml(invoiceNumber)}
          </span>

        </footer>


      </div>

    `;

  }


  /* =========================================================
     DOWNLOAD / PRINT PDF
  ========================================================= */

  function downloadPDF() {

    const invoice =
      getInvoice();


    if (!invoice) {

      return;

    }


    const receipt =
      createReceiptHTML(
        invoice
      );


    const popup =
      window.open(
        "",
        "_blank",
        "width=1000,height=900"
      );


    if (!popup) {

      alert(
        "Please allow pop-ups to generate the PDF."
      );

      return;

    }


    popup.document.write(`

      <!DOCTYPE html>

      <html>

      <head>

        <meta charset="UTF-8">

        <meta
          name="viewport"
          content="width=device-width,initial-scale=1"
        >

        <title>
          ${escapeHtml(
            invoice.invoice ||
            "Invoice"
          )}
        </title>


        <style>

          /* =========================================
             PAGE
          ========================================== */

          @page{

            size:A4;

            margin:0;

          }


          *{

            box-sizing:border-box;

          }


          html,
          body{

            margin:0;

            padding:0;

            background:#e9ebf0;

            color:#171923;

            font-family:
              Inter,
              -apple-system,
              BlinkMacSystemFont,
              "Segoe UI",
              Arial,
              sans-serif;

            -webkit-print-color-adjust:exact;

            print-color-adjust:exact;

          }


          body{

            padding:40px 20px 100px;

          }


          /* =========================================
             INVOICE PAGE
          ========================================== */

          .invoice-page{

            width:794px;

            min-height:1123px;

            margin:0 auto;

            padding:48px 52px 38px;

            background:#ffffff;

            position:relative;

            box-shadow:
              0 25px 70px rgba(0,0,0,.15);

            display:flex;

            flex-direction:column;

          }


          /* =========================================
             HEADER
          ========================================== */

          .invoice-header{

            display:flex;

            justify-content:space-between;

            align-items:flex-start;

            padding-bottom:28px;

            border-bottom:2px solid #181a22;

          }


          .brand-block{

            display:flex;

            align-items:center;

            gap:13px;

          }


          .brand-mark{

            width:42px;

            height:42px;

            border-radius:11px;

            display:grid;

            place-items:center;

            background:
              linear-gradient(
                135deg,
                #8468ff,
                #5139cf
              );

            color:#ffffff;

            font-size:20px;

            font-weight:800;

          }


          .brand-name{

            font-size:21px;

            font-weight:800;

            letter-spacing:-.5px;

            color:#171923;

          }


          .brand-subtitle{

            margin-top:4px;

            color:#707581;

            font-size:10px;

          }


          .invoice-title-block{

            text-align:right;

          }


          .invoice-title{

            font-size:18px;

            font-weight:800;

            letter-spacing:.7px;

            color:#171923;

          }


          .invoice-number{

            margin-top:7px;

            color:#666c78;

            font-size:11px;

            font-weight:600;

          }


          /* =========================================
             META
          ========================================== */

          .meta-section{

            display:grid;

            grid-template-columns:1fr 1fr;

            gap:40px;

            padding:28px 0;

            border-bottom:1px solid #dfe1e6;

          }


          .meta-card{

            min-height:82px;

          }


          .meta-card.right{

            padding-left:30px;

            border-left:1px solid #e2e4e8;

          }


          .meta-label{

            font-size:9px;

            font-weight:800;

            letter-spacing:1px;

            color:#737985;

            margin-bottom:10px;

          }


          .customer-name{

            font-size:14px;

            font-weight:700;

            color:#171923;

          }


          .customer-phone{

            margin-top:6px;

            font-size:11px;

            color:#69707c;

          }


          .meta-row{

            display:flex;

            justify-content:space-between;

            align-items:center;

            gap:20px;

            margin-bottom:9px;

            font-size:10px;

            color:#727782;

          }


          .meta-row:last-child{

            margin-bottom:0;

          }


          .meta-row strong{

            color:#252832;

            font-size:10px;

            text-align:right;

          }


          .payment-value{

            text-transform:capitalize;

          }


          /* =========================================
             TABLE
          ========================================== */

          .items-section{

            padding-top:27px;

          }


          .invoice-table{

            width:100%;

            border-collapse:collapse;

            table-layout:fixed;

          }


          .invoice-table thead{

            background:#f2f3f6;

          }


          .invoice-table th{

            padding:11px 10px;

            color:#5d6370;

            font-size:9px;

            font-weight:800;

            letter-spacing:.5px;

            text-align:left;

            border-bottom:1px solid #d9dce2;

          }


          .invoice-table td{

            padding:14px 10px;

            font-size:11px;

            color:#292d36;

            border-bottom:1px solid #e8e9ed;

            vertical-align:middle;

            word-wrap:break-word;

          }


          .invoice-table tbody tr:last-child td{

            border-bottom:1px solid #d9dce2;

          }


          .number-header,
          .item-number{

            width:38px;

            text-align:center !important;

            color:#8a909b !important;

          }


          .qty-header,
          .qty-cell{

            width:60px;

            text-align:center !important;

          }


          .price-header,
          .price-cell{

            width:110px;

            text-align:right !important;

          }


          .amount-header,
          .amount-cell{

            width:125px;

            text-align:right !important;

          }


          .product-cell strong{

            font-size:11px;

            font-weight:650;

            color:#20232b;

          }


          .price-cell,
          .amount-cell{

            white-space:nowrap;

            font-variant-numeric:
              tabular-nums;

          }


          .amount-cell{

            font-weight:700;

          }


          /* =========================================
             SUMMARY
          ========================================== */

          .summary-section{

            display:flex;

            justify-content:flex-end;

            padding-top:25px;

          }


          .summary-box{

            width:280px;

          }


          .summary-row{

            display:flex;

            justify-content:space-between;

            align-items:center;

            margin-bottom:10px;

            font-size:11px;

            color:#6b717d;

          }


          .summary-row strong{

            color:#272b34;

            font-weight:650;

          }


          .summary-divider{

            height:1px;

            background:#d8dbe1;

            margin:14px 0;

          }


          .grand-total{

            display:flex;

            justify-content:space-between;

            align-items:center;

            padding:4px 0 12px;

            color:#171923;

          }


          .grand-total span{

            font-size:13px;

            font-weight:800;

            letter-spacing:.4px;

          }


          .grand-total strong{

            font-size:21px;

            font-weight:850;

            letter-spacing:-.4px;

          }


          .paid-row{

            display:flex;

            justify-content:space-between;

            align-items:center;

            padding-top:10px;

            border-top:1px solid #e2e4e8;

            color:#747a85;

            font-size:10px;

          }


          .paid-row strong{

            color:#343842;

            font-weight:650;

          }


          /* =========================================
             FOOTER / THANK YOU
          ========================================== */

          .thank-you{

            margin-top:auto;

            padding-top:55px;

          }


          .thank-line{

            height:1px;

            background:
              repeating-linear-gradient(
                90deg,
                #c9ccd2 0,
                #c9ccd2 4px,
                transparent 4px,
                transparent 8px
              );

            margin-bottom:18px;

          }


          .thank-title{

            text-align:center;

            font-size:12px;

            font-weight:700;

            color:#343842;

          }


          .thank-subtitle{

            text-align:center;

            margin-top:5px;

            font-size:10px;

            color:#858b96;

          }


          .invoice-footer{

            display:flex;

            justify-content:space-between;

            align-items:center;

            margin-top:22px;

            padding-top:13px;

            border-top:1px solid #e2e4e8;

            color:#9a9fa8;

            font-size:8px;

          }


          .invoice-footer span:first-child{

            font-weight:700;

            color:#777d88;

            letter-spacing:.4px;

          }


          /* =========================================
             PRINT BUTTON
          ========================================== */

          .print-controls{

            position:fixed;

            left:0;

            right:0;

            bottom:0;

            padding:15px;

            display:flex;

            justify-content:center;

            gap:10px;

            background:
              rgba(20,22,28,.94);

            backdrop-filter:blur(18px);

            box-shadow:
              0 -10px 35px rgba(0,0,0,.18);

            z-index:100;

          }


          .print-button{

            border:0;

            border-radius:10px;

            padding:12px 24px;

            background:
              linear-gradient(
                135deg,
                #7659f4,
                #5439d3
              );

            color:#ffffff;

            font-size:12px;

            font-weight:700;

            cursor:pointer;

            box-shadow:
              0 8px 22px rgba(83,57,211,.30);

          }


          .print-button:hover{

            filter:brightness(1.08);

          }


          .close-button{

            border:1px solid rgba(255,255,255,.16);

            border-radius:10px;

            padding:12px 20px;

            background:
              rgba(255,255,255,.08);

            color:#ffffff;

            font-size:12px;

            font-weight:600;

            cursor:pointer;

          }


          .close-button:hover{

            background:
              rgba(255,255,255,.13);

          }


          /* =========================================
             PRINT
          ========================================== */

          @media print{

            html,
            body{

              background:#ffffff;

            }


            body{

              padding:0;

            }


            .invoice-page{

              width:794px;

              min-height:1123px;

              margin:0;

              padding:48px 52px 38px;

              box-shadow:none;

            }


            .print-controls{

              display:none !important;

            }


            .invoice-table{

              page-break-inside:auto;

            }


            .invoice-table tr{

              page-break-inside:avoid;

              page-break-after:auto;

            }


            .items-section{

              page-break-inside:auto;

            }


            .summary-section{

              page-break-inside:avoid;

            }


            .thank-you{

              page-break-inside:avoid;

            }

          }


          /* =========================================
             SMALL SCREEN PREVIEW
          ========================================== */

          @media(max-width:850px){

            body{

              padding:20px 10px 90px;

            }


            .invoice-page{

              width:100%;

              min-height:auto;

              padding:30px 25px;

            }

          }


          @media(max-width:600px){

            .invoice-header{

              flex-direction:column;

              gap:20px;

            }


            .invoice-title-block{

              text-align:left;

            }


            .meta-section{

              grid-template-columns:1fr;

              gap:20px;

            }


            .meta-card.right{

              padding-left:0;

              padding-top:20px;

              border-left:0;

              border-top:1px solid #e2e4e8;

            }


            .invoice-table{

              min-width:650px;

            }


            .items-section{

              overflow-x:auto;

            }


            .summary-section{

              justify-content:stretch;

            }


            .summary-box{

              width:100%;

            }

          }

        </style>

      </head>


      <body>


        ${receipt}


        <div class="print-controls">

          <button
            class="print-button"
            onclick="window.print()"
          >
            Save / Print PDF
          </button>


          <button
            class="close-button"
            onclick="window.close()"
          >
            Close
          </button>

        </div>


      </body>

      </html>

    `);


    popup.document.close();


    popup.focus();

  }



  /* =========================================================
     PUBLIC API
  ========================================================== */

  window.InventoryPDF = {

    generate: downloadPDF,

    createReceiptHTML

  };


})();