
const productList = document.getElementById("productList");
const productForm = document.getElementById("productForm");
const orderForm = document.getElementById("orderForm");
const orderProduct = document.getElementById("order_product");

// Load products
async function loadProducts() {
    try {
        const response = await fetch("/products");

        if (!response.ok) throw new Error("Unable to load products");

        const products = await response.json();

        productList.innerHTML = "";
        orderProduct.innerHTML = '<option value="">Select Product</option>';

        if (products.length === 0) {
            productList.innerHTML = "<p>No products available.</p>";
            return;
        }

        products.forEach(product => {
            productList.innerHTML += `
                <div class="product-card">
                    <h3>${product.product_name}</h3>
                    <p>Category: ${product.category}</p>
                    <p>Price: ₹${product.price}</p>
                    <p>Quantity: ${product.quantity}</p>
                    <p>Farmer: ${product.farmer_name}</p>
                    <p>${product.description || ""}</p>

                    <button onclick="editProduct(${product.product_id})">
                        Edit
                    </button>

                    <button class="delete-btn"
                        onclick="deleteProduct(${product.product_id})">
                        Delete
                    </button>
                </div>
            `;

            orderProduct.innerHTML += `
                <option value="${product.product_id}">
                    ${product.product_name} - ₹${product.price}
                </option>
            `;
        });

    } catch (error) {
        productList.innerHTML = "<p>Unable to load products. Check server connection.</p>";
        console.error(error);
    }
}

// Add or update product
productForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const id = document.getElementById("product_id").value;

    const product = {
        farmer_id: document.getElementById("farmer_id").value,
        product_name: document.getElementById("product_name").value,
        category: document.getElementById("category").value,
        price: document.getElementById("price").value,
        quantity: document.getElementById("quantity").value,
        description: document.getElementById("description").value
    };

    try {
        const response = await fetch(
            id ? `/products/${id}` : "/products",
            {
                method: id ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(product)
            }
        );

        if (!response.ok) throw new Error(await response.text());

        alert(id ? "Product updated successfully!" : "Product added successfully!");

        productForm.reset();
        document.getElementById("product_id").value = "";
        document.getElementById("saveBtn").textContent = "Add Product";

        loadProducts();

    } catch (error) {
        alert("Error: " + error.message);
    }
});

// Edit product
async function editProduct(id) {
    try {
        const response = await fetch("/products");

        if (!response.ok) throw new Error("Could not get products");

        const products = await response.json();
        const product = products.find(p => p.product_id === id);

        if (!product) return;

        document.getElementById("product_id").value = product.product_id;
        document.getElementById("farmer_id").value = product.farmer_id;
        document.getElementById("product_name").value = product.product_name;
        document.getElementById("category").value = product.category;
        document.getElementById("price").value = product.price;
        document.getElementById("quantity").value = product.quantity;
        document.getElementById("description").value = product.description || "";

        document.getElementById("saveBtn").textContent = "Update Product";

        document.getElementById("manage").scrollIntoView();

    } catch (error) {
        alert("Unable to edit product.");
    }
}

// Delete product
async function deleteProduct(id) {
    if (!confirm("Are you sure you want to delete this product?")) {
        return;
    }

    try {
        const response = await fetch(`/products/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) throw new Error(await response.text());

        alert("Product deleted successfully!");
        loadProducts();

    } catch (error) {
        alert("Unable to delete product. It may already be included in an order.");
    }
}

// Clear product form
document.getElementById("resetBtn").addEventListener("click", function() {
    productForm.reset();
    document.getElementById("product_id").value = "";
    document.getElementById("saveBtn").textContent = "Add Product";
});

// Place order
orderForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const order = {
        customer_id: document.getElementById("customer_id").value,
        product_id: orderProduct.value,
        quantity: document.getElementById("order_quantity").value,
        delivery_address: document.getElementById("delivery_address").value
    };

    try {
        const response = await fetch("/orders", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(order)
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Order failed");
        }

        alert("Order placed successfully!");

        orderForm.reset();
        loadProducts();
        loadOrders();

    } catch (error) {
        alert(error.message);
    }
});

// Load orders
async function loadOrders() {
    const orderList = document.getElementById("orderList");

    try {
        const response = await fetch("/orders");

        if (!response.ok) throw new Error("Unable to load orders");

        const orders = await response.json();

        orderList.innerHTML = "";

        if (orders.length === 0) {
            orderList.innerHTML = "<p>No orders placed yet.</p>";
            return;
        }

        orders.forEach(order => {
            orderList.innerHTML += `
                <div class="order-card">
                    <h3>Order ID: ${order.order_id}</h3>
                    <p>Customer: ${order.customer_name}</p>
                    <p>Date: ${order.order_date}</p>
                    <p>Total Amount: ₹${order.total_amount}</p>
                    <p>Delivery Address: ${order.delivery_address}</p>
                    <p>Status: ${order.status}</p>
                </div>
            `;
        });

    } catch (error) {
        orderList.innerHTML = "<p>Unable to load orders.</p>";
        console.error(error);
    }
}

// Start the website
loadProducts();
loadOrders();
