const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// MySQL connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "1266",
    database: "agriculture_marketplace"
});

db.connect((err) => {
    if (err) {
        console.log("Database connection failed:", err);
        return;
    }
    console.log("MySQL Connected Successfully!");
});

// 1. Display all products
app.get("/products", (req, res) => {
    const sql = `
        SELECT products.*, users.name AS farmer_name
        FROM products
        JOIN users ON products.farmer_id = users.user_id
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// 2. Add a product
app.post("/products", (req, res) => {
    const {
        farmer_id,
        product_name,
        category,
        price,
        quantity,
        description
    } = req.body;

    const sql = `
        INSERT INTO products
        (farmer_id, product_name, category, price, quantity, description)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, [
        farmer_id,
        product_name,
        category,
        price,
        quantity,
        description
    ], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Product added successfully!" });
    });
});

// 3. Update a product
app.put("/products/:id", (req, res) => {
    const {
        product_name,
        category,
        price,
        quantity,
        description
    } = req.body;

    const sql = `
        UPDATE products
        SET product_name=?, category=?, price=?, quantity=?, description=?
        WHERE product_id=?
    `;

    db.query(sql, [
        product_name,
        category,
        price,
        quantity,
        description,
        req.params.id
    ], (err, result) => {
        if (err) return res.status(500).send(err);
        res.json({ message: "Product updated successfully!" });
    });
});

// 4. Delete a product
app.delete("/products/:id", (req, res) => {
    db.query(
        "DELETE FROM products WHERE product_id=?",
        [req.params.id],
        (err, result) => {
            if (err) return res.status(500).send(err);
            res.json({ message: "Product deleted successfully!" });
        }
    );
});

// 5. Display users
app.get("/users", (req, res) => {
    db.query("SELECT * FROM users", (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// 6. Place an order
app.post("/orders", (req, res) => {
    const {
        customer_id,
        product_id,
        quantity,
        delivery_address
    } = req.body;

    if (!customer_id || !product_id || !quantity || !delivery_address) {
        return res.status(400).json({ message: "Please fill all order details." });
    }

    db.beginTransaction((err) => {
        if (err) return res.status(500).send(err);

        db.query(
            "SELECT * FROM products WHERE product_id=? FOR UPDATE",
            [product_id],
            (err, products) => {
                if (err || products.length === 0) {
                    return db.rollback(() =>
                        res.status(400).json({ message: "Product not found." })
                    );
                }

                const product = products[0];

                if (quantity > product.quantity) {
                    return db.rollback(() =>
                        res.status(400).json({ message: "Not enough stock available." })
                    );
                }

                const total = product.price * quantity;

                db.query(
                    `INSERT INTO orders
                    (customer_id, order_date, total_amount, delivery_address, status)
                    VALUES (?, CURDATE(), ?, ?, 'Pending')`,
                    [customer_id, total, delivery_address],
                    (err, orderResult) => {
                        if (err) {
                            return db.rollback(() => res.status(500).send(err));
                        }

                        const orderId = orderResult.insertId;

                        db.query(
                            `INSERT INTO order_items
                            (order_id, product_id, quantity, unit_price)
                            VALUES (?, ?, ?, ?)`,
                            [orderId, product_id, quantity, product.price],
                            (err) => {
                                if (err) {
                                    return db.rollback(() => res.status(500).send(err));
                                }

                                db.query(
                                    "UPDATE products SET quantity = quantity - ? WHERE product_id = ?",
                                    [quantity, product_id],
                                    (err) => {
                                        if (err) {
                                            return db.rollback(() => res.status(500).send(err));
                                        }

                                        db.commit((err) => {
                                            if (err) {
                                                return db.rollback(() => res.status(500).send(err));
                                            }

                                            res.json({
                                                message: "Order placed successfully!"
                                            });
                                        });
                                    }
                                );
                            }
                        );
                    }
                );
            }
        );
    });
});

// 7. Display all orders
app.get("/orders", (req, res) => {
    const sql = `
        SELECT orders.*, users.name AS customer_name
        FROM orders
        JOIN users ON orders.customer_id = users.user_id
        ORDER BY orders.order_id DESC
    `;

    db.query(sql, (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// Start server
app.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});