// script.js
const questionElement = document.getElementById("question");
const msgBox = document.createElement('div');

let min = 1;
let max = 12;
let retries = (max - min) ** 2;

if (retries > 100) {
    retries = 100;
}



function showTopMessage(text, bgcolor, textcolor) {
    // 1. Create the message container
    //const msgBox = document.createElement('div');
    msgBox.id = 'dynamic-message-top';
    msgBox.classList.add('msgbox');

    if (bgcolor) {
        msgBox.style.backgroundColor = bgcolor;
    } else {
        msgBox.style.backgroundColor = '#ffcc00'; // Eye-catching color
    }
    if (textcolor) {
        msgBox.style.color = textcolor;
    } else {
        msgBox.style.color = '#333333';
    }

    // 2. Add text and append to body
    //msgBox.innerText = text;
    msgBox.innerHTML = text;
    document.body.prepend(msgBox);

    // 3. Remove it after 30 seconds
    /*
    setTimeout(() => {
      msgBox.remove();
    }, 30000);
    */
}

const form = document.getElementById('form');
const input = document.getElementById('inp');
const keypad = document.getElementById('keypad');
const scoreElement = document.getElementById('score');
var num1 = num2 = correctAnswer = 0;
var goodanswers = [];
var score;


function fillContent() {

    input.value = '';

    let pnum1 = localStorage.getItem('num1');
    let pnum2 = localStorage.getItem('num2');
    let puserAnswer = localStorage.getItem('userAnswer');

    //console.log(`${pnum1} ${pnum2} ${puserAnswer}`);

    if (pnum1 && pnum2 && puserAnswer) {
        let pcorrectAnswer = parseInt(pnum1) * parseInt(pnum2);
        if (pcorrectAnswer == parseInt(puserAnswer)) {
            //showTopMessage('<p style="font-size: 28px;">CORRECT!  🙂</p>', 'green', 'white')
            //showTopMessage('<p style="font-size: 28px;">CORRECT!</p>', 'green', 'white')
            showTopMessage(`<p style="font-size: 20px;">CORRECT!</p>${pnum1} x ${pnum2} = ${pcorrectAnswer}`, 'green', 'white')
        } else {
            showTopMessage(`<p style="font-size: 20px;">${pnum1} x ${pnum2} = ${pcorrectAnswer}</p>`, 'red', 'white')
        }
    }

    localStorage.removeItem("num1");
    localStorage.removeItem("num2");
    localStorage.removeItem("userAnswer");








    let maxPlus = max + 1;
    goodanswers = [];
    for (let i = 0; i < maxPlus; i++) {
        goodanswers.push(new Array(maxPlus).fill(0));
    }

    goodanswersJson = localStorage.getItem('goodanswers');
    if (goodanswersJson) {

        goodanswers = JSON.parse(goodanswersJson);
        for (i = 0; i < goodanswers.length; i++) {
            console.log(goodanswers[i]);
        }
        if (goodanswers.length < maxPlus) {
            for (i = 0; i < goodanswers.length; i++) {
                goodanswers[i].push(...new Array(maxPlus - goodanswers.length).fill(0));
            }
            for (i = goodanswers.length; i < maxPlus; i++) {
                goodanswers.push(new Array(maxPlus).fill(0));
            }
        }
    }

    // find min
    let minGoodAnswers = 9999999999;
    for (i = min; i < maxPlus; i++) {
        for (j = min; j < maxPlus; j++) {
            if (goodanswers[i][j] < minGoodAnswers) {
                minGoodAnswers = goodanswers[i][j];
            }
        }
    }

    num1 = num2 = correctAnswer = 0;
    for (i = 0; i < retries; i++) {
        num1 = Math.floor(Math.random() * (maxPlus - min)) + min;
        num2 = Math.floor(Math.random() * (maxPlus - min)) + min;
        correctAnswer = num1 * num2;
        if (goodanswers[num1][num2] <= minGoodAnswers) break;
    }


    questionElement.innerText = `What is ${num1} Multiply by ${num2}?`;
    questionElement.innerText = `${num1} x ${num2} = ?`;

    score = Number(localStorage.getItem("score"));
    if (!score) {
        score = 0;
    }

    scoreElement.textContent = `score : ${score}`;
}

form.addEventListener('submit', function () {

    event.preventDefault();
    if (input.value.trim() === '') {
        return;
    }

    let userAnswer = +input.value;

    localStorage.setItem('num1', String(num1));
    localStorage.setItem('num2', String(num2));
    localStorage.setItem('userAnswer', String(userAnswer));

    if (correctAnswer === userAnswer) {
        score++;
        updateScore(1);
    }
    else {
        //score--;
        updateScore(-1);
    }
    input.focus();
    fillContent();
});

function updateScore(arg) {
    localStorage.setItem("score", String(score));
    goodanswers[num1][num2] += arg;
    localStorage.setItem('goodanswers', JSON.stringify(goodanswers));
}

const reset = document.getElementById('reset');
reset.addEventListener('click', () => {
    event.preventDefault();
    localStorage.removeItem("score");
    localStorage.removeItem("goodanswers");
    input.focus();
    //window.location.reload();
    fillContent();
});

const reload = document.getElementById('reload');
reload.addEventListener('click', () => {
    event.preventDefault();
    input.focus();
    //window.location.reload();
    fillContent();
});

fillContent();

// Clear Local Storage 
//localStorage.removeItem("score");


// 1. INSTANT VISUAL FEEDBACK (Fires at 0ms physical contact)
keypad.addEventListener('touchstart', function (event) {
    const btn = event.target.closest('button');
    if (!btn) return;

    // Instantly highlight the button
    btn.classList.add('is-pressed');
}, { passive: true });

// 2. REMOVE HIGHLIGHT ON RELEASE
keypad.addEventListener('touchend', function (event) {
    const btn = event.target.closest('button');
    if (btn) btn.classList.remove('is-pressed');
});

keypad.addEventListener('touchcancel', function (event) {
    const btn = event.target.closest('button');
    if (btn) btn.classList.remove('is-pressed');
});


keypad.addEventListener('pointerdown', function (event) {
    // Ignore clicks that aren't on dialpad buttons
    const btn = event.target.closest('button');
    if (!btn) return;

    // Prevent default to stop synthetic double click / zooming quirks
    event.preventDefault();

    const val = btn.dataset.val;

    if (val === 'clear') {
        input.value = '';
    } else if (val === 'backspace') {
        input.value = input.value.slice(0, -1);
    } else {
        input.value += val;
    }

    input.focus();
});