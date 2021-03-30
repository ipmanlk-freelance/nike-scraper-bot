const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fetch = require("node-fetch");
const moment = require("moment-timezone");

const scrape = async (username) => {
	const browser = await puppeteer.launch({ headless: true });
	moment().format("MMMM Do YYYY, h:mm:ss a");
	try {
		const page = await browser.newPage();

		let response = await page.goto("https://www.nike.com/launch", {
			waitUntil: "networkidle0",
		});

		// extract response html
		const responseText = await response.text();

		// extract json data payload from the page
		const jsonData = JSON.parse(
			responseText.substring(
				responseText.lastIndexOf("window.__PRELOADED_STATE__ =") + 29,
				responseText.lastIndexOf(";window.initilizeAppWithHandoffState")
			)
		);

		// find first item listed
		const firstKey = Object.keys(
			jsonData["product"]["threads"]["data"]["items"]
		)[0];

		let firstListing =
			jsonData["product"]["threads"]["data"]["items"][firstKey]["cards"][0];

		const firstListingType = firstListing.subType;

		// find the url of the first item
		let $ = cheerio.load(responseText);

		const firstListingLink =
			"https://www.nike.com" +
			$(".product-card").first().find("a").first().attr("href");

		// if the first listing is a promotional video
		if (firstListingType == "video") {
			jsonData["product"]["threads"]["data"]["items"][firstKey]["coverCard"];

			//* Should be sent to webhook without navigating for more data
			console.log(firstListingLink);
			await browser.close();
			return;
		}

		// get the first product info (should be ignored for non shoes)
		response = await page.goto(firstListingLink, {
			waitUntil: "networkidle0",
		});

		$ = cheerio.load(await response.text());

		const productPrice = $(".product-info")
			.find("div.headline-5")
			.first()
			.text();

		var discordData = {
			username: "Nike Alert",
			avatar_url: "https://i.imgur.com/MIFoYMK.png",
			embeds: [
				{
					title: `${firstListing.title} ${firstListing.subtitle}`,
					color: 65280,
					url: firstListingLink,
					image: {
						url: firstListing.cards[0].defaultURL,
					},
					fields: [
						{
							name: "Price",
							value: productPrice,
							inline: true,
						},
						{
							name: "Release Date",
							value:
								moment().tz("America/New_York").format("MM/DD/YYYY, h:mm A") +
								" ET",
							inline: true,
						},
					],
				},
			],
		};

		fetch(
			"https://discord.com/api/webhooks/826319039194202122/dDev-CRI77eG_dh8_k1fk6oSCN0jkvXsvy78ch7PTgNh8DYqT_KagvEg3O8XqsTtqO5p",
			{
				method: "POST",
				headers: {
					"Content-type": "application/json",
				},
				body: JSON.stringify(discordData),
			}
		).then((res) => {
			console.log(res);
		});

		await browser.close();
	} catch (e) {
		console.log(e);
		browser.close();
	}
	// return data;
};

scrape();
