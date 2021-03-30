const fs = require("fs");

// const str = fs.readFileSync("data.html", { encoding: "utf-8" });

// var part = str.substring(
// 	str.lastIndexOf("window.__PRELOADED_STATE__ =") + 29,
// 	str.lastIndexOf(";window.initilizeAppWithHandoffState")
// );

// fs.writeFileSync("test.json", part);

const data = require("./test.json");

const firstKey = Object.keys(data["product"]["threads"]["data"]["items"])[2];

let firstListing =
	data["product"]["threads"]["data"]["items"][firstKey]["cards"][0];

if (firstListing.subType == "video") {
	firstListing =
		data["product"]["threads"]["data"]["items"][firstKey]["coverCard"];
}

fs.writeFileSync("items.json", JSON.stringify(firstListing));
