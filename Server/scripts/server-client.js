let startTime;

function startTimer() {
    let inputText = document.getElementById('inputField').value;
    if(inputText === undefined || inputText === null || inputText === '')
    {
        inputText = 'Anonym';
    }

    window.location.href = 'timer.html?name=' + encodeURIComponent(inputText);
}

window.onload = function() {
    if (window.location.pathname.endsWith('timer.html')) {
        startTime = performance.now();
    } else if (window.location.pathname.endsWith('testAr.html')) {
        displayData();
    }
};

function stopTimer() {
    if (startTime) {
        const elapsedTime = performance.now() - startTime;
        const name = getParameterByName('name');
        window.location.href = 'testAr.html?name=' + encodeURIComponent(name) + '&time=' + encodeURIComponent(elapsedTime);
    }
}

function getParameterByName(name) {
    name = name.replace(/[\[\]]/g, '\\$&');
    const url = window.location.href;
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)');
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function displayData() {
    const name = getParameterByName('name');
    if (name) {
        document.getElementById('outputSpanName').textContent = name;
    }
    const time = getParameterByName('time');
    if (time) {
        document.getElementById('outputSpanTime').textContent = ((parseInt(time) / 1000).toFixed(2));
    }
}

class Score {
    constructor(name, time) {
        this.name = name;
        this.time = time;
    }
    get Player() {
        return this.name;
    }
    get Time() {
        return this.time;
    }
}

async function getHighScoreFromBackend() {
    const response = await fetch("http://localhost:3000/times");
    if (!response.ok) {
        console.log("Could not communicate with server");
        return;
    }
    const payload = await response.json();
    const first = payload[0];
    return new Score(first.name, first.time);
}

if (window.location.pathname.endsWith('test.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        await initTest();
    });
}

if (window.location.pathname.endsWith('testAr.html')) {
    document.addEventListener('DOMContentLoaded', async () => {
        await initAR();
    });
}

async function initTest() {
    await printHighScore();
}

async function initAR() {
    await displayData();
    const newName = document.getElementById('outputSpanName').innerText;

    let newTime = parseFloat(document.getElementById('outputSpanTime').textContent);
    newTime = newTime * 100;
    newTime = Math.ceil(newTime);
    const test = new Score(newName, newTime);
    await checkIfNewHighScore(test);



}

async function printHighScore() {
    const highScore = await getHighScoreFromBackend();
    const output = document.getElementById('highscore');
    if (highScore.Player !== undefined && highScore.Player !== null && highScore.Player !== '') {
        output.innerText = `${highScore.Player}: ${((highScore.Time).toFixed(2)) / 100}`;
    }
    else {
        output.textContent = 'No high score found';
    }
}

async function checkIfNewHighScore(score) {
    const response = await getHighScoreFromBackend();
    if (response && response.Time > score.Time) {
        if (!score.Player) {
            score.Player = 'Anonymous';
        }
        if (score.Time === 0){
            score.Time = 9999999;
        }
        const post = { id: 1, name: score.Player, time: score.Time };
        const response2 = await fetch('http://localhost:3000/times/1', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(post)
        });
        return true;
    }
    return false;
}

if (typeof window !== 'undefined' && window.location.pathname.endsWith('testAr.html')) {
    document.addEventListener('DOMContentLoaded', (event) => {
        displayData();
    });
}
