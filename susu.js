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

// Messenger Chat plugin Code

window.fbAsyncInit = function () {
	FB.init({
		xfbml: true,
		version: "v10.0",
	});
};

(function (d, s, id) {
	var js,
		fjs = d.getElementsByTagName(s)[0];
	if (d.getElementById(id)) return;
	js = d.createElement(s);
	js.id = id;
	js.src = "https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js";
	fjs.parentNode.insertBefore(js, fjs);
})(document, "script", "facebook-jssdk");

// google map 

function initMap() {
	// The location of Uluru
	const deTravelcafé = { lat: 10.113644933332194, lng: 76.3514360090288 };
	// The map, centered at Uluru
	const map = new google.maps.Map(document.getElementById("map"), {
		zoom: 16,
		center: deTravelcafé,
        styles: [
            {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [
                    {
                        "color": "#444444"
                    }
                ]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [
                    {
                        "color": "#f2f2f2"
                    }
                ]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [
                    {
                        "saturation": -100
                    },
                    {
                        "lightness": 45
                    }
                ]
            },
            {
                "featureType": "road.highway",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "simplified"
                    }
                ]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels.icon",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [
                    {
                        "visibility": "off"
                    }
                ]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [
                    {
                        "color": "#83ec46"
                    },
                    {
                        "visibility": "on"
                    }
                ]
            }
        ]
	});
	// The marker, positioned at Uluru
	const marker = new google.maps.Marker({
		position: deTravelcafé,
		map: map,
		//icon: "/assets/images/dmd.gif"
	});
}

// susu messenger code


// <!-- Messenger Chat Plugin Code -->
//     <div id="fb-root"></div>

//     <!-- Your Chat Plugin code -->
//     <div id="fb-customer-chat" class="fb-customerchat">
//     </div>

//     <script>
//       var chatbox = document.getElementById('fb-customer-chat');
//       chatbox.setAttribute("page_id", "284634392014010");
//       chatbox.setAttribute("attribution", "biz_inbox");
//     </script>

//     <!-- Your SDK code -->
//     <script>
//       window.fbAsyncInit = function() {
//         FB.init({
//           xfbml            : true,
//           version          : 'v15.0'
//         });
//       };

//       (function(d, s, id) {
//         var js, fjs = d.getElementsByTagName(s)[0];
//         if (d.getElementById(id)) return;
//         js = d.createElement(s); js.id = id;
//         js.src = 'https://connect.facebook.net/en_US/sdk/xfbml.customerchat.js';
//         fjs.parentNode.insertBefore(js, fjs);
//       }(document, 'script', 'facebook-jssdk'));
//     </script>