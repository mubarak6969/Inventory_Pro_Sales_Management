(function () {

  "use strict";

  function getInvoice() {

    try {

      const invoice = JSON.parse(
        localStorage.getItem("last_invoice") || "null"
      );

      if (
        !invoice ||
        !Array.isArray(invoice.items) ||
        !invoice.items.length
      ) {
        alert("Generate an invoice first.");
        return null;
      }

      return invoice;

    } catch (error) {

      console.error(
        "WhatsApp invoice error:",
        error
      );

      alert("Unable to read the latest invoice.");
      return null;

    }

  }


  function shareLastInvoice() {

    const invoice = getInvoice();

    if (!invoice) return;


    const items = invoice.items
      .map(function (item) {

        const price =
          Number(item.price || 0);

        const quantity =
          Number(item.qty || 0);

        const amount =
          price * quantity;

        return (
          item.name +
          " x " +
          quantity +
          " = ₹" +
          amount.toFixed(2)
        );

      })
      .join("\n");


    const subtotal =
      invoice.items.reduce(
        function (sum, item) {

          return (
            sum +
            Number(item.price || 0) *
            Number(item.qty || 0)
          );

        },
        0
      );


    const tax =
      Number(invoice.tax || 0);


    const discount =
      Number(invoice.discount || 0);


    const total =
      subtotal +
      tax -
      discount;


    const customer =
      invoice.customer ||
      "Walk-in Customer";


    const phone =
      invoice.phone ||
      "—";


    const payment =
      invoice.payment ||
      "Cash";


    const message = [

      "*INVENTORY PRO*",

      "*SALES INVOICE*",

      "Invoice: " +
        (invoice.invoice || "—"),

      "",

      "Customer: " +
        customer,

      "Phone: " +
        phone,

      "",

      "*ITEMS*",

      items,

      "",

      "Subtotal: ₹" +
        subtotal.toFixed(2),

      "Discount: ₹" +
        discount.toFixed(2),

      "Tax: ₹" +
        tax.toFixed(2),

      "*TOTAL: ₹" +
        total.toFixed(2) +
        "*",

      "",

      "Payment: " +
        payment,

      "",

      "Thank you for shopping with us."

    ].join("\n");


    const cleanPhone =
      String(phone)
        .replace(/\D/g, "");


    const whatsappURL =
      cleanPhone
        ? (
          "https://wa.me/" +
          cleanPhone +
          "?text=" +
          encodeURIComponent(message)
        )
        : (
          "https://wa.me/?text=" +
          encodeURIComponent(message)
        );


    window.open(
      whatsappURL,
      "_blank",
      "noopener,noreferrer"
    );

  }


  window.InventoryWhatsApp = {

    shareLastInvoice

  };


})();