require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

let accessToken = "";

// Function to authenticate with Salesforce
async function authenticateSalesforce() {
    try {
        const response = await axios.post(`${process.env.SF_LOGIN_URL}/services/oauth2/token`, new URLSearchParams({
            grant_type: "password",
            client_id: process.env.SF_CLIENT_ID,
            client_secret: process.env.SF_CLIENT_SECRET,
            username: process.env.SF_USERNAME,
            password: process.env.SF_PASSWORD
        }).toString(), {
            headers: { "Content-Type": "application/x-www-form-urlencoded" }
        });

        accessToken = response.data.access_token;
        console.log("🔑 Salesforce Auth Successful!");
    } catch (error) {
        console.error("❌ Error authenticating with Salesforce:", error.response?.data || error.message);
    }
}

// Order API endpoint
app.post("/create-order", async (req, res) => {
    try {
        // Authenticate if no token exists
        if (!accessToken) {
            await authenticateSalesforce();
        }

        const orderData = req.body;

        const response = await axios.post(process.env.SF_ORDER_API, orderData, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        res.json({ success: true, message: "Order created!", data: response.data });
    } catch (error) {
        console.error("❌ Error creating order:", error.response?.data || error.message);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
