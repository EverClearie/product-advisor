const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedList = document.getElementById("selectedProductsList");
const generateButton = document.getElementById("generateRoutine");

let selectedProductIds = JSON.parse(localStorage.getItem("selectedProducts")) || [];
let allProducts = [];

/* Load product data and display based on selected category */
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  displayProducts();
  updateSelectedProducts();
}

/* Display product cards filtered by category */
function displayProducts() {
  const category = categoryFilter.value;
  const filtered = allProducts.filter(p => p.category === category);

  if (filtered.length === 0) {
    productsContainer.innerHTML = `<p>No products found.</p>`;
    return;
  }

  productsContainer.innerHTML = filtered.map(product => {
    const isSelected = selectedProductIds.includes(product.id);
    return `
      <div class="product-card ${isSelected ? "selected" : ""}" data-id="${product.id}">
        <img src="${product.image}" alt="${product.name}">
        <div class="product-info">
          <h3>${product.name}</h3>
          <p>${product.brand}</p>
          <button class="desc-btn" onclick="toggleDescription(event)">View Description</button>
          <p class="product-description hidden">${product.description}</p>
        </div>
      </div>
    `;
  }).join("");

  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", () => toggleSelection(parseInt(card.dataset.id)));
  });
}

/* Toggle product description display */
function toggleDescription(e) {
  e.stopPropagation();
  const desc = e.target.nextElementSibling;
  desc.classList.toggle("hidden");
}

/* Add or remove a product from selection */
function toggleSelection(productId) {
  if (selectedProductIds.includes(productId)) {
    selectedProductIds = selectedProductIds.filter(id => id !== productId);
  } else {
    selectedProductIds.push(productId);
  }

  localStorage.setItem("selectedProducts", JSON.stringify(selectedProductIds));
  displayProducts();
  updateSelectedProducts();
}

/* Display selected products in the side list */
function updateSelectedProducts() {
  selectedList.innerHTML = "";

  const selected = allProducts.filter(p => selectedProductIds.includes(p.id));
  selected.forEach(p => {
    const item = document.createElement("div");
    item.className = "selected-item";
    item.innerHTML = `
      <span>${p.name}</span>
      <button onclick="removeSelected(${p.id})">&times;</button>
    `;
    selectedList.appendChild(item);
  });
}

/* Remove one item from selected */
function removeSelected(productId) {
  selectedProductIds = selectedProductIds.filter(id => id !== productId);
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProductIds));
  displayProducts();
  updateSelectedProducts();
}

/* Get full info for selected products */
function getSelectedProductData() {
  return allProducts.filter(p => selectedProductIds.includes(p.id));
}

/* Display a chat message */
function displayMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Generate routine using Cloudflare Worker + OpenAI */
generateButton.addEventListener("click", async () => {
  const selected = getSelectedProductData();
  if (selected.length === 0) {
    alert("Please select at least one product.");
    return;
  }

  displayMessage("Generating your personalized routine…", "bot");

  const systemMessage = {
    role: "system",
    content: "You are a L'Oréal advisor helping customers build routines using only the products listed."
  };

  const userMessage = {
    role: "user",
    content: `Here are the selected products:\n\n${selected.map(p =>
      `- ${p.name} by ${p.brand}: ${p.description}`
    ).join("\n\n")}\n\nPlease generate a full routine using only these.`
  };

  const response = await fetch("https://product-advisor.ncope232001.workers.dev", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [systemMessage, userMessage],
      model: "gpt-4o"
    })
  });

  const data = await response.json();
  const reply = data.choices?.[0]?.message?.content || "Sorry, something went wrong.";
  displayMessage(reply, "bot");
});

/* Placeholder for follow-up question handling */
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const userText = input.value.trim();
  if (!userText) return;

  displayMessage(userText, "user");
  input.value = "";

  displayMessage("Follow-up handling coming soon!", "bot");
});

/* On page load */
categoryFilter.addEventListener("change", displayProducts);
loadProducts();
