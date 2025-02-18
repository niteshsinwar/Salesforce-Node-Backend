const express = require("express");
const axios = require("axios");
require("dotenv").config();
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

// Login API to get access token
app.get("/login", async (req, res) => {
    try {
        if (!accessToken) {
            await authenticateSalesforce();
        }
        res.json({ accessToken });  // Send the access token back to the client
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Failed to authenticate with Salesforce." });
    }
});

// Order API endpoint
app.post("/create-order", async (req, res) => {
    try {
        if (!accessToken) {
            await authenticateSalesforce();
        }

        const orderData = req.body;
        const response = await axios.post(`${process.env.SF_INSTANCE_URL}/services/apexrest/updateProductSchedule`, orderData, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            }
        });

        res.json({ success: true, message: "Order created!", data: response.data });
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).json({ success: false, message: "Failed to create order" });
    }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
