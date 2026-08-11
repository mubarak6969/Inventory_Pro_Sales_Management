(function () {

    "use strict";

    const DRIVE_API_URL =
        "https://script.google.com/macros/s/AKfycbx6leQNqsYlXhI3uxW0vhYQcCNAacofS5umirXkoAK_Mvhh_fnySn0VwyzrspBM4pooYg/exec";


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

            console.error(error);

            alert("Unable to read the latest invoice.");

            return null;
        }
    }


    function buildPayload(invoice) {

        const items = invoice.items.map(function (item) {

            const quantity = Number(
                item.qty ??
                item.quantity ??
                0
            );

            const price = Number(
                item.price ?? 0
            );

            const lineTotal =
                quantity * price;

            return {

                id: item.id || "",

                name: item.name || "Product",

                sku: item.sku || "",

                barcode: item.barcode || "",

                qty: quantity,

                quantity: quantity,

                price: price,

                amount: lineTotal,

                lineTotal: lineTotal
            };
        });


        const subtotal = items.reduce(
            function (sum, item) {
                return sum + item.lineTotal;
            },
            0
        );


        const discount = Number(
            invoice.discount || 0
        );


        const tax = Number(
            invoice.tax ??
            subtotal * 0.05
        );


        const total =
            subtotal -
            discount +
            tax;


        return {

            application: "Inventory Pro",

            invoice:
                invoice.invoice || "",

            warehouse:
                invoice.warehouse ||
                "Main Warehouse",

            customer:
                invoice.customer ||
                "Walk-in Customer",

            phone:
                invoice.phone || "",

            payment:
                invoice.payment ||
                "Cash",

            items: items,

            subtotal:
                Number(subtotal.toFixed(2)),

            discount:
                Number(discount.toFixed(2)),

            tax:
                Number(tax.toFixed(2)),

            total:
                Number(total.toFixed(2)),

            createdAt:
                invoice.createdAt ||
                new Date().toISOString(),

            generatedAt:
                new Date().toISOString()
        };
    }


    function upload() {

        const invoice = getInvoice();

        if (!invoice) {
            return;
        }


        const payload =
            buildPayload(invoice);


        /*
         * SAVE LOCAL STATUS FIRST
         */

        localStorage.setItem(
            "drive_last_upload",
            JSON.stringify({

                invoice:
                    payload.invoice,

                customer:
                    payload.customer,

                subtotal:
                    payload.subtotal,

                tax:
                    payload.tax,

                total:
                    payload.total,

                uploadedAt:
                    payload.generatedAt,

                status:
                    "uploading"

            })
        );


        /*
         * IMMEDIATE USER RESPONSE
         */

        const notice =
            document.getElementById("notice");

        if (notice) {

            notice.textContent =
                "✓ Saving invoice to Google Drive...";

        }


        /*
         * DO NOT WAIT FOR GOOGLE.
         *
         * The request runs in the background.
         */

        fetch(
            DRIVE_API_URL,
            {

                method: "POST",

                mode: "no-cors",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(payload)

            }
        )
        .then(function () {

            localStorage.setItem(
                "drive_last_upload",
                JSON.stringify({

                    invoice:
                        payload.invoice,

                    customer:
                        payload.customer,

                    subtotal:
                        payload.subtotal,

                    tax:
                        payload.tax,

                    total:
                        payload.total,

                    uploadedAt:
                        payload.generatedAt,

                    status:
                        "submitted"

                })
            );


            if (notice) {

                notice.textContent =
                    "✓ Invoice saved to Google Drive.";

            }

        })
        .catch(function (error) {

            console.error(
                "Google Drive upload error:",
                error
            );


            localStorage.setItem(
                "drive_last_upload",
                JSON.stringify({

                    invoice:
                        payload.invoice,

                    customer:
                        payload.customer,

                    total:
                        payload.total,

                    uploadedAt:
                        payload.generatedAt,

                    status:
                        "failed"

                })
            );


            if (notice) {

                notice.textContent =
                    "⚠ Google Drive upload failed.";

            }

        });


        /*
         * INSTANT ALERT
         */

        alert(
            "✓ Invoice sent to Google Drive.\n\n" +
            "The upload is processing in the background."
        );


        return true;
    }


    window.InventoryDrive = {

        upload: upload

    };

})();