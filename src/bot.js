const fetch = require("node-fetch");
const moment = require("moment-timezone");
const { scrape } = require("./nike");
const config = require("../setup/config.json");

const init = () => {
	scrape()
		.then((listing) => {
			// ignore if listing is false
			if (!listing) return;

			// create appropriate payload for the webhook
			let discordData;
			if (listing.type == "video") {
				discordData = {
					username: config.EMBED.USERNAME,
					avatar_url: config.EMBED.AVATAR_URL,
					embeds: [
						{
							title: listing.data.altText,
							color: 65280,
							url: listing.data.link,
							image: {
								url: listing.data.squarishURL,
							},
							footer: {
								text: `Time Item Found: ${
									moment().tz("America/New_York").format("MM/DD/YYYY, h:mm A") +
									" ET"
								}`,
							},
						},
					],
				};
			} else {
				discordData = {
					username: config.EMBED.USERNAME,
					avatar_url: config.EMBED.AVATAR_URL,
					embeds: [
						{
							title: `${listing.data.title} ${listing.data.subtitle}`,
							color: 65280,
							url: listing.data.link,
							image: {
								url: listing.data.cards[0].defaultURL,
							},
							fields: [
								{
									name: "Price",
									value: listing.data.price,
									inline: true,
								},
							],
							footer: {
								text: `Time Item Found: ${
									moment().tz("America/New_York").format("MM/DD/YYYY, h:mm A") +
									" ET"
								}`,
							},
						},
					],
				};
			}

			// go through each webhook and send the payload
			config.WEBHOOKS.forEach((webhook) => {
				fetch(webhook, {
					method: "POST",
					headers: {
						"Content-type": "application/json",
					},
					body: JSON.stringify(discordData),
				}).catch((e) => {
					console.log(`Discord API error: ${e}`);
				});
			});
		})
		.catch((e) => {
			console.log(e);
		});
};

setInterval(() => {
	init();
	console.log("Checking for new products");
}, config.CHECK_DELAY * 60000);
