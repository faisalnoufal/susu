document.body.onload = webadder;
src = "//ajax.googleapis.com/ajax/libs/webfont/1.4.7/webfont.js"

// WebFont.load({
// 	google: {
// 		families: ["Raleway:100,400,700,800,900"],
// 	},
// });

WebFontConfig = {
	google: {
		families: ['Raleway:100,400,700,800,900']
	}
};

(function (d) {
	var wf = d.createElement('script'), s = d.scripts[0];
	wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1.6.26/webfont.js';
	wf.async = true;
	s.parentNode.insertBefore(wf, s);
})(document);

function webadder() {
	let atag = document.createElement("a");
	let link = document.createTextNode("webAdder");

	atag.appendChild(link);
	atag.href = "https://webadder.com";
	atag.target = "_blank";
	atag.title = "Design, Develop and Deploy";
	atag.style.cssText =
		"z-index:100;color:white;position:fixed;text-decoration:none;font-family: Raleway, sans-serif;;font-size:10px;bottom:0;right:0;background-image: linear-gradient( to right, #9966ff 0%, #3399ff 51%, #669999 100% );border-radius:3px 0 0 0;padding:0 2px";
	document.body.appendChild(atag);

	atag.onmouseover = function () {
		atag.style.color = "black";
	};
	atag.onmouseout = function () {
		atag.style.color = "white";
	};
}


