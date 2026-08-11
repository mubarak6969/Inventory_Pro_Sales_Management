# Inventory Pro

## Shop & Sales Management System

Inventory Pro is a modern browser-based Shop & Sales Management System
for small and medium-sized retail businesses. It combines product
management, barcode workflows, Main Warehouse inventory, shopping cart,
POS billing, payments, invoices, stock deduction, expiry monitoring,
low-stock alerts, movement tracking, PDF receipts, WhatsApp sharing,
Google Drive integration, and Excel reporting.

## Core Workflow

``` text
Product Added
    ↓
Main Warehouse
    ↓
Shop Catalogue
    ↓
Customer Cart
    ↓
Billing / POS
    ↓
Payment
    ↓
Invoice
    ↓
Stock Deduction
    ↓
Inventory Movement
    ↓
Dashboard
```

## Main Features

### Dashboard

-   Total products
-   Total stock
-   Low-stock products
-   Expiry attention
-   Stock overview
-   Expiry alerts
-   Recent stock activity
-   Inventory notifications

### Shop & Product Catalogue

-   Product cards
-   Search by name, SKU, barcode, or batch
-   Category filtering
-   Add Product
-   Individual products
-   Boxes / bundles
-   Cart management
-   Product click directly adds `+1` to cart

### Product Data

Products can contain: - Name - Brand - SKU - Barcode - Selling price -
Stock quantity - Minimum stock - Category - Product type - Batch -
Expiry date - Warehouse - Bundle contents

### Barcode System

-   Camera barcode scanning where browser support and permissions are
    available
-   Manual barcode entry
-   Local inventory barcode lookup
-   Open Food Facts lookup for new products
-   Automatic product/category information where available

Business-specific values such as selling price, stock, batch, and expiry
should be verified before saving.

### Main Warehouse

Inventory Pro uses one warehouse:

``` text
Main Warehouse
```

All incoming stock and sales operate against this warehouse.

``` text
Incoming Stock → Main Warehouse → Stock +
Sale           → Main Warehouse → Stock -
```

### Bundles / Boxes

Bundles can contain child products referenced by SKU or barcode.

Example:

``` text
Biscuit Box
├── Biscuit A × 20
└── Chocolate B × 10
```

Selling a bundle validates and deducts the required component
quantities.

### Shop Cart

The shared cart is stored in:

``` text
inventory_cart
```

Supported operations: - Add - Increase quantity - Decrease quantity -
Remove - Calculate subtotal - Calculate total - Continue to Billing

### Billing / POS

Billing supports: - Customer name - Phone / WhatsApp - Barcode lookup -
Barcode scanning - Product and bundle details - Cart quantities - Cash -
UPI - Card - Invoice generation

### Automatic Stock Deduction

Successful billing updates inventory.

``` text
Before: Biscuit = 100
Sold:   5
After:  Biscuit = 95
```

The billing flow is designed to avoid duplicate stock deductions for the
same generated invoice.

### Expiry Management

Products are categorized as:

``` text
NORMAL
EXPIRING SOON
EXPIRED
```

Products with 3 days or less remaining receive expiry attention. Expired
products should be blocked from sale.

### Low Stock

Products can have a minimum stock level.

``` text
Current Stock = 8
Minimum Stock = 10
→ LOW STOCK
```

### Inventory Movement Ledger

Movement history is stored in:

``` text
inventory_movements
```

Typical records include: - IN - OUT - SALE - Incoming stock - Main
Warehouse movement

Example:

``` text
Product: Biscuit
Type: IN
Quantity: +100
Warehouse: Main Warehouse
Source: Incoming stock
```

### Invoices and Integrations

#### PDF

`pdf.js` provides invoice/receipt PDF functionality.

``` text
Billing → Generate Invoice → PDF
```

#### WhatsApp

`whatsapp.js` supports invoice/receipt sharing through WhatsApp.

#### Google Drive

`drive.js` is intended for cloud storage and backup workflows.
Production use requires proper OAuth/API configuration.

#### Excel

`excel.js` is responsible for generating a downloadable Excel report
containing one month's credit/debit activity.

## Shared Data Architecture

The current browser-based architecture uses `localStorage`.

  Key                      Purpose
  ------------------------ --------------------------------
  `inventory_data`         Shared product inventory
  `inventory_cart`         Shop → Billing cart
  `inventory_movements`    Stock movement ledger
  `inventory_categories`   Dynamic categories
  `inventory_theme`        Dark/light theme preference
  `last_invoice`           Latest invoice data where used

The application deliberately uses one shared inventory source instead of
maintaining separate inventories for Shop, Godown, and Billing.

## Application Pages

  File             Responsibility
  ---------------- ------------------------------------
  `index.html`     Dashboard
  `login.html`     Login / authentication UI
  `shop.html`      Product catalogue and cart
  `godown.html`    Main Warehouse inventory
  `billing.html`   POS billing and invoice generation
  `database.sql`   Database/schema reference
  `drive.js`       Google Drive integration
  `excel.js`       Excel report generation
  `pdf.js`         PDF invoice generation
  `whatsapp.js`    WhatsApp sharing
  `assets/`        Static assets
  `README.md`      Project documentation

## Project Structure

``` text
Inventory-Pro/
│
├── assets/
│
├── index.html
├── login.html
├── shop.html
├── godown.html
├── billing.html
│
├── database.sql
│
├── drive.js
├── excel.js
├── pdf.js
├── whatsapp.js
│
└── README.md
```

## UI / Design System

Inventory Pro follows a premium liquid-glass design system.

