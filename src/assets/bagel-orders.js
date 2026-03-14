/* ═══════════════════════════════════════════════
   Bagel Order Calculator — client-side logic
   ═══════════════════════════════════════════════ */
(() => {
  'use strict';

  // ── Config ──
  const PASSWORD_HASH = '9e6938495527459289c414c063e9b47322a81377c57f3fab9abc9b1b9a2d6355'; // F@tFuckingTitti3s
  const DEFAULT_FLAVORS = [
    'Plain', 'Everything', 'Sesame', 'Poppy',
    'Cinnamon Raisin', 'Onion', 'Garlic'
  ];
  const MAX_BAGELS = 48;

  // ── Storage keys ──
  const STORAGE = {
    AUTH:    'bo_authenticated',
    FLAVORS: 'bo_flavors',
    ORDERS:  'bo_orders',
  };

  // ── DOM refs ──
  const $ = (id) => document.getElementById(id);
  const gate          = $('passwordGate');
  const pwForm        = $('pwForm');
  const pwInput       = $('pwInput');
  const pwError       = $('pwError');
  const app           = $('app');
  
  const orderForm     = $('orderForm');
  const customerName  = $('customerName');
  const bagelCount    = $('bagelCount');
  const flavorSelect  = $('flavorSelect');
  const addToOrderBtn = $('addToOrderBtn');
  const addFlavorBtn  = $('addFlavorBtn');
  const addFlavorPop  = $('addFlavorPop');
  const newFlavorInp  = $('newFlavorInput');
  const confirmFBtn   = $('confirmFlavorBtn');
  const cancelFBtn    = $('cancelFlavorBtn');
  const clearTotalsBtn = $('clearTotalsBtn');
  
  const cartSection       = $('cartSection');
  const cartCustomerDisp  = $('cartCustomerDisplay');
  const cartItems         = $('cartItems');
  const completeOrderBtn  = $('completeOrderBtn');
  const cancelCartBtn     = $('cancelCartBtn');
  
  const exportBtn     = $('exportBtn');
  const totalsGrid    = $('totalsGrid');
  const orderCountEl  = $('orderCount');
  const recentOrders  = $('recentOrders');

  // ── State ──
  let flavors = [];
  let orders  = [];
  let cart    = [];

  // ───────────────────────────────────────────
  // Password handling
  async function sha256(message) {
    const data = new TextEncoder().encode(message);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function unlock() {
    gate.hidden = true;
    app.hidden = false;
    sessionStorage.setItem(STORAGE.AUTH, '1');
  }

  if (sessionStorage.getItem(STORAGE.AUTH) === '1') unlock();

  pwForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hash = await sha256(pwInput.value);
    if (hash === PASSWORD_HASH) {
      unlock();
    } else {
      pwError.hidden = false;
      pwInput.value = '';
      pwInput.focus();
    }
  });

  // ───────────────────────────────────────────
  // Flavors
  function loadFlavors() {
    const saved = localStorage.getItem(STORAGE.FLAVORS);
    flavors = saved ? JSON.parse(saved) : [...DEFAULT_FLAVORS];
    saveFlavors();
    renderFlavorDropdown();
  }

  function saveFlavors() {
    localStorage.setItem(STORAGE.FLAVORS, JSON.stringify(flavors));
  }

  function renderFlavorDropdown() {
    // try to keep current value if possible
    const currentVal = flavorSelect.value;
    flavorSelect.innerHTML = '<option value="" disabled selected>Choose…</option>';
    flavors.forEach(f => {
      const opt = document.createElement('option');
      opt.value = f;
      opt.textContent = f;
      flavorSelect.appendChild(opt);
    });
    if (currentVal && flavors.includes(currentVal)) {
      flavorSelect.value = currentVal;
    }
  }

  // ── Inline Flavor Add Logic ──
  addFlavorBtn.addEventListener('click', () => {
    addFlavorPop.hidden = false;
    newFlavorInp.focus();
  });

  function closeFlavorPop() {
    addFlavorPop.hidden = true;
    newFlavorInp.value = '';
  }

  cancelFBtn.addEventListener('click', closeFlavorPop);

  confirmFBtn.addEventListener('click', () => {
    const name = newFlavorInp.value;
    if (!name || !name.trim()) return;
    
    const trimmed = name.trim();
    if (flavors.find(f => f.toLowerCase() === trimmed.toLowerCase())) {
      showToast('That flavor already exists!');
      return;
    }
    
    flavors.push(trimmed);
    saveFlavors();
    renderFlavorDropdown();
    flavorSelect.value = trimmed;
    showToast(`"${trimmed}" added!`);
    closeFlavorPop();
  });

  // Allow pressing Enter in the input to add
  newFlavorInp.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmFBtn.click();
    } else if (e.key === 'Escape') {
      closeFlavorPop();
    }
  });

  // ───────────────────────────────────────────
  // Init count
  function populateBagelCount() {
    for (let i = 1; i <= MAX_BAGELS; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = i;
      bagelCount.appendChild(opt);
    }
  }

  // ───────────────────────────────────────────
  // Cart Actions (Multiple flavors per order)
  orderForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const cust = customerName.value.trim();
    const count = parseInt(bagelCount.value, 10);
    const flavor = flavorSelect.value;
    
    // Add to cart
    cart.push({ count, flavor });
    
    // Lock customer name when cart has items
    customerName.disabled = true;
    
    // Reset selected flavor but leave name and count
    flavorSelect.value = '';
    
    renderCart(cust);
    showToast(`Added ${count} ${flavor} to order!`);
  });

  function renderCart(cust) {
    if (cart.length === 0) {
      cartSection.hidden = true;
      customerName.disabled = false;
      return;
    }
    cartSection.hidden = false;
    cartCustomerDisp.textContent = `for ${cust}`;
    
    cartItems.innerHTML = cart.map((item, index) => `
      <div class="bo-cart-row">
        <span>${item.count} × ${escapeHtml(item.flavor)}</span>
        <button type="button" class="btn-remove-item" data-index="${index}" aria-label="Remove" title="Remove">&times;</button>
      </div>
    `).join('');
    
    // Attach removal handlers
    cartItems.querySelectorAll('.btn-remove-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        cart.splice(idx, 1);
        renderCart(cust);
      });
    });
  }

  cancelCartBtn.addEventListener('click', () => {
    cart = [];
    renderCart('');
    customerName.value = '';
    showToast('Order cancelled.');
  });

  completeOrderBtn.addEventListener('click', () => {
    if (cart.length === 0) return;
    
    const cust = customerName.value.trim();
    const order = {
      id: Date.now(),
      customer: cust,
      items: [...cart], // Array of { count, flavor }
      date: new Date().toLocaleString(),
    };
    
    orders.push(order);
    saveOrders();
    renderAll();
    
    // Clear cart & form
    cart = [];
    renderCart('');
    customerName.value = '';
    customerName.disabled = false;
    
    showToast(`Order complete for ${cust}!`);
  });

  // ───────────────────────────────────────────
  // Orders & Dash
  function loadOrders() {
    const saved = localStorage.getItem(STORAGE.ORDERS);
    orders = saved ? JSON.parse(saved) : [];
    
    // Legacy support: convert old flat orders to new format (items array)
    orders = orders.map(o => {
      if (o.flavor) { // it's an old order
        o.items = [{ flavor: o.flavor, count: o.count }];
        delete o.flavor;
        delete o.count;
      }
      return o;
    });
    // Save the upgraded format
    saveOrders();
    
    renderAll();
  }

  function saveOrders() {
    localStorage.setItem(STORAGE.ORDERS, JSON.stringify(orders));
  }

  clearTotalsBtn.addEventListener('click', () => {
    if (!orders.length) {
      showToast('Nothing to clear.');
      return;
    }
    if (!confirm('Clear ALL orders and totals? This cannot be undone.')) return;
    orders = [];
    saveOrders();
    renderAll();
    showToast('All orders cleared.');
  });

  // ───────────────────────────────────────────
  // Rendering
  function renderAll() {
    renderTotalsGrid();
    renderOrderCount();
    renderRecentOrders();
  }

  function renderTotalsGrid() {
    const tally = {};
    // Initialize all flavors to 0
    flavors.forEach(f => { tally[f] = 0; });
    
    // Add up the counts
    orders.forEach(o => {
      o.items.forEach(item => {
        tally[item.flavor] = (tally[item.flavor] || 0) + item.count;
      });
    });

    const sorted = Object.keys(tally).sort((a, b) => a.localeCompare(b));
    totalsGrid.innerHTML = sorted.map(flavor => `
      <div class="bo-flavor-card">
        <div class="bo-flavor-name">${escapeHtml(flavor)}</div>
        <div class="bo-flavor-count">${tally[flavor]}</div>
      </div>
    `).join('');
  }

  function renderOrderCount() {
    orderCountEl.textContent = orders.length; // 1 order = 1 customer request
  }

  function renderRecentOrders() {
    if (!orders.length) {
      recentOrders.innerHTML = '<p class="bo-empty">No orders yet.</p>';
      return;
    }
    const reversed = [...orders].reverse();
    recentOrders.innerHTML = reversed.map(o => `
      <div class="bo-order-row">
        <span class="bo-order-customer">${escapeHtml(o.customer)}</span>
        <span class="bo-order-detail">${o.items.map(i => `${i.count} × ${escapeHtml(i.flavor)}`).join(' + ')}</span>
        <span class="bo-order-detail">${o.date}</span>
      </div>
    `).join('');
  }

  // ───────────────────────────────────────────
  // Export to CSV
  exportBtn.addEventListener('click', () => {
    if (!orders.length) {
      showToast('No orders to export.');
      return;
    }
    
    // Each item becomes a line so Excel pivots easily
    const header = 'OrderID,Date,Customer,Flavor,Count';
    const rows = [];
    
    orders.forEach(o => {
      o.items.forEach(item => {
        // Escape quotes in flavor, customer name
        const cleanFlavor = item.flavor.replace ? item.flavor.replace(/"/g, '""') : item.flavor;
        const cleanCust = o.customer.replace(/"/g, '""');
        rows.push(`"${o.id}","${o.date}","${cleanCust}","${cleanFlavor}",${item.count}`);
      });
    });
    
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bagel-orders-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('CSV downloaded!');
  });

  // ───────────────────────────────────────────
  // Toasts & Utils
  let toastTimer;
  function showToast(msg) {
    let toast = document.querySelector('.bo-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'bo-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    if(str !== undefined && str !== null) {
        div.appendChild(document.createTextNode(str));
    }
    return div.innerHTML;
  }

  // ── Init ──
  populateBagelCount();
  loadFlavors();
  loadOrders();
})();
