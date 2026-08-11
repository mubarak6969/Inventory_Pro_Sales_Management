/* =========================================================
   INVENTORY PRO — EXCEL REPORT
   REAL .XLSX GENERATOR
   30-DAY CREDIT / DEBIT LEDGER
========================================================= */

(function () {

    "use strict";

    const MOVEMENT_KEY = "inventory_movements";
    const INVENTORY_KEY = "inventory_data";
    const REPORT_DAYS = 30;


    /* =====================================================
       STORAGE
    ===================================================== */

    function readArray(key) {
        try {
            const data = JSON.parse(localStorage.getItem(key) || "[]");
            return Array.isArray(data) ? data : [];
        } catch (error) {
            console.error("Inventory Pro:", error);
            return [];
        }
    }


    /* =====================================================
       HELPERS
    ===================================================== */

    function num(value) {
        const n = Number(value);
        return Number.isFinite(n) ? n : 0;
    }


    function safeDate(value) {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }


    function dateText(value) {
        const d = value instanceof Date ? value : safeDate(value);

        if (!d) return "";

        return d.toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        });
    }


    function timeText(value) {
        const d = value instanceof Date ? value : safeDate(value);

        if (!d) return "";

        return d.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }


    function xml(value) {
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;");
    }


    function extractInvoice(source) {
        const match = String(source || "").match(/INV-[A-Za-z0-9-]+/i);
        return match ? match[0] : "";
    }


    /* =====================================================
       DATE RANGE
    ===================================================== */

    function getDateRange() {

        const now = new Date();

        const from = new Date(now);

        from.setHours(0, 0, 0, 0);

        from.setDate(
            from.getDate() - REPORT_DAYS + 1
        );

        return {
            from,
            now
        };
    }


    /* =====================================================
       PRICE LOOKUP
    ===================================================== */

    function buildPriceLookup(inventory) {

        const map = new Map();

        inventory.forEach(product => {

            const price = num(product.price);

            [
                product.id,
                product.sku,
                product.barcode,
                product.name
            ]
                .filter(v => v !== undefined && v !== null && v !== "")
                .forEach(v => map.set(String(v), price));

        });

        return map;
    }


    /* =====================================================
       MOVEMENT DATA
    ===================================================== */

    function getRows() {

        const movements = readArray(MOVEMENT_KEY);
        const inventory = readArray(INVENTORY_KEY);

        const { from, now } = getDateRange();

        const prices = buildPriceLookup(inventory);

        return movements
            .map((movement, index) => {

                const date = safeDate(
                    movement.time ||
                    movement.createdAt ||
                    movement.date
                );

                if (!date) return null;

                if (date < from || date > now) {
                    return null;
                }

                const rawType = String(
                    movement.type || ""
                ).trim().toLowerCase();

                const isCredit =
                    rawType === "in" ||
                    rawType === "credit" ||
                    rawType === "stock-in" ||
                    rawType === "stock in" ||
                    rawType === "incoming";

                const type = isCredit
                    ? "CREDIT"
                    : "DEBIT";

                const quantity = num(
                    movement.qty ??
                    movement.quantity
                );

                const lookupKeys = [
                    movement.id,
                    movement.sku,
                    movement.barcode,
                    movement.name
                ];

                let unitPrice = num(
                    movement.unitPrice ??
                    movement.price ??
                    movement.amountPerUnit
                );

                if (!unitPrice) {

                    for (const key of lookupKeys) {

                        if (
                            key !== undefined &&
                            key !== null &&
                            key !== ""
                        ) {

                            const found =
                                prices.get(String(key));

                            if (found !== undefined) {
                                unitPrice = num(found);
                                break;
                            }

                        }

                    }

                }

                const explicitAmount = num(
                    movement.amount ??
                    movement.value ??
                    movement.total
                );

                const amount =
                    explicitAmount ||
                    (unitPrice * quantity);

                return {

                    sequence: index,

                    date,

                    dateText: dateText(date),

                    timeText: timeText(date),

                    type,

                    name:
                        movement.name ||
                        "Unknown Product",

                    sku:
                        movement.sku ||
                        "",

                    barcode:
                        movement.barcode ||
                        "",

                    quantity,

                    unitPrice,

                    amount,

                    warehouse:
                        movement.godown ||
                        movement.warehouse ||
                        "Main Warehouse",

                    source:
                        movement.source ||
                        "Inventory",

                    invoice:
                        movement.invoice ||
                        extractInvoice(movement.source),

                    batch:
                        movement.batch ||
                        ""

                };

            })
            .filter(Boolean)
            .sort((a, b) => {

                return (
                    b.date - a.date
                ) || (
                    b.sequence - a.sequence
                );

            });

    }


    /* =====================================================
       CRC32
    ===================================================== */

    const CRC_TABLE = (() => {

        const table = new Uint32Array(256);

        for (let n = 0; n < 256; n++) {

            let c = n;

            for (let k = 0; k < 8; k++) {

                c =
                    (c & 1)
                        ? 0xEDB88320 ^ (c >>> 1)
                        : c >>> 1;

            }

            table[n] = c >>> 0;

        }

        return table;

    })();


    function crc32(data) {

        let crc = 0xFFFFFFFF;

        for (let i = 0; i < data.length; i++) {

            crc =
                CRC_TABLE[
                    (crc ^ data[i]) & 0xFF
                ] ^
                (crc >>> 8);

        }

        return (crc ^ 0xFFFFFFFF) >>> 0;

    }


    /* =====================================================
       UTF-8
    ===================================================== */

    function utf8(text) {
        return new TextEncoder().encode(String(text));
    }


    /* =====================================================
       UINT HELPERS
    ===================================================== */

    function u16(n) {

        return new Uint8Array([
            n & 255,
            (n >>> 8) & 255
        ]);

    }


    function u32(n) {

        return new Uint8Array([
            n & 255,
            (n >>> 8) & 255,
            (n >>> 16) & 255,
            (n >>> 24) & 255
        ]);

    }


    function concatBytes(...arrays) {

        const total =
            arrays.reduce(
                (sum, arr) => sum + arr.length,
                0
            );

        const result =
            new Uint8Array(total);

        let offset = 0;

        arrays.forEach(arr => {

            result.set(arr, offset);

            offset += arr.length;

        });

        return result;

    }


    /* =====================================================
       ZIP STORE
    ===================================================== */

    function zip(files) {

        const localParts = [];
        const centralParts = [];

        let offset = 0;

        files.forEach(file => {

            const name = utf8(file.name);
            const data = utf8(file.content);

            const crc = crc32(data);

            const localHeader =
                concatBytes(

                    new Uint8Array([
                        0x50, 0x4B,
                        0x03, 0x04
                    ]),

                    u16(20),
                    u16(0),
                    u16(0),
                    u16(0),
                    u16(0),

                    u32(crc),
                    u32(data.length),
                    u32(data.length),

                    u16(name.length),
                    u16(0),

                    name,
                    data

                );

            localParts.push(localHeader);


            const centralHeader =
                concatBytes(

                    new Uint8Array([
                        0x50, 0x4B,
                        0x01, 0x02
                    ]),

                    u16(20),
                    u16(20),

                    u16(0),
                    u16(0),
                    u16(0),
                    u16(0),

                    u32(crc),
                    u32(data.length),
                    u32(data.length),

                    u16(name.length),
                    u16(0),
                    u16(0),
                    u16(0),
                    u16(0),

                    u32(0),
                    u32(offset),

                    name

                );

            centralParts.push(centralHeader);

            offset += localHeader.length;

        });


        const localData =
            concatBytes(...localParts);

        const centralData =
            concatBytes(...centralParts);

        const end =
            concatBytes(

                new Uint8Array([
                    0x50, 0x4B,
                    0x05, 0x06
                ]),

                u16(0),
                u16(0),

                u16(files.length),
                u16(files.length),

                u32(centralData.length),
                u32(localData.length),

                u16(0)

            );


        return concatBytes(
            localData,
            centralData,
            end
        );

    }


    /* =====================================================
       XLSX XML
    ===================================================== */

    function contentTypes() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">