It includes: - Glassmorphism - Backdrop blur - Transparent panels -
Purple/blue accents - Smooth transitions - Hover magnification -
Light-sweep effects - Glow effects - Animated cards - Responsive
layouts - Dark theme - Light theme

Theme preference is persisted using:

``` text
inventory_theme
```

## Getting Started

### Requirements

-   Modern browser
-   JavaScript enabled
-   Camera permission for camera scanning
-   Internet access for external product lookup
-   Proper credentials/configuration for cloud integrations

### Local Development

Because camera APIs work best from a secure context, use a local web
server rather than opening HTML files directly with `file://`.

For example:

``` bash
python -m http.server 8000
```

Then open:

``` text
http://localhost:8000
```

Use HTTPS when deploying to production.

## Basic Usage

### Add Product

1.  Open Shop.
2.  Select Add Product.
3.  Enter product information.
4.  Set price, stock, batch, and expiry.
5.  Confirm Main Warehouse.
6.  Save.

### Sell Product

1.  Open Shop.
2.  Click a product.
3.  The cart increases by one.
4.  Adjust quantity if necessary.
5.  Continue to Billing.
6.  Verify customer and payment.
7.  Generate the invoice.
8.  Stock is deducted.
9.  An OUT/Sale movement is recorded.

### Restock

1.  Open Godown.
2.  Select a product.
3.  Enter incoming quantity.
4.  Update batch/expiry if needed.
5.  Add incoming stock.
6.  Stock increases and an IN movement is recorded.

### Sell Bundle

1.  Create a bundle.
2.  Define its component products and quantities.
3.  Add or scan the bundle during billing.
4.  Validate component availability.
5.  Generate the invoice.
6.  Component stock is updated.

## Testing Checklist

### Dashboard

-   [ ] Opens correctly
-   [ ] Empty state works
-   [ ] Product count updates
-   [ ] Stock total updates
-   [ ] Low-stock count updates
-   [ ] Expiry alerts update
-   [ ] Recent activity updates

### Shop

-   [ ] Add product
-   [ ] Product appears in catalogue
-   [ ] Click product adds +1
-   [ ] Repeated clicks increase quantity
-   [ ] Cart + works
-   [ ] Cart - works
-   [ ] Cart totals are correct
-   [ ] Search works
-   [ ] Category filter works

### Godown

-   [ ] Incoming stock works
-   [ ] Stock increases correctly
-   [ ] Main Warehouse is shown
-   [ ] IN movement is recorded
-   [ ] Low-stock status updates
-   [ ] Expiry status updates

### Billing

-   [ ] Shop cart loads
-   [ ] Barcode lookup works
-   [ ] Bundle lookup works
-   [ ] Quantity controls work
-   [ ] Payment selection works
-   [ ] Invoice is generated
-   [ ] Stock deducts exactly once
-   [ ] OUT movement is recorded
-   [ ] Invoice is saved

### Expiry

-   [ ] Normal product
-   [ ] 3-day warning
-   [ ] 2-day warning
-   [ ] 1-day warning
-   [ ] Expired status
-   [ ] Expired sale blocked

### Integrations

-   [ ] PDF works
-   [ ] WhatsApp works
-   [ ] Google Drive works when configured
-   [ ] Excel export works

### UI

-   [ ] Dark theme
-   [ ] Light theme
-   [ ] Theme persistence
-   [ ] Desktop
-   [ ] Tablet
-   [ ] Mobile
-   [ ] No major console errors

## Security and Deployment Notes

The current version is browser-based and uses `localStorage`. This is
suitable for a lightweight/local deployment, but it is not a centralized
multi-user database.

For production multi-device use, introduce a backend database and API.

Authentication should use: - Backend token verification - Secure
sessions or verified JWTs - HTTPS - Server-side authorization - Secure
secret storage

Do not place private Google/API credentials in frontend code.

Camera scanning requires browser permission and generally works best on
HTTPS or localhost.

External product APIs may change availability, coverage, or response
formats, so returned product data should be verified before saving.

## Future Expansion

Recommended next business modules:

1.  Customer Management
2.  Credit / Udhaar
3.  Sales History
4.  Purchase Management
5.  Supplier Management
6.  Profit & Loss
7.  Expense Tracking
8.  Daily Closing
9.  Backup and Restore

Example credit flow:

``` text
Bill ₹1,000
Paid ₹700
Credit ₹300
```

Example profit flow:

``` text
Selling Price
-
Purchase Cost
=
Gross Profit
```

## Design Philosophy

Inventory Pro intentionally avoids unnecessary ERP complexity.

The core model is:

``` text
                 INVENTORY PRO
                       │
                       ▼
               MAIN WAREHOUSE
                       │
              ┌────────┴────────┐
              ▼                 ▼
          PRODUCTS           BUNDLES
              │                 │
              └────────┬────────┘
                       ▼
                   SHOP CART
                       │
                       ▼
                    BILLING
                       │
                       ▼
                    INVOICE
                       │
              ┌────────┼────────┐
              ▼        ▼        ▼
             PDF    WhatsApp   Drive
                       │
                       ▼
                STOCK DEDUCTION
                       │
                       ▼
                MOVEMENT LEDGER
                       │
                       ▼
                   DASHBOARD
```

## Project Status

**Core Inventory + Shop + Main Warehouse + Billing architecture:**
Implemented

**Shared storage:** `inventory_data`, `inventory_cart`,
`inventory_movements`

**Warehouse model:** Single Main Warehouse

**UI:** Premium liquid-glass, responsive, dark/light themes

**Recommended next phase:** Full integration testing and regression
testing, followed by advanced customer, credit, sales, purchase, profit,
and expense modules.

------------------------------------------------------------------------

**Inventory Pro --- Shop & Sales Management System**
