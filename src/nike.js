const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const fs = require("fs");

const dataFilePath = `${__dirname}/../data/log.json`;

const scrape = async () => {
	if (!fs.existsSync(dataFilePath)) {
		fs.writeFileSync(dataFilePath, "[]");
	}

	const browser = await puppeteer.launch({ headless: true });
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

		firstListing["link"] = firstListingLink;

		// check if this product is already sent
		const log = JSON.parse(fs.readFileSync(dataFilePath));

		if (log.includes(firstListingLink)) {
			await browser.close();
			return false;
		} else {
			log.push(firstListingLink);
			fs.writeFileSync(dataFilePath, JSON.stringify(log));
		}

		// if the first listing is a promotional video
		if (firstListingType == "video") {
			firstListing =
				jsonData["product"]["threads"]["data"]["items"][firstKey]["coverCard"];
			firstListing["link"] = firstListingLink;
			await browser.close();
			return {
				type: "video",
				data: firstListing,
			};
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

		firstListing["price"] = productPrice;

		await browser.close();

		return {
			type: "product",
			data: firstListing,
		};
	} catch (e) {
		console.log(e);
		browser.close();
		return false;
	}
};

module.exports = {
	scrape,
};
