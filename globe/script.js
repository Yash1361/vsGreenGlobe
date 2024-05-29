document.getElementById('signin').onclick = function() {
    document.getElementById('signInModal').style.display = 'block';
};

document.getElementById('signup').onclick = function() {
    document.getElementById('signUpModal').style.display = 'block';
};

document.querySelectorAll('.close').forEach(closeButton => {
    closeButton.onclick = function() {
        closeButton.parentElement.parentElement.style.display = 'none';
    };
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

document.getElementById('signin-submit').onclick = async function() {
    const username = document.getElementById('signin-username').value;
    const password = document.getElementById('signin-password').value;

    const response = await fetch('http://localhost:3000/signin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        window.location.href = 'Kinhasa.html?username=' + data.username;
    } else {
        alert('Invalid credentials');
    }
};

document.getElementById('signup-submit').onclick = async function() {
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (username.length < 6) {
        alert('Username must be at least 6 characters long');
        return;
    }

    if (!validateEmail(email)) {
        alert('Invalid email address');
        return;
    }

    const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    });

    if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', data.username);
        window.location.href = 'Kinhasa.html?username=' + data.username;
    } else {
        alert('Username or email already exists');
    }
};


if (!Detector.webgl) {
    Detector.addGetWebGLMessage();
} else {
    var years = ['1990', '1995', '2000'];
    var container = document.getElementById('container');
    var globe = new DAT.Globe(container);

    console.log(globe);
    var i, tweens = [];

    var settime = function (globe, t) {
        return function () {
            new TWEEN.Tween(globe).to({ time: t / years.length }, 500).easing(TWEEN.Easing.Cubic.EaseOut).start();
            var y = document.getElementById('year' + years[t]);
            if (y.getAttribute('class') === 'year active') {
                return;
            }
            var yy = document.getElementsByClassName('year');
            for (i = 0; i < yy.length; i++) {
                yy[i].setAttribute('class', 'year');
            }
            y.setAttribute('class', 'year active');
        };
    };

    for (var i = 0; i < years.length; i++) {
        var y = document.getElementById('year' + years[i]);
        y.addEventListener('mouseover', settime(globe, i), false);
    }

    var xhr;
    TWEEN.start();

    xhr = new XMLHttpRequest();
    xhr.open('GET', '/globe/population909500.json', true);
    xhr.onreadystatechange = function (e) {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                var data = JSON.parse(xhr.responseText);
                window.data = data;
                for (i = 0; i < data.length; i++) {
                    globe.addData(data[i][1], { format: 'magnitude', name: data[i][0], animated: true });
                }
                globe.createPoints();
                settime(globe, 0)();
                globe.animate();
                document.body.style.backgroundImage = 'none'; // remove loading
                startAutoTransition();
            }
        }
    };
    xhr.send(null);

    function startAutoTransition() {
        let currentIndex = 0;
        setInterval(function () {
            currentIndex = (currentIndex + 1) % years.length;
            settime(globe, currentIndex)();
        }, 1000); // Change the interval time as needed
    }

    // Scroll down function for the arrow button
    document.querySelector('.arrow').addEventListener('click', function () {
        document.getElementById('page1').style.transform = 'translateY(-100%)';
        document.getElementById('page2').style.transform = 'translateY(0)';
    });

    window.addEventListener('wheel', function (event) {
        if (event.deltaY > 0) {
            document.getElementById('page1').style.transform = 'translateY(-100%)';
            document.getElementById('page2').style.transform = 'translateY(0)';
            var text = document.getElementById('fadeInText');
            var text2 = document.getElementById('fadeInText2');
            var text3 = document.getElementById('fadeInText3');
            var text4 = document.getElementById('fadeInText4');
            var text5 = document.getElementById('fadeInText5');
            var signin = document.getElementById('signin');
            var signup = document.getElementById('signup');

            // Debug log
            console.log('Page 2 should now be visible');

            // Trigger the fade-in effect
            setTimeout(function () {
                console.log('Fading in text1');
                text.style.opacity = 1;
            }, 500); // Delay the fade-in to match the page transition
            setTimeout(function () {
                console.log('Fading in text2');
                text2.style.opacity = 1;
            }, 2000);
            setTimeout(function () {
                console.log('Fading in text3');
                text3.style.opacity = 1;
            }, 4000);
            setTimeout(function () {
                console.log('Fading in text4');
                text4.style.opacity = 1;
            }, 5000);
            setTimeout(function () {
                console.log('Fading in text5');
                text5.style.opacity = 1;
            }, 6000);
            setTimeout(function () {
                console.log('Fading in text6');
                signin.style.opacity = 1;
            }, 7000);
            setTimeout(function () {
                console.log('Fading in text7');
                signup.style.opacity = 1;
            }, 7000);

        } else if (event.deltaY < 0) {
            document.getElementById('page1').style.transform = 'translateY(0)';
            document.getElementById('page2').style.transform = 'translateY(100%)';
        }
    });

    window.onload = function () {
        // Wait for everything to load
        setTimeout(function () {
            var welcomeMessage = document.getElementById('welcomeMessage');

            // Fade in the welcome message
            welcomeMessage.style.opacity = 1; // Start fading in
            console.log("hi");
            setTimeout(function () {
                // After showing the message, start fading out
                welcomeMessage.style.opacity = 0; // Fade out after display

                // Additional timeout to set display to none after the fade transition completes
                setTimeout(function () {
                    welcomeMessage.style.display = 'none'; // This removes it from the document flow entirely
                }, 2000); // This should match the duration of the opacity transition
            }, 4000); // Display duration in milliseconds (2 seconds shown)
        }, 2000); // Delay before starting the fade in
    };
    document.addEventListener('scroll', function () {
        var scrollPercentage = (window.scrollY / window.innerHeight) * 100;
        var smoke = document.getElementById('smokeEffect');
        smoke.style.opacity = 1 - (scrollPercentage / 100);
    });

    //<script>
    document.getElementById('signin').onclick = function () {
        document.getElementById('mainContent').classList.add('blurred');
        document.getElementById('signInModal').style.display = 'block';
    };

    document.getElementById('signup').onclick = function () {
        document.getElementById('mainContent').classList.add('blurred');
        document.getElementById('signUpModal').style.display = 'block';
    };

    var closeButtons = document.getElementsByClassName('close');
    for (var i = 0; i < closeButtons.length; i++) {
        closeButtons[i].onclick = function () {
            var modals = document.getElementsByClassName('modal');
            for (var j = 0; j < modals.length; j++) {
                modals[j].style.display = 'none';
            }
            document.getElementById('mainContent').classList.remove('blurred');
        }
    };
}
