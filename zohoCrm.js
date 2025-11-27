const axios = require("axios");
require("dotenv").config();

async function getAccessToken() {
    try {
        const url =
            `https://accounts.zoho.in/oauth/v2/token` +
            `?refresh_token=${process.env.ZOHO_REFRESH_TOKEN}` +
            `&client_id=${process.env.ZOHO_CLIENT_ID}` +
            `&client_secret=${process.env.ZOHO_CLIENT_SECRET}` +
            `&grant_type=refresh_token`;

        const response = await axios.post(url);
        return response.data.access_token;

    } catch (err) {
        console.error("❌ Error refreshing token:", err.response?.data || err);
        throw err;
    }
}

async function createLeadInZoho(lead) {
    const accessToken = await getAccessToken();

    const url = "https://www.zohoapis.in/crm/v2/Leads";

    const payload = {
        data: [
            {
                Last_Name: lead.name,
                Email: lead.email,
                Phone: lead.phone,
                Company: "Assurax Lead",
                Service_Required: lead.service,
                Budget: Number(lead.budget),
                Description: lead.description
            }
        ]
    };

    try {
        const response = await axios.post(url, payload, {
            headers: {
                Authorization: `Zoho-oauthtoken ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        console.log("✅ Lead Created:", response.data);
        return true;

    } catch (error) {
        console.error("❌ Zoho Error:", error.response?.data || error);
        throw error;
    }
}

// EXPORT MUST BE EXACTLY THIS
module.exports = { createLeadInZoho };