<Default Extension="rels"
 ContentType="application/vnd.openxmlformats-package.relationships+xml"/>

<Default Extension="xml"
 ContentType="application/xml"/>

<Override PartName="/xl/workbook.xml"
 ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>

<Override PartName="/xl/worksheets/sheet1.xml"
 ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>

<Override PartName="/xl/worksheets/sheet2.xml"
 ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>

<Override PartName="/xl/styles.xml"
 ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>

<Override PartName="/docProps/core.xml"
 ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>

<Override PartName="/docProps/app.xml"
 ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>

</Types>`;

    }


    function rootRels() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">

<Relationship
 Id="rId1"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
 Target="xl/workbook.xml"/>

<Relationship
 Id="rId2"
 Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties"
 Target="docProps/core.xml"/>

<Relationship
 Id="rId3"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties"
 Target="docProps/app.xml"/>

</Relationships>`;

    }


    function workbookRels() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">

<Relationship
 Id="rId1"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
 Target="worksheets/sheet1.xml"/>

<Relationship
 Id="rId2"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet"
 Target="worksheets/sheet2.xml"/>

<Relationship
 Id="rId3"
 Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
 Target="styles.xml"/>

</Relationships>`;

    }


    function workbook() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook
 xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
 xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">

<sheets>

<sheet
 name="Summary"
 sheetId="1"
 r:id="rId1"/>

<sheet
 name="Credit Debit Ledger"
 sheetId="2"
 r:id="rId2"/>

</sheets>

</workbook>`;

    }


    function styles() {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet
 xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">

<numFmts count="1">

<numFmt
 numFmtId="164"
 formatCode="#,##0.00"/>

</numFmts>

<fonts count="2">

<font>
<sz val="11"/>
<name val="Calibri"/>
</font>

<font>
<b/>
<sz val="11"/>
<name val="Calibri"/>
</font>

</fonts>

<fills count="3">

<fill>
<patternFill patternType="none"/>
</fill>

<fill>
<patternFill patternType="gray125"/>
</fill>

<fill>
<patternFill patternType="solid">
<fgColor rgb="E9E5FF"/>
<bgColor indexed="64"/>
</patternFill>
</fill>

</fills>

<borders count="1">

<border>
<left/>
<right/>
<top/>
<bottom/>
<diagonal/>
</border>

</borders>

<cellStyleXfs count="1">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
</cellStyleXfs>

<cellXfs count="3">

<xf
 numFmtId="0"
 fontId="0"
 fillId="0"
 borderId="0"
 xfId="0"/>

<xf
 numFmtId="0"
 fontId="1"
 fillId="2"
 borderId="0"
 xfId="0"/>

<xf
 numFmtId="164"
 fontId="0"
 fillId="0"
 borderId="0"
 xfId="0"/>

</cellXfs>

</styleSheet>`;

    }


    function cell(value, style = 0) {

        if (typeof value === "number") {

            return `
<c t="n" s="${style}">
<v>${value}</v>
</c>`;

        }

        return `
<c t="inlineStr" s="${style}">
<is>
<t>${xml(value)}</t>
</is>
</c>`;

    }


    function row(cells) {

        return `<row>${cells.join("")}</row>`;

    }


    function worksheet(rows) {

        return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet
 xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">

<sheetData>

${rows.join("\n")}

</sheetData>

</worksheet>`;

    }


    /* =====================================================
       SUMMARY
    ===================================================== */

    function createSummary(rows) {

        const credits =
            rows.filter(
                x => x.type === "CREDIT"
            );

        const debits =
            rows.filter(
                x => x.type === "DEBIT"
            );


        const creditQty =
            credits.reduce(
                (sum, x) =>
                    sum + x.quantity,
                0
            );

        const debitQty =
            debits.reduce(
                (sum, x) =>
                    sum + x.quantity,
                0
            );

        const creditValue =
            credits.reduce(
                (sum, x) =>
                    sum + x.amount,
                0
            );

        const debitValue =
            debits.reduce(
                (sum, x) =>
                    sum + x.amount,
                0
            );


        const { from, now } =
            getDateRange();


        return worksheet([

            row([
                cell("INVENTORY PRO — ONE MONTH REPORT", 1)
            ]),

            row([
                cell("Period", 1),
                cell(
                    `${dateText(from)} to ${dateText(now)}`
                )
            ]),

            row([
                cell("Generated", 1),
                cell(
                    `${dateText(now)} ${timeText(now)}`
                )
            ]),

            row([]),

            row([
                cell("Metric", 1),
                cell("Quantity", 1),
                cell("Value", 1)
            ]),

            row([
                cell("Credit / Stock In"),
                cell(creditQty),
                cell(creditValue, 2)
            ]),

            row([
                cell("Debit / Stock Out"),
                cell(debitQty),
                cell(debitValue, 2)
            ]),

            row([
                cell("Net Stock Movement"),
                cell(creditQty - debitQty),
                cell(creditValue - debitValue, 2)
            ]),

            row([
                cell("Total Transactions"),
                cell(rows.length)
            ])

        ]);

    }


    /* =====================================================
       LEDGER
    ===================================================== */

    function createLedger(rows) {

        const output = [

            row([
                cell("#", 1),
                cell("DATE", 1),
                cell("TIME", 1),
                cell("TYPE", 1),
                cell("PRODUCT", 1),
                cell("SKU", 1),
                cell("BARCODE", 1),
                cell("QUANTITY", 1),
                cell("UNIT PRICE", 1),
                cell("VALUE", 1),
                cell("WAREHOUSE", 1),
                cell("SOURCE", 1),
                cell("INVOICE", 1),
                cell("BATCH", 1)
            ])

        ];


        rows.forEach((item, index) => {

            output.push(

                row([

                    cell(index + 1),

                    cell(item.dateText),

                    cell(item.timeText),

                    cell(item.type),

                    cell(item.name),

                    cell(item.sku),

                    cell(item.barcode),

                    cell(item.quantity),

                    cell(item.unitPrice, 2),

                    cell(item.amount, 2),

                    cell(item.warehouse),

                    cell(item.source),

                    cell(item.invoice),

                    cell(item.batch)

                ])

            );

        });


        if (!rows.length) {

            output.push(

                row([
                    cell(
                        "No credit/debit movements found in the last 30 days."
                    )
                ])

            );

        }


        return worksheet(output);

    }


    /* =====================================================
       XLSX FILE
    ===================================================== */

    function createXlsx() {

        const rows = getRows();

        const now = new Date();

        const files = [

            {
                name: "[Content_Types].xml",
                content: contentTypes()
            },

            {
                name: "_rels/.rels",
                content: rootRels()
            },

            {
                name: "xl/workbook.xml",
                content: workbook()
            },

            {
                name: "xl/_rels/workbook.xml.rels",
                content: workbookRels()
            },

            {
                name: "xl/styles.xml",
                content: styles()
            },

            {
                name: "xl/worksheets/sheet1.xml",
                content: createSummary(rows)
            },

            {
                name: "xl/worksheets/sheet2.xml",
                content: createLedger(rows)
            },

            {
                name: "docProps/core.xml",

                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>

<cp:coreProperties
 xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
 xmlns:dc="http://purl.org/dc/elements/1.1/"
 xmlns:dcterms="http://purl.org/dc/terms/"
 xmlns:dcmitype="http://purl.org/dc/dcmitype/"
 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">

<dc:creator>Inventory Pro</dc:creator>

<dc:title>Inventory Pro Credit Debit Report</dc:title>

<dcterms:created xsi:type="dcterms:W3CDTF">
${now.toISOString()}
</dcterms:created>

</cp:coreProperties>`

            },

            {
                name: "docProps/app.xml",

                content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>

<Properties
 xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties">

<Application>Inventory Pro</Application>

</Properties>`

            }

        ];


        return zip(files);

    }


    /* =====================================================
       DOWNLOAD
    ===================================================== */

    function downloadExcel() {

        const data = getRows();

        if (!data.length) {

            const proceed = confirm(
                "No credit/debit movements were found in the last 30 days.\n\nDownload the empty report?"
            );

            if (!proceed) return;

        }


        const bytes = createXlsx();


        const blob = new Blob(
            [bytes],
            {
                type:
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            }
        );


        const url =
            URL.createObjectURL(blob);


        const link =
            document.createElement("a");


        const stamp =
            new Date()
                .toISOString()
                .slice(0, 10);


        link.href = url;

        link.download =
            `Inventory-Pro-Credit-Debit-${stamp}.xlsx`;


        document.body.appendChild(link);

        link.click();

        link.remove();


        setTimeout(() => {

            URL.revokeObjectURL(url);

        }, 1500);

    }


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.InventoryExcel = {

        download: downloadExcel,

        getRows: getRows,

        createXlsx: createXlsx

    };


    /* =====================================================
       BUTTON
    ===================================================== */

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const button =
                document.getElementById(
                    "downloadExcel"
                );

            if (button) {

                button.onclick =
                    downloadExcel;

            }

        }
    );

})();