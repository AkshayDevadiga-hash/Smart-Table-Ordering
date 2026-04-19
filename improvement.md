## Redesign the admin dashboard layout:

1. STAT CARDS ROW — make all 4 cards equal width in a CSS grid 
   (grid-template-columns: repeat(4, 1fr)), taller (min-height: 110px),
   each card has a colored icon circle on the left:
   - Orders Today: amber icon bg
   - Revenue: green icon bg  
   - Active Orders: blue icon bg
   - Tables Occupied: purple icon bg
   The big number should be font-size: 2rem, font-weight: 800, color: var(--primary)
   Label below in var(--text-muted), font-size: 0.75rem, uppercase, letter-spacing: 1px

2. BOTTOM ROW — two-column grid (60% / 40%):
   Left: "Recent Orders" table with columns: Order#, Table, Items, Amount, Status
   Each row has a colored status pill (not plain text)
   Right: "Popular Items" as a ranked list — each item shows a rank number 
   in amber circle, item name, and an order count bar (CSS width, amber fill)

3. Give each section a section header: bold title left, small "View all →" 
   link right in var(--text-muted)
   
## Redesign menu management layout:

1. TOP BAR — full width bar with page title left, "+ Add Item" button right
   Button: background var(--primary), color #0f0e0d, border-radius 999px, 
   padding 8px 20px, font-weight 700

2. CATEGORY TABS — horizontal scrollable pill tabs below the top bar,
   sticky so they stay visible while scrolling. 
   Active tab: background var(--primary), dark text
   Inactive: background var(--surface-2), var(--text-muted) text

3. MENU ITEMS — instead of plain text rows, show items as a 
   responsive grid: grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
   Each card:
   - Left: item image (80×80px, border-radius 10px, object-fit: cover)
     If no image: a colored placeholder with first letter of item name
   - Right: item name (font-weight: 700), category badge pill, price in amber
   - Bottom row: veg/non-veg dot + label, availability toggle switch, 
     Edit and Delete icon buttons
   - Hover: border-color var(--primary), slight shadow

4. EMPTY STATE — when no items in category, show a centered icon (🍽️), 
   "No items yet" in var(--text-muted), and a "+ Add first item" button

## Redesign tables page:

1. STAT ROW — same style as dashboard: 3 equal cards (Total, Available, Occupied)
   Occupied card accent color: var(--danger) tint instead of amber

2. TABLE GRID — grid-template-columns: repeat(auto-fill, minmax(220px, 1fr))
   Each table card:
   - Top section: Table number large (font-size: 1.5rem, font-weight: 800) 
     with status pill (Available = green, Occupied = amber, Reserved = blue)
     Seats info in small muted text below
   - Middle: QR code centered, max-width: 140px, with a thin border and 
     border-radius: 12px, padding: 8px, background: white (QR needs white bg)
   - Bottom: two buttons side by side — "Download PNG" (outlined) 
     and "Preview Menu →" (text link in amber)
   - Card border-left: 3px solid — green if available, amber if occupied

3. ADD TABLE button stays top right, same amber pill style

## Redesign reports page:

1. PERIOD TABS — pill tabs row, same style as menu category tabs
   Active = amber filled, inactive = surface-2

2. METRICS ROW — 3 cards (Paid Revenue, Paid Orders, Average Order)
   Same big number + muted label style as dashboard cards
   Revenue card: number prefixed with ₹, color var(--primary)

3. CHART AREA — add a placeholder chart container even when empty:
   background: var(--surface), border-radius: var(--radius-lg), 
   min-height: 220px, padding: 1.5rem
   When no data: centered empty state — icon + "No revenue data for this period"
   in var(--text-muted). When data exists: use Chart.js bar chart
   (bars: var(--primary), grid lines: var(--border), labels: var(--text-muted))

4. TABLE REVENUE SECTION — show as a table with columns:
   Table #, Orders Count, Total Revenue, % of Total
   Each row has a mini amber progress bar under the revenue column
   Empty state: "No paid orders yet" centered with muted styling

## Polish kitchen dashboard:

1. HEADER BAR — keep current layout but:
   "● Live" indicator: animated blink on the dot (CSS animation: blink 1.5s infinite)
   dot color: var(--success) when connected, var(--danger) when polling fails

2. COLUMN HEADERS — give each a background tint:
   Pending: rgba(90,85,78,0.3) — neutral gray
   Received: rgba(91,155,213,0.2) — blue tint  
   Preparing: rgba(240,180,41,0.2) — amber tint
   Ready: rgba(76,175,130,0.2) — green tint
   Header text uses matching color, count badge in matching color circle

3. ORDER CARDS — each card inside a column:
   background: var(--surface-2), border-radius: var(--radius-lg)
   border-left: 3px solid [column color]
   Table number: large, font-weight: 800, amber color
   Order # and time: small, muted, top right
   Items: each item on its own line — quantity in amber circle, item name
   Action button at bottom: full width, filled with column's next-step color
   (e.g. Received column button says "Start Preparing" in amber)
   New card entrance: animation: fadeUp 0.3s ease, scaleIn 0.3s ease

4. EMPTY COLUMN STATE — centered muted text "No orders" with 
   a small relevant icon, not just plain text

## Sidebar Active State

1. Background: add radial gradient behind the card:
   background: radial-gradient(ellipse at 50% 30%, 
   rgba(232,160,69,0.07) 0%, transparent 65%), #0f0e0d

2. The lock icon container: background var(--primary), 
   border-radius: var(--radius-lg), width: 56px, height: 56px

3. Card entrance: animation: scaleIn 0.3s cubic-bezier(0.34,1.56,0.64,1)
   (the spring bounce makes it feel alive)

4. Error message: appears inline below the password field as a red pill,
   animation: fadeUp 0.2s ease — NOT an alert/popup

Active sidebar nav item:
  background: rgba(232,160,69,0.12)
  border-left: 3px solid var(--primary)
  border-radius: 0 8px 8px 0
  color: var(--primary)
  font-weight: 600
  padding-left: calc(original-padding - 3px)  ← account for border width
