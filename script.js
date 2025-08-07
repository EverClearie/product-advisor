// Get references to DOM elements
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");
const selectedList = document.getElementById("selectedProductsList");
const generateButton = document.getElementById("generateRoutine");

// Store selected product IDs and all product data
let selectedProductIds = JSON.parse(localStorage.getItem("selectedProducts")) || [];
let allProducts = [];

// Load products from JSON file and initialize UI
async function loadProducts() {
  const response = await fetch("products.json");
  const data = await response.json();
  allProducts = data.products;
  displayProducts();
  updateSelectedProducts();
}

// Display products filtered by selected category
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

// Toggle showing or hiding product descriptions
function toggleDescription(e) {
  e.stopPropagation();
  const desc = e.target.nextElementSibling;
  desc.classList.toggle("hidden");
}

// Add or remove a product from selection
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

// Show selected products in the sidebar list
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

// Remove a product from selection list
function removeSelected(productId) {
  selectedProductIds = selectedProductIds.filter(id => id !== productId);
  localStorage.setItem("selectedProducts", JSON.stringify(selectedProductIds));
  displayProducts();
  updateSelectedProducts();
}

// Return selected product objects
function getSelectedProductData() {
  return allProducts.filter(p => selectedProductIds.includes(p.id));
}

// Add a message bubble to the chat window
function displayMessage(text, sender = "bot") {
  const msg = document.createElement("div");
  msg.className = sender === "user" ? "chat-bubble user" : "chat-bubble bot";
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Generate a routine using selected products via OpenAI proxy
generateButton.addEventListener("click", async () => {
  const selected = getSelectedProductData();
  if (selected.length === 0) {
    alert("Please select at least one product.");
    return;
  }

  displayMessage("Generating your personalized routine…", "bot");

  const messages = [
    {
      role: "system",
      content: "You are a L'Oréal advisor helping customers build routines using only the products listed."
    },
    {
      role: "user",
      content: `Here are the selected products:\n\n${selected.map(p =>
        `- ${p.name} by ${p.brand}: ${p.description}`
      ).join("\n\n")}\n\nPlease generate a full routine using only these.`
    }
  ];

  try {
    const response = await fetch("https://product-advisor.ncope232001.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: messages
      })
    });

    const data = await response.json();
    const reply = data.reply || "Sorry, something went wrong.";
    displayMessage(reply, "bot");
  } catch (err) {
    console.error(err);
    displayMessage("Something went wrong connecting to the AI.", "bot");
  }
});

// Handle chat form (follow-up messages)
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const input = document.getElementById("userInput");
  const userText = input.value.trim();
  if (!userText) return;

  displayMessage(userText, "user");
  input.value = "";
  displayMessage("Thinking…", "bot");

  try {
    const response = await fetch("https://product-advisor.ncope232001.workers.dev", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful L'Oréal advisor who responds clearly to skincare questions."
          },
          {
            role: "user",
            content: userText
          }
        ]
      })
    });

    const data = await response.json();
    const reply = data.reply || "Sorry, I couldn't find an answer.";
    displayMessage(reply, "bot");
  } catch (err) {
    console.error(err);
    displayMessage("There was an error processing your message.", "bot");
  }
});

// Run on startup
categoryFilter.addEventListener("change", displayProducts);
loadProducts();
