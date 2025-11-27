require("dotenv").config();
const { Telegraf } = require("telegraf");
const LocalSession = require("telegraf-session-local");
// const { createZohoLead } = require("./zohoCrm");   // <-- ZOHO CRM MODULE
const { createLeadInZoho } = require("./zohoCrm");


const bot = new Telegraf(process.env.BOT_TOKEN);

// Add session middleware
bot.use(new LocalSession({ database: "sessions.json" }).middleware());

// Home Keyboard
const mainMenu = {
    reply_markup: {
        keyboard: [
            ["📋 Have Any Requiremen?"],
            ["ℹ About Assurax"]
        ],
        resize_keyboard: true,
    }
};

// ----------- START -----------
bot.start((ctx) => {
    ctx.reply(
        "👋 Welcome to *Assurax - IT Solutions*\n\nWe help you build Websites, Apps, Branding & More!",
        { parse_mode: "Markdown", ...mainMenu }
    );
});

// ----------- ABOUT -----------
bot.hears("ℹ About Assurax", (ctx) => {
    ctx.reply(
        "🚀 *Assurax IT Solutions*\nWe provide:\n\n" +
        "• Website Development\n" +
        "• Mobile App Development\n" +
        "• Branding\n" +
        "• Digital Marketing\n" +
        "• UI/UX Designing\n" +
        "• Software Maintenance\n",
        { parse_mode: "Markdown" }
    );
});

// -------------------------------------------------------
// LEAD GENERATOR START
// -------------------------------------------------------
bot.hears("📋 Have Any Requiremen?", async (ctx) => {
    ctx.session.lead = {};
    ctx.session.step = "name";

    await ctx.reply("👤 Please enter your *Full Name*:", { parse_mode: "Markdown" });
});

// ----------- TEXT HANDLER FOR LEAD FLOW -----------
bot.on("text", async (ctx) => {
    const text = ctx.message.text;

    if (!ctx.session || !ctx.session.step) return;

    switch (ctx.session.step) {

        case "name":
            ctx.session.lead.name = text;
            ctx.session.step = "email";
            return ctx.reply("📧 Enter your *Email ID*:", { parse_mode: "Markdown" });

        case "email":
            ctx.session.lead.email = text;
            ctx.session.step = "phone";
            return ctx.reply("📱 Enter your *Phone Number*:", { parse_mode: "Markdown" });

        case "phone":
            ctx.session.lead.phone = text;
            ctx.session.step = "service";
            return ctx.reply(
                "🛠 Select the *service* you need:",
                {
                    parse_mode: "Markdown",
                    reply_markup: {
                        keyboard: [
                            ["Website Development", "Mobile App Development"],
                            ["Branding", "Digital Marketing"],
                            ["UI/UX Designing", "Maintenance"],
                        ],
                        resize_keyboard: true
                    }
                }
            );

        case "service":
            ctx.session.lead.service = text;
            ctx.session.step = "budget";
            return ctx.reply("💰 What is your *Budget Range*?", {
                parse_mode: "Markdown",
            });

        case "budget":
            ctx.session.lead.budget = text;
            ctx.session.step = "description";
            return ctx.reply("📝 Please describe your *project requirements*:");

        case "description":
            ctx.session.lead.description = text;

            const lead = ctx.session.lead;

            // Summary message
            await ctx.reply(
                "🎉 *Thank You! Your lead details:*\n\n" +
                `👤 Name: ${lead.name}\n` +
                `📧 Email: ${lead.email}\n` +
                `📱 Phone: ${lead.phone}\n` +
                `🛠 Service: ${lead.service}\n` +
                `💰 Budget: ${lead.budget}\n` +
                `📝 Description: ${lead.description}\n\n` +
                "💾 *Saving your details in our CRM...*",
                { parse_mode: "Markdown" }
            );

           // Saving to Zoho CRM
try {
    const res = await createLeadInZoho(lead);

    await ctx.reply(
        "✅ *Your lead has been successfully saved in Zoho CRM!*",
        { parse_mode: "Markdown", ...mainMenu }
    );

    // Notify admin (optional)
    if (process.env.ADMIN_CHAT_ID) {
        await bot.telegram.sendMessage(
            process.env.ADMIN_CHAT_ID,
            `📢 *New Lead Saved in CRM*\n\n` +
            `👤 Name: ${lead.name}\n` +
            `📧 Email: ${lead.email}\n` +
            `📱 Phone: ${lead.phone}\n` +
            `🛠 Service: ${lead.service}\n` +
            `💰 Budget: ${lead.budget}`,
            { parse_mode: "Markdown" }
        );
    }

} catch (err) {
    console.error("❌ Zoho CRM Error:", err.response?.data || err);

    await ctx.reply(
        "⚠️ *There was an error saving your lead to Zoho CRM.*\n" +
        "Our team will review this manually.",
        { parse_mode: "Markdown", ...mainMenu }
    );
}
            ctx.session.step = null;
            break;
    }
});

// ----------- LAUNCH BOT -----------
bot.launch();
console.log("🤖 Assurax Lead Bot is running...");
